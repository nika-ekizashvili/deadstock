"use client";

import { Icon, PATHS } from "@/components/icons";
import { t } from "@/lib/copy";
import { toggleSaved, useSavedIds } from "@/lib/saved";

/** Heart on a card. Sits beside the card link, never inside it. */
export function SaveButton({ id }: { id: string }) {
  const saved = useSavedIds().includes(id);
  return (
    <button
      type="button"
      className="ds-btn ds-save"
      aria-label={t.save}
      title={t.save}
      aria-pressed={saved}
      onClick={() => toggleSaved(id)}
    >
      <Icon d={PATHS.heart} />
    </button>
  );
}

/** Saved count for the header and tab bar. */
export function SavedCount({ className }: { className?: string }) {
  const n = useSavedIds().length;
  if (!n) return null;
  return <span className={className}>{n}</span>;
}
