/**
 * Prep Work match derivative inputs — NZ v SA 63406779 (T20).
 * K2:P18 = per-innings historical blends (column O "All" is typical weight).
 * T2:Z17 = match-level model outputs (column Z "Model" where present).
 * Team innings totals: M35/M56 extras, U36/U57 run outs, U38/U59 wickets, W38/W59 wides.
 */

export const prepPerInningsHistorical = {
  sheet: "Prep Work",
  range: "K2:P18",
  weightColumns: {
    L: "Venue",
    M: "Host",
    N: "Cmptn",
    O: "All",
    P: "Last 5 Yrs",
  },
  rows: {
    wickets: { row: 4, label: "Wickets", all: 6.5910316925151715 },
    extras: { row: 14, label: "Extras", all: 8.233110401049332 },
    wides: { row: 15, label: "Wides", all: 4.777869189633895 },
    ducks: {
      row: 16,
      range: "K16:P16",
      label: "Ducks",
      venue: 0.7368421052631579,
      host: 0.6607629427792916,
      cmptn: 0.7324561403508771,
      all: 0.6574511126095752,
      last5Yrs: 0.7196586599241467,
      perInningsCell: "O16",
      matchTotalFormula: "2 × O16 (one innings ducks per team)",
      matchTotal: 1.3149022252191505,
      lambdaPath: "team1.InningsDucks + team2.InningsDucks",
      notes: "Each team's InningsDucks ≈ O16 blend; sum feeds MatchDucks limited-overs path",
    },
    runOuts: { row: 17, label: "Run Outs", all: 0.420515846257586 },
  },
  notes:
    "Per-innings venue/host/competition blends — feeds par rows (e.g. W39 pars wides = O15). Not always the limited-overs team-sum path.",
};

export const prepMatchLevelStats = {
  sheet: "Prep Work",
  range: "T2:Z17",
  weightColumns: {
    U: "Venue",
    V: "Host",
    W: "Cmptn",
    X: "3 Yr Cm",
    Y: "All",
    Z: "Model",
  },
  markets: {
    matchMaxOver: { row: 3, model: 20.278758788504465, all: 18.9, lambda: "MatchEvaluation.MatchMaxOver" },
    fiftyFirstInnings: { row: 5, model: 0.6505000234075533, all: 0.6294672960215779, lambda: "MatchEvaluation.FiftyInnings" },
    fiftyMatch: { row: 6, all: 0.8184423465947404, notes: "PM row 69–70 — no Lambda class in MilestoneMarkets paste" },
    hundredFirstInnings: { row: 7, model: 0.05823261239669307, all: 0.056473364801078896, lambda: "MatchEvaluation.HundredInnings" },
    hundredMatch: { row: 8, model: 0.08395925906747091, all: 0.08142279163857047, lambda: "MatchEvaluation.HundredMatch" },
    highestIndividualScore: { row: 9, model: 66.62888502865829, all: 66, lambda: "MatchEvaluation.MatchHighScore" },
    rabbitRuns: { row: 10, all: 0.965104517869184, lambda: "MatchEvaluation.RabbitRuns" },
    matchExtras: { row: 13, model: 40.03945069828541, all: 16.462744436952125, notes: "Z likely Test-scale; limited overs uses team ExtrasPrediction sum" },
    matchWides: { row: 14, model: 4.156455706157261, all: 9.098111935266353 },
    matchDucks: {
      row: 15,
      all: 1.3149022252191505,
      lambda: "MatchEvaluation.MatchDucks (Test/FC) or 2×O16 (limited)",
      derivedFrom: "Prep Work!K16:P16 → O16 per innings × 2 teams",
    },
    matchRunOuts: { row: 16, all: 0.841031692515172 },
    matchWickets: { row: 17, all: 12.750337154416723 },
  },
};

export const nzSaTeamInningsTotals = {
  home: {
    extras: { cell: "M35", value: 9.308642370401426, lambda: "team1.ExtrasPrediction" },
    runOuts: { cell: "U36", value: 0.33, lambda: "team1.InningsRunOuts" },
    wickets: { cell: "U38", value: 6.865033922301514, lambda: "team1.WicketsLost (via evaluation)" },
    wides: { cell: "W38", value: 5.6423295287441535, lambda: "team1.InningsWides" },
  },
  away: {
    extras: { cell: "M56", value: 9.203642370401425, lambda: "team2.ExtrasPrediction" },
    runOuts: { cell: "U57", value: 0.4, lambda: "team2.InningsRunOuts" },
    wickets: { cell: "U59", value: 6.570574269328193, lambda: "team2.WicketsLost (via evaluation)" },
    wides: { cell: "W59", value: 6.034419292513899, lambda: "team2.InningsWides" },
  },
  limitedOversMatchTotals: {
    extras: 18.51228474080285,
    runOuts: 0.73,
    wickets: 13.435608191629708,
    wides: 11.676748821258052,
  },
};

/** PM Publication lines vs Prep Work / Lambda expectations (I adjust = 0 on fixture) */
export const nzSaDerivativeParity = [
  {
    market: "Match Extras",
    pmRow: 58,
    pmLine: 18.5,
    prepTotal: 18.51,
    lambdaPath: "ExtrasPrediction sum → Round(total−0.8)+0.5",
    status: "aligned",
  },
  {
    market: "Match Wickets",
    pmRow: 59,
    pmLine: 13.5,
    prepTotal: 13.44,
    lambdaPath: "WicketsLost sum",
    status: "aligned",
  },
  {
    market: "Max Runs in Over",
    pmRow: 55,
    pmLine: 20.5,
    prepModel: 20.28,
    lambdaPath: "MatchMaxOver (T3!Z)",
    status: "aligned",
  },
  {
    market: "Fifty in First Innings",
    pmRow: 67,
    pmYes: 0.65,
    prepModel: 0.6505,
    lambdaPath: "FiftyInnings",
    status: "aligned",
  },
  {
    market: "Hundred in First Innings",
    pmRow: 71,
    pmYes: 0.058,
    prepModel: 0.0582,
    lambdaPath: "HundredInnings",
    status: "aligned",
  },
  {
    market: "Hundred in Match",
    pmRow: 73,
    pmYes: 0.084,
    prepModel: 0.084,
    lambdaPath: "HundredMatch",
    status: "aligned",
  },
  {
    market: "Match Ducks",
    pmRow: 56,
    pmLine: 1.5,
    prepPerInnings: "O16=0.657",
    prepMatchTotal: 1.31,
    lambdaPath: "InningsDucks sum = 2×O16 → Round(total−0.8)+0.5",
    status: "aligned",
    notes: "K16:P16 per-innings blend; O16 per team → match total 1.31 → line 1.5",
  },
  {
    market: "Match Wides",
    pmRow: 57,
    pmLine: 10.5,
    prepTeamSum: 11.68,
    prepAll: 9.1,
    status: "gap",
    notes: "Team W38+W59=11.68 → line 11.5; PM F57=10.5",
  },
  {
    market: "Match Run Outs",
    pmRow: 54,
    pmLine: 0.5,
    prepTeamSum: 0.73,
    prepAll: 0.84,
    status: "gap",
    notes: "U36+U57=0.73 → line 0.5; adjust÷10 in Lambda",
  },
  {
    market: "Rabbit Runs",
    pmRow: 76,
    pmLine: 0.5,
    prepAll: 0.965,
    status: "unverified",
    notes: "PM G76=#DIV/0! on fixture; Y10=0.965 → line 0.5 after Round(total−0.8)",
  },
];
