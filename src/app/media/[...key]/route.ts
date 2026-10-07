import { GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { env } from "@/env";
import { s3 } from "@/lib/storage";

/**
 * Serves bucket objects (listing photos, avatars) through the app when the bucket isn't public
 * (S3_PUBLIC_URL unset). Keys are immutable, so responses cache for a year at the edge.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (!/^(shops|seed)\//.test(objectKey) || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const obj = await s3().send(new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: objectKey }));
    if (!obj.Body) return new Response("Not found", { status: 404 });
    return new Response(obj.Body.transformToWebStream(), {
      headers: {
        "Content-Type": obj.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(obj.ContentLength != null && { "Content-Length": String(obj.ContentLength) }),
      },
    });
  } catch (err) {
    if (err instanceof NoSuchKey) return new Response("Not found", { status: 404 });
    throw err;
  }
}
