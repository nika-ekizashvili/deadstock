import Link from "next/link";
import { priceText } from "@/lib/catalog";
import { t } from "@/lib/copy";
import type { CardItem } from "@/lib/queries";

/** Lime "just posted" marquee (handoff: Home-375 / Home-1440). The list renders twice for a seamless loop. */
export function Ticker({ items }: { items: CardItem[] }) {
  if (items.length < 3) return null;
  const loop = [...items, ...items];
  return (
    <div className="ds-ticker" aria-label={t.justPosted}>
      <div className="ds-ticker__track">
        {loop.map((it, i) => (
          <Link key={`${it.id}-${i}`} href={`/i/${it.id}`} aria-hidden={i >= items.length || undefined} tabIndex={i >= items.length ? -1 : undefined}>
            <span className="ds-ticker__new">NEW</span>
            {it.title} — {priceText(it.priceGel)}
            <span className="ds-ticker__star" aria-hidden="true">✦</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
