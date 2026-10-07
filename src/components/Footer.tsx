import Link from "next/link";
import { Icon, PATHS } from "@/components/icons";
import { t } from "@/lib/copy";

/** Footer (handoff: Home-375 / Home-1440): ghost wordmark + sell link. */
export function Footer() {
  return (
    <footer className="ds-footer">
      <div className="ds-footer__inner">
        <span className="ds-footer__mark" aria-hidden="true">DEADSTOCK</span>
        <Link href="/sell" className="ds-sell-link">
          <Icon d={PATHS.shop} size={18} />
          {t.sellArrow}
        </Link>
      </div>
    </footer>
  );
}
