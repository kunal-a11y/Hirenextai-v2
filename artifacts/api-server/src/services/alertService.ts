import { db, jobAlertsTable, alertNotificationsTable, jobsTable, usersTable, profilesTable } from "@workspace/db";
import { eq, and, gte, desc, inArray, sql } from "drizzle-orm";
import { sendJobAlertEmail } from "./emailService.js";

/* ── Match score (mirrors frontend Jobs.tsx algorithm) ────────────────────── */
function computeMatchScore(
  job: { skills: string[]; location: string; type: string; isFresher: boolean; category?: string },
  prefs: { skills: string[]; locations: string[]; jobTypes: string[]; openToRemote: boolean; categories: string[]; isFresherOnly: boolean },
): number {
  let score = 0;

  // Skills — 45pts
  if (prefs.skills.length > 0 && job.skills.length > 0) {
    const jobSkillsLower = job.skills.map(s => s.toLowerCase());
    const matchedSkills = prefs.skills.filter(ps =>
      jobSkillsLower.some(js => js.includes(ps.toLowerCase()) || ps.toLowerCase().includes(js))
    );
    score += Math.round((matchedSkills.length / Math.max(prefs.skills.length, 1)) * 45);
  }

  // Location — 25pts
  if (prefs.locations.length > 0) {
    const jobLoc = job.location.toLowerCase();
    const hasMatch = prefs.locations.some(l => jobLoc.includes(l.toLowerCase()) || l.toLowerCase().includes(jobLoc));
    if (hasMatch) score += 25;
    else if (prefs.openToRemote && job.isFresher) score += 10;
  } else {
    score += 15;
  }

  // Job type — 15pts
  if (prefs.jobTypes.length === 0 || prefs.jobTypes.some(t => t === job.type)) {
    score += 15;
  }

  // Fresher — 15pts
  if (prefs.isFresherOnly) {
    if (job.isFresher) score += 15;
  } else {
    score += 10;
  }

  return Math.min(score, 100);
}

/* ── Check if an alert should be sent based on frequency ─────────────────── */
function shouldSendAlert(alert: { frequency: string; lastSentAt: Date | null }): boolean {
  if (!alert.lastSentAt) return true;
  const now = Date.now();
  const last = new Date(alert.lastSentAt).getTime();
  const hoursSince = (now - last) / (1000 * 60 * 60);
  if (alert.frequency === "instant") return hoursSince >= 1;
  if (alert.frequency === "daily") return hoursSince >= 23;
  if (alert.frequency === "weekly") return hoursSince >= 167;
  return false;
}

/* ── Jobs added in the last N hours ─────────────────────────────────────── */
async function getRecentJobs(hoursBack = 24) {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return db.select().from(jobsTable)
    .where(gte(jobsTable.postedAt, cutoff))
    .orderBy(desc(jobsTable.postedAt))
    .limit(500);
}

/* ── Main: process all enabled alerts ────────────────────────────────────── */
export async function processJobAlerts(hoursBack = 25): Promise<void> {
  console.log("[AlertService] Processing job alerts...");
  try {
    const alerts = await db
      .select({
        alert: jobAlertsTable,
        user: { id: usersTable.id, name: usersTable.name, email: usersTable.email },
      })
      .from(jobAlertsTable)
      .innerJoin(usersTable, eq(jobAlertsTable.userId, usersTable.id))
      .where(eq(jobAlertsTable.enabled, true));

    if (alerts.length === 0) {
      console.log("[AlertService] No active alerts to process");
      return;
    }

    const recentJobs = await getRecentJobs(hoursBack);
    if (recentJobs.length === 0) {
      console.log("[AlertService] No recent jobs to match");
      return;
    }

    console.log(`[AlertService] Checking ${alerts.length} alerts against ${recentJobs.length} recent jobs`);

    for (const { alert, user } of alerts) {
      if (!shouldSendAlert({ frequency: alert.frequency, lastSentAt: alert.lastSentAt })) continue;

      const prefs = {
        skills: alert.skills,
        locations: alert.locations,
        jobTypes: alert.jobTypes,
        openToRemote: alert.openToRemote,
        categories: alert.categories,
        isFresherOnly: alert.isFresherOnly,
        salaryMin: alert.salaryMin,
        keywords: alert.keywords,
      };

      // Score and filter jobs
      const scored = recentJobs
        .map(job => {
          let score = computeMatchScore(job, prefs);

          // Keyword boost
          if (prefs.keywords.length > 0) {
            const titleLower = job.title.toLowerCase();
            const companyLower = job.company.toLowerCase();
            const keywordHit = prefs.keywords.some(k => {
              const kl = k.toLowerCase();
              return titleLower.includes(kl) || companyLower.includes(kl);
            });
            if (keywordHit) score = Math.min(score + 15, 100);
          }

          // Category filter
          if (prefs.categories.length > 0 && !prefs.categories.includes(job.category)) {
            score = Math.max(score - 20, 0);
          }

          // Salary filter
          if (prefs.salaryMin && job.salaryMax && job.salaryMax < prefs.salaryMin) {
            score = 0;
          }

          return { job, score };
        })
        .filter(({ score }) => score >= 30)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      if (scored.length === 0) continue;

      const matchedJobs = scored.map(({ job, score }) => ({ ...job, matchScore: score }));
      const jobIds = matchedJobs.map(j => j.id);

      // Store in-app notification
      await db.insert(alertNotificationsTable).values({
        userId: user.id,
        alertId: alert.id,
        jobIds,
        matchCount: matchedJobs.length,
        isRead: false,
        emailSent: false,
      });

      // Send email if enabled
      let emailSent = false;
      if (alert.emailAlerts) {
        emailSent = await sendJobAlertEmail(
          user.email,
          user.name ?? "there",
          matchedJobs.map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            type: j.type,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            skills: j.skills,
            isFresher: j.isFresher,
            isRemote: j.isRemote,
            matchScore: j.matchScore,
          })),
          alert.frequency,
        );
      }

      // Update lastSentAt and mark emailSent
      await db.update(jobAlertsTable)
        .set({ lastSentAt: new Date(), updatedAt: new Date() })
        .where(eq(jobAlertsTable.id, alert.id));

      if (emailSent) {
        // Update the notification we just inserted
        await db.update(alertNotificationsTable)
          .set({ emailSent: true })
          .where(and(
            eq(alertNotificationsTable.userId, user.id),
            eq(alertNotificationsTable.alertId, alert.id),
          ));
      }

      console.log(`[AlertService] Alert processed for user ${user.id}: ${scored.length} matches, email: ${emailSent}`);
    }
    console.log("[AlertService] Done processing job alerts");
  } catch (err: any) {
    console.error("[AlertService] Error:", err.message);
  }
}

/* ── Get unread notification count for a user ────────────────────────────── */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertNotificationsTable)
    .where(and(
      eq(alertNotificationsTable.userId, userId),
      eq(alertNotificationsTable.isRead, false),
    ));
  return Number(res?.count ?? 0);
}
