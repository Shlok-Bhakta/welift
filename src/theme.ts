/** Locked chalk palette — no user theme toggle. */
export const colors = {
  bg: "#141210",
  bg2: "#1c1916",
  bg3: "#24201c",
  ink: "#f4efe6",
  muted: "#9a9185",
  line: "#322c26",
  accent: "#e4d7c3",
  accentInk: "#161310",
  hot: "#c4785e",
  hotLine: "#5a3428",
  mark: "#c4a574",
  them: "#8ea4b5",
  good: "#a8b896",
  dashed: "#3a332c",
  emptyInk: "#6d6458",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const type = {
  displayLg: 40,
  displayMd: 36,
  displaySm: 32,
  displayXs: 28,
  timer: 52,
  body: 15,
  bodySm: 13,
  mini: 11,
  tab: 11,
} as const;
