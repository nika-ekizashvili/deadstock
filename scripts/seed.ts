/** Demo data so the feed isn't empty before Instagram is connected: `pnpm db:seed` */
import "dotenv/config";
import { db, schema } from "@/db";
import { parseCaption } from "@/lib/parse/caption";
import { buildSearchText } from "@/lib/translit";

const CAPTIONS = [
  "Pepe Jeans leather jacket\n\nSize XS\nPrice: 220\nRESERVED",
  "Adidas anorak jacket\n\nSize L\n110",
  "Vintage Leather Bomber Jacket\nSize - 2XL\nPrice - 345",
  "Levi's 501 jeans\nSize W32 L32\nPrice: 90",
  "ზაფხულის კაბა\nზომა: M\nფასი: 35 ლარი",
];

async function main() {
  const [shop] = await db()
    .insert(schema.shops)
    .values({ slug: "demo-shop", name: "Demo Shop", status: "active", address: "Tbilisi" })
    .onConflictDoNothing()
    .returning();
  if (!shop) return console.log("seed already applied");

  for (const [i, caption] of CAPTIONS.entries()) {
    const p = parseCaption(caption);
    await db().insert(schema.listings).values({
      shopId: shop.id,
      igMediaId: `demo-${i}`,
      permalink: "https://www.instagram.com/",
      caption,
      title: p.title,
      priceGel: p.priceGel?.toString(),
      size: p.size,
      brand: p.brand,
      category: p.category,
      status: p.status,
      review: "approved",
      searchText: buildSearchText([p.title, p.brand, p.category, caption, shop.name]),
      postedAt: new Date(Date.now() - i * 3600_000),
    });
  }
  console.log("seeded demo-shop with", CAPTIONS.length, "listings");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
