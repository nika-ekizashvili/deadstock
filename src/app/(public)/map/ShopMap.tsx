"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, PATHS } from "@/components/icons";
import { GoogleLayer, MAPS_KEY } from "./GoogleLayer";
import s from "./map.module.css";

const T = {
  title: "თრიფთ-კრაული",
  back: "უკან",
  shops: "მაღაზიები",
  map: "რუკა",
  shop: "მაღაზია",
  route: "მარშრუტი",
  items: "ITEMS",
  empty: "რუკაზე ჯერ მაღაზიები არ არის.",
};

export type MapShop = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  /** Position inside the shops' bounding box, 0..1 (west→east, north→south). Illustrated map only. */
  u: number;
  v: number;
  /** Available + reserved items. */
  n: number;
  tone: string;
  avatarUrl: string | null;
  items: { id: string; imageUrl: string | null; price: string; title: string }[];
};

const TAG = "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z";
const ROUTE = "m3 11 18-8-8 18-2-8z";

/** One pin (handoff: .ds-pin). Used on the illustrated canvas and inside Google Advanced Markers. */
function Pin({ shop, on, onPick }: { shop: MapShop; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      className={`${s.pin} ${on ? s.pinOn : ""}`}
      aria-label={shop.name}
      title={shop.name}
      aria-pressed={on}
      onClick={onPick}
    >
      <span className={s.pinHead}>{shop.n}</span>
      <span className={s.pinTail} />
    </button>
  );
}

function Avatar({ shop, className }: { shop: MapShop; className: string }) {
  return (
    <span
      className={className}
      style={shop.avatarUrl ? { backgroundImage: `url(${shop.avatarUrl})` } : { background: shop.tone }}
    />
  );
}

/** Selected-shop card (mobile: bottom sheet; desktop: floating card bottom-right). */
function ShopCard({ shop }: { shop: MapShop }) {
  const spacers = Math.max(0, 4 - shop.items.length);
  const route = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <Avatar shop={shop} className={s.cardAvatar} />
        <div className={s.cardText}>
          <span className={s.cardName}>{shop.name}</span>
          <span className={`${s.cardMeta} ${s.mob}`}>
            <span className={s.cardCount}>
              <Icon d={TAG} size={12} />
              {shop.n}
            </span>
            {shop.address && <span className={s.ellipsis}>{shop.address}</span>}
          </span>
          <span className={`${s.cardMeta} ${s.deskInline}`}>
            <span className={s.ellipsis}>
              {shop.n} {T.items}
              {shop.address && ` · ${shop.address}`}
            </span>
          </span>
        </div>
      </div>
      {shop.items.length > 0 && (
        <div className={s.thumbs}>
          {shop.items.map((it) => (
            <Link key={it.id} href={`/i/${it.id}`} className={s.thumb} style={{ backgroundColor: shop.tone }} title={it.title}>
              {it.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={it.title} loading="lazy" decoding="async" />
              )}
              <span className={s.thumbTag}>{it.price}</span>
            </Link>
          ))}
          {Array.from({ length: spacers }, (_, k) => (
            <span key={k} className={s.thumbSpacer} aria-hidden="true" />
          ))}
        </div>
      )}
      <div className={s.cardActions}>
        <Link href={`/s/${shop.slug}`} className={`ds-btn ds-p ${s.shopBtn}`}>
          <span className={s.mobFlex}>
            <Icon d={PATHS.shop} size={18} />
            {T.shop}
          </span>
          <span className={s.deskFlex}>
            SHOP
            <Icon d={PATHS.arrowRight} size={16} strokeWidth={2.5} />
          </span>
        </Link>
        <a
          href={route}
          target="_blank"
          rel="noopener noreferrer"
          className={`ds-btn ds-s ${s.routeBtn}`}
          aria-label={T.route}
          title={T.route}
        >
          <Icon d={ROUTE} size={20} />
        </a>
      </div>
    </div>
  );
}

/** Illustrated night-market streets, river and parks (copied from the handoff canvas). */
function Streets() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice" className={`${s.art} ${s.artMob}`}>
        <path d="M-20 120 L400 40 M-20 260 L400 300 M-20 420 L400 380 M-20 560 L400 620 M60 -10 L120 820 M200 -10 L170 820 M310 -10 L330 820 M-20 700 L400 720" stroke="#1C1C1B" strokeWidth="10" fill="none" />
        <path d="M-20 200 L400 180 M-20 340 L400 470 M30 -10 L260 820 M250 -10 L60 820" stroke="#191918" strokeWidth="5" fill="none" />
        <path d="M-30 520 C 60 470, 110 380, 170 330 S 260 210, 300 140 S 360 40, 420 0" stroke="#1D272A" strokeWidth="22" fill="none" strokeLinecap="round" />
        <rect x="210" y="430" width="90" height="70" rx="10" fill="#161D16" />
        <rect x="30" y="610" width="70" height="60" rx="10" fill="#161D16" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 1000 820" preserveAspectRatio="xMidYMid slice" className={`${s.art} ${s.artDesk}`}>
        <path d="M-20 120 L1020 60 M-20 300 L1020 340 M-20 480 L1020 420 M-20 660 L1020 700 M160 -10 L240 830 M480 -10 L440 830 M780 -10 L820 830" stroke="#1C1C1B" strokeWidth="14" fill="none" />
        <path d="M-20 210 L1020 190 M-20 390 L1020 540 M80 -10 L640 830 M640 -10 L180 830" stroke="#191918" strokeWidth="6" fill="none" />
        <path d="M-30 600 C 160 540, 300 430, 420 370 S 640 230, 760 160 S 920 50, 1040 0" stroke="#1D272A" strokeWidth="34" fill="none" strokeLinecap="round" />
        <rect x="560" y="470" width="160" height="120" rx="14" fill="#161D16" />
        <rect x="90" y="660" width="120" height="90" rx="14" fill="#161D16" />
      </svg>
    </>
  );
}

export function ShopMap({ shops }: { shops: MapShop[] }) {
  const [sel, setSel] = useState(0);
  const [google, setGoogle] = useState(Boolean(MAPS_KEY));
  const current = shops[sel];

  return (
    <main className={s.main}>
      <aside aria-label={T.shops} className={s.aside}>
        <div className={s.asideHead}>
          <h1 className={s.asideTitle}>{T.title}</h1>
          <span className={s.mono}>{shops.length}</span>
        </div>
        {shops.map((x, i) => {
          const on = i === sel;
          return (
            <button key={x.id} type="button" aria-pressed={on} onClick={() => setSel(i)} className={`${s.row} ${on ? s.rowOn : ""}`}>
              <Avatar shop={x} className={s.rowAvatar} />
              <span className={s.rowText}>
                <span className={s.rowName}>{x.name}</span>
                <span className={`${s.mono} ${s.ellipsis}`}>
                  {x.n} {T.items}
                  {x.address && ` · ${x.address}`}
                </span>
              </span>
            </button>
          );
        })}
        {shops.length === 0 && <p className={s.mono}>{T.empty}</p>}
      </aside>

      <section aria-label={T.map} className={s.stage}>
        <Streets />

        {google ? (
          <GoogleLayer
            points={shops}
            sel={sel}
            onFail={() => setGoogle(false)}
            renderPin={(i) => <Pin shop={shops[i]} on={i === sel} onPick={() => setSel(i)} />}
          />
        ) : (
          shops.map((x, i) => (
            <span
              key={x.id}
              className={s.spot}
              style={{ "--u": x.u, "--v": x.v, zIndex: i === sel ? 4 : 2 } as React.CSSProperties}
            >
              <Pin shop={x} on={i === sel} onPick={() => setSel(i)} />
            </span>
          ))
        )}

        <div className={s.topbar}>
          <Link href="/" className={s.back} aria-label={T.back} title={T.back}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
          <div className={s.pill}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ds-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={PATHS.pin} />
            </svg>
            <h1 className={s.pillTitle}>{T.title}</h1>
            <span className={s.pillCount}>{shops.length}</span>
          </div>
        </div>

        {current ? <ShopCard shop={current} /> : <p className={`${s.card} ${s.mono}`}>{T.empty}</p>}
      </section>
    </main>
  );
}
