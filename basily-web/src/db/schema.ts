import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { type BaseColor } from "src/utils/tailwind-colors";

export const expense_categories = pgTable("ExpenseCategory", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(),
  created_at: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  color: text("color").notNull().$type<BaseColor>().default("pink"),
  name: text().notNull(),
});

export const days = pgTable(
  "Day",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    month: integer().notNull(),
    day: integer().notNull(),
    year: integer().notNull(),
  },
  (table) => [
    uniqueIndex("Day_user_id_month_day_year_key").using(
      "btree",
      table.user_id.asc().nullsLast().op("int4_ops"),
      table.month.asc().nullsLast().op("int4_ops"),
      table.day.asc().nullsLast().op("int4_ops"),
      table.year.asc().nullsLast().op("int4_ops")
    ),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: "Day_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const expenses = pgTable(
  "Expense",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    amount: integer().notNull(),
    user_id: text("user_id").notNull(),
    category_id: text("category_id").notNull(),
    day_id: text("day_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.category_id],
      foreignColumns: [expense_categories.id],
      name: "Expense_category_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.day_id],
      foreignColumns: [days.id],
      name: "Expense_day_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: "Expense_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

// NextAuth tables, do not rename property names
export const users = pgTable(
  "User",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    name: text(),
    email: text(),
    emailVerified: timestamp("email_verified", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    image: text(),
  },
  (table) => [
    uniqueIndex("User_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const sessions = pgTable(
  "Session",
  {
    sessionToken: text().primaryKey().notNull(),
    userId: text().notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("Session_sessionToken_key").using(
      "btree",
      table.sessionToken.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Session_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("VerificationToken_identifier_token_key").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
      table.token.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("VerificationToken_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const accounts = pgTable(
  "Account",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text(),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("Account_provider_providerAccountId_key").using(
      "btree",
      table.provider.asc().nullsLast().op("text_ops"),
      table.providerAccountId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Account_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

// RELATIONS
export const userRelations = relations(users, ({ many }) => ({
  expenseCategories: many(expense_categories),
  sessions: many(sessions),
  expenses: many(expenses),
  days: many(days),
  accounts: many(accounts),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokenRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.identifier],
      references: [users.email],
    }),
  })
);

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const expenseCategoryRelations = relations(
  expense_categories,
  ({ one, many }) => ({
    user: one(users, {
      fields: [expense_categories.user_id],
      references: [users.id],
    }),
    expenses: many(expenses),
  })
);

export const dayRelations = relations(days, ({ one, many }) => ({
  expenses: many(expenses),
  user: one(users, {
    fields: [days.user_id],
    references: [users.id],
  }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  expenseCategory: one(expense_categories, {
    fields: [expenses.category_id],
    references: [expense_categories.id],
  }),
  day: one(days, {
    fields: [expenses.day_id],
    references: [days.id],
  }),
  user: one(users, {
    fields: [expenses.user_id],
    references: [users.id],
  }),
}));
