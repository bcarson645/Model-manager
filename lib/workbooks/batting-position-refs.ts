/**
 * Prep Work batting position references — T20 men template (NZ v SA workbook).
 * Maps to VLOOKUP(I, I64:N74, 4/6), AL66+offset, CD24+offset on each player row.
 */

export type BattingPositionRef = {
  position: number;
  /** VLOOKUP col 4 — Prep Work L column in I64:N74 (par batting average) */
  parAverage: number;
  /** VLOOKUP col 6 — Prep Work N column in I64:N74 (par strike-rate factor) */
  parStrikeRate: number;
  /** AL66 for pos 1–2, AL67…AL76 for pos 3–11 */
  alCoefficient: number;
  /** CD24…CD34 on player row — position/format multiplier (NOT runs per ball) */
  cdMultiplier: number;
  excelCells: {
    lookupRow: number;
    alCell: string;
    cdExampleCell: string;
  };
};

/** Extracted from Prep Work!I64:N74, AL66:AL76, CD24:CD34 (T20 men). */
export const battingPositionRefs: BattingPositionRef[] = [
  { position: 1, parAverage: 28, parStrikeRate: 1.33, alCoefficient: 9.6995318406166, cdMultiplier: 0.95, excelCells: { lookupRow: 64, alCell: "AL66", cdExampleCell: "CD24" } },
  { position: 2, parAverage: 28, parStrikeRate: 1.33, alCoefficient: 9.6995318406166, cdMultiplier: 0.95, excelCells: { lookupRow: 65, alCell: "AL67", cdExampleCell: "CD25" } },
  { position: 3, parAverage: 27, parStrikeRate: 1.29, alCoefficient: 8.664639460169603, cdMultiplier: 0.91, excelCells: { lookupRow: 66, alCell: "AL68", cdExampleCell: "CD26" } },
  { position: 4, parAverage: 27, parStrikeRate: 1.29, alCoefficient: 6.984990229368148, cdMultiplier: 0.83, excelCells: { lookupRow: 67, alCell: "AL69", cdExampleCell: "CD27" } },
  { position: 5, parAverage: 25, parStrikeRate: 1.29, alCoefficient: 5.9729263204198775, cdMultiplier: 0.715, excelCells: { lookupRow: 68, alCell: "AL70", cdExampleCell: "CD28" } },
  { position: 6, parAverage: 22, parStrikeRate: 1.3, alCoefficient: 4.560468426995223, cdMultiplier: 0.595, excelCells: { lookupRow: 69, alCell: "AL71", cdExampleCell: "CD29" } },
  { position: 7, parAverage: 19, parStrikeRate: 1.3, alCoefficient: 3.670937755690679, cdMultiplier: 0.46, excelCells: { lookupRow: 70, alCell: "AL72", cdExampleCell: "CD30" } },
  { position: 8, parAverage: 16, parStrikeRate: 1.25, alCoefficient: 3.3146741073453354, cdMultiplier: 0.32, excelCells: { lookupRow: 71, alCell: "AL73", cdExampleCell: "CD31" } },
  { position: 9, parAverage: 13, parStrikeRate: 1.12, alCoefficient: 2.629847825687598, cdMultiplier: 0.205, excelCells: { lookupRow: 72, alCell: "AL74", cdExampleCell: "CD32" } },
  { position: 10, parAverage: 11, parStrikeRate: 0.95, alCoefficient: 2.2851286588752355, cdMultiplier: 0.115, excelCells: { lookupRow: 73, alCell: "AL75", cdExampleCell: "CD33" } },
  { position: 11, parAverage: 9, parStrikeRate: 0.8, alCoefficient: 2.2851286588752355, cdMultiplier: 0.05, excelCells: { lookupRow: 74, alCell: "AL76", cdExampleCell: "CD34" } },
];

export type BowlingBenchmarks = {
  parEconomy: number;
  economyWeight: number;
  parStrikeRate: number;
  excelCells: { w63: string; y63: string; x63: string };
};

/** T20 men — resolved W63/Y63/X63 on NZ v SA workbook. */
export const bowlingBenchmarksT20Men: BowlingBenchmarks = {
  parEconomy: 8.05,
  economyWeight: 10.3,
  parStrikeRate: 0.305,
  excelCells: { w63: "W63", y63: "Y63", x63: "X63" },
};

/**
 * Limited-overs batting rating (Prep Work Q column).
 * Test uses (L - parAverage) * cdMultiplier instead.
 */
export function calcBattingRating(
  position: number,
  battingAverage: number,
  strikeRate: number,
  format: "limited" | "test" = "limited"
): number {
  const ref = battingPositionRefs.find((r) => r.position === position);
  if (!ref) return 0;

  if (format === "test") {
    return (battingAverage - ref.parAverage) * ref.cdMultiplier;
  }

  const runsPerBall = battingAverage / strikeRate;
  const parRunsPerBall = ref.parAverage / ref.parStrikeRate;
  const term1 = ref.alCoefficient * (runsPerBall / parRunsPerBall - 1);
  const term2 = runsPerBall * (strikeRate - ref.parStrikeRate);
  return (term1 + term2) * ref.cdMultiplier;
}

/**
 * Bowling rating (Prep Work Z column). V=overs, W=economy, X=sr.
 * Returns 0 when overs is 0.
 */
export function calcBowlingRating(
  overs: number,
  economy: number,
  strikeRate: number,
  benchmarks: BowlingBenchmarks = bowlingBenchmarksT20Men
): number {
  if (!overs) return 0;
  const { parEconomy, economyWeight, parStrikeRate } = benchmarks;
  return overs * ((parEconomy - economy) + economyWeight * (strikeRate - parStrikeRate));
}

/** Shape used in external Player Adjustment UI — field names differ from Excel. */
export type UiBattingPositionRef = {
  expectedRunsTotal: number;
  expectedRunsPerBall: number;
  globalExpectedRunsPerBall: number;
  positionRating: number;
};

export type PositionRefMismatch = {
  position: number;
  field: keyof UiBattingPositionRef | "mapping";
  uiValue: number;
  excelValue: number;
  excelField: string;
  issue: string;
};

/** Compare UI position JSON against workbook template. */
export function compareUiBattingPositionRefs(
  uiRefs: UiBattingPositionRef[]
): PositionRefMismatch[] {
  const mismatches: PositionRefMismatch[] = [];

  uiRefs.forEach((ui, idx) => {
    const position = idx + 1;
    const ex = battingPositionRefs.find((r) => r.position === position);
    if (!ex) return;

    if (Math.abs(ui.expectedRunsTotal - ex.parAverage) > 0.001) {
      mismatches.push({
        position,
        field: "expectedRunsTotal",
        uiValue: ui.expectedRunsTotal,
        excelValue: ex.parAverage,
        excelField: `VLOOKUP(pos, I64:N74, 4) / parAverage`,
        issue: "Should be par batting average for this slot, not average+0.1 or wrong slot value",
      });
    }

    if (Math.abs(ui.expectedRunsPerBall - ex.parStrikeRate) > 0.001) {
      mismatches.push({
        position,
        field: "expectedRunsPerBall",
        uiValue: ui.expectedRunsPerBall,
        excelValue: ex.parStrikeRate,
        excelField: `VLOOKUP(pos, I64:N74, 6) / parStrikeRate`,
        issue: "Should be par SR factor (N column), not rounded 1.25/1.3 shortcuts",
      });
    }

    if (Math.abs(ui.globalExpectedRunsPerBall - ex.cdMultiplier) > 0.001) {
      mismatches.push({
        position,
        field: "globalExpectedRunsPerBall",
        uiValue: ui.globalExpectedRunsPerBall,
        excelValue: ex.cdMultiplier,
        excelField: `CD${23 + position} / cdMultiplier`,
        issue: "Misnamed in UI — this is CD position multiplier, not global runs per ball",
      });
    }

    if (Math.abs(ui.positionRating - ex.alCoefficient) > 0.0001) {
      mismatches.push({
        position,
        field: "positionRating",
        uiValue: ui.positionRating,
        excelValue: ex.alCoefficient,
        excelField: ex.excelCells.alCell,
        issue: "AL coefficient mismatch",
      });
    }
  });

  return mismatches;
}
