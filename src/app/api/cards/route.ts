import type { NextRequest } from "next/server";
import { getCards } from "@/lib/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 100;

/**
 * GET /api/cards?ids=a,b,c → CardItem[] (sold included, hidden excluded).
 * Used by the saved page: saved ids live in the browser, card data comes from here.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];

  if (ids.length > MAX_IDS) return Response.json({ error: `at most ${MAX_IDS} ids` }, { status: 400 });
  if (ids.some((id) => !UUID.test(id))) return Response.json({ error: "invalid id" }, { status: 400 });
  if (!ids.length) return Response.json([]);

  const items = await getCards({ ids, includeSold: true, limit: MAX_IDS });
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}
