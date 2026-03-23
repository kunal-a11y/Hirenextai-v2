import { Router } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

function serializeApp(app: any, job: any) {
  return {
    id: app.id,
    jobId: app.jobId,
    userId: app.userId,
    status: app.status,
    recruiterStatus: app.recruiterStatus ?? "pending",
    coverLetter: app.coverLetter ?? null,
    resumeUrl: app.resumeUrl ?? null,
    notes: app.notes ?? null,
    followUpDate: app.followUpDate instanceof Date ? app.followUpDate.toISOString() : (app.followUpDate ?? null),
    reminderSent: app.reminderSent ?? false,
    appliedAt: app.appliedAt instanceof Date ? app.appliedAt.toISOString() : app.appliedAt,
    updatedAt: app.updatedAt instanceof Date ? app.updatedAt.toISOString() : app.updatedAt,
    job: job ? {
      ...job,
      companyLogoUrl: job.companyLogoUrl ?? null,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      experienceYears: job.experienceYears ?? null,
      applyUrl: job.applyUrl ?? null,
      postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
    } : undefined,
  };
}

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(eq(applicationsTable.userId, req.userId!))
    .orderBy(applicationsTable.appliedAt);

  res.json(apps.map(row => serializeApp(row.applications, row.jobs)));
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { jobId, coverLetter, resumeUrl } = req.body;
  if (!jobId) {
    res.status(400).json({ error: "Bad Request", message: "jobId is required" });
    return;
  }

  const existing = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.userId, req.userId!), eq(applicationsTable.jobId, jobId)))
    .limit(1);

  if (existing.length) {
    res.status(400).json({ error: "Bad Request", message: "Already applied to this job" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  await db.insert(applicationsTable).values({
    jobId,
    userId: req.userId!,
    coverLetter: coverLetter ?? null,
    resumeUrl: resumeUrl ?? null,
    status: "applied",
    recruiterStatus: "pending",
  });

  const [app] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.userId, req.userId!), eq(applicationsTable.jobId, jobId)))
    .limit(1);

  // Increment application count on job
  await db.update(jobsTable)
    .set({ applicationCount: sql`${jobsTable.applicationCount} + 1` })
    .where(eq(jobsTable.id, jobId));

  res.json(serializeApp(app, job));
});

router.patch("/:applicationId", authenticate, async (req: AuthRequest, res) => {
  const { applicationId } = req.params;
  const id = parseInt(applicationId, 10);
  const { status, notes, followUpDate, reminderSent } = req.body;

  const updates: any = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (followUpDate !== undefined) updates.followUpDate = followUpDate ? new Date(followUpDate) : null;
  if (reminderSent !== undefined) updates.reminderSent = reminderSent;

  await db
    .update(applicationsTable)
    .set(updates)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  const [app] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)))
    .limit(1);

  if (!app) {
    res.status(404).json({ error: "Not Found", message: "Application not found" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId)).limit(1);
  res.json(serializeApp(app, job));
});

export default router;
