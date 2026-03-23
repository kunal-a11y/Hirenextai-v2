import { Router } from "express";
import { db, resumesTable, profilesTable, usersTable, aiUsageTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 50, premium: 999999 };

function getMonthYear() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function checkAndConsumeUsage(userId: number, plan: string, type: string) {
  const monthYear = getMonthYear();
  const limit = PLAN_LIMITS[plan] ?? 5;
  const [r] = await db.select({ count: count() }).from(aiUsageTable)
    .where(and(eq(aiUsageTable.userId, userId), eq(aiUsageTable.monthYear, monthYear)));
  const used = Number(r?.count ?? 0);
  if (used >= limit) return { allowed: false, used, limit };
  await db.insert(aiUsageTable).values({ userId, type, monthYear });
  return { allowed: true, used: used + 1, limit };
}

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).limit(1);
    res.json(resume ?? null);
  } catch (err) {
    console.error("[GET /resume]", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/analyze", authenticate, async (req: AuthRequest, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      res.status(400).json({ error: "Bad Request", message: "Resume text must be at least 50 characters." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    const usage = await checkAndConsumeUsage(req.userId!, user?.subscriptionPlan ?? "free", "resume_analyze");
    if (!usage.allowed) {
      res.status(429).json({ error: "Usage Limit", message: `Monthly AI limit of ${usage.limit} reached.` });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert resume reviewer for the Indian job market, specializing in freshers (BCA/MCA/BTech). 
Analyze the provided resume and return ONLY valid JSON with no markdown code blocks.`
        },
        {
          role: "user",
          content: `Analyze this resume for an Indian fresher and return a JSON object with EXACTLY these fields:
{
  "strengthScore": <integer 0-100>,
  "overallFeedback": "<2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "missingSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "recommendedRoles": ["<role 1>", "<role 2>", "<role 3>"],
  "salaryRange": { "min": <number in LPA>, "max": <number in LPA> },
  "atsScore": <integer 0-100>,
  "keywordsFound": ["<keyword 1>", "<keyword 2>"],
  "formatTips": ["<tip 1>", "<tip 2>"]
}

Resume text:
${resumeText.slice(0, 3000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let analysis: any;
    try {
      analysis = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    } catch {
      analysis = { strengthScore: 60, overallFeedback: "Resume analyzed.", strengths: [], improvements: [], missingSkills: [], recommendedRoles: [], salaryRange: { min: 3, max: 6 }, atsScore: 60, keywordsFound: [], formatTips: [] };
    }

    const [existing] = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).limit(1);
    if (existing) {
      await db.update(resumesTable).set({ type: "upload", analysis, strengthScore: analysis.strengthScore, updatedAt: new Date() })
        .where(eq(resumesTable.userId, req.userId!));
    } else {
      await db.insert(resumesTable).values({ userId: req.userId!, type: "upload", analysis, strengthScore: analysis.strengthScore });
    }

    res.json({ analysis, usageUsed: usage.used, usageLimit: usage.limit });
  } catch (err) {
    console.error("[POST /resume/analyze]", err);
    res.status(500).json({ error: "Internal Server Error", message: "Resume analysis failed." });
  }
});

router.post("/generate", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);

    const usage = await checkAndConsumeUsage(req.userId!, user?.subscriptionPlan ?? "free", "resume_generate");
    if (!usage.allowed) {
      res.status(429).json({ error: "Usage Limit", message: `Monthly AI limit of ${usage.limit} reached.` });
      return;
    }

    const isPaid = user?.subscriptionPlan !== "free";

    const profileContext = JSON.stringify({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      skills: profile?.skills ?? [],
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      internships: profile?.internshipExperience ?? [],
      certifications: profile?.certifications ?? [],
      portfolioLinks: profile?.portfolioLinks ?? [],
      headline: profile?.headline,
      bio: profile?.bio,
      expectedSalaryMin: profile?.expectedSalaryMin,
      expectedSalaryMax: profile?.expectedSalaryMax,
      preferredLocations: profile?.preferredLocations ?? [],
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional resume writer specializing in Indian job market resumes for freshers. 
Create a clean, ATS-optimized resume in structured JSON format.
${isPaid ? "" : "Note: This is a free-tier resume. Do NOT add any branding text in the output JSON."}`
        },
        {
          role: "user",
          content: `Generate a professional resume for this candidate. Return ONLY valid JSON (no markdown):
{
  "name": "<full name>",
  "contactInfo": { "email": "<email>", "phone": "<phone>", "location": "<city>" },
  "summary": "<3-4 sentence professional summary>",
  "skills": ["<skill1>", "<skill2>", ...],
  "education": [{ "institution": "<name>", "degree": "<degree>", "field": "<field>", "year": "<year>" }],
  "experience": [{ "company": "<company>", "role": "<role>", "duration": "<duration>", "bullets": ["<achievement 1>", "<achievement 2>"] }],
  "internships": [{ "company": "<company>", "role": "<role>", "duration": "<duration>", "bullets": ["<task>"] }],
  "certifications": [{ "name": "<name>", "issuer": "<issuer>", "year": "<year>" }],
  "projects": [{ "name": "<project>", "description": "<description>", "tech": ["<tech>"] }],
  "languages": ["English", "Hindi"]
}

Candidate profile:
${profileContext}`
        }
      ],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let content: any;
    try {
      content = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    } catch {
      content = { name: user?.name ?? "Candidate", summary: "Professional summary", skills: profile?.skills ?? [] };
    }

    const [existing] = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).limit(1);
    if (existing) {
      await db.update(resumesTable).set({ type: "ai-generated", content, updatedAt: new Date() })
        .where(eq(resumesTable.userId, req.userId!));
    } else {
      await db.insert(resumesTable).values({ userId: req.userId!, type: "ai-generated", content });
    }

    res.json({ resume: content, isPaid, usageUsed: usage.used, usageLimit: usage.limit });
  } catch (err) {
    console.error("[POST /resume/generate]", err);
    res.status(500).json({ error: "Internal Server Error", message: "Resume generation failed." });
  }
});

export default router;
