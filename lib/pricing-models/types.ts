export type PricingModelInput = {
  name: string;
  label: string;
  scope: "embedded" | "parameter" | "trading_input";
  csharpPath: string;
  excelRef?: string;
  notes?: string;
};

export type PricingModelOutput = {
  name: string;
  label: string;
  type: "probability" | "price" | "line" | "outcome_set";
  csharpPath?: string;
  excelRef?: string;
  notes?: string;
};

export type PricingModelDefinition = {
  id: string;
  registryModelId: string;
  className: string;
  namespace: string;
  filePath: string;
  phase: "pre_match" | "in_play";
  marketName: string;
  marketCode: string;
  marketId: number;
  legacyMarketId: number;
  description: string;
  childModels?: string[];
  inputs: PricingModelInput[];
  embeddedConstants: Array<{ name: string; value: string; notes?: string }>;
  outputs: PricingModelOutput[];
  missingForParity: string[];
};
