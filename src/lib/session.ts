import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/env";

const COOKIE = "ds_session";
const MAX_AGE = 60 * 60 * 24 * 30;

type Session = { shopId: string; exp: number };

function sign(data: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(data).digest("base64url");
}

export async function setSession(shopId: string) {
  const payload = Buffer.from(
    JSON.stringify({ shopId, exp: Date.now() + MAX_AGE * 1000 } satisfies Session),
  ).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  return s.exp > Date.now() ? s : null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
