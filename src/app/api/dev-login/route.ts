import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { setSession } from "@/lib/session";

/**
 * DEV ONLY: sign in as a seeded shop without Instagram, e.g. /api/dev-login?slug=dzveli-karada
 * (optional &to=/dash/<listing id>).
 * Returns 404 in production.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const shop = slug
    ? await db().query.shops.findFirst({ where: eq(schema.shops.slug, slug), columns: { id: true } })
    : undefined;
  if (!shop) return new NextResponse(`No shop with slug "${slug}"`, { status: 404 });
  await setSession(shop.id);
  // Also usable inside an iframe (375px screenshot harness): re-issue as SameSite=None.
  // Chrome accepts Secure cookies on http://localhost.
  const jar = await cookies();
  const v = jar.get("ds_session")?.value;
  if (v) jar.set("ds_session", v, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 60 * 60 * 24 * 30 });
  const to = req.nextUrl.searchParams.get("to") ?? "";
  return NextResponse.redirect(new URL(/^\/dash(\/[\w-]+)?$/.test(to) ? to : "/dash", req.nextUrl.origin));
}
