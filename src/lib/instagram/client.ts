/**
 * Instagram API with Instagram Login (Business/Creator accounts).
 * Docs: developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 * Scope needed: instagram_business_basic (requires Meta app review for public use).
 */
import { env } from "@/env";

const GRAPH = "https://graph.instagram.com";

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: { id: string; media_type: string; media_url?: string; thumbnail_url?: string }[] };
};

export type IgProfile = {
  user_id: string;
  username: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(`Instagram API ${res.status}: ${msg}`);
  }
  return body as T;
}

export function authorizeUrl(state: string): string {
  const e = env();
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", e.IG_APP_ID);
  u.searchParams.set("redirect_uri", `${e.APP_URL}/api/instagram/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "instagram_business_basic");
  u.searchParams.set("state", state);
  return u.toString();
}

/** code → short-lived token → long-lived token (~60 days). */
export async function exchangeCode(code: string) {
  const e = env();
  const form = new URLSearchParams({
    client_id: e.IG_APP_ID,
    client_secret: e.IG_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: `${e.APP_URL}/api/instagram/callback`,
    code,
  });
  const short = await getJson<{ access_token?: string; user_id?: string | number; data?: { access_token: string; user_id: string | number }[] }>(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body: form },
  );
  const shortToken = short.access_token ?? short.data?.[0]?.access_token;
  if (!shortToken) throw new Error("No access token in Instagram response");

  const long = await getJson<{ access_token: string; expires_in: number }>(
    `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(e.IG_APP_SECRET)}&access_token=${encodeURIComponent(shortToken)}`,
  );
  return { accessToken: long.access_token, expiresAt: new Date(Date.now() + long.expires_in * 1000) };
}

export async function refreshToken(token: string) {
  const r = await getJson<{ access_token: string; expires_in: number }>(
    `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
  );
  return { accessToken: r.access_token, expiresAt: new Date(Date.now() + r.expires_in * 1000) };
}

export async function getProfile(token: string): Promise<IgProfile> {
  const v = env().IG_GRAPH_VERSION;
  return getJson<IgProfile>(
    `${GRAPH}/${v}/me?fields=user_id,username,name,biography,profile_picture_url&access_token=${encodeURIComponent(token)}`,
  );
}

const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}";

/** Newest-first media. `maxPages` caps incremental syncs; full syncs pass Infinity. */
export async function* listMedia(token: string, maxPages = 2): AsyncGenerator<IgMedia> {
  const v = env().IG_GRAPH_VERSION;
  let url: string | undefined =
    `${GRAPH}/${v}/me/media?fields=${encodeURIComponent(MEDIA_FIELDS)}&limit=50&access_token=${encodeURIComponent(token)}`;
  for (let page = 0; url && page < maxPages; page++) {
    const r: { data: IgMedia[]; paging?: { next?: string } } = await getJson(url);
    yield* r.data;
    url = r.paging?.next;
  }
}

/** Image URLs for a post, in order (videos use their thumbnail). */
export function imageUrls(m: IgMedia): { id: string; url: string }[] {
  const items =
    m.media_type === "CAROUSEL_ALBUM" && m.children
      ? m.children.data
      : [{ id: m.id, media_type: m.media_type, media_url: m.media_url, thumbnail_url: m.thumbnail_url }];
  return items
    .map((c) => ({ id: c.id, url: c.media_type === "VIDEO" ? c.thumbnail_url : c.media_url }))
    .filter((c): c is { id: string; url: string } => Boolean(c.url));
}
