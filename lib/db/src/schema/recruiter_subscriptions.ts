import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const recruiterSubscriptionsTable = mysqlTable("recruiter_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  planName: text("plan_name").notNull().default("free"),
  jobPostLimit: int("job_post_limit").notNull().default(3),
  boostCredits: int("boost_credits").notNull().default(0),
  featuredJobs: int("featured_jobs").notNull().default(0),
  validTill: datetime("valid_till"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_rec_subs_user_id").on(table.userId),
  index("idx_rec_subs_plan_name").on(table.planName),
]);

export const insertRecruiterSubscriptionSchema = createInsertSchema(recruiterSubscriptionsTable).omit({ id: true, createdAt: true });
export type InsertRecruiterSubscription = z.infer<typeof insertRecruiterSubscriptionSchema>;
export type RecruiterSubscription = typeof recruiterSubscriptionsTable.$inferSelect;
