/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation } from "@tanstack/react-query";
import { BASE_URL } from "./constants";

export function use_create_expense_mtn({
  on_success,
  on_error,
}: {
  on_success?: () => void;
  on_error?: () => void;
}) {
  return useMutation({
    mutationFn: async (input: {
      category_id: string;
      amount: string;
      date: {
        day: number;
        month_idx: number;
        year: number;
      };
    }) => {
      const resp = await fetch(`${BASE_URL}/api/create_expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!resp.ok) {
        throw new Error();
      }
    },
    onSuccess: on_success,
    onError: on_error,
  });
}
