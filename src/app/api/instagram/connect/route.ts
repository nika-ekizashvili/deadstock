import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/instagram/client";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("ig_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return NextResponse.redirect(authorizeUrl(state));
}
