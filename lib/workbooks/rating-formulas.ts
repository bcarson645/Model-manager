/** Prep Work rating formulas — source of TeamEvaluation / PlayerEvaluation inputs */

export const ratingFormulas = {
  playerBattingRating: {
    cells: ["Q24:Q34"],
    exampleCell: "Q24",
    formula: `=IF(AND(ImpactActive=1,I24=12),0,IF(n_format_a="test",(L24-VLOOKUP(I24,$I$64:$N$74,4,0))*CD24,(AL66*(((L24/N24)/(VLOOKUP(I24,$I$64:$N$74,4,0)/VLOOKUP(I24,$I$64:$N$74,6,0)))-1)+((L24/N24)*(N24-VLOOKUP(I24,$I$64:$N$74,6,0))))*CD24))`,
    inputs: [
      { cell: "I24", name: "battingNumber", description: "Batting order slot" },
      { cell: "L24", name: "playerAverage", description: "Player batting average" },
      { cell: "N24", name: "strikeRateFactor", description: "Strike rate component" },
      { cell: "CD24", name: "formatMultiplier", description: "Format-specific multiplier" },
      { cell: "AL66", name: "limitedOversCoeff", description: "Non-test format coefficient" },
      { range: "I64:N74", name: "lookupTable", description: "Batting order lookup (VLOOKUP cols 4 & 6)" },
    ],
    lambdaTarget: "PlayerEvaluation.BatsmanEvaluation → BattingRating / ExpectedRuns",
  },
  playerBowlingRating: {
    cells: ["Z24:Z34", "Z45:Z55"],
    exampleCell: "Z24",
    formula: `=V24*(($W$63-W24)+$Y$63*(X24-$X$63))`,
    inputs: [
      { cell: "V24", name: "bowlerBase", description: "Bowler base multiplier" },
      { cell: "W24", name: "bowlerAverage", description: "Bowling average input" },
      { cell: "X24", name: "economyFactor", description: "Economy / strike component" },
      { cell: "W63", name: "standardAverage", description: "Format bowling average benchmark" },
      { cell: "Y63", name: "economyWeight", description: "Economy weighting constant" },
      { cell: "X63", name: "standardEconomy", description: "Format economy benchmark" },
    ],
    lambdaTarget: "PlayerEvaluation → BowlingRating",
  },
  teamBattingRating: {
    cells: ["D4", "I4"],
    formula: `=(BT3+SUM(Q24:Q34))/BT3`,
    team1Cell: "D4",
    team2Cell: "I4",
    notes: "D4 references Q35 in workbook — sum of home player batting ratings Q24:Q34",
    lambdaTarget: "TeamEvaluation.BattingRating",
  },
  teamBowlingRating: {
    cells: ["D5", "I5"],
    formula: `=(BT3-SUM(Z24:Z34))/BT3`,
    team1Cell: "D5",
    team2Cell: "I5",
    notes: "Sum of player bowling ratings Z24:Z34 (home XI) and Z45:Z55 (away XI)",
    lambdaTarget: "TeamEvaluation.BowlingRating",
  },
  formatStandard: {
    cell: "BT3",
    formula: `Par score — multiplied by total factor (D6/I6) for expected innings runs E6/J6`,
    exampleValue: "165 (NZ v SA T20 workbook); Lambda T20Standard=163",
    lambdaTarget: "MatchBetting format standards (T20Standard=163, ODI=270, Test=338, …)",
  },
  expectedInningsRuns: {
    cells: ["E6", "J6"],
    team1Cell: "E6",
    team2Cell: "J6",
    formula: `=D6*BT3 (team 1), =I6*BT3 (team 2)`,
    totalFactorCells: ["D6", "I6"],
    totalFactorFormula: `D4*D5*D3 (team 1), I4*I5*D3 (team 2)`,
    lambdaTarget: "TeamEvaluation.GetRunsExpected() / MatchBetting.GetInningsRuns",
  },
};
