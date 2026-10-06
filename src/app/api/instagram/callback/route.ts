import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { env } from "@/env";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, getProfile } from "@/lib/instagram/client";
import { enqueueSync } from "@/lib/queue";
import { setSession } from "@/lib/session";

const toSlug = (u: string) =>
  u.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "shop";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get("ig_state")?.value;
  jar.delete("ig_state");
  if (!code || !state || state !== expected) {
    return NextResponse.redirect(new URL("/dashboard?error=state", env().APP_URL));
  }

  const { accessToken, expiresAt } = await exchangeCode(code);
  const profile = await getProfile(accessToken);
  const igUserId = String(profile.user_id);

  const existing = await db().query.instagramAccounts.findFirst({
    where: eq(schema.instagramAccounts.igUserId, igUserId),
  });

  let shopId: string;
  let accountId: string;
  if (existing) {
    shopId = existing.shopId;
    accountId = existing.id;
    await db()
      .update(schema.instagramAccounts)
      .set({ username: profile.username, accessTokenEnc: encrypt(accessToken), tokenExpiresAt: expiresAt })
      .where(eq(schema.instagramAccounts.id, existing.id));
  } else {
    [{ shopId, accountId }] = await db().transaction(async (tx) => {
      const [shop] = await tx
        .insert(schema.shops)
        .values({ slug: toSlug(profile.username), name: profile.name || profile.username, bio: profile.biography })
        .returning();
      const [acc] = await tx
        .insert(schema.instagramAccounts)
        .values({
          shopId: shop.id,
          igUserId,
          username: profile.username,
          accessTokenEnc: encrypt(accessToken),
          tokenExpiresAt: expiresAt,
        })
        .returning();
      return [{ shopId: shop.id, accountId: acc.id }];
    });
  }

  await enqueueSync(accountId, true);
  await setSession(shopId);
  return NextResponse.redirect(new URL("/dashboard", env().APP_URL));
}
