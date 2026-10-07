import Link from "next/link";
import { Icon } from "@/components/icons";
import { ICON, T } from "./copy";
import s from "./dash.module.css";

/** Dash header: wordmark + SHOP badge, log out (POST /api/logout → /sell). */
export function DashHeader() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <div className={s.brand}>
          <Link href="/" className={s.wordmark} aria-label={T.home}>
            DEADSTOCK
          </Link>
          <span className={s.shopBadge}>
            <span className={s.mobInline}>{T.shopBadge}</span>
            <span className={s.deskInline}>{T.shopBadgeDesk}</span>
          </span>
        </div>
        <form action="/api/logout" method="post">
          <button className={`ds-btn ds-s ${s.logout}`} aria-label={T.logout} title={T.logout}>
            <Icon d={ICON.logout} size={18} className={s.mobInline} />
            <span className={s.deskInline}>{T.logout}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
