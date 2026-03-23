import { Router } from "express";
import { db, usersTable, profilesTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../lib/auth.js";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

function calcProfileCompletion(user: any, profile: any): number {
  let score = 0;
  if (user?.name) score += 15;
  if (user?.avatarUrl) score += 15;
  if (user?.phone) score += 15;
  if ((profile?.preferredLocations ?? []).length > 0) score += 15;
  if ((profile?.skills ?? []).length > 0) score += 15;
  if ((profile?.education ?? []).length > 0) score += 15;
  if (profile?.resumeUrl) score += 10;
  return score;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role = "job_seeker" } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Name, email, and password are required" });
      return;
    }

    const validRole = role === "recruiter" ? "recruiter" : "job_seeker";

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length) {
      res.status(400).json({ error: "Bad Request", message: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    await db.insert(usersTable).values({ name, email, passwordHash, phone, role: validRole });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (validRole === "job_seeker") {
      await db.insert(profilesTable).values({ userId: user.id }).ignore();
    }
    await db.insert(subscriptionsTable).values({ userId: user.id, plan: "free", status: "active" }).ignore();

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        avatarUrl: user.avatarUrl ?? null,
        subscriptionPlan: user.subscriptionPlan,
        role: user.role,
        profileCompletionPct: 20,
        createdAt: user.createdAt.toISOString(),
      }
    });
  } catch (err) {
    console.error("[POST /auth/register]", err);
    res.status(500).json({ error: "Internal Server Error", message: "Registration failed. Please try again." });
  }
});

const FOUNDER_EMAIL = "mindcraftgamer26@gmail.com";

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password are required" });
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    // Founder safety: always ensure admin role is set
    if (user.email === FOUNDER_EMAIL && user.role !== "admin") {
      await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
      const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
      user = updated;
    }

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id)).limit(1);
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        avatarUrl: user.avatarUrl ?? null,
        subscriptionPlan: user.subscriptionPlan,
        role: user.role,
        profileCompletionPct: calcProfileCompletion(user, profile),
        createdAt: user.createdAt.toISOString(),
      }
    });
  } catch (err) {
    console.error("[POST /auth/login]", err);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed. Please try again." });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id)).limit(1);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      subscriptionPlan: user.subscriptionPlan,
      role: user.role,
      profileCompletionPct: calcProfileCompletion(user, profile),
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[GET /auth/me]", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch user." });
  }
});

router.post("/logout", authenticate, async (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
