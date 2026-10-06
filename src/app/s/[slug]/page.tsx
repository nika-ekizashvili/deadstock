import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { firstImages, getFeed } from "@/lib/queries";
import { ListingGrid } from "@/app/ListingGrid";

/** Shop page — served at [slug].deadstock.ge via proxy.ts, or /s/[slug]. */
export default async function ShopPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const shop = await db().query.shops.findFirst({ where: eq(schema.shops.slug, slug) });
  if (!shop || shop.status !== "active") notFound();

  const ig = await db().query.instagramAccounts.findFirst({
    where: eq(schema.instagramAccounts.shopId, shop.id),
  });
  const rows = await getFeed({ shopId: shop.id, includeSold: true, limit: 200 });
  const images = await firstImages(rows.map((r) => r.listing.id));

  return (
    <main>
      <h1>{shop.name}</h1>
      {shop.bio && <p>{shop.bio}</p>}
      {shop.address && <p className="muted">📍 {shop.address}</p>}
      {ig && <p><a href={`https://instagram.com/${ig.username}`}>@{ig.username} on Instagram</a></p>}
      <ListingGrid rows={rows} images={images} />
    </main>
  );
}
