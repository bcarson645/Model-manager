import { pricingModels } from "@/lib/pricing-models/registry";
import type { PricingModelInput, PricingModelOutput } from "@/lib/pricing-models/types";
import {
  excelConventions,
  pmPublicationMappings,
} from "@/lib/workbooks/excel-mappings";
import { models as registryModels, variables } from "@/lib/sample-data";
import type {
  ExcelTradingMapping,
  GuideField,
  GuideOutput,
  MarketGuideIndex,
  MarketTradingGuide,
} from "./types";

const SHEET_PREP = "Prep Work";
const SHEET_PM = "PM Publication";

function feControlForAdjust(input: PricingModelInput): string {
  if (input.notes?.includes("÷10") || input.csharpPath.includes("/ 10")) {
    return "Numeric input — Lambda divides by 10 before applying";
  }
  if (input.notes?.includes("percentage") || input.csharpPath.includes("/ 100")) {
    return "Percentage-point skew — Lambda divides by 100";
  }
  if (input.csharpPath.includes("subtract") || input.notes?.includes("subtract")) {
    return "Skew control — subtracted from probability in Lambda";
  }
  return "Direct numeric adjust — added to mean/line or probability per Lambda path";
}

function feDisplayForOutput(output: PricingModelOutput): string {
  switch (output.type) {
    case "line":
      return `Display the published line (Excel column F). Trader may nudge via adjust column ${excelConventions.preMatchAdjustColumn}; Lambda recomputes under/over probabilities.`;
    case "outcome_set":
      return `One row per selection: probability (column ${pmPublicationMappings.probabilityColumn}), derived price (column ${pmPublicationMappings.priceColumn}). FE shows selection list with prob/price columns.`;
    case "probability":
      return `Single selection probability in column ${pmPublicationMappings.probabilityColumn}; price in ${pmPublicationMappings.priceColumn}.`;
    case "price":
      return `Displayed price (column ${pmPublicationMappings.priceColumn}) — usually derived from probability.`;
    default:
      return "Display model output after Lambda pricing run.";
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
      ? "Trader control on new FE (replaces purple PM Publication cell)"
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
      `Trader sets ${guide.traderAdjusts.length} adjust value(s) on the FE → maps to AdjustmentsPM (today: ${SHEET_PM} column ${excelConventions.preMatchAdjustColumn} purple cells).`
    );
  } else {
    steps.push("No trader adjusts in Lambda for this market — FE displays model output only.");
  }

  steps.push(
    `Lambda ${guide.className} runs with IPricingInputs → produces ${guide.expectedOutputs.length} output group(s).`
  );

  steps.push(
    `FE renders ${guide.expectedOutputs.map((o) => o.label.toLowerCase()).join(", ")} — mirror PM Publication columns F (line), G (prob), J (price) where applicable.`
  );

  return steps;
}

function buildGuide(model: (typeof pricingModels)[0]): MarketTradingGuide {
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

  const partial = {
    id: model.id,
    registryModelId,
    className: model.className,
    marketName: model.marketName,
    marketCode: model.marketCode,
    phase: model.phase,
    description: model.description,
    lambdaClass: `${model.namespace}.${model.className}`,
    excelTrading: buildExcelTrading(registryModelId),
    traderAdjusts: [...traderAdjusts, ...extraAdjustVars],
    staticInputs,
    embeddedLookups,
    sheetExports,
    expectedOutputs,
    parityGaps: model.missingForParity,
    model,
  };

  return {
    ...partial,
    dataFlow: buildDataFlow(partial),
  };
}

export function buildMarketGuides(): MarketGuideIndex {
  const guides = pricingModels
    .map(buildGuide)
    .sort((a, b) => a.marketName.localeCompare(b.marketName));

  return { guides, variables };
}

export function getMarketGuide(guideId: string): MarketTradingGuide | undefined {
  return buildMarketGuides().guides.find((g) => g.id === guideId);
}
