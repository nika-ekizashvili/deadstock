import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { feedHref, type FeedParams } from "@/components/FeedControls";
import { FilterSelect } from "@/components/FilterSelect";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon, PATHS, SearchIcon } from "@/components/icons";
import { ListingGrid, NoResults } from "@/components/ListingGrid";
import { MAX_PRICES, SIZES } from "@/lib/catalog";
import { t } from "@/lib/copy";
import { getCards } from "@/lib/queries";
import s from "./search.module.css";

const T = {
  title: "ძებნა · DEADSTOCK.ge",
  back: "უკან",
  filters: "ფილტრები",
  results: "შედეგები",
  price: "ფასი",
  items: "ITEMS",
  sizeLegend: "SIZE",
  priceLegend: "PRICE",
};

/** Icons from Search-375 (size + price chips). */
const SIZE_ICON = "M4 7h16M4 7v10M20 7v10M8 7v3M12 7v4M16 7v3";
const PRICE_ICON = "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z";
const BACK_ICON = "M19 12H5M12 19l-7-7 7-7";

export const metadata: Metadata = { title: T.title };

/** Search results (handoff: Search-375, Search-1440). Filters live in the URL. */
export default async function Search({ searchParams }: PageProps<"/search">) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string).trim() || undefined : undefined);
  const params: FeedParams = { q: str("q"), category: str("category"), size: str("size"), max: str("max") };
  const q = params.q;

  const items = await getCards({
    q,
    category: params.category,
    size: params.size,
    maxPrice: params.max ? Number(params.max) : undefined,
  });
  const filtered = Boolean(params.category || params.size || params.max);
  const clearFilters = feedHref("/search", { q });
  const href = (p: Partial<FeedParams>) => feedHref("/search", { ...params, ...p });

  return (
    <>
      <div className={s.desk}>
        <Header q={q} />
      </div>

      {/* Mobile: back + search pill, then filter chips (Search-375) */}
      <header className={s.mHead}>
        <div className={s.mRow}>
          <Link href="/" className={s.back} aria-label={T.back} title={T.back}>
            <Icon d={BACK_ICON} />
          </Link>
          <form action="/search" role="search" className={s.mSearch}>
            <SearchIcon />
            <input type="search" name="q" aria-label={t.searchLabel} placeholder={t.searchPlaceholder} defaultValue={q} />
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.size && <input type="hidden" name="size" value={params.size} />}
            {params.max && <input type="hidden" name="max" value={params.max} />}
            {q && (
              <Link href="/" className={s.clearQ} aria-label={t.clear} title={t.clear}>
                <Icon d={PATHS.close} size={14} strokeWidth={2.5} />
              </Link>
            )}
          </form>
        </div>
        <form action="/search" className={s.mChips}>
          {q && <input type="hidden" name="q" value={q} />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
          <label className={s.mChip} data-on={params.size ? "true" : undefined}>
            <Icon d={SIZE_ICON} size={15} />
            {params.size ?? t.size}
            <FilterSelect name="size" label={t.size} value={params.size ?? ""}>
              <option value="">ALL</option>
              {SIZES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </FilterSelect>
          </label>
          <label className={s.mChip} data-on={params.max ? "true" : undefined}>
            <Icon d={PRICE_ICON} size={15} />
            {params.max ? `≤ ${params.max} ₾` : T.price}
            <FilterSelect name="max" label={t.maxPrice} value={params.max ?? ""}>
              <option value="">∞</option>
              {MAX_PRICES.map((p) => (
                <option key={p} value={p}>≤ {p} ₾</option>
              ))}
            </FilterSelect>
          </label>
          <noscript>
            <button type="submit">→</button>
          </noscript>
        </form>
      </header>

      <main className={s.main}>
        {/* Desktop filter column (Search-1440) */}
        <aside aria-label={T.filters} className={s.aside}>
          <fieldset className={s.group}>
            <legend>{T.sizeLegend}</legend>
            <div className={s.opts}>
              {SIZES.map((z) => {
                const on = params.size === z;
                return (
                  <Link
                    key={z}
                    href={href({ size: on ? undefined : z })}
                    className={`ds-btn ${s.opt} ${s.optMono}`}
                    aria-current={on ? "true" : undefined}
                    scroll={false}
                  >
                    {z}
                  </Link>
                );
              })}
            </div>
          </fieldset>
          <fieldset className={s.group}>
            <legend>{T.priceLegend}</legend>
            <div className={s.opts}>
              {MAX_PRICES.map((p) => {
                const on = params.max === String(p);
                return (
                  <Link
                    key={p}
                    href={href({ max: on ? undefined : String(p) })}
                    className={`ds-btn ${s.opt}`}
                    aria-current={on ? "true" : undefined}
                    scroll={false}
                  >
                    ≤ {p} ₾
                  </Link>
                );
              })}
              <Link
                href={href({ max: undefined })}
                className={`ds-btn ${s.opt}`}
                aria-current={params.max ? undefined : "true"}
                scroll={false}
              >
                ∞
              </Link>
            </div>
          </fieldset>
          <Link href={clearFilters} className={s.clearAll} scroll={false}>
            {t.clear}
          </Link>
        </aside>

        <section aria-label={T.results} className={s.results}>
          <div className={s.countRow}>
            <span className={s.count}>{items.length}</span>
            <span className={s.countLabel}>
              {T.items}
              {q && <span className={s.deskInline}> · „{q}“</span>}
            </span>
          </div>
          {items.length ? (
            <ListingGrid items={items} />
          ) : (
            <NoResults query={q} clearHref={filtered ? clearFilters : "/"} />
          )}
        </section>
      </main>

      <div className={s.desk}>
        <Footer />
      </div>
    </>
  );
}
