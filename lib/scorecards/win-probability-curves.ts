import type { DataFormat, ScorecardMatch } from "./types";

export type InningsPair = {
  target: number;
  chaseScore: number;
  batFirstTeam: string;
  chaseTeam: string;
  batFirstWon: boolean;
  chaseWon: boolean;
};

export type TargetWinPoint = {
  target: number;
  batFirstWinPct: number;
  chaseWinPct: number;
  batFirstWins: number;
  chaseWins: number;
  total: number;
};

export type ChaseScoreDensityPoint = {
  score: number;
  count: number;
  density: number;
};

export type WinProbabilityCurves = {
  pairs: InningsPair[];
  byTarget: TargetWinPoint[];
  chaseScoreDensity: ChaseScoreDensityPoint[];
  binWidth: number;
  minTarget: number;
  maxTarget: number;
};

function firstInnings(match: ScorecardMatch) {
  if (match.innings.length === 0) return null;
  return match.innings.reduce((a, b) => (a.innings < b.innings ? a : b));
}

function secondInnings(match: ScorecardMatch, first: { innings: number }) {
  return match.innings.find((i) => i.innings !== first.innings) ?? null;
}

export function extractInningsPairs(matches: ScorecardMatch[]): InningsPair[] {
  const pairs: InningsPair[] = [];

  for (const match of matches) {
    if (match.result === "tie" || !match.winner) continue;

    const inn1 = firstInnings(match);
    const inn2 = inn1 ? secondInnings(match, inn1) : null;
    if (!inn1 || !inn2) continue;
    if (inn1.total == null || inn2.total == null) continue;

    const batFirstWon = match.winner === inn1.team;
    pairs.push({
      target: inn1.total,
      chaseScore: inn2.total,
      batFirstTeam: inn1.team,
      chaseTeam: inn2.team,
      batFirstWon,
      chaseWon: !batFirstWon,
    });
  }

  return pairs;
}

function binWidthForFormat(format: DataFormat): number {
  return format === "t20" ? 5 : 10;
}

function binKey(score: number, width: number): number {
  return Math.floor(score / width) * width;
}

function smoothWinCurve(points: TargetWinPoint[], windowBins: number): TargetWinPoint[] {
  if (points.length <= 2) return points;

  return points.map((p, i) => {
    const half = Math.floor(windowBins / 2);
    const slice = points.slice(Math.max(0, i - half), Math.min(points.length, i + half + 1));
    let weight = 0;
    let batWins = 0;
    let chaseWins = 0;
    let total = 0;
    for (const s of slice) {
      batWins += s.batFirstWins;
      chaseWins += s.chaseWins;
      total += s.total;
      weight += s.total;
    }
    if (total === 0) return p;
    return {
      ...p,
      batFirstWinPct: (batWins / total) * 100,
      chaseWinPct: (chaseWins / total) * 100,
      batFirstWins: batWins,
      chaseWins: chaseWins,
      total,
    };
  });
}

export function computeWinProbabilityCurves(
  matches: ScorecardMatch[],
  format: DataFormat
): WinProbabilityCurves {
  const pairs = extractInningsPairs(matches);
  const binWidth = binWidthForFormat(format);

  const targetBins = new Map<
    number,
    { batFirstWins: number; chaseWins: number; total: number }
  >();

  for (const p of pairs) {
    const key = binKey(p.target, binWidth);
    const row = targetBins.get(key) ?? { batFirstWins: 0, chaseWins: 0, total: 0 };
    row.total++;
    if (p.batFirstWon) row.batFirstWins++;
    if (p.chaseWon) row.chaseWins++;
    targetBins.set(key, row);
  }

  const byTargetRaw: TargetWinPoint[] = Array.from(targetBins.entries())
    .sort(([a], [b]) => a - b)
    .map(([target, row]) => ({
      target: target + binWidth / 2,
      batFirstWinPct: row.total > 0 ? (row.batFirstWins / row.total) * 100 : 0,
      chaseWinPct: row.total > 0 ? (row.chaseWins / row.total) * 100 : 0,
      batFirstWins: row.batFirstWins,
      chaseWins: row.chaseWins,
      total: row.total,
    }))
    .filter((p) => p.total >= 3);

  const smoothWindow = format === "t20" ? 5 : 3;
  const byTarget = smoothWinCurve(byTargetRaw, smoothWindow);

  const chaseBins = new Map<number, number>();
  for (const p of pairs) {
    const key = binKey(p.chaseScore, binWidth);
    chaseBins.set(key, (chaseBins.get(key) ?? 0) + 1);
  }

  const chaseTotal = pairs.length;
  const chaseScoreDensity: ChaseScoreDensityPoint[] = Array.from(chaseBins.entries())
    .sort(([a], [b]) => a - b)
    .map(([score, count]) => ({
      score: score + binWidth / 2,
      count,
      density: chaseTotal > 0 ? count / chaseTotal : 0,
    }));

  const targets = pairs.map((p) => p.target);

  return {
    pairs,
    byTarget,
    chaseScoreDensity,
    binWidth,
    minTarget: targets.length > 0 ? Math.min(...targets) : 0,
    maxTarget: targets.length > 0 ? Math.max(...targets) : 0,
  };
}
