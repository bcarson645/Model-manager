import type { PricingModelDefinition } from "@/lib/pricing-models/types";
import type { VariableDefinition } from "@/lib/types";

export type ExcelTradingMapping = {
  sheet: string;
  rows?: string;
  market?: string;
  adjustCells?: string[];
  adjustCell?: string;
  lineCell?: string;
  probabilityCells?: string[];
  lambdaAdjust?: string;
  selections?: Array<{
    row: number;
    selection: string;
    prob: string;
    adjust: string;
    lambda: string;
  }>;
  notes?: string;
};

export type GuideField = {
  id: string;
  label: string;
  description?: string;
  csharpPath?: string;
  excelRef?: string;
  lambdaNotes?: string;
  defaultValue?: string | number | boolean;
  feControl?: string;
};

export type GuideOutput = {
  label: string;
  type: string;
  excelRef?: string;
  feDisplay: string;
  csharpPath?: string;
  notes?: string;
};

export type MarketTradingGuide = {
  id: string;
  registryModelId: string;
  className: string;
  marketName: string;
  marketCode: string;
  phase: "pre_match" | "in_play";
  description: string;
  lambdaClass: string;
  excelTrading?: ExcelTradingMapping;
  traderAdjusts: GuideField[];
  staticInputs: GuideField[];
  embeddedLookups: GuideField[];
  sheetExports: GuideField[];
  expectedOutputs: GuideOutput[];
  dataFlow: string[];
  parityGaps: string[];
  model: PricingModelDefinition;
};

export type MarketGuideIndex = {
  guides: MarketTradingGuide[];
  variables: VariableDefinition[];
};
