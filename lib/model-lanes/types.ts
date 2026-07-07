import type { ModelDefinition, RegistrySummary, VariableDefinition } from "@/lib/types";

export type ModelManagerLane = "pre_match" | "live" | "srl" | "updates";

export type ModelLaneMeta = {
  id: Exclude<ModelManagerLane, "pre_match">;
  title: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  excelNote: string;
  models: ModelDefinition[];
  variables: VariableDefinition[];
  summary: RegistrySummary;
};