import Link from "next/link";
import { Icon, PATHS, PlayIcon } from "@/components/icons";
import { SaveButton } from "@/components/SaveButton";
import { priceText } from "@/lib/catalog";
import { t } from "@/lib/copy";
import type { CardItem } from "@/lib/queries";

/** Listing card (handoff: Cards → 08 LISTING CARD). No text on the photo except the price tag. */
export function ListingCard({ item, priority = false }: { item: CardItem; priority?: boolean }) {
  const sold = item.status === "sold";
  return (
    <div className="ds-card-wrap">
      <Link href={`/i/${item.id}`} className={`ds-card${sold ? " ds-card--sold" : ""}`}>
        <div className="ds-card__media">
          {item.imageUrl ? (
            // Images come from our own bucket; plain <img> keeps them off the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
          ) : (
            <div className="ds-card__nophoto" aria-hidden="true">DS</div>
          )}
          {item.isVideo && (
            <span className="ds-video" title={t.video}>
              <PlayIcon />
            </span>
          )}
          {item.status === "reserved" && (
            <span className="ds-hold" title={t.onHold} role="img" aria-label={t.onHold}>
              <Icon d={PATHS.hourglass} strokeWidth={2.2} />
            </span>
          )}
          {sold && <span className="ds-stamp">SOLD</span>}
          <span className={`ds-tag${sold ? " ds-tag--sold" : ""}`} title={item.priceGel == null ? t.priceInDm : undefined}>
            {priceText(item.priceGel)}
          </span>
        </div>
        <div className="ds-card__body">
          <span className={`ds-card__title${item.titleFallback ? " ds-card__title--fallback" : ""}`}>{item.title}</span>
          <span className="ds-card__meta">
            {item.size && <span className="ds-size">{item.size}</span>}
            <span
              className="ds-avatar-dot"
              style={
                item.shop.avatarUrl
                  ? { backgroundImage: `url(${item.shop.avatarUrl})` }
                  : { background: item.shop.tone }
              }
            />
            <span className="ds-card__shop">{item.shop.name}</span>
          </span>
        </div>
      </Link>
      {!sold && <SaveButton id={item.id} />}
    </div>
  );
}
