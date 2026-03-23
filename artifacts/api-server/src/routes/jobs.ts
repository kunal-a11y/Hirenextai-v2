import { Router } from "express";
import { db, jobsTable, profilesTable, usersTable } from "@workspace/db";
import { eq, sql, and, or, like, gte, lte, isNull, desc } from "drizzle-orm";
import { aggregateJobs } from "../services/jobAggregator.js";
import { getSchedulerStatus, runScheduledFetch } from "../services/jobScheduler.js";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";
import { calcProfileCompletion } from "./profile.js";

const router = Router();

/* ── Recommendation cache: userId → {jobs, timestamp} ─────────────────────── */
const recoCache = new Map<number, { jobs: any[]; ts: number }>();
const RECO_TTL = 10 * 60 * 1000; // 10 minutes

/* ── GET /api/jobs/recommended — personalised for logged-in user ─────────── */
router.get("/recommended", authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const cached = recoCache.get(userId);
  if (cached && Date.now() - cached.ts < RECO_TTL) {
    return res.json(cached.jobs);
  }

  const [profile] = await db.select().from(profilesTable)
    .where(eq(profilesTable.userId, userId)).limit(1);

  if (!profile || (profile.skills ?? []).length === 0) {
    return res.json([]);
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const completionPct = calcProfileCompletion(user, profile);

  const userSkills   = (profile.skills ?? []).map((s: string) => s.toLowerCase());
  const userLocations = (profile.preferredLocations ?? []).map((l: string) => l.toLowerCase());
  const userJobTypes  = (profile.jobTypePreference ?? []).map((t: string) => t.toLowerCase());
  const userSalMin    = profile.expectedSalaryMin ?? 0;
  const userSalMax    = profile.expectedSalaryMax ?? 0;
  const userIsFresher = profile.isFresher ?? true;

  const jobs = await db.select().from(jobsTable)
    .orderBy(desc(jobsTable.postedAt))
    .limit(200);

  const scored = jobs.map(job => {
    const jobSkills = (job.skills ?? []).map((s: string) => s.toLowerCase());
    let skillScore = 0;
    if (jobSkills.length > 0 && userSkills.length > 0) {
      const matched = jobSkills.filter((js: string) =>
        userSkills.some((us: string) => js.includes(us) || us.includes(js))
      ).length;
      skillScore = Math.min(matched / userSkills.length, 1);
    }

    let locationScore = 0;
    if (userLocations.length === 0) {
      locationScore = 0.5;
    } else if (job.isRemote && profile.openToRemote) {
      locationScore = 1;
    } else {
      const jobLoc = job.location.toLowerCase();
      if (userLocations.some((l: string) => jobLoc.includes(l) || l.includes(jobLoc))) {
        locationScore = 1;
      } else if (job.isRemote) {
        locationScore = 0.6;
      }
    }

    let expScore = 0;
    const jobExp = job.experienceYears;
    if (userIsFresher) {
      if (job.isFresher || jobExp === null || jobExp === 0) expScore = 1;
      else if (jobExp <= 1) expScore = 0.7;
      else if (jobExp <= 2) expScore = 0.4;
      else expScore = 0.1;
    } else {
      expScore = 0.8;
    }

    let salaryScore = 0.5;
    const jobMin = job.salaryMin ?? 0;
    const jobMax = job.salaryMax ?? 0;
    if ((userSalMin > 0 || userSalMax > 0) && (jobMin > 0 || jobMax > 0)) {
      const uMid = userSalMax > 0 ? (userSalMin + userSalMax) / 2 : userSalMin * 1.3;
      const jMid = jobMax > 0 ? (jobMin + jobMax) / 2 : jobMin * 1.3;
      if (uMid > 0 && jMid > 0) {
        salaryScore = Math.min(jMid, uMid) / Math.max(jMid, uMid);
      }
    }

    let typeScore = userJobTypes.length === 0 ? 1 : 0;
    if (userJobTypes.length > 0) {
      const jt = job.type.toLowerCase();
      if (userJobTypes.some((t: string) => jt.includes(t) || t.includes(jt))) typeScore = 1;
    }

    let rawScore = (skillScore * 0.45 + locationScore * 0.20 + expScore * 0.15 + salaryScore * 0.10 + typeScore * 0.10) * 100;
    if (completionPct > 80) rawScore = Math.min(rawScore * 1.10, 100);
    else if (completionPct < 40) rawScore = rawScore * 0.70;
    const matchScore = Math.round(rawScore);

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogoUrl: job.companyLogoUrl ?? null,
      location: job.location,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      type: job.type,
      postedAt: job.postedAt.toISOString(),
      matchScore,
      isRemote: job.isRemote,
      isFresher: job.isFresher,
      skills: (job.skills ?? []).slice(0, 5),
      applyUrl: job.applyUrl ?? null,
      source: job.source ?? "Database",
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const top10 = scored.slice(0, 10);

  recoCache.set(userId, { jobs: top10, ts: Date.now() });
  return res.json(top10);
});

/* ── DB-level search & filter ────────────────────────────────────────────── */
async function searchJobsFromDB(params: {
  keyword?: string;
  category?: string;
  location?: string;
  remote?: boolean;
  type?: string;
  fresher?: boolean;
  experience?: string;
  minSalary?: number;
  maxSalary?: number;
  skills?: string[];
  sortBy?: string;
  page: number;
  limit: number;
}) {
  const conditions: any[] = [];

  // Keyword: search title, company, description, skills (MySQL LIKE is case-insensitive)
  if (params.keyword) {
    const kw = `%${params.keyword}%`;
    conditions.push(
      or(
        like(jobsTable.title, kw),
        like(jobsTable.company, kw),
        like(jobsTable.description, kw),
        like(jobsTable.location, kw),
        sql`CAST(${jobsTable.skills} AS CHAR) LIKE ${kw}`,
        sql`CAST(${jobsTable.requirements} AS CHAR) LIKE ${kw}`,
      )
    );
  }

  // Category (MySQL LIKE is case-insensitive)
  if (params.category) {
    conditions.push(like(jobsTable.category, params.category));
  }

  // Location
  if (params.location && params.location.toLowerCase() !== "remote") {
    conditions.push(
      or(like(jobsTable.location, `%${params.location}%`), eq(jobsTable.isRemote, true))
    );
  }

  // Remote
  if (params.remote) {
    conditions.push(eq(jobsTable.isRemote, true));
  }

  // Job type
  if (params.type) {
    conditions.push(eq(jobsTable.type, params.type as any));
  }

  // Fresher toggle
  if (params.fresher) {
    conditions.push(
      or(eq(jobsTable.isFresher, true), eq(jobsTable.category, "Internship"))
    );
  }

  // Experience level
  if (params.experience && params.experience !== "any") {
    switch (params.experience) {
      case "fresher":
        conditions.push(
          or(
            eq(jobsTable.isFresher, true),
            isNull(jobsTable.experienceYears),
            lte(jobsTable.experienceYears, 1)
          )
        );
        break;
      case "1-3":
        conditions.push(
          and(gte(jobsTable.experienceYears, 1), lte(jobsTable.experienceYears, 3))
        );
        break;
      case "3-5":
        conditions.push(
          and(gte(jobsTable.experienceYears, 3), lte(jobsTable.experienceYears, 5))
        );
        break;
      case "5+":
        conditions.push(gte(jobsTable.experienceYears, 5));
        break;
    }
  }

  // Skills multi-select: job must match at least one selected skill (JSON cast + LIKE)
  if (params.skills && params.skills.length > 0) {
    const skillConditions = params.skills.map(s =>
      sql`CAST(${jobsTable.skills} AS CHAR) LIKE ${`%${s}%`}`
    );
    conditions.push(or(...skillConditions));
  }

  // Salary: min/max
  if (params.minSalary && params.minSalary > 0) {
    conditions.push(
      or(
        gte(jobsTable.salaryMax, params.minSalary),
        gte(jobsTable.salaryMin, params.minSalary)
      )
    );
  }
  if (params.maxSalary && params.maxSalary > 0) {
    conditions.push(
      or(
        lte(jobsTable.salaryMin, params.maxSalary),
        isNull(jobsTable.salaryMin)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort order (MySQL-compatible: no NULLS LAST syntax)
  let orderClause: any;
  switch (params.sortBy) {
    case "salary-high":
      orderClause = [
        sql`CASE WHEN ${jobsTable.salaryMax} IS NULL THEN 1 ELSE 0 END ASC`,
        sql`${jobsTable.salaryMax} DESC`,
        sql`CASE WHEN ${jobsTable.salaryMin} IS NULL THEN 1 ELSE 0 END ASC`,
        sql`${jobsTable.salaryMin} DESC`,
        desc(jobsTable.postedAt),
      ];
      break;
    case "salary-low":
      orderClause = [
        sql`CASE WHEN ${jobsTable.salaryMin} IS NULL THEN 1 ELSE 0 END ASC`,
        sql`${jobsTable.salaryMin} ASC`,
        desc(jobsTable.postedAt),
      ];
      break;
    case "relevant":
      orderClause = [
        sql`${jobsTable.isFresher} DESC`,
        sql`IF(${jobsTable.salaryMax} IS NOT NULL, 1, 0) DESC`,
        desc(jobsTable.postedAt),
      ];
      break;
    default: // "latest" — featured first, then boosted, India-first, then newest
      orderClause = [
        sql`${jobsTable.isFeatured} DESC`,
        sql`${jobsTable.isBoosted} DESC`,
        ...(params.location ? [] : [
          sql`CASE WHEN ${jobsTable.location} LIKE '%bangalore%' OR ${jobsTable.location} LIKE '%hyderabad%' OR ${jobsTable.location} LIKE '%mumbai%' OR ${jobsTable.location} LIKE '%delhi%' OR ${jobsTable.location} LIKE '%pune%' OR ${jobsTable.location} LIKE '%chennai%' OR ${jobsTable.location} LIKE '%kolkata%' OR ${jobsTable.location} LIKE '%india%' THEN 1 ELSE 0 END DESC`,
        ]),
        desc(jobsTable.postedAt),
      ];
  }

  const offset = (params.page - 1) * params.limit;

  const [rows, countResult] = await Promise.all([
    db.select().from(jobsTable)
      .where(whereClause)
      .orderBy(...(Array.isArray(orderClause) ? orderClause : [orderClause]))
      .limit(params.limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    jobs: rows.map(j => ({
      ...j,
      companyLogoUrl: j.companyLogoUrl ?? null,
      salaryMin: j.salaryMin ?? null,
      salaryMax: j.salaryMax ?? null,
      experienceYears: j.experienceYears ?? null,
      source: j.source ?? "Database",
      applyUrl: j.applyUrl ?? null,
      postedAt: j.postedAt.toISOString(),
    })),
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
  };
}

/* ── List / Search Jobs ────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  const {
    category, location, remote, type, search, fresher, forceRefresh,
    keyword, experience, minSalary, maxSalary, sortBy,
    page = "1", limit = "30",
  } = req.query as Record<string, string>;

  const rawSkills = req.query.skills;
  const skillsFilter: string[] = Array.isArray(rawSkills)
    ? (rawSkills as string[]).flatMap(s => s.split(",").map(x => x.trim()).filter(Boolean))
    : typeof rawSkills === "string"
    ? rawSkills.split(",").map(x => x.trim()).filter(Boolean)
    : [];

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(parseInt(limit, 10) || 30, 150);

  const effectiveKeyword = keyword || search;

  const hasAdvancedFilters = !!(experience || minSalary || maxSalary || sortBy || skillsFilter.length > 0);
  const hasAnyFilter = !!(effectiveKeyword || category || location || remote || type || fresher || hasAdvancedFilters);

  if (hasAnyFilter && !forceRefresh) {
    try {
      const result = await searchJobsFromDB({
        keyword: effectiveKeyword || undefined,
        category: category || undefined,
        location: location || undefined,
        remote: remote === "true",
        type: type || undefined,
        fresher: fresher === "true",
        experience: experience || undefined,
        minSalary: minSalary ? parseInt(minSalary) : undefined,
        maxSalary: maxSalary ? parseInt(maxSalary) : undefined,
        skills: skillsFilter.length > 0 ? skillsFilter : undefined,
        sortBy: sortBy || "latest",
        page: pageNum,
        limit: limitNum,
      });

      return res.json({
        ...result,
        sources: ["Database"],
        fromCache: false,
        liveJobsActive: false,
        expandedTerms: [],
        relatedCategories: [],
        fallbackUsed: false,
        smartSearchActive: false,
        totalBeforeFilter: result.total,
      });
    } catch (err) {
      console.error("DB search error:", err);
    }
  }

  try {
    const result = await aggregateJobs({
      search: effectiveKeyword || undefined,
      category: category || undefined,
      location: location || undefined,
      remote: remote === "true",
      type: type || undefined,
      fresher: fresher === "true",
      forceRefresh: forceRefresh === "true",
    });

    const { jobs, sources, fromCache, expandedTerms, relatedCategories, fallbackUsed, smartSearchActive, totalBeforeFilter } = result;
    const total = jobs.length;
    const paged = jobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.json({
      jobs: paged.map(j => ({
        ...j,
        source: j.source ?? "Database",
        applyUrl: j.applyUrl ?? null,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      sources,
      fromCache,
      liveJobsActive: sources.some(s => !["Database", "Demo", "Seed"].includes(s)),
      expandedTerms,
      relatedCategories,
      fallbackUsed,
      smartSearchActive,
      totalBeforeFilter,
    });
  } catch (err) {
    console.error("Job aggregator error:", err);
    const dbResult = await searchJobsFromDB({ page: pageNum, limit: limitNum });
    return res.json({
      ...dbResult,
      sources: ["Database"],
      fromCache: false,
      liveJobsActive: false,
      expandedTerms: [],
      relatedCategories: [],
      fallbackUsed: false,
      smartSearchActive: false,
      totalBeforeFilter: dbResult.total,
    });
  }
});

/* ── Fetch Status / Logs ───────────────────────────────────────────────── */
router.get("/fetch-status", async (_req, res) => {
  const status = getSchedulerStatus();
  const countRes = await db.select({ count: sql<number>`count(*)` }).from(jobsTable);
  const totalJobs = Number(countRes[0]?.count ?? 0);
  res.json({ ...status, totalJobsInDB: totalJobs });
});

/* ── Manual refresh trigger ────────────────────────────────────────────── */
router.post("/refresh", authenticate, async (_req: AuthRequest, res) => {
  res.json({ message: "Background refresh started." });
  runScheduledFetch("Manual").catch(console.error);
});

/* ── Single job ──────────────────────────────────────────────────────── */
router.get("/:jobId", async (req, res) => {
  const id = parseInt(req.params.jobId!, 10);
  if (isNaN(id)) { res.status(404).json({ error: "Not Found", message: "Route not found" }); return; }
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Not Found", message: "Job not found" }); return; }
  res.json({
    ...job,
    companyLogoUrl: job.companyLogoUrl ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    experienceYears: job.experienceYears ?? null,
    source: job.source ?? "Database",
    applyUrl: job.applyUrl ?? null,
    postedAt: job.postedAt.toISOString(),
  });
});

export default router;
