import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const recruiterProfilesTable = mysqlTable("recruiter_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id).unique(),
  companyName: text("company_name").notNull(),
  companyLogoUrl: text("company_logo_url"),
  companyWebsite: text("company_website"),
  companySize: text("company_size"),
  industry: text("industry"),
  recruiterName: text("recruiter_name").notNull(),
  recruiterPosition: text("recruiter_position"),
  workEmail: text("work_email").notNull(),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  description: text("description"),
  companyLocation: text("company_location"),
  setupCompleted: text("setup_completed").notNull().default("false"),
  recruiterPlan: text("recruiter_plan").notNull().default("free"),
  jobBoostCredits: int("job_boost_credits").notNull().default(0),
  featuredJobsCredits: int("featured_jobs_credits").notNull().default(0),
  planValidTill: datetime("plan_valid_till"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertRecruiterProfileSchema = createInsertSchema(recruiterProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecruiterProfile = z.infer<typeof insertRecruiterProfileSchema>;
export type RecruiterProfile = typeof recruiterProfilesTable.$inferSelect;
