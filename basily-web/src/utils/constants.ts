import { cn } from "./cn";

/* ROUTES */
export const EXPENSES_ROUTE = "/expenses" as const;
export const VISUALIZE_ROUTE = "/visualize" as const;
export const SIGN_IN_ROUTE = "/sign-in" as const;
export const MANAGE_CATEGORIES_ROUTE = "/manage-categories" as const;

/* TAILWIND */
export const SPINNER_CLASSES =
  "border-squirtle dark:border-rengar dark:border-rengar_light h-16 w-16 border-2 border-solid lg:border-4" as const;
export const BUTTON_HOVER_CLASSES =
  "hover:bg-squirtle_light hover:cursor-pointer hover:bg-opacity-20" as const;

export const RADIX_MODAL_OVERLAY_CLASSES = cn(
  "bg-background/80 fixed inset-0 z-20 bg-gray-500 opacity-30 dark:opacity-50",
  "data-[state=open]:animate-in",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0",
  "data-[state=open]:fade-in-0",
);

export const RADIX_MODAL_CONTENT_CLASSES = cn(
  "z-20 shadow-lg duration-500",
  "data-[state=open]:animate-in",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0",
  "data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95",
  "data-[state=open]:zoom-in-95",
  "data-[state=closed]:slide-out-to-left-1/2",
  "data-[state=closed]:slide-out-to-top-[48%]",
  "data-[state=open]:slide-in-from-left-1/2",
  "data-[state=open]:slide-in-from-top-[48%]",
);

export const BASE_URL = "http://localhost:3000" as const;
