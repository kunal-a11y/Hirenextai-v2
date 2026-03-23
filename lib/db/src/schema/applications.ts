import { sql } from "drizzle-orm";
import { mysqlTable, int, text, boolean, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const applicationsTable = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("job_id").notNull().references(() => jobsTable.id),
  userId: int("user_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("applied"),
  recruiterStatus: text("recruiter_status").notNull().default("pending"),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  notes: text("notes"),
  followUpDate: datetime("follow_up_date"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  appliedAt: datetime("applied_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, appliedAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
