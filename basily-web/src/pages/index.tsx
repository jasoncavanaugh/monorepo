import { type NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import { auth_client } from "src/utils/auth-client";
import { Spinner, SPINNER_CLASSES } from "../components/Spinner";
import {
  EXPENSES_ROUTE,
  SIGN_IN_ROUTE,
} from "../utils/constants";

const Home: NextPage = () => {
  const router = useRouter();

  const session_qry = auth_client.useSession();
  React.useEffect(() => {
    const is_authed =
      session_qry.data && session_qry.data.session && session_qry.data.user;
    if (is_authed) {
      void router.push(EXPENSES_ROUTE);
    } else if (!session_qry.isPending) {
      void router.push(SIGN_IN_ROUTE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_qry.isPending]);

  return (
    <div className="flex h-screen items-center justify-center bg-charmander p-1 dark:bg-khazix md:p-4">
      <Spinner className={SPINNER_CLASSES} />
    </div>
  );
};
export default Home;
