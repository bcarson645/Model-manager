import type { ExcelTradingMapping } from "./types";
import { traderAdjustArchitecture } from "@/lib/workbooks/trader-adjust-conventions";

export type TraderSkewKind =
  | "none"
  | "probability_div100"
  | "multi_selection_renorm"
  | "line_direct";

export type TraderSkewGuide = {
  kind: TraderSkewKind;
  title: string;
  summary: string;
  feImplementation: string[];
  formula?: string;
  excelRefs: string[];
  pmPricingNotes?: string[];
  examples: Array<{ label: string; detail: string }>;
  selectionRows?: Array<{
    selection: string;
    row: number;
    adjustCell: string;
    probCell: string;
  }>;
};

const mod = traderAdjustArchitecture.multiSelection;

const guidesByModel: Record<string, Omit<TraderSkewGuide, "excelRefs"> & { excelRefs?: string[] }> = {
  "pm-first-dismissal": {
    kind: "multi_selection_renorm",
    title: "Multi-selection renormalisation (7 outcomes)",
    summary:
      "Each purple adjust adds I÷100 to that method’s weight, then the whole market is renormalised so probabilities still sum to 1. Paired ±1 on two rows transfers 0.01 between those outcomes.",
    feImplementation: [
      "Lambda returns 7 base probabilities (sum = 1).",
      "Store one adjust integer per selection (I45–I51).",
      "weight[i] = baseProb[i] + adjust[i] / 100",
      "publishedProb[i] = weight[i] / sum(weights)",
      "Recompute price from publishedProb; other selections shrink when one is boosted alone.",
    ],
    formula: mod.feFormula,
    pmPricingNotes: [...mod.flow],
    examples: [
      {
        label: "I45 = +1 only (Fielder Catch)",
        detail:
          "Fielder Catch rises ~+0.40% (not +1%), all other methods fall slightly — G60 becomes 1.01.",
      },
      {
        label: "I45 = +1 and I46 = −1",
        detail: "Transfers exactly 0.01 from Bowled to Fielder Catch; other methods unchanged.",
      },
    ],
    excelRefs: ["I45–I51", "G45–G51", "PM Pricing rows 53–59", "G60 = SUM(G53:G59)"],
  },
  "pm-team-first-dismissal": {
    kind: "multi_selection_renorm",
    title: "Multi-selection renormalisation (per team)",
    summary:
      "Same ÷100 weight + renormalise pattern as match MOD, on team blocks (NZ rows 148–154, SA 214–220). Lambda TeamFirstDismissal has no adjusts — FE-only skew if traders need parity with Excel.",
    feImplementation: [
      "Same weight / sum(weights) formula as match MOD.",
      "Apply per team market independently (7 methods each).",
    ],
    formula: mod.feFormula,
    examples: [
      {
        label: "Paired ±1",
        detail: "Use paired adjusts to move probability between two dismissal methods without changing team market total.",
      },
    ],
    excelRefs: ["I148–I154 (home)", "I214–I220 (away)"],
  },
  "pm-fifty-first-innings": {
    kind: "probability_div100",
    title: "Yes/No probability skew (÷100)",
    summary: "Adjust adds directly to Yes probability; No = 1 − Yes. Excel: G67 = Prep Work AB5 + I67/100.",
    feImplementation: [
      "Lambda returns base Yes probability.",
      "publishedYes = baseYes + adjustYes / 100 (clamp 0–1).",
      "publishedNo = 1 − publishedYes.",
    ],
    formula: "publishedYes = baseYes + I/100",
    examples: [
      {
        label: "I67 = +1",
        detail: "Yes prob +0.01; No prob −0.01.",
      },
    ],
    excelRefs: ["I67", "G67", "G68 = 1 − G67"],
  },
  "pm-hundred-first-innings": {
    kind: "probability_div100",
    title: "Yes/No probability skew (÷100)",
    summary: "Same pattern as Fifty in First Innings on rows 71–72.",
    feImplementation: [
      "publishedYes = baseYes + I71/100; publishedNo = 1 − publishedYes.",
    ],
    formula: "publishedYes = baseYes + I/100",
    examples: [{ label: "I71 = ±1", detail: "±0.01 on Yes probability." }],
    excelRefs: ["I71", "G71", "G72"],
  },
  "pm-hundred-match": {
    kind: "probability_div100",
    title: "Yes/No probability skew (÷100)",
    summary: "Same pattern on rows 73–74.",
    feImplementation: [
      "publishedYes = baseYes + I73/100; publishedNo = 1 − publishedYes.",
    ],
    formula: "publishedYes = baseYes + I/100",
    examples: [{ label: "I73 = ±1", detail: "±0.01 on Yes probability." }],
    excelRefs: ["I73", "G73", "G74"],
  },
  "pm-player-performance": {
    kind: "line_direct",
    title: "Line nudge (direct integer on F)",
    summary:
      "Player Perf adds column I directly to the offered line (not ÷100). Excel: F337 = PM Pricing B943 + I337.",
    feImplementation: [
      "Lambda returns base performance line and under probability.",
      "publishedLine = baseLine + adjust (integer runs/points on line).",
      "Reprice under/over from published line if your UX shows probability — or keep prob and nudge line only to match Excel.",
    ],
    formula: "publishedLine = baseLine + I",
    examples: [
      {
        label: "I337 = −3",
        detail: "Line drops by 3.0 (e.g. 30.5 → 27.5 before half-point rounding rules).",
      },
    ],
    excelRefs: ["I337–I346", "F337–F346", "G from PM Pricing C column"],
  },
  "pm-player-runs": {
    kind: "probability_div100",
    title: "Per-player row skew (÷100 on prob)",
    summary:
      "One purple cell per batter row (257–266). Typically skews the 50/50 under/over probability after line is set.",
    feImplementation: [
      "Store adjust per player row.",
      "Apply ÷100 to published under (or over) probability for that player market.",
    ],
    formula: "publishedProb = baseProb + I/100",
    examples: [{ label: "I257 = +1", detail: "±0.01 on that player’s published probability." }],
    excelRefs: ["I257–I266", "G257–G266"],
  },
  "pm-player-fours": {
    kind: "probability_div100",
    title: "Per-player fours skew (÷100)",
    summary: "Rows 267–276 — adjust skews published under/over probability per player.",
    feImplementation: ["publishedProb = baseProb + I/100 per row."],
    formula: "publishedProb = baseProb + I/100",
    examples: [],
    excelRefs: ["I267–I276"],
  },
  "pm-player-sixes": {
    kind: "probability_div100",
    title: "Per-player sixes skew (÷100)",
    summary: "Rows 277–286 — skew on under 0.5 sixes probability.",
    feImplementation: ["publishedProb = baseProb + I/100 per row."],
    formula: "publishedProb = baseProb + I/100",
    examples: [],
    excelRefs: ["I277–I286"],
  },
};

function defaultDiv100Guide(excel?: ExcelTradingMapping): TraderSkewGuide {
  const refs: string[] = [];
  if (excel?.adjustCell) refs.push(excel.adjustCell);
  if (excel?.adjustCells) refs.push(...excel.adjustCells);
  if (excel?.rows) refs.push(`rows ${excel.rows}`);

  return {
    kind: "probability_div100",
    title: "Probability / line skew (÷100)",
    summary: traderAdjustArchitecture.pmPublication.typicalRule,
    feImplementation: [
      "Lambda returns base probability (and line if applicable).",
      "publishedValue = base + adjust / 100 on probability (or check market-specific line rules).",
      "Complement / other side absorbs the change where two-way.",
    ],
    formula: "publishedProb = baseProb + I/100",
    excelRefs: refs.length ? refs : ["PM Publication column I"],
    examples: [
      {
        label: "I = ±1",
        detail: `±${traderAdjustArchitecture.pmPublication.typicalStep} on probability for that row.`,
      },
    ],
  };
}

export function buildTraderSkewGuide(
  registryModelId: string,
  excel?: ExcelTradingMapping
): TraderSkewGuide {
  const specific = guidesByModel[registryModelId];
  if (specific) {
    const selectionRows = excel?.selections?.map((s) => ({
      selection: s.selection,
      row: s.row,
      adjustCell: s.adjust,
      probCell: s.prob,
    }));
    return {
      ...specific,
      excelRefs: specific.excelRefs ?? [],
      selectionRows,
    };
  }

  if (!excel?.adjustCell && !excel?.adjustCells && !excel?.selections?.length) {
    return {
      kind: "none",
      title: "No trader skew on this market",
      summary: "Lambda output is displayed as-is; PM Publication column I is unused or zero.",
      feImplementation: ["Render Lambda probabilities and lines without post-model adjust."],
      excelRefs: [],
      examples: [],
    };
  }

  return defaultDiv100Guide(excel);
}

export { traderAdjustArchitecture };
