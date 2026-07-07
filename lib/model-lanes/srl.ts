import {
  buildSrlSummary,
  buildSrlVariables,
  srlPmModelsAsRegistry,
} from "./srl-pm-registry";
import type { ModelLaneMeta } from "./types";

/** SRL (Simulated Reality League) lane — PM models from Atlas workbook. */
export const srlLane: ModelLaneMeta = {
  id: "srl",
  title: "SRL models",
  shortLabel: "SRL",
  subtitle: "Simulated Reality League · Atlas PM Publication",
  description:
    "SRL pre-match models published on PM Publication (Atlas template). No trader adjusts — validate Lambda against column G/F directly. Live SRL models will be added separately.",
  excelNote:
    "Source workbook: Atlas 196 (3).xlsm. Re-extract with scripts/extract-srl-atlas.py when the template changes.",
  models: srlPmModelsAsRegistry(),
  variables: buildSrlVariables(),
  summary: buildSrlSummary(),
};
