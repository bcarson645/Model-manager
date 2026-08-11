"use client";

import { useState } from "react";
import type {
  ComparisonFixture,
  ModelDefinition,
  RegistrySummary,
  VariableDefinition,
  WorkbookSnapshot,
} from "@/lib/types";
import type { AnalysisSection, DataFormat } from "@/lib/scorecards/types";
import {
  getModelLaneMeta,
  modelLaneNav,
  type ModelManagerLane,
} from "@/lib/model-lanes";
import { DataAnalysisPanel } from "./DataAnalysisPanel";
import { ModelLanePanel } from "./ModelLanePanel";
import { ModelManagerDashboard } from "./ModelManagerDashboard";
import { SrlPmPanel } from "./SrlPmPanel";
import { ModelUpdatesPanel } from "./ModelUpdatesPanel";

export type AppArea = "model-manager" | "data-analysis";

type AppShellProps = {
  summary: RegistrySummary;
  models: ModelDefinition[];
  variables: VariableDefinition[];
  comparison: ComparisonFixture;
  workbook: WorkbookSnapshot;
  matchId: string;
};

const areaNav: Array<{ id: AppArea; label: string; subtitle: string }> = [
  {
    id: "model-manager",
    label: "Model Manager",
    subtitle: "Pre-match · Live · SRL · Updates · Excel → Lambda",
  },
  {
    id: "data-analysis",
    label: "Data Analysis",
    subtitle: "Match & player stats · query log",
  },
];

const formatNav: Array<{ id: DataFormat; label: string; available: boolean }> = [
  { id: "odi", label: "ODI", available: true },
  { id: "t20", label: "T20", available: true },
  { id: "first-class", label: "First class", available: false },
];

const sectionNav: Array<{ id: AnalysisSection; label: string }> = [
  { id: "match-analysis", label: "Match analysis" },
  { id: "player-analysis", label: "Player analysis" },
  { id: "queries", label: "Queries" },
];

const sectionLabels: Record<AnalysisSection, string> = {
  "match-analysis": "Match analysis",
  "player-analysis": "Player analysis",
  queries: "Queries",
};

export function AppShell({
  summary,
  models,
  variables,
  comparison,
  workbook,
  matchId,
}: AppShellProps) {
  const [activeArea, setActiveArea] = useState<AppArea>("model-manager");
  const [activeModelLane, setActiveModelLane] =
    useState<ModelManagerLane>("pre_match");
  const [activeFormat, setActiveFormat] = useState<DataFormat>("odi");
  const [activeSection, setActiveSection] =
    useState<AnalysisSection>("match-analysis");
  const current = areaNav.find((a) => a.id === activeArea)!;
  const modelLaneLabel = modelLaneNav.find((l) => l.id === activeModelLane)?.label;

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border bg-surface-raised/50 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p
              className={`text-[10px] font-semibold uppercase tracking-widest sm:text-xs ${
                activeArea === "data-analysis" ? "text-emerald-400" : "text-accent"
              }`}
            >
              {current.label}
              {activeArea === "data-analysis" && (
                <span className="hidden text-slate-500 sm:inline">
                  {" "}
                  · {formatNav.find((f) => f.id === activeFormat)?.label} ·{" "}
                  {sectionLabels[activeSection]}
                </span>
              )}
              {activeArea === "model-manager" && activeModelLane !== "pre_match" && (
                <span className="text-slate-500">
                  {" "}
                  ·{" "}
                  {activeModelLane === "updates"
                    ? "Updates"
                    : modelLaneLabel}
                </span>
              )}
            </p>
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
              {activeArea === "model-manager"
                ? activeModelLane === "pre_match"
                  ? "Cricket betting model registry"
                  : activeModelLane === "live"
                    ? "Live model registry"
                    : activeModelLane === "srl"
                      ? "SRL model registry"
                      : "Model updates — Atlas → Lambda"
                : "Historical scorecard analysis"}
            </h1>
            <p className="mt-1 hidden text-sm text-slate-400 sm:block">
              {activeArea === "model-manager" && activeModelLane === "pre_match" && current.subtitle}
              {activeArea === "model-manager" && activeModelLane !== "pre_match" && activeModelLane !== "updates" && (
                getModelLaneMeta(activeModelLane as "live" | "srl").subtitle
              )}
              {activeArea === "model-manager" && activeModelLane === "updates" && (
                "Atlas workbook changes mapped to Lambda implementation steps"
              )}
              {activeArea === "data-analysis" && current.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {activeArea === "model-manager" && (
              <span className="hidden rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-slate-400 sm:inline-flex">
                Match {matchId}
              </span>
            )}
          </div>
        </div>

        {/* Mobile workspace / format / section strip */}
        <div className="flex gap-2 overflow-x-auto border-t border-surface-border px-4 py-2 lg:hidden">
          {areaNav.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => setActiveArea(area.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeArea === area.id
                  ? area.id === "data-analysis"
                    ? "bg-emerald-600/20 text-emerald-300"
                    : "bg-accent/20 text-white"
                  : "bg-surface text-slate-400"
              }`}
            >
              {area.label}
            </button>
          ))}
          {activeArea === "data-analysis" && (
            <>
              <span className="shrink-0 self-center text-slate-600">|</span>
              {formatNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFormat(item.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeFormat === item.id
                      ? "bg-emerald-600/15 text-emerald-300"
                      : "bg-surface text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <span className="shrink-0 self-center text-slate-600">|</span>
              {sectionNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeSection === item.id
                      ? "bg-emerald-600/10 text-emerald-300/90"
                      : "bg-surface text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
          {activeArea === "model-manager" && (
            <>
              <span className="shrink-0 self-center text-slate-600">|</span>
              {modelLaneNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModelLane(item.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeModelLane === item.id
                      ? "bg-accent/20 text-white"
                      : "bg-surface text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-5.5rem)]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised/30 px-3 py-6 lg:flex">
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>
          <nav className="mt-3 space-y-1">
            {areaNav.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveArea(area.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeArea === area.id
                    ? area.id === "data-analysis"
                      ? "bg-emerald-600/20 text-emerald-300"
                      : "bg-accent/20 text-white"
                    : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
                }`}
              >
                {area.label}
              </button>
            ))}
          </nav>

          {activeArea === "model-manager" && (
            <>
              <p className="mb-2 mt-8 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Model lane
              </p>
              <nav className="space-y-1">
                {modelLaneNav.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModelLane(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeModelLane === item.id
                        ? item.id === "live"
                          ? "bg-amber-600/15 font-medium text-amber-300"
                          : item.id === "srl"
                            ? "bg-violet-600/15 font-medium text-violet-300"
                            : item.id === "updates"
                              ? "bg-sky-600/15 font-medium text-sky-300"
                            : "bg-accent/20 font-medium text-white"
                        : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </>
          )}

          {activeArea === "data-analysis" && (
            <>
              <p className="mb-2 mt-8 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Format
              </p>
              <nav className="space-y-1">
                {formatNav.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveFormat(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeFormat === item.id
                        ? "bg-emerald-600/15 font-medium text-emerald-300"
                        : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                    {!item.available && (
                      <span className="text-[10px] uppercase text-slate-600">soon</span>
                    )}
                  </button>
                ))}
              </nav>

              <p className="mb-2 mt-8 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Section
              </p>
              <nav className="space-y-1">
                {sectionNav.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeSection === item.id
                        ? "bg-emerald-600/10 font-medium text-emerald-300/90"
                        : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </>
          )}
        </aside>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-8">
          {activeArea === "model-manager" && activeModelLane === "pre_match" && (
            <ModelManagerDashboard
              models={models}
              variables={variables}
              comparison={comparison}
            />
          )}
          {activeArea === "model-manager" && activeModelLane === "live" && (
            <ModelLanePanel lane={getModelLaneMeta("live")} />
          )}
          {activeArea === "model-manager" && activeModelLane === "srl" && (
            <SrlPmPanel />
          )}
          {activeArea === "model-manager" && activeModelLane === "updates" && (
            <ModelUpdatesPanel />
          )}
          {activeArea === "data-analysis" && (
            <DataAnalysisPanel
              activeFormat={activeFormat}
              activeSection={activeSection}
            />
          )}
        </main>
      </div>
    </div>
  );
}
