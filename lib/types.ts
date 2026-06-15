export type ModelSource = "excel" | "lambda";

export type ModelPhase = "pre_match" | "in_play";

export type VariableScope = "embedded" | "parameter" | "trading_input";

export type ParityStatus =
  | "matched"
  | "excel_only"
  | "lambda_only"
  | "scope_mismatch"
  | "unverified";

export type ExcelCellRef = {
  sheet: string;
  cell: string;
  description?: string;
};

export type ModelDefinition = {
  id: string;
  name: string;
  description: string;
  market: string;
  phase: ModelPhase;
  marketCode?: string;
  excelOutputs?: ExcelCellRef[];
  sources: Partial<Record<ModelSource, { version: string; location: string }>>;
  status: "migrating" | "parity_check" | "production" | "deprecated";
};

export type VariableDefinition = {
  id: string;
  name: string;
  label: string;
  description: string;
  scope: VariableScope;
  dataType: "number" | "boolean" | "string" | "percentage";
  modelIds: string[];
  sources: Partial<
    Record<
      ModelSource,
      {
        present: boolean;
        defaultValue?: string | number | boolean;
        notes?: string;
      }
    >
  >;
  parity: ParityStatus;
};

export type OutputComparisonRow = {
  outputKey: string;
  label: string;
  excelValue: number | null;
  lambdaValue: number | null;
  unit: string;
  tolerance: number;
  excelRef?: ExcelCellRef;
};

export type ComparisonFixture = {
  id: string;
  match: string;
  format: string;
  venue: string;
  phase: ModelPhase;
  workbook?: string;
  comparedAt: string;
  inputs: Record<string, string | number>;
  outputs: OutputComparisonRow[];
};

export type WorkbookSnapshot = {
  id: string;
  filename: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  format: string;
  phase: ModelPhase;
};

export type RegistrySummary = {
  totalModels: number;
  preMatchModels: number;
  inPlayModels: number;
  excelOnly: number;
  lambdaOnly: number;
  bothSources: number;
  tradingInputsRequired: number;
  parityIssues: number;
  outputMismatches: number;
};
