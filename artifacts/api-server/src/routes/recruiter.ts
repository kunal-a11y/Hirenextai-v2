import { Router } from "express";
import {
  db, usersTable, recruiterProfilesTable, jobsTable, applicationsTable, profilesTable,
  recruiterSubscriptionsTable, jobBoostTransactionsTable,
} from "@workspace/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

/* ── Plan config ─────────────────────────────────────────────────────────── */
const RECRUITER_PLANS = {
  free:       { label: "Free",       jobLimit: 3,   boostCredits: 0,  featuredCredits: 0,  price: 0,     pricePaise: 0 },
  starter:    { label: "Starter",    jobLimit: 15,  boostCredits: 5,  featuredCredits: 2,  price: 999,   pricePaise: 99900 },
  growth:     { label: "Growth",     jobLimit: 50,  boostCredits: 20, featuredCredits: 5,  price: 2499,  pricePaise: 249900 },
  enterprise: { label: "Enterprise", jobLimit: -1,  boostCredits: 50, featuredCredits: 20, price: 5999,  pricePaise: 599900 },
};
type RecruiterPlanKey = keyof typeof RECRUITER_PLANS;

/* ── Guard: only recruiter accounts ─────────────────────────────────────── */
async function requireRecruiter(req: AuthRequest, res: any): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user || user.role !== "recruiter") {
    res.status(403).json({ error: "Forbidden", message: "Recruiter account required" });
    return false;
  }
  return true;
}

function serializeJob(job: any) {
  return {
    ...job,
    companyLogoUrl: job.companyLogoUrl ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    experienceYears: job.experienceYears ?? null,
    applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : null,
    postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    boostedAt: job.boostedAt instanceof Date ? job.boostedAt.toISOString() : (job.boostedAt ?? null),
    boostExpiry: job.boostExpiry instanceof Date ? job.boostExpiry.toISOString() : (job.boostExpiry ?? null),
    featuredAt: job.featuredAt instanceof Date ? job.featuredAt.toISOString() : (job.featuredAt ?? null),
    featuredExpiry: job.featuredExpiry instanceof Date ? job.featuredExpiry.toISOString() : (job.featuredExpiry ?? null),
  };
}

/* ── GET /api/recruiter/overview ────────────────────────────────────────── */
router.get("/overview", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const myJobs = await db.select({ id: jobsTable.id, applicationCount: jobsTable.applicationCount })
    .from(jobsTable)
    .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)));

  const totalJobs = myJobs.length;
  const jobIds = myJobs.map(j => j.id);
  let shortlisted = 0;
  let totalApplicants = 0;

  if (jobIds.length > 0) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(inArray(applicationsTable.jobId, jobIds));
    totalApplicants = Number(countResult?.count ?? 0);

    const [shortlistedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(
        and(
          inArray(applicationsTable.jobId, jobIds),
          eq(applicationsTable.recruiterStatus as any, "shortlisted"),
        )
      );
    shortlisted = Number(shortlistedResult?.count ?? 0);
  }

  const activeJobs = myJobs.length;

  res.json({ totalJobs, activeJobs, totalApplicants, shortlistedApplicants: shortlisted });
});

/* ── GET /api/recruiter/profile ─────────────────────────────────────────── */
router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const [profile] = await db.select().from(recruiterProfilesTable)
    .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  if (!profile) {
    res.json({ profile: null, setupCompleted: false });
    return;
  }
  res.json({ profile, setupCompleted: profile.setupCompleted === "true" });
});

/* ── POST /api/recruiter/profile ────────────────────────────────────────── */
router.post("/profile", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const {
    companyName, companyLogoUrl, companyWebsite, companySize, industry,
    companyLocation, recruiterName, recruiterPosition, workEmail, phone, linkedinUrl, description,
  } = req.body;

  if (!companyName || !recruiterName || !workEmail) {
    res.status(400).json({ error: "Bad Request", message: "Company name, recruiter name, and work email are required" });
    return;
  }

  const existing = await db.select().from(recruiterProfilesTable)
    .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  let profile: any;
  if (existing.length) {
    await db.update(recruiterProfilesTable)
      .set({
        companyName, companyLogoUrl: companyLogoUrl ?? null, companyWebsite: companyWebsite ?? null,
        companySize: companySize ?? null, industry: industry ?? null,
        companyLocation: companyLocation ?? null,
        recruiterName, recruiterPosition: recruiterPosition ?? null,
        workEmail, phone: phone ?? null, linkedinUrl: linkedinUrl ?? null,
        description: description ?? null, setupCompleted: "true",
        updatedAt: new Date(),
      })
      .where(eq(recruiterProfilesTable.userId, req.userId!));
    const [updated] = await db.select().from(recruiterProfilesTable)
      .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);
    profile = updated;
  } else {
    await db.insert(recruiterProfilesTable).values({
      userId: req.userId!,
      companyName, companyLogoUrl: companyLogoUrl ?? null, companyWebsite: companyWebsite ?? null,
      companySize: companySize ?? null, industry: industry ?? null,
      companyLocation: companyLocation ?? null,
      recruiterName, recruiterPosition: recruiterPosition ?? null,
      workEmail, phone: phone ?? null, linkedinUrl: linkedinUrl ?? null,
      description: description ?? null, setupCompleted: "true",
    });
    const [inserted] = await db.select().from(recruiterProfilesTable)
      .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);
    profile = inserted;
  }

  res.json({ profile, setupCompleted: true });
});

/* ── GET /api/recruiter/subscription ───────────────────────────────────── */
router.get("/subscription", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const [profile] = await db.select().from(recruiterProfilesTable)
    .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  const planKey = (profile?.recruiterPlan ?? "free") as RecruiterPlanKey;
  const planCfg = RECRUITER_PLANS[planKey] ?? RECRUITER_PLANS.free;

  const [activeJobsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobsTable)
    .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)));

  const [boostedJobsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobsTable)
    .where(and(
      eq(jobsTable.postedByUserId, req.userId!),
      eq(jobsTable.isDirectPost, true),
      eq(jobsTable.isBoosted, true),
    ));

  const [featuredJobsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobsTable)
    .where(and(
      eq(jobsTable.postedByUserId, req.userId!),
      eq(jobsTable.isDirectPost, true),
      eq(jobsTable.isFeatured, true),
    ));

  res.json({
    recruiterPlan: planKey,
    planLabel: planCfg.label,
    jobLimit: planCfg.jobLimit,
    boostCreditsTotal: planCfg.boostCredits,
    featuredCreditsTotal: planCfg.featuredCredits,
    jobBoostCredits: profile?.jobBoostCredits ?? 0,
    featuredJobsCredits: profile?.featuredJobsCredits ?? 0,
    planValidTill: profile?.planValidTill ? profile.planValidTill.toISOString() : null,
    activeJobs: Number(activeJobsResult?.count ?? 0),
    boostedJobs: Number(boostedJobsResult?.count ?? 0),
    featuredJobs: Number(featuredJobsResult?.count ?? 0),
    plans: Object.entries(RECRUITER_PLANS).map(([key, cfg]) => ({
      key,
      ...cfg,
    })),
  });
});

/* ── POST /api/recruiter/upgrade ────────────────────────────────────────── */
router.post("/upgrade", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const { plan_name } = req.body;
  const planKey = plan_name as RecruiterPlanKey;

  if (!RECRUITER_PLANS[planKey]) {
    res.status(400).json({ error: "Bad Request", message: "Invalid plan. Must be: free, starter, growth, enterprise" });
    return;
  }

  const planCfg = RECRUITER_PLANS[planKey];

  const validTill = new Date();
  validTill.setDate(validTill.getDate() + 30);

  await db.insert(recruiterSubscriptionsTable).values({
    userId: req.userId!,
    planName: planKey,
    jobPostLimit: planCfg.jobLimit === -1 ? 999999 : planCfg.jobLimit,
    boostCredits: planCfg.boostCredits,
    featuredJobs: planCfg.featuredCredits,
    validTill,
  });

  const [profile] = await db.select({ id: recruiterProfilesTable.id })
    .from(recruiterProfilesTable).where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  if (profile) {
    await db.update(recruiterProfilesTable)
      .set({
        recruiterPlan: planKey,
        jobBoostCredits: planCfg.boostCredits,
        featuredJobsCredits: planCfg.featuredCredits,
        planValidTill: validTill,
        updatedAt: new Date(),
      })
      .where(eq(recruiterProfilesTable.id, profile.id));
  }

  res.json({
    success: true,
    plan: planKey,
    planLabel: planCfg.label,
    validTill: validTill.toISOString(),
    jobBoostCredits: planCfg.boostCredits,
    featuredJobsCredits: planCfg.featuredCredits,
  });
});

/* ── POST /api/recruiter/featured-job ───────────────────────────────────── */
router.post("/featured-job", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const { jobId: rawJobId } = req.body;
  const jobId = parseInt(rawJobId, 10);
  if (isNaN(jobId)) {
    res.status(400).json({ error: "Bad Request", message: "jobId is required" });
    return;
  }

  const [rProfile] = await db.select({
    id: recruiterProfilesTable.id,
    featuredJobsCredits: recruiterProfilesTable.featuredJobsCredits,
  }).from(recruiterProfilesTable).where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  if (!rProfile) {
    res.status(400).json({ error: "Bad Request", message: "Recruiter profile not found" });
    return;
  }

  if ((rProfile.featuredJobsCredits ?? 0) < 1) {
    res.status(403).json({ error: "No featured credits", message: "You have no featured job credits. Upgrade your plan." });
    return;
  }

  const [job] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);

  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  if (job.isFeatured) {
    res.status(400).json({ error: "Already featured", message: "This job is already featured." });
    return;
  }

  const featuredExpiry = new Date();
  featuredExpiry.setDate(featuredExpiry.getDate() + 14);

  await db.update(jobsTable)
    .set({ isFeatured: true, featuredAt: new Date(), featuredExpiry })
    .where(eq(jobsTable.id, jobId));

  const [updatedJob] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);

  await db.update(recruiterProfilesTable)
    .set({ featuredJobsCredits: (rProfile.featuredJobsCredits ?? 1) - 1, updatedAt: new Date() })
    .where(eq(recruiterProfilesTable.id, rProfile.id));

  await db.insert(jobBoostTransactionsTable).values({
    userId: req.userId!,
    jobId,
    creditsUsed: 1,
    type: "featured",
  });

  res.json({
    success: true,
    job: serializeJob(updatedJob),
    featuredCreditsRemaining: (rProfile.featuredJobsCredits ?? 1) - 1,
  });
});

/* ── POST /api/recruiter/jobs ───────────────────────────────────────────── */
router.post("/jobs", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const {
    title, location, isRemote, type, category, salaryMin, salaryMax,
    description, requirements, skills, isFresher, experienceYears, applicationDeadline,
  } = req.body;

  if (!title || !location || !description) {
    res.status(400).json({ error: "Bad Request", message: "Title, location, and description are required" });
    return;
  }

  const [rProfile] = await db.select().from(recruiterProfilesTable)
    .where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  if (!rProfile) {
    res.status(400).json({ error: "Bad Request", message: "Complete your recruiter profile first" });
    return;
  }

  const planKey = (rProfile.recruiterPlan ?? "free") as RecruiterPlanKey;
  const { jobLimit } = RECRUITER_PLANS[planKey] ?? RECRUITER_PLANS.free;

  if (jobLimit !== -1) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobsTable)
      .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)));
    const activeJobs = Number(countResult?.count ?? 0);
    if (activeJobs >= jobLimit) {
      const planCfg = RECRUITER_PLANS[planKey];
      res.status(403).json({
        error: "Limit Reached",
        message: `Your ${planCfg.label} plan allows a maximum of ${jobLimit} active job${jobLimit === 1 ? "" : "s"}. Upgrade to post more.`,
        limitReached: true,
        activeJobs,
        jobLimit,
      });
      return;
    }
  }

  await db.insert(jobsTable).values({
    title,
    company: rProfile.companyName,
    companyLogoUrl: rProfile.companyLogoUrl ?? null,
    companyWebsite: rProfile.companyWebsite ?? null,
    location,
    isRemote: isRemote ?? false,
    type: type ?? "full-time",
    category: category ?? "Engineering",
    salaryMin: salaryMin ? parseInt(salaryMin) : null,
    salaryMax: salaryMax ? parseInt(salaryMax) : null,
    description,
    requirements: requirements ?? [],
    skills: skills ?? [],
    isFresher: isFresher ?? false,
    experienceYears: experienceYears ? parseInt(experienceYears) : null,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
    isDirectPost: true,
    postedByUserId: req.userId!,
    source: "Direct",
  });

  const [job] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)))
    .orderBy(desc(jobsTable.id))
    .limit(1);

  res.status(201).json(serializeJob(job));
});

/* ── GET /api/recruiter/jobs ────────────────────────────────────────────── */
router.get("/jobs", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobs = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)))
    .orderBy(desc(jobsTable.createdAt));

  res.json(jobs.map(serializeJob));
});

/* ── PATCH /api/recruiter/jobs/:jobId ───────────────────────────────────── */
router.patch("/jobs/:jobId", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobId = parseInt(req.params.jobId!, 10);
  const [existing] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  const {
    title, location, isRemote, type, category, salaryMin, salaryMax,
    description, requirements, skills, isFresher, experienceYears, applicationDeadline,
  } = req.body;

  await db.update(jobsTable)
    .set({
      ...(title && { title }),
      ...(location && { location }),
      isRemote: isRemote ?? existing.isRemote,
      ...(type && { type }),
      ...(category && { category }),
      salaryMin: salaryMin !== undefined ? parseInt(salaryMin) : existing.salaryMin,
      salaryMax: salaryMax !== undefined ? parseInt(salaryMax) : existing.salaryMax,
      ...(description && { description }),
      ...(requirements && { requirements }),
      ...(skills && { skills }),
      isFresher: isFresher ?? existing.isFresher,
      experienceYears: experienceYears !== undefined ? parseInt(experienceYears) : existing.experienceYears,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : existing.applicationDeadline,
    })
    .where(eq(jobsTable.id, jobId));

  const [updated] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);

  res.json(serializeJob(updated));
});

/* ── DELETE /api/recruiter/jobs/:jobId ──────────────────────────────────── */
router.delete("/jobs/:jobId", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobId = parseInt(req.params.jobId!, 10);
  const [existing] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  await db.delete(jobsTable).where(eq(jobsTable.id, jobId));
  res.json({ success: true });
});

/* ── PATCH /api/recruiter/jobs/:jobId/boost ─────────────────────────────── */
router.patch("/jobs/:jobId/boost", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobId = parseInt(req.params.jobId!, 10);

  const [rProfile] = await db.select({
    id: recruiterProfilesTable.id,
    jobBoostCredits: recruiterProfilesTable.jobBoostCredits,
  }).from(recruiterProfilesTable).where(eq(recruiterProfilesTable.userId, req.userId!)).limit(1);

  if (!rProfile) {
    res.status(400).json({ error: "Bad Request", message: "Recruiter profile not found" });
    return;
  }

  if ((rProfile.jobBoostCredits ?? 0) < 1) {
    res.status(403).json({ error: "No boost credits", message: "You have no boost credits remaining. Upgrade your plan." });
    return;
  }

  const [job] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);

  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  if (job.isBoosted) {
    res.status(400).json({ error: "Already boosted", message: "This job is already boosted." });
    return;
  }

  const boostExpiry = new Date();
  boostExpiry.setDate(boostExpiry.getDate() + 7);

  await db.update(jobsTable)
    .set({ isBoosted: true, boostedAt: new Date(), boostExpiry })
    .where(eq(jobsTable.id, jobId));

  const [updatedJob] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId)).limit(1);

  await db.update(recruiterProfilesTable)
    .set({ jobBoostCredits: (rProfile.jobBoostCredits ?? 1) - 1, updatedAt: new Date() })
    .where(eq(recruiterProfilesTable.id, rProfile.id));

  await db.insert(jobBoostTransactionsTable).values({
    userId: req.userId!,
    jobId,
    creditsUsed: 1,
    type: "boost",
  });

  res.json({ success: true, job: serializeJob(updatedJob), creditsRemaining: (rProfile.jobBoostCredits ?? 1) - 1 });
});

/* ── GET /api/recruiter/jobs/:jobId/applicants ──────────────────────────── */
router.get("/jobs/:jobId/applicants", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobId = parseInt(req.params.jobId!, 10);

  const [job] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);
  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  const apps = await db
    .select()
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.userId, usersTable.id))
    .where(eq(applicationsTable.jobId, jobId))
    .orderBy(desc(applicationsTable.appliedAt));

  const userIds = apps.map(a => a.users.id);
  const profiles = userIds.length > 0
    ? await db.select().from(profilesTable).where(inArray(profilesTable.userId, userIds))
    : [];

  const profileMap = new Map(profiles.map(p => [p.userId, p]));

  res.json({
    job: serializeJob(job),
    applicants: apps.map(row => {
      const profile = profileMap.get(row.users.id);
      return {
        applicationId: row.applications.id,
        userId: row.users.id,
        name: row.users.name,
        email: row.users.email,
        avatarUrl: row.users.avatarUrl ?? null,
        phone: row.users.phone ?? null,
        status: row.applications.status,
        recruiterStatus: row.applications.recruiterStatus ?? "pending",
        coverLetter: row.applications.coverLetter ?? null,
        resumeUrl: row.applications.resumeUrl ?? profile?.resumeUrl ?? null,
        notes: row.applications.notes ?? null,
        appliedAt: row.applications.appliedAt.toISOString(),
        profile: profile ? {
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience,
          headline: profile.headline,
          preferredLocations: profile.preferredLocations,
          isFresher: profile.isFresher,
          degreeLevel: profile.degreeLevel,
          specialization: profile.specialization,
        } : null,
      };
    }),
  });
});

/* ── PATCH /api/recruiter/jobs/:jobId/applicants/:appId ─────────────────── */
router.patch("/jobs/:jobId/applicants/:appId", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const jobId = parseInt(req.params.jobId!, 10);
  const appId = parseInt(req.params.appId!, 10);
  const { recruiterStatus, notes } = req.body;

  if (!["pending", "shortlisted", "rejected"].includes(recruiterStatus)) {
    res.status(400).json({ error: "Bad Request", message: "recruiterStatus must be pending, shortlisted, or rejected" });
    return;
  }

  const [job] = await db.select().from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.postedByUserId, req.userId!))).limit(1);
  if (!job) {
    res.status(404).json({ error: "Not Found", message: "Job not found" });
    return;
  }

  const [existing] = await db.select({ id: applicationsTable.id })
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, appId), eq(applicationsTable.jobId, jobId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Application not found" });
    return;
  }

  await db.update(applicationsTable)
    .set({ recruiterStatus, notes: notes ?? null, updatedAt: new Date() })
    .where(and(eq(applicationsTable.id, appId), eq(applicationsTable.jobId, jobId)));

  const [updated] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.id, appId), eq(applicationsTable.jobId, jobId)))
    .limit(1);

  res.json({ success: true, recruiterStatus: updated.recruiterStatus, notes: updated.notes });
});

/* ── GET /api/recruiter/analytics ──────────────────────────────────────── */
router.get("/analytics", authenticate, async (req: AuthRequest, res) => {
  if (!await requireRecruiter(req, res)) return;

  const myJobs = await db.select({ id: jobsTable.id, viewCount: jobsTable.viewCount, applicationCount: jobsTable.applicationCount })
    .from(jobsTable)
    .where(and(eq(jobsTable.postedByUserId, req.userId!), eq(jobsTable.isDirectPost, true)));

  const jobIds = myJobs.map(j => j.id);
  const totalJobs = myJobs.length;
  const totalViews = myJobs.reduce((s, j) => s + (j.viewCount ?? 0), 0);
  const totalApplications = myJobs.reduce((s, j) => s + (j.applicationCount ?? 0), 0);

  let shortlisted = 0;
  let rejected = 0;
  if (jobIds.length > 0) {
    const statusCounts = await db
      .select({ recruiterStatus: applicationsTable.recruiterStatus, count: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(inArray(applicationsTable.jobId, jobIds))
      .groupBy(applicationsTable.recruiterStatus);

    for (const row of statusCounts) {
      if (row.recruiterStatus === "shortlisted") shortlisted = Number(row.count);
      if (row.recruiterStatus === "rejected") rejected = Number(row.count);
    }
  }

  res.json({
    totalJobs,
    totalViews,
    totalApplications,
    shortlisted,
    rejected,
    pending: totalApplications - shortlisted - rejected,
  });
});

export default router;
