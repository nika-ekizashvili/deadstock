import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const g = globalThis as unknown as { __db?: DB };

/** Lazy singleton so dev hot-reload doesn't open new pools. */
export function db(): DB {
  if (!g.__db) {
    const client = postgres(env().DATABASE_URL, { max: 10 });
    g.__db = drizzle(client, { schema });
  }
  return g.__db;
}

export { schema };
