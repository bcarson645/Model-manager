"use client";

import { useMemo, useState } from "react";
import type { ModelDefinition, ModelPhase } from "@/lib/types";
import { ModelStatusBadge, PhaseBadge, SourceBadge } from "./StatusBadge";

export function ModelRegistry({ models }: { models: ModelDefinition[] }) {
  const [phaseFilter, setPhaseFilter] = useState<ModelPhase | "all">("pre_match");

  const filtered = useMemo(() => {
    if (phaseFilter === "all") return models;
    return models.filter((m) => m.phase === phaseFilter);
  }, [models, phaseFilter]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Model registry</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pre-match models price before the toss. Live models update from the UI,
          Scoring, and Pricing sheets once the match is underway.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "pre_match", "in_play"] as const).map((phase) => (
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
              {phase === "all" ? "All phases" : phase === "pre_match" ? "Pre-match" : "Live"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Phase</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Excel outputs</th>
              <th className="px-4 py-3 font-medium">Sources</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface">
            {filtered.map((model) => (
              <tr key={model.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{model.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{model.market}</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">{model.description}</p>
                </td>
                <td className="px-4 py-4">
                  <PhaseBadge phase={model.phase} />
                </td>
                <td className="px-4 py-4 font-mono text-xs text-slate-400">
                  {model.marketCode ?? "—"}
                </td>
                <td className="px-4 py-4">
                  {model.excelOutputs?.length ? (
                    <ul className="space-y-1 text-xs text-slate-400">
                      {model.excelOutputs.map((ref) => (
                        <li key={`${ref.sheet}-${ref.cell}`}>
                          <span className="font-mono text-slate-300">
                            {ref.sheet}!{ref.cell}
                          </span>
                          {ref.description && (
                            <span className="text-slate-500"> — {ref.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    {model.sources.excel && (
                      <div className="flex items-start gap-2">
                        <SourceBadge source="excel" />
                        <div className="text-xs text-slate-400">
                          <p className="font-mono text-slate-500">{model.sources.excel.location}</p>
                        </div>
                      </div>
                    )}
                    {model.sources.lambda && (
                      <div className="flex items-start gap-2">
                        <SourceBadge source="lambda" />
                        <div className="text-xs text-slate-400">
                          <p className="font-mono text-slate-500">{model.sources.lambda.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <ModelStatusBadge status={model.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
