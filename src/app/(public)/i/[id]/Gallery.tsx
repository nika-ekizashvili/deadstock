"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import s from "./item.module.css";

const L = {
  photo: (n: number) => `ფოტო ${n}`,
  prev: "წინა ფოტო",
  next: "შემდეგი ფოტო",
};

/**
 * Photo gallery. One scroll-snap strip for both widths:
 * mobile swipes (tap the left/right 30% to step, dots below), desktop adds thumbnails and arrows.
 * `children` are the overlays drawn on the photo (tag, stamp, hold, play).
 */
export function Gallery({
  images,
  alt,
  sold,
  children,
}: {
  images: string[];
  alt: string;
  sold: boolean;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = images.length;
  const multi = n > 1;

  function go(k: number) {
    const el = ref.current;
    if (!el || !n) return;
    const to = ((k % n) + n) % n;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: to * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setI(to);
  }

  function onScroll() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const k = Math.round(el.scrollLeft / el.clientWidth);
    if (k !== i && k >= 0 && k < n) setI(k);
  }

  // Tap zones (Item-375): left 30% = previous, right 30% = next. Mobile only.
  function onTap(e: MouseEvent<HTMLDivElement>) {
    if (!multi || window.matchMedia("(min-width: 900px)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 0.3) go(i - 1);
    else if (x > 0.7) go(i + 1);
  }

  return (
    <div className={`${s.gallery}${multi ? ` ${s.multi}` : ""}${sold ? ` ${s.sold}` : ""}`}>
      {multi && (
        <div className={s.thumbs}>
          {images.map((src, k) => (
            <button
              key={src}
              type="button"
              className={`ds-btn ${s.thumb}`}
              aria-label={L.photo(k + 1)}
              aria-pressed={k === i}
              onClick={() => go(k)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      <div className={s.stage}>
        {n ? (
          <div ref={ref} className={s.scroller} onScroll={onScroll} onClick={onTap}>
            {images.map((src, k) => (
              <div key={src} className={s.slide}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={multi ? `${alt} — ${L.photo(k + 1)}` : alt}
                  loading={k === 0 ? "eager" : "lazy"}
                  fetchPriority={k === 0 ? "high" : undefined}
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={s.noPhoto} aria-hidden="true">DS</div>
        )}

        {children}

        {multi && (
          <>
            <span className={s.counter}>
              {i + 1} / {n}
            </span>
            <button type="button" className={`ds-btn ${s.arrow} ${s.arrowPrev}`} aria-label={L.prev} onClick={() => go(i - 1)}>
              <Icon d="m15 18-6-6 6-6" />
            </button>
            <button type="button" className={`ds-btn ${s.arrow} ${s.arrowNext}`} aria-label={L.next} onClick={() => go(i + 1)}>
              <Icon d="m9 18 6-6-6-6" />
            </button>
          </>
        )}
      </div>

      {multi && (
        <div className={s.dots} aria-hidden="true">
          {images.map((src, k) => (
            <span key={src} className={`${s.dot}${k === i ? ` ${s.dotOn}` : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}
