import { NextResponse, type NextRequest } from "next/server";

const RESERVED = new Set(["www", "app", "api", "admin", "dashboard", "static"]);

/**
 * [shop].deadstock.ge/  →  /s/[shop]
 * Local dev: use [shop].localhost:3000 (browsers resolve *.localhost to 127.0.0.1).
 */
export function proxy(req: NextRequest) {
  const root = (process.env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
  const host = (req.headers.get("host") ?? "").toLowerCase();

  if (!host.endsWith(`.${root}`)) return NextResponse.next();
  const sub = host.slice(0, -(root.length + 1));
  if (!sub || sub.includes(".") || RESERVED.has(sub)) return NextResponse.next();

  // Only the shop's root is its page; /i/... and other routes stay shared.
  if (req.nextUrl.pathname !== "/") return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/s/${sub}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
