import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/session";
import { setReview, setStatus, syncNow, toggleAutoPublish } from "./actions";

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  const { error } = await searchParams;

  if (!session) {
    return (
      <main>
        <h1>DEADSTOCK for shops</h1>
        <p>Connect your Instagram Business or Creator account. Your posts become listings automatically.</p>
        {error && <p style={{ color: "crimson" }}>Login failed, try again.</p>}
        <a href="/api/instagram/connect">Connect Instagram</a>
      </main>
    );
  }

  const shop = await db().query.shops.findFirst({
    where: eq(schema.shops.id, session.shopId),
    with: { instagram: true },
  });
  if (!shop) return <main>Shop not found.</main>;

  const items = await db().query.listings.findMany({
    where: eq(schema.listings.shopId, shop.id),
    orderBy: desc(schema.listings.postedAt),
    limit: 100,
  });
  const lastRun = shop.instagram
    ? await db().query.syncRuns.findFirst({
        where: eq(schema.syncRuns.accountId, shop.instagram.id),
        orderBy: desc(schema.syncRuns.startedAt),
      })
    : undefined;
  const pending = items.filter((i) => i.review === "pending");

  return (
    <main>
      <h1>{shop.name}</h1>
      <p className="muted">
        Page: <a href={`/s/${shop.slug}`}>{shop.slug}.deadstock.ge</a> · status {shop.status} · last sync{" "}
        {lastRun?.finishedAt?.toLocaleString() ?? "running…"}
        {lastRun?.error && ` · error: ${lastRun.error}`}
      </p>
      <form action={syncNow}><button>Sync now</button></form>
      <form action={toggleAutoPublish.bind(null, !shop.instagram?.autoPublish)}>
        <button>Auto-publish: {shop.instagram?.autoPublish ? "ON" : "OFF"}</button>
      </form>

      <h2>Review queue ({pending.length})</h2>
      <table>
        <thead><tr><th>Title</th><th>Price</th><th>Size</th><th>Status</th><th>Review</th><th /></tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td><a href={i.permalink}>{i.title ?? "(no title)"}</a></td>
              <td>{i.priceGel ?? "—"}</td>
              <td>{i.size ?? "—"}</td>
              <td>{i.status}</td>
              <td>{i.review}</td>
              <td>
                {i.review !== "approved" && <form action={setReview.bind(null, i.id, "approved")}><button>Approve</button></form>}
                {i.review !== "rejected" && <form action={setReview.bind(null, i.id, "rejected")}><button>Reject</button></form>}
                {i.status !== "sold" && <form action={setStatus.bind(null, i.id, "sold")}><button>Mark sold</button></form>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action="/api/logout" method="post"><button>Log out</button></form>
    </main>
  );
}
