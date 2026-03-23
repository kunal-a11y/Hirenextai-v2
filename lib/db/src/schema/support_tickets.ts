import { sql } from "drizzle-orm";
import { mysqlTable, int, text, datetime, index } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const supportTicketsTable = mysqlTable(
  "support_tickets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    adminReply: text("admin_reply"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("support_tickets_email_idx").on(t.email),
    index("support_tickets_status_idx").on(t.status),
    index("support_tickets_created_at_idx").on(t.createdAt),
  ]
);
