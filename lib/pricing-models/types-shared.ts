export type SharedPricingArtifact = {
  id: string;
  name: string;
  kind: "static_helper" | "interface" | "base_class";
  namespace: string;
  filePath: string;
  description: string;
  usedBy: string[];
  methods?: Array<{ name: string; signature: string; notes?: string }>;
  embeddedConstants?: Array<{ name: string; value: string; notes?: string }>;
  inputs?: Array<{
    name: string;
    label: string;
    scope: "embedded" | "parameter" | "trading_input";
    csharpPath: string;
    excelRef?: string;
    notes?: string;
  }>;
  missingForParity?: string[];
};
