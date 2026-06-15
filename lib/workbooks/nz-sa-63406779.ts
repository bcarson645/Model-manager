import type { WorkbookSnapshot } from "@/lib/types";

/** Extracted from: New Zealand v South Africa 63406779 (1).xlsm — pre-match state (T20) */
export const nzSaWorkbook: WorkbookSnapshot = {
  id: "nz-sa-63406779",
  filename: "New Zealand v South Africa 63406779 (1).xlsm",
  matchId: "63406779",
  homeTeam: "New Zealand",
  awayTeam: "South Africa",
  venue: "Seddon Park",
  format: "T20",
  phase: "pre_match",
};

export const nzSaMatchMarket = {
  marketType: "2W",
  sheet: "Prep Work",
  selections: [
    {
      team: "New Zealand",
      probability: 0.61036254423642,
      price: 1.6383705216561526,
      probabilityCell: "C10",
      priceCell: "D10",
    },
    {
      team: "South Africa",
      probability: 0.38963745576358,
      price: 2.5664883732501558,
      probabilityCell: "C11",
      priceCell: "D11",
    },
  ],
  alsoPublished: [
    { sheet: "PM Publication", probabilityCells: ["G14", "G15"], market: "Match Betting (3-Way)" },
    { sheet: "PM Publication", probabilityCells: ["G20", "G21"], market: "Match Betting (2-way)" },
  ],
};

export const nzSaPrepInputs = [
  {
    id: "conditions",
    label: "Conditions",
    cell: "Prep Work!D3",
    namedRange: null,
    value: 1.01,
    scope: "parameter" as const,
  },
  {
    id: "batting-rating-nz",
    label: "New Zealand Batting",
    cell: "Prep Work!D4",
    namedRange: "battingRating1",
    value: 1.0432168503317343,
    scope: "parameter" as const,
  },
  {
    id: "batting-rating-sa",
    label: "South Africa Batting",
    cell: "Prep Work!I4",
    namedRange: "battingRating2",
    value: 0.979307824664271,
    scope: "parameter" as const,
  },
  {
    id: "bowling-rating-sa",
    label: "South Africa Bowling",
    cell: "Prep Work!D5",
    namedRange: "bowlingRating1",
    value: 1.0090375757575758,
    scope: "parameter" as const,
  },
  {
    id: "bowling-rating-nz",
    label: "New Zealand Bowling",
    cell: "Prep Work!I5",
    namedRange: "bowlingRating2",
    value: 1.001520606060606,
    scope: "parameter" as const,
  },
  {
    id: "total-factor-nz",
    label: "Total Factor (NZ bat)",
    cell: "Prep Work!D6",
    namedRange: null,
    value: 1.0631714516646689,
    scope: "parameter" as const,
    notes: "D4 × D5 × D3 — batting × opposition bowling × conditions",
  },
  {
    id: "expected-runs-nz",
    label: "Expected Innings Runs (NZ)",
    cell: "Prep Work!E6",
    namedRange: null,
    value: 175.42328952467037,
    scope: "parameter" as const,
    notes: "D6 × BT3 — maps to TeamEvaluation.GetRunsExpected() when NZ bats",
  },
  {
    id: "total-factor-sa",
    label: "Total Factor (SA bat)",
    cell: "Prep Work!I6",
    namedRange: null,
    value: 0.9906049357384309,
    scope: "parameter" as const,
    notes: "I4 × I5 × D3",
  },
  {
    id: "expected-runs-sa",
    label: "Expected Innings Runs (SA)",
    cell: "Prep Work!J6",
    namedRange: null,
    value: 163.4498143968411,
    scope: "parameter" as const,
    notes: "I6 × BT3 — maps to TeamEvaluation.GetRunsExpected() when SA bats",
  },
  {
    id: "par-score",
    label: "Par score (format baseline)",
    cell: "Prep Work!BT3",
    namedRange: null,
    value: 165,
    scope: "embedded" as const,
    notes: "T20 par (165) × total factor for E6/J6 — aligns with Lambda T20Standard≈163",
  },
];

export const workbookSheets = {
  preMatch: [
    "Prep Work",
    "PM Publication",
    "PM Pricing",
    "PMO Data",
    "PMO Deliveries",
    "PM Book Transfer",
  ],
  inPlay: ["UI", "Scoring", "Pricing", "Input", "Scorecard"],
};
