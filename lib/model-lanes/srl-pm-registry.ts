import type { ModelDefinition, RegistrySummary, VariableDefinition } from "@/lib/types";
import atlasSnapshot from "@/lib/workbooks/atlas-196-pm-publication-qa.json";

export type SrlPmModelDefinition = {
  id: string;
  name: string;
  marketName: string;
  category: string;
  description: string;
  lambdaClass?: string;
  lambdaNamespace?: string;
  pmRows: number[];
  excelOutputs: Array<{ sheet: string; cell: string; description?: string }>;
  inputs: Array<{
    name: string;
    label: string;
    scope: "embedded" | "parameter";
    excelRef?: string;
    csharpPath?: string;
    notes?: string;
  }>;
  status: ModelDefinition["status"];
};

const WORKBOOK = "Atlas 196 (3).xlsm";
const NS = "PremiumCricket.Lib.Pricing.PricingModels";

/** Shared Prep Work inputs — no trader adjusts on SRL PM. */
export const srlSharedInputs: SrlPmModelDefinition["inputs"] = [
  {
    name: "ConditionAdjustment",
    label: "Conditions factor",
    scope: "parameter",
    excelRef: "Prep Work!D3",
    csharpPath: "MatchEvaluation.ConditionAdjustment",
  },
  {
    name: "HomeBattingRating",
    label: "Home batting rating",
    scope: "parameter",
    excelRef: "Prep Work!D4",
    csharpPath: "TeamEvaluation.BattingRating (home)",
  },
  {
    name: "AwayBattingRating",
    label: "Away batting rating",
    scope: "parameter",
    excelRef: "Prep Work!I4",
    csharpPath: "TeamEvaluation.BattingRating (away)",
  },
  {
    name: "HomeBowlingRating",
    label: "Home bowling rating",
    scope: "parameter",
    excelRef: "Prep Work!D5",
    csharpPath: "TeamEvaluation.BowlingRating (home)",
  },
  {
    name: "AwayBowlingRating",
    label: "Away bowling rating",
    scope: "parameter",
    excelRef: "Prep Work!I5",
    csharpPath: "TeamEvaluation.BowlingRating (away)",
  },
  {
    name: "HomeExpectedRuns",
    label: "Home expected innings runs",
    scope: "parameter",
    excelRef: "Prep Work!E6",
    csharpPath: "TeamEvaluation.GetRunsExpected (home)",
  },
  {
    name: "AwayExpectedRuns",
    label: "Away expected innings runs",
    scope: "parameter",
    excelRef: "Prep Work!J6",
    csharpPath: "TeamEvaluation.GetRunsExpected (away)",
  },
  {
    name: "FirstInningsPar",
    label: "1st innings par (Table 1 All)",
    scope: "parameter",
    excelRef: "Prep Work!O3",
    notes: "Scales several match-level rate models",
  },
];

const LAMBDA_BY_ID: Record<
  string,
  { className: string; subfolder: "Matches" | "Teams" | "Players" }
> = {
  "srl-pm-match-betting-3w": { className: "MatchBetting3Way", subfolder: "Matches" },
  "srl-pm-match-double-chance": { className: "MatchDoubleChance", subfolder: "Matches" },
  "srl-pm-match-winner": { className: "MatchBetting", subfolder: "Matches" },
  "srl-pm-tied-match": { className: "TiedMatch", subfolder: "Matches" },
  "srl-pm-toss-winner": { className: "TossWinner", subfolder: "Matches" },
  "srl-pm-toss-win-double": { className: "TossWinDouble", subfolder: "Matches" },
  "srl-pm-first-innings-runs": { className: "FirstInningsRuns", subfolder: "Matches" },
  "srl-pm-first-partnership": { className: "FirstPartnership", subfolder: "Matches" },
  "srl-pm-first-dismissal": { className: "FirstDismissal", subfolder: "Matches" },
  "srl-pm-match-fours": { className: "MatchFours", subfolder: "Matches" },
  "srl-pm-match-sixes": { className: "MatchSixes", subfolder: "Matches" },
  "srl-pm-match-run-outs": { className: "MatchRunOuts", subfolder: "Matches" },
  "srl-pm-match-max-over": { className: "MatchMaxOver", subfolder: "Matches" },
  "srl-pm-match-ducks": { className: "MatchDucks", subfolder: "Matches" },
  "srl-pm-match-wides": { className: "MatchWides", subfolder: "Matches" },
  "srl-pm-match-extras": { className: "MatchExtras", subfolder: "Matches" },
  "srl-pm-match-wickets": { className: "MatchWickets", subfolder: "Matches" },
  "srl-pm-team-of-top-bat": { className: "TeamOfTopBat", subfolder: "Matches" },
  "srl-pm-team-of-top-bowl": { className: "TeamOfTopBowl", subfolder: "Matches" },
  "srl-pm-first-innings-lead": { className: "FirstInningsLead", subfolder: "Matches" },
  "srl-pm-fifty-first-innings": { className: "FiftyInnings", subfolder: "Matches" },
  "srl-pm-fifty-match": { className: "FiftyMatch", subfolder: "Matches" },
  "srl-pm-hundred-first-innings": { className: "HundredInnings", subfolder: "Matches" },
  "srl-pm-hundred-match": { className: "HundredMatch", subfolder: "Matches" },
  "srl-pm-highest-individual-score": { className: "MatchHighScore", subfolder: "Matches" },
  "srl-pm-rabbit-runs": { className: "RabbitRuns", subfolder: "Matches" },
  "srl-pm-highest-scoring-session": {
    className: "HighestScoringSession",
    subfolder: "Matches",
  },
};

const MODEL_LABELS: Record<string, string> = {
  "srl-pm-match-betting-3w": "Match Betting (3-way)",
  "srl-pm-match-double-chance": "Match Winner Double Chance",
  "srl-pm-match-winner": "Match Betting (2-way)",
  "srl-pm-tied-match": "Tied Match",
  "srl-pm-toss-winner": "Toss Winner",
  "srl-pm-toss-win-double": "Toss / Win Double",
  "srl-pm-first-innings-runs": "Runs in First Innings",
  "srl-pm-first-partnership": "Runs in First Partnership",
  "srl-pm-first-dismissal": "Method of First Dismissal",
  "srl-pm-match-fours": "Match Fours",
  "srl-pm-match-sixes": "Match Sixes",
  "srl-pm-match-run-outs": "Match Run Outs",
  "srl-pm-match-max-over": "Max Runs Scored in an Over",
  "srl-pm-match-ducks": "Match Ducks",
  "srl-pm-match-wides": "Match Wides",
  "srl-pm-match-extras": "Match Extras",
  "srl-pm-match-wickets": "Match Wickets",
  "srl-pm-team-of-top-bat": "Team of Top Bat",
  "srl-pm-team-of-top-bowl": "Team of Top Bowl",
  "srl-pm-first-innings-lead": "First Innings Lead",
  "srl-pm-fifty-first-innings": "Fifty in First Innings",
  "srl-pm-fifty-match": "Fifty in Match",
  "srl-pm-hundred-first-innings": "Hundred in First Innings",
  "srl-pm-hundred-match": "Hundred in Match",
  "srl-pm-highest-individual-score": "Highest Individual Score",
  "srl-pm-rabbit-runs": "Rabbit Runs",
  "srl-pm-highest-scoring-session": "Runs in Highest Scoring Session",
};

function pmOutputsForRows(rows: number[]) {
  if (rows.length === 0) return [];
  const gCells = rows.map((r) => `G${r}`);
  const fCells = rows.filter((r) => {
    const byRow = atlasSnapshot.byRow as Record<string, { line?: unknown }>;
    const row = byRow[String(r)];
    return row?.line != null && row.line !== 0.5;
  });
  const outputs: SrlPmModelDefinition["excelOutputs"] = [
    {
      sheet: "PM Publication",
      cell: gCells.length === 1 ? gCells[0]! : `${gCells[0]}:${gCells[gCells.length - 1]}`,
      description: "Published probability (column G) — no trader adjust on SRL",
    },
  ];
  if (fCells.length > 0) {
    outputs.push({
      sheet: "PM Publication",
      cell: fCells.length === 1 ? `F${fCells[0]}` : `F${fCells[0]}:F${fCells[fCells.length - 1]}`,
      description: "Offered line (column F) where applicable",
    });
  }
  return outputs;
}

function buildSrlPmModels(): SrlPmModelDefinition[] {
  const byModel = atlasSnapshot.byModel as Record<
    string,
    Array<{ row: number; category: string | null; market: string | null }>
  >;

  return Object.keys(byModel)
    .sort()
    .map((id) => {
      const selections = byModel[id] ?? [];
      const rows = selections.map((s) => s.row);
      const first = selections[0];
      const lambda = LAMBDA_BY_ID[id];
      const lambdaPath = lambda
        ? `PreMatch.Models.${lambda.subfolder}.${lambda.className}`
        : undefined;

      return {
        id,
        name: MODEL_LABELS[id] ?? id,
        marketName: first?.market ?? MODEL_LABELS[id] ?? id,
        category: first?.category ?? "Match Market",
        description:
          "SRL pre-match model — outcomes published on PM Publication. No trader adjust column on SRL.",
        lambdaClass: lambda?.className,
        lambdaNamespace: lambda ? `${NS}.PreMatch.Models.${lambda.subfolder}` : undefined,
        pmRows: rows,
        excelOutputs: pmOutputsForRows(rows),
        inputs: [...srlSharedInputs],
        status: lambda ? "parity_check" : "migrating",
      } satisfies SrlPmModelDefinition;
    });
}

export const srlPmModels = buildSrlPmModels();

export function srlPmModelsAsRegistry(): ModelDefinition[] {
  return srlPmModels.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    market: m.category,
    phase: "pre_match" as const,
    excelOutputs: m.excelOutputs,
    sources: {
      excel: { version: WORKBOOK, location: `PM Publication rows ${m.pmRows.join(",")}` },
      ...(m.lambdaClass
        ? { lambda: { version: "main", location: m.lambdaClass } }
        : {}),
    },
    status: m.status,
  }));
}

export function buildSrlVariables(): VariableDefinition[] {
  const vars: VariableDefinition[] = [];
  for (const input of srlSharedInputs) {
    vars.push({
      id: `srl-var-${input.name}`,
      name: input.name,
      label: input.label,
      description: input.notes ?? `Feeds SRL PM models via ${input.excelRef ?? "workbook"}`,
      scope: input.scope,
      dataType: "number",
      modelIds: srlPmModels.map((m) => m.id),
      sources: {
        excel: { present: true, notes: input.excelRef },
        lambda: {
          present: !!input.csharpPath,
          notes: input.csharpPath,
        },
      },
      parity: "unverified",
    });
  }
  return vars;
}

export function buildSrlSummary(): RegistrySummary {
  const models = srlPmModels;
  const withLambda = models.filter((m) => m.lambdaClass).length;
  return {
    totalModels: models.length,
    preMatchModels: models.length,
    inPlayModels: 0,
    excelOnly: models.length - withLambda,
    lambdaOnly: 0,
    bothSources: withLambda,
    tradingInputsRequired: 0,
    parityIssues: models.filter((m) => m.status !== "production").length,
    outputMismatches: 0,
  };
}

export function getSrlPmSnapshot() {
  return atlasSnapshot;
}
