/**
 * Background worker: `pnpm worker`
 * - every 15 min: incremental sync (latest ~100 posts) for every account
 * - nightly: full sync (detects deleted/archived posts → sold)
 */
import "dotenv/config";
import { db, schema } from "@/db";
import { env } from "@/env";
import { boss, enqueueSync, QUEUES, type SyncAccountJob } from "@/lib/queue";
import { syncAccount } from "./sync";

async function enqueueAll(full: boolean) {
  const accounts = await db().select({ id: schema.instagramAccounts.id }).from(schema.instagramAccounts);
  for (const a of accounts) await enqueueSync(a.id, full);
  console.log(`[worker] queued ${full ? "full" : "incremental"} sync for ${accounts.length} accounts`);
}

async function main() {
  const b = await boss();
  const e = env();

  await b.schedule(QUEUES.syncAll, e.SYNC_CRON);
  await b.schedule(QUEUES.syncAllFull, e.FULL_SYNC_CRON, null, { tz: "Asia/Tbilisi" });

  await b.work(QUEUES.syncAll, async () => enqueueAll(false));
  await b.work(QUEUES.syncAllFull, async () => enqueueAll(true));
  await b.work<SyncAccountJob>(QUEUES.syncAccount, { localConcurrency: 2 }, async (jobs) => {
    for (const job of jobs) {
      const stats = await syncAccount(job.data.accountId, job.data.full);
      console.log(`[worker] synced ${job.data.accountId}`, stats);
    }
  });

  console.log("[worker] running");
  const stop = async () => {
    await b.stop({ graceful: true });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
