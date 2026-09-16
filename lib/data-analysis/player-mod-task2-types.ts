export type BettorRow = {
  bettorId: number;
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  punterRoiPct: number;
  bookMarginPct: number;
  avgOdds: number;
};

export type BigBetRow = {
  bettorId: number;
  selection: string;
  over: number;
  stake: number;
  bookProfit: number;
  bookLost: boolean;
  bettorLifetimeBets: number;
  bettorLifetimeRoiPct: number;
  interpretation: string;
};

export type SelectionShareRow = {
  selection: string;
  stake: number;
  sharePct: number;
};

export type SegmentMetrics = {
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  bookMarginPct: number | null;
  punterRoiPct: number | null;
  bettors: number;
};

export type OverSegmentRow = SegmentMetrics & {
  over: number;
};

export type InningsSegmentRow = SegmentMetrics & {
  innings: number;
};

export type SharpHotspotRow = {
  selection: string;
  over: number;
  bets: number;
  stake: number;
  punterRoiPct: number;
  bookMarginPct?: number;
};

export type SelectionMetricRow = SegmentMetrics & {
  selection: string;
  sharePct: number;
};

export type SelectionOverRow = SegmentMetrics & {
  selection: string;
  over: number;
};

export type BettorBetRow = {
  eventAt: string | null;
  eventName: string | null;
  selection: string;
  over: number;
  delivery: number | null;
  innings: number | null;
  odds: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  reduced: string | null;
};

export type SharpBettorDetail = {
  bettorId: number;
  summary: BettorRow;
  bySelection: SelectionMetricRow[];
  byOver: OverSegmentRow[];
  bySelectionOver: SelectionOverRow[];
  byInnings: InningsSegmentRow[];
  chartByOver: OverSegmentRow[];
  bets: BettorBetRow[];
};

export type ModBettorFormatAnalysis = {
  formatCode: number;
  id: string;
  label: string;
  chartMaxOver: number;
  overall: {
    bets: number;
    stake: number;
    bookProfit: number;
    punterPl: number;
    bookMarginPct: number | null;
    punterRoiPct: number | null;
    avgStake: number;
    bettors: number;
  };
  bettorUniverse: {
    totalBettors: number;
    qualifiedBettors: number;
    sharpBettors: number;
    weakBettors: number;
  };
  topSharpBettors: BettorRow[];
  topWeakBettors: BettorRow[];
  bigBetAttribution: BigBetRow[];
  bigBetSummary: {
    count: number;
    bookLostCount: number;
    avgBettorRoiWhenBookLost: number | null;
    pctBookLostFromSharps: number | null;
  };
  sharpPreferences: {
    sharp: SelectionShareRow[];
    others: SelectionShareRow[];
  };
  sharpHotspots: SharpHotspotRow[];
  sharpColdspots: SharpHotspotRow[];
  marginByOver: {
    allBettors: OverSegmentRow[];
    sharpBettors: OverSegmentRow[];
    otherBettors: OverSegmentRow[];
  };
  sharpByInnings: InningsSegmentRow[];
  sharpBettorDetails: SharpBettorDetail[];
};

export type PlayerModTask2Data = {
  taskId: string;
  title: string;
  sourceFile: string;
  generatedAt: string;
  thresholds: {
    minBetsBettor: number;
    minStakeBettor: number;
    sharpPunterRoiPct: number;
    weakPunterRoiPct: number;
    bigBetStake: number;
    targetBookMarginPct: number;
  };
  glossary: Record<string, string>;
  overall: {
    bets: number;
    stake: number;
    bookProfit: number;
    punterPl: number;
    bookMarginPct: number | null;
    punterRoiPct: number | null;
    avgStake: number;
    bettors: number;
    totalBettors: number;
    qualifiedBettors: number;
    dateRange: { from: string | null; to: string | null };
  };
  formats: ModBettorFormatAnalysis[];
};
