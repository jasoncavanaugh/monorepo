export const BASE_COLORS = [
  "rose",
  "pink",
  "fuchsia",
  "purple",
  "violet",
  "indigo",
  "blue",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "red",
  "slate",
] as const;
export type BaseColor = (typeof BASE_COLORS)[number];
export const BASE_COLOR_PREFIXES = ["bg", "text", "border"] as const;
export type BaseColorPrefixes = (typeof BASE_COLOR_PREFIXES)[number];
export const COLOR_VALUES = [100, 200, 500, 700, 900] as const;
export type ColorValue = (typeof COLOR_VALUES)[number];
