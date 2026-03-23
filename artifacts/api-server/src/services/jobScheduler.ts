import { db, jobsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getFetchLog, cleanupExpiredJobs, removeNonApiJobs } from "./jobAggregator.js";
import { processJobAlerts } from "./alertService.js";

const SCHEDULE_INTERVAL_MS = 5.5 * 60 * 60 * 1000; // every 5.5 hours
const INIT_DELAY_MS = 6000; // 6 seconds after boot

let lastScheduledRun: string | null = null;
let isRunning = false;

const SEARCH_QUERIES = [
  "software engineer fresher india",
  "web developer react india",
  "data analyst fresher india",
  "machine learning engineer india",
  "full stack developer india",
  "backend developer nodejs india",
  "devops cloud engineer india",
  "android developer india",
  "python developer india",
  "java developer india",
  "ui ux designer india",
  "cybersecurity analyst india",
  "qa tester fresher india",
  "digital marketing india",
  "bca mca fresher jobs india",
  "it support fresher india",
  "data scientist india",
  "hr recruiter india",
  "finance fresher india",
  "internship software india",
];

async function getJobCount(): Promise<number> {
  try {
    const [res] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable);
    return Number(res?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function runScheduledFetch(label = "Scheduled"): Promise<void> {
  if (isRunning) {
    console.log(`[JobScheduler] Skipping ${label} run — previous run still in progress`);
    return;
  }
  isRunning = true;
  const startTime = Date.now();
  console.log(`\n[JobScheduler] ═══ ${label} fetch started at ${new Date().toISOString()} ═══`);

  try {
    const { aggregateJobs } = await import("./jobAggregator.js");

    // Step 1: Remove expired/demo jobs first
    const removed = await cleanupExpiredJobs();
    if (removed > 0) console.log(`[JobScheduler] Removed ${removed} expired jobs`);

    // Step 2: Fetch from all APIs across all search queries
    let totalFetched = 0;
    let successful = 0;
    let failed = 0;

    for (const query of SEARCH_QUERIES) {
      try {
        const result = await aggregateJobs({ search: query, forceRefresh: true });
        totalFetched += result.jobs.length;
        successful++;
        // Small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        console.error(`[JobScheduler] Query failed: "${query}" — ${e.message}`);
        failed++;
      }
    }

    const finalCount = await getJobCount();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    lastScheduledRun = new Date().toISOString();

    // Step 3: Print per-source fetch log
    const logs = getFetchLog();
    console.log(`\n[JobScheduler] ─── Per-API Fetch Summary ───`);
    for (const log of logs) {
      const status = log.status === "ok" ? "✓" : log.status === "partial" ? "~" : "✗";
      console.log(`  ${status} ${log.source.padEnd(12)} fetched: ${String(log.fetched).padStart(3)}  last: ${log.lastFetchedAt}${log.errors.length ? `  ERR: ${log.errors.slice(-1)[0]}` : ""}`);
    }
    console.log(`[JobScheduler] ─── ${label} complete in ${elapsed}s | queries: ${successful}/${SEARCH_QUERIES.length} ok, ${failed} failed | DB total: ${finalCount} jobs ───\n`);

    // Step 4: Process job alerts for users (fire-and-forget)
    processJobAlerts(26).catch(e =>
      console.error("[JobScheduler] Alert processing error:", e.message)
    );
  } catch (e) {
    console.error("[JobScheduler] Fatal error during fetch run:", e);
  } finally {
    isRunning = false;
  }
}

export function getSchedulerStatus() {
  return {
    lastScheduledRun,
    isRunning,
    nextRunIn: lastScheduledRun
      ? Math.max(0, SCHEDULE_INTERVAL_MS - (Date.now() - new Date(lastScheduledRun).getTime()))
      : null,
    intervalHours: SCHEDULE_INTERVAL_MS / 3600000,
    fetchLog: getFetchLog(),
  };
}

export function startJobScheduler(): void {
  console.log(`[JobScheduler] Initialised — interval: ${(SCHEDULE_INTERVAL_MS / 3600000).toFixed(1)}h`);

  // Remove demo/seed jobs on boot
  setTimeout(async () => {
    const removed = await removeNonApiJobs();
    if (removed > 0) console.log(`[JobScheduler] Removed ${removed} demo/seed jobs from DB`);
  }, 1000);

  // Initial fetch after short delay
  setTimeout(async () => {
    const count = await getJobCount();
    if (count < 100) {
      console.log(`[JobScheduler] DB has ${count} jobs — triggering initial fetch`);
      await runScheduledFetch("Initial");
    } else {
      console.log(`[JobScheduler] DB has ${count} real jobs — skipping initial fetch`);
      lastScheduledRun = new Date().toISOString();
    }
  }, INIT_DELAY_MS);

  // Periodic fetch every 5.5 hours
  setInterval(() => {
    runScheduledFetch("Periodic").catch(console.error);
  }, SCHEDULE_INTERVAL_MS);

  // Daily alert sweep — independent of job fetch (every 24h, with 5min offset)
  const ALERT_INTERVAL_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    processJobAlerts(25).catch(console.error);
    setInterval(() => {
      processJobAlerts(25).catch(console.error);
    }, ALERT_INTERVAL_MS);
  }, 5 * 60 * 1000); // first run 5 minutes after boot
}
