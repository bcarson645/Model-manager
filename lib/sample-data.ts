import type {
  ComparisonFixture,
  ModelDefinition,
  RegistrySummary,
  VariableDefinition,
} from "./types";
import { nzSaMatchMarket, nzSaPrepInputs, nzSaWorkbook } from "./workbooks/nz-sa-63406779";

const workbookRef = nzSaWorkbook.filename;


export const models: ModelDefinition[] = [
  {
    id: "pm-match-winner",
    name: "Match Betting (2-way)",
    description:
      "Pre-match win probabilities via MatchBetting race distribution. Primary Excel output on Prep Work.",
    market: "Match Market",
    marketCode: "2WMW",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "Prep Work", cell: "C10", description: "Home win probability" },
      { sheet: "Prep Work", cell: "D10", description: "Home decimal price" },
      { sheet: "Prep Work", cell: "C11", description: "Away win probability" },
      { sheet: "Prep Work", cell: "D11", description: "Away decimal price" },
      { sheet: "PM Publication", cell: "G20:G21", description: "Published 2-way match betting" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!C10:D11" },
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.MatchBetting",
      },
    },
    status: "parity_check",
  },
  {
    id: "pm-first-dismissal",
    name: "Method of First Dismissal",
    description: "Blends opener profiles with team bowling dismissal rates.",
    market: "Dismissal",
    marketCode: "01MOPD",
    phase: "pre_match",
    sources: {
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.FirstDismissal",
      },
    },
    status: "migrating",
  },
  {
    id: "pm-first-partnership",
    name: "Runs in First Partnership",
    description: "Under/over line from opener expected runs and trader adjust.",
    market: "Partnership",
    marketCode: "01FONW",
    phase: "pre_match",
    sources: {
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.FirstPartnership",
      },
    },
    status: "migrating",
  },
  {
    id: "pm-match-betting-3w",
    name: "Match Betting (3-way)",
    description: "Includes draw selection for Test cricket. Published from PM Publication.",
    market: "Match Market",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G14", description: "NZ probability" },
      { sheet: "PM Publication", cell: "G15", description: "SA probability" },
      { sheet: "PM Publication", cell: "G16", description: "Draw probability" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B14:H16" },
    },
    status: "migrating",
  },
  {
    id: "pm-tied-match",
    name: "Tied Match",
    description: "Pre-match tied match Yes/No — derived from match odds spread.",
    market: "Match Specials",
    marketCode: "64PINB",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G22", description: "Tied Yes probability" },
      { sheet: "PM Publication", cell: "G23", description: "Tied No probability" },
      { sheet: "PM Pricing", cell: "C4", description: "Also on PM Pricing tab" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B22:I23" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.TiedMatch" },
    },
    status: "parity_check",
  },
  {
    id: "pm-toss-win-double",
    name: "Toss/Win Double",
    description: "Home, away, and no-winner legs from match odds and toss value.",
    market: "Match Market",
    marketCode: "TWD",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G26:G28", description: "Three outcomes" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B26:I28" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.TossWinDouble" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-runs",
    name: "Player Runs",
    description: "Per-player run lines — one PM Publication row per squad member.",
    market: "Player Market",
    marketCode: "BARU",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Player - Runs rows" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerRuns" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-fours",
    name: "Player Fours",
    description: "Per-player fours O/U — Poisson-gamma, line Round(expected/2).",
    market: "Player Market",
    marketCode: "BA4U",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F267:F276", description: "Lines per playing batter" },
      { sheet: "PM Publication", cell: "G267:G276", description: "Under probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication rows 267–276" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerFours" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-sixes",
    name: "Player Sixes",
    description: "Per-player sixes at line 0 — under 0.5 sixes probability.",
    market: "Player Market",
    marketCode: "BA6U",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G277:G286", description: "Under 0.5 sixes prob" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication rows 277–286" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerSixes" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-balls-faced",
    name: "Player Balls Faced",
    description: "Per-player balls faced O/U from expected runs and strike rate.",
    market: "Player Market",
    marketCode: "BABF",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F610:F619", description: "Balls faced lines" },
      { sheet: "PM Publication", cell: "G610:G619", description: "50/50 under/over" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication rows 610–619" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerBallsFaced" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-performance",
    name: "Player Performance",
    description: "Top 5 players per team — composite points line (runs, wickets, catches).",
    market: "Player Market",
    marketCode: "PERF",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F337:F346", description: "Performance lines" },
      { sheet: "PM Publication", cell: "G337:G346", description: "Under probabilities" },
      { sheet: "PM Publication", cell: "I337:I346", description: "Trader adjusts (purple)" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication rows 337–346" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerPerformance" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-top-batter",
    name: "Match Top Bat",
    description: "Race market across all batters for match top scorer.",
    market: "Head to Heads",
    marketCode: "PMTRSNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Match Top Bat." },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchTopBatter" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-top-bowler",
    name: "Match Top Bowler",
    description: "Race market across bowlers for match top wicket-taker.",
    market: "Head to Heads",
    marketCode: "PMTWTNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Match Top Bowler." },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchTopBowler" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-fours",
    name: "Match Fours",
    description: "Under/over on total match fours — Poisson-gamma line from team or match expectation.",
    market: "Match Market",
    marketCode: "51BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F52", description: "Fours line" },
      { sheet: "PM Publication", cell: "G52:H52", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B52:I52" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchFours" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-sixes",
    name: "Match Sixes",
    description: "Under/over on total match sixes — Poisson-gamma line from team or match expectation.",
    market: "Match Market",
    marketCode: "52BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F53", description: "Sixes line" },
      { sheet: "PM Publication", cell: "G53:H53", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B53:I53" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchSixes" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-run-outs",
    name: "Match Run Outs",
    description: "Under/over on total match run outs — Poisson line, adjust ÷10.",
    market: "Match Market",
    marketCode: "53BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F54", description: "Run outs line" },
      { sheet: "PM Publication", cell: "G54:H54", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B54:I54" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchRunOuts" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-max-over",
    name: "Max Runs Scored in an Over",
    description: "Under/over on the highest scoring over in the match.",
    market: "Match Market",
    marketCode: "54BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F55", description: "Max over runs line" },
      { sheet: "PM Publication", cell: "G55:H55", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B55:I55" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchMaxOver" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-ducks",
    name: "Match Ducks",
    description: "Under/over on total match ducks — Poisson-gamma, adjust ÷10.",
    market: "Match Market",
    marketCode: "55BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F56", description: "Ducks line" },
      { sheet: "PM Publication", cell: "G56:H56", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B56:I56" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchDucks" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-wides",
    name: "Match Wides",
    description: "Under/over on total match wides — Poisson-gamma with format variance lookup.",
    market: "Match Market",
    marketCode: "56BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F57", description: "Wides line" },
      { sheet: "PM Publication", cell: "G57:H57", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B57:I57" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchWides" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-extras",
    name: "Match Extras",
    description: "Under/over on total match extras — Poisson-gamma, total rounded to 2dp.",
    market: "Match Market",
    marketCode: "57BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F58", description: "Extras line" },
      { sheet: "PM Publication", cell: "G58:H58", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B58:I58" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchExtras" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-wickets",
    name: "Match Wickets",
    description: "Under/over on total match wickets — custom variance formula, not lookup table.",
    market: "Match Market",
    marketCode: "58BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F59", description: "Wickets line" },
      { sheet: "PM Publication", cell: "G59:H59", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B59:I59" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchWickets" },
    },
    status: "migrating",
  },
  {
    id: "pm-toss-winner",
    name: "Toss Winner",
    description: "50/50 toss winner — fixed equal probabilities in Lambda.",
    market: "Match Market",
    marketCode: "54PINB",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G24:G25", description: "Home / away toss probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B24:I25" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.TossWinner" },
    },
    status: "migrating",
  },
  {
    id: "pm-fifty-first-innings",
    name: "Fifty in First Innings",
    description: "Yes/No milestone — fifty scored in first innings.",
    market: "Match Market",
    marketCode: "61BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G67:G68", description: "Yes / no probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B67:I68; Prep Work!Z5" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.FiftyInnings" },
    },
    status: "migrating",
  },
  {
    id: "pm-hundred-first-innings",
    name: "Hundred in First Innings",
    description: "Yes/No milestone — hundred scored in first innings.",
    market: "Match Market",
    marketCode: "HUNDIN",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G71:G72", description: "Yes / no probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B71:I72; Prep Work!Z7" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.HundredInnings" },
    },
    status: "migrating",
  },
  {
    id: "pm-hundred-match",
    name: "Hundred in Match",
    description: "Yes/No milestone — hundred scored anywhere in the match.",
    market: "Match Market",
    marketCode: "62BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G73:G74", description: "Yes / no probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B73:I74; Prep Work!Z8" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.HundredMatch" },
    },
    status: "migrating",
  },
  {
    id: "pm-rabbit-runs",
    name: "Rabbit Runs",
    description: "Under/over on tailender runs — adjust subtracts from underProb.",
    market: "Match Market",
    marketCode: "64BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F76", description: "Rabbit runs line" },
      { sheet: "PM Publication", cell: "G76:H76", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B76:I76; Prep Work!Y10" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.RabbitRuns" },
    },
    status: "migrating",
  },
  {
    id: "pm-highest-individual-score",
    name: "Highest Individual Score",
    description: "Under/over line for the highest individual score in the match.",
    market: "Match Market",
    marketCode: "63BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "F75", description: "Run line" },
      { sheet: "PM Publication", cell: "G75:H75", description: "Under / over probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B75:I75" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.HighestIndividualScore" },
    },
    status: "migrating",
  },
  {
    id: "pm-first-over",
    name: "First Over Runs",
    description: "Expected runs and over/under lines for the first over of each innings.",
    market: "Innings Segment",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Pricing", cell: "C14:D14", description: "First over 4.5 line" },
      { sheet: "PM Pricing", cell: "C15:D15", description: "First over 5.5 line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Pricing!A7:D15" },
    },
    status: "migrating",
  },
  {
    id: "pm-totals",
    name: "Pre-match Totals / Groups",
    description: "Session and innings total markets published pre-match.",
    market: "Totals",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "H8", description: "Market count reference" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Pre Match Totals/Groups" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-of-top-bat",
    name: "Team of Top Bat",
    description:
      "Two-way head-to-head: which team provides the match top batter. Spawned from MatchBetting.",
    market: "Match Market",
    marketCode: "59BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G60:G61", description: "Home / away probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B60:I61" },
      lambda: { version: "main", location: "PreMatch.Models.HeadToHeads.TeamOfTopBat" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-of-top-bowl",
    name: "Team of Top Bowl",
    description:
      "Two-way head-to-head: which team provides the match top bowler. Format-dependent blend from match odds.",
    market: "Match Market",
    marketCode: "510BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G62:G63", description: "Home / away probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B62:I63" },
      lambda: { version: "main", location: "PreMatch.Models.HeadToHeads.TeamOfTopBowl" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-top-batter",
    name: "Team Top Bat",
    description: "Per-team top batter race — home and away markets.",
    market: "Team Market",
    marketCode: "TBNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — {Team} - Top Bat" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamTopBatter" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-top-bowler",
    name: "Team Top Bowl",
    description: "Per-team top bowler race — home and away markets.",
    market: "Team Market",
    marketCode: "BBNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — {Team} - Top Bowl" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamTopBowler" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-fours",
    name: "Team Fours",
    description: "Three O/U lines per team on total fours — GetTeamFours() + innings adjust.",
    market: "Team Market",
    marketCode: "54PIN / 64PIN",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 155-157 / SA 221-223", description: "Three fours lines per team" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!O36/O57; PM Publication team fours rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamFours" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-sixes",
    name: "Team Sixes",
    description: "Three O/U lines per team on total sixes — GetTeamSixes(), middle ±1.",
    market: "Team Market",
    marketCode: "56PIN / 66PIN",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 158-160 / SA 224-226", description: "Three sixes lines per team" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!P36/P57; PM Publication team sixes rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamSixes" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-wickets",
    name: "Team Wickets Lost",
    description: "Wickets lost per batting team — raw bowling wickets / adjust + run outs.",
    market: "Team Market",
    marketCode: "5WILO / 6WILO",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 166 / SA 232", description: "Wickets lost line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication team wickets rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamWickets" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-wides",
    name: "Team Wides Faced",
    description: "Innings wides faced per team — InningsWides + WidesBowled adjust.",
    market: "Team Market",
    marketCode: "5INRUB / 6INRUB",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 163 / SA 229", description: "Wides faced line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!W38/W59; PM Publication wides rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamWides" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-ducks",
    name: "Team Innings Ducks",
    description: "Innings ducks per team — InningsDucks + adjust÷10; skipped if zero.",
    market: "Team Market",
    marketCode: "54PIN / 64PIN",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 164 / SA 230", description: "Innings ducks line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!O16; PM Publication ducks rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamDucks" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-extras",
    name: "Team Innings Extras",
    description: "Innings extras per team — ExtrasPrediction + InningsExtras adjust.",
    market: "Team Market",
    marketCode: "54PINA / 64PINA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 165 / SA 231", description: "Innings extras line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!M35/M56; PM Publication extras rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamExtras" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-run-outs",
    name: "Team Innings Run Outs",
    description: "Innings run outs — Poisson P(0); line 0.5; adjust÷10.",
    market: "Team Market",
    marketCode: "5INRU / 6INRU",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 161 / SA 227", description: "Run outs line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!U36/U57; PM Publication run outs rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamRunOuts" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-max-over",
    name: "Team Max Runs in an Over",
    description: "Per-team max over runs O/U — InningsMaxOver + innings adjust, Poisson.",
    market: "Team Market",
    marketCode: "5INRUA / 6INRUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 162 / SA 228", description: "Max over runs line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!T4; PM Publication max over rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamMaxOver" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-first-partnership",
    name: "Runs at Fall of 1st Wicket",
    description: "Per-team first-wicket partnership line — openers × format multipliers + adjusts.",
    market: "Team Market",
    marketCode: "11FONW / 21FONW",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 147 / SA 213", description: "Fall of 1st wicket line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication team FOW rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamFirstPartnership" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-first-dismissal",
    name: "1st Wicket Method of Dismissal (per team)",
    description:
      "Per-team first dismissal method — 2 openers vs opposition bowling rates, each ÷2. Mirror of match FirstDismissal without PM adjusts.",
    market: "Team Market",
    marketCode: "11MOPD / 21MOPD",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "NZ 148-154 / SA 214-220", description: "7 dismissal method probabilities per team" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!AD3:AM18; PM Publication team dismissal rows" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamFirstDismissal" },
    },
    status: "migrating",
  },
  {
    id: "live-match-winner",
    name: "Match Winner (in-play)",
    description: "Win probability updated ball-by-ball during the match.",
    market: "Match Market",
    phase: "in_play",
    excelOutputs: [
      { sheet: "Pricing", cell: "TBD", description: "In-play match odds — to map" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Pricing / UI" },
    },
    status: "migrating",
  },
  {
    id: "live-delivery-markets",
    name: "Delivery / Over Markets",
    description: "Boundary, wicket, odd/even and exact delivery markets per ball.",
    market: "Ball-by-ball",
    phase: "in_play",
    excelOutputs: [
      { sheet: "UI", cell: "D5", description: "Boundary probability" },
      { sheet: "UI", cell: "D6", description: "Wicket probability" },
      { sheet: "UI", cell: "D12:D17", description: "Exact delivery prices" },
    ],
    sources: {
      excel: { version: workbookRef, location: "UI!B4:D17" },
    },
    status: "migrating",
  },
  {
    id: "live-tied-match",
    name: "Tied Match (in-play)",
    description: "In-play tied match probability from current match state.",
    market: "Match Specials",
    phase: "in_play",
    excelOutputs: [{ sheet: "UI", cell: "D8", description: "Tied match probability" }],
    sources: {
      excel: { version: workbookRef, location: "UI!B8:D8" },
    },
    status: "migrating",
  },
];

export const variables: VariableDefinition[] = [
  ...nzSaPrepInputs.map((input) => {
    const lambdaNotes: Record<string, string> = {
      conditions: "MatchEvaluation.ConditionAdjustment",
      "batting-rating-nz": "TeamEvaluation.BattingRating (home)",
      "batting-rating-sa": "TeamEvaluation.BattingRating (away)",
      "bowling-rating-sa": "TeamEvaluation.BowlingRating (vs home)",
      "bowling-rating-nz": "TeamEvaluation.BowlingRating (vs away)",
            "total-factor-nz": "D4 × D5 × D3 → Prep Work!D6",
            "total-factor-sa": "I4 × I5 × D3 → Prep Work!I6",
            "expected-runs-nz": "TeamEvaluation.GetRunsExpected() when NZ bats → E6 = D6 × BT3",
            "expected-runs-sa": "TeamEvaluation.GetRunsExpected() when SA bats → J6 = I6 × BT3",
            "par-score": "Format par — BT3=165 (T20); Lambda T20Standard=163",
      "team1-fours": "SUM(Prep Work!O24:O34) → O36 → GetTeamFours() home",
      "team2-fours": "SUM(Prep Work!O45:O55) → O57 → GetTeamFours() away",
      "match-fours-total": "O36+O57 before PM Publication!I52 adjust",
      "team1-sixes": "SUM(Prep Work!P24:P34) → P36 → GetTeamSixes() home",
      "team2-sixes": "SUM(Prep Work!P45:P55) → P57 → GetTeamSixes() away",
      "match-sixes-total": "P36+P57 before PM Publication!I53 adjust",
      "match-extras-total": "M35+M56 ExtrasPrediction → MatchExtras",
      "match-wickets-total": "U38+U59 team wickets → MatchWickets",
      "match-wides-total": "W38+W59 team wides → MatchWides",
      "match-run-outs-total": "U36+U57 team run outs → MatchRunOuts",
      "rabbit-runs-expectation": "MatchEvaluation.RabbitRuns ← Prep Work!Y10",
      "match-max-over-expectation": "MatchEvaluation.MatchMaxOver ← Prep Work!Z3",
      "match-ducks-total": "2 × Prep Work!O16 → InningsDucks sum",
    };

    const modelIds: Record<string, string[]> = {
      conditions: ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "batting-rating-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "batting-rating-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "bowling-rating-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "bowling-rating-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "total-factor-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "total-factor-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "expected-runs-nz": ["pm-match-top-batter", "pm-team-top-batter"],
      "expected-runs-sa": ["pm-match-top-batter", "pm-team-top-batter"],
      "par-score": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "team1-fours": ["pm-match-fours", "pm-team-fours"],
      "team2-fours": ["pm-match-fours", "pm-team-fours"],
      "match-fours-total": ["pm-match-fours"],
      "team1-sixes": ["pm-match-sixes", "pm-team-sixes"],
      "team2-sixes": ["pm-match-sixes", "pm-team-sixes"],
      "match-sixes-total": ["pm-match-sixes"],
      "match-extras-total": ["pm-match-extras"],
      "match-wickets-total": ["pm-match-wickets"],
      "match-wides-total": ["pm-match-wides"],
      "match-run-outs-total": ["pm-match-run-outs"],
      "rabbit-runs-expectation": ["pm-rabbit-runs"],
      "match-max-over-expectation": ["pm-match-max-over"],
      "match-ducks-total": ["pm-match-ducks"],
    };

    return {
      id: input.id,
      name: input.id.replace(/-/g, "_"),
      label: input.label,
      description: `Prep Work input feeding pre-match models. Cell ${input.cell}.${"notes" in input && input.notes ? ` ${input.notes}` : ""}`,
      scope: input.scope,
      dataType: "number" as const,
      modelIds: modelIds[input.id] ?? ["pm-match-winner"],
      sources: {
        excel: {
          present: true,
          defaultValue: input.value,
          notes: input.namedRange
            ? `${input.cell} (named: ${input.namedRange})`
            : input.cell,
        },
        lambda: {
          present: !["total-factor-nz", "total-factor-sa"].includes(input.id),
          notes: lambdaNotes[input.id] ?? "Not yet mapped",
        },
      },
      parity:
        input.id === "par-score"
          ? ("unverified" as const)
          : ("unverified" as const),
    };
  }),
  {
    id: "match-betting-adjust",
    name: "match_betting_adjust",
    label: "Match betting adjust",
    description: "Trader skew on home win probability (percentage points ÷ 100).",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-winner"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I20 (purple)" },
      lambda: {
        present: true,
        defaultValue: 0,
        notes: "AdjustmentsPM.MatchAdjustments.MatchBetting",
      },
    },
    parity: "unverified",
  },
  {
    id: "first-partnership-adjust",
    name: "first_partnership_adjust",
    label: "First partnership adjust",
    description: "Trader adjust added directly to partnership run line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-first-partnership"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I44 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.FirstPartnership",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-fours-adjust",
    name: "match_fours_adjust",
    label: "Match fours adjust",
    description: "Trader adjust added to match fours total before Poisson-gamma line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-fours"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I52 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchFours",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-sixes-adjust",
    name: "match_sixes_adjust",
    label: "Match sixes adjust",
    description: "Trader adjust added to match sixes total before Poisson-gamma line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-sixes"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I53 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchSixes",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-run-outs-adjust",
    name: "match_run_outs_adjust",
    label: "Match run outs adjust",
    description: "Trader adjust divided by 10 before adding to run outs total.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-run-outs"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I54 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchRunOuts / 10.0",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-max-over-adjust",
    name: "max_runs_in_over_adjust",
    label: "Max runs in over adjust",
    description: "Trader adjust added to MatchMaxOver expectation.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-max-over"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I55 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MaxRunsInOver",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-ducks-adjust",
    name: "match_ducks_adjust",
    label: "Match ducks adjust",
    description: "Trader adjust divided by 10 before adding to ducks total.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-ducks"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I56 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchDucks / 10",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-wides-adjust",
    name: "match_wides_adjust",
    label: "Match wides adjust",
    description: "Trader adjust added to match wides total before Poisson-gamma line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-wides"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I57 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchWides",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-extras-adjust",
    name: "match_extras_adjust",
    label: "Match extras adjust",
    description: "Trader adjust added to match extras total before Poisson-gamma line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-extras"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I58 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchExtras",
      },
    },
    parity: "unverified",
  },
  {
    id: "match-wickets-adjust",
    name: "match_wickets_adjust",
    label: "Match wickets adjust",
    description: "Trader adjust added to match wickets total before Poisson-gamma line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-wickets"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I59 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.MatchWickets",
      },
    },
    parity: "unverified",
  },
  {
    id: "first-innings-fifty-adjust",
    name: "first_innings_fifty_adjust",
    label: "Fifty in first innings adjust",
    description: "Trader adjust added to yes probability as percentage points ÷ 100.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-fifty-first-innings"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I67 (purple)" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.FirstInningsFifty" },
    },
    parity: "unverified",
  },
  {
    id: "first-innings-hundred-adjust",
    name: "first_innings_hundred_adjust",
    label: "Hundred in first innings adjust",
    description: "Trader adjust added to yes probability as percentage points ÷ 100.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-hundred-first-innings"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I71 (purple)" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.FirstInningsHundred" },
    },
    parity: "unverified",
  },
  {
    id: "match-hundred-adjust",
    name: "match_hundred_adjust",
    label: "Hundred in match adjust",
    description: "Trader adjust added to yes probability as percentage points ÷ 100.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-hundred-match"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I73 (purple)" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.MatchHundred" },
    },
    parity: "unverified",
  },
  {
    id: "rabbit-runs-adjust",
    name: "rabbit_runs_adjust",
    label: "Rabbit runs adjust",
    description: "Trader adjust subtracted from under probability (÷100) — not added to mean.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-rabbit-runs"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I76 (purple)" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.RabbitRuns — underProb -= adjust/100" },
    },
    parity: "unverified",
  },
  {
    id: "highest-individual-score-adjust",
    name: "highest_individual_score_adjust",
    label: "Highest individual score adjust",
    description: "Trader adjust added directly to highest score run line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-highest-individual-score"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I75 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.HighestIndividualScore",
      },
    },
    parity: "unverified",
  },
  {
    id: "dismissal-adjusts",
    name: "dismissal_method_adjusts",
    label: "Dismissal method adjusts (×7)",
    description: "Trader adjusts for each first dismissal outcome type.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        defaultValue: 0,
        notes: "PM Publication!I45:I51 — one per selection (purple)",
      },
      lambda: {
        present: true,
        notes:
          "FielderCatch, Bowled, KeeperCatch, Lbw, RunOut, Stumped, Other",
      },
    },
    parity: "unverified",
  },
  {
    id: "dismissal-method-rates",
    name: "dismissal_method_rates",
    label: "Team dismissal method rates",
    description: "Bowling team method probabilities used in first dismissal model.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        notes: "Prep Work!AD3:AM18 — NZ bowling AD4:9, SA bowling AD12:17",
      },
      lambda: {
        present: true,
        notes: "TeamEvaluation.DismissalMethodEvaluation",
      },
    },
    parity: "unverified",
  },
  {
    id: "player-batting-rating",
    name: "player_batting_rating",
    label: "Player batting rating",
    description: "Per-player batting rating from Prep Work formulas; rolls up to team rating.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-match-winner", "pm-first-dismissal", "pm-first-partnership"],
    sources: {
      excel: {
        present: true,
        defaultValue: 1.4902291091098339,
        notes: "Prep Work!Q24 formula — rolls to team D4 via (BT3+SUM(Q24:Q34))/BT3",
      },
      lambda: {
        present: true,
        notes: "PlayerEvaluation.BatsmanEvaluation → ExpectedRuns / averages",
      },
    },
    parity: "unverified",
  },
  {
    id: "player-bowling-rating",
    name: "player_bowling_rating",
    label: "Player bowling rating",
    description: "Per-player bowling rating from Prep Work formulas.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-match-winner", "pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        defaultValue: -0.936,
        notes: "Prep Work!Z24 formula — rolls to team D5/I5 via (BT3-SUM(Z24:Z34))/BT3",
      },
      lambda: {
        present: true,
        notes: "PlayerEvaluation bowling side → team BowlingRating",
      },
    },
    parity: "unverified",
  },
  {
    id: "tied-match-adjust",
    name: "tied_match_adjust",
    label: "Tied match adjust",
    description: "Trader adjust on tied match Yes probability.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-tied-match"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I22" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.TiedMatch" },
    },
    parity: "unverified",
  },
  {
    id: "toss-value",
    name: "toss_value",
    label: "Toss value",
    description: "Skews toss/win double probabilities.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-toss-win-double"],
    sources: {
      excel: { present: true, notes: "PM Publication!I26 (labelled Toss value)" },
      lambda: { present: true, notes: "MatchEvaluation.TossValue" },
    },
    parity: "unverified",
  },
  {
    id: "batsman-runs-adjust",
    name: "batsman_runs_adjust",
    label: "Batsman runs adjust (per player)",
    description: "Line adjust on each player runs market.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-player-runs"],
    sources: {
      excel: { present: true, notes: "PM Publication!I per player runs row" },
      lambda: { present: true, notes: "BatterAdjustmentsPM.BatsmanRuns" },
    },
    parity: "unverified",
  },
  {
    id: "toss-decision",
    name: "toss_decision",
    label: "Toss / decision",
    description: "Toss winner and bat/bowl decision — unset in this pre-match workbook.",
    scope: "parameter",
    dataType: "string",
    modelIds: ["pm-match-winner"],
    sources: {
      excel: { present: true, notes: "Match Info!B14:B15 — empty pre-match" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
  {
    id: "delivery-adjustment",
    name: "delivery_adjustment",
    label: "Delivery adjustment",
    description: "Trader skew on the current delivery market.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["live-delivery-markets"],
    sources: {
      excel: { present: true, notes: "UI!C11 Adj. column" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
  {
    id: "batter-in-for",
    name: "batter_in_for_adj",
    label: "Batter in-for adjustment",
    description: "Trader adjustment to batter reach-in-for lines.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["live-delivery-markets"],
    sources: {
      excel: { present: true, notes: "UI!E20 in-for column" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
];

export const comparisonFixtures: ComparisonFixture[] = [
  {
    id: nzSaWorkbook.id,
    match: `${nzSaWorkbook.homeTeam} vs ${nzSaWorkbook.awayTeam}`,
    format: nzSaWorkbook.format,
    venue: nzSaWorkbook.venue,
    phase: "pre_match",
    workbook: nzSaWorkbook.filename,
    comparedAt: new Date().toISOString(),
    inputs: Object.fromEntries(
      nzSaPrepInputs.map((i) => [i.id.replace(/-/g, "_"), i.value])
    ),
    outputs: nzSaMatchMarket.selections.flatMap((sel) => [
      {
        outputKey: `${sel.team.toLowerCase().replace(/\s+/g, "_")}_win_prob`,
        label: `${sel.team} win probability`,
        excelValue: sel.probability,
        lambdaValue: null,
        unit: "prob",
        tolerance: 0.005,
        excelRef: {
          sheet: "Prep Work",
          cell: sel.probabilityCell,
          description: "Probability column (C)",
        },
      },
      {
        outputKey: `${sel.team.toLowerCase().replace(/\s+/g, "_")}_price`,
        label: `${sel.team} decimal price`,
        excelValue: sel.price,
        lambdaValue: null,
        unit: "price",
        tolerance: 0.02,
        excelRef: {
          sheet: "Prep Work",
          cell: sel.priceCell,
          description: "Price column (D)",
        },
      },
    ]),
  },
];

export function getRegistrySummary(): RegistrySummary {
  const bothSources = models.filter(
    (m) => m.sources.excel && m.sources.lambda
  ).length;
  const excelOnly = models.filter(
    (m) => m.sources.excel && !m.sources.lambda
  ).length;
  const lambdaOnly = models.filter(
    (m) => m.sources.lambda && !m.sources.excel
  ).length;
  const preMatchModels = models.filter((m) => m.phase === "pre_match").length;
  const inPlayModels = models.filter((m) => m.phase === "in_play").length;

  const tradingInputsRequired = variables.filter(
    (v) => v.scope === "trading_input"
  ).length;
  const parityIssues = variables.filter((v) => v.parity !== "matched").length;

  const latest = comparisonFixtures[0];
  const outputMismatches = latest
    ? latest.outputs.filter((row) => {
        if (row.lambdaValue === null) return false;
        if (row.excelValue === null) return true;
        return Math.abs(row.excelValue - row.lambdaValue) > row.tolerance;
      }).length
    : 0;

  return {
    totalModels: models.length,
    preMatchModels,
    inPlayModels,
    excelOnly,
    lambdaOnly,
    bothSources,
    tradingInputsRequired,
    parityIssues,
    outputMismatches,
  };
}

export { nzSaWorkbook };
