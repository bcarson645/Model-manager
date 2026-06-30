import type { DataFormat } from "./types";
import type { ScorecardMatch } from "./types";

export type LoggedQueryResult = {
  id: string;
  title: string;
  askedAt: string;
  format: DataFormat;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  notes?: string[];
};

export function topBatterTeamLostQuery(matches: ScorecardMatch[]) {
  const withTopBatter = matches.filter((m) => m.topBatter);
  const decided = withTopBatter.filter((m) => m.result === "decided" && m.winner);
  const lost = decided.filter(
    (m) => m.topBatter && m.winner && m.topBatter.team !== m.winner
  );
  const won = decided.length - lost.length;

  return {
    totalMatches: matches.length,
    matchesWithTopBatter: withTopBatter.length,
    decidedMatches: decided.length,
    ties: withTopBatter.length - decided.length,
    topBatterTeamWon: won,
    topBatterTeamLost: lost.length,
    topBatterTeamLostPct:
      decided.length > 0 ? (lost.length / decided.length) * 100 : 0,
    examples: lost
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        date: m.date,
        topBatter: m.topBatter!.name ?? "Unknown",
        topBatterTeam: m.topBatter!.team,
        topBatterRuns: m.topBatter!.runs,
        winner: m.winner!,
        teamTotals: m.teamTotals,
      })),
  };
}

export function topBatterTopBowlerTeamsQuery(matches: ScorecardMatch[]) {
  const withTopBatter = matches.filter((m) => m.topBatter);
  const withTopBowler = matches.filter((m) => m.topBowler);
  const withBoth = matches.filter((m) => m.topBatter && m.topBowler);
  const different = withBoth.filter(
    (m) => m.topBatter!.team !== m.topBowler!.team
  );

  return {
    matchesWithBoth: withBoth.length,
    matchesWithTopBatterOnly: withTopBatter.length - withBoth.length,
    sameTeam: withBoth.length - different.length,
    differentTeams: different.length,
    differentTeamsPct:
      withBoth.length > 0 ? (different.length / withBoth.length) * 100 : 0,
    example: different[0]
      ? {
          id: different[0].id,
          date: different[0].date,
          topBatter: different[0].topBatter!.name ?? "Unknown",
          topBatterTeam: different[0].topBatter!.team,
          topBowler: different[0].topBowler!.name ?? "Unknown",
          topBowlerTeam: different[0].topBowler!.team,
        }
      : null,
  };
}

export function buildLoggedQueries(
  format: DataFormat,
  matches: ScorecardMatch[]
): LoggedQueryResult[] {
  const topBat = topBatterTeamLostQuery(matches);
  const batBowl = topBatterTopBowlerTeamsQuery(matches);

  return [
    {
      id: "top-batter-team-lost",
      title: "Top batter's team loses",
      askedAt: "2026-06-30",
      format,
      description:
        "How often does the match top batter's team lose? Uses Match.Tp.Bt = 1. Winner = higher team Total (ties excluded).",
      metrics: [
        { label: "Decided matches", value: String(topBat.decidedMatches) },
        { label: "Top batter team won", value: String(topBat.topBatterTeamWon) },
        {
          label: "Top batter team lost",
          value: `${topBat.topBatterTeamLost} (${topBat.topBatterTeamLostPct.toFixed(1)}%)`,
        },
        { label: "Ties excluded", value: String(topBat.ties) },
      ],
      notes: [
        "Logged example: 1007651 — V Sibanda 53, Zimbabwe 126 vs India 129",
      ],
    },
    {
      id: "top-bat-bowl-different-teams",
      title: "Top batter & top bowler on different teams",
      askedAt: "2026-06-30",
      format,
      description:
        "Match top batter from Match.Tp.Bt. Top bowler inferred: most wickets, ties by fewest runs conceded.",
      metrics: [
        { label: "Matches with both", value: String(batBowl.matchesWithBoth) },
        { label: "Different teams", value: String(batBowl.differentTeams) },
        {
          label: "Different teams %",
          value: `${batBowl.differentTeamsPct.toFixed(1)}%`,
        },
        { label: "Same team", value: String(batBowl.sameTeam) },
      ],
      notes: batBowl.example
        ? [
            `Example: ${batBowl.example.id} — ${batBowl.example.topBatter} (${batBowl.example.topBatterTeam}) vs ${batBowl.example.topBowler} (${batBowl.example.topBowlerTeam})`,
          ]
        : undefined,
    },
  ];
}
