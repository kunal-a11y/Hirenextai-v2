import { Router } from "express";
import { db, applicationsTable, savedJobsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

/* ── GET /api/dashboard/summary ──────────────────────────────────────────── */
router.get("/summary", authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const [appsResult, savedResult] = await Promise.all([
    db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(savedJobsTable).where(eq(savedJobsTable.userId, userId)),
  ]);

  const apps = appsResult;
  const totalSaved = Number(savedResult[0]?.count ?? 0);

  const total = apps.length;
  const byStatus = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const interviews = (byStatus["interview"] ?? 0);
  const offered = (byStatus["offered"] ?? 0);
  const shortlisted = (byStatus["shortlisted"] ?? 0);

  // Upcoming follow-ups (next 7 days)
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = apps.filter(a => {
    if (!a.followUpDate) return false;
    const d = new Date(a.followUpDate);
    return d >= now && d <= in7Days;
  }).length;

  res.json({
    totalApplications: total,
    totalSaved,
    interviews,
    offered,
    shortlisted,
    upcoming,
    byStatus,
  });
});

export default router;
