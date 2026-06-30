import type { PlayerBattingInnings, PlayerBowlingInnings } from "./player-db";
import { parseOvers } from "./stats-utils";

export type BattingSummary = {
  matches: number;
  innings: number;
  notOuts: number;
  runs: number;
  balls: number;
  average: number | null;
  strikeRate: number | null;
  highScore: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
};

export type BattingBySeason = BattingSummary & { season: string };

export type BowlingSummary = {
  matches: number;
  innings: number;
  wickets: number;
  runs: number;
  overs: number;
  average: number | null;
  economy: number | null;
  strikeRate: number | null;
  bestWickets: number;
  bestRuns: number;
  bestFigures: string;
  fiveWicketMatches: number;
  maidens: number;
};

export type BowlingBySeason = BowlingSummary & { season: string };

function uniqueMatchIds(innings: Array<{ matchId: string }>): number {
  return new Set(innings.map((i) => i.matchId)).size;
}

export function computeBattingSummary(innings: PlayerBattingInnings[]): BattingSummary {
  const dismissals = innings.filter((i) => !i.notOut).length;
  const runs = innings.reduce((s, i) => s + i.runs, 0);
  const balls = innings.reduce((s, i) => s + i.balls, 0);
  const notOuts = innings.filter((i) => i.notOut).length;

  return {
    matches: uniqueMatchIds(innings),
    innings: innings.length,
    notOuts,
    runs,
    balls,
    average: dismissals > 0 ? runs / dismissals : null,
    strikeRate: balls > 0 ? (runs / balls) * 100 : null,
    highScore: innings.reduce((m, i) => Math.max(m, i.runs), 0),
    fifties: innings.filter((i) => i.runs >= 50 && i.runs < 100).length,
    hundreds: innings.filter((i) => i.runs >= 100).length,
    fours: innings.reduce((s, i) => s + i.fours, 0),
    sixes: innings.reduce((s, i) => s + i.sixes, 0),
  };
}

export function computeBattingBySeason(
  innings: PlayerBattingInnings[]
): BattingBySeason[] {
  const seasons = Array.from(new Set(innings.map((i) => i.season))).sort();
  return seasons.map((season) => ({
    season,
    ...computeBattingSummary(innings.filter((i) => i.season === season)),
  }));
}

export function recentScores(
  innings: PlayerBattingInnings[],
  limit = 10
): PlayerBattingInnings[] {
  return [...innings]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
}

export function computeBowlingSummary(innings: PlayerBowlingInnings[]): BowlingSummary {
  const wickets = innings.reduce((s, i) => s + i.wickets, 0);
  const runs = innings.reduce((s, i) => s + i.runs, 0);
  const overs = innings.reduce((s, i) => s + i.overs, 0);
  const maidens = innings.reduce((s, i) => s + i.maidens, 0);

  let bestWickets = 0;
  let bestRuns = 999;
  for (const i of innings) {
    if (i.wickets > bestWickets || (i.wickets === bestWickets && i.runs < bestRuns)) {
      bestWickets = i.wickets;
      bestRuns = i.runs;
    }
  }

  const matchWickets = new Map<string, number>();
  for (const i of innings) {
    matchWickets.set(i.matchId, (matchWickets.get(i.matchId) ?? 0) + i.wickets);
  }
  const fiveWicketMatches = Array.from(matchWickets.values()).filter((w) => w >= 5).length;

  const balls = overs * 6;

  return {
    matches: uniqueMatchIds(innings),
    innings: innings.length,
    wickets,
    runs,
    overs,
    average: wickets > 0 ? runs / wickets : null,
    economy: overs > 0 ? runs / overs : null,
    strikeRate: wickets > 0 ? balls / wickets : null,
    bestWickets,
    bestRuns: bestWickets > 0 ? bestRuns : 0,
    bestFigures:
      bestWickets > 0 ? `${bestWickets}/${bestRuns}` : "—",
    fiveWicketMatches,
    maidens,
  };
}

export function computeBowlingBySeason(
  innings: PlayerBowlingInnings[]
): BowlingBySeason[] {
  const seasons = Array.from(new Set(innings.map((i) => i.season))).sort();
  return seasons.map((season) => ({
    season,
    ...computeBowlingSummary(innings.filter((i) => i.season === season)),
  }));
}
