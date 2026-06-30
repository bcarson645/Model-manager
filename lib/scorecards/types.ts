/** Shared scorecard match shape (ODI & T20 exports). */

export type ScorecardBattingLine = {
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  inningsTopBatter: boolean;
  matchTopBatter: boolean;
};

export type ScorecardBowlingLine = {
  overs: number | null;
  maidens: number | null;
  runs: number | null;
  wickets: number | null;
  inningsTopBowler: boolean;
  matchTopBowler: boolean;
};

export type ScorecardPlayerPerformance = {
  playerId: number | string | null;
  name: string | null;
  team: string | null;
  teamId: number | string | null;
  opponent: string | null;
  innings: number | null;
  battingOrder: number | null;
  dismissal: string | null;
  batting: ScorecardBattingLine;
  bowling: ScorecardBowlingLine;
  fielding: { catches: number | null };
};

export type ScorecardInnings = {
  team: string;
  teamId: number | string | null;
  opponent: string | null;
  innings: number;
  total: number | null;
  wickets: number | null;
  extras: number | null;
  players: ScorecardPlayerPerformance[];
};

export type ScorecardMatch = {
  id: string;
  sourceFile: string | null;
  date: string | null;
  format: string | null;
  maxOvers: number | null;
  venue: string | null;
  host: string | null;
  competitionId: number | string | null;
  venueId: number | string | null;
  hostId: number | string | null;
  innings: ScorecardInnings[];
  teamTotals: Record<string, number | null>;
  winner: string | null;
  result: "decided" | "tie";
  topBatter: {
    playerId: number | string | null;
    name: string | null;
    team: string;
    runs: number | null;
  } | null;
  topBowler: {
    playerId: number | string | null;
    name: string | null;
    team: string;
    wickets: number | null;
    runs: number | null;
    inferred?: boolean;
  } | null;
  rowCount: number;
};

export type DataFormat = "odi" | "t20" | "first-class";
export type AnalysisSection = "match-analysis" | "player-analysis" | "queries";

export type SchemaProfile = {
  sourceFiles: Array<{ file: string; rawRowCount: number; matchCount: number }>;
  sheetName: string;
  headerRow: number;
  rawRowCount: number;
  matchCount: number;
  rowsPerMatch: { distribution: Record<string, number>; typical: number };
  formatCounts: Record<string, number>;
  matchesPerSource: Record<string, number>;
  mergeInfo: { duplicateIds: Array<{ id: string; kept: string; dropped: string }> };
  inferredKeys: Record<string, string>;
  gameStructure: string;
};
