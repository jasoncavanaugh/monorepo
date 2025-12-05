/* eslint-disable react-hooks/rules-of-hooks */
import { useMutation } from "@tanstack/react-query";
import { BACKEND_URL } from "./constants";

export function use_delete_expense_mutn({
  on_success,
  on_error,
}: {
  on_success?: () => void;
  on_error?: () => void;
}) {
  return useMutation({
    mutationFn: async ({ expense_id }: { expense_id: string }) => {
      const resp = await fetch(`${BACKEND_URL}/api/delete_expense/${expense_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) {
        throw new Error();
      }
    },
    onSuccess: on_success,
    onError: on_error,
  });
}
