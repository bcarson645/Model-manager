/**
 * Trader adjust semantics — purple PM Publication column I and Prep Work E10.
 *
 * Display skew is applied AFTER the pricing model runs. It is not part of Lambda output.
 */
import { excelConventions } from "./excel-mappings";

export const traderAdjustArchitecture = {
  summary:
    "Trader adjusts skew the published offer after the model runs. They are stored per selection (PM Publication column I) and applied on the new FE — not sent into Lambda.",
  applyOrder: [
    "Prep / evaluation builds IPricingInputs (no purple I values).",
    "Lambda returns base probabilities and lines (equivalent to PM Pricing sheet).",
    "FE applies trader adjust from stored skew per row.",
    "FE renders published probability (G), complement (H), line (F), and price (J).",
  ],
  pmPublication: {
    column: excelConventions.preMatchAdjustColumn,
    sheet: excelConventions.preMatchAdjustSheet,
    typicalStep: 0.01,
    typicalRule:
      "Most markets: adjust ÷ 100 = probability change (I = ±1 → ±0.01 on G). Complement / other side absorbs the remainder.",
    storageOnFe: "Persist raw adjust integer per market row; apply at render time, not inside Lambda.",
  },
  prepWork: {
    e10: {
      cell: "E10",
      usedIn: "Prep Work!C10",
      formula: "=Pricing!J30+E10/100",
      note: "Match-level example of ÷100 skew — same unit idea as PM column I on many rows.",
    },
    fiftyExample: {
      cell: "G67",
      formula: "=Prep Work!AB5+I67/100",
      note: "Fifty in First Innings Yes — base prob from prep + I67÷100.",
    },
  },
  patterns: [
    {
      id: "probability_skew",
      label: "Probability skew (÷100)",
      applyTo: "G (probability)",
      formula: "publishedProb = baseProb + (I / 100)",
      exampleRows: "67 (Fifty 1st innings Yes)",
    },
    {
      id: "line_nudge",
      label: "Line nudge (direct)",
      applyTo: "F (line)",
      formula: "publishedLine = baseLine + I",
      exampleRows: "337–346 (Player Perf — I is whole runs on line, not ÷100)",
    },
    {
      id: "model_only_g",
      label: "Base prob in G, adjust stored separately",
      applyTo: "G unchanged; I for FE",
      formula: "G = PM Pricing prob; FE still applies skew rules for display if used",
      exampleRows: "45, 52, 337 (G from PM Pricing; skew may be on F or applied in UI)",
    },
  ],
  lambdaNote:
    "Lambda C# may reference AdjustmentsPM for some evaluation paths — treat those as separate from purple column I unless parity review proves otherwise. For the new FE, column I behaviour is post-model only.",
  multiSelection: {
    market: "Method of First Dismissal",
    pmPublicationRows: "45–51",
    pmPublicationAdjusts: "I45–I51",
    pmPricingRows: "53–59",
    flow: [
      "J53:M53 = each opener’s share of that dismissal method (4 columns → AVERAGE).",
      "G53 = AVERAGE(J53:M53) + PM Publication!I45/100  (same pattern rows 54–59 / I46–I51).",
      "G60 = SUM(G53:G59)  — total weight before normalisation.",
      "C53 = G53/G$60  → published probability; PM Publication G45 = C53.",
    ],
    feFormula:
      "weight[i] = baseProb[i] + adjust[i]/100; published[i] = weight[i] / sum(weights)",
    pairedAdjustNote:
      "A +1 on one row and −1 on another transfers 0.01 probability between those outcomes (G60 unchanged). A lone +1 only adds ~0.004 to that outcome because G60 rises and all others shrink.",
    lambdaParity:
      "FirstDismissal.cs adds adjusts.FielderCatch/100 etc., sums, then divides each outcome by newTotal — same renormalisation as PM Pricing.",
  },
  qaNote:
    "When QAing Lambda vs Excel: compare base output to PM Pricing (or G minus I÷100 where G embeds the skew). Column I is trader overlay, not model input.",
} as const;

export function formatTraderAdjustDelta(adjust: number | null | undefined): string {
  if (adjust === null || adjust === undefined || adjust === 0) return "0";
  const probDelta = adjust / 100;
  const sign = probDelta > 0 ? "+" : "";
  return `${sign}${probDelta.toFixed(2)} prob (I=${adjust}÷100)`;
}
