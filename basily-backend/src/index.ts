import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import z from "zod";
import { db } from "./db";
import * as schema from "./db/schema";
import { auth } from "./utils/auth";
import { env } from "./utils/env";
import { BASE_COLORS, BaseColor } from "./utils/types";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>({
  strict: false,
});

// CORS should be called before the route
app.use("/api/*", cors({ origin: `https://${env.ALLOWED_ORIGINS}` }));

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

//Middleware - I don't think this is worth it
// app.use("/api/protected/**", async (c, next) => {
//   const session = await auth.api.getSession({
//     headers: c.req.raw.headers,
//   });
//   if (!session) {
//     c.set("user", null);
//     c.set("session", null);
//     await next();
//     return;
//   }
//   c.set("user", session.user);
//   c.set("session", session.session);
//   await next();
// });

// app.get("/api/protected/session", (c) => {
//   const session = c.get("session");
//   const user = c.get("user");

//   if (!user) return c.body(null, 401);
//   return c.json({
//     session,
//     user,
//   });
// });

/*
 * TYPES
 */

// Infer types from Drizzle schema
export type Expense = typeof schema.expenses.$inferSelect;
export type ExpenseCategory = typeof schema.expense_categories.$inferSelect;
export type Day = typeof schema.days.$inferSelect;

export type ExpenseCategoryWithBaseColor = ExpenseCategory & {
  color: BaseColor;
};
export type ExpenseCategoryWithExpenses = ExpenseCategoryWithBaseColor & {
  expenses: Expense[];
};

export type DayWithExpenses = Day & { expenses: Expense[] };
export type GetExpensesOverDateRangeRet = {
  days: DayWithExpenses[];
  expense_categories: ExpenseCategoryWithBaseColor[];
};

const DateZodSchema = z.object({
  day: z.number().gt(0),
  month_idx: z.number().gte(0).lte(11),
  year: z.number(),
});

/*
 * UTILS
 */
function convert_to_cents(amount: string) {
  const split_amount = amount.split(".");
  if (split_amount.length > 2 || split_amount.length < 1) {
    console.error("split_amount.length > 2 || split_amount.length < 1");
    throw new Error(
      "'amount' was formatted incorrectly in 'convert_to_cents' function",
    );
  }
  const dollars = parseInt(split_amount[0]!);
  let amount_in_cents = dollars * 100;
  if (split_amount.length === 2) {
    const cents = parseInt(split_amount[1]!);
    amount_in_cents += cents;
  }
  return amount_in_cents;
}
const _NUMBER_OF_ROWS_PER_PAGE = 30;

async function get_auth_session({ headers }: { headers: Headers }) {
  const session_resp = await auth.api.getSession({
    headers: headers,
  });
  if (!session_resp || !session_resp.user || !session_resp.session) {
    return null;
  }
  return { session: session_resp.session, user: session_resp.user };
}

app.get("/api/get_expenses_paginated_by_days", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;

  let page = 0;
  const req_page = c.req.query("page");
  if (req_page) {
    page = parseInt(req_page);
  }
  let page_size = _NUMBER_OF_ROWS_PER_PAGE;
  const req_page_size = c.req.query("pageSize");
  if (req_page_size) {
    page_size = parseInt(req_page_size);
  }

  const res = await db.query.days.findMany({
    where: (day, { eq }) => eq(day.user_id, user.id),
    with: {
      expenses: true,
    },
    offset: page * page_size,
    limit: _NUMBER_OF_ROWS_PER_PAGE,
    orderBy: (day, { desc }) => desc(day.created_at),
  });
  return c.json(res);
});

app.post("/api/get_expenses_over_date_range", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;

  const req_body = await c.req.json();
  const ReqSchema = z.object({
    from_year: z.number(),
    to_year: z.number(),
  });
  const parsed = ReqSchema.safeParse(req_body);
  if (parsed.error) {
    return c.body(
      "Request body not of type { from_year: number, to_year: number }",
      400,
    );
  }
  const { from_year, to_year } = parsed.data;
  const days = await db.query.days.findMany({
    where: (day, { lte, gte, and, eq }) =>
      and(
        and(lte(day.year, to_year), gte(day.year, from_year)),
        eq(day.user_id, user.id),
      ),
    with: { expenses: true },
  });
  //Sort from latest to oldest
  days.sort((a, b) => {
    const a_date = new Date(a.year, a.month, a.day);
    const b_date = new Date(b.year, b.month, b.day);
    return a_date < b_date ? 1 : -1;
  });

  //Get categories
  const expense_categories = (await db.query.expense_categories.findMany({
    where: (ec, { eq }) => eq(ec.user_id, user.id),
  })) as Array<ExpenseCategoryWithBaseColor>;
  return c.json({ days, expense_categories });
});

app.get("/api/expense_categories", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const res = await db.query.expense_categories.findMany({
    where: (ec, { eq }) => eq(ec.user_id, user.id),
  });
  return c.json(res);
});

app.get("/api/expense_categories_with_expenses", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const res = await db.query.expense_categories.findMany({
    where: (ec, { eq }) => eq(ec.user_id, user.id),
  });
  return c.json(res);
});

app.post("/api/create_expense", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const ReqSchema = z.object({
    category_id: z.string(),
    amount: z.string().regex(/^\d*(\.\d\d)?$/),
    date: DateZodSchema,
  });
  const req_body = await c.req.json();
  const parsed = ReqSchema.safeParse(req_body);
  if (parsed.error) {
    return c.body("Request body not of correct type", 400);
  }
  const input = parsed.data;
  let day = await db.query.days.findFirst({
    where: (day, { and, eq }) =>
      and(
        eq(day.user_id, user.id),
        eq(day.month, input.date.month_idx),
        eq(day.day, input.date.day),
        eq(day.year, input.date.year),
      ),
  });
  if (!day) {
    const new_day = await db
      .insert(schema.days)
      .values({
        id: crypto.randomUUID(),
        user_id: user.id,
        month: input.date.month_idx,
        day: input.date.day,
        year: input.date.year,
      })
      .returning();
    if (new_day.length === 0) {
      return c.body("Error creating new day", 500);
    }
    day = new_day[0]!;
  }
  const created_expenses = await db
    .insert(schema.expenses)
    .values({
      amount: convert_to_cents(input.amount),
      category_id: input.category_id,
      user_id: user.id,
      day_id: day.id,
    })
    .returning();
  return c.json(created_expenses[0]);
});

app.delete("/api/delete_expense/:expense_id", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const expense_id = c.req.param("expense_id");
  const deleted_expenses = await db
    .delete(schema.expenses)
    .where(
      and(
        eq(schema.expenses.id, expense_id),
        eq(schema.expenses.user_id, user.id),
      ),
    )
    .returning();
  if (deleted_expenses.length === 0) {
    return c.body(`Expense with id ${expense_id} not found`, 404);
  }

  const deleted_expense = deleted_expenses[0]!;
  const other_expenses_for_day = await db.query.expenses.findMany({
    where: (expense, { eq }) => eq(expense.day_id, deleted_expense.day_id),
  });
  if (other_expenses_for_day.length === 0) {
    await db
      .delete(schema.days)
      .where(
        and(
          eq(schema.days.id, deleted_expense.day_id),
          eq(schema.days.user_id, user.id),
        ),
      );
  }
  return c.json(deleted_expense);
});

app.post("/api/create_expense_category", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const req_body = await c.req.json();
  const ReqSchema = z.object({
    name: z.string(),
    color: z.enum(BASE_COLORS),
  });
  const parsed = ReqSchema.safeParse(req_body);
  if (parsed.error) {
    return c.body("Request body not of correct type", 400);
  }
  const input = parsed.data;
  const new_categories = await db
    .insert(schema.expense_categories)
    .values({
      name: input.name,
      color: input.color,
      user_id: user.id,
    })
    .returning();
  if (new_categories.length === 0) {
    return c.body("Error creating new expense category", 500);
  }
  return c.json(new_categories[0]);
});

app.delete("/api/delete_expense_category/:category_id", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const category_id = c.req.param("category_id");
  const deleted = await db
    .delete(schema.expense_categories)
    .where(
      and(
        eq(schema.expense_categories.id, category_id),
        eq(schema.expense_categories.user_id, user.id),
      ),
    )
    .returning();
  if (deleted.length === 0) {
    return c.body(`Category with id ${category_id} not found.`, 404);
  }
  return c.json(deleted[0]);
});

app.post("/api/edit_expense_category/:category_id", async (c) => {
  const auth_resp = await get_auth_session({ headers: c.req.raw.headers });
  if (!auth_resp) {
    return c.body(null, 401);
  }
  const { user } = auth_resp;
  const category_id = c.req.param("category_id");
  const ReqSchema = z.object({
    new_name: z.string(),
    new_color: z.enum(BASE_COLORS),
  });
  const req_body = await c.req.json();
  const parsed = ReqSchema.safeParse(req_body);
  if (parsed.error) {
    return c.body("Request body not of correct type", 400);
  }
  const input = parsed.data;
  const updated_expense_category = await db
    .update(schema.expense_categories)
    .set({
      name: input.new_name,
      color: input.new_color,
    })
    .where(
      and(
        eq(schema.expense_categories.user_id, user.id),
        eq(schema.expense_categories.id, category_id),
      ),
    )
    .returning();
    if (updated_expense_category.length === 0) {
      return c.body(`Category with id ${category_id} not found.`, 404);
    }
    return c.json(updated_expense_category[0]);
});

app.get("/", (c) => {
  return c.text("Hello from Hono!");
});

export default app;
