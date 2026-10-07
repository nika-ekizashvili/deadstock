/** Stroke icons from the handoff screens: 24px grid, 2px round strokes, currentColor. */
import type { SVGProps } from "react";

export const PATHS = {
  home: "M3 11 12 3l9 8v10h-6v-6H9v6H3z",
  drops: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  shop: "M4 9h16l-1.5-5h-13zM5 9v11h14V9M10 20v-6h4v6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  chevronDown: "m6 9 6 6 6-6",
  ruler: "M3 17 17 3l4 4L7 21zm4-4 2 2m1-5 2 2m1-5 2 2",
  hourglass: "M6 2h12M6 22h12M7 2v4c0 3 5 4 5 6s-5 3-5 6v4M17 2v4c0 3-5 4-5 6s5 3 5 6v4",
  send: "M22 2 11 13M22 2 15 22l-4-9-9-4z",
  external: "M7 17 17 7M8 7h9v9",
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12 5 5 9-10",
  user: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0",
} as const;

type IconProps = { d: string; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "d">;

export function Icon({ d, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--ds-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="var(--ds-text)" aria-hidden="true">
      <path d="M7 4v16l13-8z" />
    </svg>
  );
}
