"use client";

import { useState } from "react";
import { Icon, PATHS } from "@/components/icons";

/** Share the shop page: native share sheet where available, else copy the link. */
export function ShareButton({ title, label, copiedLabel, className }: { title: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button type="button" className={className} aria-label={copied ? copiedLabel : label} title={copied ? copiedLabel : label} onClick={share}>
      {copied ? (
        <Icon d={PATHS.check} size={20} strokeWidth={2.5} />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 3v13" />
          <path d="m7 8 5-5 5 5" />
        </svg>
      )}
    </button>
  );
}
