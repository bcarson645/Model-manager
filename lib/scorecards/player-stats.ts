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

export function recentBowlingSpells(
  innings: PlayerBowlingInnings[],
  limit = 10
): PlayerBowlingInnings[] {
  return [...innings]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
}

export type ScoreDistributionBucket = {
  label: string;
  low: number;
  high: number;
  playerCount: number;
  playerPct: number;
  datasetPct: number;
  vsAvgPp: number;
  /** Approximate z vs dataset rate given player sample size */
  zScore: number;
  highlighted: boolean;
  aboveDataset: boolean;
};

export type ScoreDistributionResult = {
  bucketWidth: number;
  playerInnings: number;
  datasetInnings: number;
  buckets: ScoreDistributionBucket[];
  pctAbove30: number;
  pctAbove50: number;
  datasetPctAbove30: number;
  datasetPctAbove50: number;
};

/**
 * Bands match cricket-style labels for width W: 0–W, (W+1)–(2W), …
 * e.g. W=5 → 0–5, 6–10, 11–15.
 */
export function scoreBucketBounds(
  runs: number,
  width: number
): { low: number; high: number } {
  const w = Math.max(1, Math.floor(width));
  if (runs <= w) return { low: 0, high: w };
  const idx = Math.floor((runs - w - 1) / w) + 1;
  const low = w + 1 + (idx - 1) * w;
  return { low, high: low + w - 1 };
}

function bucketKey(low: number, high: number): string {
  return `${low}-${high}`;
}

function pctAtLeast(innings: PlayerBattingInnings[], threshold: number): number {
  if (innings.length === 0) return 0;
  const n = innings.filter((i) => i.runs >= threshold).length;
  return (n / innings.length) * 100;
}

export function computeScoreDistribution(
  playerInnings: PlayerBattingInnings[],
  datasetInnings: PlayerBattingInnings[],
  bucketWidth = 5
): ScoreDistributionResult {
  const width = Math.max(1, Math.floor(bucketWidth));
  const playerN = playerInnings.length;
  const datasetN = datasetInnings.length;

  const playerCounts = new Map<string, number>();
  const datasetCounts = new Map<string, number>();
  let maxHigh = width;

  const bump = (map: Map<string, number>, runs: number) => {
    const { low, high } = scoreBucketBounds(runs, width);
    maxHigh = Math.max(maxHigh, high);
    const key = bucketKey(low, high);
    map.set(key, (map.get(key) ?? 0) + 1);
  };

  for (const inn of playerInnings) bump(playerCounts, inn.runs);
  for (const inn of datasetInnings) bump(datasetCounts, inn.runs);

  const buckets: ScoreDistributionBucket[] = [];
  let low = 0;
  let high = width;
  while (low <= maxHigh) {
    const key = bucketKey(low, high);
    const playerCount = playerCounts.get(key) ?? 0;
    const datasetCount = datasetCounts.get(key) ?? 0;
    const playerPct = playerN > 0 ? (playerCount / playerN) * 100 : 0;
    const datasetPct = datasetN > 0 ? (datasetCount / datasetN) * 100 : 0;
    const vsAvgPp = playerPct - datasetPct;
    const p = Math.min(0.999, Math.max(0.001, datasetPct / 100));
    const se = playerN > 0 ? Math.sqrt((p * (1 - p)) / playerN) : 1;
    const zScore = se > 0 ? (playerPct / 100 - p) / se : 0;
    const highlighted =
      playerN >= 8 && (Math.abs(zScore) >= 1.96 || Math.abs(vsAvgPp) >= 8);
    buckets.push({
      label: `${low}–${high}`,
      low,
      high,
      playerCount,
      playerPct,
      datasetPct,
      vsAvgPp,
      zScore,
      highlighted,
      aboveDataset: vsAvgPp > 0,
    });
    low = high + 1;
    high = low + width - 1;
  }

  return {
    bucketWidth: width,
    playerInnings: playerN,
    datasetInnings: datasetN,
    buckets,
    pctAbove30: pctAtLeast(playerInnings, 30),
    pctAbove50: pctAtLeast(playerInnings, 50),
    datasetPctAbove30: pctAtLeast(datasetInnings, 30),
    datasetPctAbove50: pctAtLeast(datasetInnings, 50),
  };
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
