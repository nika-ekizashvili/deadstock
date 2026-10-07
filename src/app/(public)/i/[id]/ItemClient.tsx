"use client";

import { useEffect, useState } from "react";
import { Icon, PATHS } from "@/components/icons";
import { t } from "@/lib/copy";
import { toggleSaved, useSavedIds } from "@/lib/saved";
import s from "./item.module.css";

/** Big round save heart (Item-375 / Item-1440 action row). */
export function SaveHeart({ id }: { id: string }) {
  const saved = useSavedIds().includes(id);
  return (
    <button
      type="button"
      className={`ds-btn ${s.round} ${s.heart}`}
      aria-label={t.save}
      title={t.save}
      aria-pressed={saved}
      onClick={() => toggleSaved(id)}
    >
      <Icon d={PATHS.heart} />
    </button>
  );
}

/**
 * Mobile sticky DM bar (Item-375-Sticky): slides up once the main action row
 * has scrolled out above the viewport. Hidden on desktop by CSS.
 */
export function StickyBar({
  id,
  watch,
  price,
  priceTitle,
  reserved,
  dmHref,
  holdLabel,
}: {
  id: string;
  watch: string;
  price: string;
  priceTitle: string;
  reserved: boolean;
  dmHref: string;
  holdLabel: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);

  return (
    <div className={`${s.bar}${on ? ` ${s.barOn}` : ""}`} inert={!on}>
      <span className={s.barTag} title={priceTitle}>
        {price}
      </span>
      {reserved && (
        <span className={s.hold} title={holdLabel} role="img" aria-label={holdLabel}>
          <Icon d={PATHS.hourglass} size={17} strokeWidth={2.2} />
        </span>
      )}
      <SaveHeart id={id} />
      <a href={dmHref} target="_blank" rel="noopener noreferrer" className={`ds-btn ds-p ${s.dm}`}>
        <Icon d={PATHS.send} strokeWidth={2.2} />
        DM
      </a>
    </div>
  );
}
