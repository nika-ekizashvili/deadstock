"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon, PATHS } from "@/components/icons";
import { SavedCount } from "@/components/SaveButton";
import { t } from "@/lib/copy";

const TABS = [
  { href: "/", label: t.home, d: PATHS.home },
  { href: "/map", label: t.map, d: PATHS.pin },
  { href: "/saved", label: t.saved, d: PATHS.heart, count: true },
];

const noop = () => () => {};

/**
 * Mobile tab bar (handoff: Home-375). Icon only; the label goes in aria-label + title. Hidden on desktop.
 * On a shop subdomain ("/" is the shop page) tabs link back to the main site and none is marked current.
 */
export function TabBar({ appUrl }: { appUrl: string }) {
  const appOrigin = new URL(appUrl).origin;
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => appOrigin);
  const onSubdomain = origin !== appOrigin;
  const path = usePathname();
  return (
    <nav className="ds-tabbar" aria-label={t.menu}>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={onSubdomain ? `${appOrigin}${tab.href}` : tab.href}
          aria-label={tab.label}
          title={tab.label}
          aria-current={!onSubdomain && path === tab.href ? "page" : undefined}
        >
          <Icon d={tab.d} size={22} />
          {tab.count && <SavedCount className="ds-tabbar__n" />}
        </Link>
      ))}
    </nav>
  );
}
