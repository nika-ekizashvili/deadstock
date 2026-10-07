"use client";

/**
 * Saved items for the demo: kept in this browser only (no shopper accounts yet).
 * Every read and write is wrapped — storage can be blocked or empty.
 */
import { useSyncExternalStore } from "react";

const KEY = "ds:saved";
const EVENT = "ds:saved-change";
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) {
      const parsed = raw ? JSON.parse(raw) : [];
      cache = { raw, ids: Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY };
    }
    return cache.ids;
  } catch {
    return EMPTY;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function toggleSaved(id: string) {
  const ids = read();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the heart just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
