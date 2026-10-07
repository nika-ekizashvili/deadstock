"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { enqueueSync } from "@/lib/queue";
import { getSession } from "@/lib/session";

/** Every action is a public POST endpoint: check the session and scope by shop. */
async function requireShop() {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.shopId;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkId(id: unknown): string {
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("Bad listing id");
  return id;
}

const ownListing = (shopId: string, id: string) =>
  and(eq(schema.listings.id, id), eq(schema.listings.shopId, shopId));

const refresh = () => revalidatePath("/dash", "layout");

const REVIEWS = ["approved", "rejected"] as const;
const STATUSES = ["available", "reserved", "sold", "hidden"] as const;

export async function setReview(id: string, review: (typeof REVIEWS)[number]) {
  const shopId = await requireShop();
  if (!REVIEWS.includes(review)) throw new Error("Bad review state");
  await db().update(schema.listings).set({ review }).where(ownListing(shopId, checkId(id)));
  refresh();
}

/** Status set by the shop wins over sync (manualOverride). */
export async function setStatus(id: string, status: (typeof STATUSES)[number]) {
  const shopId = await requireShop();
  if (!STATUSES.includes(status)) throw new Error("Bad status");
  await db()
    .update(schema.listings)
    .set({ status, manualOverride: true, soldAt: status === "sold" ? new Date() : null })
    .where(ownListing(shopId, checkId(id)));
  refresh();
}

export async function toggleAutoPublish(on: boolean) {
  const shopId = await requireShop();
  await db()
    .update(schema.instagramAccounts)
    .set({ autoPublish: on === true })
    .where(eq(schema.instagramAccounts.shopId, shopId));
  refresh();
}

export async function syncNow() {
  const shopId = await requireShop();
  const acc = await db().query.instagramAccounts.findFirst({
    where: eq(schema.instagramAccounts.shopId, shopId),
  });
  if (acc) await enqueueSync(acc.id, false);
  refresh();
}

export type ListingEdit = { priceGel: string | number | null; size: string | null };
export type EditErrors = { price?: string; size?: string };
export type EditResult = { ok: true } | { ok: false; errors: EditErrors };

const MAX_PRICE = 100_000;
const MAX_SIZE = 20;

/** Validation messages are shown under the fields (Georgian; dashboard is ka-only). */
const E = {
  price: `ფასი — მთელი ლარი, 0–${MAX_PRICE}`,
  size: `ზომა — მაქს. ${MAX_SIZE} სიმბოლო`,
};

/**
 * Price: whole lari 0–100000, or empty → null. Size: up to 20 characters, empty → null.
 * `searchText` is left as is.
 */
export async function updateListing(id: string, input: ListingEdit): Promise<EditResult> {
  const shopId = await requireShop();
  const errors: EditErrors = {};

  const rawPrice = input.priceGel == null ? "" : String(input.priceGel).trim().replace(/\s+/g, "");
  let priceGel: string | null = null;
  if (rawPrice !== "") {
    const n = /^\d+$/.test(rawPrice) ? Number(rawPrice) : NaN;
    if (!Number.isInteger(n) || n < 0 || n > MAX_PRICE) errors.price = E.price;
    else priceGel = String(n);
  }

  const rawSize = (input.size ?? "").trim().replace(/\s+/g, " ");
  if (rawSize.length > MAX_SIZE) errors.size = E.size;
  const size = rawSize === "" ? null : rawSize;

  if (errors.price || errors.size) return { ok: false, errors };

  await db().update(schema.listings).set({ priceGel, size }).where(ownListing(shopId, checkId(id)));
  refresh();
  return { ok: true };
}

/** Form wrapper for the edit screen (useActionState): saves, then back to the dashboard. */
export async function saveListing(id: string, _prev: EditResult | null, form: FormData): Promise<EditResult> {
  const res = await updateListing(id, {
    priceGel: form.get("price")?.toString() ?? null,
    size: form.get("size")?.toString() ?? null,
  });
  if (!res.ok) return res;
  redirect("/dash");
}
