"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { ICON, T } from "./copy";
import s from "./dash.module.css";

/** Copies the shop page URL; shows ✓ for a moment. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`ds-btn ${s.copy}`}
      aria-label={done ? T.copied : T.copyLink}
      title={done ? T.copied : T.copyLink}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt(T.copyLink, url);
          return;
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <Icon d={done ? ICON.check : ICON.copy} size={14} strokeWidth={done ? 2.6 : 2} />
    </button>
  );
}
