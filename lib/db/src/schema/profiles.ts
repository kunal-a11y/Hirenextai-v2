import { sql } from "drizzle-orm";
import { mysqlTable, int, text, boolean, json, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const profilesTable = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id).unique(),
  headline: text("headline"),
  bio: text("bio"),
  skills: json("skills").$type<string[]>().notNull().$default(() => []),
  education: json("education").$type<any[]>().notNull().$default(() => []),
  experience: json("experience").$type<any[]>().notNull().$default(() => []),
  resumeUrl: text("resume_url"),
  preferredLocations: json("preferred_locations").$type<string[]>().notNull().$default(() => []),
  preferredCategories: json("preferred_categories").$type<string[]>().notNull().$default(() => []),
  openToRemote: boolean("open_to_remote").notNull().default(true),
  expectedSalaryMin: int("expected_salary_min"),
  expectedSalaryMax: int("expected_salary_max"),
  isFresher: boolean("is_fresher").notNull().default(true),
  degreeLevel: text("degree_level"),
  specialization: text("specialization"),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  languages: json("languages").$type<string[]>().notNull().$default(() => []),
  certifications: json("certifications").$type<any[]>().notNull().$default(() => []),
  portfolioLinks: json("portfolio_links").$type<string[]>().notNull().$default(() => []),
  internshipExperience: json("internship_experience").$type<any[]>().notNull().$default(() => []),
  jobTypePreference: json("job_type_preference").$type<string[]>().notNull().$default(() => []),
  availabilityStatus: text("availability_status"),
  careerGoal: text("career_goal"),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const resumesTable = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id).unique(),
  type: text("type").notNull().default("none"),
  fileUrl: text("file_url"),
  content: json("content").$type<any>(),
  analysis: json("analysis").$type<any>(),
  strengthScore: int("strength_score"),
  generatedText: text("generated_text"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
