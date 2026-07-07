import type { RegistrySummary } from "@/lib/types";
import type { ModelLaneMeta } from "./types";

const emptySummary: RegistrySummary = {
  totalModels: 0,
  preMatchModels: 0,
  inPlayModels: 0,
  excelOnly: 0,
  lambdaOnly: 0,
  bothSources: 0,
  tradingInputsRequired: 0,
  parityIssues: 0,
  outputMismatches: 0,
};

/** Live (in-play) model registry — populate when Excel / Lambda definitions are provided. */
export const liveLane: ModelLaneMeta = {
  id: "live",
  title: "Live models",
  shortLabel: "Live",
  subtitle: "In-play · Scoring / UI / Pricing sheets → Lambda",
  description:
    "Models that update during the match from live state, trader adjusts on Scoring and UI tabs, and Pricing sheet outputs. Distinct from pre-match Prep Work / PM Publication.",
  excelNote:
    "Live workbooks typically use Scoring, UI, and Pricing sheets rather than Prep Work. Model list and cell mappings will be added when workbooks are supplied.",
  models: [],
  variables: [],
  summary: { ...emptySummary },
};
