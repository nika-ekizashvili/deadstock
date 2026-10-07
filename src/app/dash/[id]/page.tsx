import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db, schema } from "@/db";
import { displayTitle } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { publicUrl } from "@/lib/storage";
import { T } from "../copy";
import { EditScreen } from "./EditScreen";

export const metadata: Metadata = { title: "DEADSTOCK — SHOP PANEL", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditListing({ params }: PageProps<"/dash/[id]">) {
  const session = await getSession();
  if (!session) redirect("/sell");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const l = await db().query.listings.findFirst({
    where: and(eq(schema.listings.id, id), eq(schema.listings.shopId, session.shopId)),
    with: { images: { orderBy: asc(schema.listingImages.position) } },
  });
  if (!l) notFound();

  const title = displayTitle(l);
  return (
    <EditScreen
      id={l.id}
      title={title.fallback && title.text === "—" ? T.untitled : title.text}
      titleFallback={title.fallback}
      caption={l.caption}
      permalink={l.permalink}
      status={l.status}
      priceGel={l.priceGel}
      size={l.size}
      images={l.images.map((im) => publicUrl(im.storageKey))}
      siteHref={l.review === "approved" && l.status !== "hidden" ? `/i/${l.id}` : null}
    />
  );
}
