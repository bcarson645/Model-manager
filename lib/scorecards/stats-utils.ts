export type DismissalCategory =
  | "Caught"
  | "Bowled"
  | "LBW"
  | "Run out"
  | "Stumped"
  | "Other";

const CATEGORY_ORDER: DismissalCategory[] = [
  "Caught",
  "Bowled",
  "LBW",
  "Run out",
  "Stumped",
  "Other",
];

export function categorizeDismissal(
  dismissal: string | null | undefined
): DismissalCategory | null {
  if (!dismissal) return null;
  const d = dismissal.trim().toLowerCase();
  if (d === "dnb" || d === "not out" || d === "retired not out") return null;
  if (d.includes("catch")) return "Caught";
  if (d === "bowled") return "Bowled";
  if (d === "lbw") return "LBW";
  if (d.includes("run out")) return "Run out";
  if (d === "stumped") return "Stumped";
  return "Other";
}

export function dismissalCategories(): DismissalCategory[] {
  return CATEGORY_ORDER;
}

export function isBattingInnings(dismissal: string | null | undefined): boolean {
  if (!dismissal) return false;
  const d = dismissal.trim().toLowerCase();
  return d !== "dnb";
}

export function isNotOut(dismissal: string | null | undefined): boolean {
  if (!dismissal) return false;
  const d = dismissal.trim().toLowerCase();
  return d === "not out" || d === "retired not out";
}

export function parseOvers(overs: number | null | undefined): number {
  if (overs == null) return 0;
  const n = Number(overs);
  if (Number.isNaN(n)) return 0;
  const whole = Math.floor(n);
  const balls = Math.round((n - whole) * 10);
  return whole + balls / 6;
}

export function seasonFromDate(date: string | null | undefined): string {
  if (!date) return "Unknown";
  return date.slice(0, 4);
}
