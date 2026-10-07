"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon, PATHS } from "@/components/icons";
import { ListingCard } from "@/components/ListingCard";
import { GridSkeleton } from "@/components/ListingGrid";
import type { CardItem } from "@/lib/queries";
import { useSavedIds } from "@/lib/saved";
import s from "./saved.module.css";
import { t } from "@/lib/copy";

const T = t.savedPage;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The API takes at most 100 ids per request; larger lists load in batches. */
const BATCH = 100;

/** CardItem as it arrives over JSON (dates become strings). */
type CardJson = Omit<CardItem, "postedAt"> & { postedAt: string };

const noop = () => () => {};

export function SavedView() {
  // false during SSR and hydration: storage hasn't been read yet, so don't flash the empty state.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const ids = useSavedIds();

  // Everything saved since the page opened. Un-saving keeps the card (heart goes hollow) until reload.
  const [shown, setShown] = useState<string[]>([]);
  const added = ids.filter((id) => UUID.test(id) && !shown.includes(id));
  if (added.length) setShown([...added, ...shown]);

  // id → card, or null when the listing no longer exists / is hidden.
  const [cards, setCards] = useState<Record<string, CardItem | null>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState(0);

  const pendingKey = shown
    .filter((id) => !(id in cards))
    .slice(0, BATCH)
    .join(",");

  useEffect(() => {
    if (!pendingKey) return;
    const ctrl = new AbortController();
    fetch(`/api/cards?ids=${pendingKey}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<CardJson[]>;
      })
      .then((items) => {
        setFailed(false);
        setCards((prev) => {
          const next = { ...prev };
          for (const id of pendingKey.split(",")) next[id] = null;
          for (const it of items) next[it.id] = { ...it, postedAt: new Date(it.postedAt) };
          return next;
        });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [pendingKey, attempt]);

  const list = shown.map((id) => cards[id]).filter((c): c is CardItem => Boolean(c));
  const count = list.filter((c) => ids.includes(c.id)).length;
  const loading = !mounted || (Boolean(pendingKey) && !failed);
  const visible = tab === 1 ? list.filter((c) => c.status !== "sold") : list;

  let body: React.ReactNode;
  if (list.length) {
    body = (
      <div className={`ds-grid ${s.grid} ${s.pad}`}>
        {visible.map((it, i) => (
          <div key={it.id} className={s.cell}>
            <ListingCard item={it} priority={i < 4} keepSave />
          </div>
        ))}
      </div>
    );
  } else if (loading) {
    body = (
      <div className={s.pad}>
        <GridSkeleton count={Math.min(Math.max(ids.length, 2), 6)} />
      </div>
    );
  } else if (failed) {
    body = (
      <div className={s.empty}>
        <span className={s.emptyT}>{T.failed}</span>
        <button type="button" className={`ds-btn ds-p ${s.browse}`} onClick={() => setAttempt((n) => n + 1)}>
          {T.retry}
        </button>
      </div>
    );
  } else {
    body = (
      <div className={s.empty}>
        <span aria-hidden="true" className={s.ghost}>
          <Icon d={PATHS.heart} size={300} strokeWidth={1.2} />
        </span>
        <span className={s.ring}>
          <Icon d={PATHS.heart} size={28} />
        </span>
        <span className={s.emptyT}>{T.empty}</span>
        <Link href="/" className={`ds-btn ds-p ${s.browse}`}>
          {T.browse}
          <Icon d={PATHS.arrowRight} size={16} strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  return (
    <main className={s.main}>
      <div className={s.head}>
        <h1 className={s.title}>
          <Icon d={PATHS.heart} fill="currentColor" className={s.heart} />
          {T.title}
        </h1>
        {mounted && list.length > 0 && <span className={s.count}>{count}</span>}
      </div>

      {list.length > 0 && (
        <div role="group" aria-label={T.filter} className={s.tabs}>
          {[T.all, T.available].map((n, i) => (
            <button
              key={n}
              type="button"
              className={`ds-btn ${s.tab}`}
              aria-pressed={tab === i}
              onClick={() => setTab(i)}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {body}
    </main>
  );
}
