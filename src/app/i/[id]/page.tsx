import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { publicUrl } from "@/lib/storage";

export default async function ItemPage({ params }: PageProps<"/i/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const item = await db().query.listings.findFirst({
    where: eq(schema.listings.id, id),
    with: { shop: { with: { instagram: true } }, images: { orderBy: (t, { asc }) => asc(t.position) } },
  });
  if (!item || item.review !== "approved" || item.status === "hidden") notFound();
  const username = item.shop.instagram?.username;

  return (
    <main>
      <p><a href={`/s/${item.shop.slug}`}>← {item.shop.name}</a></p>
      <h1>{item.title ?? "Untitled"}</h1>
      <p>
        <strong>{item.priceGel ? `${Number(item.priceGel)} ₾` : "Price on request"}</strong>
        {item.size && ` · Size ${item.size}`}
        {item.condition && ` · Condition ${item.condition}`}
        {` · ${item.status.toUpperCase()}`}
      </p>
      <div className="grid">
        {item.images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={publicUrl(img.storageKey)} alt="" style={{ width: "100%" }} />
        ))}
      </div>
      <p>
        {username && item.status !== "sold" && <a href={`https://ig.me/m/${username}`}>Message on Instagram</a>}
        {" · "}
        <a href={item.permalink}>View original post</a>
      </p>
      {item.caption && <pre style={{ whiteSpace: "pre-wrap" }}>{item.caption}</pre>}
    </main>
  );
}
