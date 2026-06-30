/** T20 scorecard types — same row/match shape as ODI exports. */

export type T20BattingLine = {
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  inningsTopBatter: boolean;
  matchTopBatter: boolean;
};

export type T20BowlingLine = {
  overs: number | null;
  maidens: number | null;
  runs: number | null;
  wickets: number | null;
  inningsTopBowler: boolean;
  matchTopBowler: boolean;
};

export type T20PlayerPerformance = {
  playerId: number | string | null;
  name: string | null;
  team: string | null;
  teamId: number | string | null;
  opponent: string | null;
  innings: number | null;
  battingOrder: number | null;
  dismissal: string | null;
  batting: T20BattingLine;
  bowling: T20BowlingLine;
  fielding: { catches: number | null };
};

export type T20Innings = {
  team: string;
  teamId: number | string | null;
  opponent: string | null;
  innings: number;
  total: number | null;
  wickets: number | null;
  extras: number | null;
  players: T20PlayerPerformance[];
};

export type T20TopBatter = {
  playerId: number | string | null;
  name: string | null;
  team: string;
  runs: number | null;
};

export type T20TopBowler = {
  playerId: number | string | null;
  name: string | null;
  team: string;
  wickets: number | null;
  runs: number | null;
  inferred?: boolean;
};

export type T20Match = {
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
  innings: T20Innings[];
  teamTotals: Record<string, number | null>;
  winner: string | null;
  result: "decided" | "tie";
  topBatter: T20TopBatter | null;
  topBowler: T20TopBowler | null;
  rowCount: number;
};

export type T20SchemaProfile = {
  sourceFiles: Array<{ file: string; rawRowCount: number; matchCount: number }>;
  sheetName: string;
  headerRow: number;
  rawRowCount: number;
  matchCount: number;
  rowsPerMatch: {
    distribution: Record<string, number>;
    typical: number;
  };
  formatCounts: Record<string, number>;
  matchesPerSource: Record<string, number>;
  mergeInfo: { duplicateIds: Array<{ id: string; kept: string; dropped: string }> };
  inferredKeys: Record<string, string>;
  gameStructure: string;
};
