"use client";

import { useMemo, useState } from "react";
import { buildMarketGuides } from "@/lib/trading-guide";
import {
  assessPmQaRow,
  getPmQaCoverageStats,
  PM_QA_DEFAULT_FIXTURE_ID,
  pmQaFixtureList,
} from "@/lib/workbooks/pm-publication-qa";
import { traderAdjustArchitecture } from "@/lib/workbooks/trader-adjust-conventions";
import { PmColumnLegend, PmQaTable } from "./PmQaTable";

export function PmPublicationQaPanel() {
  const [fixtureId, setFixtureId] = useState(PM_QA_DEFAULT_FIXTURE_ID);
  const guides = useMemo(() => buildMarketGuides(fixtureId).guides, [fixtureId]);
  const stats = useMemo(() => getPmQaCoverageStats(fixtureId), [fixtureId]);
  const [filter, setFilter] = useState<"all" | "with_data" | "errors" | "pending">("all");

  const filteredRows = useMemo(() => {
    return guides
      .map((g) => ({
        guide: g,
        selections: g.pmQaSelections,
        hasData: g.pmQaSelections.length > 0,
        hasError: g.pmQaSelections.some(
          (s) => assessPmQaRow(g.registryModelId, s, fixtureId).status === "excel_error"
        ),
        pending: g.pmQaStatus === "pending_lambda" && g.pmQaSelections.length > 0,
      }))
      .filter((r) => {
        if (filter === "with_data") return r.hasData;
        if (filter === "errors") return r.hasError;
        if (filter === "pending") return r.pending;
        return true;
      });
  }, [guides, filter, fixtureId]);

  const withSnapshot = guides.filter((g) => g.pmQaSelections.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">PM Publication QA baseline</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              {stats.totalRows} rows extracted across {stats.snapshotKeys} snapshot groups. Column{" "}
              <span className="font-mono text-orange-200">F</span> is the offered line,{" "}
              <span className="font-mono text-orange-200">G</span> base or published probability,{" "}
              <span className="font-mono text-orange-200">I</span> post-model trader skew (purple,
              typically ÷100 → ±0.01 prob). {traderAdjustArchitecture.qaNote}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {withSnapshot} of {guides.length} Lambda models have PM rows on this fixture.
            </p>
          </div>
          <div className="shrink-0">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Fixture
            </label>
            <select
              value={fixtureId}
              onChange={(e) => setFixtureId(e.target.value)}
              className="mt-1 block min-w-[14rem] rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              {pmQaFixtureList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-slate-300">Column reference</h3>
        <div className="mt-4">
          <PmColumnLegend />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All models"],
            ["with_data", "With PM data"],
            ["pending", "Awaiting Lambda"],
            ["errors", "Excel errors"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === id
                ? "border-accent bg-accent/20 text-white"
                : "border-surface-border text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRows.map(({ guide, selections }) => (
          <details
            key={guide.id}
            className="group rounded-2xl border border-surface-border bg-surface-raised"
            open={selections.length > 0 && selections.length <= 3}
          >
            <summary className="cursor-pointer list-none p-5 marker:content-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{guide.marketName}</p>
                  <p className="font-mono text-xs text-slate-500">{guide.className}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {selections.length} row{selections.length !== 1 ? "s" : ""} · {guide.pmQaStatus}
                </span>
              </div>
            </summary>
            <div className="border-t border-surface-border px-5 pb-5 pt-4">
              <PmQaTable
                registryModelId={guide.registryModelId}
                selections={selections}
                fixtureId={fixtureId}
              />
              {guide.pmQaSelections.length === 0 && (
                <p className="text-xs text-slate-500">
                  Add row mapping in{" "}
                  <span className="font-mono">scripts/extract-pm-publication-qa.py</span> to
                  capture this market.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        Re-extract:{" "}
        <span className="font-mono">python scripts/extract-pm-publication-qa.py nz-sa-63406779</span>
      </p>
    </div>
  );
}
