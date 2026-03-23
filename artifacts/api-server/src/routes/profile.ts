import { Router } from "express";
import multer from "multer";
import { db, profilesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

/* ── Multer — memory storage, 5 MB cap ────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are accepted"));
  },
});

/* ── Profile completion formula ────────────────────────────────────────────── */
export function calcProfileCompletion(user: any, profile: any): number {
  let score = 0;
  if (user?.name) score += 7;
  if (user?.phone) score += 7;
  if ((profile?.preferredLocations ?? []).length > 0) score += 6;
  if ((profile?.skills ?? []).length >= 3) score += 25;
  else if ((profile?.skills ?? []).length > 0) score += 10;
  if ((profile?.education ?? []).length > 0) score += 15;
  if ((profile?.experience ?? []).length > 0) score += 20;
  if (profile?.resumeUrl) score += 10;
  if (profile?.careerGoal) score += 10;
  return Math.min(score, 100);
}

/* ── Format helper ─────────────────────────────────────────────────────────── */
function formatProfile(user: any, profile: any) {
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    skills: profile.skills ?? [],
    education: profile.education ?? [],
    experience: profile.experience ?? [],
    resumeUrl: profile.resumeUrl ?? null,
    preferredLocations: profile.preferredLocations ?? [],
    preferredCategories: profile.preferredCategories ?? [],
    openToRemote: profile.openToRemote,
    expectedSalaryMin: profile.expectedSalaryMin ?? null,
    expectedSalaryMax: profile.expectedSalaryMax ?? null,
    isFresher: profile.isFresher ?? true,
    degreeLevel: profile.degreeLevel ?? null,
    specialization: profile.specialization ?? null,
    setupCompleted: profile.setupCompleted ?? false,
    dateOfBirth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    languages: profile.languages ?? [],
    certifications: profile.certifications ?? [],
    portfolioLinks: profile.portfolioLinks ?? [],
    internshipExperience: profile.internshipExperience ?? [],
    jobTypePreference: profile.jobTypePreference ?? [],
    availabilityStatus: profile.availabilityStatus ?? null,
    careerGoal: profile.careerGoal ?? null,
    completionPct: calcProfileCompletion(user, profile),
  };
}

/* ── GET /api/profile ──────────────────────────────────────────────────────── */
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);

  if (!profile) {
    await db.insert(profilesTable).values({ userId: req.userId! });
    const [newProfile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
    profile = newProfile;
  }

  res.json(formatProfile(user, profile));
});

/* ── PATCH /api/profile ────────────────────────────────────────────────────── */
router.patch("/", authenticate, async (req: AuthRequest, res) => {
  const {
    name, phone, avatarUrl,
    headline, bio, skills, education, experience,
    preferredLocations, preferredCategories, openToRemote,
    expectedSalaryMin, expectedSalaryMax,
    isFresher, degreeLevel, specialization, setupCompleted,
    dateOfBirth, gender, languages, certifications, portfolioLinks,
    internshipExperience, jobTypePreference, availabilityStatus,
    careerGoal,
  } = req.body;

  const userUpdateData: any = { updatedAt: new Date() };
  if (name !== undefined) userUpdateData.name = name;
  if (phone !== undefined) userUpdateData.phone = phone;
  if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;

  let user: any;
  if (Object.keys(userUpdateData).length > 1) {
    await db.update(usersTable).set(userUpdateData).where(eq(usersTable.id, req.userId!));
    const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    user = updatedUser;
  } else {
    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    user = existingUser;
  }

  const profileUpdateData: any = { updatedAt: new Date() };
  if (headline !== undefined) profileUpdateData.headline = headline;
  if (bio !== undefined) profileUpdateData.bio = bio;
  if (skills !== undefined) profileUpdateData.skills = skills;
  if (education !== undefined) profileUpdateData.education = education;
  if (experience !== undefined) profileUpdateData.experience = experience;
  if (preferredLocations !== undefined) profileUpdateData.preferredLocations = preferredLocations;
  if (preferredCategories !== undefined) profileUpdateData.preferredCategories = preferredCategories;
  if (openToRemote !== undefined) profileUpdateData.openToRemote = openToRemote;
  if (expectedSalaryMin !== undefined) profileUpdateData.expectedSalaryMin = expectedSalaryMin;
  if (expectedSalaryMax !== undefined) profileUpdateData.expectedSalaryMax = expectedSalaryMax;
  if (isFresher !== undefined) profileUpdateData.isFresher = isFresher;
  if (degreeLevel !== undefined) profileUpdateData.degreeLevel = degreeLevel;
  if (specialization !== undefined) profileUpdateData.specialization = specialization;
  if (setupCompleted !== undefined) profileUpdateData.setupCompleted = setupCompleted;
  if (dateOfBirth !== undefined) profileUpdateData.dateOfBirth = dateOfBirth;
  if (gender !== undefined) profileUpdateData.gender = gender;
  if (languages !== undefined) profileUpdateData.languages = languages;
  if (certifications !== undefined) profileUpdateData.certifications = certifications;
  if (portfolioLinks !== undefined) profileUpdateData.portfolioLinks = portfolioLinks;
  if (internshipExperience !== undefined) profileUpdateData.internshipExperience = internshipExperience;
  if (jobTypePreference !== undefined) profileUpdateData.jobTypePreference = jobTypePreference;
  if (availabilityStatus !== undefined) profileUpdateData.availabilityStatus = availabilityStatus;
  if (careerGoal !== undefined) profileUpdateData.careerGoal = careerGoal;

  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);

  let profile: any;
  if (existing) {
    await db.update(profilesTable).set(profileUpdateData).where(eq(profilesTable.userId, req.userId!));
    const [updated] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
    profile = updated;
  } else {
    await db.insert(profilesTable).values({ userId: req.userId!, ...profileUpdateData });
    const [newProfile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
    profile = newProfile;
  }

  res.json(formatProfile(user, profile));
});

/* ── GET /api/profile/skill-suggestions ────────────────────────────────────── */
const POPULAR_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python",
  "Java", "C++", "SQL", "MongoDB", "PostgreSQL",
  "HTML/CSS", "Git", "REST APIs", "GraphQL", "Docker",
  "AWS", "Linux", "Express.js", "Next.js", "Vue.js",
  "Machine Learning", "Data Analysis", "Excel", "Communication",
  "Problem Solving", "Agile/Scrum", "Figma", "Tailwind CSS",
  "Spring Boot", "Django",
];

router.get("/skill-suggestions", authenticate, async (_req: AuthRequest, res) => {
  res.json({ skills: POPULAR_SKILLS });
});

/* ── POST /api/profile/upload-resume ───────────────────────────────────────── */
router.post(
  "/upload-resume",
  authenticate,
  upload.single("resume"),
  async (req: AuthRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "No PDF file provided" });

    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const parsed = await pdfParse(req.file.buffer);
      const resumeText = parsed.text?.slice(0, 8000) ?? "";

      if (!resumeText.trim()) {
        return res.status(422).json({ error: "Could not extract text from PDF" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract structured career data from the resume text.
Return ONLY valid JSON with this exact shape:
{
  "skills": ["string"],
  "education": [{ "institution": "string", "degree": "string", "field": "string", "startYear": number, "endYear": number | null, "current": boolean }],
  "experience": [{ "company": "string", "title": "string", "location": null, "startDate": "YYYY-MM", "endDate": "YYYY-MM" | null, "current": boolean, "description": "string" }],
  "careerGoal": "string"
}
Keep arrays empty if no relevant data. For careerGoal write a one-sentence career objective inferred from the resume.`,
          },
          { role: "user", content: resumeText },
        ],
      });

      let parsed_data: any = {};
      try {
        parsed_data = JSON.parse(completion.choices[0].message.content ?? "{}");
      } catch {
        parsed_data = {};
      }

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

      const resumeUrl = `resume:${req.file.originalname}:${Date.now()}`;

      const profileUpdateData: any = {
        updatedAt: new Date(),
        resumeUrl,
      };
      if ((parsed_data.skills ?? []).length > 0) profileUpdateData.skills = parsed_data.skills;
      if ((parsed_data.education ?? []).length > 0) profileUpdateData.education = parsed_data.education;
      if ((parsed_data.experience ?? []).length > 0) profileUpdateData.experience = parsed_data.experience;
      if (parsed_data.careerGoal) profileUpdateData.careerGoal = parsed_data.careerGoal;

      const [existingProfile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);

      let profile: any;
      if (existingProfile) {
        await db.update(profilesTable).set(profileUpdateData).where(eq(profilesTable.userId, req.userId!));
        const [updated] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
        profile = updated;
      } else {
        await db.insert(profilesTable).values({ userId: req.userId!, ...profileUpdateData });
        const [newProfile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
        profile = newProfile;
      }

      return res.json({
        message: "Resume parsed and profile updated",
        profile: formatProfile(user, profile),
        parsed: parsed_data,
      });
    } catch (err: any) {
      console.error("[upload-resume]", err);
      return res.status(500).json({ error: "Failed to parse resume", detail: err?.message });
    }
  }
);

export default router;
