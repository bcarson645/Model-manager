import { pricingModels } from "@/lib/pricing-models/registry";
import type { PricingModelInput, PricingModelOutput } from "@/lib/pricing-models/types";
import {
  excelConventions,
  pmPublicationMappings,
} from "@/lib/workbooks/excel-mappings";
import { traderAdjustArchitecture } from "@/lib/workbooks/trader-adjust-conventions";
import {
  assessPmQaRow,
  getPmQaSelections,
  PM_QA_DEFAULT_FIXTURE_ID,
  type PmQaRowStatus,
} from "@/lib/workbooks/pm-publication-qa";
import { models as registryModels, variables } from "@/lib/sample-data";
import type {
  ExcelTradingMapping,
  GuideField,
  GuideOutput,
  MarketGuideIndex,
  MarketTradingGuide,
} from "./types";
import { buildTraderSkewGuide } from "./trader-skew-guides";

const SHEET_PREP = "Prep Work";
const SHEET_PM = "PM Publication";

function feControlForAdjust(_input: PricingModelInput): string {
  return `Post-model skew control (PM column ${excelConventions.preMatchAdjustColumn}) — typically ±1 = ±0.01 probability (÷100). Store on FE; apply after Lambda returns base prob. Not a Lambda input.`;
}

function feDisplayForOutput(output: PricingModelOutput): string {
  switch (output.type) {
    case "line":
      return `Display published line (column F). Base from Lambda; trader may nudge line on some markets via column ${excelConventions.preMatchAdjustColumn} (e.g. Player Perf adds I directly to F).`;
    case "outcome_set":
      return `One row per selection: base probability from Lambda, then apply trader skew (column ${excelConventions.preMatchAdjustColumn}, usually ÷100) for published G; price in column ${pmPublicationMappings.priceColumn}.`;
    case "probability":
      return `Base probability from Lambda; apply trader skew on FE (column ${excelConventions.preMatchAdjustColumn}) before display. Published G may already include skew in Excel formulas.`;
    case "price":
      return `Displayed price (column ${pmPublicationMappings.priceColumn}) — derived from published probability after adjust.`;
    default:
      return "Display model output after Lambda, then apply trader skew on FE.";
  }
}

function inputToGuideField(
  input: PricingModelInput,
  registryModelId: string,
  role: "adjust" | "static" | "embedded"
): GuideField {
  const linkedVar = variables.find(
    (v) => v.modelIds.includes(registryModelId) && v.scope === input.scope
  );

  return {
    id: input.name,
    label: input.label,
    description: input.notes,
    csharpPath: input.csharpPath,
    excelRef: input.excelRef,
    lambdaNotes: linkedVar?.sources.lambda?.notes,
    defaultValue: linkedVar?.sources.excel?.defaultValue,
    feControl:
      role === "adjust"
        ? feControlForAdjust(input)
        : role === "embedded"
          ? "Lookup table / constant in Lambda — not trader-editable on FE"
          : "Loaded from fixture prep or evaluation — store in backend, refresh on squad/conditions change",
  };
}

function variableToGuideField(v: (typeof variables)[0]): GuideField {
  const isAdjust = v.scope === "trading_input";
  return {
    id: v.id,
    label: v.label,
    description: v.description,
    excelRef: v.sources.excel?.notes,
    lambdaNotes: v.sources.lambda?.notes,
    defaultValue: v.sources.excel?.defaultValue,
    feControl: isAdjust
      ? `Post-model skew — PM column ${excelConventions.preMatchAdjustColumn} (purple). Apply on FE after Lambda; typically ÷100 → ±0.01 prob.`
      : "Exported from Prep Work / evaluation pipeline",
  };
}

function buildExcelTrading(registryModelId: string): ExcelTradingMapping | undefined {
  const mapping = pmPublicationMappings.markets.find(
    (m) => m.modelId === registryModelId
  );
  if (!mapping) return undefined;

  const base: ExcelTradingMapping = {
    sheet: SHEET_PM,
    rows: mapping.rows,
    market: mapping.market,
    lambdaAdjust: "lambdaAdjust" in mapping ? mapping.lambdaAdjust : undefined,
    notes: "notes" in mapping ? mapping.notes : undefined,
  };

  if ("adjustCell" in mapping && mapping.adjustCell) {
    base.adjustCell = mapping.adjustCell;
  }
  if ("adjustCells" in mapping && mapping.adjustCells) {
    base.adjustCells = mapping.adjustCells;
  }
  if ("lineCell" in mapping && mapping.lineCell) {
    base.lineCell = mapping.lineCell;
  }
  if ("probabilityCells" in mapping && mapping.probabilityCells) {
    base.probabilityCells = mapping.probabilityCells;
  }
  if ("selections" in mapping && mapping.selections) {
    base.selections = mapping.selections;
  }

  return base;
}

function buildDataFlow(guide: Omit<MarketTradingGuide, "dataFlow">): string[] {
  const steps: string[] = [
    `${SHEET_PREP} (and related sheets) produce evaluation inputs — ratings, player stats, historical blends.`,
  ];

  if (guide.sheetExports.length > 0) {
    steps.push(
      `Backend exports ${guide.sheetExports.length} parameter(s) into the Lambda evaluation payload (equivalent to Prep Work cells).`
    );
  }

  if (guide.traderAdjusts.length > 0) {
    steps.push(
      `Trader stores ${guide.traderAdjusts.length} skew value(s) on the FE (today: ${SHEET_PM} column ${excelConventions.preMatchAdjustColumn} purple cells) — applied after Lambda, not passed into the model.`
    );
  } else {
    steps.push(
      `No per-row trader skew on this market — FE displays Lambda output only (or adjust column unused).`
    );
  }

  steps.push(
    `Lambda ${guide.className} runs with IPricingInputs → base probabilities/lines (PM Pricing equivalent). Trader skew is not part of this step.`
  );

  steps.push(
    `FE applies purple column ${excelConventions.preMatchAdjustColumn} skew per row after pricing — typically adjust÷100 on probability (${traderAdjustArchitecture.prepWork.e10.cell} / row 67 pattern). Renders ${guide.expectedOutputs.map((o) => o.label.toLowerCase()).join(", ")} in columns F/G/J.`
  );

  return steps;
}

function buildGuide(
  model: (typeof pricingModels)[0],
  fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID
): MarketTradingGuide {
  const registryModelId = model.registryModelId;
  const sampleModel = registryModels.find((m) => m.id === registryModelId);

  const traderAdjusts: GuideField[] = model.inputs
    .filter((i) => i.scope === "trading_input")
    .map((i) => inputToGuideField(i, registryModelId, "adjust"));

  const extraAdjustVars = variables
    .filter((v) => v.scope === "trading_input" && v.modelIds.includes(registryModelId))
    .filter((v) => !traderAdjusts.some((a) => a.id === v.id && a.label === v.label))
    .map(variableToGuideField);

  const staticInputs: GuideField[] = model.inputs
    .filter((i) => i.scope === "parameter")
    .map((i) => inputToGuideField(i, registryModelId, "static"));

  const embeddedLookups: GuideField[] = [
    ...model.inputs
      .filter((i) => i.scope === "embedded")
      .map((i) => inputToGuideField(i, registryModelId, "embedded")),
    ...model.embeddedConstants.map((c) => ({
      id: c.name,
      label: c.name,
      description: c.notes,
      feControl: `Embedded constant: ${c.value}`,
    })),
  ];

  const sheetExports: GuideField[] = variables
    .filter(
      (v) =>
        v.scope === "parameter" &&
        v.modelIds.includes(registryModelId) &&
        !staticInputs.some((s) => s.label === v.label)
    )
    .map(variableToGuideField);

  for (const input of staticInputs) {
    if (!sheetExports.some((e) => e.label === input.label)) {
      sheetExports.push(input);
    }
  }

  const expectedOutputs: GuideOutput[] = model.outputs.map((o) => ({
    label: o.label,
    type: o.type,
    excelRef: o.excelRef ?? sampleModel?.excelOutputs?.map((e) => `${e.sheet}!${e.cell}`).join("; "),
    feDisplay: feDisplayForOutput(o),
    csharpPath: o.csharpPath,
    notes: o.notes,
  }));

  if (expectedOutputs.length === 0 && sampleModel?.excelOutputs) {
    for (const ex of sampleModel.excelOutputs) {
      expectedOutputs.push({
        label: ex.description ?? ex.cell,
        type: ex.description?.toLowerCase().includes("line") ? "line" : "outcome_set",
        excelRef: `${ex.sheet}!${ex.cell}`,
        feDisplay: feDisplayForOutput({
          name: ex.cell,
          label: ex.description ?? ex.cell,
          type: ex.description?.toLowerCase().includes("line") ? "line" : "outcome_set",
        }),
      });
    }
  }

  const pmQaSelections = getPmQaSelections(registryModelId, fixtureId);
  const pmQaStatus: PmQaRowStatus = pmQaSelections.length
    ? pmQaSelections.some(
        (s) => assessPmQaRow(registryModelId, s, fixtureId).status === "excel_error"
      )
      ? "excel_error"
      : pmQaSelections.some(
            (s) => assessPmQaRow(registryModelId, s, fixtureId).status === "hint_mismatch"
          )
        ? "hint_mismatch"
        : pmQaSelections.some(
              (s) => assessPmQaRow(registryModelId, s, fixtureId).status === "hint_match"
            )
          ? "hint_match"
          : "pending_lambda"
    : "pending_lambda";

  const excelTrading = buildExcelTrading(registryModelId);
  const traderSkewGuide = buildTraderSkewGuide(registryModelId, excelTrading);

  const partial = {
    id: model.id,
    registryModelId,
    pmQaFixtureId: fixtureId,
    className: model.className,
    marketName: model.marketName,
    marketCode: model.marketCode,
    phase: model.phase,
    description: model.description,
    lambdaClass: `${model.namespace}.${model.className}`,
    excelTrading,
    traderAdjusts: [...traderAdjusts, ...extraAdjustVars],
    traderSkewGuide,
    staticInputs,
    embeddedLookups,
    sheetExports,
    expectedOutputs,
    parityGaps: model.missingForParity,
    model,
    pmQaSelections,
    pmQaStatus,
  };

  return {
    ...partial,
    dataFlow: buildDataFlow(partial),
  };
}

export function buildMarketGuides(
  fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID
): MarketGuideIndex {
  const guides = pricingModels
    .map((m) => buildGuide(m, fixtureId))
    .sort((a, b) => a.marketName.localeCompare(b.marketName));

  return { guides, variables };
}

export function getMarketGuide(
  guideId: string,
  fixtureId: string = PM_QA_DEFAULT_FIXTURE_ID
): MarketTradingGuide | undefined {
  return buildMarketGuides(fixtureId).guides.find((g) => g.id === guideId);
}
