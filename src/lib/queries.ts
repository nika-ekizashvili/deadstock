import { and, desc, eq, ilike, inArray, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { displayTitle, shopTone } from "@/lib/catalog";
import { publicUrl } from "@/lib/storage";
import { normalizeSearch } from "@/lib/translit";

const { listings, shops } = schema;

export type FeedFilters = {
  q?: string;
  category?: string;
  size?: string;
  maxPrice?: number;
  shopId?: string;
  includeSold?: boolean;
  ids?: string[];
  limit?: number;
};

/** Everything a listing card needs, already resolved for display. */
export type CardItem = {
  id: string;
  title: string;
  titleFallback: boolean;
  priceGel: string | null;
  size: string | null;
  status: "available" | "reserved" | "sold" | "hidden";
  isVideo: boolean;
  imageUrl: string | null;
  postedAt: Date;
  shop: { slug: string; name: string; avatarUrl: string | null; tone: string };
};

/** Public feed: approved listings from active shops, newest first. */
export async function getFeed(f: FeedFilters = {}) {
  const where = [eq(listings.review, "approved"), eq(shops.status, "active")];
  if (!f.includeSold) where.push(sql`${listings.status} in ('available','reserved')`);
  else where.push(sql`${listings.status} <> 'hidden'`);
  if (f.shopId) where.push(eq(listings.shopId, f.shopId));
  if (f.ids) where.push(f.ids.length ? inArray(listings.id, f.ids) : sql`false`);
  if (f.category) where.push(eq(listings.category, f.category));
  if (f.size) {
    // Whole-size match: "S" matches "S" and "M / S", not "XS".
    const esc = f.size.replace(/[^A-Za-z0-9]/g, "");
    if (esc) where.push(sql`${listings.size} ~* ${`(^|[^[:alnum:]])${esc}([^[:alnum:]]|$)`}`);
  }
  if (f.maxPrice) where.push(lte(listings.priceGel, String(f.maxPrice)));
  if (f.q) {
    for (const term of normalizeSearch(f.q).split(" ").filter(Boolean)) {
      where.push(ilike(listings.searchText, `%${term}%`));
    }
  }

  return db()
    .select({
      listing: listings,
      shop: { slug: shops.slug, name: shops.name, avatarKey: shops.avatarKey },
    })
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

/** Feed rows resolved into card data (first photo, display title, shop avatar). */
export async function getCards(f: FeedFilters = {}): Promise<CardItem[]> {
  const rows = await getFeed(f);
  const images = await firstImages(rows.map((r) => r.listing.id));
  return rows.map(({ listing: l, shop }) => {
    const title = displayTitle(l);
    const key = images.get(l.id);
    return {
      id: l.id,
      title: title.text,
      titleFallback: title.fallback,
      priceGel: l.priceGel,
      size: l.size,
      status: l.status,
      isVideo: l.isVideo,
      imageUrl: key ? publicUrl(key) : null,
      postedAt: l.postedAt,
      shop: {
        slug: shop.slug,
        name: shop.name,
        avatarUrl: shop.avatarKey ? publicUrl(shop.avatarKey) : null,
        tone: shopTone(shop.slug),
      },
    };
  });
}
