export type ModelUpdateCategory =
  | "pricing_skew"
  | "market_suspend"
  | "market_visibility"
  | "lookup_data";

export type ModelUpdateStatus =
  | "documented"
  | "lambda_mapped"
  | "implemented"
  | "verified";

export type ModelUpdate = {
  id: string;
  title: string;
  summary: string;
  category: ModelUpdateCategory;
  formats: string[];
  phase: "live" | "pre_match" | "both";
  atlas: {
    workbook: string;
    sheet: string;
    cells: string[];
    changeSummary: string;
    before?: string;
    after?: string;
    formulaNote?: string;
  };
  lambda: {
    layer: "model" | "pricing_post_process" | "market_config" | "lookup";
    targetHint: string;
    changeType: "constant" | "conditional" | "threshold" | "spawn_flag" | "table_data";
    steps: string[];
  };
  verification: string[];
  status: ModelUpdateStatus;
  relatedMarkets?: string[];
};
