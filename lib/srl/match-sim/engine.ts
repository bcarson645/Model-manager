/**
 * Ball-by-ball T20 match engine using delivery outcome generator.
 */

import { deliveryProbs, interpretOutcome, sampleOutcome } from "./delivery";
import type {
  BowlerProfile,
  BulkSimRequest,
  MatchResultSummary,
  StartMode,
  TeamProfile,
} from "./types";

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type InningsState = {
  batting: TeamProfile;
  bowling: TeamProfile;
  runs: number;
  wickets: number;
  /** Completed overs (0..20) */
  overs: number;
  /** Balls in current over (0..5), legal balls only */
  balls: number;
  strikeIdx: number;
  nonStrikeIdx: number;
  nextBatterIdx: number;
  /** Bowler index in bowling.bowlers */
  bowlerIdx: number;
  bowlerOvers: number[];
  freeHit: boolean;
  target: number | null;
};

function createInnings(
  batting: TeamProfile,
  bowling: TeamProfile,
  target: number | null,
  partial?: { runs: number; wickets: number; overs: number; balls: number },
): InningsState {
  const nBowl = bowling.bowlers.length;
  const wickets = partial?.wickets ?? 0;
  // After W wickets: next batter index is W+2 (0/1 opened; replacements from 2…)
  const strikeIdx = Math.min(wickets, 10);
  const nonStrikeIdx = wickets === 0 ? 1 : Math.min(wickets + 1, 10);
  const nextBatterIdx = Math.min(Math.max(wickets + 2, 2), 11);
  return {
    batting,
    bowling,
    runs: partial?.runs ?? 0,
    wickets,
    overs: partial?.overs ?? 0,
    balls: partial?.balls ?? 0,
    strikeIdx,
    nonStrikeIdx: nonStrikeIdx === strikeIdx ? Math.min(strikeIdx + 1, 10) : nonStrikeIdx,
    nextBatterIdx,
    bowlerIdx: 0,
    bowlerOvers: Array.from({ length: nBowl }, () => 0),
    freeHit: false,
    target,
  };
}

function pickBowler(state: InningsState): BowlerProfile {
  const { bowling, bowlerOvers, bowlerIdx } = state;
  // Prefer current if under max; else next available
  for (let step = 0; step < bowling.bowlers.length; step++) {
    const i = (bowlerIdx + step) % bowling.bowlers.length;
    const b = bowling.bowlers[i]!;
    if (bowlerOvers[i]! < b.maxOvers) {
      state.bowlerIdx = i;
      return b;
    }
  }
  return bowling.bowlers[bowlerIdx]!;
}

function endOver(state: InningsState) {
  const lastBowler = state.bowlerIdx;
  state.bowlerOvers[lastBowler]! += 1;
  state.overs += 1;
  state.balls = 0;
  // change strike
  const tmp = state.strikeIdx;
  state.strikeIdx = state.nonStrikeIdx;
  state.nonStrikeIdx = tmp;
  // next bowler — avoid consecutive overs when possible
  const n = state.bowling.bowlers.length;
  for (let step = 1; step <= n; step++) {
    const i = (lastBowler + step) % n;
    const b = state.bowling.bowlers[i]!;
    if (i !== lastBowler && state.bowlerOvers[i]! < b.maxOvers) {
      state.bowlerIdx = i;
      return;
    }
  }
  state.bowlerIdx = (lastBowler + 1) % n;
}

function onWicket(state: InningsState) {
  state.wickets += 1;
  if (state.wickets >= 10) return;
  state.strikeIdx = state.nextBatterIdx;
  state.nextBatterIdx += 1;
}

function inningsComplete(state: InningsState): boolean {
  if (state.wickets >= 10) return true;
  if (state.overs >= 20) return true;
  if (state.target != null && state.runs >= state.target) return true;
  return false;
}

function simulateInnings(
  state: InningsState,
  model: "auto" | "atlas",
  rng: () => number,
): void {
  while (!inningsComplete(state)) {
    const overNum = state.overs + 1;
    const batter = state.batting.batters[state.strikeIdx];
    if (!batter) break;
    const bowler = pickBowler(state);

    const probs = deliveryProbs({
      over: overNum,
      batter,
      bowler,
      model,
      freeHit: state.freeHit,
    });
    const outcome = sampleOutcome(probs, rng);
    const fx = interpretOutcome(outcome);

    state.runs += fx.teamRuns;

    if (fx.isNoBall) {
      state.freeHit = true;
    } else if (fx.isTeamBall) {
      state.freeHit = false;
    }

    if (fx.isWicket && !state.freeHit) {
      onWicket(state);
    } else if (fx.isStrikeChange) {
      const tmp = state.strikeIdx;
      state.strikeIdx = state.nonStrikeIdx;
      state.nonStrikeIdx = tmp;
    }

    if (fx.isTeamBall) {
      state.balls += 1;
      if (state.balls >= 6) endOver(state);
    }

    if (state.target != null && state.runs >= state.target) break;
  }
}

function resolveWinner(
  battingFirst: "home" | "away",
  firstRuns: number,
  secondRuns: number,
): { winner: "home" | "away" | "tie"; winnerBat: "first" | "second" | "tie" } {
  if (secondRuns > firstRuns) {
    const winner = battingFirst === "home" ? "away" : "home";
    return { winner, winnerBat: "second" };
  }
  if (secondRuns < firstRuns) {
    return { winner: battingFirst, winnerBat: "first" };
  }
  return { winner: "tie", winnerBat: "tie" };
}

function applyStartMode(
  start: StartMode,
  home: TeamProfile,
  away: TeamProfile,
  battingFirst: "home" | "away",
): {
  skipFirst: boolean;
  firstPartial?: InningsState;
  secondPartial?: InningsState;
  firstRunsFixed?: number;
} {
  const bat1 = battingFirst === "home" ? home : away;
  const bowl1 = battingFirst === "home" ? away : home;
  const bat2 = bowl1;
  const bowl2 = bat1;

  if (start.kind === "full") {
    return { skipFirst: false };
  }

  if (start.kind === "chase") {
    const over = Math.max(0, (start.over ?? 1) - 1);
    const balls = start.ballInOver ?? 0;
    const second = createInnings(bat2, bowl2, start.target + 1, {
      runs: start.runs ?? 0,
      wickets: start.wickets ?? 0,
      overs: over,
      balls,
    });
    return {
      skipFirst: true,
      firstRunsFixed: start.target,
      secondPartial: second,
    };
  }

  // from_over
  const over = Math.max(0, start.over - 1);
  const balls = start.ballInOver ?? 0;
  if (start.innings === 1) {
    const first = createInnings(bat1, bowl1, null, {
      runs: start.runs ?? 0,
      wickets: start.wickets ?? 0,
      overs: over,
      balls,
    });
    return { skipFirst: false, firstPartial: first };
  }

  const target = start.target ?? 160;
  const second = createInnings(bat2, bowl2, target + 1, {
    runs: start.runs ?? 0,
    wickets: start.wickets ?? 0,
    overs: over,
    balls,
  });
  return {
    skipFirst: true,
    firstRunsFixed: target,
    secondPartial: second,
  };
}

export function simulateOneMatch(
  req: BulkSimRequest,
  simIndex: number,
  battingFirst: "home" | "away",
  seed: number,
): MatchResultSummary {
  const rng = mulberry32(seed);
  const { home, away, model, start } = req;
  const setup = applyStartMode(start, home, away, battingFirst);

  let firstRuns: number;
  let firstWkts: number;

  if (setup.skipFirst && setup.firstRunsFixed != null) {
    firstRuns = setup.firstRunsFixed;
    firstWkts = 10; // unknown; display as chased total
  } else {
    const bat1 = battingFirst === "home" ? home : away;
    const bowl1 = battingFirst === "home" ? away : home;
    const first = setup.firstPartial ?? createInnings(bat1, bowl1, null);
    simulateInnings(first, model, rng);
    firstRuns = first.runs;
    firstWkts = first.wickets;
  }

  const bat2 = battingFirst === "home" ? away : home;
  const bowl2 = battingFirst === "home" ? home : away;
  const second =
    setup.secondPartial ?? createInnings(bat2, bowl2, firstRuns + 1);
  if (!setup.secondPartial) {
    second.target = firstRuns + 1;
  }
  simulateInnings(second, model, rng);

  const { winner, winnerBat } = resolveWinner(battingFirst, firstRuns, second.runs);

  return {
    simIndex,
    battingFirst,
    firstInningsRuns: firstRuns,
    firstInningsWkts: firstWkts,
    secondInningsRuns: second.runs,
    secondInningsWkts: second.wickets,
    winner,
    winnerBat,
    completed: true,
  };
}

export function battingFirstForSim(
  toss: BulkSimRequest["toss"],
  simIndex: number,
): "home" | "away" {
  if (toss === "home") return "home";
  if (toss === "away") return "away";
  return simIndex % 2 === 0 ? "home" : "away";
}

/** Sync bulk run — fine up to a few thousand; UI should chunk for larger. */
export function runBulkChunk(
  req: BulkSimRequest,
  fromIndex: number,
  count: number,
): MatchResultSummary[] {
  const out: MatchResultSummary[] = [];
  for (let i = 0; i < count; i++) {
    const simIndex = fromIndex + i;
    const batFirst = battingFirstForSim(req.toss, simIndex);
    out.push(
      simulateOneMatch(req, simIndex, batFirst, req.seed + simIndex * 9973),
    );
  }
  return out;
}

export function aggregateResults(results: MatchResultSummary[]) {
  const n = results.length;
  if (n === 0) {
    return {
      n: 0,
      avgFirstInnings: 0,
      avgSecondInnings: 0,
      homeWinPct: 0,
      awayWinPct: 0,
      tiePct: 0,
      batFirstWinPct: 0,
      batSecondWinPct: 0,
      results,
    };
  }
  let first = 0;
  let second = 0;
  let home = 0;
  let away = 0;
  let tie = 0;
  let bat1 = 0;
  let bat2 = 0;
  for (const r of results) {
    first += r.firstInningsRuns;
    second += r.secondInningsRuns;
    if (r.winner === "home") home += 1;
    else if (r.winner === "away") away += 1;
    else tie += 1;
    if (r.winnerBat === "first") bat1 += 1;
    else if (r.winnerBat === "second") bat2 += 1;
  }
  return {
    n,
    avgFirstInnings: first / n,
    avgSecondInnings: second / n,
    homeWinPct: (100 * home) / n,
    awayWinPct: (100 * away) / n,
    tiePct: (100 * tie) / n,
    batFirstWinPct: (100 * bat1) / n,
    batSecondWinPct: (100 * bat2) / n,
    results,
  };
}
