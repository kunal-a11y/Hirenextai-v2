import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const aiUsageTable = mysqlTable("ai_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(),
  monthYear: text("month_year").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const creditTransactionsTable = mysqlTable(
  "credit_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => usersTable.id),
    creditsUsed: int("credits_used").notNull(),
    featureUsed: text("feature_used").notNull(),
    monthYear: text("month_year").notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("credit_transactions_user_id_idx").on(t.userId),
    index("credit_transactions_created_at_idx").on(t.createdAt),
  ]
);

export const subscriptionsTable = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id).unique(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  currentPeriodStart: datetime("current_period_start").notNull().default(sql`CURRENT_TIMESTAMP`),
  currentPeriodEnd: datetime("current_period_end"),
  cancelledAt: datetime("cancelled_at"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertAiUsageSchema = createInsertSchema(aiUsageTable).omit({ id: true, createdAt: true });
export type InsertAiUsage = z.infer<typeof insertAiUsageSchema>;
export type AiUsage = typeof aiUsageTable.$inferSelect;

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
