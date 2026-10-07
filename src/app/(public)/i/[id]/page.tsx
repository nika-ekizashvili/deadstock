import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type CSSProperties } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon, PATHS, PlayIcon } from "@/components/icons";
import { CATEGORIES, displayTitle, priceText, shopTone } from "@/lib/catalog";
import { t } from "@/lib/copy";
import { publicUrl } from "@/lib/storage";
import { Gallery } from "./Gallery";
import { SaveHeart, StickyBar } from "./ItemClient";
import s from "./item.module.css";

/** Page strings (to be merged into lib/copy.ts). */
const T = t.itemPage;

const ICON_SPARK = "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z";
const ICON_BACK = "M19 12H5M12 19l-7-7 7-7";
const ICON_CLOCK_HAND = "M12 7v5l3 2";
const ICON_QUOTE = "M4 18v-5a7 7 0 0 1 7-7v3a4 4 0 0 0-4 4h4v5zM13 18v-5a7 7 0 0 1 7-7v3a4 4 0 0 0-4 4h4v5z";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public item: approved, not hidden, from an active shop. Shared by metadata + page. */
const getItem = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const item = await db().query.listings.findFirst({
    where: eq(schema.listings.id, id),
    with: {
      shop: { with: { instagram: true } },
      images: { orderBy: (img, { asc }) => asc(img.position) },
    },
  });
  if (!item || item.review !== "approved" || item.status === "hidden" || item.shop.status !== "active") return null;
  return item;
});

/** "12წთ", "2სთ", "გუშინ", "5დ". */
function ago(d: Date) {
  const min = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (min < 1) return T.justNow;
  if (min < 60) return `${min}${T.min}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}${T.hour}`;
  const days = Math.floor(h / 24);
  return days === 1 ? T.yesterday : `${days}${T.day}`;
}

export async function generateMetadata({ params }: PageProps<"/i/[id]">): Promise<Metadata> {
  const item = await getItem((await params).id);
  if (!item) return {};
  const title = displayTitle(item).text;
  const cover = item.images[0];
  return {
    title: `${title} · ${priceText(item.priceGel)} — ${item.shop.name} · DEADSTOCK`,
    description: item.caption?.slice(0, 160) ?? undefined,
    openGraph: cover ? { images: [publicUrl(cover.storageKey)] } : undefined,
  };
}

export default async function ItemPage({ params }: PageProps<"/i/[id]">) {
  const item = await getItem((await params).id);
  if (!item) notFound();

  const { shop } = item;
  const username = shop.instagram?.username;
  const sold = item.status === "sold";
  const reserved = item.status === "reserved";
  const title = displayTitle(item);
  const price = priceText(item.priceGel);
  const priceTitle = item.priceGel == null ? t.priceInDm : T.price;
  const dmHref = username ? `https://ig.me/m/${username}` : item.permalink;
  const shopHref = `/s/${shop.slug}`;
  const avatar: CSSProperties = shop.avatarKey
    ? { backgroundImage: `url(${publicUrl(shop.avatarKey)})` }
    : { background: shopTone(shop.slug) };
  const category = CATEGORIES.find((c) => c.value && c.value === item.category);
  const posted = (
    <span className={s.posted} title={T.posted}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d={ICON_CLOCK_HAND} />
      </svg>
      {ago(item.postedAt)}
    </span>
  );
  const hold = (extra = "") => (
    <span className={`${s.hold}${extra}`} title={t.onHold} role="img" aria-label={t.onHold}>
      <Icon d={PATHS.hourglass} size={17} strokeWidth={2.2} />
    </span>
  );
  const tagClass = `${s.tag}${sold ? ` ${s.tagSold}` : ""}`;

  return (
    <>
      <div className={s.deskOnly}>
        <Header />
      </div>

      <header className={s.topbar}>
        <Link href={shopHref} className={s.backLink}>
          <Icon d={ICON_BACK} />
          <span className={s.avatar} style={avatar} />
          <span className={s.backName}>{shop.name}</span>
        </Link>
      </header>

      <main className={s.main}>
        <Link href={shopHref} className={`${s.deskBack} ${s.deskOnly}`}>
          <Icon d={ICON_BACK} size={18} />
          <span className={s.avatar} style={avatar} />
          {shop.name}
        </Link>

        <div className={s.layout}>
          <Gallery images={item.images.map((img) => publicUrl(img.storageKey))} alt={title.text} sold={sold}>
            {item.isVideo && (
              <a href={item.permalink} target="_blank" rel="noopener noreferrer" className={s.play} aria-label={T.videoOnIg} title={T.videoOnIg}>
                <PlayIcon />
              </a>
            )}
            {sold && <span className={s.stamp}>SOLD</span>}
            {reserved && <span className={s.mobOnly}>{hold(` ${s.holdOnPhoto}`)}</span>}
            <span className={`${tagClass} ${s.tagOnPhoto} ${s.mobOnly}`} title={priceTitle}>
              {price}
            </span>
          </Gallery>

          <div className={s.info}>
            <div className={s.head}>
              <div className={s.statusRow}>
                {reserved && hold()}
                {sold && <span className={s.soldBadge}>SOLD</span>}
                {posted}
              </div>
              <h1 className={`${s.title}${title.fallback ? ` ${s.titleFallback}` : ""}`}>{title.text}</h1>
              <span className={`${tagClass} ${s.deskOnly}`} title={priceTitle}>
                {price}
              </span>
              <div className={s.chips}>
                {item.size && (
                  <span className={`${s.chip} ${s.chipMono}`} title={T.size}>
                    {item.size}
                  </span>
                )}
                {item.condition && (
                  <span className={s.chip} title={T.condition}>
                    <Icon d={ICON_SPARK} />
                    {item.condition}
                  </span>
                )}
                {item.brand && (
                  <span className={`${s.chip} ${s.chipBold}`} title={T.brand}>
                    {item.brand}
                  </span>
                )}
                {category && (
                  <span className={`${s.chip} ${s.chipMuted}`} title={T.category}>
                    <Icon d={category.icon} />
                    {category.one}
                  </span>
                )}
                <span className={s.mobOnly}>{posted}</span>
              </div>
            </div>

            <div className={s.actions} id="item-actions">
              {sold ? (
                <Link href={shopHref} className={`ds-btn ds-s ${s.more}`}>
                  <Icon d={PATHS.shop} size={18} />
                  {T.moreItems}
                </Link>
              ) : (
                <a href={dmHref} target="_blank" rel="noopener noreferrer" className={`ds-btn ds-p ${s.dm}`}>
                  <Icon d={PATHS.send} strokeWidth={2.2} />
                  DM
                </a>
              )}
              <SaveHeart id={item.id} />
              <a
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className={`ds-btn ds-s ${s.round}`}
                aria-label={T.originalPost}
                title={T.originalPost}
              >
                <Icon d={PATHS.external} />
              </a>
            </div>

            {item.caption && (
              <figure className={s.caption}>
                <svg className={s.quote} viewBox="0 0 24 24" fill="var(--ds-faint)" aria-hidden="true">
                  <path d={ICON_QUOTE} />
                </svg>
                <p className={s.captionText} aria-label={T.caption}>
                  {item.caption}
                </p>
              </figure>
            )}

            <Link href={shopHref} className={s.shop}>
              <span className={s.shopAvatar} style={avatar} />
              <span className={s.shopText}>
                <span className={s.shopName}>{shop.name}</span>
                {(shop.address || username) && (
                  <span className={s.shopAddr}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={PATHS.pin} />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    {shop.address ?? `@${username}`}
                  </span>
                )}
              </span>
              <Icon d={PATHS.arrowRight} stroke="var(--ds-lime)" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {!sold && (
        <StickyBar
          id={item.id}
          watch="item-actions"
          price={price}
          priceTitle={priceTitle}
          reserved={reserved}
          dmHref={dmHref}
          holdLabel={t.onHold}
        />
      )}
    </>
  );
}
