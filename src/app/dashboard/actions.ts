"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { enqueueSync } from "@/lib/queue";
import { getSession } from "@/lib/session";

async function requireShop() {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.shopId;
}

const ownListing = (shopId: string, id: string) =>
  and(eq(schema.listings.id, id), eq(schema.listings.shopId, shopId));

export async function setReview(id: string, review: "approved" | "rejected") {
  const shopId = await requireShop();
  await db().update(schema.listings).set({ review }).where(ownListing(shopId, id));
  revalidatePath("/dashboard");
}

export async function setStatus(id: string, status: "available" | "reserved" | "sold" | "hidden") {
  const shopId = await requireShop();
  await db()
    .update(schema.listings)
    .set({ status, manualOverride: true, soldAt: status === "sold" ? new Date() : null })
    .where(ownListing(shopId, id));
  revalidatePath("/dashboard");
}

export async function toggleAutoPublish(on: boolean) {
  const shopId = await requireShop();
  await db()
    .update(schema.instagramAccounts)
    .set({ autoPublish: on })
    .where(eq(schema.instagramAccounts.shopId, shopId));
  revalidatePath("/dashboard");
}

export async function syncNow() {
  const shopId = await requireShop();
  const acc = await db().query.instagramAccounts.findFirst({
    where: eq(schema.instagramAccounts.shopId, shopId),
  });
  if (acc) await enqueueSync(acc.id, false);
  revalidatePath("/dashboard");
}
