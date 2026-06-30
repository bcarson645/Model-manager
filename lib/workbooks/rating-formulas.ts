/** Prep Work rating formulas — source of TeamEvaluation / PlayerEvaluation inputs */

import {
  battingPositionRefs,
  bowlingBenchmarksT20Men,
  calcBattingRating,
  calcBowlingRating,
  type BattingPositionRef,
  type BowlingBenchmarks,
} from "./batting-position-refs";

export {
  battingPositionRefs,
  bowlingBenchmarksT20Men,
  calcBattingRating,
  calcBowlingRating,
  compareUiBattingPositionRefs,
  type BattingPositionRef,
  type BowlingBenchmarks,
  type UiBattingPositionRef,
  type PositionRefMismatch,
} from "./batting-position-refs";

export const ratingFormulas = {
  playerBattingRating: {
    cells: ["Q24:Q34", "Q45:Q55"],
    exampleCell: "Q24",
    formula: `=IF(AND(ImpactActive=1,I24=12),0,IF(n_format_a="test",(L24-VLOOKUP(I24,$I$64:$N$74,4,0))*CD24,(AL66*(((L24/N24)/(VLOOKUP(I24,$I$64:$N$74,4,0)/VLOOKUP(I24,$I$64:$N$74,6,0)))-1)+((L24/N24)*(N24-VLOOKUP(I24,$I$64:$N$74,6,0))))*CD24))`,
    limitedOversExpanded: `(AL[row] × (((L/N) / (parAvg/parSR)) − 1) + (L/N)×(N − parSR)) × CD[row]`,
    perRowCoefficients:
      "Row 24 uses AL66+CD24, row 25 AL67+CD25, … row 34 AL76+CD34. NOT a single AL66/CD24 for all batters.",
    inputs: [
      { cell: "I24", name: "battingPosition", description: "Batting order 1–11 → VLOOKUP key" },
      { cell: "L24", name: "battingAverage", description: "BT CAZ — player batting average" },
      { cell: "N24", name: "strikeRateFactor", description: "SR — strike rate factor (sr.caz)" },
      {
        cell: "CD24:CD34",
        name: "cdMultiplier",
        description: "Position CD multiplier (0.95 → 0.05) — NOT CG63 alone",
      },
      {
        cell: "AL66:AL76",
        name: "alCoefficient",
        description: "Position AL coefficient — decays down the order",
      },
      {
        range: "I64:N74",
        name: "lookupTable",
        description: "Col 4 = par average (L), col 6 = par SR (N) per batting slot",
      },
    ],
    positionRefs: battingPositionRefs,
    lambdaTarget: "PlayerEvaluation.BatsmanEvaluation → BattingRating",
  },
  playerBowlingRating: {
    cells: ["Z24:Z34", "Z45:Z55"],
    exampleCell: "Z24",
    formula: `=V24*(($W$63-W24)+$Y$63*(X24-$X$63))`,
    expanded: `overs × ((parEconomy − economy) + economyWeight × (sr − parSR))`,
    perRowCoefficients:
      "Same formula every row — NO position AL/CD. Variation comes from V (overs), W (econ), X (sr) only.",
    inputs: [
      { cell: "V24", name: "overs", description: "Overs bowled — multiplier; Z=0 when V=0" },
      { cell: "W24", name: "economy", description: "Economy rate (header W23=econ) — NOT bowling average" },
      { cell: "X24", name: "strikeRate", description: "SR factor (header X23=sr)" },
      { cell: "W63", name: "parEconomy", description: "Format par economy (T20 men ≈ 8.05)" },
      { cell: "Y63", name: "economyWeight", description: "Weight on SR term (≈ 10.3)" },
      { cell: "X63", name: "parStrikeRate", description: "Par SR factor (≈ 0.305)" },
      { cell: "Y24", name: "bprop", description: "Seam/spin 1.03/0.97 — NOT used in Z formula" },
      { cell: "AA24", name: "style", description: "seam/spin label — NOT used in Z formula" },
    ],
    benchmarks: bowlingBenchmarksT20Men,
    lambdaTarget: "PlayerEvaluation → BowlingRating → (BT3−SUM(Z))/BT3 team factor",
  },
  teamBattingRating: {
    cells: ["D4", "I4"],
    formula: `=(BT3+SUM(Q24:Q34))/BT3`,
    team1Cell: "D4",
    team2Cell: "I4",
    notes: "Sum of home Q24:Q34 (away Q45:Q55) added to par BT3, then ÷ BT3",
    lambdaTarget: "TeamEvaluation.BattingRating",
  },
  teamBowlingRating: {
    cells: ["D5", "I5"],
    formula: `=(BT3-SUM(Z24:Z34))/BT3`,
    team1Cell: "D5",
    team2Cell: "I5",
    notes: "Sum of player Z ratings subtracted from BT3, then ÷ BT3",
    lambdaTarget: "TeamEvaluation.BowlingRating",
  },
  formatStandard: {
    cell: "BT3",
    formula: `Par score — E6/J6 = D6/I6 × BT3`,
    exampleValue: "165 (NZ v SA T20); Lambda MatchBetting T20Standard=163",
    lambdaTarget: "MatchBetting format standards",
  },
  expectedInningsRuns: {
    cells: ["E6", "J6"],
    team1Cell: "E6",
    team2Cell: "J6",
    formula: `=D6*BT3 (team 1), =I6*BT3 (team 2)`,
    totalFactorCells: ["D6", "I6"],
    totalFactorFormula:
      "Lambda: battingRating × oppositionBowlingRating × conditions. Excel D6 label uses D4×D5×D3 — verify pairing.",
    lambdaTarget: "MatchBetting.GetInningsRuns",
  },
  playerFours: {
    headers: "O23 Fours, P23 Sixes",
    formula: "(O21 × M × AO) / 4 per player; SUM → O36/O57",
    team1Cells: "O24:O34",
    team1Total: "O36",
    team2Cells: "O45:O55",
    team2Total: "O57",
    lambdaTarget: "TeamEvaluation.GetTeamFours()",
  },
  playerSixes: {
    formula: "(P21 × M × AR) / 6 per player; SUM → P36/P57",
    team1Cells: "P24:P34",
    team1Total: "P36",
    team2Cells: "P45:P55",
    team2Total: "P57",
    lambdaTarget: "TeamEvaluation.GetTeamSixes()",
  },
};

/** UI field name → Excel meaning (for Player Adjustment integration). */
export const uiBattingFieldMapping = {
  expectedRunsTotal: {
    excel: "parAverage",
    source: "VLOOKUP(position, Prep Work!I64:N74, column 4)",
    not: "Player expected runs or average+0.1",
  },
  expectedRunsPerBall: {
    excel: "parStrikeRate",
    source: "VLOOKUP(position, Prep Work!I64:N74, column 6)",
    not: "Runs per ball — it is the par SR factor (e.g. 1.33 not 1.3)",
  },
  globalExpectedRunsPerBall: {
    excel: "cdMultiplier",
    source: "CD24 + (position − 1) on Prep Work player row",
    not: "A global constant — decays 0.95 → 0.05 by batting position",
  },
  positionRating: {
    excel: "alCoefficient",
    source: "AL66 + (position − 1)",
    not: "Final player rating — it is the AL weight in the Q formula",
  },
} as const;
