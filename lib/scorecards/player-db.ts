import {
  categorizeDismissal,
  isBattingInnings,
  isNotOut,
  parseOvers,
  seasonFromDate,
} from "./stats-utils";
import type { ScorecardMatch } from "./types";

export type PlayerBattingInnings = {
  matchId: string;
  date: string | null;
  season: string;
  tournament: string;
  team: string;
  opponent: string | null;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string | null;
  notOut: boolean;
  teamWon: boolean;
};

export type PlayerBowlingInnings = {
  matchId: string;
  date: string | null;
  season: string;
  tournament: string;
  team: string;
  opponent: string | null;
  wickets: number;
  runs: number;
  overs: number;
  maidens: number;
  teamWon: boolean;
};

export type PlayerRecord = {
  playerId: string;
  name: string;
  battingInnings: PlayerBattingInnings[];
  bowlingInnings: PlayerBowlingInnings[];
  teams: string[];
  tournaments: string[];
};

export type PlayerDatabase = {
  players: PlayerRecord[];
  byId: Map<string, PlayerRecord>;
  byName: Map<string, PlayerRecord[]>;
};

function playerKey(id: number | string | null, name: string | null): string {
  if (id != null && String(id).trim()) return String(id);
  return `name:${name ?? "unknown"}`;
}

export function buildPlayerDatabase(matches: ScorecardMatch[]): PlayerDatabase {
  const byId = new Map<string, PlayerRecord>();

  for (const match of matches) {
    const season = seasonFromDate(match.date);
    const tournament = match.format ?? "Unknown";
    const teamWon = (team: string) => match.winner === team;

    for (const inn of match.innings) {
      for (const p of inn.players) {
        const key = playerKey(p.playerId, p.name);
        let record = byId.get(key);
        if (!record) {
          record = {
            playerId: key,
            name: p.name ?? "Unknown",
            battingInnings: [],
            bowlingInnings: [],
            teams: [],
            tournaments: [],
          };
          byId.set(key, record);
        }

        if (p.team && !record.teams.includes(p.team)) record.teams.push(p.team);
        if (!record.tournaments.includes(tournament)) {
          record.tournaments.push(tournament);
        }

        if (isBattingInnings(p.dismissal)) {
          record.battingInnings.push({
            matchId: match.id,
            date: match.date,
            season,
            tournament,
            team: p.team ?? inn.team,
            opponent: p.opponent ?? inn.opponent,
            runs: Number(p.batting.runs ?? 0),
            balls: Number(p.batting.balls ?? 0),
            fours: Number(p.batting.fours ?? 0),
            sixes: Number(p.batting.sixes ?? 0),
            dismissal: p.dismissal,
            notOut: isNotOut(p.dismissal),
            teamWon: teamWon(p.team ?? inn.team),
          });
        }

        const wickets = Number(p.bowling.wickets ?? 0);
        const overs = parseOvers(p.bowling.overs);
        if (wickets > 0 || overs > 0) {
          record.bowlingInnings.push({
            matchId: match.id,
            date: match.date,
            season,
            tournament,
            team: p.team ?? inn.team,
            opponent: p.opponent ?? inn.opponent,
            wickets,
            runs: Number(p.bowling.runs ?? 0),
            overs,
            maidens: Number(p.bowling.maidens ?? 0),
            teamWon: teamWon(p.team ?? inn.team),
          });
        }
      }
    }
  }

  const players = Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const byName = new Map<string, PlayerRecord[]>();
  for (const p of players) {
    const norm = p.name.toLowerCase();
    const list = byName.get(norm) ?? [];
    list.push(p);
    byName.set(norm, list);
  }

  return { players, byId, byName };
}

export function filterPlayerRecord(
  record: PlayerRecord,
  tournament: string | "all"
): Pick<PlayerRecord, "battingInnings" | "bowlingInnings"> {
  if (tournament === "all") {
    return {
      battingInnings: record.battingInnings,
      bowlingInnings: record.bowlingInnings,
    };
  }
  return {
    battingInnings: record.battingInnings.filter((i) => i.tournament === tournament),
    bowlingInnings: record.bowlingInnings.filter((i) => i.tournament === tournament),
  };
}

export type DismissalMixRow = {
  category: string;
  playerPct: number;
  datasetPct: number;
  vsAvgPp: number;
  vsPeersSigma: number;
  highlighted: boolean;
};

export function computeDismissalMix(
  playerInnings: PlayerBattingInnings[],
  datasetInnings: PlayerBattingInnings[]
): { rows: DismissalMixRow[]; playerDismissals: number; datasetDismissals: number } {
  const playerCounts = new Map<string, number>();
  const datasetCounts = new Map<string, number>();

  for (const inn of playerInnings) {
    if (inn.notOut) continue;
    const cat = categorizeDismissal(inn.dismissal);
    if (!cat) continue;
    playerCounts.set(cat, (playerCounts.get(cat) ?? 0) + 1);
  }

  for (const inn of datasetInnings) {
    if (inn.notOut) continue;
    const cat = categorizeDismissal(inn.dismissal);
    if (!cat) continue;
    datasetCounts.set(cat, (datasetCounts.get(cat) ?? 0) + 1);
  }

  const playerTotal = Array.from(playerCounts.values()).reduce((a, b) => a + b, 0);
  const datasetTotal = Array.from(datasetCounts.values()).reduce((a, b) => a + b, 0);

  const categories = [
    "Caught",
    "Bowled",
    "LBW",
    "Run out",
    "Stumped",
    "Other",
  ];

  const datasetPcts = categories.map((cat) =>
    datasetTotal > 0 ? ((datasetCounts.get(cat) ?? 0) / datasetTotal) * 100 : 0
  );
  const datasetMean = datasetPcts.reduce((a, b) => a + b, 0) / categories.length;
  const datasetVar =
    datasetPcts.reduce((s, p) => s + (p - datasetMean) ** 2, 0) / categories.length;
  const datasetSigma = Math.sqrt(datasetVar) || 1;

  const rows: DismissalMixRow[] = categories.map((cat, i) => {
    const playerPct =
      playerTotal > 0 ? ((playerCounts.get(cat) ?? 0) / playerTotal) * 100 : 0;
    const datasetPct = datasetPcts[i];
    const vsAvgPp = playerPct - datasetPct;
    const vsPeersSigma = (playerPct - datasetMean) / datasetSigma;
    const highlighted = Math.abs(vsPeersSigma) >= 1.5 || Math.abs(vsAvgPp) >= 6;
    return {
      category: cat,
      playerPct,
      datasetPct,
      vsAvgPp,
      vsPeersSigma,
      highlighted,
    };
  });

  return { rows, playerDismissals: playerTotal, datasetDismissals: datasetTotal };
}
