import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  ROOT_DOMAIN: z.string().default("localhost:3000"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "32-byte hex key (openssl rand -hex 32)"),

  IG_APP_ID: z.string().default(""),
  IG_APP_SECRET: z.string().default(""),
  IG_GRAPH_VERSION: z.string().default("v23.0"),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("deadstock"),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_PUBLIC_URL: z.string().url(),

  SYNC_CRON: z.string().default("*/15 * * * *"),
  FULL_SYNC_CRON: z.string().default("30 3 * * *"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated env, read lazily so `next build` works without secrets. */
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
