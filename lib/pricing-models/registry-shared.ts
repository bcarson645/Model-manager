import type { SharedPricingArtifact } from "./types-shared";

const NS_PREMATCH = "PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models";
const NS_ROOT = "PremiumCricket.Lib.Pricing.PricingModels";

export const sharedPricingArtifacts: SharedPricingArtifact[] = [
  {
    id: "top-batter-methods",
    name: "TopBatterMethods",
    kind: "static_helper",
    namespace: NS_PREMATCH,
    filePath: "reference/pricing-models/PreMatch/Models/TopBatterMethods.cs",
    description:
      "Shared run-expectation, partnership, and cap logic for MatchTopBatter and TeamTopBatter CappedPoissonGamma distributions.",
    usedBy: ["MatchTopBatter", "TeamTopBatter"],
    methods: [
      {
        name: "GetPlayerRuns",
        signature:
          "(inputs, battingTeam, bowlingTeam, index) → BattingAverage × conditions × bowlingRating × 1.07",
        notes: "Per-batter expected runs fed into Poisson-gamma variance lookup",
      },
      {
        name: "GetCap",
        signature:
          "(lookupProvider, inputs, battingTeam, bowlingTeam) → List<double>[11]",
        notes: "strikeRateRatio × runsRemaining × 0.95 per batting position",
      },
      {
        name: "GetPartnerships",
        signature: "(List<double> playerRuns) → List<double>[11]",
        notes: "Public overload; also used internally for runs-remaining cascade",
      },
    ],
    inputs: [
      {
        name: "BattingAverage",
        label: "Player batting average",
        scope: "parameter",
        csharpPath: "BatsmanEvaluation.BattingAverage",
        excelRef: "Prep Work player rows (from Q24-style ratings)",
      },
      {
        name: "StrikeRate",
        label: "Player strike rate",
        scope: "parameter",
        csharpPath: "BatsmanEvaluation.StrikeRate",
        notes: "Compared to GetStrikeRateLookup(format, 1)",
      },
      {
        name: "ConditionAdjustment",
        label: "Conditions",
        scope: "parameter",
        csharpPath: "inputs.Evaluation.MatchEvaluation.ConditionAdjustment",
        excelRef: "Prep Work!D3",
      },
      {
        name: "BowlingRating",
        label: "Opposition bowling rating",
        scope: "parameter",
        csharpPath: "bowlingTeam.BowlingRating",
        excelRef: "Prep Work!D5 / I5",
      },
      {
        name: "InningsRuns",
        label: "Team expected innings runs",
        scope: "parameter",
        csharpPath: "battingTeam.GetRunsExpected()",
        excelRef: "Prep Work!E6 (team 1) / J6 (team 2)",
        notes:
          "Excel: totalFactor (D6/I6) × par score (BT3). D6 = D4×D5×D3. Same structure as MatchBetting.GetInningsRuns but par may come from BT3 not hardcoded format constants.",
      },
      {
        name: "ParScore",
        label: "Format par score",
        scope: "embedded",
        csharpPath: "MatchBetting format standards OR workbook BT3",
        excelRef: "Prep Work!BT3",
        notes: "NZ v SA T20 workbook BT3=165; Lambda T20Standard=163",
      },
      {
        name: "StrikeRateLookup",
        label: "Format strike-rate standard",
        scope: "embedded",
        csharpPath: "lookupProvider.GetStrikeRateLookup().Lookup(format, 1)",
      },
    ],
    embeddedConstants: [
      { name: "PlayerRunsMultiplier", value: "1.07" },
      { name: "CapRunsMultiplier", value: "0.95" },
      { name: "FirstPartnershipBlend", value: "0.5 × (runs[0] + runs[1]) × 1.07" },
      { name: "LaterPartnershipCoeff", value: "0.69 on playerRuns[x]" },
      { name: "PartnershipHalving", value: "× 0.5 × 1.07 after prior / 1.07" },
      { name: "StrikeRateFloor", value: "max(sr/standard, 1)" },
    ],
    missingForParity: [
      "Map BattingAverage source cells per player in Prep Work",
      "Confirm partnership chain vs Excel top-bat workbook logic",
      "Confirm BT3 par (165) vs Lambda T20Standard (163) rounding",
    ],
  },
  {
    id: "home-away-market-pricing-model",
    name: "HomeAwayMarketPricingModel",
    kind: "base_class",
    namespace: NS_ROOT,
    filePath: "reference/pricing-models/HomeAwayMarketPricingModel.cs",
    description:
      "Abstract base for markets published separately per home and away team (distinct market IDs).",
    usedBy: ["TeamHomeAwayMarketPricingModel"],
    methods: [
      { name: "GetHomeMarketId", signature: "() → int" },
      { name: "GetAwayMarketId", signature: "() → int" },
      { name: "GetMarketId", signature: "(bool isHomeTeam) → int" },
      { name: "GetLegacyMarketId", signature: "() → int (default 0)" },
      { name: "GetMarketIds", signature: "() → List<int> [home, away]" },
    ],
  },
  {
    id: "team-home-away-market-pricing-model",
    name: "TeamHomeAwayMarketPricingModel",
    kind: "base_class",
    namespace: `${NS_PREMATCH}.Teams`,
    filePath: "reference/pricing-models/PreMatch/Models/Teams/TeamHomeAwayMarketPricingModel.cs",
    description:
      "Team-scoped home/away base — specifiers, Test/FC market naming, and over/under CreateMarket helper. Top Bat/Bowl race models override GetMarkets directly.",
    usedBy: ["TeamTopBatter", "TeamTopBowler"],
    methods: [
      {
        name: "GetTeamInningsSpecifiers",
        signature: "(inputs, team) → MaxOver + Team + Innings(1)",
        notes: "Used by TeamTopBatter / TeamTopBowler race markets",
      },
      {
        name: "GetHomeAwaySpecifiers",
        signature: "(inputs, team, line) → MaxOver + Team + Line(line+0.5)",
        notes: "For over/under team markets via CreateMarket",
      },
      {
        name: "CreateMarket",
        signature: "(inputs, team, underProb, line, marketCode) → Market",
        notes: "Test/FC prefixes team name with '1st Innings'",
      },
      {
        name: "GetMarketCode",
        signature: "(team, code) → '5{code}' home / '6{code}' away",
        notes: "TeamTopBatter/Bowler use NL-prefixed codes in derived classes instead",
      },
    ],
    embeddedConstants: [
      { name: "HomeMarketCodePrefix", value: "5" },
      { name: "AwayMarketCodePrefix", value: "6" },
      { name: "TeamSpecifierFormat", value: "TeamName|TeamId" },
    ],
  },
  {
    id: "match-top-player",
    name: "MatchTopPlayer",
    kind: "base_class",
    namespace: `${NS_PREMATCH}.Matches`,
    filePath: "reference/pricing-models/PreMatch/Models/Matches/MatchTopPlayer.cs",
    description:
      "Base for match-wide top-player races. Merges both squads: first 11 from each team, then extras — sorted by batting number.",
    usedBy: ["MatchTopBatter", "MatchTopBowler"],
    methods: [
      {
        name: "GetSelections",
        signature: "(inputs) → List<RaceDistributionSelection<string>>",
        notes: "team1[0..10] + team2[0..10] + team1[11..] + team2[11..]",
      },
      {
        name: "GetPlayerDistribution",
        signature: "(inputs, battingTeam, bowlingTeam, index) → NamedRaceDistributionSelection",
        notes: "Abstract — Poisson-gamma in MatchTopBatter, wickets in MatchTopBowler",
      },
      {
        name: "GetSpecifiers",
        signature: "(maxOvers) → MaxOverSpecifier only",
      },
    ],
    embeddedConstants: [
      { name: "MainSquadPerTeam", value: "11", notes: "Take(11) before extras interleave" },
    ],
  },
  {
    id: "match-derivative-market",
    name: "MatchDerivativeMarket",
    kind: "base_class",
    namespace: `${NS_PREMATCH}.HeadToHeads`,
    filePath: "reference/pricing-models/PreMatch/Models/HeadToHeads/MatchDerivativeMarket.cs",
    description:
      "Head-to-head markets derived from MatchBetting. Standalone GetMarkets re-prices MatchBetting; MatchBetting passes its market to avoid double work.",
    usedBy: ["TeamOfTopBat", "TeamOfTopBowl"],
    methods: [
      {
        name: "GetMarkets",
        signature: "(inputs) → IList<Market>",
        notes: "Creates MatchBetting, uses First() match market outcome",
      },
      {
        name: "GetMarkets",
        signature: "(inputs, matchMarket) → IList<Market>",
        notes: "Overload used by MatchBetting spawn — single CreateMarket wrapper",
      },
      {
        name: "CreateMarket",
        signature: "(inputs, matchMarket) → Market",
        notes: "Abstract — implemented by TeamOfTopBat / TeamOfTopBowl",
      },
    ],
    missingForParity: [
      "HeadStandardMarketPricingModel base class (GetTeams, GetTeamTwoWayOutcomes, GetMaxOverSpecifier)",
    ],
  },
  {
    id: "i-match-derivative-market",
    name: "IMatchDerivativeMarket",
    kind: "interface",
    namespace: NS_ROOT,
    filePath: "reference/pricing-models/IMatchDerivativeMarket.cs",
    description:
      "Contract for markets derived from an already-priced MatchBetting market instance. Implemented by MatchDerivativeMarket base class.",
    usedBy: ["MatchBetting", "TeamOfTopBat", "TeamOfTopBowl"],
    methods: [
      {
        name: "GetMarkets",
        signature: "(IPricingInputs inputs, Market matchMarket) → IList<Market>",
        notes: "matchMarket is the parent MatchBetting output passed at spawn time",
      },
    ],
    missingForParity: ["See MatchDerivativeMarket base class entry"],
  },
];
