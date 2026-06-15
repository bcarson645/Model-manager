import type { PricingModelDefinition } from "@/lib/pricing-models/types";
import type { VariableDefinition } from "@/lib/types";
import type {
  PmPublicationSelection,
  PmQaRowStatus,
} from "@/lib/workbooks/pm-publication-qa";
import type { TraderSkewGuide } from "./trader-skew-guides";
import type { AdjustOutcomePreview } from "./adjust-outcomes";

export type { TraderSkewGuide } from "./trader-skew-guides";
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
  traderSkewGuide: TraderSkewGuide;
  adjustOutcomePreview: AdjustOutcomePreview | null;
  staticInputs: GuideField[];
  embeddedLookups: GuideField[];
  sheetExports: GuideField[];
  expectedOutputs: GuideOutput[];
  dataFlow: string[];
  parityGaps: string[];
  model: PricingModelDefinition;
  pmQaSelections: PmPublicationSelection[];
  pmQaStatus: PmQaRowStatus;
  pmQaFixtureId: string;
};

export type MarketGuideIndex = {
  guides: MarketTradingGuide[];
  variables: VariableDefinition[];
};
