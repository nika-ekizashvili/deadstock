import { and, eq, inArray, lt, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt, encrypt, sha256 } from "@/lib/crypto";
import { imageUrls, listMedia, refreshToken, type IgMedia } from "@/lib/instagram/client";
import { parseCaption } from "@/lib/parse/caption";
import { mirrorImage } from "@/lib/storage";
import { buildSearchText } from "@/lib/translit";

const { instagramAccounts, listings, listingImages, syncRuns, shops } = schema;
const REFRESH_BEFORE_MS = 7 * 24 * 3600 * 1000;

async function validToken(account: typeof instagramAccounts.$inferSelect) {
  let token = decrypt(account.accessTokenEnc);
  if (account.tokenExpiresAt.getTime() - Date.now() < REFRESH_BEFORE_MS) {
    const fresh = await refreshToken(token);
    token = fresh.accessToken;
    await db()
      .update(instagramAccounts)
      .set({ accessTokenEnc: encrypt(token), tokenExpiresAt: fresh.expiresAt })
      .where(eq(instagramAccounts.id, account.id));
  }
  return token;
}

function fieldsFrom(media: IgMedia, shopName: string) {
  const p = parseCaption(media.caption);
  return {
    caption: media.caption ?? null,
    captionHash: sha256(media.caption ?? ""),
    title: p.title,
    priceGel: p.priceGel?.toString() ?? null,
    size: p.size,
    brand: p.brand,
    category: p.category,
    condition: p.condition,
    parsedStatus: p.status,
    searchText: buildSearchText([p.title, p.brand, p.category, p.size, media.caption, shopName]),
  };
}

/** Import new posts, re-parse edited captions (SOLD/RESERVED), mark deleted posts sold. */
export async function syncAccount(accountId: string, full: boolean) {
  const account = await db().query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.id, accountId),
  });
  if (!account) throw new Error(`account ${accountId} not found`);
  const shop = (await db().query.shops.findFirst({ where: eq(shops.id, account.shopId) }))!;

  const [run] = await db().insert(syncRuns).values({ accountId, full }).returning();
  const stats = { created: 0, updated: 0, markedSold: 0 };
  const syncStart = new Date();

  try {
    const token = await validToken(account);

    for await (const media of listMedia(token, full ? Infinity : 2)) {
      const existing = await db().query.listings.findFirst({
        where: eq(listings.igMediaId, media.id),
      });
      const f = fieldsFrom(media, shop.name);

      if (!existing) {
        const [row] = await db()
          .insert(listings)
          .values({
            shopId: account.shopId,
            igMediaId: media.id,
            permalink: media.permalink,
            caption: f.caption,
            captionHash: f.captionHash,
            title: f.title,
            priceGel: f.priceGel,
            size: f.size,
            brand: f.brand,
            category: f.category,
            condition: f.condition,
            status: f.parsedStatus,
            soldAt: f.parsedStatus === "sold" ? new Date() : null,
            review: account.autoPublish ? "approved" : "pending",
            searchText: f.searchText,
            postedAt: new Date(media.timestamp),
            lastSeenAt: syncStart,
          })
          .returning({ id: listings.id });

        const imgs = imageUrls(media);
        for (const [i, img] of imgs.entries()) {
          const key = await mirrorImage(img.url, `shops/${account.shopId}/${media.id}/${i}.jpg`);
          await db().insert(listingImages).values({
            listingId: row.id,
            position: i,
            igMediaId: img.id,
            storageKey: key,
          });
        }
        stats.created++;
        continue;
      }

      const captionChanged = existing.captionHash !== f.captionHash;
      const nextStatus =
        existing.manualOverride || !captionChanged ? existing.status : f.parsedStatus;

      await db()
        .update(listings)
        .set({
          lastSeenAt: syncStart,
          ...(captionChanged && {
            caption: f.caption,
            captionHash: f.captionHash,
            title: f.title,
            priceGel: f.priceGel,
            size: f.size,
            brand: f.brand,
            category: f.category,
            condition: f.condition,
            searchText: f.searchText,
          }),
          status: nextStatus,
          soldAt: nextStatus === "sold" ? (existing.soldAt ?? new Date()) : null,
        })
        .where(eq(listings.id, existing.id));
      if (captionChanged) stats.updated++;
      if (nextStatus === "sold" && existing.status !== "sold") stats.markedSold++;
    }

    // Full sync sees every post: anything not seen was deleted/archived → sold.
    if (full) {
      const gone = await db()
        .update(listings)
        .set({ status: "sold", soldAt: new Date() })
        .where(
          and(
            eq(listings.shopId, account.shopId),
            lt(listings.lastSeenAt, syncStart),
            inArray(listings.status, ["available", "reserved"]),
            eq(listings.manualOverride, false),
          ),
        )
        .returning({ id: listings.id });
      stats.markedSold += gone.length;
    }

    await db()
      .update(instagramAccounts)
      .set({ lastSyncedAt: new Date(), ...(full && { lastFullSyncAt: new Date() }) })
      .where(eq(instagramAccounts.id, accountId));
    await db()
      .update(syncRuns)
      .set({ finishedAt: new Date(), ...stats })
      .where(eq(syncRuns.id, run.id));
    if (shop.status === "pending") {
      await db().update(shops).set({ status: "active" }).where(and(eq(shops.id, shop.id), ne(shops.status, "paused")));
    }
    return stats;
  } catch (err) {
    await db()
      .update(syncRuns)
      .set({ finishedAt: new Date(), ...stats, error: String(err) })
      .where(eq(syncRuns.id, run.id));
    throw err;
  }
}
