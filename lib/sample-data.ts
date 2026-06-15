import type {
  ComparisonFixture,
  ModelDefinition,
  RegistrySummary,
  VariableDefinition,
} from "./types";
import { nzSaMatchMarket, nzSaPrepInputs, nzSaWorkbook } from "./workbooks/nz-sa-63406779";

const workbookRef = nzSaWorkbook.filename;


export const models: ModelDefinition[] = [
  {
    id: "pm-match-winner",
    name: "Match Betting (2-way)",
    description:
      "Pre-match win probabilities via MatchBetting race distribution. Primary Excel output on Prep Work.",
    market: "Match Market",
    marketCode: "2WMW",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "Prep Work", cell: "C10", description: "Home win probability" },
      { sheet: "Prep Work", cell: "D10", description: "Home decimal price" },
      { sheet: "Prep Work", cell: "C11", description: "Away win probability" },
      { sheet: "Prep Work", cell: "D11", description: "Away decimal price" },
      { sheet: "PM Publication", cell: "G20:G21", description: "Published 2-way match betting" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Prep Work!C10:D11" },
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.MatchBetting",
      },
    },
    status: "parity_check",
  },
  {
    id: "pm-first-dismissal",
    name: "Method of First Dismissal",
    description: "Blends opener profiles with team bowling dismissal rates.",
    market: "Dismissal",
    marketCode: "01MOPD",
    phase: "pre_match",
    sources: {
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.FirstDismissal",
      },
    },
    status: "migrating",
  },
  {
    id: "pm-first-partnership",
    name: "Runs in First Partnership",
    description: "Under/over line from opener expected runs and trader adjust.",
    market: "Partnership",
    marketCode: "01FONW",
    phase: "pre_match",
    sources: {
      lambda: {
        version: "main",
        location: "PreMatch.Models.Matches.FirstPartnership",
      },
    },
    status: "migrating",
  },
  {
    id: "pm-match-betting-3w",
    name: "Match Betting (3-way)",
    description: "Includes draw selection for Test cricket. Published from PM Publication.",
    market: "Match Market",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G14", description: "NZ probability" },
      { sheet: "PM Publication", cell: "G15", description: "SA probability" },
      { sheet: "PM Publication", cell: "G16", description: "Draw probability" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B14:H16" },
    },
    status: "migrating",
  },
  {
    id: "pm-tied-match",
    name: "Tied Match",
    description: "Pre-match tied match Yes/No — derived from match odds spread.",
    market: "Match Specials",
    marketCode: "64PINB",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G22", description: "Tied Yes probability" },
      { sheet: "PM Publication", cell: "G23", description: "Tied No probability" },
      { sheet: "PM Pricing", cell: "C4", description: "Also on PM Pricing tab" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B22:I23" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.TiedMatch" },
    },
    status: "parity_check",
  },
  {
    id: "pm-toss-win-double",
    name: "Toss/Win Double",
    description: "Home, away, and no-winner legs from match odds and toss value.",
    market: "Match Market",
    marketCode: "TWD",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G26:G28", description: "Three outcomes" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B26:I28" },
      lambda: { version: "main", location: "PreMatch.Models.Matches.TossWinDouble" },
    },
    status: "migrating",
  },
  {
    id: "pm-player-runs",
    name: "Player Runs",
    description: "Per-player run lines — one PM Publication row per squad member.",
    market: "Player Market",
    marketCode: "BARU",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Player - Runs rows" },
      lambda: { version: "main", location: "PreMatch.Models.Players.PlayerRuns" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-top-batter",
    name: "Match Top Bat",
    description: "Race market across all batters for match top scorer.",
    market: "Head to Heads",
    marketCode: "PMTRSNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Match Top Bat." },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchTopBatter" },
    },
    status: "migrating",
  },
  {
    id: "pm-match-top-bowler",
    name: "Match Top Bowler",
    description: "Race market across bowlers for match top wicket-taker.",
    market: "Head to Heads",
    marketCode: "PMTWTNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Match Top Bowler." },
      lambda: { version: "main", location: "PreMatch.Models.Matches.MatchTopBowler" },
    },
    status: "migrating",
  },
  {
    id: "pm-first-over",
    name: "First Over Runs",
    description: "Expected runs and over/under lines for the first over of each innings.",
    market: "Innings Segment",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Pricing", cell: "C14:D14", description: "First over 4.5 line" },
      { sheet: "PM Pricing", cell: "C15:D15", description: "First over 5.5 line" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Pricing!A7:D15" },
    },
    status: "migrating",
  },
  {
    id: "pm-totals",
    name: "Pre-match Totals / Groups",
    description: "Session and innings total markets published pre-match.",
    market: "Totals",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "H8", description: "Market count reference" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication — Pre Match Totals/Groups" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-of-top-bat",
    name: "Team of Top Bat",
    description:
      "Two-way head-to-head: which team provides the match top batter. Spawned from MatchBetting.",
    market: "Match Market",
    marketCode: "59BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G60:G61", description: "Home / away probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B60:I61" },
      lambda: { version: "main", location: "PreMatch.Models.HeadToHeads.TeamOfTopBat" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-of-top-bowl",
    name: "Team of Top Bowl",
    description:
      "Two-way head-to-head: which team provides the match top bowler. Format-dependent blend from match odds.",
    market: "Match Market",
    marketCode: "510BARUA",
    phase: "pre_match",
    excelOutputs: [
      { sheet: "PM Publication", cell: "G62:G63", description: "Home / away probabilities" },
    ],
    sources: {
      excel: { version: workbookRef, location: "PM Publication!B62:I63" },
      lambda: { version: "main", location: "PreMatch.Models.HeadToHeads.TeamOfTopBowl" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-top-batter",
    name: "Team Top Bat",
    description: "Per-team top batter race — home and away markets.",
    market: "Team Market",
    marketCode: "TBNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — {Team} - Top Bat" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamTopBatter" },
    },
    status: "migrating",
  },
  {
    id: "pm-team-top-bowler",
    name: "Team Top Bowl",
    description: "Per-team top bowler race — home and away markets.",
    market: "Team Market",
    marketCode: "BBNL",
    phase: "pre_match",
    sources: {
      excel: { version: workbookRef, location: "PM Publication — {Team} - Top Bowl" },
      lambda: { version: "main", location: "PreMatch.Models.Teams.TeamTopBowler" },
    },
    status: "migrating",
  },
  {
    id: "live-match-winner",
    name: "Match Winner (in-play)",
    description: "Win probability updated ball-by-ball during the match.",
    market: "Match Market",
    phase: "in_play",
    excelOutputs: [
      { sheet: "Pricing", cell: "TBD", description: "In-play match odds — to map" },
    ],
    sources: {
      excel: { version: workbookRef, location: "Pricing / UI" },
    },
    status: "migrating",
  },
  {
    id: "live-delivery-markets",
    name: "Delivery / Over Markets",
    description: "Boundary, wicket, odd/even and exact delivery markets per ball.",
    market: "Ball-by-ball",
    phase: "in_play",
    excelOutputs: [
      { sheet: "UI", cell: "D5", description: "Boundary probability" },
      { sheet: "UI", cell: "D6", description: "Wicket probability" },
      { sheet: "UI", cell: "D12:D17", description: "Exact delivery prices" },
    ],
    sources: {
      excel: { version: workbookRef, location: "UI!B4:D17" },
    },
    status: "migrating",
  },
  {
    id: "live-tied-match",
    name: "Tied Match (in-play)",
    description: "In-play tied match probability from current match state.",
    market: "Match Specials",
    phase: "in_play",
    excelOutputs: [{ sheet: "UI", cell: "D8", description: "Tied match probability" }],
    sources: {
      excel: { version: workbookRef, location: "UI!B8:D8" },
    },
    status: "migrating",
  },
];

export const variables: VariableDefinition[] = [
  ...nzSaPrepInputs.map((input) => {
    const lambdaNotes: Record<string, string> = {
      conditions: "MatchEvaluation.ConditionAdjustment",
      "batting-rating-nz": "TeamEvaluation.BattingRating (home)",
      "batting-rating-sa": "TeamEvaluation.BattingRating (away)",
      "bowling-rating-sa": "TeamEvaluation.BowlingRating (vs home)",
      "bowling-rating-nz": "TeamEvaluation.BowlingRating (vs away)",
            "total-factor-nz": "D4 × D5 × D3 → Prep Work!D6",
            "total-factor-sa": "I4 × I5 × D3 → Prep Work!I6",
            "expected-runs-nz": "TeamEvaluation.GetRunsExpected() when NZ bats → E6 = D6 × BT3",
            "expected-runs-sa": "TeamEvaluation.GetRunsExpected() when SA bats → J6 = I6 × BT3",
            "par-score": "Format par — BT3=165 (T20); Lambda T20Standard=163",
    };

    const modelIds: Record<string, string[]> = {
      conditions: ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "batting-rating-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "batting-rating-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "bowling-rating-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "bowling-rating-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "total-factor-nz": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "total-factor-sa": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
      "expected-runs-nz": ["pm-match-top-batter", "pm-team-top-batter"],
      "expected-runs-sa": ["pm-match-top-batter", "pm-team-top-batter"],
      "par-score": ["pm-match-winner", "pm-match-top-batter", "pm-team-top-batter"],
    };

    return {
      id: input.id,
      name: input.id.replace(/-/g, "_"),
      label: input.label,
      description: `Prep Work input feeding pre-match models. Cell ${input.cell}.${"notes" in input && input.notes ? ` ${input.notes}` : ""}`,
      scope: input.scope,
      dataType: "number" as const,
      modelIds: modelIds[input.id] ?? ["pm-match-winner"],
      sources: {
        excel: {
          present: true,
          defaultValue: input.value,
          notes: input.namedRange
            ? `${input.cell} (named: ${input.namedRange})`
            : input.cell,
        },
        lambda: {
          present: !["total-factor-nz", "total-factor-sa"].includes(input.id),
          notes: lambdaNotes[input.id] ?? "Not yet mapped",
        },
      },
      parity:
        input.id === "par-score"
          ? ("unverified" as const)
          : ("unverified" as const),
    };
  }),
  {
    id: "match-betting-adjust",
    name: "match_betting_adjust",
    label: "Match betting adjust",
    description: "Trader skew on home win probability (percentage points ÷ 100).",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-match-winner"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I20 (purple)" },
      lambda: {
        present: true,
        defaultValue: 0,
        notes: "AdjustmentsPM.MatchAdjustments.MatchBetting",
      },
    },
    parity: "unverified",
  },
  {
    id: "first-partnership-adjust",
    name: "first_partnership_adjust",
    label: "First partnership adjust",
    description: "Trader adjust added directly to partnership run line.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-first-partnership"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I44 (purple)" },
      lambda: {
        present: true,
        notes: "AdjustmentsPM.MatchAdjustments.FirstPartnership",
      },
    },
    parity: "unverified",
  },
  {
    id: "dismissal-adjusts",
    name: "dismissal_method_adjusts",
    label: "Dismissal method adjusts (×7)",
    description: "Trader adjusts for each first dismissal outcome type.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        defaultValue: 0,
        notes: "PM Publication!I45:I51 — one per selection (purple)",
      },
      lambda: {
        present: true,
        notes:
          "FielderCatch, Bowled, KeeperCatch, Lbw, RunOut, Stumped, Other",
      },
    },
    parity: "unverified",
  },
  {
    id: "dismissal-method-rates",
    name: "dismissal_method_rates",
    label: "Team dismissal method rates",
    description: "Bowling team method probabilities used in first dismissal model.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        notes: "Prep Work!AD3:AM18 — NZ bowling AD4:9, SA bowling AD12:17",
      },
      lambda: {
        present: true,
        notes: "TeamEvaluation.DismissalMethodEvaluation",
      },
    },
    parity: "unverified",
  },
  {
    id: "player-batting-rating",
    name: "player_batting_rating",
    label: "Player batting rating",
    description: "Per-player batting rating from Prep Work formulas; rolls up to team rating.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-match-winner", "pm-first-dismissal", "pm-first-partnership"],
    sources: {
      excel: {
        present: true,
        defaultValue: 1.4902291091098339,
        notes: "Prep Work!Q24 formula — rolls to team D4 via (BT3+SUM(Q24:Q34))/BT3",
      },
      lambda: {
        present: true,
        notes: "PlayerEvaluation.BatsmanEvaluation → ExpectedRuns / averages",
      },
    },
    parity: "unverified",
  },
  {
    id: "player-bowling-rating",
    name: "player_bowling_rating",
    label: "Player bowling rating",
    description: "Per-player bowling rating from Prep Work formulas.",
    scope: "parameter",
    dataType: "number",
    modelIds: ["pm-match-winner", "pm-first-dismissal"],
    sources: {
      excel: {
        present: true,
        defaultValue: -0.936,
        notes: "Prep Work!Z24 formula — rolls to team D5/I5 via (BT3-SUM(Z24:Z34))/BT3",
      },
      lambda: {
        present: true,
        notes: "PlayerEvaluation bowling side → team BowlingRating",
      },
    },
    parity: "unverified",
  },
  {
    id: "tied-match-adjust",
    name: "tied_match_adjust",
    label: "Tied match adjust",
    description: "Trader adjust on tied match Yes probability.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-tied-match"],
    sources: {
      excel: { present: true, defaultValue: 0, notes: "PM Publication!I22" },
      lambda: { present: true, notes: "AdjustmentsPM.MatchAdjustments.TiedMatch" },
    },
    parity: "unverified",
  },
  {
    id: "toss-value",
    name: "toss_value",
    label: "Toss value",
    description: "Skews toss/win double probabilities.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-toss-win-double"],
    sources: {
      excel: { present: true, notes: "PM Publication!I26 (labelled Toss value)" },
      lambda: { present: true, notes: "MatchEvaluation.TossValue" },
    },
    parity: "unverified",
  },
  {
    id: "batsman-runs-adjust",
    name: "batsman_runs_adjust",
    label: "Batsman runs adjust (per player)",
    description: "Line adjust on each player runs market.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["pm-player-runs"],
    sources: {
      excel: { present: true, notes: "PM Publication!I per player runs row" },
      lambda: { present: true, notes: "BatterAdjustmentsPM.BatsmanRuns" },
    },
    parity: "unverified",
  },
  {
    id: "toss-decision",
    name: "toss_decision",
    label: "Toss / decision",
    description: "Toss winner and bat/bowl decision — unset in this pre-match workbook.",
    scope: "parameter",
    dataType: "string",
    modelIds: ["pm-match-winner"],
    sources: {
      excel: { present: true, notes: "Match Info!B14:B15 — empty pre-match" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
  {
    id: "delivery-adjustment",
    name: "delivery_adjustment",
    label: "Delivery adjustment",
    description: "Trader skew on the current delivery market.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["live-delivery-markets"],
    sources: {
      excel: { present: true, notes: "UI!C11 Adj. column" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
  {
    id: "batter-in-for",
    name: "batter_in_for_adj",
    label: "Batter in-for adjustment",
    description: "Trader adjustment to batter reach-in-for lines.",
    scope: "trading_input",
    dataType: "number",
    modelIds: ["live-delivery-markets"],
    sources: {
      excel: { present: true, notes: "UI!E20 in-for column" },
      lambda: { present: false },
    },
    parity: "excel_only",
  },
];

export const comparisonFixtures: ComparisonFixture[] = [
  {
    id: nzSaWorkbook.id,
    match: `${nzSaWorkbook.homeTeam} vs ${nzSaWorkbook.awayTeam}`,
    format: nzSaWorkbook.format,
    venue: nzSaWorkbook.venue,
    phase: "pre_match",
    workbook: nzSaWorkbook.filename,
    comparedAt: new Date().toISOString(),
    inputs: Object.fromEntries(
      nzSaPrepInputs.map((i) => [i.id.replace(/-/g, "_"), i.value])
    ),
    outputs: nzSaMatchMarket.selections.flatMap((sel) => [
      {
        outputKey: `${sel.team.toLowerCase().replace(/\s+/g, "_")}_win_prob`,
        label: `${sel.team} win probability`,
        excelValue: sel.probability,
        lambdaValue: null,
        unit: "prob",
        tolerance: 0.005,
        excelRef: {
          sheet: "Prep Work",
          cell: sel.probabilityCell,
          description: "Probability column (C)",
        },
      },
      {
        outputKey: `${sel.team.toLowerCase().replace(/\s+/g, "_")}_price`,
        label: `${sel.team} decimal price`,
        excelValue: sel.price,
        lambdaValue: null,
        unit: "price",
        tolerance: 0.02,
        excelRef: {
          sheet: "Prep Work",
          cell: sel.priceCell,
          description: "Price column (D)",
        },
      },
    ]),
  },
];

export function getRegistrySummary(): RegistrySummary {
  const bothSources = models.filter(
    (m) => m.sources.excel && m.sources.lambda
  ).length;
  const excelOnly = models.filter(
    (m) => m.sources.excel && !m.sources.lambda
  ).length;
  const lambdaOnly = models.filter(
    (m) => m.sources.lambda && !m.sources.excel
  ).length;
  const preMatchModels = models.filter((m) => m.phase === "pre_match").length;
  const inPlayModels = models.filter((m) => m.phase === "in_play").length;

  const tradingInputsRequired = variables.filter(
    (v) => v.scope === "trading_input"
  ).length;
  const parityIssues = variables.filter((v) => v.parity !== "matched").length;

  const latest = comparisonFixtures[0];
  const outputMismatches = latest
    ? latest.outputs.filter((row) => {
        if (row.lambdaValue === null) return false;
        if (row.excelValue === null) return true;
        return Math.abs(row.excelValue - row.lambdaValue) > row.tolerance;
      }).length
    : 0;

  return {
    totalModels: models.length,
    preMatchModels,
    inPlayModels,
    excelOnly,
    lambdaOnly,
    bothSources,
    tradingInputsRequired,
    parityIssues,
    outputMismatches,
  };
}

export { nzSaWorkbook };
