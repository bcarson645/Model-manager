export type PortfolioAdjustRow = {
  selection: string;
  baseProbPct: number;
  adjustI: number;
  publishedProbPct: number;
  deltaProbPp: number;
  recommendedOdds: number | null;
  currentAvgOdds?: number | null;
  stakeSharePct: number;
};

export type ProbabilityTransferRow = {
  selection: string;
  deltaProbPp: number;
};

export type PairedAdjustAlternative = {
  pattern: string;
  fcAdjust: number;
  otherAdjust: number;
  otherSelection: string;
  simulatedMarginPct: number;
};

export type PortfolioSegment = {
  id: string;
  label: string;
  empty?: boolean;
  overall: {
    bets: number;
    stake: number;
    currentMarginPct: number;
    targetMarginPct: number;
    optimizedMarginPct: number;
    bookOverroundPct?: number;
    fcOnlyMarginPct?: number;
    simAtZeroAdjustPct?: number;
    impliedOverroundPct?: number;
  };
  stakeMixPct: Record<string, number>;
  optimalAdjusts: PortfolioAdjustRow[];
  probabilityTransfer: {
    fielderCatchDeltaPp: number;
    toOtherSelections: ProbabilityTransferRow[];
  };
  pairedAdjustAlternatives: PairedAdjustAlternative[];
  formatNotes: string[];
  renormFormula: string;
};

export type ModPortfolioPricingData = {
  taskId: string;
  title: string;
  sourceFile: string;
  generatedAt: string;
  targetMarginPct: number;
  bookOverroundPct?: number;
  modelParity: string;
  segments: PortfolioSegment[];
};
