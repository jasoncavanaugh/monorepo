import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../../db/schema";
import { BASE_COLORS, type BaseColor } from "../../../utils/tailwind-colors";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
      "'amount' was formatted incorrectly in 'convert_to_cents' function"
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

/*
 * ROUTES
 */
export const router = createTRPCRouter({
  get_expenses_paginated_by_days: protectedProcedure
    .input(z.object({ page: z.number().gte(0) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.days.findMany({
        where: (day, { eq }) => eq(day.user_id, ctx.session.user.id),
        with: {
          expenses: true,
        },
        offset: input.page * _NUMBER_OF_ROWS_PER_PAGE,
        limit: _NUMBER_OF_ROWS_PER_PAGE,
        orderBy: (day, { desc }) => desc(day.created_at),
      });
    }),
  get_expenses_over_date_range: protectedProcedure
    .input(
      z.object({
        from_year: z.number(),
        to_year: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { from_year, to_year } = input;
      const days = await ctx.db.query.days.findMany({
        where: (day, { lte, gte, and, eq }) =>
          and(
            and(lte(day.year, to_year), gte(day.year, from_year)),
            eq(day.user_id, ctx.session.user.id)
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
      const expense_categories =
        (await ctx.db.query.expense_categories.findMany({
          where: (ec, { eq }) => eq(ec.user_id, ctx.session.user.id),
        })) as Array<ExpenseCategoryWithBaseColor>;
      return { days, expense_categories };
    }),
  get_categories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.expense_categories.findMany({
      where: (ec, { eq }) => eq(ec.user_id, ctx.session.user.id),
    });
  }),
  get_categories_with_expenses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.expense_categories.findMany({
      where: (ec, { eq }) => eq(ec.user_id, ctx.session.user.id),
    });
  }),
  create_expense: protectedProcedure
    .input(
      z.object({
        category_id: z.string(),
        amount: z.string().regex(/^\d*(\.\d\d)?$/),
        date: DateZodSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      let day = await ctx.db.query.days.findFirst({
        where: (day, { and, eq }) =>
          and(
            eq(day.user_id, ctx.session.user.id),
            eq(day.month, input.date.month_idx),
            eq(day.day, input.date.day),
            eq(day.year, input.date.year)
          ),
      });
      if (!day) {
        const newDay = await ctx.db
          .insert(schema.days)
          .values({
            id: crypto.randomUUID(),
            user_id: ctx.session.user.id,
            month: input.date.month_idx,
            day: input.date.day,
            year: input.date.year,
          })
          .returning();
        if (newDay.length === 0) {
          throw new Error("newDay.length === 0");
        }
        day = newDay[0]!;
      }
      await ctx.db.insert(schema.expenses).values({
        amount: convert_to_cents(input.amount),
        category_id: input.category_id,
        user_id: ctx.session.user.id,
        day_id: day.id,
      });
    }),
  delete_expense: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      //1.) This
      const deleted_expenses = await ctx.db
        .delete(schema.expenses)
        .where(eq(schema.expenses.id, input.id))
        .returning();

      if (deleted_expenses.length === 0) {
        throw new Error("Expense not found");
      }
      const deleted_expense = deleted_expenses[0]!;

      //2.) And here
      const other_expenses_for_day = await ctx.db.query.expenses.findMany({
        where: (expense, { eq }) => eq(expense.day_id, deleted_expense.day_id),
      });
      if (other_expenses_for_day.length === 0) {
        //3.) Here too
        await ctx.db
          .delete(schema.days)
          .where(eq(schema.days.id, deleted_expense.day_id));
      }
    }),
  create_category: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        color: z.enum(BASE_COLORS),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newCategories = await ctx.db
        .insert(schema.expense_categories)
        .values({
          name: input.name,
          color: input.color,
          user_id: ctx.session.user.id,
        })
        .returning();
      if (newCategories.length === 0) {
        throw new Error("Error creating new category!");
      }
      return newCategories[0]!;
    }),
  delete_category: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(schema.expense_categories)
        .where(
          and(
            eq(schema.expense_categories.name, input.name),
            eq(schema.expense_categories.user_id, ctx.session.user.id)
          )
        );
    }),
  edit_category: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        new_name: z.string(),
        new_color: z.enum(BASE_COLORS),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(schema.expense_categories)
        .set({
          name: input.new_name,
          color: input.new_color,
        })
        .where(eq(schema.expense_categories.id, input.id));
    }),
});
