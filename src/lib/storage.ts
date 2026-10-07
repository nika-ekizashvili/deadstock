import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

let client: S3Client | undefined;
export function s3() {
  const e = env();
  client ??= new S3Client({
    endpoint: e.S3_ENDPOINT,
    region: e.S3_REGION,
    forcePathStyle: true, // MinIO
    credentials: { accessKeyId: e.S3_ACCESS_KEY, secretAccessKey: e.S3_SECRET_KEY },
  });
  return client;
}

/**
 * Instagram CDN URLs expire, so every image is copied to our bucket once.
 * Returns the object key.
 */
export async function mirrorImage(sourceUrl: string, key: string): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`image fetch ${res.status} for ${key}`);
  const body = Buffer.from(await res.arrayBuffer());
  await s3().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: res.headers.get("content-type") ?? "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return key;
}

/** Upload bytes we already have (seed data, avatars). Returns the object key. */
export async function putObject(key: string, body: Buffer | string, contentType: string): Promise<string> {
  await s3().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return key;
}

/** Public bucket URL when S3_PUBLIC_URL is set, else served through the app at /media/<key>. */
export function publicUrl(key: string): string {
  const base = env().S3_PUBLIC_URL;
  return base ? `${base.replace(/\/$/, "")}/${key}` : `/media/${key}`;
}
