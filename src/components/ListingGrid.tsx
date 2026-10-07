import Link from "next/link";
import { Icon, PATHS } from "@/components/icons";
import { ListingCard } from "@/components/ListingCard";
import { t } from "@/lib/copy";
import type { CardItem } from "@/lib/queries";

/** Below this many items the grid closes with the "that's all. yet." tile (Cards → 09 FEW ITEMS). */
const FEW = 12;

export function ListingGrid({ items, closeWithSell = false, highlight }: { items: CardItem[]; closeWithSell?: boolean; highlight?: string }) {
  return (
    <div className="ds-grid">
      {items.map((it, i) => (
        <ListingCard key={it.id} item={it} priority={i < 4} highlight={highlight} />
      ))}
      {closeWithSell && items.length > 0 && items.length < FEW && (
        <div className="ds-thats-all">
          <span className="ds-thats-all__t">
            {t.thatsAll}
            <br />
            <span style={{ color: "var(--ds-lime)" }}>{t.yet}</span>
          </span>
          <Link href="/sell" className="ds-sell-link">
            <Icon d={PATHS.shop} size={18} />
            {t.sellArrow}
          </Link>
        </div>
      )}
    </div>
  );
}

/** No results (Cards → 09 NO RESULTS): the query, a clear button, a ghost 0. */
export function NoResults({ query, clearHref }: { query?: string; clearHref: string }) {
  return (
    <div className="ds-empty">
      <div className="ds-empty__q">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--ds-lime)" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
        </svg>
        {query ? <span>„{query}“</span> : null}
      </div>
      <Link href={clearHref} className="ds-btn ds-p ds-pill-btn">
        <Icon d={PATHS.close} size={14} strokeWidth={2.5} />
        {t.clear}
      </Link>
      <span className="ds-empty__zero" aria-hidden="true">0</span>
    </div>
  );
}

/** Loading skeletons (Cards → 09 PULSING SKELETON). */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="ds-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ds-sk">
          <div className="ds-sk__media"><span className="ds-sk__tag" /></div>
          <div className="ds-sk__l1" />
          <div className="ds-sk__l2" />
        </div>
      ))}
    </div>
  );
}
