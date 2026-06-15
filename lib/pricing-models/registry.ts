import type { PricingModelDefinition } from "./types";
import { additionalPricingModels } from "./registry-ext";

const NS = "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches";
const FILE = "reference/pricing-models/PreMatch/Models/Matches";

export const pricingModels: PricingModelDefinition[] = [
  {
    id: "match-betting",
    registryModelId: "pm-match-winner",
    className: "MatchBetting",
    namespace: NS,
    filePath: `${FILE}/MatchBetting.cs`,
    phase: "pre_match",
    marketName: "Match Betting",
    marketCode: "2WMW",
    marketId: 340,
    legacyMarketId: 1,
    description:
      "Two-way match winner via race distribution on discretized innings run normals. Also spawns TeamOfTopBat and TeamOfTopBowler child markets.",
    childModels: ["TeamOfTopBat → TeamTopBatter", "TeamOfTopBowl → TeamTopBowler"],
    inputs: [
      {
        name: "ConditionAdjustment",
        label: "Conditions factor",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
      {
        name: "BattingRating",
        label: "Batting rating (per team)",
        scope: "parameter",
        csharpPath: "TeamEvaluation.BattingRating",
        excelRef: "Prep Work!D4 / I4",
      },
      {
        name: "BowlingRating",
        label: "Bowling rating (per team)",
        scope: "parameter",
        csharpPath: "TeamEvaluation.BowlingRating",
        excelRef: "Prep Work!D5 / I5",
      },
      {
        name: "Format",
        label: "Match format",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.Format",
        excelRef: "Prep Work!A1",
      },
      {
        name: "PlayerRatings",
        label: "Player batting / bowling ratings",
        scope: "parameter",
        csharpPath: "PlayerEvaluation → rolled up to TeamEvaluation",
        excelRef: "Prep Work!Q24 (bat), Z24 (bowl) — example formulas",
        notes: "Individual ratings feed team D4/I4/D5/I5 then match price",
      },
      {
        name: "IsHomeTeam",
        label: "Home team flag",
        scope: "parameter",
        csharpPath: "TeamEvaluation.IsHomeTeam",
        notes: "Determines home/away outcome assignment",
      },
      {
        name: "MatchBetting",
        label: "Match betting adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.MatchBetting",
        excelRef: "PM Publication!I20",
        notes: "Purple adjust cell — home 2-way row; applied as home prob skew (÷100)",
      },
    ],
    embeddedConstants: [
      { name: "T20Standard", value: "163", notes: "Format baseline innings runs" },
      { name: "ODIStandard", value: "270" },
      { name: "TestStandard", value: "338" },
      { name: "FirstClassStandard", value: "328" },
      { name: "T10Standard", value: "110" },
      {
        name: "GetInningsRunsVar",
        value: "1.4195 * balls^0.6809 - 0.0389 * mean",
        notes: "Variance formula coefficients",
      },
      {
        name: "BallsRemainingByFormat",
        value: "T20=120, ODI=300, Test/FC=1680, T10=60, Hundred=100",
      },
    ],
    outputs: [
      {
        name: "homeWinProbability",
        label: "Home win probability",
        type: "probability",
        csharpPath: "GetTeamTwoWayOutcomes → home outcome",
        excelRef: "Prep Work!C10",
      },
      {
        name: "awayWinProbability",
        label: "Away win probability",
        type: "probability",
        csharpPath: "GetTeamTwoWayOutcomes → away outcome",
        excelRef: "Prep Work!C11",
      },
      {
        name: "homeDecimalPrice",
        label: "Home decimal price",
        type: "price",
        excelRef: "Prep Work!D10",
        notes: "Derived from probability in Excel, not direct Lambda output",
      },
      {
        name: "awayDecimalPrice",
        label: "Away decimal price",
        type: "price",
        excelRef: "Prep Work!D11",
      },
    ],
    missingForParity: [
      "Exact formula chain Prep Work Q24 → team rating → C10",
      "Draw outcome — separate 3-way market in PM Publication G14:G16",
    ],
  },
  {
    id: "first-dismissal",
    registryModelId: "pm-first-dismissal",
    className: "FirstDismissal",
    namespace: NS,
    filePath: `${FILE}/FirstDismissal.cs`,
    phase: "pre_match",
    marketName: "Method of First Dismissal",
    marketCode: "01MOPD",
    marketId: 718,
    legacyMarketId: 25,
    description:
      "Blends opener dismissal profiles with team bowling method rates, then applies trader adjusts per dismissal type.",
    inputs: [
      {
        name: "DismissalMethodEvaluation",
        label: "Team dismissal method rates",
        scope: "parameter",
        csharpPath: "TeamEvaluation.DismissalMethodEvaluation.*",
        excelRef: "Prep Work!AD3:AM18",
        notes: "NZ bowling AD4:9, SA bowling AD12:17 — Host/Cmptn/All columns",
      },
      {
        name: "OpenerPlayerEvaluations",
        label: "Opening batter evaluations",
        scope: "parameter",
        csharpPath: "team.PlayerEvaluations[0..1]",
        notes: "Batting average & strike rate per opener",
      },
      {
        name: "BatterRunsLookup",
        label: "Batter runs lookup",
        scope: "embedded",
        csharpPath: "LookupProvider.GetBatterRunsLookup()",
      },
      {
        name: "StrikeRateLookup",
        label: "Strike rate lookup",
        scope: "embedded",
        csharpPath: "LookupProvider.GetStrikeRateLookup()",
      },
      {
        name: "FielderCatch",
        label: "Fielder catch adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.FielderCatch",
        excelRef: "PM Publication!I45",
      },
      {
        name: "Bowled",
        label: "Bowled adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.Bowled",
        excelRef: "PM Publication!I46",
      },
      {
        name: "KeeperCatch",
        label: "Keeper catch adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.KeeperCatch",
        excelRef: "PM Publication!I47",
      },
      {
        name: "Lbw",
        label: "LBW adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.Lbw",
        excelRef: "PM Publication!I48",
      },
      {
        name: "RunOut",
        label: "Run out adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.RunOut",
        excelRef: "PM Publication!I49",
      },
      {
        name: "Stumped",
        label: "Stumped adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.Stumped",
        excelRef: "PM Publication!I50",
      },
      {
        name: "Other",
        label: "Other adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.Other",
        excelRef: "PM Publication!I51",
      },
    ],
    embeddedConstants: [
      { name: "OpenerCount", value: "4", notes: "Both openers × both teams, each weighted ÷4" },
      { name: "BatAverageCoeff", value: "0.01", notes: "FielderCatch & Bowled adjust formulas" },
      { name: "StrikeRateCoeff", value: "0.1", notes: "FielderCatch & Stumped adjust formulas" },
      { name: "WomenFormatKey", value: "w{format}", notes: "T20/ODI women's lookup prefix" },
    ],
    outputs: [
      {
        name: "fielderCatch",
        label: "Fielder catch",
        type: "probability",
        excelRef: "Prep Work!AQ4 / PM Publication!G45",
      },
      {
        name: "bowled",
        label: "Bowled",
        type: "probability",
        excelRef: "Prep Work!AQ5 / PM Publication!G46",
      },
      {
        name: "keeperCatch",
        label: "Keeper catch",
        type: "probability",
        excelRef: "Prep Work!AQ6 / PM Publication!G47",
      },
      { name: "lbw", label: "LBW", type: "probability", excelRef: "Prep Work!AQ7 / PM Publication!G48" },
      {
        name: "runOut",
        label: "Run out",
        type: "probability",
        excelRef: "Prep Work!AQ8 / PM Publication!G49",
      },
      {
        name: "stumped",
        label: "Stumped",
        type: "probability",
        excelRef: "Prep Work!AQ9 / PM Publication!G50",
      },
      { name: "other", label: "Other", type: "probability", excelRef: "PM Publication!G51" },
    ],
    missingForParity: [
      "Map AD4:AH9 host values into DismissalMethodEvaluation fields",
      "Player opener ExpectedRuns / averages source cells in Prep Work",
      "Prep Work AO vs PM Publication G — small prob differences to reconcile",
    ],
  },
  {
    id: "first-partnership",
    registryModelId: "pm-first-partnership",
    className: "FirstPartnership",
    namespace: NS,
    filePath: `${FILE}/FirstPartnership.cs`,
    phase: "pre_match",
    marketName: "Runs in First Partnership",
    marketCode: "01FONW",
    marketId: 999,
    legacyMarketId: 129,
    description:
      "Under/over line from average opener expected runs. Test/FC uses 1.0× multiplier; limited overs uses 1.05×.",
    inputs: [
      {
        name: "ExpectedRuns",
        label: "Opener expected runs",
        scope: "parameter",
        csharpPath: "PlayerEvaluation.BatsmanEvaluation.ExpectedRuns",
        excelRef: "Prep Work player rows (from Q24-style ratings)",
        notes: "T10 uses BattingAverage instead",
      },
      {
        name: "BattingNumber",
        label: "Batting order",
        scope: "parameter",
        csharpPath: "BatsmanEvaluation.BattingNumber",
        notes: "Sorted to pick openers [0] and [1]",
      },
      {
        name: "FirstPartnership",
        label: "First partnership adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.FirstPartnership",
        excelRef: "PM Publication!I44",
        notes: "Purple adjust — added to run line before rounding",
      },
      {
        name: "OversAvailable",
        label: "Overs available",
        scope: "parameter",
        csharpPath: "inputs.MatchState.GetCurrentInnings().OversAvailable",
      },
    ],
    embeddedConstants: [
      { name: "LimitedOversMultiplier", value: "1.05" },
      { name: "TestFcMultiplier", value: "1.0" },
      { name: "AverageWeight", value: "0.25", notes: "Mean of 4 opener values" },
      { name: "LineFormula", value: "Round(averageRuns * ln(2) + adjust)", notes: "Line = runLine + 0.5" },
    ],
    outputs: [
      {
        name: "partnershipLine",
        label: "Partnership run line",
        type: "line",
        csharpPath: "LineSpecifier(runLine + 0.5)",
        excelRef: "PM Publication!F44 (+0.5 line)",
      },
      {
        name: "underOver",
        label: "Under / Over 0.5",
        type: "outcome_set",
        csharpPath: "Market.CreateUnderOver(..., 0.5, ...)",
        notes: "Fixed 0.5 probability split at creation — actual probs from engine",
      },
    ],
    missingForParity: [
      "Exact Prep Work cells for each opener ExpectedRuns",
      "Under/over probabilities after line set (G44/H44)",
    ],
  },
  ...additionalPricingModels,
];

export function getPricingModelByRegistryId(registryModelId: string) {
  return pricingModels.find((m) => m.registryModelId === registryModelId);
}

export function getPricingModelById(id: string) {
  return pricingModels.find((m) => m.id === id);
}
