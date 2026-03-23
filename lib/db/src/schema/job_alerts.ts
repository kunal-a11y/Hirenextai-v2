import { sql } from "drizzle-orm";
import { int, text, boolean, datetime, mysqlTable, json } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const jobAlertsTable = mysqlTable("job_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  frequency: text("frequency").notNull().default("daily"),
  keywords: json("keywords").$type<string[]>().notNull().$default(() => []),
  skills: json("skills").$type<string[]>().notNull().$default(() => []),
  locations: json("locations").$type<string[]>().notNull().$default(() => []),
  openToRemote: boolean("open_to_remote").notNull().default(true),
  jobTypes: json("job_types").$type<string[]>().notNull().$default(() => []),
  categories: json("categories").$type<string[]>().notNull().$default(() => []),
  salaryMin: int("salary_min"),
  isFresherOnly: boolean("is_fresher_only").notNull().default(false),
  emailAlerts: boolean("email_alerts").notNull().default(true),
  lastSentAt: datetime("last_sent_at"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const alertNotificationsTable = mysqlTable("alert_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  alertId: int("alert_id").references(() => jobAlertsTable.id, { onDelete: "cascade" }),
  jobIds: json("job_ids").$type<number[]>().notNull().$default(() => []),
  matchCount: int("match_count").notNull().default(0),
  isRead: boolean("is_read").notNull().default(false),
  emailSent: boolean("email_sent").notNull().default(false),
  sentAt: datetime("sent_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
