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

export type IntegrationWiringGuide = {
  readiness: IntegrationReadiness;
  readinessSummary: string;
  /** Live in Market Configuration — Player Adjustment → Lambda → publish */
  connected?: boolean;
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
    readinessSummary: "Fixed 50/50 — no player data or adjusts required.",
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
      "Call TossWinner with minimal IPricingInputs (teams + format).",
      "Display fixed probabilities; price = 1/prob.",
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
    readinessSummary: "Spawned from match odds — no extra prep blocks.",
    fromPlayerAdjustment: ["Match betting probabilities"],
    extraEvaluationInputs: [],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: [
      "Rows 60–61: two-way team of top bat.",
      "Single adjust I60 (home skew ÷100).",
    ],
    wiringSteps: [
      "Price MatchBetting first; pass match market to TeamOfTopBat or call standalone.",
      "Blend 0.86/0.14 on match probs + adjust.",
    ],
  },

  "pm-team-of-top-bowl": {
    readiness: "ready",
    readinessSummary: "Same pattern as Team of Top Bat.",
    fromPlayerAdjustment: ["Match betting probabilities"],
    extraEvaluationInputs: [],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: ["Rows 62–63: two-way; adjust I62."],
    wiringSteps: ["Same as Team of Top Bat with format-dependent blend weights."],
  },

  "pm-first-partnership": {
    readiness: "ready_soon",
    readinessSummary: "Openers only — needs ExpectedRuns on positions 1–2 (likely already in evaluation if match price works).",
    fromPlayerAdjustment: [
      "Opener batting average (BT CAZ) — T10 uses average directly",
      "Opener ExpectedRuns — non-T10 uses ExpectedRuns from evaluation",
    ],
    extraEvaluationInputs: [
      {
        id: "expected-runs",
        label: "Opener ExpectedRuns",
        status: "need",
        detail: "Confirm evaluation maps player ratings → BatsmanEvaluation.ExpectedRuns for openers.",
        source: "PlayerEvaluation pipeline (same as match betting)",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "overs"),
    marketConfiguration: [
      "Row 44: line F44, adjust I44 (line nudge — adds directly to line in Lambda).",
      "U/O at 50/50 after line set.",
    ],
    wiringSteps: [
      "Verify openers [0],[1] have ExpectedRuns in payload.",
      "Call FirstPartnership; store line + apply adjust to line.",
    ],
    uiNotes: ["Adjust shifts the line integer, not probability (÷100 pattern does not apply)."],
  },

  "pm-fifty-first-innings": {
    readiness: "ready_soon",
    readinessSummary: "Single milestone probability from prep — may need Z5-style field on backend.",
    fromPlayerAdjustment: ["Conditions + team factors feed milestone calc"],
    extraEvaluationInputs: [
      {
        id: "fifty-prob",
        label: "FiftyInnings probability",
        status: "need",
        detail: "MatchEvaluation.FiftyInnings — from Prep Work Z5 or equivalent.",
        source: "Prep Work!Z5 / prep match stats block",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 67–68: Yes/No; adjust I67 (÷100 on Yes)."],
    wiringSteps: [
      "Export or compute FiftyInnings on evaluation build.",
      "Call FiftyInnings milestone model; Yes/No + adjust.",
    ],
  },

  "pm-hundred-first-innings": {
    readiness: "ready_soon",
    readinessSummary: "Same as Fifty — needs HundredInnings from Z7.",
    fromPlayerAdjustment: ["Conditions + team factors"],
    extraEvaluationInputs: [
      {
        id: "hundred-prob",
        label: "HundredInnings probability",
        status: "need",
        detail: "MatchEvaluation.HundredInnings from Prep Work Z7.",
        source: "Prep Work!Z7",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 71–72: Yes/No; adjust I71."],
    wiringSteps: ["Export HundredInnings; call HundredInnings model."],
  },

  "pm-hundred-match": {
    readiness: "ready_soon",
    readinessSummary: "Needs HundredMatch from Z8.",
    fromPlayerAdjustment: ["Conditions + team factors"],
    extraEvaluationInputs: [
      {
        id: "hundred-match-prob",
        label: "HundredMatch probability",
        status: "need",
        detail: "MatchEvaluation.HundredMatch from Prep Work Z8.",
        source: "Prep Work!Z8",
      },
    ],
    backendOnly: defaultBackendLookups.filter((x) => x.id === "format"),
    marketConfiguration: ["Rows 73–74: Yes/No; adjust I73."],
    wiringSteps: ["Export HundredMatch; call HundredMatch model."],
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

  "pm-first-dismissal": {
    readiness: "blocked",
    readinessSummary:
      "Player openers are covered, but team dismissal method rates are not on the batting screen — the main blocker.",
    fromPlayerAdjustment: [
      "Opener BattingAverage (BT CAZ) and StrikeRate (SR) for positions 1–2 each team",
      "NOT the composite Rating column — MOD uses raw avg/SR vs lookup standards",
    ],
    extraEvaluationInputs: [
      {
        id: "dismissal-rates-home",
        label: "Home bowling dismissal method rates (×7)",
        status: "need",
        detail: "Fielder, Bowled, Keeper, LBW, Run out, Stumped, Other — NZ bowling vs away batting.",
        source: "Prep Work AD4:AH9 → DismissalMethodEvaluation",
      },
      {
        id: "dismissal-rates-away",
        label: "Away bowling dismissal method rates (×7)",
        status: "need",
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
      "Paired ±1 between two methods transfers 0.01; lone +1 adds ~0.004 to that outcome.",
      "Derive price per selection from published prob.",
    ],
    wiringSteps: [
      "1. Player Adjustment → openers with BattingAverage + StrikeRate in payload.",
      "2. Add bowling-side DismissalMethodEvaluation (7 rates × 2 teams) — from historical blend or manual entry on bowling tab.",
      "3. Backend: attach lookup tables + format + OversAvailable.",
      "4. Call FirstDismissal → seven base probabilities (expect ~56% fielder, ~17% bowled on typical T20).",
      "5. Market Configuration: store 7 adjusts; renormalise; price; activate.",
    ],
    uiNotes: [
      "Grid template should be one prob per row, not Prob above/below — MOD is not under/over.",
      "Excel F45=0.5 is a placeholder line, not a real O/U market.",
      "Lambda applies adjusts inside the model today — decide: pass adjusts into Lambda on Get prices, or return base-only and renormalise on FE (same formula).",
    ],
    blockers: [
      "DismissalMethodEvaluation not persisted from Player Adjustment (bowling historical block AD:AM).",
    ],
  },

  "pm-group-runs": {
    readiness: "blocked",
    readinessSummary: "Needs trader-typed FirstGroup/SecondGroup means — not on player rating screen.",
    fromPlayerAdjustment: ["Team factors (indirect)"],
    extraEvaluationInputs: [
      {
        id: "first-group",
        label: "FirstGroup / SecondGroup per team",
        status: "need",
        detail: "Trader-typed expected runs in first 6/12 overs (T20) or 5/15 (ODI).",
        source: "Prep Work group means",
      },
    ],
    backendOnly: [
      {
        id: "group-runs-variance",
        label: "GroupRuns variance lookup",
        status: "lookup",
        detail: "Poisson-gamma for U/O line.",
        source: "LookupProvider",
      },
      ...defaultBackendLookups.filter((x) => x.id === "format"),
    ],
    marketConfiguration: [
      "Match rows 38–40; team rows 138+ with three lines per group.",
      "U/O at single line — not range buckets (0–19, 20–29 are separate Ranged products).",
    ],
    wiringSteps: ["Add group means UI or import from workbook before wiring GroupRuns."],
    blockers: ["FirstGroup/SecondGroup trader inputs missing from Player Adjustment."],
  },

  "pm-match-fours": {
    readiness: "blocked",
    readinessSummary: "Needs per-player fours expectation summed across all 22 players.",
    fromPlayerAdjustment: ["Player ratings exist but not necessarily fours column (O)"],
    extraEvaluationInputs: [
      {
        id: "player-fours",
        label: "Per-player fours expectation (×22)",
        status: "need",
        detail: "SUM O column both teams + match adjust.",
        source: "Prep Work O24:O34, O45:O55",
      },
    ],
    backendOnly: defaultBackendLookups,
    marketConfiguration: ["Row 52: line + adjust I52."],
    wiringSteps: ["Export InningsFours or player fours into evaluation before MatchFours."],
    blockers: ["Per-player fours not on current batting adjustment grid."],
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
    .filter(([, guide]) => guide.connected)
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
