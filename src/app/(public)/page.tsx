import { connection } from "next/server";
import { FeedControls, type FeedParams } from "@/components/FeedControls";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ListingGrid, NoResults } from "@/components/ListingGrid";
import { Ticker } from "@/components/Ticker";
import { getCards } from "@/lib/queries";

/** Home feed (handoff: Home-375, Home-1440, Home-375-Empty, Home-375-Early). */
export default async function Home({ searchParams }: PageProps<"/">) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const params: FeedParams = { category: str("category"), size: str("size"), max: str("max") };

  const items = await getCards({
    category: params.category,
    size: params.size,
    maxPrice: params.max ? Number(params.max) : undefined,
  });
  const filtered = Boolean(params.category || params.size || params.max);
  const latest = filtered ? await getCards({ limit: 8 }) : items.slice(0, 8);

  return (
    <>
      <Header />
      <Ticker items={latest} />
      <main className="ds-feed-main">
        <FeedControls base="/" params={params} />
        <div className="ds-feed">
          {items.length ? <ListingGrid items={items} closeWithSell /> : <NoResults clearHref="/" />}
        </div>
      </main>
      <Footer />
    </>
  );
}
