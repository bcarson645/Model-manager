/**
 * PM Publication column semantics for trading & QA.
 * F = offered line | G = probability | I = trader adjust (purple, post-model) | J = price
 */
import nzSaSnapshot from "./nz-sa-pm-publication-qa.json";
import puruliaSnapshot from "./purulia-kings-pm-publication-qa.json";

export const pmPublicationColumns = {
  sheet: "PM Publication",
  line: {
    col: "F",
    label: "Line",
    description:
      "Offered line. From PM Pricing / model; some markets add column I directly to F (e.g. Player Perf).",
  },
  probability: {
    col: "G",
    label: "Probability",
    description:
      "Published probability. Base from PM Pricing or prep; some rows embed I÷100 (e.g. G67 = AB5 + I67/100). For Lambda QA, compare to base before skew where possible.",
  },
  complement: {
    col: "H",
    label: "Complement",
    description:
      "Under/over other side, or secondary outcome. Often equals 1 − G for two-way O/U.",
  },
  adjust: {
    col: "I",
    label: "Adjust",
    description:
      "Trader skew (purple) — FE applies after Lambda, not inside the model. Typically I÷100 = ±0.01 prob; some markets nudge line (F). See Prep Work E10.",
  },
  price: {
    col: "J",
    label: "Price",
    description: "Displayed price derived from probability — for reference when QAing.",
  },
} as const;

export type PmCellValue = number | string | { error: string } | null;

export type PmPublicationSelection = {
  row: number;
  market: string | null;
  selection: string | null;
  line: PmCellValue;
  probability: PmCellValue;
  complementProbability: PmCellValue;
  adjust: PmCellValue;
  price: PmCellValue;
  cells: {
    line: string;
    probability: string;
    complement: string;
    adjust: string;
    price: string;
  };
};

export type PmPublicationSnapshot = {
  fixtureId: string;
  label?: string;
  sheet: string;
  columns: Record<string, string>;
  byModel: Record<string, PmPublicationSelection[]>;
  byRow: Record<string, PmPublicationSelection>;
};

export type PmQaExpectation = {
  field: "line" | "probability";
  note: string;
  expected?: string;
};

export type PmQaFixture = {
  id: string;
  label: string;
  snapshot: PmPublicationSnapshot;
  prepHints: Record<string, PmQaExpectation[]>;
};

/** Primary QA fixture — NZ v SA (63406779) */
export const PM_QA_DEFAULT_FIXTURE_ID = "nz-sa-63406779";

export const pmQaFixtures: Record<string, PmQaFixture> = {
  "purulia-kings-71783382": {
    id: "purulia-kings-71783382",
    label: "Purulia v Kings (71783382)",
    snapshot: puruliaSnapshot as PmPublicationSnapshot,
    prepHints: {
      "pm-match-ducks": [{ field: "line", note: "Match ducks line (both fixtures use 1.5)", expected: "1.5" }],
      "pm-match-wickets": [{ field: "line", note: "U38+U59 ≈ 13.31", expected: "13.5" }],
      "pm-fifty-first-innings": [{ field: "probability", note: "Prep Work Z5=0.5851", expected: "0.575" }],
      "pm-hundred-first-innings": [{ field: "probability", note: "Prep Work Z7=0.0508", expected: "0.051" }],
      "pm-hundred-match": [{ field: "probability", note: "Prep Work Z8=0.0706", expected: "0.071" }],
    },
  },
  "nz-sa-63406779": {
    id: "nz-sa-63406779",
    label: "NZ v SA (63406779)",
    snapshot: nzSaSnapshot as PmPublicationSnapshot,
    prepHints: {
      "pm-match-ducks": [{ field: "line", note: "Match ducks line", expected: "1.5" }],
      "pm-match-extras": [{ field: "line", note: "M35+M56 ≈ 18.51", expected: "18.5" }],
      "pm-match-wickets": [{ field: "line", note: "U38+U59 ≈ 13.44", expected: "13.5" }],
      "pm-fifty-first-innings": [{ field: "probability", note: "Prep Work Z5=0.6505", expected: "0.65" }],
      "pm-hundred-first-innings": [{ field: "probability", note: "Prep Work Z7=0.0582", expected: "0.058" }],
      "pm-hundred-match": [{ field: "probability", note: "Prep Work Z8=0.084", expected: "0.084" }],
    },
  },
};

export const pmQaFixtureList = [
  pmQaFixtures["nz-sa-63406779"],
  pmQaFixtures["purulia-kings-71783382"],
];

/** Registry model id → snapshot keys (home block = *-nz rows, away block = *-sa rows) */
export const pmQaModelKeys: Record<string, string[]> = {
  "pm-team-fours": ["pm-team-fours-nz", "pm-team-fours-sa"],
  "pm-team-sixes": ["pm-team-sixes-nz", "pm-team-sixes-sa"],
  "pm-team-wickets": ["pm-team-wickets-nz", "pm-team-wickets-sa"],
  "pm-team-wides": ["pm-team-wides-nz", "pm-team-wides-sa"],
  "pm-team-ducks": ["pm-team-ducks-nz", "pm-team-ducks-sa"],
  "pm-team-extras": ["pm-team-extras-nz", "pm-team-extras-sa"],
  "pm-team-run-outs": ["pm-team-run-outs-nz", "pm-team-run-outs-sa"],
  "pm-team-max-over": ["pm-team-max-over-nz", "pm-team-max-over-sa"],
  "pm-team-first-partnership": [
    "pm-team-first-partnership-nz",
    "pm-team-first-partnership-sa",
  ],
  "pm-team-first-dismissal": [
    "pm-team-first-dismissal-nz",
    "pm-team-first-dismissal-sa",
  ],
};

export function getPmQaFixture(fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID): PmQaFixture {
  return pmQaFixtures[fixtureId] ?? pmQaFixtures[PM_QA_DEFAULT_FIXTURE_ID];
}

export function formatPmValue(value: PmCellValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && "error" in value) return value.error;
  if (typeof value === "number") {
    if (value > 0 && value < 1) return value.toFixed(4);
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2);
  }
  return String(value);
}

export function isLineMarket(selection: PmPublicationSelection): boolean {
  const line = selection.line;
  if (line === null || typeof line === "object") return false;
  if (typeof line === "number" && line > 1) return true;
  return false;
}

export function getPmQaSelections(
  registryModelId: string,
  fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID
): PmPublicationSelection[] {
  const { snapshot } = getPmQaFixture(fixtureId);
  const keys = pmQaModelKeys[registryModelId] ?? [registryModelId];
  const out: PmPublicationSelection[] = [];
  for (const key of keys) {
    const rows = snapshot.byModel[key];
    if (rows) out.push(...rows);
  }
  return out;
}

export function getPmQaCoverageStats(fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID) {
  const fixture = getPmQaFixture(fixtureId);
  const { byModel } = fixture.snapshot;
  return {
    fixtureId: fixture.id,
    label: fixture.label,
    snapshotKeys: Object.keys(byModel).length,
    totalRows: Object.values(byModel).reduce((n, rows) => n + rows.length, 0),
  };
}

export type PmQaRowStatus =
  | "captured"
  | "excel_error"
  | "pending_lambda"
  | "hint_match"
  | "hint_mismatch";

export function assessPmQaRow(
  registryModelId: string,
  selection: PmPublicationSelection,
  fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID
): { status: PmQaRowStatus; message?: string } {
  const prob = selection.probability;
  if (prob !== null && typeof prob === "object" && "error" in prob) {
    return { status: "excel_error", message: prob.error };
  }

  const hints = getPmQaFixture(fixtureId).prepHints[registryModelId] ?? [];
  for (const hint of hints) {
    const actual =
      hint.field === "line"
        ? formatPmValue(selection.line)
        : formatPmValue(selection.probability);
    if (hint.expected && actual !== "—") {
      const expNum = parseFloat(hint.expected.split("→")[0].trim());
      const actNum = parseFloat(actual);
      if (!Number.isNaN(expNum) && !Number.isNaN(actNum)) {
        if (Math.abs(expNum - actNum) < 0.02) {
          return { status: "hint_match", message: hint.note };
        }
        return {
          status: "hint_mismatch",
          message: `${hint.note} (expected ~${hint.expected})`,
        };
      }
      if (actual.includes(hint.expected) || hint.expected.includes(actual)) {
        return { status: "hint_match", message: hint.note };
      }
    }
  }

  return {
    status: "pending_lambda",
    message: "Excel captured — compare when Lambda output available",
  };
}

/** Compare the same PM row across fixtures (structural QA). */
export function comparePmRowAcrossFixtures(row: number): {
  row: number;
  fixtures: Array<{ fixtureId: string; label: string; selection: PmPublicationSelection | null }>;
} {
  return {
    row,
    fixtures: pmQaFixtureList.map((f) => ({
      fixtureId: f.id,
      label: f.label,
      selection: f.snapshot.byRow[String(row)] ?? null,
    })),
  };
}
