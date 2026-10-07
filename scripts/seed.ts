/**
 * Local demo data so every screen has something real-looking before Instagram is connected:
 * `pnpm db:seed`. Shops and items mirror the handoff canvas. Photos are generated SVG tiles.
 * Re-running replaces the demo shops. Demo Instagram accounts use ig_user_id "demo-*" and are never synced.
 */
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { parseCaption } from "@/lib/parse/caption";
import { putObject } from "@/lib/storage";
import { buildSearchText } from "@/lib/translit";

type ItemSeed = {
  caption: string;
  status?: "available" | "reserved" | "sold";
  video?: boolean;
  photos?: number;
  review?: "pending" | "approved" | "rejected";
};

const SHOPS: {
  slug: string; name: string; username: string; bio: string; address: string;
  lat: number; lng: number; tone: string; items: ItemSeed[];
}[] = [
  {
    slug: "dzveli-karada", name: "ძველი კარადა", username: "dzveli.karada", tone: "#C9A27A",
    bio: "ვინტაჟი და სტრიტვეარი 90-იანებიდან. ახალი ნივთები ყოველ ორშაბათს და ხუთშაბათს.",
    address: "ვაჟა-ფშაველას 24", lat: 41.7251, lng: 44.7469,
    items: [
      { caption: "Pepe Jeans leather jacket\n\nSize XS\nPrice: 220\nRESERVED", status: "reserved", photos: 3 },
      { caption: "მატყლის სვიტერი, ხელნაქსოვი\nზომა: S\nფასი: 60 ლარი", photos: 2 },
      { caption: "Plaid mini skirt\nSize XS\n45 ₾\nRESERVED", status: "reserved" },
      { caption: "Dr. Martens 1460\nზომა: 39\nფასი: 260", photos: 3 },
      { caption: "Levi's 501 vintage\nSize W32 L32\nPrice: 120\nSOLD", status: "sold" },
      { caption: "Ralph Lauren oxford shirt\nSize M\nPrice: 70", review: "pending" },
    ],
  },
  {
    slug: "parduli", name: "ფარდული", username: "parduli.tbs", tone: "#B07A6E",
    bio: "სახლის ნივთები, ვინილი და ვინტაჟური ტანსაცმელი. სოლოლაკი.",
    address: "ლესელიძის 17", lat: 41.6925, lng: 44.8031,
    items: [
      { caption: "ზაფხულის კაბა\nზომა: M\nფასი: 35 ლარი", photos: 2 },
      { caption: "ტყავის ჩანთა\nDM-ში მოგვწერეთ 📩", video: true },
      { caption: "ვინილი — ჯაზის კრებული, 1978\nფასი: 40", photos: 2 },
      { caption: "Sony Walkman, მუშა მდგომარეობაში\n150 ლარი", video: true },
      { caption: "ზაფხულის სელის კაბა ყვავილებით, ხელნაკეთი, 90-იანების იტალიური\nზომა: M / L (ოვერსაიზ)\nფასი: 35", photos: 2 },
      { caption: "Wool coat, camel\nSize M\nPrice: 180\nგაიყიდა", status: "sold" },
    ],
  },
  {
    slug: "garage-41", name: "Garage 41", username: "garage41.store", tone: "#8E9B6A",
    bio: "Workwear, outdoor and sneakers. Vera.",
    address: "ბარნოვის 41", lat: 41.7067, lng: 44.7826,
    items: [
      { caption: "Carhartt Detroit jacket\nSize L\nPrice: 310", photos: 3 },
      { caption: "Nike Air Max 95\nSize 42\n240 ₾", video: true, photos: 2 },
      { caption: "Arc'teryx shell jacket\nSize M\nPrice - 410", photos: 2 },
      { caption: "Stussy 8-ball tee\nSize L\nPrice: 95\nSOLD", status: "sold" },
    ],
  },
  {
    slug: "second-wind", name: "Second Wind", username: "secondwind.ge", tone: "#6F8FA6",
    bio: "Second-hand denim and flannel. საბურთალო.",
    address: "ვაჟა-ფშაველას 71", lat: 41.7266, lng: 44.7381,
    items: [
      { caption: "Vintage Leather Bomber Jacket\nSize - L\nPrice - 345", photos: 3 },
      { caption: "Dickies 874 work pants\nSize W34\nPrice: 85" },
      { caption: "Levi's\nჯინსი\nზომა: 30\nფასი: 90", photos: 2 },
      { caption: "Oversized flannel shirt\nSize XL\n55 GEL" },
    ],
  },
];

const TONES = ["#3A332C", "#5B5248", "#2C363B", "#B9B0A2", "#4A2F2A", "#2F3B2E", "#6B5A4C", "#1F2326", "#8C8172", "#3D3A45", "#7A6E60", "#55443A", "#A39783", "#2A2E36", "#77685A"];

/** Placeholder photo in the style of the canvas: a flat tone with a soft light from the top left. */
function photoSvg(tone: string, n: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<defs><radialGradient id="g" cx="28%" cy="18%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="1000" fill="${tone}"/><rect width="800" height="1000" fill="url(#g)"/>
<text x="760" y="960" text-anchor="end" font-family="monospace" font-size="28" fill="#fff" fill-opacity=".18">${n}</text></svg>`;
}

function avatarSvg(tone: string, letter: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${tone}"/>
<text x="100" y="128" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="88" fill="#0E0E0E">${letter}</text></svg>`;
}

async function main() {
  const slugs = [...SHOPS.map((s) => s.slug), "demo-shop"];
  await db().delete(schema.shops).where(inArray(schema.shops.slug, slugs));

  let n = 0;
  for (const s of SHOPS) {
    const avatarKey = await putObject(`seed/${s.slug}/avatar.svg`, avatarSvg(s.tone, [...s.name][0]), "image/svg+xml");
    const [shop] = await db()
      .insert(schema.shops)
      .values({ slug: s.slug, name: s.name, bio: s.bio, address: s.address, lat: s.lat, lng: s.lng, avatarKey, status: "active" })
      .returning();
    await db().insert(schema.instagramAccounts).values({
      shopId: shop.id,
      igUserId: `demo-${s.slug}`,
      username: s.username,
      accessTokenEnc: encrypt("demo"),
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 3600_000),
      lastSyncedAt: new Date(),
    });

    for (const [i, item] of s.items.entries()) {
      const p = parseCaption(item.caption);
      const status = item.status ?? p.status;
      const [row] = await db()
        .insert(schema.listings)
        .values({
          shopId: shop.id,
          igMediaId: `demo-${s.slug}-${i}`,
          permalink: `https://www.instagram.com/${s.username}/`,
          caption: item.caption,
          isVideo: Boolean(item.video),
          title: p.title,
          priceGel: p.priceGel?.toString(),
          size: p.size,
          brand: p.brand,
          category: p.category,
          condition: p.condition,
          status,
          soldAt: status === "sold" ? new Date() : null,
          review: item.review ?? "approved",
          searchText: buildSearchText([p.title, p.brand, p.category, p.size, item.caption, s.name]),
          postedAt: new Date(Date.now() - n * 2.5 * 3600_000),
        })
        .returning({ id: schema.listings.id });

      for (let k = 0; k < (item.photos ?? 1); k++) {
        const key = await putObject(`seed/${s.slug}/${i}-${k}.svg`, photoSvg(TONES[(n + k * 3) % TONES.length], k + 1), "image/svg+xml");
        await db().insert(schema.listingImages).values({ listingId: row.id, position: k, igMediaId: `demo-${s.slug}-${i}-${k}`, storageKey: key });
      }
      n++;
    }
  }
  console.log(`seeded ${SHOPS.length} shops, ${n} listings`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
