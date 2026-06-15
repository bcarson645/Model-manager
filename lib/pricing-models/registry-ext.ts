import type { PricingModelDefinition } from "./types";

const NS_MATCHES = "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches";
const NS_PLAYERS = "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Players";
const NS_HEADTOHEADS = "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads";
const FILE_MATCHES = "reference/pricing-models/PreMatch/Models/Matches";
const FILE_PLAYERS = "reference/pricing-models/PreMatch/Models/Players";
const FILE_HEADTOHEADS = "reference/pricing-models/PreMatch/Models/HeadToHeads";

export const additionalPricingModels: PricingModelDefinition[] = [
  {
    id: "tied-match",
    registryModelId: "pm-tied-match",
    className: "TiedMatch",
    namespace: NS_MATCHES,
    filePath: `${FILE_MATCHES}/TiedMatch.cs`,
    phase: "pre_match",
    marketName: "Tied Match",
    marketCode: "64PINB",
    marketId: 999,
    legacyMarketId: 41,
    description:
      "Yes/No tied match derived from match odds competitiveness. Delegates to MatchBetting for priceDiff.",
    inputs: [
      {
        name: "MatchOdds",
        label: "Match betting probabilities",
        scope: "parameter",
        csharpPath: "MatchBetting.GetMatchOdds(inputs)",
        excelRef: "Prep Work!C10:C11 / PM Publication!G20:G21",
        notes: "priceDiff = |0.5 - homeProb| × 2",
      },
      {
        name: "Format",
        label: "Match format",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.Format",
      },
      {
        name: "TiedMatch",
        label: "Tied match adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.TiedMatch",
        excelRef: "PM Publication!I22",
      },
    ],
    embeddedConstants: [
      { name: "T10Base", value: "0.02" },
      { name: "T20Base", value: "0.02 - 0.02 × priceDiff" },
      { name: "ODIBase", value: "0.013 - 0.01 × priceDiff" },
      { name: "TestDefault", value: "0.001" },
    ],
    outputs: [
      {
        name: "tiedYes",
        label: "Tied — Yes",
        type: "probability",
        excelRef: "PM Publication!G22 / PM Pricing!C4",
      },
      {
        name: "tiedNo",
        label: "Tied — No",
        type: "probability",
        excelRef: "PM Publication!G23",
      },
    ],
    missingForParity: [
      "Confirm PM Pricing vs PM Publication as canonical tied prob",
      "Test/FC uses 0.001 base — verify vs Excel for Test fixtures separately",
    ],
  },
  {
    id: "toss-win-double",
    registryModelId: "pm-toss-win-double",
    className: "TossWinDouble",
    namespace: NS_MATCHES,
    filePath: `${FILE_MATCHES}/TossWinDouble.cs`,
    phase: "pre_match",
    marketName: "Toss/Win Double",
    marketCode: "TWD",
    marketId: 999,
    legacyMarketId: 68,
    description:
      "Home/away toss-win combos plus no-winner outcome. Uses match odds and TossValue.",
    inputs: [
      {
        name: "MatchOdds",
        label: "Match betting probabilities",
        scope: "parameter",
        csharpPath: "MatchBetting.GetMatchOdds(inputs)",
        excelRef: "PM Publication!G20:G21",
      },
      {
        name: "TossValue",
        label: "Toss value",
        scope: "trading_input",
        csharpPath: "inputs.Evaluation.MatchEvaluation.TossValue",
        excelRef: "PM Publication!I26 (Toss value)",
        notes: "homeProb = matchHome×0.5 + tossValue",
      },
    ],
    embeddedConstants: [
      { name: "MatchOddsWeight", value: "0.5", notes: "Half match prob + toss skew" },
    ],
    outputs: [
      { name: "homeTossWin", label: "Home team", type: "probability", excelRef: "PM Publication!G26" },
      { name: "awayTossWin", label: "Away team", type: "probability", excelRef: "PM Publication!G27" },
      { name: "noWinner", label: "No winner / draw leg", type: "probability", excelRef: "PM Publication!G28" },
    ],
    missingForParity: [
      "TossValue Excel cell mapping beyond I26 label",
      "Pre-match TossValue when toss not taken",
    ],
  },
  {
    id: "player-runs",
    registryModelId: "pm-player-runs",
    className: "PlayerRuns",
    namespace: NS_PLAYERS,
    filePath: `${FILE_PLAYERS}/PlayerRuns.cs`,
    phase: "pre_match",
    marketName: "Player Runs",
    marketCode: "5{n}BARU / 6{n}BARU",
    marketId: 638,
    legacyMarketId: 4,
    description:
      "One under/over market per squad player. Extends PlayerScores base class. Test/FC renames to 1st Innings Runs.",
    inputs: [
      {
        name: "ExpectedRuns",
        label: "Player expected runs",
        scope: "parameter",
        csharpPath: "player.BatsmanEvaluation.ExpectedRuns",
        excelRef: "Prep Work Q-column player ratings → expected runs",
      },
      {
        name: "BatsmanRuns",
        label: "Batsman runs adjust",
        scope: "trading_input",
        csharpPath: "batterAdjustment.BatsmanRuns",
        excelRef: "PM Publication!I per player row (purple)",
        notes: "Added to rounded line",
      },
      {
        name: "RatioConstant",
        label: "Ratio constant by batting position",
        scope: "embedded",
        csharpPath: "GetRatioConstant(inputs, batPosition + indexAdjust)",
      },
    ],
    embeddedConstants: [
      { name: "LineFormula", value: "Round(ratioConstant × ExpectedRuns) + Round(BatsmanRuns)" },
      { name: "MarketCodePattern", value: "5/6 + batPosition + BARU" },
    ],
    outputs: [
      {
        name: "playerRunsLine",
        label: "Per-player run line",
        type: "line",
        notes: "One market per player — PM template Player - Runs",
      },
      {
        name: "underOver",
        label: "Under / Over 0.5",
        type: "outcome_set",
        csharpPath: "GetOverUnderOutcomes(0.5)",
      },
    ],
    missingForParity: [
      "PlayerScores base class (GetRatioConstant, GetSpecifiers)",
      "Map each player row in PM Publication to batterAdjustment",
      "BatterAdjustmentsPM structure",
    ],
  },
  {
    id: "match-top-batter",
    registryModelId: "pm-match-top-batter",
    className: "MatchTopBatter",
    namespace: NS_MATCHES,
    filePath: `${FILE_MATCHES}/MatchTopBatter.cs`,
    phase: "pre_match",
    marketName: "Match Top Bat",
    marketCode: "PMTRSNL",
    marketId: 683,
    legacyMarketId: 45,
    description:
      "Race distribution across all batters with Poisson-gamma run distributions and minimum probability floor.",
    inputs: [
      {
        name: "PlayerRuns",
        label: "Per-player run expectation",
        scope: "parameter",
        csharpPath: "TopBatterMethods.GetPlayerRuns(...)",
      },
      {
        name: "ConditionAdjustment",
        label: "Conditions",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
      {
        name: "VarianceLookup",
        label: "PlayerRuns variance lookup",
        scope: "embedded",
        csharpPath: "GetVarianceParameters('PlayerRuns')",
      },
      {
        name: "ZeroProbLookup",
        label: "Zero probability lookup",
        scope: "embedded",
        csharpPath: "GetVarianceParameters('ZeroProb')",
      },
    ],
    embeddedConstants: [
      { name: "RaceDistributionCap", value: "500" },
      { name: "MinimumLookup", value: "GetMatchTopBatMinimumLookup by batting pos mod 11" },
    ],
    outputs: [
      {
        name: "topBatOutcomes",
        label: "Per-player top bat probability",
        type: "outcome_set",
        excelRef: "PM Publication — Match Top Bat. rows",
      },
    ],
    missingForParity: ["Exact PM Publication row range for match top bat"],
  },
  {
    id: "match-top-bowler",
    registryModelId: "pm-match-top-bowler",
    className: "MatchTopBowler",
    namespace: NS_MATCHES,
    filePath: `${FILE_MATCHES}/MatchTopBowler.cs`,
    phase: "pre_match",
    marketName: "Match Top Bowler",
    marketCode: "PMTWTNL",
    marketId: 684,
    legacyMarketId: 46,
    description:
      "Race distribution across bowlers using expected wickets and Poisson-gamma variance. Normalizes top 22 then appends extras.",
    inputs: [
      {
        name: "ExpectedWickets",
        label: "Bowler expected wickets",
        scope: "parameter",
        csharpPath: "BowlerEvaluation.GetExpectedWickets()",
      },
      {
        name: "BattingRating",
        label: "Opposition batting rating",
        scope: "parameter",
        csharpPath: "battingTeam.BattingRating",
        notes: "wicketAdjust = 0.5 × (batRating/conditions + 1)",
      },
      {
        name: "ConditionAdjustment",
        label: "Conditions",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
    ],
    embeddedConstants: [
      { name: "RaceDistributionCap", value: "10" },
      { name: "MainSquadSize", value: "22", notes: "Normalized first, extras scaled by totalProb" },
      { name: "WicketAdjustFormula", value: "0.5 × (batRating/conditions + 1)" },
    ],
    outputs: [
      {
        name: "topBowlOutcomes",
        label: "Per-player top bowler probability",
        type: "outcome_set",
        excelRef: "PM Publication — Match Top Bowler. rows",
      },
    ],
    missingForParity: [
      "Player level adjustments (currently 0.00 placeholders)",
      "Exact PM Publication row range",
    ],
  },
  {
    id: "team-of-top-bat",
    registryModelId: "pm-team-of-top-bat",
    className: "TeamOfTopBat",
    namespace: NS_HEADTOHEADS,
    filePath: `${FILE_HEADTOHEADS}/TeamOfTopBat.cs`,
    phase: "pre_match",
    marketName: "Team of Top Bat",
    marketCode: "59BARUA",
    marketId: 698,
    legacyMarketId: 58,
    description:
      "Two-way market: which team supplies the match top batter. Derived from match odds via MatchBetting; spawns per-team TeamTopBatter markets.",
    inputs: [
      {
        name: "MatchOdds",
        label: "Match betting probabilities",
        scope: "parameter",
        csharpPath: "matchMarket.Outcomes",
        excelRef: "Prep Work!C10:C11 / PM Publication!G20:G21",
        notes: "Passed from parent MatchBetting.CreateMarket",
      },
      {
        name: "TeamOfTopBat",
        label: "Team of top bat adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.TeamOfTopBat",
        excelRef: "PM Publication!I60",
        notes: "Purple adjust — added as home prob skew (÷100)",
      },
    ],
    embeddedConstants: [
      { name: "HomeWeight", value: "0.86", notes: "Blend on match home prob" },
      { name: "AwayWeight", value: "0.14", notes: "Blend on match away prob" },
    ],
    outputs: [
      {
        name: "homeTeamTopBat",
        label: "Home team top bat",
        type: "probability",
        excelRef: "PM Publication!G60",
      },
      {
        name: "awayTeamTopBat",
        label: "Away team top bat",
        type: "probability",
        excelRef: "PM Publication!G61",
      },
    ],
    missingForParity: [
      "HeadStandardMarketPricingModel base class",
      "Confirm I60 adjust cell vs PM Publication layout",
      "Relationship to TeamTopBatter per-team markets",
    ],
  },
  {
    id: "team-of-top-bowl",
    registryModelId: "pm-team-of-top-bowl",
    className: "TeamOfTopBowl",
    namespace: NS_HEADTOHEADS,
    filePath: `${FILE_HEADTOHEADS}/TeamOfTopBowl.cs`,
    phase: "pre_match",
    marketName: "Team of Top Bowl",
    marketCode: "510BARUA",
    marketId: 699,
    legacyMarketId: 59,
    description:
      "Two-way market: which team supplies the match top bowler. Format-dependent blend from match odds; spawns per-team TeamTopBowler markets.",
    inputs: [
      {
        name: "MatchOdds",
        label: "Match betting probabilities",
        scope: "parameter",
        csharpPath: "matchMarket.Outcomes",
        excelRef: "Prep Work!C10:C11 / PM Publication!G20:G21",
      },
      {
        name: "Format",
        label: "Match format",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.IsT10 / IsT20",
        notes: "T10/T20 vs ODI/Test/FC blend coefficients",
      },
      {
        name: "TeamOfTopBowl",
        label: "Team of top bowl adjust",
        scope: "trading_input",
        csharpPath: "inputs.AdjustmentsPM.MatchAdjustments.TeamOfTopBowl",
        excelRef: "PM Publication!I62",
        notes: "Purple adjust — added as home prob skew (÷100)",
      },
    ],
    embeddedConstants: [
      { name: "T10T20HomeWeight", value: "0.74" },
      { name: "T10T20AwayWeight", value: "0.26" },
      { name: "LongFormHomeWeight", value: "0.83" },
      { name: "LongFormAwayWeight", value: "0.17" },
    ],
    outputs: [
      {
        name: "homeTeamTopBowl",
        label: "Home team top bowl",
        type: "probability",
        excelRef: "PM Publication!G62",
      },
      {
        name: "awayTeamTopBowl",
        label: "Away team top bowl",
        type: "probability",
        excelRef: "PM Publication!G63",
      },
    ],
    missingForParity: [
      "HeadStandardMarketPricingModel base class",
      "Confirm I62 adjust cell vs PM Publication layout",
      "T10 uses same blend as T20 in Lambda",
    ],
  },
  {
    id: "team-top-batter",
    registryModelId: "pm-team-top-batter",
    className: "TeamTopBatter",
    namespace: "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams",
    filePath: "reference/pricing-models/PreMatch/Models/Teams/TeamTopBatter.cs",
    phase: "pre_match",
    marketName: "Top Bat (per team)",
    marketCode: "NL1TBNL / NL2TBNL",
    marketId: 674,
    legacyMarketId: 36,
    description:
      "Team top batter race — one market per team (home 674, away 675). Spawned from MatchBetting via TeamOfTopBat.",
    inputs: [
      {
        name: "PlayerRuns",
        label: "Per-player run expectation",
        scope: "parameter",
        csharpPath: "TopBatterMethods.GetPlayerRuns(...)",
      },
      {
        name: "ConditionAdjustment",
        label: "Conditions",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
      {
        name: "VarianceLookup",
        label: "PlayerRuns variance",
        scope: "embedded",
        csharpPath: "GetVarianceParameters('PlayerRuns')",
      },
      {
        name: "ZeroProbLookup",
        label: "Zero probability lookup",
        scope: "embedded",
        csharpPath: "GetVarianceParameters('ZeroProb')",
      },
    ],
    embeddedConstants: [
      { name: "RaceDistributionCap", value: "500" },
      { name: "MinimumLookup", value: "GetTopBatMinimumLookup" },
      { name: "OutcomeEncoding", value: "PlayerName|PlayerId in category" },
    ],
    outputs: [
      {
        name: "teamTopBatOutcomes",
        label: "Per-player top bat prob (per team)",
        type: "outcome_set",
        excelRef: "PM Publication — {Team} - Top Bat",
      },
    ],
    missingForParity: ["PM row range per team top bat market"],
  },
  {
    id: "team-top-bowler",
    registryModelId: "pm-team-top-bowler",
    className: "TeamTopBowler",
    namespace: "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams",
    filePath: "reference/pricing-models/PreMatch/Models/Teams/TeamTopBowler.cs",
    phase: "pre_match",
    marketName: "Top Bowl (per team)",
    marketCode: "NL1BBNL / NL2BBNL",
    marketId: 676,
    legacyMarketId: 37,
    description:
      "Team top bowler race — one market per team (home 676, away 677). Spawned from MatchBetting via TeamOfTopBowl.",
    inputs: [
      {
        name: "ExpectedWickets",
        label: "Bowler expected wickets",
        scope: "parameter",
        csharpPath: "BowlerEvaluation.GetExpectedWickets()",
      },
      {
        name: "OppositionBattingRating",
        label: "Opposition batting rating",
        scope: "parameter",
        csharpPath: "battingTeam.BattingRating",
        notes: "wicketAdjust = 0.5 × (batRating/conditions + 1)",
      },
      {
        name: "ConditionAdjustment",
        label: "Conditions",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
    ],
    embeddedConstants: [
      { name: "RaceDistributionCap", value: "10" },
      { name: "MainSquadSize", value: "11", notes: "Normalize first 11, scale extras" },
      { name: "MinProbability", value: "T20=0.04, ODI=0.03, else 0.02" },
    ],
    outputs: [
      {
        name: "teamTopBowlOutcomes",
        label: "Per-player top bowl prob (per team)",
        type: "outcome_set",
        excelRef: "PM Publication — {Team} - Top Bowl",
      },
    ],
    missingForParity: [
      "Player adjusts currently 0.0",
      "PM row range per team top bowl market",
    ],
  },
];
