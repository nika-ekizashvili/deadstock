import Link from "next/link";
import { publicUrl } from "@/lib/storage";
import type { getFeed } from "@/lib/queries";

type Rows = Awaited<ReturnType<typeof getFeed>>;

export function ListingGrid({ rows, images }: { rows: Rows; images: Map<string, string> }) {
  if (!rows.length) return <p className="muted">Nothing here yet.</p>;
  return (
    <div className="grid">
      {rows.map(({ listing: l, shop }) => {
        const key = images.get(l.id);
        return (
          <Link key={l.id} href={`/i/${l.id}`} className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {key ? <img src={publicUrl(key)} alt={l.title ?? ""} loading="lazy" /> : <div className="card" />}
            <div>{l.priceGel ? `${Number(l.priceGel)} ₾` : "—"} {l.size && `· ${l.size}`}</div>
            <div className="muted">
              {l.title ?? "Untitled"} · {shop.name}
              {l.status !== "available" && ` · ${l.status.toUpperCase()}`}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
