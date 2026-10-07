import type { Metadata } from "next";
import { connection } from "next/server";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { priceText, shopTone } from "@/lib/catalog";
import { getCards } from "@/lib/queries";
import { publicUrl } from "@/lib/storage";
import { ShopMap, type MapShop } from "./ShopMap";
import s from "./map.module.css";
import { t } from "@/lib/copy";

const T = t.mapPage;

export const metadata: Metadata = { title: T.title };

const { shops, listings } = schema;

/** Thrift map (handoff: Map-375, Map-1440). Active shops with a pin, busiest first. */
export default async function MapPage() {
  await connection();

  const rows = await db()
    .select({
      id: shops.id,
      slug: shops.slug,
      name: shops.name,
      address: shops.address,
      lat: shops.lat,
      lng: shops.lng,
      avatarKey: shops.avatarKey,
      n: sql<number>`count(${listings.id})::int`,
    })
    .from(shops)
    .leftJoin(
      listings,
      and(
        eq(listings.shopId, shops.id),
        eq(listings.review, "approved"),
        sql`${listings.status} in ('available','reserved')`,
      ),
    )
    .where(and(eq(shops.status, "active"), isNotNull(shops.lat), isNotNull(shops.lng)))
    .groupBy(shops.id)
    .orderBy(desc(sql`count(${listings.id})`), shops.name);

  // Illustrated-map projection: each pin's position inside the shops' bounding box (0..1).
  const lats = rows.map((r) => r.lat!);
  const lngs = rows.map((r) => r.lng!);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const norm = (v: number, lo: number, hi: number) => (hi - lo < 1e-9 ? 0.5 : (v - lo) / (hi - lo));

  const data: MapShop[] = await Promise.all(
    rows.map(async (r) => {
      const tone = shopTone(r.slug);
      const items = await getCards({ shopId: r.id, limit: 4 });
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        address: r.address,
        lat: r.lat!,
        lng: r.lng!,
        u: norm(r.lng!, minLng, maxLng),
        v: 1 - norm(r.lat!, minLat, maxLat),
        n: r.n,
        tone,
        avatarUrl: r.avatarKey ? publicUrl(r.avatarKey) : null,
        items: items.map((i) => ({ id: i.id, imageUrl: i.imageUrl, price: priceText(i.priceGel), title: i.title })),
      };
    }),
  );

  return (
    <>
      <div className={s.desk}>
        <Header />
      </div>
      <ShopMap shops={data} />
      <div className={s.desk}>
        <Footer />
      </div>
    </>
  );
}
