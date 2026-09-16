export type ModBetRow = {
  bets: number;
  stake: number;
  profit: number;
  marginPct: number | null;
  marginGap: number | null;
  avgStake: number;
  avgOdds: number;
  flag: "under" | "over" | null;
};

export type ModSelectionOverRow = ModBetRow & {
  selection: string;
  over: number;
};

export type ModOverRow = ModBetRow & {
  over: number;
};

export type ModSelectionRow = ModBetRow & {
  selection: string;
};

export type ModStakeProfileRow = {
  over: number;
  bets: number;
  avgStake: number;
  stake: number;
};

export type ModFormatAnalysis = {
  formatCode: number;
  id: string;
  label: string;
  chartMaxOver: number;
  overall: {
    bets: number;
    stake: number;
    profit: number;
    marginPct: number;
  };
  bySelection: ModSelectionRow[];
  byOverSummary: ModOverRow[];
  bySelectionOver: ModSelectionOverRow[];
  chartByOver: ModOverRow[];
  flaggedUnder: ModSelectionOverRow[];
  flaggedOver: ModSelectionOverRow[];
  byInnings: Array<ModBetRow & { innings: number }>;
  byReduced: Array<ModBetRow & { reduced: string }>;
  stakeProfileByOver: ModStakeProfileRow[];
};

export type PlayerModTask1Data = {
  taskId: string;
  title: string;
  sourceFile: string;
  generatedAt: string;
  targetMarginPct: number;
  significance: {
    minStake: number;
    minBets: number;
    marginGapFlag: number;
    note: string;
  };
  glossary: Record<string, string>;
  overall: {
    bets: number;
    stake: number;
    profit: number;
    marginPct: number;
    dateRange: { from: string; to: string };
    selections: string[];
  };
  formats: ModFormatAnalysis[];
};
