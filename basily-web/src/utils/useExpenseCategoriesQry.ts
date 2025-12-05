/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "./constants";
import { type ExpenseCategory } from "./types";

export function use_expense_categories_qry() {
  return useQuery({
    queryKey: [],
    queryFn: async () => {
      const resp = await fetch(`${BACKEND_URL}/api/expense_categories`, {
        credentials: "include",
      });
      if (!resp.ok) {
        throw new Error();
      }
      return resp.json() as Promise<Array<ExpenseCategory>>;
    },
  });
}
