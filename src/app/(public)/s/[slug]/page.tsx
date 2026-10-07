import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { Icon, PATHS } from "@/components/icons";
import { ListingGrid } from "@/components/ListingGrid";
import { shopTone } from "@/lib/catalog";
import { t } from "@/lib/copy";
import { getCards } from "@/lib/queries";
import { publicUrl } from "@/lib/storage";
import { ShareButton } from "./ShareButton";
import s from "./shop.module.css";

/** Page strings (to be merged into lib/copy.ts). Status words stay Latin. */
const T = t.shopPage;

/** First letter for the avatar fallback. Latin is uppercased; Georgian stays Mkhedruli (no Mtavruli caps). */
function initial(name: string) {
  const c = Array.from(name.trim())[0] ?? "";
  return /[a-z]/.test(c) ? c.toUpperCase() : c;
}

const getShop = cache(async (slug: string) => {
  const shop = await db().query.shops.findFirst({
    where: eq(schema.shops.slug, slug),
    with: { instagram: { columns: { username: true } } },
  });
  return shop && shop.status === "active" ? shop : null;
});

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const shop = await getShop((await params).slug);
  if (!shop) return {};
  return { title: shop.name, description: shop.bio ?? undefined };
}

/**
 * On a shop subdomain "/" is the shop itself (proxy.ts), so links to the
 * marketplace home must point at the root domain.
 */
async function homeHref() {
  const root = (process.env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
  const h = await headers();
  const host = (h.get("host") ?? "").toLowerCase();
  if (!host.endsWith(`.${root}`)) return "/";
  const proto = h.get("x-forwarded-proto") ?? (root.startsWith("localhost") ? "http" : "https");
  return `${proto}://${root}/`;
}

/** Shop page (handoff: Shop-375, Shop-1440, Shop-375-Empty). Served at [slug].deadstock.ge via proxy.ts, or /s/[slug]. */
export default async function ShopPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();

  const [items, home] = await Promise.all([getCards({ shopId: shop.id, includeSold: true, limit: 200 }), homeHref()]);
  const available = items.filter((it) => it.status === "available" || it.status === "reserved");
  const sold = items.filter((it) => it.status === "sold");
  const ig = shop.instagram?.username;
  const avatar = shop.avatarKey ? publicUrl(shop.avatarKey) : null;

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <div className={s.barInner}>
          <a href={home} className={s.mark}>DEADSTOCK</a>
          <span aria-hidden="true" className={s.slash}>/</span>
          <span className={s.slug}>{shop.slug}</span>
        </div>
      </div>

      <header className={s.head}>
        <div className={s.avatar} style={avatar ? undefined : { backgroundColor: shopTone(shop.slug) }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" />
          ) : (
            <span aria-hidden="true">{initial(shop.name)}</span>
          )}
        </div>

        <div className={s.info}>
          <h1 className={s.name}>{shop.name}</h1>
          {shop.bio && <p className={s.bio}>{shop.bio}</p>}
          <div className={s.stats}>
            {shop.address && (
              <span title={T.address} className={s.stat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={PATHS.pin} />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                {shop.address}
              </span>
            )}
            {available.length > 0 && (
              <span title={T.available} className={`${s.stat} ${s.num} ${s.numOn}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
                  <circle cx="7.5" cy="7.5" r="1.5" />
                </svg>
                <span className="ds-sr">{T.available}: </span>
                {available.length}
              </span>
            )}
            {sold.length > 0 && (
              <span title={T.sold} className={`${s.stat} ${s.num}`}>
                <span className={s.miniStamp} aria-hidden="true">SOLD</span>
                <span className="ds-sr">{T.sold}: </span>
                {sold.length}
              </span>
            )}
          </div>
        </div>

        <div className={s.actions}>
          {ig && (
            <a
              href={`https://instagram.com/${ig}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`ds-btn ds-p ${s.igBtn}`}
              aria-label={`@${ig} — ${T.instagram}`}
            >
              @{ig}
              <Icon d={PATHS.external} size={16} strokeWidth={2.5} />
            </a>
          )}
          <ShareButton title={shop.name} label={T.share} copiedLabel={T.copied} className={`ds-btn ds-s ${s.shareBtn}`} />
        </div>
      </header>

      <main className={s.main}>
        <section aria-label={T.available} className={s.section}>
          {available.length ? (
            <ListingGrid items={available} />
          ) : (
            <div role="status" aria-label={T.noneAvailable} className={s.empty}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ds-lime)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
                <circle cx="7.5" cy="7.5" r="1.5" />
              </svg>
              <span className={s.emptyZero}>0</span>
              <span className={s.emptyNote}>{T.nextDrop}</span>
            </div>
          )}
        </section>

        {sold.length > 0 && (
          <section aria-label={T.sold} className={`${s.section} ${s.soldSection}`}>
            <div className={s.soldHead}>
              <span className={s.soldStamp} aria-hidden="true">SOLD</span>
              <span className="ds-sr">{T.sold}: </span>
              <span className={s.soldN}>{sold.length}</span>
            </div>
            <ListingGrid items={sold} />
          </section>
        )}
      </main>

      <footer className={s.foot}>
        <div className={s.footInner}>
          <a href={home} className={s.footMark} aria-label={t.homeLabel}>DEADSTOCK</a>
          <Link href={home} className={s.footLink}>{T.allShops}</Link>
        </div>
      </footer>
    </div>
  );
}
