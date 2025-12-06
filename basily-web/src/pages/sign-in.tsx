import * as RadixModal from "@radix-ui/react-dialog";
import React, { type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Logo } from "src/components/Logo";
import { Button } from "src/components/shadcn/Button";
import { Spinner, SPINNER_CLASSES } from "src/components/Spinner";
import { ThemeButton } from "src/components/ThemeButton";
import { use_is_authed_or_redirect } from "src/hooks/useIsAuthedOrRedirect";
import { useWindowDimensions } from "src/hooks/useWindowDimensions";
import { auth_client } from "src/utils/auth-client";
import { cents_to_dollars_display } from "src/utils/centsToDollarDisplay";
import { cn } from "src/utils/cn";
import {
  BUTTON_HOVER_CLASSES,
  EXPENSES_ROUTE,
  FRONTEND_URL,
  RADIX_MODAL_CONTENT_CLASSES,
  RADIX_MODAL_OVERLAY_CLASSES,
} from "src/utils/constants";
import { BASE_COLORS, breakpoints, TW_COLORS_MP, TW_COLORS_TO_HEX_MP, type BaseColor } from "src/utils/tailwind-stuff";
import { Fab, is_valid_amount, is_valid_date } from "./expenses";

type DayWithExpensesLocal = {
  day: string;
  expense_categories: Record<
    string,
    {
      color: BaseColor;
      expenses: Array<number>;
    }
  >;
};

export default function SignIn() {
  const session_qry = use_is_authed_or_redirect({ redirect_if: "authorized", redirect_url: EXPENSES_ROUTE });
  const [sign_in_loading, set_sign_in_loading] = React.useState(false);
  const is_authed =
    session_qry.data && session_qry.data.session && session_qry.data.user;
  if (session_qry.isPending || is_authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-charmander p-1 dark:bg-khazix md:p-4">
        <Spinner className={SPINNER_CLASSES} />
      </div>
    );
  }
  return (
    <div className="flex h-[100vh] flex-col pt-8 md:flex-row md:items-center md:justify-center md:py-4">
      <div className="flex h-[20%] flex-col items-start justify-center gap-3 rounded-lg  px-4 py-8 md:h-[100%] md:w-[50%] md:gap-6 md:p-16">
        <Logo />
        <p className="text-base text-slate-700 dark:text-white md:text-2xl md:text-lg">
          A minimalistic expense tracker
        </p>
        <Button
          className="rounded-full bg-squirtle px-3 py-1 text-sm font-semibold text-white shadow-sm shadow-blue-300 hover:brightness-110 w-20 md:w-24 dark:bg-rengar md:px-6 md:py-2 md:text-3xl md:text-lg"
          onClick={() => {
              void auth_client.signIn.social({
                provider: "github",
                callbackURL: `${FRONTEND_URL}/expenses`, 
                errorCallbackURL: `${FRONTEND_URL}/sign-in`,
              }, {
                onRequest: () => {
                  set_sign_in_loading(true);
                },
                onError: () => {
                  alert("Something went wrong");
                  set_sign_in_loading(false);
                }
              });
            }
          }
        >
          {sign_in_loading ? <Spinner className="h-4 w-4 border-2 border-solid border-white lg:h-5 lg:w-5" /> : "Sign In"}
        </Button>
      </div>
      <BasilPreview />
    </div>
  );
}

function BasilPreview() {
  const [is_client, set_is_client] = React.useState(false);
  React.useEffect(() => {
    if (!is_client) {
      set_is_client(true);
    }
  }, []);
  return is_client ? <BasilPreviewClientSide /> : null;
}

function get_initial_expenses() {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    return [];
  }
  const expenses_json_str = localStorage.getItem("expenses_by_day");
  let initial_expenses: Array<DayWithExpensesLocal> = [];
  if (expenses_json_str) {
    initial_expenses = JSON.parse(
      expenses_json_str,
    ) as Array<DayWithExpensesLocal>;
  }
  return initial_expenses;
}

function BasilPreviewClientSide() {
  const [page, set_page] = React.useState<"expenses" | "visualize">("expenses");
  const [expenses_by_day, set_expenses_by_day] = React.useState<
    Array<DayWithExpensesLocal>
  >(get_initial_expenses());

  React.useEffect(() => {
    const hasWindow = typeof window !== "undefined";
    if (!hasWindow) {
      return;
    }
    const cur = JSON.stringify(expenses_by_day);
    const stored = localStorage.getItem("expenses_by_day");
    if (cur !== stored) {
      localStorage.setItem("expenses_by_day", JSON.stringify(expenses_by_day));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(expenses_by_day)]);

  return (
    <div className="h-[80%] px-2 py-2 md:h-[100%] md:w-[80%]">
      <div className="flex h-[10%] items-center justify-between pr-4">
        <div className="flex gap-1 rounded-lg  bg-slate-300 px-1 py-1 dark:bg-leblanc">
          <button
            className={cn(
              "rounded-lg",
              "w-[6rem] py-1 text-sm font-semibold text-squirtle dark:border-transparent",
              "hover:brightness-110 dark:text-rengar md:w-[8rem] md:text-lg",
              "hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-jinx dark:hover:opacity-80",
              page !== "visualize" && "bg-slate-200 dark:bg-jinx",
            )}
            onClick={() => set_page("expenses")}
          >
            Expenses
          </button>
          <button
            className={cn(
              "rounded-lg",
              "w-[6rem] py-1 text-sm font-semibold text-squirtle dark:border-transparent",
              "hover:brightness-110 dark:text-rengar md:w-[8rem] md:text-lg",
              "hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-jinx dark:hover:opacity-80",
              page === "visualize" && "bg-slate-200 dark:bg-jinx",
            )}
            onClick={() => set_page("visualize")}
          >
            Visualize
          </button>
        </div>
        <ThemeButton showText={false} />
      </div>
      {page === "expenses" && (
        <ExpensesPreview
          expenses_by_day={expenses_by_day}
          set_expenses_by_day={set_expenses_by_day}
        />
      )}
      {page === "visualize" && (
        <VisualizePreview expenses_by_day={expenses_by_day} />
      )}
    </div>
  );
}

export function getDayName(day_idx: number) {
  if (day_idx === 0) {
    return "Sun";
  } else if (day_idx === 1) {
    return "Mon";
  } else if (day_idx === 2) {
    return "Tues";
  } else if (day_idx === 3) {
    return "Wed";
  } else if (day_idx === 4) {
    return "Thurs";
  } else if (day_idx === 5) {
    return "Fri";
  } else if (day_idx === 6) {
    return "Sat";
  }
  return "";
}
function ExpensesPreview({
  expenses_by_day,
  set_expenses_by_day,
}: {
  expenses_by_day: Array<DayWithExpensesLocal>;
  set_expenses_by_day: React.Dispatch<
    React.SetStateAction<DayWithExpensesLocal[]>
  >;
}) {
  return (
    <div className="relative h-[90%] overflow-auto">
      <ul className="h-[95%]">
        {expenses_by_day.length === 0 && (
          <div className="flex h-[100%] items-center justify-center">
            <h1 className="text-slate-700 dark:text-white">
              Click the &apos;+&apos; button to add a new expense.
            </h1>
          </div>
        )}
        {expenses_by_day.length > 0 &&
          expenses_by_day
            .sort((a, b) => {
              const a_mdy = extract_mdy(a.day);
              const b_mdy = extract_mdy(b.day);
              if (a_mdy.year != b_mdy.year) {
                return b_mdy.year - a_mdy.year;
              }
              if (a_mdy.month != b_mdy.month) {
                return b_mdy.month - a_mdy.month;
              }
              if (a_mdy.day != b_mdy.day) {
                return b_mdy.day - a_mdy.day;
              }
              return 0;
            })
            .map((ebd, i) => {
              const mdy = extract_mdy(ebd.day);
              return (
                <li key={i} className="mr-4 px-1 py-4">
                  <div className="flex items-end justify-between ">
                    <h1 className="inline rounded-lg bg-squirtle px-2 py-1 font-bold text-white dark:bg-rengar md:p-2">
                      {getDayName(
                        new Date(mdy.year, mdy.month - 1, mdy.day).getDay(),
                      )}{" "}
                      {mdy.month}-{mdy.day}-{mdy.year}
                    </h1>
                  </div>
                  <div className="h-4" />
                  <ExpenseListForDay day_with_expenses={ebd} />
                </li>
              );
            })}
      </ul>
      <AddNewExpenseButtonAndModalLocal
        expenses_by_day={expenses_by_day}
        set_expenses_by_day={set_expenses_by_day}
      >
        <Fab />
      </AddNewExpenseButtonAndModalLocal>
    </div>
  );
}

function get_global_total(expenses_by_day: Array<DayWithExpensesLocal>) {
  let total = 0;
  for (const dwe of expenses_by_day) {
    const color_and_expenses_lst = Object.values(dwe.expense_categories);
    for (const color_and_expenses of color_and_expenses_lst) {
      for (const e of color_and_expenses.expenses) {
        total += e;
      }
    }
  }
  return total;
}

function get_pie_data(
  expenses_by_day: Array<DayWithExpensesLocal>,
  global_total: number,
) {
  const intermediate: Array<{
    category_total: number;
    category_name: string;
    color: BaseColor;
  }> = [];
  for (const dwe of expenses_by_day) {
    const categories = Object.keys(dwe.expense_categories); //.map((color_and_expenses) => color_and_expenses.expenses.;
    for (const cat of categories) {
      let target = intermediate.find((e) => e.category_name === cat);
      if (!target) {
        target = {
          category_name: cat,
          category_total: 0,
          color: dwe.expense_categories[cat]!.color,
        };
        intermediate.push(target);
      }
      target.category_total += dwe.expense_categories[cat]!.expenses.reduce(
        (acc, e) => acc + e,
        0,
      );
    }
  }

  return intermediate.map((e) => {
    return {
      value: e.category_total / global_total,
      name: `${e.category_name} - ${cents_to_dollars_display(
        e.category_total,
      )} (${(
        Math.floor((e.category_total / global_total) * 10000) / 100
      ).toLocaleString()}%)`,
      color: e.color,
    };
  });
  /*  Array<{ category_total, category_name, color }>
   * Array<{ value: category_total / global_total, name: `{category_name} - {category_total} ({percentage})`, color: BaseColor }>
   *
   */
}

function VisualizePreview({
  expenses_by_day,
}: {
  expenses_by_day: Array<DayWithExpensesLocal>;
}) {
  const windowDimensions = useWindowDimensions();
  const global_total = get_global_total(expenses_by_day);
  const pie_chart_data = get_pie_data(expenses_by_day, global_total);
  return (
    <div className="flex h-[90%] flex-col items-center md:h-[90vh] md:flex-row md:items-start">
      <div className="min-h-[35vh] w-[92%] rounded-md px-4 dark:bg-khazix md:h-[100%] md:w-[50%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={100} height={100}>
            <Pie
              animationDuration={800}
              data={pie_chart_data}
              innerRadius={
                windowDimensions.width &&
                windowDimensions.width <= breakpoints["md"]
                  ? 60
                  : 160
              }
              outerRadius={
                windowDimensions.width &&
                windowDimensions.width <= breakpoints["md"]
                  ? 100
                  : 220
              }
              paddingAngle={2}
              dataKey="value"
            >
              {pie_chart_data.map((datum, i) => (
                <Cell
                  key={`${datum.name}-${i}`}
                  fill={TW_COLORS_TO_HEX_MP[datum.color]["500"]}
                  stroke="none"
                  className="hover:brightness-125 focus:outline-none focus:brightness-125"
                />
              ))}
            </Pie>
            <Tooltip
              wrapperClassName="bg-red-500 p-0"
              contentStyle={{
                fontStyle: "italic",
                backgroundColor: "blue",
              }}
              content={(v) => {
                const stuff = v.payload ? v.payload[0] : null;
                if (!stuff) {
                  return null;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const col = stuff.payload.color as BaseColor;
                return (
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 font-semibold",
                      TW_COLORS_MP["text"][col]["700"],
                      TW_COLORS_MP["bg"][col]["200"],
                    )}
                  >
                    {stuff.name}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-[100%] overflow-x-hidden overflow-y-scroll pr-2 md:h-[100%] md:w-[50%] md:p-0">
        <div className="ml-2 px-4 text-xl font-bold text-squirtle dark:text-rengar">
          Total: {cents_to_dollars_display(global_total)}
        </div>
        <div className="h-4" />
        <ul
          className={cn(
            "thin-scrollbar mr-4 flex  w-[100%] flex-col dark:bg-khazix",
            "min-h-0 grow gap-2 rounded pl-5 pr-2 md:m-0 md:overflow-auto md:px-4 md:py-0",
          )}
        >
          {pie_chart_data.map((datum, i) => {
            return (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-3 bg-bulbasaur dark:bg-leblanc",
                  "rounded-lg font-bold shadow-sm shadow-slate-300 dark:shadow-leblanc",
                )}
              >
                <div className={cn("flex items-center gap-4 p-4")}>
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full",
                      TW_COLORS_MP["bg"][datum.color]["500"],
                    )}
                  />
                  <p className={cn(TW_COLORS_MP["text"][datum.color]["500"])}>
                    {datum.name}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function get_sum_for_day(day_with_expenses: DayWithExpensesLocal) {
  //Because I hate myself ig
  return Object.values(day_with_expenses.expense_categories).reduce(
    (acc, v) => {
      return acc + v.expenses.reduce((acc2, v2) => acc2 + v2, 0);
    },
    0,
  );
}

function ExpenseListForDay({
  day_with_expenses,
}: {
  day_with_expenses: DayWithExpensesLocal;
}) {
  return (
    <ul className="flex flex-col gap-3 rounded-lg bg-pikachu p-4 shadow-sm dark:bg-leblanc dark:shadow-sm dark:shadow-leblanc">
      {Object.keys(day_with_expenses.expense_categories).map((exp) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const a = day_with_expenses.expense_categories[exp]!;
        const sum_of_expenses = a.expenses.reduce((acc, v) => acc + v, 0);
        return (
          <li key={exp}>
            <div className="flex justify-between">
              <h2
                className={cn(
                  "flex items-center rounded-lg",
                  "px-2 py-1 text-sm font-bold md:text-base ",
                  TW_COLORS_MP["bg"][a.color][200],
                  TW_COLORS_MP["text"][a.color][700],
                )}
              >
                {exp} +
              </h2>
              <p className="font-semibold text-squirtle dark:text-rengar">
                {cents_to_dollars_display(sum_of_expenses)}
              </p>
            </div>
            <ul className="flex flex-wrap gap-1 py-2">
              {a.expenses.map((expense, i) => {
                return (
                  <li key={i}>
                    <button
                      className={cn(
                        TW_COLORS_MP["bg"][a.color][500],
                        "rounded-full px-2 text-white hover:cursor-pointer hover:opacity-80 dark:hover:opacity-100 dark:hover:brightness-110",
                      )}
                    >
                      {cents_to_dollars_display(expense)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
      <li className="flex justify-between">
        <p className="font-semibold text-squirtle dark:text-rengar">Total: </p>
        <p className="font-semibold text-squirtle dark:text-rengar">
          {cents_to_dollars_display(get_sum_for_day(day_with_expenses))}
        </p>
      </li>
    </ul>
  );
}

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
function extract_mdy(date_display: string) {
  const [month, day, year] = date_display.split("/").map((d) => parseInt(d));
  if (!month || !day || !year) {
    throw new Error("extract_mdy: !month || !day || !year");
  }
  return { month, day, year };
}

function get_expense_categories(expenses_by_day: Array<DayWithExpensesLocal>) {
  const out = [];
  const seen = new Set();
  for (const d of expenses_by_day) {
    for (const c of Object.keys(d.expense_categories)) {
      if (!seen.has(c)) {
        out.push({
          category_name: c,
          color: d.expense_categories[c]!.color,
        });
        seen.add(c);
      }
    }
  }
  return out;
}

function AddNewExpenseButtonAndModalLocal({
  expenses_by_day,
  set_expenses_by_day,
  children,
}: {
  expenses_by_day: Array<DayWithExpensesLocal>;
  set_expenses_by_day: React.Dispatch<
    React.SetStateAction<DayWithExpensesLocal[]>
  >;
  children: ReactNode;
}) {
  const [amount, set_amount] = React.useState("");
  const [is_modal_open, set_is_modal_open] = React.useState(false);
  const [category_text, set_category_text] = React.useState("");

  const [is_category_dropdown_open, set_is_category_dropdown_open] =
    React.useState(false);

  const [color, set_color] = React.useState<BaseColor>("pink");

  const today = new Date();
  const [date, set_date] = React.useState(
    `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
  );
  const [is_color_selection_open, set_is_color_selection_open] =
    React.useState(false);

  const expense_categories = get_expense_categories(expenses_by_day);
  function handle_create_expense({
    expenses_by_day,
    date,
  }: {
    expenses_by_day: Array<DayWithExpensesLocal>;
    date: string;
  }) {
    const new_expenses_by_day = [...expenses_by_day];
    const { month, day, year } = extract_mdy(date);
    let targetDay = new_expenses_by_day.find((ebd) => {
      const ext = extract_mdy(ebd.day);
      return ext.month === month && ext.day === day && ext.year === year;
    });
    if (!targetDay) {
      targetDay = {
        day: `${month}/${day}/${year}`,
        expense_categories: {},
      };
      new_expenses_by_day.push(targetDay);
    }
    const existing_category = expense_categories.find(
      (exp) => exp.category_name === category_text,
    );
    if (!existing_category) {
      targetDay.expense_categories[category_text] = {
        color: color,
        expenses: [],
      };
    } else if (!targetDay.expense_categories[category_text]) {
      targetDay.expense_categories[category_text] = {
        color: existing_category.color,
        expenses: [],
      };
    }
    const category = targetDay.expense_categories[category_text];
    category?.expenses.push(convert_to_cents(amount));
    set_expenses_by_day(new_expenses_by_day);
    set_is_modal_open(false);
  }
  const is_create_expense_button_disabled =
    category_text.length === 0 ||
    color.length === 0 ||
    amount.length === 0 ||
    !is_valid_amount(amount) ||
    !is_valid_date(date) ||
    is_category_dropdown_open; //This is because if the dropdown is still open, that indicates that the user hasn't selected something yet

  const does_category_exist =
    expense_categories.filter((cat) => cat.category_name === category_text)
      .length !== 0;

  return (
    <RadixModal.Root
      onOpenChange={() => {
        //This is so dumb, I can't believe this is how the Radix modal works
        set_amount("");
        set_date(
          `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
        );
        set_category_text("");
        set_color("pink");
        set_is_modal_open(!is_modal_open);
      }}
      open={is_modal_open}
    >
      <RadixModal.Trigger asChild>
        <button
          type="button"
          onClick={() => set_is_modal_open(true)}
          className={cn(
            "fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-squirtle p-0 shadow shadow-blue-300 hover:cursor-pointer dark:bg-rengar",
            "md:bottom-14 md:right-14 md:h-14 md:w-14",
            "lg:shadow-md lg:shadow-blue-300 lg:transition-all lg:hover:-translate-y-0.5 lg:hover:shadow-lg lg:hover:shadow-blue-300 lg:hover:brightness-110",
          )}
        >
          {children}
        </button>
      </RadixModal.Trigger>
      <RadixModal.Portal>
        <RadixModal.Overlay className={RADIX_MODAL_OVERLAY_CLASSES} />
        <RadixModal.Content
          className={cn(
            RADIX_MODAL_CONTENT_CLASSES,
            "fixed left-1/2 top-0 w-full -translate-x-1/2 rounded border-t-8 border-t-squirtle bg-pikachu p-4 dark:border-t-rengar dark:bg-leblanc",
            "md:top-1/2 md:w-[40rem] md:-translate-y-1/2 md:rounded-lg lg:p-8",
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handle_create_expense({
                expenses_by_day,
                date,
              });
            }}
          >
            <RadixModal.Title className="whitespace-nowrap text-3xl font-bold text-slate-700 dark:text-white">
              Add Expense
            </RadixModal.Title>
            <div className="h-1 lg:h-4" />
            <div className="w-full">
              <label
                htmlFor="amount"
                className="block text-slate-700 dark:text-white"
              >
                Amount
              </label>
              <div className="h-2" />
              <input
                name="amount"
                inputMode="text"
                placeholder="0.01"
                onChange={(e) => {
                  set_amount(e.target.value.trim());
                }}
                value={amount}
                className="w-full rounded border border-slate-400 px-2 py-1 focus:outline-slate-400"
                autoComplete="off"
                type="text"
              ></input>
              <div className="m-0 h-7">
                {amount.length > 0 && !is_valid_amount(amount) && (
                  <p className="text-sm text-red-500">Invalid amount</p>
                )}
              </div>
              <label htmlFor="date" className="block dark:text-white">
                Date
              </label>
              <div className="h-1" />
              <input
                name="date"
                inputMode="text"
                value={date}
                onChange={(e) => set_date(e.target.value)}
                className="w-full rounded border border-slate-400 px-2 py-1 focus:outline-slate-400"
                autoComplete="off"
                type="text"
              ></input>
              <div className="m-0 h-7">
                {!is_valid_date(date) && (
                  <p className="text-sm text-red-600">Invalid date</p>
                )}
              </div>
              <div className="h-1" />
              <label htmlFor="category" className="dark:text-white">
                Category
              </label>
              <div className="flex h-16 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (does_category_exist) {
                      return;
                    }
                    set_is_color_selection_open(!is_color_selection_open);
                  }}
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full md:h-6 md:w-6",
                    TW_COLORS_MP["bg"][color][500],
                    does_category_exist
                      ? "hover:cursor-not-allowed"
                      : "hover:cursor-pointer hover:brightness-110",
                  )}
                ></button>
                {is_color_selection_open && (
                  <div
                    className={cn(
                      "flex grow flex-wrap items-center rounded-lg md:justify-between",
                      // "md:h-[200px] md:w-[150px] md:flex-col md:gap-1"
                    )}
                  >
                    {BASE_COLORS.map((option) => {
                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() => {
                            set_color(option);
                            set_is_color_selection_open(false);
                          }}
                          className={cn(
                            TW_COLORS_MP["bg"][option][500],
                            "h-5 w-5 rounded-full border-2",
                            "border-pikachu focus:border-black focus:outline-none dark:border-leblanc dark:focus:border-white",
                            option === color
                              ? "border-slate-900 brightness-110 hover:cursor-default dark:border-white"
                              : "hover:cursor-pointer  hover:border-slate-900 hover:brightness-110 dark:hover:border-white",
                            "md:h-7 md:w-7",
                          )}
                        />
                      );
                    })}
                  </div>
                )}
                {!is_color_selection_open && (
                  <div className="w-full">
                    <input
                      name="category"
                      value={category_text}
                      onChange={(e) => {
                        set_category_text(e.target.value);
                        set_is_category_dropdown_open(true);
                        // set_is_category_color_selection_disabled(false);
                      }}
                      className="w-full grow rounded border border-slate-400 px-2 py-1 focus:outline-slate-400"
                      autoComplete="off"
                      type="text"
                    ></input>
                    <div className="relative m-0 h-0 p-0">
                      {category_text.length > 0 &&
                        is_category_dropdown_open && (
                          <ul className="absolute z-20 flex max-h-[200px] w-full flex-col gap-2 overflow-y-scroll rounded border bg-white p-3 dark:bg-shaco">
                            {expense_categories
                              .filter(
                                (cat) =>
                                  cat.category_name.includes(category_text) ||
                                  category_text.includes(cat.category_name),
                              )
                              .map((cat, i) => {
                                return (
                                  <li
                                    key={i}
                                    className={cn(
                                      "flex items-center gap-3 rounded border border-squirtle_light px-3 py-2 dark:border-violet-300",
                                      BUTTON_HOVER_CLASSES,
                                    )}
                                    onClick={() => {
                                      set_category_text(cat.category_name);
                                      set_color(cat.color);
                                      set_is_category_dropdown_open(false);
                                      // set_is_category_color_selection_disabled(true);
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "h-4 w-4 rounded-full",
                                        TW_COLORS_MP["bg"][cat.color][500],
                                      )}
                                    />
                                    <p>{cat.category_name}</p>
                                  </li>
                                );
                              })}
                            {category_text.length > 0 &&
                              !does_category_exist && (
                                <li
                                  className={cn(
                                    "rounded p-2 text-slate-700 dark:text-white",
                                    BUTTON_HOVER_CLASSES,
                                  )}
                                  onClick={() => {
                                    set_is_category_dropdown_open(false);
                                    set_category_text(category_text.trim());
                                  }}
                                >
                                  <span>+</span>
                                  {` Create '${category_text.trim()}'`}
                                </li>
                              )}
                          </ul>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="h-8" />
            <div className="flex justify-end gap-3">
              <RadixModal.Close asChild>
                <button
                  className={cn(
                    "h-[2rem] w-[4.5rem] rounded-full bg-slate-500 text-xs font-medium text-white",
                    "transition-colors hover:brightness-110 lg:h-[2.5rem] lg:w-[6rem] lg:text-base",
                  )}
                  type="button"
                >
                  Cancel
                </button>
              </RadixModal.Close>
              <button
                className={cn(
                  "flex h-[2rem] w-[4.5rem] items-center justify-center rounded-full bg-squirtle text-xs font-medium text-white dark:bg-rengar lg:h-[2.5rem] lg:w-[6rem] lg:text-base",
                  is_create_expense_button_disabled
                    ? "opacity-50"
                    : "hover:cursor-pointer hover:brightness-110",
                )}
                type="submit"
                disabled={is_create_expense_button_disabled}
              >
                Create
              </button>
            </div>
          </form>
        </RadixModal.Content>
      </RadixModal.Portal>
    </RadixModal.Root>
  );
}
