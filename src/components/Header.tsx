import Link from "next/link";
import { Icon, PATHS, SearchIcon } from "@/components/icons";
import { SavedCount } from "@/components/SaveButton";
import { t } from "@/lib/copy";

/**
 * Site header (handoff: Home-375 / Home-1440).
 * Mobile: wordmark + icons, search on its own row. Desktop: one row with nav.
 * Search is a plain GET form to /search, so it works before JS loads.
 */
export function Header({ q }: { q?: string }) {
  return (
    <header className="ds-header">
      <div className="ds-header__inner">
        <Link href="/" className="ds-logo" aria-label={t.homeLabel}>
          <span className="ds-logo__mark">DEADSTOCK</span>
          <span className="ds-logo__tld">.ge</span>
        </Link>

        <form action="/search" role="search" className="ds-search">
          <SearchIcon />
          <input type="search" name="q" aria-label={t.searchLabel} placeholder={t.searchPlaceholder} defaultValue={q} />
          <button type="submit" className="ds-btn ds-search__go" aria-label={t.search} title={t.search}>
            <Icon d={PATHS.arrowRight} size={16} strokeWidth={2.6} />
          </button>
        </form>

        <div className="ds-header__actions ds-header__mob">
          <Link href="/sell" className="ds-icon-link" aria-label={t.sell} title={t.sell}>
            <Icon d={PATHS.shop} />
          </Link>
        </div>

        <div className="ds-header__desk">
          <nav aria-label={t.menu}>
            <Link href="/map" className="ds-icon-link" aria-label={t.map} title={t.map}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={PATHS.pin} />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
            </Link>
            <Link href="/saved" className="ds-saved-count" aria-label={t.saved} title={t.saved}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ds-lime)" stroke="var(--ds-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={PATHS.heart} />
              </svg>
              <SavedCount />
            </Link>
          </nav>
          <Link href="/sell" className="ds-btn ds-s ds-sell">
            <Icon d={PATHS.shop} size={18} />
            {t.sell}
          </Link>
        </div>
      </div>
    </header>
  );
}
