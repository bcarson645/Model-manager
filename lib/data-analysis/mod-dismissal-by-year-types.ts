export type YearlyDismissalPoint = {
  year: string;
  dismissals: number;
  [key: string]: string | number;
};

export type YearlyEmergingTrend = {
  selection: string;
  earlySharePct: number;
  recentSharePct: number;
  deltaPp: number;
  direction: "up" | "down";
};

export type DismissalByYearSegment = {
  id: string;
  label: string;
  empty?: boolean;
  source?: string;
  matchCount?: number;
  totalDismissals?: number;
  yearRange?: { from: string | null; to: string | null };
  overallShares?: Array<{ selection: string; sharePct: number }>;
  yearlyTrend?: YearlyDismissalPoint[];
  emergingTrends?: YearlyEmergingTrend[];
  periodLabels?: { early: string | null; recent: string | null };
};

export type ModDismissalByYearData = {
  taskId: string;
  title: string;
  generatedAt: string;
  methodology: Record<string, string>;
  limitations: string[];
  segments: DismissalByYearSegment[];
};
