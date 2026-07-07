"use client";

import { useState } from "react";
import type { ModelLaneMeta } from "@/lib/model-lanes/types";
import { ModelRegistry } from "./ModelRegistry";

type LaneTab = "overview" | "models" | "tables" | "variables";

const tabs: Array<{ id: LaneTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "Models" },
  { id: "tables", label: "Tables" },
  { id: "variables", label: "Variables" },
];

type ModelLanePanelProps = {
  lane: ModelLaneMeta;
};

export function ModelLanePanel({ lane }: ModelLanePanelProps) {
  const [activeTab, setActiveTab] = useState<LaneTab>("overview");
  const accent =
    lane.id === "live"
      ? "text-amber-400 border-amber-500/40 bg-amber-950/20"
      : "text-violet-400 border-violet-500/40 bg-violet-950/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? lane.id === "live"
                  ? "bg-amber-600 text-white"
                  : "bg-violet-600 text-white"
                : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className={`rounded-2xl border p-6 ${accent}`}>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
            {lane.shortLabel}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{lane.title}</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">{lane.description}</p>
          <p className="mt-4 max-w-3xl text-sm text-slate-400">{lane.excelNote}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Models" value={String(lane.summary.totalModels)} />
            <StatCard
              label="Trading inputs"
              value={String(lane.summary.tradingInputsRequired)}
            />
            <StatCard label="Parity issues" value={String(lane.summary.parityIssues)} />
            <StatCard
              label="Output mismatches"
              value={String(lane.summary.outputMismatches)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-surface-border bg-surface/50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Ready to add</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
              <li>Model registry entries (Excel outputs + Lambda paths)</li>
              <li>Workbook table extracts (formulas and cell references)</li>
              <li>Variable matrix (embedded / parameter / trading_input)</li>
              <li>PM Publication or lane-specific output QA rows</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === "models" &&
        (lane.models.length > 0 ? (
          <ModelRegistry models={lane.models} />
        ) : (
          <EmptyLaneCard
            lane={lane}
            title="No models registered yet"
            message="Model definitions for this lane will appear here once added to the registry."
          />
        ))}

      {activeTab === "tables" && (
        <EmptyLaneCard
          lane={lane}
          title="Workbook tables"
          message="Prep-style table viewers (selectable cells, formulas, data sources) will be added when the Excel template for this lane is provided."
        />
      )}

      {activeTab === "variables" && (
        <EmptyLaneCard
          lane={lane}
          title="Variable matrix"
          message="Excel vs Lambda variable tracking for this lane will mirror the pre-match Variables tab."
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-white">{value}</p>
    </div>
  );
}

function EmptyLaneCard({
  lane,
  title,
  message,
}: {
  lane: ModelLaneMeta;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-10 text-center">
      <p
        className={`text-xs font-semibold uppercase tracking-widest ${
          lane.id === "live" ? "text-amber-400" : "text-violet-400"
        }`}
      >
        {lane.shortLabel}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">{message}</p>
    </div>
  );
}
