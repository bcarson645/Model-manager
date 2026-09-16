/** Shared types for SRL bulk match simulation. */

export type BatterProfile = {
  batOrder: number;
  bowlOrder: number;
  name: string;
  /** Batting average (bt.caz) */
  btCaz: number;
  /** Strike rate as runs per ball (sr.caz), e.g. 1.30 */
  srCaz: number;
  rating: number;
};

export type BowlerProfile = {
  name: string;
  /** Economy runs per over */
  econ: number;
  /** Wickets per over (Atlas-style SR), e.g. 0.29 */
  sr: number;
  /** Max overs in T20 (usually 4) */
  maxOvers: number;
};

export type TeamProfile = {
  id: "home" | "away";
  name: string;
  batters: BatterProfile[];
  /** Bowling attack used when this team bowls (typically 5 with max overs) */
  bowlers: BowlerProfile[];
};

export type TossChoice = "home" | "away" | "alternate";

export type StartMode =
  | { kind: "full" }
  | {
      kind: "from_over";
      /** 1-based over to start (current innings) */
      over: number;
      ballInOver?: number;
      innings: 1 | 2;
      runs?: number;
      wickets?: number;
      /** Required when innings === 2 */
      target?: number;
    }
  | {
      kind: "chase";
      /** First-innings total to chase (2nd innings only) */
      target: number;
      over?: number;
      ballInOver?: number;
      runs?: number;
      wickets?: number;
    };

export type BulkSimRequest = {
  home: TeamProfile;
  away: TeamProfile;
  toss: TossChoice;
  simulations: number;
  seed: number;
  start: StartMode;
  /** Which delivery model post-process to use */
  model: "auto" | "atlas";
};

export type MatchResultSummary = {
  simIndex: number;
  battingFirst: "home" | "away";
  firstInningsRuns: number;
  firstInningsWkts: number;
  secondInningsRuns: number;
  secondInningsWkts: number;
  winner: "home" | "away" | "tie";
  winnerBat: "first" | "second" | "tie";
  completed: boolean;
};

export type BulkSimAggregate = {
  n: number;
  avgFirstInnings: number;
  avgSecondInnings: number;
  homeWinPct: number;
  awayWinPct: number;
  tiePct: number;
  batFirstWinPct: number;
  batSecondWinPct: number;
  results: MatchResultSummary[];
};
