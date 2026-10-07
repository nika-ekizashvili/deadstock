"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { SIZES } from "@/lib/catalog";
import { saveListing, setStatus, type EditResult } from "../actions";
import { ICON, T } from "../copy";
import s from "./edit.module.css";

type Props = {
  id: string;
  title: string;
  titleFallback: boolean;
  caption: string | null;
  permalink: string;
  status: "available" | "reserved" | "sold" | "hidden";
  priceGel: string | null;
  size: string | null;
  images: string[];
  siteHref: string | null;
};

const STATUS_OPTS = [
  { v: "available", aria: T.available, icon: ICON.available },
  { v: "reserved", aria: T.reserved, icon: ICON.hourglass },
  { v: "sold", aria: T.sold, icon: null },
] as const;

/** Dash-Edit: price + size (inline, lime outline when empty), status, photos, caption. */
export function EditScreen(p: Props) {
  const [state, action, pending] = useActionState<EditResult | null, FormData>(saveListing.bind(null, p.id), null);
  const [price, setPrice] = useState(p.priceGel != null ? String(Number(p.priceGel)) : "");
  const [size, setSize] = useState(p.size ?? "");
  const errors = state && !state.ok ? state.errors : {};
  const isChip = (SIZES as readonly string[]).includes(size);
  const noPrice = price.trim() === "";
  const noSize = size.trim() === "";

  return (
    <>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.left}>
            <Link href="/dash" className={s.back} aria-label={T.back} title={T.back}>
              <Icon d={ICON.back} size={20} />
            </Link>
            <h1 className={s.h1}>{T.edit}</h1>
            <span className={s.wordmark} aria-hidden="true">DEADSTOCK</span>
            <span className={s.badge} aria-hidden="true">{T.shopBadgeDesk}</span>
          </div>
          <div className={s.right}>
            {p.siteHref && (
              <Link href={p.siteHref} className={`ds-btn ds-s ${s.view}`}>
                {T.viewOnSite}
                <Icon d={ICON.external} size={15} strokeWidth={2.2} />
              </Link>
            )}
            <button type="submit" form="edit-form" className={`ds-btn ds-p ${s.save}`} disabled={pending}>
              <Icon d={ICON.check} size={15} strokeWidth={3} />
              {T.save}
            </button>
          </div>
        </div>
      </header>

      <main className={s.main}>
        <section aria-label={T.photos} className={s.photos}>
          {p.images[0] && (
            <div className={s.cover}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt="" />
              <span className={s.coverTag}>COVER</span>
            </div>
          )}
          {p.images.length > 0 && (
            <div className={s.strip}>
              {p.images.map((src, i) => (
                <div key={src} className={`${s.ph} ${i === 0 ? s.phCover : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" />
                  {i === 0 && <span className={s.phTag}>COVER</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label={T.details} className={s.details}>
          <form className={s.seg} role="radiogroup" aria-label={T.status}>
            {STATUS_OPTS.map((o) => {
              const on = p.status === o.v;
              return (
                <button
                  key={o.v}
                  role="radio"
                  aria-checked={on}
                  aria-label={o.aria}
                  title={o.aria}
                  formAction={setStatus.bind(null, p.id, o.v)}
                  className={`ds-btn ${s.segBtn} ${on ? (o.v === "reserved" ? s.segOnLime : s.segOn) : ""}`}
                >
                  {o.icon ? (
                    <Icon d={o.icon} size={17} strokeWidth={2.2} />
                  ) : (
                    <span className={s.stamp}>SOLD</span>
                  )}
                </button>
              );
            })}
          </form>

          <div className={s.field}>
            <span className={s.label}>TITLE</span>
            <p className={`${s.title} ${p.titleFallback ? s.muted : ""}`}>{p.title}</p>
          </div>

          <form id="edit-form" action={action} className={s.form} noValidate>
            <div className={s.field}>
              <label htmlFor="price" className={s.label}>PRICE</label>
              <span className={`${s.priceTag} ${noPrice ? s.priceEmpty : ""}`}>
                <input
                  id="price"
                  name="price"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="?"
                  aria-label={T.price}
                  aria-invalid={errors.price ? true : undefined}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={s.priceInput}
                />
                <span className={s.lari}>₾</span>
              </span>
              {errors.price && <span role="alert" className={s.err}>{errors.price}</span>}
            </div>

            <div className={s.field}>
              <span className={s.label} id="size-l">SIZE</span>
              <input type="hidden" name="size" value={size} />
              <div className={s.sizes} role="group" aria-labelledby="size-l">
                {SIZES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    aria-pressed={size === z}
                    onClick={() => setSize(size === z ? "" : z)}
                    className={`ds-btn ${s.chip} ${size === z ? s.chipOn : ""}`}
                  >
                    {z}
                  </button>
                ))}
                <input
                  aria-label={T.customSize}
                  title={T.customSize}
                  placeholder="+"
                  maxLength={20}
                  autoComplete="off"
                  aria-invalid={errors.size ? true : undefined}
                  value={isChip ? "" : size}
                  onChange={(e) => setSize(e.target.value)}
                  className={`${s.chip} ${s.custom} ${!isChip && !noSize ? s.chipOn : ""} ${noSize ? s.chipEmpty : ""}`}
                />
              </div>
              {errors.size && <span role="alert" className={s.err}>{errors.size}</span>}
            </div>
          </form>

          {p.caption && (
            <div className={s.caption}>
              <span className={s.label}>IG CAPTION</span>
              <p>{p.caption}</p>
            </div>
          )}

          <div className={s.foot}>
            <a href={p.permalink} target="_blank" rel="noopener" className={s.ig}>
              {T.igPost} <Icon d={ICON.external} size={15} strokeWidth={2.2} />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
