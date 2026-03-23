import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing or invalid token" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user.length) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  req.userId = payload.userId;
  req.userRole = user[0].role;
  next();
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "Admin access required." });
    return;
  }
  next();
}
