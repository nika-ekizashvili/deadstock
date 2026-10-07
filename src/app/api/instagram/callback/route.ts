import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { env } from "@/env";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, getProfile } from "@/lib/instagram/client";
import { enqueueSync } from "@/lib/queue";
import { setSession } from "@/lib/session";
import { RESERVED } from "@/proxy";

const toSlug = (u: string) =>
  u.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "shop";

/** Slug from the IG username, never a reserved subdomain and never one another shop has: "x", "x-2", "x-3"… */
async function freeSlug(username: string) {
  const base = toSlug(username);
  for (let n = 1; ; n++) {
    const slug = n === 1 && !RESERVED.has(base) ? base : `${base}-${n}`;
    if (RESERVED.has(slug)) continue;
    const taken = await db().query.shops.findFirst({ where: eq(schema.shops.slug, slug), columns: { id: true } });
    if (!taken) return slug;
  }
}

/** Error codes read by /sell: "personal" shows the Business/Creator box, anything else a generic failure. */
type SignInError = "state" | "denied" | "personal" | "failed";
const fail = (error: SignInError) =>
  NextResponse.redirect(new URL(`/sell?error=${error}`, env().APP_URL));

/** Instagram Login only accepts professional accounts; personal ones surface as these API errors. */
const PERSONAL_RE = /personal|not (a )?(business|professional|creator)|professional account|IGApiException.*account type/i;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const code = q.get("code");
  const state = q.get("state");
  const jar = await cookies();
  const expected = jar.get("ig_state")?.value;
  jar.delete("ig_state");
  // User cancelled on Instagram (error=access_denied&error_reason=user_denied)
  if (q.get("error")) return fail(q.get("error") === "access_denied" ? "denied" : "failed");
  if (!code || !state || state !== expected) return fail("state");

  let accessToken: string, expiresAt: Date;
  let profile: Awaited<ReturnType<typeof getProfile>> & { account_type?: string };
  try {
    ({ accessToken, expiresAt } = await exchangeCode(code));
    profile = await getProfile(accessToken);
  } catch (err) {
    console.error("[instagram/callback]", err);
    return fail(err instanceof Error && PERSONAL_RE.test(err.message) ? "personal" : "failed");
  }
  // Only returned when getProfile asks for `account_type` (BUSINESS | MEDIA_CREATOR | PERSONAL).
  if (profile.account_type && !["BUSINESS", "MEDIA_CREATOR"].includes(profile.account_type)) {
    return fail("personal");
  }
  const igUserId = String(profile.user_id);

  let shopId: string;
  try {
    shopId = await saveAccount(igUserId, profile, accessToken, expiresAt);
  } catch (err) {
    console.error("[instagram/callback] save", err);
    return fail("failed");
  }
  await setSession(shopId);
  return NextResponse.redirect(new URL("/dash", env().APP_URL));
}

/** Upsert the shop + Instagram account and queue the first full sync. Returns the shop id. */
async function saveAccount(
  igUserId: string,
  profile: Awaited<ReturnType<typeof getProfile>>,
  accessToken: string,
  expiresAt: Date,
): Promise<string> {
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
    const slug = await freeSlug(profile.username);
    [{ shopId, accountId }] = await db().transaction(async (tx) => {
      const [shop] = await tx
        .insert(schema.shops)
        .values({ slug, name: profile.name || profile.username, bio: profile.biography })
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
  return shopId;
}
