import { Router } from "express";
import { db, aiUsageTable, creditTransactionsTable, usersTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

/* ── Feature-based limits ────────────────────────────────────────────── */

const ALL_FEATURES = [
  "cover-letter", "recruiter-message", "resume-optimize",
  "interview-prep", "job-match", "career-suggestions", "simplify-job", "chat",
] as const;

type FeatureType = typeof ALL_FEATURES[number];

const FEATURE_LIMITS: Record<string, Record<FeatureType, number>> = {
  free: {
    "cover-letter":       3,
    "recruiter-message":  0,      // Pro+ only
    "resume-optimize":    5,
    "interview-prep":     0,      // Pro+ only
    "job-match":          3,
    "career-suggestions": 2,
    "simplify-job":       10,
    "chat":               20,
  },
  pro: {
    "cover-letter":       999999,
    "recruiter-message":  999999,
    "resume-optimize":    999999,
    "interview-prep":     999999,
    "job-match":          999999,
    "career-suggestions": 999999,
    "simplify-job":       999999,
    "chat":               999999,
  },
  premium: {
    "cover-letter":       999999,
    "recruiter-message":  999999,
    "resume-optimize":    999999,
    "interview-prep":     999999,
    "job-match":          999999,
    "career-suggestions": 999999,
    "simplify-job":       999999,
    "chat":               999999,
  },
};

const FEATURE_LABELS: Record<FeatureType, string> = {
  "cover-letter":       "Cover Letters",
  "recruiter-message":  "Recruiter Outreach",
  "resume-optimize":    "Resume Reviews",
  "interview-prep":     "Interview Prep",
  "job-match":          "Job Match Scores",
  "career-suggestions": "Career Suggestions",
  "simplify-job":       "Job Simplifier",
  "chat":               "AI Chat Messages",
};

const PRO_ONLY = new Set<FeatureType>(["recruiter-message", "interview-prep"]);

/* ── Credit system ────────────────────────────────────────────────────── */

const CREDIT_COSTS: Record<string, number> = {
  "cover-letter":       2,
  "recruiter-message":  2,
  "resume-optimize":    3,
  "interview-prep":     2,
  "job-match":          1,
  "career-suggestions": 1,
  "simplify-job":       1,
  "chat":               1,
};

const PLAN_CREDITS: Record<string, number> = {
  free:    20,
  pro:     200,
  premium: 999999,
};

function getMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ── Credit helper: get credits used this month ───────────────────────── */

async function getCreditsUsedThisMonth(userId: number): Promise<number> {
  const monthYear = getMonthYear();
  const [result] = await db
    .select({ total: sum(creditTransactionsTable.creditsUsed) })
    .from(creditTransactionsTable)
    .where(and(
      eq(creditTransactionsTable.userId, userId),
      eq(creditTransactionsTable.monthYear, monthYear),
    ));
  return Number(result?.total ?? 0);
}

/* ── Per-feature check & consume (with credit deduction) ─────────────── */

async function checkAndConsumeUsage(
  userId: number,
  plan: string,
  type: string,
): Promise<{ allowed: boolean; used: number; limit: number; creditsLeft: number; creditsUsed: number; creditsTotal: number; creditError?: boolean }> {
  const planLimits = FEATURE_LIMITS[plan] ?? FEATURE_LIMITS.free;
  const limit = (planLimits as Record<string, number>)[type] ?? 0;
  const planCredits = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const creditCost = CREDIT_COSTS[type] ?? 1;
  const monthYear = getMonthYear();

  const creditsUsed = await getCreditsUsedThisMonth(userId);
  const creditsLeft = planCredits >= 999999 ? 999999 : Math.max(0, planCredits - creditsUsed);

  // Feature blocked on this plan (e.g. Pro-only on free)
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, creditsLeft, creditsUsed, creditsTotal: planCredits };
  }

  // Check unified credit pool (skip for unlimited plans)
  if (planCredits < 999999 && creditsUsed + creditCost > planCredits) {
    return { allowed: false, used: 0, limit, creditsLeft: 0, creditsUsed, creditsTotal: planCredits, creditError: true };
  }

  // Unlimited plan — record usage for analytics and deduct credits, then allow
  if (limit >= 999999) {
    await Promise.all([
      db.insert(aiUsageTable).values({ userId, type, monthYear }),
      db.insert(creditTransactionsTable).values({ userId, creditsUsed: creditCost, featureUsed: type, monthYear }),
    ]);
    const newCreditsUsed = creditsUsed + creditCost;
    const newCreditsLeft = planCredits >= 999999 ? 999999 : Math.max(0, planCredits - newCreditsUsed);
    return { allowed: true, used: 1, limit, creditsLeft: newCreditsLeft, creditsUsed: newCreditsUsed, creditsTotal: planCredits };
  }

  // Count per-type usage this month
  const [countResult] = await db
    .select({ count: count() })
    .from(aiUsageTable)
    .where(and(
      eq(aiUsageTable.userId, userId),
      eq(aiUsageTable.type, type),
      eq(aiUsageTable.monthYear, monthYear),
    ));

  const used = Number(countResult?.count ?? 0);

  if (used >= limit) {
    return { allowed: false, used, limit, creditsLeft, creditsUsed, creditsTotal: planCredits };
  }

  await Promise.all([
    db.insert(aiUsageTable).values({ userId, type, monthYear }),
    db.insert(creditTransactionsTable).values({ userId, creditsUsed: creditCost, featureUsed: type, monthYear }),
  ]);

  const newCreditsUsed = creditsUsed + creditCost;
  const newCreditsLeft = Math.max(0, planCredits - newCreditsUsed);
  return { allowed: true, used: used + 1, limit, creditsLeft: newCreditsLeft, creditsUsed: newCreditsUsed, creditsTotal: planCredits };
}

/* Helper: build 402 response body */
function limitReachedBody(type: string, plan: string, usage: { used: number; limit: number; creditError?: boolean; creditsLeft?: number; creditsTotal?: number }) {
  const label = FEATURE_LABELS[type as FeatureType] ?? type;
  const isProOnly = PRO_ONLY.has(type as FeatureType) && usage.limit === 0;
  if (usage.creditError) {
    return {
      error: "AI Credits Exhausted",
      feature: type,
      featureLabel: label,
      requiredPlan: "pro",
      creditError: true,
      message: `You've used all ${usage.creditsTotal ?? 20} AI credits for this month. Upgrade to Pro for 200 credits.`,
    };
  }
  return {
    error: "Usage Limit Reached",
    feature: type,
    featureLabel: label,
    requiredPlan: "pro",
    message: isProOnly
      ? `${label} requires a Pro plan. Upgrade to unlock this feature.`
      : `You've used all ${usage.limit} ${label.toLowerCase()} for this month. Resets on the 1st.`,
  };
}

/* ── GET /api/ai/usage ───────────────────────────────────────────────── */

router.get("/usage", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const monthYear = getMonthYear();
  const plan = user?.subscriptionPlan ?? "free";
  const planLimits = FEATURE_LIMITS[plan] ?? FEATURE_LIMITS.free;

  // Fetch all usage for this user this month, grouped by type
  const usageCounts = await db
    .select({ type: aiUsageTable.type, count: count() })
    .from(aiUsageTable)
    .where(and(
      eq(aiUsageTable.userId, req.userId!),
      eq(aiUsageTable.monthYear, monthYear),
    ))
    .groupBy(aiUsageTable.type);

  const usageByType: Record<string, number> = {};
  for (const row of usageCounts) {
    usageByType[row.type] = Number(row.count);
  }

  // Build per-feature breakdown
  const features: Record<string, {
    used: number;
    limit: number;       // -1 = unlimited
    remaining: number;   // -1 = unlimited
    label: string;
    proOnly?: boolean;
  }> = {};

  let totalUsed = 0;
  let totalLimit = 0;

  for (const type of ALL_FEATURES) {
    const limit = (planLimits as Record<string, number>)[type] ?? 0;
    const used = usageByType[type] ?? 0;
    const unlimited = limit >= 999999;
    const remaining = unlimited ? -1 : Math.max(0, limit - used);

    features[type] = {
      used,
      limit:     unlimited ? -1 : limit,
      remaining,
      label:     FEATURE_LABELS[type],
      ...(PRO_ONLY.has(type) && plan === "free" ? { proOnly: true } : {}),
    };

    if (!unlimited) {
      totalUsed  += used;
      totalLimit += limit;
    }
  }

  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0, 0, 0, 0);

  const planCredits = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const creditsUsedThisMonth = await getCreditsUsedThisMonth(req.userId!);
  const creditsLeft = planCredits >= 999999 ? -1 : Math.max(0, planCredits - creditsUsedThisMonth);

  res.json({
    plan,
    features,
    resetDate: resetDate.toISOString(),
    // backward-compat fields (DashboardLayout)
    used:      totalUsed,
    limit:     totalLimit,
    remaining: Math.max(0, totalLimit - totalUsed),
    // unified credit pool
    creditsLeft,
    creditsUsed:  creditsUsedThisMonth,
    creditsTotal: planCredits >= 999999 ? -1 : planCredits,
  });
});

/* ── Cover Letter ────────────────────────────────────────────────────── */
router.post("/cover-letter", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "cover-letter");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("cover-letter", plan, usage));
    return;
  }

  const { jobTitle, company, jobDescription, userSkills = [], userName = "" } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert career coach who writes compelling, professional cover letters. Be concise, enthusiastic, and tailored to the specific job." },
      { role: "user", content: `Write a professional cover letter for:\nName: ${userName || "the applicant"}\nJob Title: ${jobTitle}\nCompany: ${company}\nJob Description: ${jobDescription}\nKey Skills: ${userSkills.join(", ")}\n\nWrite a 3-paragraph cover letter that is professional, specific, and compelling.` },
    ],
    max_tokens: 600,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["cover-letter"] ?? 0;
  res.json({ content, usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used), usageLimit: limit >= 999999 ? -1 : limit });
});

/* ── Recruiter Message ───────────────────────────────────────────────── */
router.post("/recruiter-message", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "recruiter-message");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("recruiter-message", plan, usage));
    return;
  }

  const { jobTitle, company, recruiterName, userSkills = [] } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert career coach who writes brief, compelling outreach messages to recruiters. Messages should be professional, personalized, and under 150 words." },
      { role: "user", content: `Write a LinkedIn/email outreach message to a recruiter:\nTarget Role: ${jobTitle}\nCompany: ${company}\nRecruiter Name: ${recruiterName || "the recruiter"}\nMy Key Skills: ${userSkills.join(", ")}\n\nWrite a short, compelling outreach message (under 150 words) that is professional and specific.` },
    ],
    max_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  res.json({ content, usageRemaining: -1, usageLimit: -1 });
});

/* ── Resume Optimize ─────────────────────────────────────────────────── */
router.post("/resume-optimize", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "resume-optimize");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("resume-optimize", plan, usage));
    return;
  }

  const { bullet, jobTitle, targetRole } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert resume writer who specializes in creating powerful, ATS-optimized resume bullet points using the STAR method. Include strong action verbs and quantifiable results." },
      { role: "user", content: `Optimize this resume bullet point for a ${targetRole || jobTitle} role:\n\nOriginal: ${bullet}\n\nProvide 2-3 improved versions with stronger action verbs, quantifiable metrics where possible, and clear impact. Format as numbered list.` },
    ],
    max_tokens: 400,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["resume-optimize"] ?? 0;
  res.json({ content, usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used), usageLimit: limit >= 999999 ? -1 : limit });
});

/* ── Interview Prep ──────────────────────────────────────────────────── */
router.post("/interview-prep", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "interview-prep");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("interview-prep", plan, usage));
    return;
  }

  const { jobTitle, company, jobDescription } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert interview coach who provides targeted interview preparation. Include likely questions, tips, and STAR method examples." },
      { role: "user", content: `Create an interview preparation guide for:\nJob Title: ${jobTitle}\nCompany: ${company}\nJob Description: ${jobDescription || "General role"}\n\nProvide:\n1. 5 likely interview questions with brief answer tips\n2. Key topics to research about the company\n3. 2 smart questions to ask the interviewer` },
    ],
    max_tokens: 700,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  res.json({ content, usageRemaining: -1, usageLimit: -1 });
});

/* ── Job Match ───────────────────────────────────────────────────────── */
router.post("/job-match", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "job-match");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("job-match", plan, usage));
    return;
  }

  const { jobTitle, jobDescription, jobSkills, userSkills, userEducation, userExperience, preferredLocations } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a precise career counsellor and job matching expert specialising in Indian tech job market, especially for freshers (BCA/MCA/BTech graduates)." },
      { role: "user", content: `Analyse this job and tell me how well it matches this candidate's profile.\n\nJOB:\nTitle: ${jobTitle}\nDescription: ${(jobDescription ?? "").slice(0, 800)}\nRequired Skills: ${(jobSkills ?? []).join(", ")}\n\nCANDIDATE:\nSkills: ${(userSkills ?? []).join(", ")}\nEducation: ${JSON.stringify(userEducation ?? [])}\nExperience: ${JSON.stringify(userExperience ?? [])}\nPreferred Locations: ${(preferredLocations ?? []).join(", ")}\n\nProvide:\n1. Match Score (0-100)\n2. Matching Skills (bullet points)\n3. Missing Skills to learn\n4. Why this job is/isn't a good fit (2-3 sentences)\n5. Action tips to increase chances (2-3 tips)\n\nKeep it concise and practical.` },
    ],
    max_tokens: 500,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["job-match"] ?? 0;
  res.json({ content, usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used), usageLimit: limit >= 999999 ? -1 : limit });
});

/* ── Career Suggestions ──────────────────────────────────────────────── */
router.post("/career-suggestions", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "career-suggestions");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("career-suggestions", plan, usage));
    return;
  }

  const { skills, education, degreeLevel, interests, preferredLocations, availabilityStatus } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a senior career counsellor specialising in the Indian IT job market for fresh graduates. Give actionable, realistic advice tailored to the Indian market." },
      { role: "user", content: `Give personalised career advice for this fresher:\n\nSkills: ${(skills ?? []).join(", ")}\nDegree: ${degreeLevel ?? "BCA/MCA/BTech"}\nEducation: ${JSON.stringify(education ?? [])}\nInterests: ${(interests ?? []).join(", ")}\nPreferred Cities: ${(preferredLocations ?? []).join(", ")}\nAvailability: ${availabilityStatus ?? "immediately"}\n\nProvide:\n1. Top 3 recommended career paths with reasoning\n2. Must-learn skills for each path\n3. Best job portals/companies to target\n4. Short-term action plan (next 3 months)\n5. One honest reality check about the market\n\nBe specific to India, actionable, and encouraging.` },
    ],
    max_tokens: 700,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["career-suggestions"] ?? 0;
  res.json({ content, usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used), usageLimit: limit >= 999999 ? -1 : limit });
});

/* ── Simplify Job ────────────────────────────────────────────────────── */
router.post("/simplify-job", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "simplify-job");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("simplify-job", plan, usage));
    return;
  }

  const { jobTitle, jobDescription } = req.body;
  if (!jobDescription) { res.status(400).json({ error: "jobDescription is required" }); return; }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You simplify complex job descriptions into clear, plain-English summaries for fresher job seekers." },
      { role: "user", content: `Simplify this job description for a fresher:\n\nJob Title: ${jobTitle ?? ""}\nDescription: ${jobDescription.slice(0, 1500)}\n\nProvide:\n1. What You'll Actually Do (3-5 bullets, plain English)\n2. Skills You Must Have\n3. Skills That Are Good to Know\n4. Perks & Benefits (if mentioned)\n5. Is this fresher-friendly? (Yes/No + 1-line reason)` },
    ],
    max_tokens: 500,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["simplify-job"] ?? 0;
  res.json({ content, usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used), usageLimit: limit >= 999999 ? -1 : limit });
});

/* ── AI Career Chat ──────────────────────────────────────────────────── */
router.post("/chat", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const plan = user?.subscriptionPlan ?? "free";
  const usage = await checkAndConsumeUsage(req.userId!, plan, "chat");

  if (!usage.allowed) {
    res.status(402).json(limitReachedBody("chat", plan, usage));
    return;
  }

  const { messages: history, userContext } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    userContext?: { skills?: string[]; education?: string; preferredLocations?: string[] };
  };

  if (!history || !Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const systemPrompt = `You are HireBot, an expert AI career assistant for HirenextAI — India's premier AI-powered job portal for freshers (BCA/MCA/BTech graduates).

You help users with:
- Career guidance and job search strategy
- Resume tips and cover letter advice
- Interview preparation
- Skill recommendations for Indian IT market
- Salary negotiation tips
- Understanding job descriptions
- Company culture and which companies hire freshers

${userContext?.skills?.length ? `User's skills: ${userContext.skills.join(", ")}` : ""}
${userContext?.education ? `Education: ${userContext.education}` : ""}
${userContext?.preferredLocations?.length ? `Preferred cities: ${userContext.preferredLocations.join(", ")}` : ""}

Keep responses concise (under 300 words), practical, and specific to India's job market. Use bullet points for lists. Be encouraging but honest.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 600,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
  const limit = (FEATURE_LIMITS[plan] as Record<string, number>)["chat"] ?? 0;
  res.json({
    reply,
    usageRemaining: limit >= 999999 ? -1 : Math.max(0, limit - usage.used),
    usageLimit: limit >= 999999 ? -1 : limit,
  });
});

export default router;
