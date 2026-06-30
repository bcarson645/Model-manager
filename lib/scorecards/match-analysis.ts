import type { ScorecardMatch } from "./types";

export type ScoreBucket = { label: string; count: number };

export type MatchAnalysisResult = {
  totalMatches: number;
  decidedMatches: number;
  ties: number;
  firstInningsScores: {
    buckets: ScoreBucket[];
    mean: number;
    median: number;
    min: number;
    max: number;
  };
  batFirst: { wins: number; total: number; winPct: number };
  chase: { wins: number; total: number; winPct: number };
  toss: { available: boolean; note: string };
  centuries: {
    matchesWithCentury: number;
    centuryTeamWon: number;
    winPct: number;
  };
};

function firstInnings(match: ScorecardMatch) {
  if (match.innings.length === 0) return null;
  return match.innings.reduce((a, b) => (a.innings < b.innings ? a : b));
}

function scoreBucket(score: number, maxOvers: number | null): string {
  const isT20 = maxOvers != null && maxOvers <= 20;
  if (isT20) {
    if (score < 120) return "<120";
    if (score < 140) return "120–139";
    if (score < 160) return "140–159";
    if (score < 180) return "160–179";
    if (score < 200) return "180–199";
    return "200+";
  }
  if (score < 200) return "<200";
  if (score < 250) return "200–249";
  if (score < 300) return "250–299";
  if (score < 350) return "300–349";
  return "350+";
}

export function computeMatchAnalysis(matches: ScorecardMatch[]): MatchAnalysisResult {
  const bucketCounts = new Map<string, number>();
  const firstInningsTotals: number[] = [];
  let batFirstWins = 0;
  let batFirstTotal = 0;
  let chaseWins = 0;
  let chaseTotal = 0;
  let centuryMatches = 0;
  let centuryWon = 0;
  let decided = 0;
  let ties = 0;

  for (const match of matches) {
    if (match.result === "tie") {
      ties++;
      continue;
    }
    if (!match.winner) continue;
    decided++;

    const inn1 = firstInnings(match);
    if (inn1?.total != null) {
      firstInningsTotals.push(inn1.total);
      const label = scoreBucket(inn1.total, match.maxOvers);
      bucketCounts.set(label, (bucketCounts.get(label) ?? 0) + 1);
    }

    const inn2 = match.innings.find((i) => i.innings !== inn1?.innings);
    if (inn1) {
      batFirstTotal++;
      if (match.winner === inn1.team) batFirstWins++;
    }
    if (inn2) {
      chaseTotal++;
      if (match.winner === inn2.team) chaseWins++;
    }

    let hadCentury = false;
    let centuryTeam: string | null = null;
    for (const inn of match.innings) {
      for (const p of inn.players) {
        const runs = Number(p.batting.runs ?? 0);
        if (runs >= 100) {
          hadCentury = true;
          centuryTeam = p.team ?? inn.team;
        }
      }
    }
    if (hadCentury) {
      centuryMatches++;
      if (centuryTeam && match.winner === centuryTeam) centuryWon++;
    }
  }

  const sorted = [...firstInningsTotals].sort((a, b) => a - b);
  const mean =
    sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const median =
    sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  const sampleMax = matches.find((m) => m.maxOvers != null)?.maxOvers ?? 50;
  const isT20 = sampleMax <= 20;
  const bucketOrder = isT20
      ? ["<120", "120–139", "140–159", "160–179", "180–199", "200+"]
      : ["<200", "200–249", "250–299", "300–349", "350+"];

  return {
    totalMatches: matches.length,
    decidedMatches: decided,
    ties,
    firstInningsScores: {
      buckets: bucketOrder.map((label) => ({
        label,
        count: bucketCounts.get(label) ?? 0,
      })),
      mean: Math.round(mean),
      median,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
    },
    batFirst: {
      wins: batFirstWins,
      total: batFirstTotal,
      winPct: batFirstTotal > 0 ? (batFirstWins / batFirstTotal) * 100 : 0,
    },
    chase: {
      wins: chaseWins,
      total: chaseTotal,
      winPct: chaseTotal > 0 ? (chaseWins / chaseTotal) * 100 : 0,
    },
    toss: {
      available: false,
      note: "Toss data is not in the scorecard exports — cannot compute toss/win correlation yet.",
    },
    centuries: {
      matchesWithCentury: centuryMatches,
      centuryTeamWon: centuryWon,
      winPct: centuryMatches > 0 ? (centuryWon / centuryMatches) * 100 : 0,
    },
  };
}
