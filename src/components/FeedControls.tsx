import Link from "next/link";
import { Icon, PATHS } from "@/components/icons";
import { FilterSelect } from "@/components/FilterSelect";
import { CATEGORIES, MAX_PRICES, SIZES } from "@/lib/catalog";
import { t } from "@/lib/copy";

export type FeedParams = { q?: string; category?: string; size?: string; max?: string };

/** Build a URL for `base` with the given params, dropping empty values. */
export function feedHref(base: string, p: FeedParams) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

/**
 * Category chips + size / max-price selects (handoff: Home-375 / Home-1440).
 * Chips are links; the selects submit a GET form, so filters live in the URL.
 */
export function FeedControls({ base, params }: { base: string; params: FeedParams }) {
  const active = params.category ?? "";
  return (
    <div className="ds-controls">
      <div role="group" aria-label={t.category} className="ds-chips">
        {CATEGORIES.map((c) => {
          const on = c.value === active;
          return (
            <Link
              key={c.value || "all"}
              href={feedHref(base, { ...params, category: c.value || undefined })}
              className="ds-btn ds-chip"
              title={c.name}
              aria-label={c.name}
              aria-current={on ? "true" : undefined}
              scroll={false}
            >
              <Icon d={c.icon} />
              <span className="ds-chip__name">{c.name}</span>
            </Link>
          );
        })}
      </div>

      <form action={base} className="ds-filters">
        {params.q && <input type="hidden" name="q" value={params.q} />}
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <label className="ds-select" title={t.size}>
          <Icon d={PATHS.ruler} size={16} />
          <FilterSelect name="size" label={t.size} value={params.size ?? ""}>
            <option value="">ALL</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>
          <Icon d={PATHS.chevronDown} size={14} strokeWidth={2.5} className="ds-select__chev" stroke="var(--ds-muted)" />
        </label>
        <label className="ds-select" title={t.maxPrice}>
          <span aria-hidden="true" className="ds-select__cur">≤ ₾</span>
          <FilterSelect name="max" label={t.maxPrice} value={params.max ?? ""}>
            <option value="">∞</option>
            {MAX_PRICES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </FilterSelect>
          <Icon d={PATHS.chevronDown} size={14} strokeWidth={2.5} className="ds-select__chev" stroke="var(--ds-muted)" />
        </label>
        <noscript>
          <button type="submit">→</button>
        </noscript>
      </form>
    </div>
  );
}
