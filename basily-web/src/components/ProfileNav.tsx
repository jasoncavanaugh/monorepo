import * as RadixPopover from "@radix-ui/react-popover";
import {
  BarChart2Icon,
  ChevronDown,
  CircleDollarSignIcon,
  LogOut,
  PieChartIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { auth_client } from "src/utils/auth-client";
import { cn } from "../utils/cn";
import {
  EXPENSES_ROUTE,
  MANAGE_CATEGORIES_ROUTE,
  VISUALIZE_ROUTE,
} from "../utils/constants";
import { ThemeButton } from "./ThemeButton";

export function ProfileNav({ to_categories }: { to_categories: boolean }) {
  const session = auth_client.useSession();
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>
        <button className="flex items-center gap-2 rounded-md p-2 hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-leblanc">
          {session.data?.user.image ? (
            <Image
              className="rounded-full border border-gray-500"
              src={session.data?.user.image ?? ""}
              width={40}
              height={40}
              alt=""
            />
          ) : (
            <NoProfileImage />
          )}
          <ChevronDown />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={cn(
            "text-popover-foreground z-50 w-72 rounded-md border border-none bg-pikachu p-2 shadow-md outline-none dark:bg-leblanc",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <ul>
            {/* <li>
              <button className="flex w-full gap-4 rounded-md p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-jinx">
                <SettingsIcon
                  className="text-gray-500 dark:text-white"
                  strokeWidth="0.08rem"
                />
                <p>Settings</p>
              </button>
            </li> */}
            {to_categories && (
              <li>
                <Link href={MANAGE_CATEGORIES_ROUTE}>
                  <button className="flex w-full gap-4 rounded-md p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-jinx">
                    <BarChart2Icon
                      className="text-gray-500 dark:text-white"
                      strokeWidth="0.08rem"
                    />
                    <p>Manage Categories</p>
                  </button>
                </Link>
              </li>
            )}
            {!to_categories && (
              <>
                <li>
                  <Link href={EXPENSES_ROUTE}>
                    <button className="flex w-full gap-4 rounded-md p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-jinx">
                      <CircleDollarSignIcon
                        className="text-gray-500 dark:text-white"
                        strokeWidth="0.08rem"
                      />
                      <p>Expenses</p>
                    </button>
                  </Link>
                </li>
                <li>
                  <Link href={VISUALIZE_ROUTE}>
                    <button className="flex w-full gap-4 rounded-md p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-jinx">
                      <PieChartIcon
                        className="text-gray-500 dark:text-white"
                        strokeWidth="0.08rem"
                      />
                      <p>Visualize</p>
                    </button>
                  </Link>
                </li>
              </>
            )}
            <li>
              <ThemeButton showText={true} className="w-full" />
            </li>
            <li>
              <button
                className="flex w-full gap-4 rounded-md p-2 text-red-700 hover:cursor-pointer hover:bg-red-100 dark:text-red-400 dark:hover:bg-jinx"
                onClick={() => void signOut()}
              >
                <LogOut className="text-red-500" strokeWidth="0.15rem" />
                <p>Log Out</p>
              </button>
            </li>
          </ul>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function NoProfileImage() {
  return (
    <div className="relative z-10 h-[40px] w-[40px] overflow-hidden rounded-full border-gray-500 bg-slate-100 dark:bg-leblanc">
      <div className="absolute left-[0.92rem] top-3 h-[11px] w-[11px] rounded-full bg-slate-500 dark:bg-white"></div>
      <div className="absolute left-[0.65rem] top-[1.65rem] h-[35px] w-[20px] rounded-full bg-slate-500 dark:bg-white"></div>
    </div>
  );
}
