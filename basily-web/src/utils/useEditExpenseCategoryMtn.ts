/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation } from "@tanstack/react-query";
import { BASE_URL } from "./constants";
import { type ExpenseCategory } from "./types";

export function use_edit_expense_category_mtn() {
  return useMutation({
    mutationFn: async (input: { category_id: string; new_name: string; new_color: string; }) => {
      const resp = await fetch(`${BASE_URL}/api/edit_expense_category/${input.category_id}`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          new_name: input.new_name,
          new_color: input.new_color,
        })
      })
      if (!resp.ok) {
        throw new Error();
      }
      return resp.json() as Promise<ExpenseCategory>;
    }
  });
}