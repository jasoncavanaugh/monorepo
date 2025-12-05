/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from "@tanstack/react-query";
import { subYears } from "date-fns";
import { create } from "zustand";
import { BACKEND_URL } from "./constants";
import {
  type DayWithExpenses,
  type Expense,
  type ExpenseCategoryWithBaseColor,
} from "./types";

export type DMY = {
  day: number;
  month_idx: number;
  year: number;
};
type ExpensesStoreState = {
  from_year: number;
  set_from_year: (new_from: number) => void;
  to_year: number;
  set_to_year: (new_to: number) => void;
};
const use_api_date_store = create<ExpensesStoreState>((set) => {
  const year_ago = subYears(new Date(), 1);
  const today_date = new Date();
  return {
    from_year: year_ago.getFullYear(),
    set_from_year: (new_from_year: number) =>
      set((prev_state) => ({ ...prev_state, from_year: new_from_year })),
    to_year: today_date.getFullYear(),
    set_to_year: (new_to_year: number) =>
      set((prev_state) => ({ ...prev_state, to_year: new_to_year })),
  };
});

/**
 * Always fetch whole years of dates. Filter on the frontend.
 * Expenses page -> Should only be able to display 365 days of expenses at a time.
 */
export type UseExpensesOverDateRangeData = {
  days: Array<DayWithExpenses>;
  expense_categories: Array<ExpenseCategoryWithBaseColor>;
};
export function use_expenses_over_date_range(
  date_picker_dates: { from_date: DMY; to_date: DMY } | undefined,
) {
  const expenses_store = use_api_date_store();
  let api_from_year = expenses_store.from_year;
  let api_to_year = expenses_store.to_year;
  if (date_picker_dates) {
    if (date_picker_dates.from_date.year < expenses_store.from_year) {
      api_from_year = date_picker_dates.from_date.year;
      expenses_store.set_from_year(date_picker_dates.from_date.year);
    }
    if (date_picker_dates.to_date.year > expenses_store.to_year) {
      api_to_year = date_picker_dates.to_date.year;
      expenses_store.set_to_year(date_picker_dates.to_date.year);
    }
  }
  return useQuery({
    queryKey: ["/api/get_expenses_over_date_range", api_from_year, api_to_year],
    queryFn: async () => {
      const resp = await fetch(`${BACKEND_URL}/api/get_expenses_over_date_range`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          from_year: api_from_year,
          to_year: api_to_year,
        }),
      });
      if (!resp.ok) {
        throw new Error();
      }
      return resp.json() as Promise<UseExpensesOverDateRangeData>;
    },
    select: (data) => {
      let days: Array<DayWithExpenses> = [];
      if (!date_picker_dates) {
        days = data.days.slice(0, 30);
      }
      const from = date_picker_dates?.from_date;
      const to = date_picker_dates?.to_date;
      if (!from || !to) {
        return { ...data, days: data.days.slice(0, 30) };
      }
      days = data.days.filter((d) => {
        const from_year = from.year;
        const from_month_idx = from.month_idx;
        const from_day = from.day;

        const to_year = to.year;
        const to_month_idx = to.month_idx;
        const to_day = to.day;

        if (d.year < from_year || d.year > to_year) {
          return false;
        }
        if (d.year > from_year && d.year < to_year) {
          return true;
        }

        let is_after_from = true;
        if (d.year === from_year) {
          const is_after_month = d.month > from_month_idx;
          const same_month_but_after_day =
            d.month === from_month_idx && d.day >= from_day;
          is_after_from = is_after_month || same_month_but_after_day;
        }
        let is_before_to = true;
        if (d.year === to_year) {
          const is_before_month = d.month < to_month_idx;
          const is_same_month_but_before_day =
            d.month === to_month_idx && d.day <= to_day;
          is_before_to = is_before_month || is_same_month_but_before_day;
        }
        return is_after_from && is_before_to;
      });
      const output: UseExpensesOverDateRangeData = { ...data, days: days };
      return output;
    },
  });
}

export type ExpenseDataByDay = {
  id: string;
  total_for_day: number;
  date_display: `${number}-${number}-${number}`;
  category_id_to_expenses: Map<string, Expense[]>;
};

export function process_days_with_expenses({
  days,
}: {
  days: DayWithExpenses[];
}) {
  const days_with_expenses = days.sort((a, b) => {
    //Reverse sort
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    if (a.month !== b.month) {
      return b.month - a.month;
    }
    if (a.day !== b.day) {
      return b.day - a.day;
    }
    return 0;
  });

  const processed_expense_data: ExpenseDataByDay[] = [];
  for (const dwe of days_with_expenses) {
    const category_id_to_expenses = new Map<string, Array<Expense>>();
    const expenses_for_day = dwe.expenses;
    let total_expenses_for_day = 0;
    for (const ex of expenses_for_day) {
      if (!category_id_to_expenses.has(ex.category_id)) {
        category_id_to_expenses.set(ex.category_id, []);
      }
      category_id_to_expenses.get(ex.category_id)!.push(ex);
      total_expenses_for_day += ex.amount;
    }
    processed_expense_data.push({
      id: dwe.id,
      total_for_day: total_expenses_for_day,
      date_display: `${dwe.month + 1}-${dwe.day}-${dwe.year}`,
      category_id_to_expenses,
    });
  }
  return processed_expense_data;
}
