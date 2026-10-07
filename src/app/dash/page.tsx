import { asc, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, schema } from "@/db";
import { env } from "@/env";
import { Icon } from "@/components/icons";
import { displayTitle, shopTone } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { publicUrl } from "@/lib/storage";
import { setReview, setStatus, syncNow, toggleAutoPublish } from "./actions";
import { CopyLink } from "./CopyLink";
import { DashHeader } from "./DashHeader";
import { ago, ICON, T, TONES } from "./copy";
import s from "./dash.module.css";

export const metadata: Metadata = { title: "DEADSTOCK — SHOP PANEL", robots: { index: false } };

type Status = (typeof schema.listingStatus.enumValues)[number];
type Review = (typeof schema.reviewState.enumValues)[number];

const STATUS: Record<Status, { t: string; c: string }> = {
  available: { t: "LIVE", c: s.bLive },
  reserved: { t: "HOLD", c: s.bHold },
  sold: { t: "SOLD", c: s.bSold },
  hidden: { t: "HIDDEN", c: s.bHidden },
};
const REVIEW: Record<Review, { t: string; c: string }> = {
  pending: { t: "NEW", c: s.bNew },
  approved: { t: "✓", c: s.bOk },
  rejected: { t: "✕", c: s.bNo },
};

/** Shop URL as shown ("slug.deadstock.ge") and as linked (with APP_URL's protocol). */
function shopUrl(slug: string) {
  const e = env();
  const host = `${slug}.${e.ROOT_DOMAIN}`;
  return { host, href: `${new URL(e.APP_URL).protocol}//${host}` };
}

type Row = {
  id: string;
  img: string | null;
  tone: string;
  sold: boolean;
};

function Thumb({ r, className }: { r: Row; className: string }) {
  return (
    <span className={`${className} ${r.sold ? s.thumbSold : ""}`} style={{ background: r.tone }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- our own bucket, no optimizer */}
      {r.img && <img src={r.img} alt="" loading="lazy" decoding="async" />}
    </span>
  );
}

function ApproveReject({ id, size, only }: { id: string; size: "card" | "row"; only?: "approve" }) {
  return (
    <>
      <form action={setReview.bind(null, id, "approved")} className={size === "card" ? s.cardForm : undefined}>
        <button className={`ds-btn ds-p ${s.approve} ${size === "row" ? s.rowBtn : ""}`} aria-label={T.approve} title={T.approve}>
          <Icon d={ICON.check} size={18} strokeWidth={2.6} />
        </button>
      </form>
      {only !== "approve" && (
        <form action={setReview.bind(null, id, "rejected")} className={size === "card" ? s.cardForm : undefined}>
          <button className={`ds-btn ${s.reject} ${size === "row" ? s.rowBtn : ""}`} aria-label={T.reject} title={T.reject}>
            <Icon d={ICON.close} size={18} strokeWidth={2.4} />
          </button>
        </form>
      )}
    </>
  );
}

function SoldBtn({ id }: { id: string }) {
  return (
    <form action={setStatus.bind(null, id, "sold")}>
      <button className={`ds-btn ds-s ${s.soldBtn}`} aria-label={T.markSold} title={T.markSold}>
        <span aria-hidden="true" className={s.stampSm}>SOLD</span>
      </button>
    </form>
  );
}

export default async function Dash() {
  const session = await getSession();
  if (!session) redirect("/sell");

  const shop = await db().query.shops.findFirst({
    where: eq(schema.shops.id, session.shopId),
    with: { instagram: true },
  });
  if (!shop) notFound();

  const [items, [{ n: total }], lastRun] = await Promise.all([
    db().query.listings.findMany({
      where: eq(schema.listings.shopId, shop.id),
      orderBy: desc(schema.listings.postedAt),
      limit: 300,
      with: { images: { orderBy: asc(schema.listingImages.position), limit: 1 } },
    }),
    db().select({ n: count() }).from(schema.listings).where(eq(schema.listings.shopId, shop.id)),
    shop.instagram
      ? db().query.syncRuns.findFirst({
          where: eq(schema.syncRuns.accountId, shop.instagram.id),
          orderBy: desc(schema.syncRuns.startedAt),
        })
      : Promise.resolve(undefined),
  ]);

  const auto = shop.instagram?.autoPublish ?? false;
  const running = lastRun != null && lastRun.finishedAt == null;
  const lastSync = shop.instagram?.lastSyncedAt ?? lastRun?.finishedAt ?? null;
  const syncText = `${running ? T.syncRunning : lastSync ? ago(lastSync) : T.syncNever} · ${total}`;
  const syncError = !running && lastRun?.error ? lastRun.error : null;
  const url = shopUrl(shop.slug);
  const live = shop.status === "active";

  const rows = items.map((l, i) => {
    const title = displayTitle(l);
    const price = l.priceGel != null ? `${Number(l.priceGel)} ₾` : null;
    const img = l.images[0];
    return {
      l,
      id: l.id,
      title: title.fallback && title.text === "—" ? T.untitled : title.text,
      fallback: title.fallback,
      price,
      meta: [price ?? T.noPrice, l.size ? `${T.size} ${l.size}` : null].filter(Boolean).join(" · "),
      img: img ? publicUrl(img.storageKey) : null,
      tone: TONES[i % TONES.length],
      sold: l.status === "sold",
      canSell: l.status !== "sold" && l.status !== "hidden" && l.review === "approved",
    };
  });
  const pending = rows.filter((r) => r.l.review === "pending");

  const statusPill = (cls: string) => (
    <span className={`${s.livePill} ${cls}`}>
      <span className={s.liveDot} style={{ background: live ? "var(--ds-lime)" : "var(--ds-faint)" }} />
      {live ? T.live : T.paused}
    </span>
  );

  return (
    <>
      <DashHeader />
      <main className={s.main}>
        {/* ---- Shop card ---- */}
        <section className={s.card}>
          <div className={s.ident}>
            {shop.avatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={s.avatar} src={publicUrl(shop.avatarKey)} alt="" />
            ) : (
              <span className={s.avatar} style={{ background: shopTone(shop.slug) }} />
            )}
            <div className={s.identText}>
              <div className={s.nameRow}>
                <h1 className={s.name}>{shop.name}</h1>
                {statusPill(s.desk)}
              </div>
              <div className={s.linkRow}>
                <a href={url.href} className={s.shopLink} target="_blank" rel="noopener">
                  {url.host} ↗
                </a>
                <CopyLink url={url.href} />
              </div>
            </div>
          </div>

          <div className={`${s.metaRow} ${s.mob}`}>
            {statusPill("")}
            <span title={T.syncMetaTitle}>{syncText}</span>
          </div>

          <div className={s.controls}>
            <div className={`${s.syncMeta} ${s.desk}`} title={T.syncMetaTitle}>
              <span className={s.syncMetaLabel}>{T.syncLabel}</span>
              <span className={s.syncMetaValue}>{syncText}</span>
            </div>
            <form action={syncNow}>
              <button className={`ds-btn ${s.syncBtn}`} aria-label={T.syncNow} title={T.syncNow} disabled={running}>
                <Icon d={ICON.sync} size={16} />
                <span className={s.mobInline}>{T.syncLabel}</span>
              </button>
            </form>
            <form action={toggleAutoPublish.bind(null, !auto)}>
              <button role="switch" aria-checked={auto} className={`ds-btn ${s.autoBtn}`} title={T.autoTitle}>
                <span className={`${s.track} ${auto ? s.trackOn : ""}`}>
                  <span className={s.knob} />
                </span>
                {T.auto}
              </button>
            </form>
          </div>

          {syncError && (
            <p role="alert" className={s.syncErr}>
              <Icon d={ICON.warn} size={16} />
              <span>
                <strong>{T.syncFailed}</strong>
                <span className={s.syncErrMsg}>{syncError}</span>
              </span>
            </p>
          )}
        </section>

        {/* ---- Review queue ---- */}
        <section className={s.sec}>
          <div className={s.secHead}>
            <h2 className={s.h2}>{T.pendingH}</h2>
            <span className={`${s.count} ${pending.length ? s.countOn : ""}`}>{pending.length}</span>
          </div>
          {pending.length ? (
            <div className={s.pendingGrid}>
              {pending.map((r) => (
                <div key={r.l.id} className={s.pCard}>
                  <Thumb r={r} className={s.pThumb} />
                  <div className={s.pBody}>
                    <Link href={`/dash/${r.l.id}`} className={`${s.pTitle} ${r.fallback ? s.muted : ""}`}>
                      {r.title} ↗
                    </Link>
                    <span className={s.pMeta}>{r.meta}</span>
                    <div className={s.pActions}>
                      <ApproveReject id={r.l.id} size="card" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={s.allGood}>
              <Icon d={ICON.check} size={20} strokeWidth={2.5} style={{ color: "var(--ds-lime)" }} />
              <span>{T.allGood}</span>
            </div>
          )}
        </section>

        {/* ---- All items: list (mobile) / table (desktop) ---- */}
        <section className={s.sec}>
          <div className={s.secHead}>
            <h2 className={s.h2}>{T.allH}</h2>
          </div>

          <div className={`${s.list} ${s.mob}`}>
            {rows.map((r) => (
              <div key={r.l.id} className={s.row}>
                <Thumb r={r} className={s.rThumb} />
                <div className={s.rBody}>
                  <Link href={`/dash/${r.l.id}`} className={`${s.rTitle} ${r.fallback ? s.muted : ""}`}>
                    {r.title} ↗
                  </Link>
                  <span className={s.rMeta}>{r.meta}</span>
                  <div className={s.badges}>
                    <span className={`${s.badge} ${STATUS[r.l.status].c}`}>{STATUS[r.l.status].t}</span>
                    <span className={`${s.badge} ${REVIEW[r.l.review].c}`}>{REVIEW[r.l.review].t}</span>
                  </div>
                </div>
                <div className={s.rActions}>
                  {r.canSell && <SoldBtn id={r.l.id} />}
                  {r.l.review === "rejected" && <ApproveReject id={r.l.id} size="row" only="approve" />}
                </div>
              </div>
            ))}
          </div>

          <div className={`${s.tableWrap} ${s.desk}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{T.colItem}</th>
                  <th scope="col" className={s.right}>₾</th>
                  <th scope="col">{T.size}</th>
                  <th scope="col"><span className="ds-sr">{T.status}</span></th>
                  <th scope="col"><span className="ds-sr">{T.approve}</span></th>
                  <th scope="col"><span className="ds-sr">{T.edit}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.l.id}>
                    <td>
                      <div className={s.tItem}>
                        <Thumb r={r} className={s.tThumb} />
                        <Link href={`/dash/${r.l.id}`} className={`${s.tTitle} ${r.fallback ? s.muted : ""}`}>
                          {r.title} ↗
                        </Link>
                      </div>
                    </td>
                    <td className={`${s.tPrice} ${!r.price ? s.muted : r.sold ? s.struck : ""}`}>{r.price ?? "—"}</td>
                    <td className={`${s.tSize} ${!r.l.size ? s.muted : ""}`}>{r.l.size ?? "—"}</td>
                    <td><span className={`${s.badge} ${STATUS[r.l.status].c}`}>{STATUS[r.l.status].t}</span></td>
                    <td><span className={`${s.badge} ${REVIEW[r.l.review].c}`}>{REVIEW[r.l.review].t}</span></td>
                    <td>
                      <div className={s.tActions}>
                        {r.l.review === "pending" && <ApproveReject id={r.l.id} size="row" />}
                        {r.l.review === "rejected" && <ApproveReject id={r.l.id} size="row" only="approve" />}
                        {r.canSell && <SoldBtn id={r.l.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
