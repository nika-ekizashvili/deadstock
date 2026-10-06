/**
 * Integration test against a real Postgres (DATABASE_URL). Instagram and S3 are mocked.
 * Run: pnpm test:int
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { IgMedia } from "@/lib/instagram/client";

let media: IgMedia[] = [];
vi.mock("@/lib/storage", () => ({
  mirrorImage: vi.fn(async (_u: string, key: string) => key),
  publicUrl: (k: string) => k,
}));
vi.mock("@/lib/instagram/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/instagram/client")>()),
  refreshToken: vi.fn(),
  listMedia: async function* () {
    yield* media;
  },
}));

const { db, schema } = await import("@/db");
const { encrypt } = await import("@/lib/crypto");
const { syncAccount } = await import("./sync");

const post = (id: string, caption: string): IgMedia => ({
  id,
  caption,
  media_type: "IMAGE",
  media_url: `https://cdn/${id}.jpg`,
  permalink: `https://instagram.com/p/${id}`,
  timestamp: new Date().toISOString(),
});

let accountId = "";
let shopId = "";

beforeAll(async () => {
  const [shop] = await db()
    .insert(schema.shops)
    .values({ slug: `test-${Date.now()}`, name: "Test" })
    .returning();
  shopId = shop.id;
  const [acc] = await db()
    .insert(schema.instagramAccounts)
    .values({
      shopId,
      igUserId: `ig-${Date.now()}`,
      username: "test",
      accessTokenEnc: encrypt("tok"),
      tokenExpiresAt: new Date(Date.now() + 50 * 86400_000),
    })
    .returning();
  accountId = acc.id;
});

afterAll(async () => {
  await db().delete(schema.shops).where(eq(schema.shops.id, shopId));
});

const byMedia = async (id: string) =>
  db().query.listings.findFirst({ where: eq(schema.listings.igMediaId, id) });

describe("syncAccount", () => {
  it("imports new posts as pending listings with images", async () => {
    media = [
      post(`a-${shopId}`, "Nike hoodie\nSize M\nPrice: 60"),
      post(`b-${shopId}`, "Zara coat\nSize S\nPrice: 80"),
    ];
    const stats = await syncAccount(accountId, false);
    expect(stats.created).toBe(2);
    const a = await byMedia(`a-${shopId}`);
    expect(a).toMatchObject({ title: "Nike hoodie", priceGel: "60.00", review: "pending", status: "available" });
    const imgs = await db().query.listingImages.findMany({
      where: eq(schema.listingImages.listingId, a!.id),
    });
    expect(imgs).toHaveLength(1);
    const shop = await db().query.shops.findFirst({ where: eq(schema.shops.id, shopId) });
    expect(shop?.status).toBe("active");
  });

  it("marks a post sold when its caption is edited to SOLD", async () => {
    media = [
      post(`a-${shopId}`, "Nike hoodie\nSize M\nPrice: 60\nSOLD"),
      post(`b-${shopId}`, "Zara coat\nSize S\nPrice: 80"),
    ];
    const stats = await syncAccount(accountId, false);
    expect(stats).toMatchObject({ created: 0, updated: 1, markedSold: 1 });
    expect((await byMedia(`a-${shopId}`))?.status).toBe("sold");
  });

  it("full sync marks deleted posts sold", async () => {
    media = [post(`a-${shopId}`, "Nike hoodie\nSize M\nPrice: 60\nSOLD")];
    const stats = await syncAccount(accountId, true);
    expect(stats.markedSold).toBe(1);
    expect((await byMedia(`b-${shopId}`))?.status).toBe("sold");
  });

  it("respects a manual override from the shop", async () => {
    const b = await byMedia(`b-${shopId}`);
    await db()
      .update(schema.listings)
      .set({ status: "available", manualOverride: true })
      .where(eq(schema.listings.id, b!.id));
    media = [post(`a-${shopId}`, "Nike hoodie\nSize M\nPrice: 60\nSOLD")];
    await syncAccount(accountId, true);
    expect((await byMedia(`b-${shopId}`))?.status).toBe("available");
  });
});
