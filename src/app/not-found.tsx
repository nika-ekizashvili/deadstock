import type { Metadata } from "next";
import Link from "next/link";
import { Icon, PATHS, SearchIcon } from "@/components/icons";
import { t } from "@/lib/copy";
import s from "./not-found.module.css";

/** Page strings (to be merged into lib/copy.ts). */
const T = {
  title: "აქ არაფერია",
  home: "← მთავარი",
};

export const metadata: Metadata = { title: `404 — ${T.title}` };

/** Root 404 (handoff: NotFound-375 / NotFound-1440): ghost 404 with a "SOLD?" stamp, home + search. */
export default function NotFound() {
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div className={s.headInner}>
          <Link href="/" className="ds-logo" aria-label={t.homeLabel}>
            <span className="ds-logo__mark">DEADSTOCK</span>
            <span className="ds-logo__tld">.ge</span>
          </Link>
          <Link href="/sell" className={s.sell}>
            <Icon d={PATHS.shop} size={18} />
            {t.sell}
          </Link>
        </div>
      </header>

      <main className={s.main}>
        <div aria-hidden="true" className={s.art}>
          <span className={s.n404}>404</span>
          <span className={s.stamp}>SOLD?</span>
        </div>
        <h1 className="ds-sr">{T.title}</h1>
        <div className={s.actions}>
          <Link href="/" className={`ds-btn ds-p ${s.home}`}>{T.home}</Link>
          <form action="/search" role="search" className={s.search}>
            <SearchIcon size={18} />
            <input type="search" name="q" aria-label={t.search} placeholder={t.searchPlaceholder} />
            <button type="submit" className={`ds-btn ${s.go}`} aria-label={t.search} title={t.search}>
              <Icon d={PATHS.arrowRight} size={16} strokeWidth={2.6} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
