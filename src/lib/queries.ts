import { and, desc, eq, ilike, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeSearch } from "@/lib/translit";

const { listings, shops } = schema;

export type FeedFilters = {
  q?: string;
  category?: string;
  size?: string;
  maxPrice?: number;
  shopId?: string;
  includeSold?: boolean;
  limit?: number;
};

/** Public feed: approved listings from active shops, newest first. */
export async function getFeed(f: FeedFilters = {}) {
  const where = [eq(listings.review, "approved"), eq(shops.status, "active")];
  if (!f.includeSold) where.push(sql`${listings.status} in ('available','reserved')`);
  else where.push(sql`${listings.status} <> 'hidden'`);
  if (f.shopId) where.push(eq(listings.shopId, f.shopId));
  if (f.category) where.push(eq(listings.category, f.category));
  if (f.size) where.push(ilike(listings.size, f.size));
  if (f.maxPrice) where.push(lte(listings.priceGel, String(f.maxPrice)));
  if (f.q) {
    for (const term of normalizeSearch(f.q).split(" ").filter(Boolean)) {
      where.push(ilike(listings.searchText, `%${term}%`));
    }
  }

  return db()
    .select({ listing: listings, shop: { slug: shops.slug, name: shops.name } })
    .from(listings)
    .innerJoin(shops, eq(listings.shopId, shops.id))
    .where(and(...where))
    .orderBy(desc(listings.postedAt))
    .limit(f.limit ?? 60);
}

export async function firstImages(listingIds: string[]) {
  if (!listingIds.length) return new Map<string, string>();
  const rows = await db().query.listingImages.findMany({
    where: (t, { inArray, and, eq }) => and(inArray(t.listingId, listingIds), eq(t.position, 0)),
  });
  return new Map(rows.map((r) => [r.listingId, r.storageKey]));
}
