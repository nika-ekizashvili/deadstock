import { PgBoss } from "pg-boss";
import { env } from "@/env";

export const QUEUES = {
  syncAccount: "sync-account",
  syncAll: "sync-all",
  syncAllFull: "sync-all-full",
} as const;

export type SyncAccountJob = { accountId: string; full: boolean };

const g = globalThis as unknown as { __boss?: Promise<PgBoss> };

/** Shared pg-boss instance (web app uses it only to enqueue). */
export function boss(): Promise<PgBoss> {
  g.__boss ??= (async () => {
    const b = new PgBoss(env().DATABASE_URL);
    b.on("error", (err) => console.error("[pg-boss]", err));
    await b.start();
    for (const q of Object.values(QUEUES)) await b.createQueue(q);
    return b;
  })();
  return g.__boss;
}

export async function enqueueSync(accountId: string, full = false) {
  const b = await boss();
  // singletonKey: never queue two syncs for the same account at once
  return b.send(QUEUES.syncAccount, { accountId, full } satisfies SyncAccountJob, {
    singletonKey: `${accountId}:${full ? "full" : "inc"}`,
    retryLimit: 3,
    retryBackoff: true,
  });
}
