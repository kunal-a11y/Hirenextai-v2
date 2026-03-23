import { Router } from "express";
import { db, supportTicketsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { verifyToken } from "../lib/auth.js";
import type { AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const limit = 5;
  const timestamps = (rateLimitMap.get(email) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  rateLimitMap.set(email, timestamps);
  return false;
}

function sanitize(str: string): string {
  return str.replace(/[<>]/g, "").trim();
}

router.post("/ticket", async (req: AuthRequest, res) => {
  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "Validation failed", message: "All fields are required." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Validation failed", message: "Invalid email address." });
    return;
  }

  const cleanMessage = sanitize(String(message)).slice(0, 1000);
  const cleanName = sanitize(String(name)).slice(0, 200);
  const cleanSubject = sanitize(String(subject)).slice(0, 300);
  const cleanEmail = String(email).toLowerCase().trim().slice(0, 254);

  if (isRateLimited(cleanEmail)) {
    res.status(429).json({ error: "Rate limited", message: "Too many tickets. Please wait an hour before submitting again." });
    return;
  }

  let userId: number | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyToken(authHeader.slice(7));
    if (payload?.userId) userId = payload.userId;
  }

  await db.insert(supportTicketsTable).values({
    userId: userId ?? null,
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    status: "open",
  });

  res.status(201).json({ success: true, message: "Ticket created successfully" });
});

export default router;
