/**
 * Excel cell conventions for cricket pricing workbooks.
 * Purple cells = trader adjusts. Pre-match adjusts: PM Publication column I.
 * Live adjusts: Scoring and UI tabs (purple cells).
 */

export const excelConventions = {
  preMatchAdjustColumn: "I",
  preMatchAdjustSheet: "PM Publication",
  liveAdjustSheets: ["Scoring", "UI"],
  adjustCellNote: "Purple formatted cells — one adjust per published selection row",
};

export const prepWorkMappings = {
  conditions: { cell: "D3", feeds: "MatchEvaluation.ConditionAdjustment" },
  teamBattingRatings: {
    cells: ["D4", "I4"],
    labels: ["Team 1 batting", "Team 2 batting"],
    feeds: "TeamEvaluation.BattingRating",
    derivedFrom: "Player batting ratings (e.g. Q24 formula) rolled up to team",
  },
  teamBowlingRatings: {
    cells: ["D5", "I5"],
    feeds: "TeamEvaluation.BowlingRating",
    derivedFrom: "Player bowling ratings (e.g. Z24 formula) rolled up to team",
  },
  totalFactor: {
    cells: ["D6", "I6"],
    labels: ["Team 1 total factor", "Team 2 total factor"],
    formula: "battingRating × oppositionBowlingRating × conditions (D3)",
    feeds: "Intermediate for expected innings runs",
  },
  expectedInningsRuns: {
    cells: ["E6", "J6"],
    labels: ["Team 1 expected runs", "Team 2 expected runs"],
    formula: "totalFactor × parScore (BT3)",
    feeds: "TeamEvaluation.GetRunsExpected() — used by TopBatterMethods.GetCap",
    lambdaEquivalent: "MatchBetting.GetInningsRuns: batRating × bowlRating × conditions × formatStandard",
  },
  parScore: {
    cell: "BT3",
    feeds: "Format baseline runs in Excel",
    notes:
      "NZ v SA fixture is T20 (BT3=165 ≈ Lambda T20Standard=163). Prep Work A1 may still show 'Test' — treat par score as authoritative.",
  },
  matchProbabilities: { cells: ["C10", "C11"], labels: ["Home win %", "Away win %"] },
  matchPrices: { cells: ["D10", "D11"], labels: ["Home price", "Away price"] },
  playerBattingRatingFormula: {
    exampleCell: "Q24",
    rowContext: "Row 24 = first home batter (DP Conway in NZ v SA fixture)",
    notes: "Formula combines prep inputs into per-player batting rating",
  },
  playerBowlingRatingFormula: {
    exampleCell: "Z24",
    notes: "Formula combines prep inputs into per-player bowling rating",
  },
  dismissalMethodRates: {
    range: "AD3:AM18",
    structure: [
      "AD4:AD9 — NZ bowling method rates vs SA batting (Fielder…Stumped)",
      "AD12:AD17 — SA bowling method rates vs NZ batting",
      "Columns AF/AH — Host / Cmptn / All weightings",
    ],
    feeds: "TeamEvaluation.DismissalMethodEvaluation",
  },
  dismissalProbabilities: {
    range: "AO4:AQ10",
    rows: {
      4: "Fielder Catch",
      5: "Bowled",
      6: "Keeper Catch",
      7: "LBW",
      8: "Run Out",
      9: "Stumped",
      10: "Samples (row 10 — not a probability)",
    },
    columns: { AO: "Host", AP: "Cmptn", AQ: "All" },
    notes: "Rows 4–9 are outcome probabilities; compare to PM Publication G45:G51",
  },
};

export const pmPublicationMappings = {
  probabilityColumn: "G",
  adjustColumn: "I",
  priceColumn: "J",
  markets: [
    {
      modelId: "pm-match-winner",
      rows: "20-21",
      market: "Match Betting (2-way)",
      adjustCells: ["I20", "I21"],
      probabilityCells: ["G20", "G21"],
      lambdaAdjust: "AdjustmentsPM.MatchAdjustments.MatchBetting",
      notes: "Lambda uses single home-team adjust; Excel may set I20 (home) only",
    },
    {
      modelId: "pm-first-partnership",
      rows: "44",
      market: "Runs in First Partnership",
      adjustCell: "I44",
      lineCell: "F44",
      lambdaAdjust: "AdjustmentsPM.MatchAdjustments.FirstPartnership",
    },
    {
      modelId: "pm-first-dismissal",
      rows: "45-51",
      market: "Method of First Dismissal",
      selections: [
        { row: 45, selection: "Fielder Catch", prob: "G45", adjust: "I45", lambda: "FielderCatch" },
        { row: 46, selection: "Bowled", prob: "G46", adjust: "I46", lambda: "Bowled" },
        { row: 47, selection: "Keeper Catch", prob: "G47", adjust: "I47", lambda: "KeeperCatch" },
        { row: 48, selection: "LBW", prob: "G48", adjust: "I48", lambda: "Lbw" },
        { row: 49, selection: "Run Out", prob: "G49", adjust: "I49", lambda: "RunOut" },
        { row: 50, selection: "Stumped", prob: "G50", adjust: "I50", lambda: "Stumped" },
        { row: 51, selection: "Other", prob: "G51", adjust: "I51", lambda: "Other" },
      ],
    },
  ],
};

/** NZ v SA fixture — extracted values for parity checks */
export const nzSaDismissalProbabilities = [
  { method: "Fielder Catch", prepWorkAQ: 0.5685923742034427, pmPublicationG: 0.5947912651135385, row: 45 },
  { method: "Bowled", prepWorkAQ: 0.17502855707448636, pmPublicationG: 0.1627772821952726, row: 46 },
  { method: "Keeper Catch", prepWorkAQ: 0.10276831751236151, pmPublicationG: 0.11247662817740745, row: 47 },
  { method: "LBW", prepWorkAQ: 0.06585314260028029, pmPublicationG: 0.05332098054426765, row: 48 },
  { method: "Run Out", prepWorkAQ: 0.0609589095428224, pmPublicationG: 0.05296730697292155, row: 49 },
  { method: "Stumped", prepWorkAQ: 0.02507998625029747, pmPublicationG: 0.021668208953639207, row: 50 },
  { method: "Other", prepWorkAQ: null, pmPublicationG: 0.0019983280429531065, row: 51 },
];

export const nzSaDismissalMethodRates = {
  nzBowlingVsSaBatting: {
    range: "AD4:AH9",
    methods: ["Fielder", "Bowled", "Keeper", "LBW", "Run Out", "Stumped"],
    hostValues: [0.699, 0.097, 0.133, 0.026, 0.029, 0.014],
  },
  saBowlingVsNzBatting: {
    range: "AD12:AH17",
    hostValues: [0.305, 0.395, 0.305, 0, -0.005, 0],
  },
};

export const nzSaPlayerRatingExamples = {
  batter: { player: "DP Conway", row: 24, battingRatingCell: "Q24", value: 1.4902291091098339 },
  bowler: { bowlingRatingCell: "Z24", value: -0.935999999999996, styleCell: "AA24", style: "seam" },
};
