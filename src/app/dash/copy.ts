import { t } from "@/lib/copy";

/** Shop dashboard strings live in lib/copy.ts (t.dash; Georgian only, per handoff README). */
export const T = t.dash;

/** "12 წთ" / "3 სთ" / "2 დღე" since `d`. */
export function ago(d: Date, now = Date.now()) {
  const min = Math.floor((now - d.getTime()) / 60_000);
  if (min < 1) return T.now;
  if (min < 60) return `${min} ${T.minutes}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${T.hours}`;
  return `${Math.floor(h / 24)} ${T.days}`;
}

/** Placeholder tones for items without a mirrored photo (palette from the handoff screens). */
export const TONES = ["#3A332C", "#B9B0A2", "#2C363B", "#4A2F2A", "#6B5A4C", "#2F3B2E", "#5B5248", "#8C8172", "#3D3A45", "#7A6E60"];

export const ICON = {
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  sync: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4",
  warn: "M12 3 2 20h20zM12 10v4M12 17h.01",
  check: "m5 12 5 5 9-10",
  close: "M6 6l12 12M18 6 6 18",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  back: "M19 12H5M12 19l-7-7 7-7",
  external: "M7 17 17 7M8 7h9v9",
  available: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 12l3 3 5-6",
  hourglass: "M6 2h12M6 22h12M7 2v4c0 3 5 4 5 6s-5 3-5 6v4M17 2v4c0 3-5 4-5 6s5 3 5 6v4",
} as const;
