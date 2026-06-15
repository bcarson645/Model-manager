import type { PmPublicationSelection } from "@/lib/workbooks/pm-publication-qa";
import type { TraderSkewKind } from "./trader-skew-guides";

export const STANDARD_ADJUST_STEPS = [-2, -1, 0, 1, 2] as const;
export type AdjustStep = (typeof STANDARD_ADJUST_STEPS)[number];

export type AdjustOutcomeRow = {
  selection: string;
  row: number;
  adjustCell: string;
  baseProbability?: number;
  baseLine?: number;
  /** Published value when only this row's I is set to each step (others 0) */
  byAdjust: Record<AdjustStep, number>;
  /** Implied decimal price 1/p when output is probability */
  priceByAdjust?: Record<AdjustStep, number>;
};

export type AdjustOutcomePreview = {
  kind: TraderSkewKind;
  title: string;
  note: string;
  valueLabel: string;
  rows: AdjustOutcomeRow[];
  pairedExample?: { label: string; rows: Array<{ selection: string; probability: number }> };
};

function numProb(sel: PmPublicationSelection): number | null {
  const p = sel.probability;
  if (typeof p === "number" && p > 0 && p <= 1) return p;
  return null;
}

function numLine(sel: PmPublicationSelection): number | null {
  const line = sel.line;
  if (typeof line === "number") return line;
  return null;
}

export function publishMultiSelection(
  baseProbs: number[],
  adjusts: number[]
): number[] {
  const weights = baseProbs.map((p, i) => p + (adjusts[i] ?? 0) / 100);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return baseProbs.map(() => 0);
  return weights.map((w) => w / sum);
}

export function publishProbabilityDiv100(baseProb: number, adjust: number): number {
  return Math.min(1, Math.max(0, baseProb + adjust / 100));
}

export function publishLineDirect(baseLine: number, adjust: number): number {
  return baseLine + adjust;
}

function probToPrice(p: number): number | undefined {
  if (p <= 0) return undefined;
  return 1 / p;
}

function buildIsolatedMultiSelection(
  selections: PmPublicationSelection[]
): AdjustOutcomeRow[] {
  const baseProbs = selections.map((s) => numProb(s) ?? 0);
  const n = selections.length;

  return selections.map((sel, idx) => {
    const byAdjust = {} as Record<AdjustStep, number>;
    const priceByAdjust = {} as Record<AdjustStep, number>;

    for (const step of STANDARD_ADJUST_STEPS) {
      const adjusts = Array(n).fill(0);
      adjusts[idx] = step;
      const published = publishMultiSelection(baseProbs, adjusts)[idx];
      byAdjust[step] = published;
      const price = probToPrice(published);
      if (price !== undefined) priceByAdjust[step] = price;
    }

    return {
      selection: sel.selection ?? sel.market ?? `Row ${sel.row}`,
      row: sel.row,
      adjustCell: sel.cells.adjust,
      baseProbability: baseProbs[idx],
      byAdjust,
      priceByAdjust,
    };
  });
}

function buildIndependentProbRows(
  selections: PmPublicationSelection[]
): AdjustOutcomeRow[] {
  return selections
    .filter((s) => numProb(s) !== null)
    .map((sel) => {
      const base = numProb(sel)!;
      const byAdjust = {} as Record<AdjustStep, number>;
      const priceByAdjust = {} as Record<AdjustStep, number>;

      for (const step of STANDARD_ADJUST_STEPS) {
        const p = publishProbabilityDiv100(base, step);
        byAdjust[step] = p;
        const price = probToPrice(p);
        if (price !== undefined) priceByAdjust[step] = price;
      }

      return {
        selection: sel.selection ?? sel.market ?? `Row ${sel.row}`,
        row: sel.row,
        adjustCell: sel.cells.adjust,
        baseProbability: base,
        byAdjust,
        priceByAdjust,
      };
    });
}

function buildYesNoPair(
  selections: PmPublicationSelection[]
): AdjustOutcomeRow[] | null {
  if (selections.length !== 2) return null;
  const yes = selections.find((s) =>
    String(s.selection ?? "").toLowerCase().includes("yes")
  );
  const no = selections.find((s) =>
    String(s.selection ?? "").toLowerCase().includes("no")
  );
  if (!yes || !no) return null;

  const baseYes = numProb(yes);
  if (baseYes === null) return null;

  const yesRow: AdjustOutcomeRow = {
    selection: yes.selection ?? "Yes",
    row: yes.row,
    adjustCell: yes.cells.adjust,
    baseProbability: baseYes,
    byAdjust: {} as Record<AdjustStep, number>,
    priceByAdjust: {} as Record<AdjustStep, number>,
  };

  const noRow: AdjustOutcomeRow = {
    selection: no.selection ?? "No",
    row: no.row,
    adjustCell: no.cells.adjust,
    baseProbability: numProb(no) ?? 1 - baseYes,
    byAdjust: {} as Record<AdjustStep, number>,
    priceByAdjust: {} as Record<AdjustStep, number>,
  };

  for (const step of STANDARD_ADJUST_STEPS) {
    const pYes = publishProbabilityDiv100(baseYes, step);
    const pNo = 1 - pYes;
    yesRow.byAdjust[step] = pYes;
    noRow.byAdjust[step] = pNo;
    yesRow.priceByAdjust![step] = probToPrice(pYes)!;
    noRow.priceByAdjust![step] = probToPrice(pNo)!;
  }

  return [yesRow, noRow];
}

function buildLineRows(selections: PmPublicationSelection[]): AdjustOutcomeRow[] {
  return selections
    .filter((s) => numLine(s) !== null)
    .map((sel) => {
      const base = numLine(sel)!;
      const byAdjust = {} as Record<AdjustStep, number>;

      for (const step of STANDARD_ADJUST_STEPS) {
        byAdjust[step] = publishLineDirect(base, step);
      }

      return {
        selection: sel.selection ?? sel.market ?? `Row ${sel.row}`,
        row: sel.row,
        adjustCell: sel.cells.adjust,
        baseLine: base,
        byAdjust,
      };
    });
}

export function buildAdjustOutcomePreview(
  kind: TraderSkewKind,
  selections: PmPublicationSelection[],
  registryModelId: string
): AdjustOutcomePreview | null {
  if (kind === "none" || selections.length === 0) return null;

  if (kind === "multi_selection_renorm") {
    const rows = buildIsolatedMultiSelection(selections);
    const baseProbs = selections.map((s) => numProb(s) ?? 0);
    const paired = publishMultiSelection(
      baseProbs,
      selections.map((s, i) => (i === 0 ? 1 : i === 1 ? -1 : 0))
    );

    return {
      kind,
      title: "Expected published probability (G) per adjust",
      valueLabel: "Probability",
      note:
        "Each column shows the outcome when only that row's I is set to the value (all other I = 0). Whole market renormalises — a lone +2 adds less than +0.02 to that selection.",
      rows,
      pairedExample:
        selections.length >= 2
          ? {
              label: `Paired transfer: ${selections[0].selection} I=+1 and ${selections[1].selection} I=−1`,
              rows: [
                { selection: selections[0].selection ?? "A", probability: paired[0] },
                { selection: selections[1].selection ?? "B", probability: paired[1] },
              ],
            }
          : undefined,
    };
  }

  if (kind === "line_direct") {
    return {
      kind,
      title: "Expected published line (F) per adjust",
      valueLabel: "Line",
      note: "Line nudge: published F = base line + I (integer, not ÷100). Probabilities may be repriced separately in Excel.",
      rows: buildLineRows(selections),
    };
  }

  const yesNo = buildYesNoPair(selections);
  if (yesNo) {
    return {
      kind: "probability_div100",
      title: "Expected published probability (G) per adjust on Yes",
      valueLabel: "Probability",
      note: "Adjust on Yes row: publishedYes = baseYes + I÷100; No = 1 − Yes. Values shown for I on the Yes row only.",
      rows: yesNo,
    };
  }

  return {
    kind: "probability_div100",
    title: "Expected published probability (G) per adjust",
    valueLabel: "Probability",
    note:
      registryModelId.startsWith("pm-player")
        ? "Per-player row: published G = base G + I÷100 for that row only (independent of other players)."
        : "published G = base G + I÷100. Two-way markets: complement absorbs the change.",
    rows: buildIndependentProbRows(selections),
  };
}

export function formatAdjustOutcome(value: number, kind: TraderSkewKind): string {
  if (kind === "line_direct") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return (value * 100).toFixed(2) + "%";
}

export function formatAdjustPrice(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(3);
}
