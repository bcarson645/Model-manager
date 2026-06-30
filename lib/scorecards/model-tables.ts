import type { DataFormat } from "./types";
import type { FlatScorecardData, InningsSlice, MatchSlice, PlayerSlice } from "./flatten";
import { isNotOut } from "./stats-utils";

export type TableFilterContext = {
  venue?: string;
  venueId?: string | number;
  host?: string;
  hostId?: string | number;
  tournament?: string;
  competitionId?: string | number;
  team?: string;
};

export type WeightColumn =
  | "venue"
  | "host"
  | "competition"
  | "all"
  | "last5Years"
  | "competition3yr";

const TABLE1_WEIGHTS: WeightColumn[] = [
  "venue",
  "host",
  "competition",
  "all",
  "last5Years",
];

const TABLE2_WEIGHTS: WeightColumn[] = [
  "venue",
  "host",
  "competition",
  "competition3yr",
  "all",
];

const WEIGHT_LABELS: Record<WeightColumn, string> = {
  venue: "Venue",
  host: "Host",
  competition: "Competition",
  all: "All",
  last5Years: "Last 5 years",
  competition3yr: "3-year competition",
};

export type TableCell = {
  value: number | null;
  sampleSize?: number;
  note?: string;
};

export type ModelTable = {
  id: "table-1" | "table-2";
  name: string;
  rowLabels: string[];
  weightColumns: WeightColumn[];
  weightLabels: string[];
  rows: Array<Record<WeightColumn, TableCell>>;
  referenceContext?: TableFilterContext;
};

function formatMaxOvers(format: DataFormat): number {
  if (format === "t20") return 20;
  if (format === "odi") return 50;
  return 90;
}

function matchesMaxOvers(maxOvers: number | null, format: DataFormat): boolean {
  if (maxOvers == null) return true;
  return Math.abs(maxOvers - formatMaxOvers(format)) <= 1;
}

function isLimitedOversInnings(innings: number): boolean {
  return innings < 3;
}

function yearCutoffLast5(referenceYear: number): number {
  return referenceYear - 5;
}

function yearCutoff3yr(referenceYear: number): number {
  return referenceYear - 3;
}

function contextForWeight(weight: WeightColumn, ctx: TableFilterContext): TableFilterContext {
  const team = ctx.team ? { team: ctx.team } : {};

  switch (weight) {
    case "all":
    case "last5Years":
      return {};
    case "venue":
      return {
        ...team,
        ...(ctx.venue ? { venue: ctx.venue } : {}),
        ...(ctx.venueId != null ? { venueId: ctx.venueId } : {}),
      };
    case "host":
      return {
        ...team,
        ...(ctx.host ? { host: ctx.host } : {}),
        ...(ctx.hostId != null ? { hostId: ctx.hostId } : {}),
      };
    case "competition":
    case "competition3yr":
      return {
        ...team,
        ...(ctx.tournament ? { tournament: ctx.tournament } : {}),
        ...(ctx.competitionId != null ? { competitionId: ctx.competitionId } : {}),
      };
    default:
      return {};
  }
}

function requiresFixtureSelection(weight: WeightColumn, ctx: TableFilterContext): boolean {
  if (weight === "venue") return !ctx.venue && ctx.venueId == null;
  if (weight === "host") return !ctx.host && ctx.hostId == null;
  if (weight === "competition" || weight === "competition3yr") {
    return !ctx.tournament && ctx.competitionId == null;
  }
  return false;
}

function matchesContext(
  item: {
    venue?: string | null;
    host?: string | null;
    venueId?: string | number | null;
    hostId?: string | number | null;
    tournament?: string | null;
    competitionId?: string | number | null;
    team?: string;
    teams?: string[];
  },
  ctx: TableFilterContext
): boolean {
  if (ctx.venue && item.venue !== ctx.venue) return false;
  if (ctx.venueId != null && String(item.venueId) !== String(ctx.venueId)) return false;
  if (ctx.host && item.host !== ctx.host) return false;
  if (ctx.hostId != null && String(item.hostId) !== String(ctx.hostId)) return false;
  if (ctx.tournament && item.tournament !== ctx.tournament) return false;
  if (ctx.competitionId != null && String(item.competitionId) !== String(ctx.competitionId)) {
    return false;
  }
  if (ctx.team) {
    const teams = item.teams ?? (item.team ? [item.team] : []);
    if (!teams.includes(ctx.team)) return false;
  }
  return true;
}

function filterInnings(
  data: FlatScorecardData,
  weight: WeightColumn,
  format: DataFormat,
  ctx: TableFilterContext,
  referenceYear: number
): InningsSlice[] {
  if (requiresFixtureSelection(weight, ctx)) return [];

  const weightCtx = contextForWeight(weight, ctx);

  return data.innings.filter((inn) => {
    if (!isLimitedOversInnings(inn.innings)) return false;
    if (!matchesMaxOvers(inn.maxOvers, format)) return false;
    if (!matchesContext(inn, weightCtx)) return false;

    if (weight === "last5Years" && inn.year < yearCutoffLast5(referenceYear)) return false;
    if (weight === "competition3yr" && inn.year < yearCutoff3yr(referenceYear)) return false;

    return true;
  });
}

function firstInningsSamples(
  data: FlatScorecardData,
  weight: WeightColumn,
  format: DataFormat,
  ctx: TableFilterContext,
  referenceYear: number
): InningsSlice[] {
  return filterInnings(data, weight, format, ctx, referenceYear).filter(
    (inn) => inn.innings === 1
  );
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function cell(value: number | null, sampleSize?: number, note?: string): TableCell {
  return { value, sampleSize, note };
}

function computeTable1Row(
  rowKey: string,
  samples: InningsSlice[],
  allInnings: InningsSlice[],
  players: PlayerSlice[],
  matchIds: Set<string>
): TableCell {
  const n = samples.length;
  if (n === 0) return cell(null, 0);

  const playerRows = players.filter(
    (p) => matchIds.has(p.matchId) && p.innings === 1
  );

  switch (rowKey) {
    case "1stInns":
      return cell(avg(samples.map((s) => s.total)), n);
    case "wickets":
      return cell(avg(samples.map((s) => s.wickets)), n);
    case "fours":
      return cell(allInnings.reduce((s, i) => s + i.fours, 0) / n, n);
    case "sixes":
      return cell(allInnings.reduce((s, i) => s + i.sixes, 0) / n, n);
    case "t5avg": {
      const top = playerRows.filter((p) => p.order > 0 && p.order < 6 && p.balls > 0);
      const runs = top.reduce((s, p) => s + p.runs, 0);
      const dismissals = top.filter((p) => !isNotOut(p.dismissal)).length;
      return cell(dismissals > 0 ? runs / dismissals : null, top.length);
    }
    case "t5sr": {
      const top = playerRows.filter((p) => p.order > 0 && p.order < 6 && p.balls > 0);
      const runs = top.reduce((s, p) => s + p.runs, 0);
      const balls = top.reduce((s, p) => s + p.balls, 0);
      return cell(balls > 0 ? runs / balls : null, top.length);
    }
    case "prog1":
    case "prog2":
    case "prog3":
      return cell(null, n, "Requires Prog Data (not in scorecard export)");
    case "foursProp": {
      const fours = allInnings.reduce((s, i) => s + i.fours, 0);
      const runs = samples.reduce((s, i) => s + i.total, 0);
      return cell(runs > 0 ? (fours * 4) / runs : null, n);
    }
    case "sixesProp": {
      const sixes = allInnings.reduce((s, i) => s + i.sixes, 0);
      const runs = samples.reduce((s, i) => s + i.total, 0);
      return cell(runs > 0 ? (sixes * 6) / runs : null, n);
    }
    case "extras":
      return cell(avg(allInnings.map((i) => i.extras)), n);
    case "wides":
      return cell(null, n, "Wides column not in current extract");
    case "ducks":
      return cell(allInnings.reduce((s, i) => s + i.ducks, 0) / n, n);
    case "runOuts":
      return cell(allInnings.reduce((s, i) => s + i.runOuts, 0) / n, n);
    case "samples":
      return cell(n, n);
    default:
      return cell(null, n);
  }
}

function filterMatches(
  data: FlatScorecardData,
  weight: WeightColumn,
  format: DataFormat,
  ctx: TableFilterContext,
  referenceYear: number
): MatchSlice[] {
  if (requiresFixtureSelection(weight, ctx)) return [];

  const weightCtx = contextForWeight(weight, ctx);

  return data.matches.filter((m) => {
    if (!matchesMaxOvers(m.maxOvers, format)) return false;
    if (!matchesContext(m, weightCtx)) return false;

    if (weight === "competition3yr" && m.year < yearCutoff3yr(referenceYear)) return false;
    return true;
  });
}

function staticPar(format: DataFormat, row: string): number | null {
  if (row === "matchMaxOver") {
    if (format === "t20") return 18.9;
    if (format === "odi") return 16.7;
    return 15.9;
  }
  if (row === "teamMaxOver") {
    if (format === "t20") return 17;
    if (format === "odi") return 15;
    return 13.3;
  }
  return null;
}

function computeTable2Row(
  rowKey: string,
  weight: WeightColumn,
  format: DataFormat,
  data: FlatScorecardData,
  ctx: TableFilterContext,
  referenceYear: number
): TableCell {
  if (rowKey === "matchMaxOver" || rowKey === "teamMaxOver") {
    if (weight !== "all") return cell(null, undefined, "Static par — All column only");
    return cell(staticPar(format, rowKey), undefined);
  }

  const firstInnings = firstInningsSamples(data, weight, format, ctx, referenceYear);
  const matches = filterMatches(data, weight, format, ctx, referenceYear);
  const n = firstInnings.length;
  const matchN = matches.length;

  if (rowKey === "fifty1st") {
    const hits = firstInnings.filter((inn) =>
      data.players.some(
        (p) => p.matchId === inn.matchId && p.innings === 1 && p.runs >= 50
      )
    ).length;
    return cell(n > 0 ? hits / n : null, n);
  }
  if (rowKey === "fiftyMatch") {
    const hits = matches.filter((m) => m.hasFiftyMatch).length;
    return cell(matchN > 0 ? hits / matchN : null, matchN);
  }
  if (rowKey === "hundred1st") {
    const hits = firstInnings.filter((inn) =>
      data.players.some(
        (p) => p.matchId === inn.matchId && p.innings === 1 && p.runs >= 100
      )
    ).length;
    return cell(n > 0 ? hits / n : null, n);
  }
  if (rowKey === "hundredMatch") {
    const hits = matches.filter((m) => m.hasHundredMatch).length;
    return cell(matchN > 0 ? hits / matchN : null, matchN);
  }
  if (rowKey === "highScore") {
    const scores = matches.map((m) => m.maxPlayerRuns).filter((r) => r > 0);
    return cell(median(scores), scores.length);
  }
  if (rowKey === "rabbit") {
    const rabbits = data.players.filter(
      (p) =>
        p.innings === 1 &&
        p.order === 11 &&
        matches.some((m) => m.matchId === p.matchId)
    );
    return cell(avg(rabbits.map((p) => p.runs)), rabbits.length);
  }

  return cell(null);
}

const TABLE1_ROWS: Array<{ key: string; label: string }> = [
  { key: "1stInns", label: "1st Inns (avg runs)" },
  { key: "wickets", label: "Wickets" },
  { key: "fours", label: "Fours" },
  { key: "sixes", label: "Sixes" },
  { key: "t5avg", label: "T5.Avg" },
  { key: "t5sr", label: "T5.SR" },
  { key: "prog1", label: "1st over" },
  { key: "prog2", label: "1st partnership" },
  { key: "prog3", label: "1st group overs" },
  { key: "foursProp", label: "Fours proportion" },
  { key: "sixesProp", label: "Sixes proportion" },
  { key: "extras", label: "Extras" },
  { key: "wides", label: "Wides" },
  { key: "ducks", label: "Ducks" },
  { key: "runOuts", label: "Run outs" },
  { key: "samples", label: "Samples" },
];

const TABLE2_ROWS: Array<{ key: string; label: string }> = [
  { key: "matchMaxOver", label: "Match Max Over" },
  { key: "teamMaxOver", label: "Team Max Over" },
  { key: "fifty1st", label: "Fifty in 1st innings" },
  { key: "fiftyMatch", label: "Fifty in Match" },
  { key: "hundred1st", label: "Hundred in 1st innings" },
  { key: "hundredMatch", label: "Hundred in Match" },
  { key: "highScore", label: "Highest individual score" },
  { key: "rabbit", label: "Rabbit runs" },
];

export function computeTable1(
  data: FlatScorecardData,
  format: DataFormat,
  ctx: TableFilterContext = {},
  referenceYear = new Date().getFullYear()
): ModelTable {
  const rows = TABLE1_ROWS.map(({ key }) => {
    const row = {} as Record<WeightColumn, TableCell>;
    for (const weight of TABLE1_WEIGHTS) {
      const samples = firstInningsSamples(data, weight, format, ctx, referenceYear);
      const matchIds = new Set(samples.map((s) => s.matchId));
      const allInnings = filterInnings(data, weight, format, ctx, referenceYear);
      row[weight] = computeTable1Row(
        key,
        samples,
        allInnings,
        data.players,
        matchIds
      );
    }
    return row;
  });

  return {
    id: "table-1",
    name: "Table 1 — Per-innings historical blends",
    rowLabels: TABLE1_ROWS.map((r) => r.label),
    weightColumns: TABLE1_WEIGHTS,
    weightLabels: TABLE1_WEIGHTS.map((w) => WEIGHT_LABELS[w]),
    rows,
    referenceContext: ctx,
  };
}

export function computeTable2(
  data: FlatScorecardData,
  format: DataFormat,
  ctx: TableFilterContext = {},
  referenceYear = new Date().getFullYear()
): ModelTable {
  const rows = TABLE2_ROWS.map(({ key }) => {
    const row = {} as Record<WeightColumn, TableCell>;
    for (const weight of TABLE2_WEIGHTS) {
      row[weight] = computeTable2Row(key, weight, format, data, ctx, referenceYear);
    }
    return row;
  });

  return {
    id: "table-2",
    name: "Table 2 — Match-level model stats",
    rowLabels: TABLE2_ROWS.map((r) => r.label),
    weightColumns: TABLE2_WEIGHTS,
    weightLabels: TABLE2_WEIGHTS.map((w) => WEIGHT_LABELS[w]),
    rows,
    referenceContext: ctx,
  };
}

export function listFilterOptions(data: FlatScorecardData) {
  const venues = new Set<string>();
  const hosts = new Set<string>();
  const tournaments = new Set<string>();
  const teams = new Set<string>();

  for (const m of data.matches) {
    if (m.venue) venues.add(m.venue);
    if (m.host) hosts.add(m.host);
    if (m.tournament) tournaments.add(m.tournament);
    m.teams.forEach((t) => teams.add(t));
  }

  return {
    venues: Array.from(venues).sort(),
    hosts: Array.from(hosts).sort(),
    tournaments: Array.from(tournaments).sort(),
    teams: Array.from(teams).sort(),
  };
}
