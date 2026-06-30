import { categorizeDismissal, isBattingInnings, isNotOut } from "./stats-utils";
import type { ScorecardMatch } from "./types";

export type InningsSlice = {
  matchId: string;
  date: string | null;
  year: number;
  maxOvers: number | null;
  venue: string | null;
  host: string | null;
  venueId: string | number | null;
  hostId: string | number | null;
  competitionId: string | number | null;
  tournament: string | null;
  innings: number;
  team: string;
  opponent: string | null;
  total: number;
  wickets: number;
  extras: number;
  fours: number;
  sixes: number;
  wides: number;
  ducks: number;
  runOuts: number;
};

export type PlayerSlice = {
  matchId: string;
  date: string | null;
  year: number;
  maxOvers: number | null;
  venue: string | null;
  host: string | null;
  venueId: string | number | null;
  hostId: string | number | null;
  competitionId: string | number | null;
  tournament: string | null;
  innings: number;
  team: string;
  order: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string | null;
};

export type MatchSlice = {
  matchId: string;
  date: string | null;
  year: number;
  maxOvers: number | null;
  venue: string | null;
  host: string | null;
  venueId: string | number | null;
  hostId: string | number | null;
  competitionId: string | number | null;
  tournament: string | null;
  teams: string[];
  innings: InningsSlice[];
  maxPlayerRuns: number;
  hasFiftyFirstInnings: boolean;
  hasFiftyMatch: boolean;
  hasHundredFirstInnings: boolean;
  hasHundredMatch: boolean;
};

export type FlatScorecardData = {
  innings: InningsSlice[];
  players: PlayerSlice[];
  matches: MatchSlice[];
};

export function flattenScorecardData(matches: ScorecardMatch[]): FlatScorecardData {
  const innings: InningsSlice[] = [];
  const players: PlayerSlice[] = [];
  const matchSlices: MatchSlice[] = [];

  for (const match of matches) {
    const year = match.date ? parseInt(match.date.slice(0, 4), 10) : 0;
    const innSlices: InningsSlice[] = [];
    let maxPlayerRuns = 0;
    let hasFiftyMatch = false;
    let hasHundredMatch = false;
    let hasFiftyFirstInnings = false;
    let hasHundredFirstInnings = false;

    for (const inn of match.innings) {
      let fours = 0;
      let sixes = 0;
      let wides = 0;
      let ducks = 0;
      let runOuts = 0;

      for (const p of inn.players) {
        const runs = Number(p.batting.runs ?? 0);
        const balls = Number(p.batting.balls ?? 0);
        maxPlayerRuns = Math.max(maxPlayerRuns, runs);
        if (runs >= 50) hasFiftyMatch = true;
        if (runs >= 100) hasHundredMatch = true;
        if (inn.innings === 1 && runs >= 50) hasFiftyFirstInnings = true;
        if (inn.innings === 1 && runs >= 100) hasHundredFirstInnings = true;

        fours += Number(p.batting.fours ?? 0);
        sixes += Number(p.batting.sixes ?? 0);

        if (isBattingInnings(p.dismissal)) {
          players.push({
            matchId: match.id,
            date: match.date,
            year,
            maxOvers: match.maxOvers,
            venue: match.venue,
            host: match.host,
            venueId: match.venueId,
            hostId: match.hostId,
            competitionId: match.competitionId,
            tournament: match.format,
            innings: inn.innings,
            team: p.team ?? inn.team,
            order: Number(p.battingOrder ?? 0),
            runs,
            balls,
            fours: Number(p.batting.fours ?? 0),
            sixes: Number(p.batting.sixes ?? 0),
            dismissal: p.dismissal,
          });

          if (runs === 0 && !isNotOut(p.dismissal)) ducks++;
          const cat = categorizeDismissal(p.dismissal);
          if (cat === "Run out") runOuts++;
        }
      }

      innSlices.push({
        matchId: match.id,
        date: match.date,
        year,
        maxOvers: match.maxOvers,
        venue: match.venue,
        host: match.host,
        venueId: match.venueId,
        hostId: match.hostId,
        competitionId: match.competitionId,
        tournament: match.format,
        innings: inn.innings,
        team: inn.team,
        opponent: inn.opponent,
        total: Number(inn.total ?? 0),
        wickets: Number(inn.wickets ?? 0),
        extras: Number(inn.extras ?? 0),
        fours,
        sixes,
        wides,
        ducks,
        runOuts,
      });
      innings.push(innSlices[innSlices.length - 1]);
    }

    matchSlices.push({
      matchId: match.id,
      date: match.date,
      year,
      maxOvers: match.maxOvers,
      venue: match.venue,
      host: match.host,
      venueId: match.venueId,
      hostId: match.hostId,
      competitionId: match.competitionId,
      tournament: match.format,
      teams: match.innings.map((i) => i.team),
      innings: innSlices,
      maxPlayerRuns,
      hasFiftyFirstInnings,
      hasFiftyMatch,
      hasHundredFirstInnings,
      hasHundredMatch,
    });
  }

  return { innings, players, matches: matchSlices };
}
