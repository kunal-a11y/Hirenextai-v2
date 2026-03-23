import { sql } from "drizzle-orm";
import { mysqlTable, int, text, boolean, json, datetime, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const jobsTable = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  companyLogoUrl: text("company_logo_url"),
  location: text("location").notNull(),
  isRemote: boolean("is_remote").notNull().default(false),
  type: text("type").notNull().default("full-time"),
  category: text("category").notNull(),
  salaryMin: int("salary_min"),
  salaryMax: int("salary_max"),
  description: text("description").notNull(),
  requirements: json("requirements").$type<string[]>().notNull().$default(() => []),
  skills: json("skills").$type<string[]>().notNull().$default(() => []),
  isFresher: boolean("is_fresher").notNull().default(false),
  experienceYears: int("experience_years"),
  applicationCount: int("application_count").notNull().default(0),
  source: text("source").default("Database"),
  applyUrl: text("apply_url"),
  postedAt: datetime("posted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  isDirectPost: boolean("is_direct_post").notNull().default(false),
  postedByUserId: int("posted_by_user_id").references(() => usersTable.id),
  applicationDeadline: datetime("application_deadline"),
  viewCount: int("view_count").notNull().default(0),
  companyWebsite: text("company_website"),
  isBoosted: boolean("is_boosted").notNull().default(false),
  boostedAt: datetime("boosted_at"),
  boostExpiry: datetime("boost_expiry"),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredAt: datetime("featured_at"),
  featuredExpiry: datetime("featured_expiry"),
}, (table) => [
  index("idx_jobs_posted_at").on(table.postedAt),
  index("idx_jobs_location").on(table.location),
  index("idx_jobs_category").on(table.category),
  index("idx_jobs_type").on(table.type),
  index("idx_jobs_is_fresher").on(table.isFresher),
  index("idx_jobs_is_remote").on(table.isRemote),
  index("idx_jobs_salary_min").on(table.salaryMin),
  index("idx_jobs_salary_max").on(table.salaryMax),
  index("idx_jobs_experience_years").on(table.experienceYears),
  index("idx_jobs_source").on(table.source),
]);

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
