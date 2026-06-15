"use client";

import { useMemo, useState } from "react";
import type {
  ComparisonFixture,
  ModelDefinition,
  ModelPhase,
  RegistrySummary,
  VariableDefinition,
  WorkbookSnapshot,
} from "@/lib/types";
import { ModelRegistry } from "./ModelRegistry";
import { OutputComparison } from "./OutputComparison";
import { PmMarketCatalog } from "./PmMarketCatalog";
import { PricingModelPanel } from "./PricingModelPanel";
import { SharedArtifactPanel } from "./SharedArtifactPanel";
import { RatingFormulaPanel } from "./RatingFormulaPanel";
import { RegistryOverview } from "./RegistryOverview";
import { VariableMatrix } from "./VariableMatrix";
import { pricingModels } from "@/lib/pricing-models/registry";
import { sharedPricingArtifacts } from "@/lib/pricing-models/registry-shared";

type Tab = "overview" | "models" | "pm-markets" | "lambda" | "variables" | "compare";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "Models" },
  { id: "pm-markets", label: "PM markets" },
  { id: "lambda", label: "Lambda code" },
  { id: "variables", label: "Variables" },
  { id: "compare", label: "Compare outputs" },
];

type DashboardProps = {
  summary: RegistrySummary;
  models: ModelDefinition[];
  variables: VariableDefinition[];
  comparison: ComparisonFixture;
  workbook: WorkbookSnapshot;
};

export function Dashboard({
  summary,
  models,
  variables,
  comparison,
  workbook,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [phaseFilter, setPhaseFilter] = useState<ModelPhase>("pre_match");

  const phaseModelIds = useMemo(
    () =>
      new Set(
        models.filter((m) => m.phase === phaseFilter).map((m) => m.id)
      ),
    [models, phaseFilter]
  );

  const filteredVariables = useMemo(
    () =>
      variables.filter((v) =>
        v.modelIds.some((id) => phaseModelIds.has(id))
      ),
    [variables, phaseModelIds]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {(activeTab === "variables" || activeTab === "compare") && (
          <div className="flex gap-2">
            {(["pre_match", "in_play"] as const).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setPhaseFilter(phase)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  phaseFilter === phase
                    ? "border-accent bg-accent/20 text-white"
                    : "border-surface-border bg-surface text-slate-400 hover:text-slate-200"
                }`}
              >
                {phase === "pre_match" ? "Pre-match" : "Live"}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "overview" && (
        <>
          <RegistryOverview summary={summary} workbook={workbook} />
          <RatingFormulaPanel />
        </>
      )}
      {activeTab === "models" && <ModelRegistry models={models} />}
      {activeTab === "pm-markets" && <PmMarketCatalog />}
      {activeTab === "lambda" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h2 className="text-lg font-semibold text-white">Lambda pricing models</h2>
            <p className="mt-1 text-sm text-slate-400">
              Parsed from pasted C# — stored in{" "}
              <span className="font-mono text-slate-300">reference/pricing-models/</span>
            </p>
          </div>
          {pricingModels.map((model) => (
            <PricingModelPanel key={model.id} model={model} />
          ))}
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h2 className="text-lg font-semibold text-white">Shared helpers &amp; interfaces</h2>
            <p className="mt-1 text-sm text-slate-400">
              Cross-market utilities referenced by multiple pricing models.
            </p>
          </div>
          {sharedPricingArtifacts.map((artifact) => (
            <SharedArtifactPanel key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}
      {activeTab === "variables" && (
        <VariableMatrix variables={filteredVariables} models={models} />
      )}
      {activeTab === "compare" && (
        <>
          {phaseFilter !== comparison.phase ? (
            <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
              No comparison fixture loaded for{" "}
              {phaseFilter === "pre_match" ? "pre-match" : "live"} models yet.
              Send a live-state workbook to add in-play comparisons.
            </div>
          ) : (
            <OutputComparison fixture={comparison} />
          )}
        </>
      )}
    </div>
  );
}
