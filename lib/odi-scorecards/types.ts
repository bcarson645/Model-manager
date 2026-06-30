export type OdiBattingLine = {
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  inningsTopBatter: boolean;
  matchTopBatter: boolean;
};

export type OdiBowlingLine = {
  overs: number | null;
  maidens: number | null;
  runs: number | null;
  wickets: number | null;
  inningsTopBowler: boolean;
  matchTopBowler: boolean;
};

export type OdiPlayerPerformance = {
  playerId: number | string | null;
  name: string | null;
  team: string | null;
  teamId: number | string | null;
  opponent: string | null;
  innings: number | null;
  battingOrder: number | null;
  dismissal: string | null;
  batting: OdiBattingLine;
  bowling: OdiBowlingLine;
  fielding: { catches: number | null };
};

export type OdiInnings = {
  team: string;
  teamId: number | string | null;
  opponent: string | null;
  innings: number;
  total: number | null;
  wickets: number | null;
  extras: number | null;
  players: OdiPlayerPerformance[];
};

export type OdiTopBatter = {
  playerId: number | string | null;
  name: string | null;
  team: string;
  runs: number | null;
};

export type OdiTopBowler = {
  playerId: number | string | null;
  name: string | null;
  team: string;
  wickets: number | null;
  runs: number | null;
  inferred?: boolean;
};

export type OdiMatch = {
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
  innings: OdiInnings[];
  teamTotals: Record<string, number | null>;
  winner: string | null;
  result: "decided" | "tie";
  topBatter: OdiTopBatter | null;
  topBowler: OdiTopBowler | null;
  rowCount: number;
};

export type OdiSchemaProfile = {
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

export type TopBatterLostQuery = {
  totalMatches: number;
  matchesWithTopBatter: number;
  decidedMatches: number;
  ties: number;
  topBatterTeamWon: number;
  topBatterTeamLost: number;
  topBatterTeamLostPct: number;
  examples: Array<{
    id: string;
    date: string | null;
    topBatter: string;
    topBatterTeam: string;
    topBatterRuns: number | null;
    winner: string;
    teamTotals: Record<string, number | null>;
  }>;
};

/** Logged reference case: match top batter on the losing side. */
export const TOP_BATTER_TEAM_LOST_EXAMPLE = {
  id: "1007651",
  date: "2016-06-13",
  topBatter: "V Sibanda",
  topBatterTeam: "Zimbabwe",
  topBatterRuns: 53,
  winner: "India",
  teamTotals: { Zimbabwe: 126, India: 129 },
} as const;

export type TopBatterTopBowlerTeamsQuery = {
  matchesWithBoth: number;
  matchesWithTopBatterOnly: number;
  matchesWithTopBowlerOnly: number;
  sameTeam: number;
  differentTeams: number;
  differentTeamsPct: number;
  example: {
    id: string;
    date: string | null;
    topBatter: string;
    topBatterTeam: string;
    topBowler: string;
    topBowlerTeam: string;
  } | null;
};
