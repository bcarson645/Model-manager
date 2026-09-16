export type SegmentMetrics = {
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  marginPct: number | null;
  punterRoiPct: number | null;
  avgStake: number;
  bettors: number;
};

export type PhaseRow = {
  phaseId: number;
  label: string;
  overRange: string;
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl?: number;
  marginPct: number | null;
  punterRoiPct?: number | null;
  avgStake?: number;
};

export type SelectionRow = SegmentMetrics & {
  selection: string;
  phaseChart?: PhaseRow[];
};

export type SelectionPhaseCell = {
  selection: string;
  phaseId: number;
  phaseLabel: string;
  bets: number;
  stake: number;
  marginPct: number | null;
};

export type PhaseMarginCompare = {
  phaseId: number;
  label: string;
  allMarginPct: number | null;
  sharpMarginPct: number | null;
  otherMarginPct: number | null;
};

export type StakePhaseRow = {
  phaseId: number;
  label: string;
  avgStake: number;
  ratioVsFormat: number | null;
  spike: boolean;
};

export type SharpSelectionPref = {
  selection: string;
  stake: number;
  sharePct: number;
  marginPct: number | null;
  punterRoiPct: number | null;
};

export type SharpWeakCell = {
  selection: string;
  phaseId: number;
  phaseLabel: string;
  bets: number;
  stake: number;
  marginPct: number;
};

export type SharpBettorRow = {
  bettorId: number;
  bets: number;
  stake: number;
  punterRoiPct: number;
  bookMarginPct: number;
};

export type Part2BettorBetRow = {
  eventAt: string | null;
  eventName: string | null;
  tournament: string | null;
  selection: string;
  over: number;
  phaseId: number | null;
  phaseLabel: string | null;
  innings: number | null;
  odds: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
};

export type Part2MatchWinRow = {
  eventName: string;
  eventAt: string | null;
  bets: number;
  stake: number;
  punterPl: number;
  punterRoiPct: number;
  topSelection: string;
};

export type Part2SelectionMetric = {
  selection: string;
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  bookMarginPct: number | null;
  punterRoiPct: number | null;
  sharePct: number;
};

export type Part2SelectionPhaseRow = {
  selection: string;
  phase: number;
  phaseLabel: string;
  bets: number;
  stake: number;
  bookProfit: number;
  punterPl: number;
  bookMarginPct: number | null;
  punterRoiPct: number | null;
};

export type Part2SharpBettorDetail = {
  bettorId: number;
  summary: {
    bettorId: number;
    bets: number;
    stake: number;
    bookProfit: number;
    punterPl: number;
    punterRoiPct: number;
    bookMarginPct: number;
    avgOdds: number;
  };
  bySelection: Part2SelectionMetric[];
  byPhase: PhaseRow[];
  bySelectionPhase: Part2SelectionPhaseRow[];
  chartByPhase: PhaseRow[];
  topMatches: Part2MatchWinRow[];
  bestPhases: Array<{ phaseId: number; label: string; punterRoiPct: number | null; punterPl: number }>;
  bestSelections: Array<{
    selection: string;
    punterRoiPct: number | null;
    punterPl: number;
    stake: number;
  }>;
  bets: Part2BettorBetRow[];
};

export type Part2SharpAnalysis = {
  sharpCount: number;
  qualifiedBettors: number;
  topSharps: SharpBettorRow[];
  sharpBettorDetails: Part2SharpBettorDetail[];
  marginByPhase: PhaseMarginCompare[];
  avgStakeByPhase: StakePhaseRow[];
  sharpStakeByPhase: Array<{
    phaseId: number;
    label: string;
    sharpAvgStake: number | null;
    otherAvgStake: number | null;
  }>;
  sharpSelectionPrefs: SharpSelectionPref[];
  sharpWeakCells: SharpWeakCell[];
  bigBetSharpSharePct: number | null;
};

export type Part2Segment = {
  id: string;
  label: string;
  gender: "men" | "women";
  formatCode: number;
  empty?: boolean;
  overall: SegmentMetrics;
  bySelection: SelectionRow[];
  byPhase: PhaseRow[];
  selectionPhaseMatrix: SelectionPhaseCell[];
  sharpAnalysis: Part2SharpAnalysis;
  insights: string[];
  hasPhases: boolean;
};

export type PlayerModPart2Data = {
  taskId: string;
  part: number;
  title: string;
  sourceFile: string;
  generatedAt: string;
  thresholds: {
    targetBookMarginPct: number;
    minBetsBettor: number;
    minStakeBettor: number;
    sharpPunterRoiPct: number;
    bigBetStake: number;
    stakeSpikeRatio: number;
  };
  phaseDefinitions: {
    t20: Array<{ id: number; label: string; overMin: number; overMax: number }>;
    odi: Array<{ id: number; label: string; overMin: number; overMax: number }>;
  };
  overall: SegmentMetrics;
  segments: Part2Segment[];
  glossary: Record<string, string>;
};
