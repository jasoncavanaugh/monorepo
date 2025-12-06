import { cn } from "../utils/cn";

export const SPINNER_CLASSES =
  "border-squirtle dark:border-rengar dark:border-rengar_light h-16 w-16 border-2 border-solid lg:border-4" as const;

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        className,
        "animate-spin-fast rounded-full border-t-transparent dark:border-t-transparent",
      )}
    />
  );
}
