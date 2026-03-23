import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const jobBoostTransactionsTable = mysqlTable("job_boost_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  jobId: int("job_id").notNull().references(() => jobsTable.id),
  creditsUsed: int("credits_used").notNull().default(1),
  type: text("type").notNull().default("boost"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_jbt_user_id").on(table.userId),
  index("idx_jbt_job_id").on(table.jobId),
  index("idx_jbt_type").on(table.type),
]);

export const insertJobBoostTransactionSchema = createInsertSchema(jobBoostTransactionsTable).omit({ id: true, createdAt: true });
export type InsertJobBoostTransaction = z.infer<typeof insertJobBoostTransactionSchema>;
export type JobBoostTransaction = typeof jobBoostTransactionsTable.$inferSelect;
