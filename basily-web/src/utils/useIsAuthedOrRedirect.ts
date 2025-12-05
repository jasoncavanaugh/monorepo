/* eslint-disable react-hooks/rules-of-hooks */
import { useRouter } from "next/router";
import React from "react";
import { auth_client } from "./auth-client";

export function use_is_authed_or_redirect({ redirect_if, redirect_url }: { redirect_if: "authorized" | "unauthorized"; redirect_url: string; }) {
  const session_qry = auth_client.useSession()
  const router = useRouter();

  React.useEffect(() => {
    const is_authed =
      session_qry.data && session_qry.data.session && session_qry.data.user;
    const authed_redirect = redirect_if === "authorized" && is_authed
    const unauthed_redirect = redirect_if === "unauthorized" && !is_authed
    if (authed_redirect || unauthed_redirect) {
      void router.push(redirect_url);
    }
    
  //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_qry.isPending, session_qry.isRefetching]);

  return session_qry
}