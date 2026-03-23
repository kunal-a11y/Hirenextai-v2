import { Router } from "express";
import { db, savedJobsTable, jobsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

/* ── GET /api/saved-jobs — list saved jobs with job details ──────────────── */
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      saved: savedJobsTable,
      job: jobsTable,
    })
    .from(savedJobsTable)
    .innerJoin(jobsTable, eq(savedJobsTable.jobId, jobsTable.id))
    .where(eq(savedJobsTable.userId, req.userId!))
    .orderBy(desc(savedJobsTable.savedAt));

  res.json(rows.map(r => ({
    id: r.saved.id,
    jobId: r.saved.jobId,
    notes: r.saved.notes ?? null,
    savedAt: r.saved.savedAt instanceof Date ? r.saved.savedAt.toISOString() : r.saved.savedAt,
    job: {
      ...r.job,
      companyLogoUrl: r.job.companyLogoUrl ?? null,
      salaryMin: r.job.salaryMin ?? null,
      salaryMax: r.job.salaryMax ?? null,
      experienceYears: r.job.experienceYears ?? null,
      applyUrl: r.job.applyUrl ?? null,
      postedAt: r.job.postedAt instanceof Date ? r.job.postedAt.toISOString() : r.job.postedAt,
    },
  })));
});

/* ── POST /api/saved-jobs — save a job ───────────────────────────────────── */
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { jobId, notes } = req.body;
  if (!jobId) {
    res.status(400).json({ error: "Bad Request", message: "jobId is required" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  const existing = await db
    .select()
    .from(savedJobsTable)
    .where(and(eq(savedJobsTable.userId, req.userId!), eq(savedJobsTable.jobId, jobId)))
    .limit(1);

  let saved: any;
  if (existing.length) {
    await db.update(savedJobsTable)
      .set({ notes: notes ?? existing[0].notes })
      .where(eq(savedJobsTable.id, existing[0].id));
    const [updated] = await db.select().from(savedJobsTable)
      .where(eq(savedJobsTable.id, existing[0].id)).limit(1);
    saved = updated;
  } else {
    await db.insert(savedJobsTable).values({
      userId: req.userId!,
      jobId,
      notes: notes ?? null,
    });
    const [inserted] = await db.select().from(savedJobsTable)
      .where(and(eq(savedJobsTable.userId, req.userId!), eq(savedJobsTable.jobId, jobId)))
      .limit(1);
    saved = inserted;
  }

  res.json({
    id: saved.id,
    jobId: saved.jobId,
    notes: saved.notes ?? null,
    savedAt: saved.savedAt instanceof Date ? saved.savedAt.toISOString() : saved.savedAt,
    job: {
      ...job,
      companyLogoUrl: job.companyLogoUrl ?? null,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      experienceYears: job.experienceYears ?? null,
      applyUrl: job.applyUrl ?? null,
      postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
    },
  });
});

/* ── DELETE /api/saved-jobs/:jobId — unsave a job ────────────────────────── */
router.delete("/:jobId", authenticate, async (req: AuthRequest, res) => {
  const jobId = parseInt(req.params.jobId, 10);
  await db.delete(savedJobsTable)
    .where(and(eq(savedJobsTable.userId, req.userId!), eq(savedJobsTable.jobId, jobId)));
  res.json({ success: true });
});

/* ── PATCH /api/saved-jobs/:id/notes — update notes on a saved job ─────── */
router.patch("/:id/notes", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const { notes } = req.body;

  await db.update(savedJobsTable)
    .set({ notes })
    .where(and(eq(savedJobsTable.id, id), eq(savedJobsTable.userId, req.userId!)));

  const [saved] = await db.select().from(savedJobsTable)
    .where(and(eq(savedJobsTable.id, id), eq(savedJobsTable.userId, req.userId!)))
    .limit(1);

  if (!saved) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  res.json({ id: saved.id, notes: saved.notes });
});

/* ── GET /api/saved-jobs/ids — just the saved jobIds (for button state) ─── */
router.get("/ids", authenticate, async (req: AuthRequest, res) => {
  const rows = await db
    .select({ jobId: savedJobsTable.jobId })
    .from(savedJobsTable)
    .where(eq(savedJobsTable.userId, req.userId!));
  res.json(rows.map(r => r.jobId));
});

export default router;
