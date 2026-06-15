/** Prep Work per-player and team fours/sixes — feeds GetTeamFours() / MatchFours */

export const prepPlayerFoursSixes = {
  headers: {
    fours: { cell: "O23", label: "Fours" },
    sixes: { cell: "P23", label: "Sixes" },
  },
  team1: {
    playerRows: "24:34",
    foursCells: "O24:O34",
    sixesCells: "P24:P34",
    foursTotal: "O36",
    sixesTotal: "P36",
    notes: "Home XI — one row per batter in batting order",
  },
  team2: {
    playerRows: "45:55",
    foursCells: "O45:O55",
    sixesCells: "P45:P55",
    foursTotal: "O57",
    sixesTotal: "P57",
    notes: "Away XI",
  },
  lambdaMapping: {
    playerFours: "Per-player expected fours (BatsmanEvaluation)",
    teamFours: "TeamEvaluation.GetTeamFours() = SUM(player fours in squad)",
    matchFoursLimited:
      "team1.GetTeamFours() + team2.GetTeamFours() before MatchFours adjust",
    matchFoursTest: "MatchEvaluation.MatchFours (Test/FC path)",
  },
  pmPublication: {
    matchFours: { row: 52, line: "F52", adjust: "I52", probs: "G52/H52" },
    matchSixes: { row: 53, line: "F53", adjust: "I53", probs: "G53/H53" },
    notes: "Purple adjust cells in column I beside each selection",
  },
};

/** NZ v SA fixture — extracted totals */
export const nzSaFoursSixes = {
  team1Fours: { cell: "Prep Work!O36", value: 14.616753501001249 },
  team1Sixes: { cell: "Prep Work!P36", value: 7.3211418505229515 },
  team2Fours: { cell: "Prep Work!O57", value: 12.28480629504142 },
  team2Sixes: { cell: "Prep Work!P57", value: 6.467800082764577 },
  matchFoursLimited: {
    cell: "O36+O57",
    value: 26.90155979604267,
    notes: "Sum of both team fours — MatchFours limited-overs input before I52 adjust",
  },
  matchSixesLimited: {
    cell: "P36+P57",
    value: 13.788941933287532,
    notes: "Sum for future MatchSixes model",
  },
};
