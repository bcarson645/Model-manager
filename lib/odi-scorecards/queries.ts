import { getOdiMatches } from "./matches";
import {
  topBatterTeamLostQuery as topBatterTeamLostQueryShared,
  topBatterTopBowlerTeamsQuery as topBatterTopBowlerTeamsQueryShared,
} from "@/lib/scorecards/queries";
import type { OdiMatch } from "./types";

export function topBatterTeamLostQuery() {
  return topBatterTeamLostQueryShared(getOdiMatches());
}

export function topBatterTopBowlerTeamsQuery() {
  return topBatterTopBowlerTeamsQueryShared(getOdiMatches());
}

export function describeMatchStructure(match: OdiMatch): string[] {
  const lines = [
    `Match ${match.id} · ${match.date ?? "unknown date"} · ${match.venue ?? ""}`,
    `${match.innings.length} innings blocks, ${match.rowCount} player rows`,
    `Teams: ${Object.keys(match.teamTotals).join(" vs ")}`,
    `Totals: ${Object.entries(match.teamTotals)
      .map(([t, s]) => `${t} ${s}`)
      .join(", ")}`,
    match.result === "tie"
      ? "Result: tie"
      : `Winner: ${match.winner} (higher team total)`,
  ];
  if (match.topBatter) {
    lines.push(
      `Match top batter: ${match.topBatter.name} (${match.topBatter.team}) — ${match.topBatter.runs} runs`
    );
  }
  if (match.topBowler) {
    lines.push(
      `Match top bowler: ${match.topBowler.name} (${match.topBowler.team}) — ${match.topBowler.wickets}/${match.topBowler.runs}`
    );
  }
  return lines;
}
