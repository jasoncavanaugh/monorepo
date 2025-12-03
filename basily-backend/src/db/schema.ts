import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { BaseColor } from "../utils/types";

export const expense_categories = pgTable("expense_category", {
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
  "day",
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
    uniqueIndex("day_user_id_month_day_year_key").using(
      "btree",
      table.user_id.asc().nullsLast().op("text_ops"),
      table.month.asc().nullsLast().op("int4_ops"),
      table.day.asc().nullsLast().op("int4_ops"),
      table.year.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: "day_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const expenses = pgTable(
  "expense",
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
      name: "expense_category_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.day_id],
      foreignColumns: [days.id],
      name: "expense_day_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: "expense_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
//From npx @better-auth/cli generate (see https://www.better-auth.com/docs/installation)
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
