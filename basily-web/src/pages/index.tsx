import { type GetServerSideProps, type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Spinner } from "../components/Spinner";
import { getServerAuthSession } from "../server/auth";
import {
  EXPENSES_ROUTE,
  SIGN_IN_ROUTE,
  SPINNER_CLASSES,
} from "../utils/constants";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);
  return {
    props: { session },
  };
};
const Home: NextPage = () => {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "authenticated") {
      void router.push(EXPENSES_ROUTE);
    } else if (session.status === "unauthenticated") {
      void router.push(SIGN_IN_ROUTE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  return (
    <div className="flex h-screen items-center justify-center bg-charmander p-1 dark:bg-khazix md:p-4">
      <Spinner className={SPINNER_CLASSES} />
    </div>
  );
};
export default Home;
