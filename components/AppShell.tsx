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
import { DataAnalysisPanel } from "./DataAnalysisPanel";
import { ModelManagerDashboard } from "./ModelManagerDashboard";

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
    subtitle: "Pre-match & live · Excel → Lambda · trading",
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
  const [activeFormat, setActiveFormat] = useState<DataFormat>("odi");
  const [activeSection, setActiveSection] =
    useState<AnalysisSection>("match-analysis");
  const current = areaNav.find((a) => a.id === activeArea)!;

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border bg-surface-raised/50 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${
                activeArea === "data-analysis" ? "text-emerald-400" : "text-accent"
              }`}
            >
              {current.label}
              {activeArea === "data-analysis" && (
                <span className="text-slate-500">
                  {" "}
                  · {formatNav.find((f) => f.id === activeFormat)?.label} ·{" "}
                  {sectionLabels[activeSection]}
                </span>
              )}
            </p>
            <h1 className="text-xl font-semibold text-white">
              {activeArea === "model-manager"
                ? "Cricket betting model registry"
                : "Historical scorecard analysis"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{current.subtitle}</p>
          </div>
          {activeArea === "model-manager" && (
            <span className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-slate-400">
              Match {matchId}
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-5.5rem)]">
        <aside className="flex w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised/30 px-3 py-6">
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

        <main className="min-w-0 flex-1 px-6 py-8">
          {activeArea === "model-manager" && (
            <ModelManagerDashboard
              summary={summary}
              models={models}
              variables={variables}
              comparison={comparison}
              workbook={workbook}
            />
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
