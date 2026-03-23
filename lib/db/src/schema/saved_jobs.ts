import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const savedJobsTable = mysqlTable("saved_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  jobId: int("job_id").notNull().references(() => jobsTable.id),
  notes: text("notes"),
  savedAt: datetime("saved_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SavedJob = typeof savedJobsTable.$inferSelect;
