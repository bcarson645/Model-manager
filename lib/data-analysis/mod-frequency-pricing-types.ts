export type ModTrendPoint = {
  month: string;
  totalWinStake: number;
  [selection: string]: string | number;
};

export type EmergingTrend = {
  selection: string;
  earlySharePct: number;
  recentSharePct: number;
  deltaPp: number;
  direction: "up" | "down";
};

export type ModCurrentPricingRow = {
  selection: string;
  bets: number;
  stake: number;
  avgOdds: number | null;
  impliedPct: number | null;
  marginPct: number | null;
  outcomeSharePct: number;
};

export type ModRecommendedPriceRow = {
  selection: string;
  fairOdds: number | null;
  recommendedOdds: number | null;
  recommendedImpliedPct: number | null;
  oddsScaleVsCurrent: number | null;
};

export type ModOptimizedPriceRow = {
  selection: string;
  currentAvgOdds: number | null;
  oddsScale: number | null;
  optimizedOdds: number | null;
  optimizedImpliedPct: number | null;
  currentMarginPct: number | null;
};

export type ModFrequencySegment = {
  id: string;
  label: string;
  empty?: boolean;
  overall: {
    bets: number;
    stake: number;
    marginPct: number | null;
    outcomeSamples: number;
  };
  currentPricing: ModCurrentPricingRow[];
  empiricalFrequency: Array<{ selection: string; sharePct: number }>;
  jointPricing: {
    method: string;
    targetMarginPct: number;
    impliedSumPct: number;
    selections: Array<{
      selection: string;
      impliedPct: number;
      recommendedOdds: number;
    }>;
  };
  recommendedPricing: {
    method: string;
    targetMarginPct: number;
    impliedSumPct: number;
    selections: ModRecommendedPriceRow[];
  };
  optimizedPricing: {
    method: string;
    targetMarginPct: number;
    impliedSumPct: number;
    selections: ModOptimizedPriceRow[];
  };
  monthlyTrend: ModTrendPoint[];
  emergingTrends: EmergingTrend[];
};

export type ModFrequencyPricingData = {
  taskId: string;
  title: string;
  sourceFile: string;
  generatedAt: string;
  targetMarginPct: number;
  methodology: Record<string, string>;
  segments: ModFrequencySegment[];
};
