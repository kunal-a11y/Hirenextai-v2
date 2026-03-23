import { Router } from "express";
import { db, jobAlertsTable, alertNotificationsTable, jobsTable, profilesTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";
import { getUnreadNotificationCount } from "../services/alertService.js";

const router = Router();

/* ── GET /api/alerts — get or auto-create alert for user ─────────────────── */
router.get("/", authenticate, async (req: AuthRequest, res) => {
  let [alert] = await db.select().from(jobAlertsTable)
    .where(eq(jobAlertsTable.userId, req.userId!))
    .limit(1);

  if (!alert) {
    const [profile] = await db.select().from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!)).limit(1);

    await db.insert(jobAlertsTable).values({
      userId: req.userId!,
      enabled: false,
      skills: profile?.skills ?? [],
      locations: profile?.preferredLocations ?? [],
      openToRemote: profile?.openToRemote ?? true,
      jobTypes: profile?.jobTypePreference ?? [],
      categories: profile?.preferredCategories ?? [],
      salaryMin: profile?.expectedSalaryMin ?? null,
      isFresherOnly: profile?.isFresher ?? false,
      frequency: "daily",
      emailAlerts: true,
      keywords: [],
    });
    const [inserted] = await db.select().from(jobAlertsTable)
      .where(eq(jobAlertsTable.userId, req.userId!))
      .limit(1);
    alert = inserted;
  }

  res.json(alert);
});

/* ── PUT /api/alerts — update alert preferences ──────────────────────────── */
router.put("/", authenticate, async (req: AuthRequest, res) => {
  const {
    enabled, frequency, keywords, skills, locations, openToRemote,
    jobTypes, categories, salaryMin, isFresherOnly, emailAlerts,
  } = req.body;

  const [existing] = await db.select().from(jobAlertsTable)
    .where(eq(jobAlertsTable.userId, req.userId!)).limit(1);

  const values: any = {
    updatedAt: new Date(),
    ...(enabled !== undefined && { enabled }),
    ...(frequency && { frequency }),
    ...(keywords !== undefined && { keywords }),
    ...(skills !== undefined && { skills }),
    ...(locations !== undefined && { locations }),
    ...(openToRemote !== undefined && { openToRemote }),
    ...(jobTypes !== undefined && { jobTypes }),
    ...(categories !== undefined && { categories }),
    ...(salaryMin !== undefined && { salaryMin: salaryMin || null }),
    ...(isFresherOnly !== undefined && { isFresherOnly }),
    ...(emailAlerts !== undefined && { emailAlerts }),
  };

  let alert: any;
  if (existing) {
    await db.update(jobAlertsTable)
      .set(values)
      .where(eq(jobAlertsTable.userId, req.userId!));
    const [updated] = await db.select().from(jobAlertsTable)
      .where(eq(jobAlertsTable.userId, req.userId!)).limit(1);
    alert = updated;
  } else {
    await db.insert(jobAlertsTable).values({
      userId: req.userId!,
      enabled: enabled ?? false,
      frequency: frequency ?? "daily",
      keywords: keywords ?? [],
      skills: skills ?? [],
      locations: locations ?? [],
      openToRemote: openToRemote ?? true,
      jobTypes: jobTypes ?? [],
      categories: categories ?? [],
      salaryMin: salaryMin || null,
      isFresherOnly: isFresherOnly ?? false,
      emailAlerts: emailAlerts ?? true,
    });
    const [inserted] = await db.select().from(jobAlertsTable)
      .where(eq(jobAlertsTable.userId, req.userId!)).limit(1);
    alert = inserted;
  }

  res.json(alert);
});

/* ── GET /api/alerts/notifications — list alert notification history ──────── */
router.get("/notifications", authenticate, async (req: AuthRequest, res) => {
  const notifications = await db.select()
    .from(alertNotificationsTable)
    .where(eq(alertNotificationsTable.userId, req.userId!))
    .orderBy(desc(alertNotificationsTable.sentAt))
    .limit(50);

  const enriched = await Promise.all(
    notifications.slice(0, 10).map(async (n: typeof notifications[number]) => {
      let jobs: any[] = [];
      const jobIds = (n.jobIds ?? []) as number[];
      if (jobIds.length > 0) {
        const jobRows = await db.select({
          id: jobsTable.id,
          title: jobsTable.title,
          company: jobsTable.company,
          location: jobsTable.location,
          type: jobsTable.type,
          salaryMin: jobsTable.salaryMin,
          salaryMax: jobsTable.salaryMax,
          isFresher: jobsTable.isFresher,
          isRemote: jobsTable.isRemote,
          skills: jobsTable.skills,
        }).from(jobsTable).where(inArray(jobsTable.id, jobIds.slice(0, 5)));
        jobs = jobRows;
      }
      return { ...n, jobs };
    })
  );

  const older = notifications.slice(10).map(n => ({ ...n, jobs: [] }));

  res.json([...enriched, ...older]);
});

/* ── POST /api/alerts/notifications/read-all — mark all as read ──────────── */
router.post("/notifications/read-all", authenticate, async (req: AuthRequest, res) => {
  await db.update(alertNotificationsTable)
    .set({ isRead: true })
    .where(and(
      eq(alertNotificationsTable.userId, req.userId!),
      eq(alertNotificationsTable.isRead, false),
    ));
  res.json({ success: true });
});

/* ── GET /api/alerts/unread-count ────────────────────────────────────────── */
router.get("/unread-count", authenticate, async (req: AuthRequest, res) => {
  const count = await getUnreadNotificationCount(req.userId!);
  res.json({ count });
});

/* ── POST /api/alerts/test-send — manually trigger an alert check ─────────── */
router.post("/test-send", authenticate, async (req: AuthRequest, res) => {
  const { processJobAlerts } = await import("../services/alertService.js");
  processJobAlerts(72).catch(console.error);
  res.json({ success: true, message: "Alert check triggered" });
});

export default router;
