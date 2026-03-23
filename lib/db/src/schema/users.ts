import { sql } from "drizzle-orm";
import { mysqlTable, int, text, boolean, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  subscriptionPlan: text("subscription_plan").notNull().default("free"),
  role: text("role").notNull().default("job_seeker"),
  banned: boolean("banned").notNull().default(false),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const sessionsTable = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  token: text("token").notNull().unique(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: datetime("expires_at").notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
