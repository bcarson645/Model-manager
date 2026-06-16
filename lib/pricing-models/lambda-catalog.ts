import type { PricingModelDefinition } from "./types";
import type { SharedPricingArtifact } from "./types-shared";

export type LambdaCategory =
  | "all"
  | "Matches"
  | "Teams"
  | "Players"
  | "Head-to-head"
  | "Groups"
  | "Shared";

export function getLambdaCategory(
  namespace: string
): Exclude<LambdaCategory, "all" | "Shared"> {
  if (namespace.includes(".Groups.")) return "Groups";
  if (namespace.includes(".Teams.")) return "Teams";
  if (namespace.includes(".Players.")) return "Players";
  if (namespace.includes(".HeadToHeads.")) return "Head-to-head";
  return "Matches";
}

export function modelSearchHaystack(model: PricingModelDefinition): string {
  return [
    model.id,
    model.registryModelId,
    model.className,
    model.marketName,
    model.marketCode,
    model.namespace,
    model.filePath,
    model.description,
    String(model.marketId),
    String(model.legacyMarketId),
    ...model.inputs.map((i) => `${i.name} ${i.label} ${i.csharpPath} ${i.excelRef ?? ""}`),
    ...model.outputs.map((o) => `${o.name} ${o.label} ${o.csharpPath ?? ""} ${o.excelRef ?? ""}`),
    ...model.embeddedConstants.map((c) => `${c.name} ${c.value}`),
    ...model.missingForParity,
    ...(model.childModels ?? []),
  ].join(" ");
}

export function artifactSearchHaystack(artifact: SharedPricingArtifact): string {
  return [
    artifact.id,
    artifact.name,
    artifact.namespace,
    artifact.filePath,
    artifact.description,
    artifact.kind,
    ...artifact.usedBy,
    ...(artifact.methods?.map((m) => `${m.name} ${m.signature}`) ?? []),
    ...(artifact.missingForParity ?? []),
  ].join(" ");
}

export function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query.toLowerCase());
}
