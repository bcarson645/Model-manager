/**
 * How the three trading screens connect: Player Adjustment → Lambda → Market Configuration.
 * Per-market readiness and wiring checklists for implementation.
 */

export type IntegrationReadiness = "ready" | "ready_soon" | "blocked";

export type WiringCheckItem = {
  id: string;
  label: string;
  status: "have" | "need" | "lookup" | "decision";
  detail: string;
  source?: string;
};

export type WiringConnectionStatus = "matched" | "parity_review" | "not_wired";

export type IntegrationWiringGuide = {
  readiness: IntegrationReadiness;
  readinessSummary: string;
  /** Live in Market Configuration — Player Adjustment → Lambda → publish */
  connected?: boolean;
  /** Wired end-to-end but Lambda output does not match Atlas — needs model review */
  parityReview?: boolean;
  connectedNote?: string;
  /** What Player Adjustment already supplies for this market */
  fromPlayerAdjustment: string[];
  /** Extra evaluation fields beyond the player-adjustment page */
  extraEvaluationInputs: WiringCheckItem[];
  /** Backend-only (lookup tables, format config) — no UI tab required */
  backendOnly: WiringCheckItem[];
  /** What Market Configuration must store and apply */
  marketConfiguration: string[];
  /** Steps to wire end-to-end */
  wiringSteps: string[];
  /** UI / architecture notes specific to this market */
  uiNotes?: string[];
  blockers?: string[];
};

export const readinessLabels: Record<
  IntegrationReadiness,
  { label: string; description: string; className: string }
> = {
  ready: {
    label: "Ready to wire",
    description: "Player adjustment + format is enough — no extra Prep Work blocks.",
    className: "border-emerald-900/50 bg-emerald-950/25 text-emerald-300",
  },
  ready_soon: {
    label: "Ready soon",
    description: "Mostly covered — one small extra field or confirm evaluation mapping.",
    className: "border-amber-900/50 bg-amber-950/20 text-amber-300",
  },
  blocked: {
    label: "Blocked",
    description: "Needs data not yet on the player-adjustment page.",
    className: "border-rose-900/50 bg-rose-950/20 text-rose-300",
  },
};

export const connectedLabel = {
  label: "Connected",
  description: "Live in Market Configuration — end-to-end wiring complete.",
  className: "border-teal-900/50 bg-teal-950/30 text-teal-300",
};

export const parityReviewLabel = {
  label: "Wired — review",
  description:
    "End-to-end wiring complete but Lambda output does not match Atlas — model parity needs review.",
  className: "border-orange-900/50 bg-orange-950/25 text-orange-300",
};

export function getWiringConnectionStatus(
  wiring: IntegrationWiringGuide
): WiringConnectionStatus {
  if (wiring.connected && wiring.parityReview) return "parity_review";
  if (wiring.connected) return "matched";
  return "not_wired";
}

export function isWiringMatched(wiring: IntegrationWiringGuide): boolean {
  return wiring.connected === true && !wiring.parityReview;
}

export const platformIntegrationOverview = {
  title: "Linking the three screens",
  summary:
    "You have Player Adjustment (Prep Work), Lambda models, and Market Configuration (PM Publication). The gap is the evaluation payload and per-market wiring — not the models themselves.",
  screens: [
    {
      name: "Player Adjustment",
      replaces: "Prep Work tab",
      provides: [
        "Squad, batting order, per-player averages and strike rates",
        "Raw / raw-adj inputs → player ratings",
        "Team conditions, batting factor, bowling factor, total factor",
        "Match price (proves evaluation → MatchBetting works)",
      ],
    },
    {
      name: "Lambda pricing",
      replaces: "PM Pricing sheet",
      provides: [
        "Base probabilities and lines from IPricingInputs",
        "Embedded lookup tables (variance, par SR, par average) — host on backend, not in UI",
      ],
    },
    {
      name: "Market Configuration",
      replaces: "PM Publication",
      provides: [
        "Display base prob/line per selection row",
        "Trader adjust per row (purple I column)",
        "Published prob after skew, decimal price, active toggle",
        "Publish to feed",
      ],
    },
  ],
  universalPipeline: [
    "Player Adjustment saves squad + factors → build TeamEvaluation / PlayerEvaluation payload.",
    "Backend attaches format, overs available, and lookup provider version.",
    "Get prices: call Lambda per active market with payload (+ adjusts per your architecture choice).",
    "Market Configuration stores base output, applies trader skew, renders price.",
    "Publish sends final offer — same role as PM Publication rows.",
  ],
  adjustArchitectureNote:
    "Most markets: trader adjust is post-model on the FE (÷100 on probability). FirstDismissal and TiedMatch apply adjusts inside Lambda today — pick one pattern and use it consistently for parity.",
};

const defaultMarketConfigSteps = [
  "Map market code (e.g. 01MOPD) to registry model id.",
  "On Get prices: invoke Lambda with evaluation payload.",
  "Store base probability (and line if applicable) per selection row.",
  "Store trader adjust integer per row; apply skew rules for this market type.",
  "Derive decimal price from published probability.",
  "Respect active toggle before publish.",
];

const defaultBackendLookups: WiringCheckItem[] = [
  {
    id: "lookup-provider",
    label: "LookupProvider tables",
    status: "lookup",
    detail: "Variance, par average, par SR tables bundled with Lambda — version with deployment.",
    source: "Lambda LookupProvider",
  },
  {
    id: "format",
    label: "Format + women flag",
    status: "lookup",
    detail: "T20/ODI/Test and isWomen for lookup keys (e.g. wT20).",
    source: "Fixture / tournament config",
  },
  {
    id: "overs",
    label: "Overs available",
    status: "lookup",
    detail: "MaxOverSpecifier — from format (20, 50, 90, etc.).",
    source: "MatchState.GetCurrentInnings().OversAvailable",
  },
];

/** Per registry model id — wiring checklists */
export const wiringByRegistryId: Record<string, IntegrationWiringGuide> = {
  "pm-match-winner": {
    readiness: "ready",
    connected: true,
    connectedNote: "Match price on Player Adjustment + rows 20–21 in Market Configuration.",
    readinessSummary: "Connected — reference pipeline for other markets.",
    fromPlayerAdjustment: [
      "Team batting/bowling ratings (D4/I4, D5/I5)",
      "Conditions (D3)",
      "Per-player ratings → expected innings runs",
      "Par score / format standard (BT3 equivalent)",
    ],
    extraEvaluationInputs: [],
    backendOnly: defaultBackendLookups,
    marketConfiguration: [
      ...defaultMarketConfigSteps,
      "Single home-team adjust (I20) — away is complement.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → evaluation payload.",
      "✓ MatchBetting.GetMarkets → base probabilities.",
      "✓ Market Configuration rows 20–21: prob, adjust I20, price, publish.",
    ],
  },

  "pm-toss-winner": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — fixed 50/50 TossWinner; Market Configuration rows 24–25. No trader adjust.",
    readinessSummary: "Connected — basic probability market; format only for MaxOver specifier.",
    fromPlayerAdjustment: [],
    extraEvaluationInputs: [],
    backendOnly: [
      {
        id: "format",
        label: "Format",
        status: "lookup",
        detail: "Only used for MaxOverSpecifier initial overs.",
        source: "Fixture config",
      },
    ],
    marketConfiguration: [
      "Rows 24–25: display 0.5 / 0.5 base (no adjust in Lambda).",
      "No trader skew unless you add FE overlay later.",
    ],
    wiringSteps: [
      "✓ Minimal IPricingInputs (teams + format).",
      "✓ TossWinner Lambda → 0.5 / 0.5 base probabilities.",
      "✓ Market Configuration rows 24–25: display prob, price, publish.",
    ],
  },

  "pm-tied-match": {
    readiness: "ready",
    connected: true,
    connectedNote: "Yes/No tied match — rows 22–23 in Market Configuration.",
    readinessSummary: "Connected — derives from match odds in the same evaluation payload.",
    fromPlayerAdjustment: ["Same evaluation as Match Betting"],
    extraEvaluationInputs: [],
    backendOnly: [
      {
        id: "format",
        label: "Format",
        status: "lookup",
        detail: "T10/T20/ODI/Test base tied probability formula.",
        source: "MatchEvaluation.Format",
      },
    ],
    marketConfiguration: [
      "Rows 22–23: Yes/No outcomes.",
      "Single adjust I22 (÷100 on Yes prob).",
    ],
    wiringSteps: [
      "✓ Reuse match odds from MatchBetting evaluation.",
      "✓ TiedMatch Lambda → Yes/No base probabilities.",
      "✓ Market Configuration rows 22–23: adjust I22, price, publish.",
    ],
    uiNotes: ["Adjust applied per your live implementation (Lambda or post-model FE)."],
  },

  "pm-toss-win-double": {
    readiness: "ready",
    connected: true,
    connectedNote: "Three-way toss/win double — rows 26–28 in Market Configuration.",
    readinessSummary: "Connected — match odds + TossValue in evaluation payload.",
    fromPlayerAdjustment: ["Match odds from same pipeline as Match Betting"],
    extraEvaluationInputs: [
      {
        id: "toss-value",
        label: "TossValue",
        status: "have",
        detail: "Confirmed in live payload — blends toss into home/away double probabilities.",
        source: "MatchEvaluation.TossValue",
      },
    ],
    backendOnly: [],
    marketConfiguration: ["Rows 26–28: three outcomes (home / away / neither)."],
    wiringSteps: [
      "✓ MatchEvaluation.TossValue in payload.",
      "✓ TossWinDouble Lambda → three outcome probabilities.",
      "✓ Market Configuration rows 26–28: display, adjust, price, publish.",
    ],
  },

  "pm-team-of-top-bat": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — derived from MatchBetting probs; Market Configuration rows 60–61.",
    readinessSummary:
      "Connected — TeamOfTopBat matches sheet inputs (match odds blend + I60).",
    fromPlayerAdjustment: ["Match betting probabilities (same evaluation payload)"],
    extraEvaluationInputs: [],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: [
      "Rows 60–61: two-way team of top bat.",
      "Single adjust I60 (home skew ÷100).",
    ],
    wiringSteps: [
      "✓ MatchBetting priced in same evaluation.",
      "✓ TeamOfTopBat blend 0.86/0.14 + adjust I60.",
      "✓ Market Configuration rows 60–61.",
    ],
  },

  "pm-team-of-top-bowl": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — derived from MatchBetting probs; Market Configuration rows 62–63.",
    readinessSummary:
      "Connected — TeamOfTopBowl matches sheet inputs (match odds blend + I62).",
    fromPlayerAdjustment: ["Match betting probabilities (same evaluation payload)"],
    extraEvaluationInputs: [],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: ["Rows 62–63: two-way; adjust I62."],
    wiringSteps: [
      "✓ MatchBetting priced in same evaluation.",
      "✓ TeamOfTopBowl format blend + adjust I62.",
      "✓ Market Configuration rows 62–63.",
    ],
  },

  "pm-team-top-batter": {
    readiness: "ready",
    connected: true,
    parityReview: true,
    connectedNote:
      "Wired end-to-end — TeamTopBatter race distribution does not yet match Atlas PM Publication per-team top bat rows; model differences need review.",
    readinessSummary:
      "Wired — review — per-team top bat race; PM row range and player-level parity still open.",
    fromPlayerAdjustment: [
      "Per-player run expectations (TopBatterMethods.GetPlayerRuns)",
      "Conditions (D3)",
      "Squad batting order for minimum probability lookup",
    ],
    extraEvaluationInputs: [
      {
        id: "team-top-bat-rows",
        label: "PM Publication row range per team",
        status: "need",
        detail: "NZ rows 359–378 / SA rows 399–418 — outcome set must match Atlas race probs.",
        source: "PM Publication — {Team} - Top Bat",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "team-top-bat-variance",
        label: "PlayerRuns / ZeroProb variance lookups",
        status: "lookup",
        detail: "Poisson-gamma race distribution with GetTopBatMinimumLookup floor.",
        source: "LookupProvider",
      },
    ],
    marketConfiguration: [
      "NZ rows 359–378 / SA rows 399–418: per-player top bat probability per team.",
      "Spawned from MatchBetting via TeamOfTopBat — one market per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → player run expectations in evaluation.",
      "✓ TeamTopBatter.GetMarkets → per-team race outcome set.",
      "○ QA parity vs Atlas PM Publication rows before marking matched.",
    ],
    blockers: ["PM row range per team top bat market"],
  },

  "pm-team-top-bowler": {
    readiness: "ready",
    connected: true,
    parityReview: true,
    connectedNote:
      "Wired end-to-end — TeamTopBowler race distribution does not yet match Atlas PM Publication per-team top bowl rows; player adjusts and model differences need review.",
    readinessSummary:
      "Wired — review — per-team top bowl race; player adjusts (0.0 placeholders) and PM row QA still open.",
    fromPlayerAdjustment: [
      "Per-bowler expected wickets (GetExpectedWickets)",
      "Opposition batting rating for wicketAdjust",
      "Conditions (D3)",
    ],
    extraEvaluationInputs: [
      {
        id: "team-top-bowl-rows",
        label: "PM Publication row range per team",
        status: "need",
        detail: "NZ rows 379–398 / SA rows 419–438 — outcome set must match Atlas race probs.",
        source: "PM Publication — {Team} - Top Bowl",
      },
      {
        id: "team-top-bowl-adjusts",
        label: "Player-level adjusts",
        status: "need",
        detail: "Player adjusts currently 0.0 in Lambda — confirm vs Excel nominated players.",
        source: "registry-ext missingForParity",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "NZ rows 379–398 / SA rows 419–438: per-player top bowl probability per team.",
      "Spawned from MatchBetting via TeamOfTopBowl — one market per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → bowler expected wickets in evaluation.",
      "✓ TeamTopBowler.GetMarkets → per-team race outcome set.",
      "○ QA parity vs Atlas PM Publication rows before marking matched.",
    ],
    blockers: ["Player adjusts currently 0.0", "PM row range per team top bowl market"],
  },

  "pm-first-partnership": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — opener ExpectedRuns from team for/against tables feed Lambda; Market Configuration row 44.",
    readinessSummary:
      "Connected — FirstPartnership inputs match Prep Work opener / team table mapping.",
    fromPlayerAdjustment: [
      "Opener batting average (BT CAZ) — T10 uses average directly",
      "Opener ExpectedRuns — non-T10 from home/away for–against table mapping",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-runs",
        label: "Opener ExpectedRuns",
        status: "have",
        detail:
          "Mapped from home/away team table inputs → BatsmanEvaluation.ExpectedRuns for openers [0],[1].",
        source: "Team for/against tables + player evaluation",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: [
      "Row 44: line F44, adjust I44 (line nudge — adds directly to line in Lambda).",
      "U/O at 50/50 after line set.",
    ],
    wiringSteps: [
      "✓ Opener ExpectedRuns on evaluation payload.",
      "✓ FirstPartnership.GetMarkets → line + U/O.",
      "✓ Market Configuration row 44: line, adjust I44, publish.",
    ],
    uiNotes: ["Adjust shifts the line integer, not probability (÷100 pattern does not apply)."],
  },

  "pm-fifty-first-innings": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — MatchEvaluation.FiftyInnings from match-level model stats (Prep Work Z5) matches interface.",
    readinessSummary:
      "Connected — FiftyInnings milestone mapped from match-level model stats table.",
    fromPlayerAdjustment: ["Conditions + team factors feed milestone calc"],
    extraEvaluationInputs: [
      {
        id: "fifty-prob",
        label: "FiftyInnings probability",
        status: "have",
        detail: "MatchEvaluation.FiftyInnings — Prep Work!Z5 / match-level model stats row 5.",
        source: "Prep Work!Z5 / prep match stats block",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 67–68: Yes/No; adjust I67 (÷100 on Yes)."],
    wiringSteps: [
      "✓ FiftyInnings on evaluation from match-level model stats.",
      "✓ FiftyInnings model → Yes/No + adjust.",
      "✓ Market Configuration rows 67–68.",
    ],
  },

  "pm-hundred-first-innings": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — MatchEvaluation.HundredInnings from match-level model stats (Prep Work Z7) matches interface.",
    readinessSummary:
      "Connected — HundredInnings milestone mapped from match-level model stats table.",
    fromPlayerAdjustment: ["Conditions + team factors"],
    extraEvaluationInputs: [
      {
        id: "hundred-prob",
        label: "HundredInnings probability",
        status: "have",
        detail: "MatchEvaluation.HundredInnings — Prep Work!Z7 / match-level model stats row 7.",
        source: "Prep Work!Z7",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 71–72: Yes/No; adjust I71."],
    wiringSteps: [
      "✓ HundredInnings on evaluation from match-level model stats.",
      "✓ HundredInnings model → Yes/No + adjust.",
      "✓ Market Configuration rows 71–72.",
    ],
  },

  "pm-hundred-match": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — MatchEvaluation.HundredMatch from match-level model stats (Prep Work Z8) matches interface.",
    readinessSummary:
      "Connected — HundredMatch milestone mapped from match-level model stats table.",
    fromPlayerAdjustment: ["Conditions + team factors"],
    extraEvaluationInputs: [
      {
        id: "hundred-match-prob",
        label: "HundredMatch probability",
        status: "have",
        detail: "MatchEvaluation.HundredMatch — Prep Work!Z8 / match-level model stats row 8.",
        source: "Prep Work!Z8",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 73–74: Yes/No; adjust I73."],
    wiringSteps: [
      "✓ HundredMatch on evaluation from match-level model stats.",
      "✓ HundredMatch model → Yes/No + adjust.",
      "✓ Market Configuration rows 73–74.",
    ],
  },

  "pm-first-innings-lead": {
    readiness: "ready_soon",
    readinessSummary: "Team ratings + conditions only — no player-level extras.",
    fromPlayerAdjustment: [
      "Team batting rating × opposition bowling rating × conditions",
    ],
    extraEvaluationInputs: [],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
      {
        id: "test-match-runs-variance",
        label: "TestMatchRuns variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for innings race.",
        source: "LookupProvider",
      },
    ],
    marketConfiguration: [
      "Rows 64–66: 3-way home/away/tie.",
      "Single adjust I64 (home ↔ away skew).",
    ],
    wiringSteps: [
      "Team factors already on player adjustment page.",
      "Call FirstInningsLead; 3-way race on innings totals.",
    ],
  },

  "pm-first-innings-runs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — Runs in First Innings U/O; Market Configuration row 32 (line F32, adjust I32).",
    readinessSummary:
      "Connected — first-innings runs U/O from expected innings runs (E6/J6) + FirstInningsRuns / live InningsRuns proxy.",
    fromPlayerAdjustment: [
      "Team batting/bowling ratings (D4/I4, D5/I5)",
      "Conditions (D3)",
      "Expected innings runs (E6/J6) — totalFactor × par score",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-innings-runs",
        label: "GetRunsExpected / GetInningsRuns per team",
        status: "have",
        detail:
          "Prep Work E6/J6 = batRating × bowlRating × conditions × format standard — same chain as MatchBetting.GetInningsRuns.",
        source: "Prep Work!E6 / J6 → TeamEvaluation.GetRunsExpected()",
      },
      {
        id: "first-innings-runs-model",
        label: "FirstInningsRuns Lambda model",
        status: "have",
        detail:
          "FirstInningsRuns / live InningsRuns at pre-match state — row 32 line + U/O.",
        source: "lib/model-lanes/srl-pm-registry.ts → FirstInningsRuns",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
      {
        id: "innings-runs-variance",
        label: "Innings runs variance",
        status: "lookup",
        detail: "Poisson-gamma or MatchBetting-style variance for U/O line.",
        source: "LookupProvider / MatchBetting.GetInningsRunsVar",
      },
    ],
    marketConfiguration: [
      "Row 32: line F32, under/over G32/H32, adjust I32.",
      "U/O at 50/50 after line set.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → team ratings + expected innings runs (E6/J6).",
      "✓ FirstInningsRuns / InningsRuns → line + U/O.",
      "✓ Market Configuration row 32: line, adjust I32, price, publish.",
    ],
  },

  "pm-first-dismissal": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — opener avg/SR + bowling dismissal rates (AD:AM) → 7-way MOD; Market Configuration rows 45–51.",
    readinessSummary:
      "Connected — match 1st wicket method of dismissal wired.",
    fromPlayerAdjustment: [
      "Opener BattingAverage (BT CAZ) and StrikeRate (SR) for positions 1–2 each team",
      "Bowling-side DismissalMethodEvaluation (7 rates × 2 teams)",
    ],
    extraEvaluationInputs: [
      {
        id: "dismissal-rates-home",
        label: "Home bowling dismissal method rates (×7)",
        status: "have",
        detail: "Fielder, Bowled, Keeper, LBW, Run out, Stumped, Other — NZ bowling vs away batting.",
        source: "Prep Work AD4:AH9 → DismissalMethodEvaluation",
      },
      {
        id: "dismissal-rates-away",
        label: "Away bowling dismissal method rates (×7)",
        status: "have",
        detail: "SA bowling vs home batting.",
        source: "Prep Work AD12:AH17",
      },
    ],
    backendOnly: [
      {
        id: "batter-runs-lookup",
        label: "BatterRuns lookup (opener par average)",
        status: "lookup",
        detail: "GetBatterRunsLookup().Lookup(format, 1) for fielder/bowled adjusts.",
        source: "LookupProvider",
      },
      {
        id: "strike-rate-lookup",
        label: "StrikeRate lookup (opener par SR)",
        status: "lookup",
        detail: "GetStrikeRateLookup().Lookup(format, 1) for fielder/stumped adjusts.",
        source: "LookupProvider",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    ],
    marketConfiguration: [
      "Rows 45–51: seven selections — one prob + one adjust each (NOT above/below pairs).",
      "7-way partition renormalisation: weight[i] = base[i] + adjust[i]/100; published = weight/sum(weights).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → openers + DismissalMethodEvaluation both sides.",
      "✓ FirstDismissal.GetMarkets → seven base probabilities.",
      "✓ Market Configuration rows 45–51: adjusts, renormalise, price, publish.",
    ],
    uiNotes: [
      "Grid template should be one prob per row, not Prob above/below — MOD is not under/over.",
      "Excel F45=0.5 is a placeholder line, not a real O/U market.",
    ],
  },

  "pm-group-runs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — FirstGroup/SecondGroup/ThirdGroup means → match U/O lines F38–40; adjusts I38+; Market Configuration rows 38–40.",
    readinessSummary:
      "Connected — match runs in first N overs (both sides’ group means averaged).",
    fromPlayerAdjustment: [
      "Home / away FirstGroup, SecondGroup, ThirdGroup means",
      "Match FirstGroup / SecondGroup / ThirdGroup adjusts",
    ],
    extraEvaluationInputs: [
      {
        id: "first-group",
        label: "FirstGroup / SecondGroup / ThirdGroup per team",
        status: "have",
        detail:
          "Match mean = 0.5 × (team1 + team2) group expectation; line Round(mean − 1.2) + 0.5.",
        source: "Prep Work group means → PM Publication F38–F40",
      },
    ],
    backendOnly: [
      {
        id: "group-runs-variance",
        label: "GroupRuns variance lookup",
        status: "lookup",
        detail: "Poisson-gamma for U/O line.",
        source: "LookupProvider GetVarianceParameters('GroupRuns')",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "Match rows 38–40 (T20: 6/8/10 overs).",
      "U/O at single line — not range buckets (0–19, 20–29 are separate Ranged products).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → FirstGroup/SecondGroup/ThirdGroup both teams.",
      "✓ GroupRuns match markets → lines + U/O.",
      "✓ Market Configuration rows 38–40.",
    ],
  },

  "pm-team-group-runs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — per-team FirstGroup/SecondGroup/ThirdGroup → three U/O lines each; Market Configuration NZ 138–146 / SA 204–212.",
    readinessSummary:
      "Connected — team runs in first N overs for both sides.",
    fromPlayerAdjustment: [
      "Home / away FirstGroup, SecondGroup, ThirdGroup means",
      "Innings FirstGroup / SecondGroup / ThirdGroup adjusts",
    ],
    extraEvaluationInputs: [
      {
        id: "team-group-means",
        label: "Team group runs (3 lines per group)",
        status: "have",
        detail:
          "Three lines per team per over-group (middle ±5); TeamGroupRuns or GroupRuns team branch.",
        source: "Prep Work group means → PM Publication NZ 138–146 / SA 204–212",
      },
    ],
    backendOnly: [
      {
        id: "team-group-runs-variance",
        label: "GroupRuns variance lookup",
        status: "lookup",
        detail: "Same GroupRuns Poisson-gamma variance as the match market.",
        source: "LookupProvider GetVarianceParameters('GroupRuns')",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "NZ 138–146 / SA 204–212: three U/O lines per team per group (. / .. alternate lines).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → group means both teams.",
      "✓ TeamGroupRuns / GroupRuns team branch → lines + U/O.",
      "✓ Market Configuration NZ 138–146 / SA 204–212.",
    ],
  },

  "pm-match-fours": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — per-player fours (Prep Work O) + team totals + match adjust feed MatchFours; Market Configuration row 52.",
    readinessSummary:
      "Connected — player 4s column, raw runs, team fours totals and adjusts are on Player Adjustment.",
    fromPlayerAdjustment: [
      "Per-player expected fours (Prep Work O24:O34 / O45:O55)",
      "Team fours totals (O36 / O57)",
      "Raw runs (M) used in O fours formula chain",
    ],
    extraEvaluationInputs: [
      {
        id: "player-fours",
        label: "Per-player fours expectation (×22)",
        status: "have",
        detail: "SUM O both teams → GetTeamFours() home + away before MatchFours adjust.",
        source: "Prep Work O24:O34, O45:O55 → O36 + O57",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-fours-variance",
        label: "MatchFours variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('MatchFours')",
      },
    ],
    marketConfiguration: [
      "Row 52: line F52, under/over G/H, adjust I52 (MatchFours).",
      "Line from Poisson-gamma median of team fours sum + purple adjust.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → per-player O fours + team totals in evaluation.",
      "✓ MatchFours.GetMarkets → line + U/O.",
      "✓ Market Configuration row 52: line, adjust I52, price, publish.",
    ],
  },

  "pm-match-sixes": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — per-player sixes (Prep Work P) + team totals + match adjust feed MatchSixes; Market Configuration row 53.",
    readinessSummary:
      "Connected — player 6s column, raw runs, team sixes totals and adjusts are on Player Adjustment.",
    fromPlayerAdjustment: [
      "Per-player expected sixes (Prep Work P24:P34 / P45:P55)",
      "Team sixes totals (P36 / P57)",
      "Raw runs (M) used in P sixes formula chain",
    ],
    extraEvaluationInputs: [
      {
        id: "player-sixes",
        label: "Per-player sixes expectation (×22)",
        status: "have",
        detail: "SUM P both teams → GetTeamSixes() home + away before MatchSixes adjust.",
        source: "Prep Work P24:P34, P45:P55 → P36 + P57",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-sixes-variance",
        label: "MatchSixes variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider",
      },
    ],
    marketConfiguration: [
      "Row 53: line F53, under/over G/H, adjust I53 (MatchSixes).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → per-player P sixes + team totals in evaluation.",
      "✓ MatchSixes.GetMarkets → line + U/O.",
      "✓ Market Configuration row 53: line, adjust I53, price, publish.",
    ],
  },

  "pm-most-fours": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — team fours from player O columns feed Most Fours H2H; Market Configuration rows 95–97.",
    readinessSummary:
      "Connected — same player/team fours pipeline as Match Fours; 3-way which team hits more fours.",
    fromPlayerAdjustment: [
      "Team fours totals from SUM(player O) both sides",
    ],
    extraEvaluationInputs: [
      {
        id: "team-fours-race",
        label: "Home / away team fours expectation",
        status: "have",
        detail: "GetTeamFours() each side — race / H2H for Most Fours.",
        source: "Prep Work O36 / O57",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    marketConfiguration: [
      "Rows 95–97: Most Fours 3-way (home / away / tie).",
      "Trader adjust on purple I column where present.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → team fours from per-player O.",
      "✓ Most Fours Lambda / H2H from team fours expectations.",
      "✓ Market Configuration rows 95–97.",
    ],
  },

  "pm-most-sixes": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — team sixes from player P columns feed Most Sixes H2H; Market Configuration rows 98–100.",
    readinessSummary:
      "Connected — same player/team sixes pipeline as Match Sixes; 3-way which team hits more sixes.",
    fromPlayerAdjustment: [
      "Team sixes totals from SUM(player P) both sides",
    ],
    extraEvaluationInputs: [
      {
        id: "team-sixes-race",
        label: "Home / away team sixes expectation",
        status: "have",
        detail: "GetTeamSixes() each side — race / H2H for Most Sixes.",
        source: "Prep Work P36 / P57",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    marketConfiguration: [
      "Rows 98–100: Most Sixes 3-way (home / away / tie).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → team sixes from per-player P.",
      "✓ Most Sixes Lambda / H2H from team sixes expectations.",
      "✓ Market Configuration rows 98–100.",
    ],
  },

  "pm-highest-individual-score": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — MatchHighScore → line F75; trader adjust I75 (HighestIndividualScore); Market Configuration row 75.",
    readinessSummary:
      "Connected — MatchHighScore feeds line + U/O; single adjust cell I75.",
    fromPlayerAdjustment: [
      "Per-player expected runs → MatchHighScore (Prep Work)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-high-score-line",
        label: "MatchHighScore line",
        status: "have",
        detail: "Line = Round(MatchHighScore) + adjust + 0.5; U/O either side.",
        source: "Prep Work row 9 / excel-mappings Z9",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "Row 75: line F75, under/over, adjust I75 (HighestIndividualScore).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → per-player expected runs → MatchHighScore.",
      "✓ MatchHighScore.GetMarkets → line + U/O.",
      "✓ Market Configuration row 75: line, adjust I75, price, publish.",
    ],
  },

  "pm-highest-opening-partnership": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — 3-way race (home/away/tie); adjust cells I92 (home) + I94 (tie); Market Configuration rows 92–94.",
    readinessSummary:
      "Connected — ShiftedPoissonGamma on opener ExpectedRuns feeds 3-way HOP race; home + tie adjusts.",
    fromPlayerAdjustment: [
      "Home opener ExpectedRuns (Prep Work)",
      "Away opener ExpectedRuns (Prep Work)",
    ],
    extraEvaluationInputs: [
      {
        id: "hop-race",
        label: "HighestOpeningPartnership race",
        status: "have",
        detail:
          "homeProb + homeAdj/100 − tieAdj/100; awayProb − homeAdj/100. Test/FC market prefixed \"1st Innings\".",
        source: "excel-mappings rows 92–94",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "Rows 92–94: 3-way home/away/tie.",
      "Adjust: I92 (home/away shift), I94 (tie shift).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → opener ExpectedRuns both sides.",
      "✓ HighestOpeningPartnership.GetMarkets → 3-way probabilities.",
      "✓ Market Configuration rows 92–94: probs, adjusts I92 + I94, price, publish.",
    ],
  },

  "pm-match-max-over": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — MatchMaxOver feeds line F55; trader adjust I55 (MaxRunsInOver); Market Configuration row 55.",
    readinessSummary:
      "Connected — MatchMaxOver evaluation feeds the line and U/O market, matching the sheet.",
    fromPlayerAdjustment: [
      "Match max-over expectation (Prep Work Z3 / T3 Match Max Over model column)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-max-over-line",
        label: "MatchMaxOver line",
        status: "have",
        detail:
          "Poisson line uses Round(total - 0.8) + 0.5, then prices under/over around that line.",
        source: "Prep Work Z3 / PM Publication F55",
      },
    ],
    backendOnly: defaultBackendLookups.filter(
      (x) => x.id === "format" || x.id === "overs"
    ),
    marketConfiguration: [
      "Row 55: line F55, under/over G55/H55, adjust I55 (MaxRunsInOver).",
    ],
    wiringSteps: [
      "✓ Player Adjustment / Prep Work → MatchMaxOver in evaluation.",
      "✓ MatchMaxOver.GetMarkets → line + U/O.",
      "✓ Market Configuration row 55: line, adjust I55, price, publish.",
    ],
  },

  "pm-match-ducks": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsDucks sum (2×O16) → MatchDucks line F56; trader adjust I56; Market Configuration row 56.",
    readinessSummary:
      "Connected — team innings ducks feed the match U/O line (limited overs: 2×O16; Test/FC: MatchEvaluation.MatchDucks).",
    fromPlayerAdjustment: [
      "Home / away InningsDucks (Prep Work O16 per-innings blend)",
      "Match ducks adjust (MatchAdjustments.MatchDucks ÷10)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-ducks-total",
        label: "InningsDucks sum (limited overs)",
        status: "have",
        detail:
          "team1.InningsDucks + team2.InningsDucks + MatchDucks adjust÷10; Test/FC uses MatchEvaluation.MatchDucks.",
        source: "Prep Work O16 × 2 → PM Publication F56",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-ducks-variance",
        label: "MatchDucks variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('MatchDucks')",
      },
    ],
    marketConfiguration: [
      "Row 56: line F56, under/over G56/H56, adjust I56 (MatchDucks).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsDucks both teams in evaluation.",
      "✓ MatchDucks.GetMarkets → line + U/O.",
      "✓ Market Configuration row 56: line, adjust I56, price, publish.",
    ],
  },

  "pm-match-wides": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsWides sum (W38+W59) → MatchWides line F57; trader adjust I57; Market Configuration row 57.",
    readinessSummary:
      "Connected — team innings wides feed the match U/O line.",
    fromPlayerAdjustment: [
      "Home / away InningsWides (Prep Work W38 / W59)",
      "Match wides adjust (MatchAdjustments.MatchWides)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-wides-total",
        label: "InningsWides sum (limited overs)",
        status: "have",
        detail:
          "team1.InningsWides + team2.InningsWides + MatchWides adjust; Test/FC uses MatchEvaluation.MatchWides.",
        source: "Prep Work W38 + W59 → PM Publication F57",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-wides-variance",
        label: "MatchWides variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('MatchWides')",
      },
    ],
    marketConfiguration: [
      "Row 57: line F57, under/over G57/H57, adjust I57 (MatchWides).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsWides both teams in evaluation.",
      "✓ MatchWides.GetMarkets → line + U/O.",
      "✓ Market Configuration row 57: line, adjust I57, price, publish.",
    ],
  },

  "pm-match-extras": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — ExtrasPrediction sum (M35+M56) → MatchExtras line F58; trader adjust I58; Market Configuration row 58.",
    readinessSummary:
      "Connected — team extras predictions feed the match U/O line.",
    fromPlayerAdjustment: [
      "Home / away ExtrasPrediction (Prep Work M35 / M56)",
      "Match extras adjust (MatchAdjustments.MatchExtras)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-extras-total",
        label: "ExtrasPrediction sum (limited overs)",
        status: "have",
        detail:
          "team1.ExtrasPrediction + team2.ExtrasPrediction + MatchExtras adjust (rounded 2dp); Test/FC uses MatchEvaluation.MatchExtras.",
        source: "Prep Work M35 + M56 → PM Publication F58",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-extras-variance",
        label: "MatchExtras variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line (ODI fallback).",
        source: "LookupProvider GetVarianceParameters('MatchExtras')",
      },
    ],
    marketConfiguration: [
      "Row 58: line F58, under/over G58/H58, adjust I58 (MatchExtras).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → ExtrasPrediction both teams in evaluation.",
      "✓ MatchExtras.GetMarkets → line + U/O.",
      "✓ Market Configuration row 58: line, adjust I58, price, publish.",
    ],
  },

  "pm-team-fours": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — GetTeamFours() from player O columns + innings fours adjust; Market Configuration NZ 155–157 / SA 221–223.",
    readinessSummary:
      "Connected — per-team fours totals and adjusts are on Player Adjustment.",
    fromPlayerAdjustment: [
      "Per-player expected fours (Prep Work O)",
      "Team fours totals (O36 / O57)",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-fours-adjust",
        label: "InningsFours adjust",
        status: "have",
        detail: "GetTeamFours() + InningsAdjustmentsPM.InningsFours; three lines (middle ± max(round(expected/10),1)).",
        source: "Prep Work team fours totals + innings adjust",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "NZ 155–157 / SA 221–223: three U/O lines per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → team fours from per-player O.",
      "✓ TeamFours.GetMarkets → three lines + U/O.",
      "✓ Market Configuration team fours rows.",
    ],
  },

  "pm-team-sixes": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Initially mapped — GetTeamSixes() from player P columns; Market Configuration NZ 158–160 / SA 224–226.",
    readinessSummary:
      "Connected — per-team sixes totals are on Player Adjustment.",
    fromPlayerAdjustment: [
      "Per-player expected sixes (Prep Work P)",
      "Team sixes totals (P36 / P57)",
    ],
    extraEvaluationInputs: [
      {
        id: "team-sixes-total",
        label: "GetTeamSixes()",
        status: "have",
        detail: "Three lines per team; middle ± 1. No innings sixes adjust in Lambda.",
        source: "Prep Work P36 / P57",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "NZ 158–160 / SA 224–226: three U/O lines per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → team sixes from per-player P.",
      "✓ TeamSixes.GetMarkets → three lines + U/O.",
      "✓ Market Configuration team sixes rows.",
    ],
  },

  "pm-team-ducks": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsDucks + InningsDucks adjust÷10 per team; Market Configuration NZ 164 / SA 230.",
    readinessSummary:
      "Connected — each team's innings ducks from Prep Work O16 blend.",
    fromPlayerAdjustment: [
      "Home / away InningsDucks (Prep Work O16 per-innings blend)",
      "Innings InningsDucks adjust per side (÷10)",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-ducks",
        label: "InningsDucks + adjust÷10",
        status: "have",
        detail:
          "expected = team.InningsDucks + innings InningsDucks/10; Poisson line; skipped if ≤0.",
        source: "Prep Work O16 → PM Publication NZ 164 / SA 230",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "team-ducks-variance",
        label: "MatchDucks variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('MatchDucks')",
      },
    ],
    marketConfiguration: [
      "NZ 164 / SA 230: line, under/over, InningsDucks adjust÷10 per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsDucks both teams in evaluation.",
      "✓ TeamDucks.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 164 / SA 230.",
    ],
  },

  "pm-team-max-over": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsMaxOver + MaxRunsInOver adjust per team; Market Configuration NZ 162 / SA 228.",
    readinessSummary:
      "Connected — per-team max over runs from InningsMaxOver + innings adjust.",
    fromPlayerAdjustment: [
      "Home / away InningsMaxOver (Prep Work T4 team max-over blend)",
      "Innings MaxRunsInOver adjust per side",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-max-over",
        label: "InningsMaxOver + MaxRunsInOver",
        status: "have",
        detail:
          "Poisson on InningsMaxOver + adjust; line Round(expected − 0.8) + 0.5; skipped if ≤0.",
        source: "Prep Work T4 → PM Publication NZ 162 / SA 228",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    marketConfiguration: [
      "NZ 162 / SA 228: line, under/over, MaxRunsInOver adjust per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsMaxOver both teams in evaluation.",
      "✓ TeamMaxOver.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 162 / SA 228.",
    ],
  },

  "pm-team-wides": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsWides + WidesBowled adjust per team; Market Configuration NZ 163 / SA 229.",
    readinessSummary:
      "Connected — each team's wides faced from Prep Work W38 / W59.",
    fromPlayerAdjustment: [
      "Home / away InningsWides (Prep Work W38 / W59)",
      "Innings WidesBowled adjust per side",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-wides",
        label: "InningsWides + WidesBowled",
        status: "have",
        detail:
          "expected = team.InningsWides + innings WidesBowled; line Round(expected − 0.8).",
        source: "Prep Work W38 / W59 → PM Publication NZ 163 / SA 229",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "team-wides-variance",
        label: "MatchWides variance lookup",
        status: "lookup",
        detail: "Same MatchWides Poisson-gamma variance as the match market.",
        source: "LookupProvider GetVarianceParameters('MatchWides')",
      },
    ],
    marketConfiguration: [
      "NZ 163 / SA 229: line, under/over, WidesBowled adjust per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsWides both teams in evaluation.",
      "✓ TeamWides.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 163 / SA 229.",
    ],
  },

  "pm-team-extras": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — ExtrasPrediction + InningsExtras adjust per team; Market Configuration NZ 165 / SA 231.",
    readinessSummary:
      "Connected — each team's innings extras from Prep Work M35 / M56.",
    fromPlayerAdjustment: [
      "Home / away ExtrasPrediction (Prep Work M35 / M56)",
      "Innings InningsExtras adjust per side",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-extras",
        label: "ExtrasPrediction + InningsExtras",
        status: "have",
        detail:
          "expected = team.ExtrasPrediction + innings InningsExtras; line Round(expected − 0.8).",
        source: "Prep Work M35 / M56 → PM Publication NZ 165 / SA 231",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "team-extras-variance",
        label: "MatchExtras variance lookup",
        status: "lookup",
        detail: "Same MatchExtras Poisson-gamma variance as the match market.",
        source: "LookupProvider GetVarianceParameters('MatchExtras')",
      },
    ],
    marketConfiguration: [
      "NZ 165 / SA 231: line, under/over, InningsExtras adjust per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → ExtrasPrediction both teams in evaluation.",
      "✓ TeamExtras.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 165 / SA 231.",
    ],
  },

  "pm-team-first-partnership": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — per-team opener ExpectedRuns → Fall of 1st Wicket line; Market Configuration NZ 147 / SA 213.",
    readinessSummary:
      "Connected — runs at fall of 1st wicket for both teams from opener evaluations.",
    fromPlayerAdjustment: [
      "Opener ExpectedRuns (or BT CAZ if T10) per team",
      "Batter run adjusts for openers + FallOfWicket innings adjust",
    ],
    extraEvaluationInputs: [
      {
        id: "team-opener-expected-runs",
        label: "Opener ExpectedRuns [0]/[1] per team",
        status: "have",
        detail:
          "Line = Round(0.5×(bat1+bat2)×formatMult × meanMedianMult + 0.5×batterAdj) + FallOfWicket; fixed 50/50 U/O.",
        source: "Player evaluation openers → PM Publication NZ 147 / SA 213",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    marketConfiguration: [
      "NZ 147 / SA 213: line, under/over, FallOfWicket + opener batsman adjusts.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → opener ExpectedRuns both teams.",
      "✓ TeamFirstPartnership.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 147 / SA 213.",
    ],
    uiNotes: ["Adjust shifts the line integer, not probability (÷100 pattern does not apply)."],
  },

  "pm-team-first-dismissal": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — per-team openers × opposition bowling dismissal rates; Market Configuration NZ 148–154 / SA 214–220.",
    readinessSummary:
      "Connected — team 1st wicket method of dismissal for both sides.",
    fromPlayerAdjustment: [
      "Opener BattingAverage + StrikeRate per team",
      "Opposition bowling DismissalMethodEvaluation (7 rates)",
    ],
    extraEvaluationInputs: [
      {
        id: "team-dismissal-rates",
        label: "Dismissal rates vs each batting side",
        status: "have",
        detail:
          "Both openers × opposition bowling rates, each weighted ÷2. No PM trader adjusts in Lambda (unlike match FirstDismissal).",
        source: "Prep Work AD:AM → PM Publication NZ 148–154 / SA 214–220",
      },
    ],
    backendOnly: [
      {
        id: "team-batter-runs-lookup",
        label: "BatterRuns / StrikeRate lookups",
        status: "lookup",
        detail: "Same opener par lookups as match FirstDismissal.",
        source: "LookupProvider",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format" || x.id === "overs"),
    ],
    marketConfiguration: [
      "NZ 148–154 / SA 214–220: seven selections per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → openers + dismissal rates both sides.",
      "✓ TeamFirstDismissal.GetMarkets → home + away 7-way probs.",
      "✓ Market Configuration NZ 148–154 / SA 214–220.",
    ],
    uiNotes: [
      "7-way partition — one prob per row, not under/over.",
      "No purple I adjust applied inside Lambda for the team market.",
    ],
  },

  "pm-player-runs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — ExpectedRuns = Prep Raw (M) × position ratioConstant → line; Market Configuration rows 257–266.",
    readinessSummary:
      "Connected — player runs from Raw (M), not bt.caz; BatsmanRuns on line.",
    fromPlayerAdjustment: [
      "Per-player ExpectedRuns / Raw (Prep Work M24:M34 / M45:M55)",
      "Batting position for GetRatioConstant",
      "BatsmanRuns adjust per player (added to rounded line)",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-runs-raw",
        label: "ExpectedRuns (Raw M)",
        status: "have",
        detail:
          "line = Round(ratioConstant × ExpectedRuns) + Round(BatsmanRuns); published +0.5. Ratio by bat position (T20 ~0.72 / 0.75 / 0.78…).",
        source: "Prep Work M → PM Publication F257:F266",
      },
    ],
    backendOnly: [
      {
        id: "ratio-constant",
        label: "GetRatioConstant by batting position",
        status: "lookup",
        detail: "PlayerScores.GetRatioConstant(inputs, batPosition + indexAdjust).",
        source: "PlayerScores base class",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "Rows 257–266: line F, under G≈0.5, adjust I per playing batter.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → ExpectedRuns from Raw (M).",
      "✓ PlayerRuns.GetMarkets → line + U/O per batter.",
      "✓ Market Configuration rows 257–266.",
    ],
    uiNotes: [
      "Uses Raw (M), not bt.caz (L). Top Bat race uses bt.caz separately.",
    ],
  },

  "pm-player-fours": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — ExpectedFours (Prep Work O) → per-player U/O; Market Configuration rows 267–276.",
    readinessSummary:
      "Connected — player fours from Prep Work O column + BatsmanFours adjust.",
    fromPlayerAdjustment: [
      "Per-player ExpectedFours (Prep Work O24:O34 / O45:O55)",
      "BatsmanFours adjust per player (÷10 in Lambda)",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-fours",
        label: "ExpectedFours per batter",
        status: "have",
        detail:
          "Line = Round(ExpectedFours / 2); positions >3 may scale by match adjust; Poisson-gamma under.",
        source: "Prep Work O → PM Publication F267:F276 / G267:G276",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "player-fours-variance",
        label: "PlayerFours variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('PlayerFours')",
      },
    ],
    marketConfiguration: [
      "Rows 267–276: line F, under G, adjust I per playing batter.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → ExpectedFours from O column.",
      "✓ PlayerFours.GetMarkets → line + U/O per batter.",
      "✓ Market Configuration rows 267–276.",
    ],
  },

  "pm-player-sixes": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — ExpectedSixes (Prep Work P) → per-player U/O at line 0; Market Configuration rows 277–286.",
    readinessSummary:
      "Connected — player sixes from Prep Work P column + BatsmanSixes adjust.",
    fromPlayerAdjustment: [
      "Per-player ExpectedSixes (Prep Work P24:P34 / P45:P55)",
      "BatsmanSixes adjust per player (÷10 in Lambda)",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-sixes",
        label: "ExpectedSixes per batter",
        status: "have",
        detail:
          "Line 0 (F=0.5 placeholder); Poisson-gamma P(under 0.5); BatsmanSixes adjust÷10 added to expected.",
        source: "Prep Work P → PM Publication G277:G286",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "player-sixes-variance",
        label: "PlayerSixes variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O.",
        source: "LookupProvider GetVarianceParameters('PlayerSixes')",
      },
    ],
    marketConfiguration: [
      "Rows 277–286: under G (line 0 / F=0.5), adjust I per playing batter.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → ExpectedSixes from P column.",
      "✓ PlayerSixes.GetMarkets → U/O per batter.",
      "✓ Market Configuration rows 277–286.",
    ],
  },

  "pm-match-wickets": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — WicketsLost sum (U38+U59) → MatchWickets line F59; trader adjust I59; Market Configuration row 59.",
    readinessSummary:
      "Connected — match wickets from team wickets lost totals.",
    fromPlayerAdjustment: [
      "Home / away WicketsLost (Prep Work U38 / U59)",
      "Match wickets adjust (MatchAdjustments.MatchWickets)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-wickets-total",
        label: "WicketsLost sum (limited overs)",
        status: "have",
        detail:
          "team1.WicketsLost + team2.WicketsLost + MatchWickets adjust; Test/FC uses MatchEvaluation.MatchWickets. Line Round(total − 0.8) + 0.5.",
        source: "Prep Work U38 + U59 → PM Publication F59",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-wickets-variance",
        label: "Custom GetWicketVar",
        status: "lookup",
        detail: "Custom variance formula (not a named lookup table).",
        source: "MatchWickets.GetWicketVar",
      },
    ],
    marketConfiguration: [
      "Row 59: line F59, under/over G59/H59, adjust I59 (MatchWickets).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → WicketsLost both teams in evaluation.",
      "✓ MatchWickets.GetMarkets → line + U/O.",
      "✓ Market Configuration row 59.",
    ],
  },

  "pm-match-top-batter": {
    readiness: "ready",
    connected: true,
    parityReview: true,
    connectedNote:
      "Wired end-to-end — MatchTopBatter race distribution does not yet match Atlas PM Publication rows 439–460; model differences need review.",
    readinessSummary:
      "Wired — review — match top bat race; PM row QA and player-level parity still open.",
    fromPlayerAdjustment: [
      "Per-player run expectations (TopBatterMethods.GetPlayerRuns)",
      "Conditions (D3)",
      "Squad batting order for GetMatchTopBatMinimumLookup",
    ],
    extraEvaluationInputs: [
      {
        id: "match-top-bat-rows",
        label: "PM Publication row range",
        status: "need",
        detail: "Rows 439–460 — outcome set must match Atlas race probs across all batters.",
        source: "PM Publication — Match Top Bat.",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "match-top-bat-variance",
        label: "PlayerRuns / ZeroProb variance lookups",
        status: "lookup",
        detail: "Poisson-gamma race distribution (cap 500) with minimum probability floor.",
        source: "LookupProvider",
      },
    ],
    marketConfiguration: [
      "Rows 439–460: per-player match top bat probability.",
      "Top 22 normalized; extras scaled by totalProb.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → player run expectations in evaluation.",
      "✓ MatchTopBatter.GetMarkets → match-wide race outcome set.",
      "○ QA parity vs Atlas PM Publication rows before marking matched.",
    ],
    blockers: ["Exact PM Publication row range for match top bat"],
  },

  "pm-match-top-bowler": {
    readiness: "ready",
    connected: true,
    parityReview: true,
    connectedNote:
      "Wired end-to-end — MatchTopBowler race distribution does not yet match Atlas PM Publication rows 471+; player adjusts and model differences need review.",
    readinessSummary:
      "Wired — review — match top bowl race; player adjusts (0.00 placeholders) and PM row QA still open.",
    fromPlayerAdjustment: [
      "Per-bowler expected wickets (GetExpectedWickets)",
      "Opposition batting rating for wicketAdjust",
      "Conditions (D3)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-top-bowl-rows",
        label: "PM Publication row range",
        status: "need",
        detail: "Rows 471+ — outcome set must match Atlas race probs across bowlers.",
        source: "PM Publication — Match Top Bowler.",
      },
      {
        id: "match-top-bowl-adjusts",
        label: "Player-level adjusts",
        status: "need",
        detail: "Player level adjustments currently 0.00 placeholders in Lambda.",
        source: "registry-ext missingForParity",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "Rows 471+: per-player match top bowl probability.",
      "Top 22 normalized first; extras scaled by totalProb.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → bowler expected wickets in evaluation.",
      "✓ MatchTopBowler.GetMarkets → match-wide race outcome set.",
      "○ QA parity vs Atlas PM Publication rows before marking matched.",
    ],
    blockers: [
      "Player level adjustments (currently 0.00 placeholders)",
      "Exact PM Publication row range",
    ],
  },

  "pm-group-wickets": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — WicketsLost × format/group multipliers → wickets in first N overs; Market Configuration rows 41–43.",
    readinessSummary:
      "Connected — wickets in first N overs (match) from team wickets lost.",
    fromPlayerAdjustment: [
      "Home / away WicketsLost",
      "Conditions + batting/bowling factors",
      "First/Second/ThirdGroupWickets adjusts (÷10 in Lambda)",
    ],
    extraEvaluationInputs: [
      {
        id: "group-wickets-means",
        label: "Group wickets means (6/8/10 T20)",
        status: "have",
        detail:
          "Averaged across both teams from WicketsLost × group multipliers; line Round(mean − 0.8) + 0.5.",
        source: "Prep Work U38/U59 + factors → PM Publication F41–F43",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "group-wickets-variance",
        label: "GroupWickets variance lookup",
        status: "lookup",
        detail: "Poisson-gamma variance for U/O line.",
        source: "LookupProvider GetVarianceParameters('GroupWickets')",
      },
    ],
    marketConfiguration: [
      "Rows 41–43 (T20: 6/8/10 overs): line F, under/over, group wicket adjusts I41+.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → WicketsLost + ratings/conditions.",
      "✓ GroupWickets.GetMarkets → lines + U/O.",
      "✓ Market Configuration rows 41–43.",
    ],
  },

  "pm-match-run-outs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsRunOuts sum (U36+U57) → MatchRunOuts line F54; trader adjust I54 (÷10); Market Configuration row 54.",
    readinessSummary:
      "Connected — match run outs from team innings run outs totals.",
    fromPlayerAdjustment: [
      "Home / away InningsRunOuts (Prep Work U36 / U57)",
      "Match run outs adjust (MatchAdjustments.MatchRunOuts ÷ 10)",
    ],
    extraEvaluationInputs: [
      {
        id: "match-run-outs-total",
        label: "InningsRunOuts sum (limited overs)",
        status: "have",
        detail:
          "team1.InningsRunOuts + team2.InningsRunOuts + MatchRunOuts/10; Test/FC uses MatchEvaluation.MatchRunOuts. Line Round(total − 0.8) + 0.5.",
        source: "Prep Work U36 + U57 → PM Publication F54",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "Row 54: line F54, under/over G54/H54, adjust I54 (MatchRunOuts ÷10).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsRunOuts both teams in evaluation.",
      "✓ MatchRunOuts.GetMarkets → line + U/O.",
      "✓ Market Configuration row 54.",
    ],
  },

  "pm-team-run-outs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — InningsRunOuts + adjust÷10 per team; Market Configuration NZ 161 / SA 227.",
    readinessSummary:
      "Connected — each team's innings run outs from Prep Work U36 / U57.",
    fromPlayerAdjustment: [
      "Home / away InningsRunOuts (Prep Work U36 / U57)",
      "Innings InningsRunOuts adjust per side (÷10)",
    ],
    extraEvaluationInputs: [
      {
        id: "innings-run-outs",
        label: "InningsRunOuts + adjust÷10",
        status: "have",
        detail:
          "Poisson P(X≤0); line 0.5; expected from team.InningsRunOuts + innings adjust/10.",
        source: "Prep Work U36 / U57 → PM Publication NZ 161 / SA 227",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: [
      "NZ 161 / SA 227: line 0.5, under/over, InningsRunOuts adjust÷10 per team.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → InningsRunOuts both teams in evaluation.",
      "✓ TeamRunOuts.GetMarkets → home + away lines + U/O.",
      "✓ Market Configuration NZ 161 / SA 227.",
    ],
  },

  "pm-team-wickets": {
    readiness: "ready",
    connected: true,
    parityReview: true,
    connectedNote:
      "Wired end-to-end — Lambda TeamWickets mean uses GetTeamRawWickets/wicketAdjust (~1.1); Atlas uses opposition WicketsLost × n_max/V (~7.0). Model differences need review.",
    readinessSummary:
      "Wired — review — mean formula in TeamWickets.cs does not match Atlas PM Pricing I632/I807.",
    fromPlayerAdjustment: [
      "Bowling XI per-bowler V (overs) and X (wicket rate) on Prep Work rows 24–34 / 45–55",
      "Opposition WicketsLost totals (Prep Work U38 / U59 → F25 / F46)",
      "Opposition overs sum (Prep Work V38 / V59)",
      "Format overs cap (n_max_original)",
    ],
    extraEvaluationInputs: [
      {
        id: "team-wickets-atlas-mean-nz",
        label: "NZ wickets lost mean (Atlas)",
        status: "have",
        detail:
          "F46 × (n_max_original / V59) + I166 = U59 × 20/19 ≈ 6.92 on NZ v SA. Uses SA bowling stack, not NZ.",
        source: "PM Pricing I632 → PM Publication F166/G166",
      },
      {
        id: "team-wickets-atlas-mean-sa",
        label: "SA wickets lost mean (Atlas)",
        status: "have",
        detail:
          "F25 × (n_max_original / V38) + I232 = U38 × 20/19.2 ≈ 7.15. Uses NZ bowling stack, not SA.",
        source: "PM Pricing I807 → PM Publication F232/G232",
      },
      {
        id: "team-wickets-lambda-mean",
        label: "Lambda mean today (wrong for Atlas)",
        status: "need",
        detail:
          "bowlingTeam.GetTeamRawWickets() / wicketAdjust + battingTeam.InningsRunOuts ≈ 1.1 — line would be ~1.5, not 6.5.",
        source: "TeamWickets.GetTeamWickets",
      },
      {
        id: "team-raw-wickets-prep",
        label: "GetTeamRawWickets() Prep Work source",
        status: "have",
        detail:
          "Σ(V×X) across active bowlers — e.g. NZ XI SUM(V24:V34)=6.05. Per-bowler U25=V25×X25/(I4−BW6)×1.05.",
        source: "Prep Work V/X columns; U38=SUM(U24:U34)+U36(run outs)",
      },
    ],
    backendOnly: [
      ...defaultBackendLookups.filter((x) => x.id === "format"),
      {
        id: "team-wickets-variance",
        label: "Poisson-gamma variance (aligned)",
        status: "lookup",
        detail: "mean² / (−BA10 × next) + mean — same structure as Lambda; line Round(mean−0.8)+0.5 matches.",
        source: "PM Pricing J632/J807",
      },
    ],
    marketConfiguration: [
      "NZ row 166: F166 line, G166/H166 U/O, adjust I166 on mean (PM Pricing I632).",
      "SA row 232: F232 line, G232/H232 U/O, adjust I232 on mean (PM Pricing I807).",
    ],
    wiringSteps: [
      "✓ Player Adjustment → per-bowler V/X and WicketsLost (U38/U59) in evaluation.",
      "✓ TeamWickets.GetMarkets → NZ 166 / SA 232 lines + U/O in Market Configuration.",
      "○ Replace Lambda mean with bowlingTeam.WicketsLost × (n_max / oversBowledTotal) + adjust.",
      "○ Wire I166/I232 trader adjust on mean (direct, not ÷10) before marking matched.",
    ],
    blockers: [
      "Lambda mean must switch from GetTeamRawWickets/wicketAdjust to cross-team WicketsLost × n_max/V",
      "Trader adjust I166/I232 not in Lambda",
    ],
  },

  "pm-first-ball-runs": {
    readiness: "ready",
    connected: true,
    connectedNote:
      "Mapped — FirstBallRuns lookup from avg FirstOver (+ FirstOver÷10); lines 0.5/1.5/3.5; FirstDelivery1–3 ÷100 on under; Market Configuration rows 35–37.",
    readinessSummary:
      "Connected — runs off first delivery from FirstOver mean + first-ball lookup.",
    fromPlayerAdjustment: [
      "Home / away FirstOver (team evaluation)",
      "Match FirstOver adjust (÷10 on mean)",
    ],
    extraEvaluationInputs: [
      {
        id: "first-over-mean",
        label: "Avg FirstOver + FirstOver÷10",
        status: "have",
        detail:
          "mean = 0.5×(team1.FirstOver + team2.FirstOver) + MatchAdjustments.FirstOver/10; Round to 2dp; cap 7.6.",
        source: "Prep Work FirstOver both teams → lookup key",
      },
      {
        id: "first-delivery-adjusts",
        label: "FirstDelivery1 / 2 / 3",
        status: "have",
        detail:
          "Per-line under skew ÷100 (lines 0 / 1 / 3 → I35 / I36 / I37). Applied in Lambda before publish.",
        source: "PM Publication I35–I37",
      },
    ],
    backendOnly: [
      {
        id: "first-ball-lookup",
        label: "Limited overs / Test first-ball lookup",
        status: "lookup",
        detail:
          "GetLimitedOversFirstBallLookup / GetTestMatchFirstBallLookup — keyed by line (0|1|3) and firstOver 1dp.",
        source: "LookupProvider",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "Rows 35–37: fixed lines F35=0.5, F36=1.5, F37=3.5; under/over G/H; adjusts I35–I37 → FirstDelivery1–3.",
      "Specifiers: innings 1, over 1, delivery 1; market code 0RINB50A.",
    ],
    wiringSteps: [
      "✓ Player Adjustment → FirstOver both teams in evaluation.",
      "✓ FirstBallRuns.GetMarkets → three U/O lines + lookup.",
      "✓ Market Configuration rows 35–37.",
    ],
  },
};

const defaultWiring: IntegrationWiringGuide = {
  readiness: "blocked",
  readinessSummary: "Wiring checklist not yet documented — review registry inputs and Prep Work refs.",
  fromPlayerAdjustment: [
    "Team conditions, batting/bowling factors (if market uses team ratings)",
    "Per-player data as listed in registry staticInputs",
  ],
  extraEvaluationInputs: [],
  backendOnly: defaultBackendLookups,
  marketConfiguration: defaultMarketConfigSteps,
  wiringSteps: [
    "Map registry inputs to Player Adjustment exports.",
    "Identify Prep Work ranges in registry excelRef fields not yet in UI.",
    "Call Lambda; wire Market Configuration rows from excel-mappings.ts.",
  ],
};

export function getIntegrationWiring(registryModelId: string): IntegrationWiringGuide {
  return wiringByRegistryId[registryModelId] ?? defaultWiring;
}

export function listConnectedMarkets(): string[] {
  return Object.entries(wiringByRegistryId)
    .filter(([, guide]) => isWiringMatched(guide))
    .map(([id]) => id);
}

export function listParityReviewMarkets(): string[] {
  return Object.entries(wiringByRegistryId)
    .filter(([, guide]) => guide.connected && guide.parityReview)
    .map(([id]) => id);
}

export function listMarketsByReadiness(): Record<IntegrationReadiness, string[]> {
  const out: Record<IntegrationReadiness, string[]> = {
    ready: [],
    ready_soon: [],
    blocked: [],
  };
  for (const [id, guide] of Object.entries(wiringByRegistryId)) {
    if (guide.connected) continue;
    out[guide.readiness].push(id);
  }
  return out;
}
