import type { PlayerBattingInnings, PlayerBowlingInnings } from "./player-db";
import { computeBattingSummary, computeBowlingSummary } from "./player-stats";
import type { ScorecardMatch } from "./types";

export type CareerProgressPoint = {
  inningsIndex: number;
  date: string | null;
  opponent: string | null;
  runs: number;
  notOut: boolean;
  /** Cumulative batting average after this innings */
  cumulativeAverage: number | null;
  /** Cumulative strike rate after this innings */
  cumulativeStrikeRate: number | null;
  /** Rolling average over the last `window` innings ending here */
  rollingAverage: number | null;
  /** Rolling strike rate over the last `window` innings ending here */
  rollingStrikeRate: number | null;
};

export type BowlingCareerProgressPoint = {
  inningsIndex: number;
  date: string | null;
  opponent: string | null;
  wickets: number;
  runs: number;
  overs: number;
  cumulativeAverage: number | null;
  cumulativeEconomy: number | null;
  rollingAverage: number | null;
  rollingEconomy: number | null;
};

/** 1.0 = scored / struck at the same rate as the innings average */
export type RelativeBattingProgressPoint = {
  inningsIndex: number;
  date: string | null;
  opponent: string | null;
  runs: number;
  notOut: boolean;
  matchRunsPerWicket: number | null;
  matchStrikeRate: number | null;
  /** runs / match RPW for this innings */
  runsIndex: number | null;
  /** player SR / match SR for this innings */
  strikeRateIndex: number | null;
  cumulativeRunsIndex: number | null;
  cumulativeStrikeRateIndex: number | null;
  rollingRunsIndex: number | null;
  rollingStrikeRateIndex: number | null;
};

export type FormWindowComparison = {
  window: number;
  innings: number;
  average: number | null;
  strikeRate: number | null;
  runs: number;
  careerAverage: number | null;
  careerStrikeRate: number | null;
  averageDelta: number | null;
  strikeRateDelta: number | null;
};

export type BowlingFormWindowComparison = {
  window: number;
  innings: number;
  wickets: number;
  average: number | null;
  economy: number | null;
  careerAverage: number | null;
  careerEconomy: number | null;
  averageDelta: number | null;
  economyDelta: number | null;
};

export type RelativeFormWindow = {
  window: number;
  innings: number;
  runsIndex: number | null;
  strikeRateIndex: number | null;
  careerRunsIndex: number | null;
  careerStrikeRateIndex: number | null;
  runsIndexDelta: number | null;
  strikeRateIndexDelta: number | null;
};

export type PlayerBrowseIndex = {
  countries: string[];
  teamsByCountry: Map<string, string[]>;
  playersByCountryTeam: Map<string, Array<{ playerId: string; name: string; innings: number }>>;
};

function sortChronological<T extends { date: string | null; matchId: string }>(
  innings: T[]
): T[] {
  return [...innings].sort((a, b) => {
    const d = String(a.date ?? "").localeCompare(String(b.date ?? ""));
    if (d !== 0) return d;
    return a.matchId.localeCompare(b.matchId);
  });
}

function windowSummary(slice: PlayerBattingInnings[]) {
  const s = computeBattingSummary(slice);
  return { average: s.average, strikeRate: s.strikeRate, runs: s.runs, innings: s.innings };
}

function bowlingWindowSummary(slice: PlayerBowlingInnings[]) {
  const s = computeBowlingSummary(slice);
  return {
    average: s.average,
    economy: s.economy,
    wickets: s.wickets,
    innings: s.innings,
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function battingRelativeIndexes(inn: PlayerBattingInnings): {
  runsIndex: number | null;
  strikeRateIndex: number | null;
} {
  const runsIndex =
    inn.inningsRunsPerWicket != null && inn.inningsRunsPerWicket > 0
      ? inn.runs / inn.inningsRunsPerWicket
      : null;
  const playerSr = inn.balls > 0 ? (inn.runs / inn.balls) * 100 : null;
  const strikeRateIndex =
    playerSr != null &&
    inn.inningsStrikeRate != null &&
    inn.inningsStrikeRate > 0
      ? playerSr / inn.inningsStrikeRate
      : null;
  return { runsIndex, strikeRateIndex };
}

/**
 * Progressive career batting form: cumulative Ave/SR after each innings,
 * plus a rolling window (default 10) for recent form on the chart.
 */
export function buildCareerBattingProgress(
  innings: PlayerBattingInnings[],
  rollingWindow = 10
): CareerProgressPoint[] {
  const ordered = sortChronological(innings);
  const points: CareerProgressPoint[] = [];

  let cumRuns = 0;
  let cumBalls = 0;
  let cumDismissals = 0;

  for (let i = 0; i < ordered.length; i++) {
    const inn = ordered[i]!;
    cumRuns += inn.runs;
    cumBalls += inn.balls;
    if (!inn.notOut) cumDismissals += 1;

    const windowSlice = ordered.slice(Math.max(0, i + 1 - rollingWindow), i + 1);
    const rolling = windowSummary(windowSlice);

    points.push({
      inningsIndex: i + 1,
      date: inn.date,
      opponent: inn.opponent,
      runs: inn.runs,
      notOut: inn.notOut,
      cumulativeAverage: cumDismissals > 0 ? cumRuns / cumDismissals : null,
      cumulativeStrikeRate: cumBalls > 0 ? (cumRuns / cumBalls) * 100 : null,
      rollingAverage: rolling.average,
      rollingStrikeRate: rolling.strikeRate,
    });
  }

  return points;
}

/** Last N innings vs full career — for form callouts. */
export function compareFormWindows(
  innings: PlayerBattingInnings[],
  windows: number[] = [10, 20]
): FormWindowComparison[] {
  const ordered = sortChronological(innings);
  const career = computeBattingSummary(ordered);

  return windows.map((window) => {
    const slice = ordered.slice(-window);
    const recent = windowSummary(slice);
    return {
      window,
      innings: recent.innings,
      average: recent.average,
      strikeRate: recent.strikeRate,
      runs: recent.runs,
      careerAverage: career.average,
      careerStrikeRate: career.strikeRate,
      averageDelta:
        recent.average != null && career.average != null
          ? recent.average - career.average
          : null,
      strikeRateDelta:
        recent.strikeRate != null && career.strikeRate != null
          ? recent.strikeRate - career.strikeRate
          : null,
    };
  });
}

export function buildCareerBowlingProgress(
  innings: PlayerBowlingInnings[],
  rollingWindow = 10
): BowlingCareerProgressPoint[] {
  const ordered = sortChronological(innings);
  const points: BowlingCareerProgressPoint[] = [];

  let cumWickets = 0;
  let cumRuns = 0;
  let cumOvers = 0;

  for (let i = 0; i < ordered.length; i++) {
    const inn = ordered[i]!;
    cumWickets += inn.wickets;
    cumRuns += inn.runs;
    cumOvers += inn.overs;

    const windowSlice = ordered.slice(Math.max(0, i + 1 - rollingWindow), i + 1);
    const rolling = bowlingWindowSummary(windowSlice);

    points.push({
      inningsIndex: i + 1,
      date: inn.date,
      opponent: inn.opponent,
      wickets: inn.wickets,
      runs: inn.runs,
      overs: inn.overs,
      cumulativeAverage: cumWickets > 0 ? cumRuns / cumWickets : null,
      cumulativeEconomy: cumOvers > 0 ? cumRuns / cumOvers : null,
      rollingAverage: rolling.average,
      rollingEconomy: rolling.economy,
    });
  }

  return points;
}

export function compareBowlingFormWindows(
  innings: PlayerBowlingInnings[],
  windows: number[] = [10, 20]
): BowlingFormWindowComparison[] {
  const ordered = sortChronological(innings);
  const career = computeBowlingSummary(ordered);

  return windows.map((window) => {
    const slice = ordered.slice(-window);
    const recent = bowlingWindowSummary(slice);
    return {
      window,
      innings: recent.innings,
      wickets: recent.wickets,
      average: recent.average,
      economy: recent.economy,
      careerAverage: career.average,
      careerEconomy: career.economy,
      averageDelta:
        recent.average != null && career.average != null
          ? recent.average - career.average
          : null,
      economyDelta:
        recent.economy != null && career.economy != null
          ? recent.economy - career.economy
          : null,
    };
  });
}

/**
 * Career form vs match context: 1.0 = same as innings RPW / innings SR.
 * Example: 30 runs when wickets fall at 15 → runs index 2.0; at 40 → 0.75.
 */
export function buildCareerRelativeBattingProgress(
  innings: PlayerBattingInnings[],
  rollingWindow = 10
): RelativeBattingProgressPoint[] {
  const ordered = sortChronological(innings);
  const points: RelativeBattingProgressPoint[] = [];
  const runsIndexes: number[] = [];
  const srIndexes: number[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const inn = ordered[i]!;
    const { runsIndex, strikeRateIndex } = battingRelativeIndexes(inn);
    if (runsIndex != null) runsIndexes.push(runsIndex);
    if (strikeRateIndex != null) srIndexes.push(strikeRateIndex);

    const windowSlice = ordered.slice(Math.max(0, i + 1 - rollingWindow), i + 1);
    const windowRuns = windowSlice
      .map((x) => battingRelativeIndexes(x).runsIndex)
      .filter((v): v is number => v != null);
    const windowSr = windowSlice
      .map((x) => battingRelativeIndexes(x).strikeRateIndex)
      .filter((v): v is number => v != null);

    points.push({
      inningsIndex: i + 1,
      date: inn.date,
      opponent: inn.opponent,
      runs: inn.runs,
      notOut: inn.notOut,
      matchRunsPerWicket: inn.inningsRunsPerWicket,
      matchStrikeRate: inn.inningsStrikeRate,
      runsIndex,
      strikeRateIndex,
      cumulativeRunsIndex: mean(runsIndexes),
      cumulativeStrikeRateIndex: mean(srIndexes),
      rollingRunsIndex: mean(windowRuns),
      rollingStrikeRateIndex: mean(windowSr),
    });
  }

  return points;
}

export function compareRelativeFormWindows(
  innings: PlayerBattingInnings[],
  windows: number[] = [10, 20]
): RelativeFormWindow[] {
  const ordered = sortChronological(innings);
  const careerRuns = ordered
    .map((x) => battingRelativeIndexes(x).runsIndex)
    .filter((v): v is number => v != null);
  const careerSr = ordered
    .map((x) => battingRelativeIndexes(x).strikeRateIndex)
    .filter((v): v is number => v != null);
  const careerRunsIndex = mean(careerRuns);
  const careerStrikeRateIndex = mean(careerSr);

  return windows.map((window) => {
    const slice = ordered.slice(-window);
    const runs = slice
      .map((x) => battingRelativeIndexes(x).runsIndex)
      .filter((v): v is number => v != null);
    const sr = slice
      .map((x) => battingRelativeIndexes(x).strikeRateIndex)
      .filter((v): v is number => v != null);
    const runsIndex = mean(runs);
    const strikeRateIndex = mean(sr);
    return {
      window,
      innings: slice.length,
      runsIndex,
      strikeRateIndex,
      careerRunsIndex,
      careerStrikeRateIndex,
      runsIndexDelta:
        runsIndex != null && careerRunsIndex != null
          ? runsIndex - careerRunsIndex
          : null,
      strikeRateIndexDelta:
        strikeRateIndex != null && careerStrikeRateIndex != null
          ? strikeRateIndex - careerStrikeRateIndex
          : null,
    };
  });
}

function countryTeamKey(country: string, team: string): string {
  return `${country}::${team}`;
}

/**
 * Infer each team's home country from scorecard hosts:
 * - team name matching a host country → that country
 * - otherwise → most frequent host among matches that team played
 */
function inferTeamCountries(matches: ScorecardMatch[]): {
  countries: string[];
  teamCountry: Map<string, string>;
} {
  const hosts = new Set<string>();
  const hostCountsByTeam = new Map<string, Map<string, number>>();

  for (const match of matches) {
    const host = (match.host ?? "").trim() || "Unknown";
    hosts.add(host);
    for (const inn of match.innings) {
      const team = (inn.team ?? "").trim();
      if (!team) continue;
      let counts = hostCountsByTeam.get(team);
      if (!counts) {
        counts = new Map();
        hostCountsByTeam.set(team, counts);
      }
      counts.set(host, (counts.get(host) ?? 0) + 1);
    }
  }

  const teamCountry = new Map<string, string>();
  Array.from(hostCountsByTeam.entries()).forEach(([team, counts]) => {
    if (hosts.has(team)) {
      teamCountry.set(team, team);
      return;
    }
    let bestHost = "Unknown";
    let bestCount = -1;
    Array.from(counts.entries()).forEach(([host, count]) => {
      if (count > bestCount || (count === bestCount && host.localeCompare(bestHost) < 0)) {
        bestHost = host;
        bestCount = count;
      }
    });
    teamCountry.set(team, bestHost);
  });

  return {
    countries: Array.from(hosts).sort((a, b) => a.localeCompare(b)),
    teamCountry,
  };
}

/**
 * Browse hierarchy: Country → Team → Player.
 * Country is inferred from match hosts (team's home / most-played host).
 */
export function buildPlayerBrowseIndex(
  matches: ScorecardMatch[],
  players: Array<{
    playerId: string;
    name: string;
    battingInnings: Array<{ team: string; matchId: string }>;
  }>
): PlayerBrowseIndex {
  const { countries, teamCountry } = inferTeamCountries(matches);
  const teamsByCountry = new Map<string, Set<string>>();
  for (const country of countries) {
    teamsByCountry.set(country, new Set());
  }

  const playersByCountryTeam = new Map<
    string,
    Map<string, { playerId: string; name: string; innings: number }>
  >();

  for (const player of players) {
    for (const inn of player.battingInnings) {
      const team = (inn.team ?? "").trim();
      if (!team) continue;
      const country = teamCountry.get(team) ?? "Unknown";
      if (!teamsByCountry.has(country)) teamsByCountry.set(country, new Set());
      teamsByCountry.get(country)!.add(team);

      const key = countryTeamKey(country, team);
      let bucket = playersByCountryTeam.get(key);
      if (!bucket) {
        bucket = new Map();
        playersByCountryTeam.set(key, bucket);
      }
      const existing = bucket.get(player.playerId);
      if (existing) {
        existing.innings += 1;
      } else {
        bucket.set(player.playerId, {
          playerId: player.playerId,
          name: player.name,
          innings: 1,
        });
      }
    }
  }

  const teamsMap = new Map<string, string[]>();
  Array.from(teamsByCountry.entries()).forEach(([country, teams]) => {
    teamsMap.set(
      country,
      Array.from(teams).sort((a, b) => a.localeCompare(b))
    );
  });

  const playersMap = new Map<
    string,
    Array<{ playerId: string; name: string; innings: number }>
  >();
  Array.from(playersByCountryTeam.entries()).forEach(([key, map]) => {
    playersMap.set(
      key,
      Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    );
  });

  const allCountries = Array.from(
    new Set([...countries, ...Array.from(teamsMap.keys())])
  ).sort((a, b) => a.localeCompare(b));

  return {
    countries: allCountries,
    teamsByCountry: teamsMap,
    playersByCountryTeam: playersMap,
  };
}

export function playersForCountryTeam(
  index: PlayerBrowseIndex,
  country: string,
  team: string
): Array<{ playerId: string; name: string; innings: number }> {
  return index.playersByCountryTeam.get(countryTeamKey(country, team)) ?? [];
}
