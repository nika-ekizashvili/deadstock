import { connection } from "next/server";
import { firstImages, getFeed } from "@/lib/queries";
import { ListingGrid } from "./ListingGrid";

const CATEGORIES = ["outerwear", "tops", "jeans", "pants", "dresses", "skirts", "shoes", "bags", "accessories", "vinyl", "electronics"];

export default async function Home({ searchParams }: PageProps<"/">) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);

  const rows = await getFeed({
    q: str("q"),
    category: str("category"),
    size: str("size"),
    maxPrice: str("max") ? Number(str("max")) : undefined,
  });
  const images = await firstImages(rows.map((r) => r.listing.id));

  return (
    <main>
      <h1>DEADSTOCK</h1>
      <form className="filters">
        <input name="q" placeholder="Search (kaba / კაბა, nike…)" defaultValue={str("q")} />
        <select name="category" defaultValue={str("category") ?? ""}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input name="size" placeholder="Size" defaultValue={str("size")} size={5} />
        <input name="max" type="number" placeholder="Max ₾" defaultValue={str("max")} />
        <button>Search</button>
      </form>
      <ListingGrid rows={rows} images={images} />
      <p className="muted"><a href="/dashboard">For shops →</a></p>
    </main>
  );
}
