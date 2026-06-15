"use client";

import { useMemo, useState } from "react";
import type { ModelDefinition, VariableDefinition, VariableScope } from "@/lib/types";
import { ParityBadge, ScopeBadge, SourceBadge } from "./StatusBadge";

const scopeFilters: Array<VariableScope | "all"> = [
  "all",
  "embedded",
  "parameter",
  "trading_input",
];

export function VariableMatrix({
  variables,
  models,
}: {
  variables: VariableDefinition[];
  models: ModelDefinition[];
}) {
  const [scopeFilter, setScopeFilter] = useState<VariableScope | "all">("all");
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);

  const modelNameById = useMemo(
    () => Object.fromEntries(models.map((m) => [m.id, m.name])),
    [models]
  );

  const filtered = variables.filter((variable) => {
    if (scopeFilter !== "all" && variable.scope !== scopeFilter) return false;
    if (showIssuesOnly && variable.parity === "matched") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Variable inventory</h2>
        <p className="mt-1 text-sm text-slate-400">
          See what each model expects: values baked into the function, parameters
          supplied at runtime, and inputs traders must control.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {scopeFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setScopeFilter(filter)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  scopeFilter === filter
                    ? "border-accent bg-accent/20 text-white"
                    : "border-surface-border bg-surface text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter === "all" ? "All scopes" : filter.replace("_", " ")}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showIssuesOnly}
              onChange={(e) => setShowIssuesOnly(e.target.checked)}
              className="rounded border-surface-border bg-surface"
            />
            Show parity issues only
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Variable</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Models</th>
              <th className="px-4 py-3 font-medium">Excel</th>
              <th className="px-4 py-3 font-medium">Lambda</th>
              <th className="px-4 py-3 font-medium">Parity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface">
            {filtered.map((variable) => (
              <tr key={variable.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{variable.label}</p>
                  <p className="font-mono text-xs text-slate-500">{variable.name}</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">{variable.description}</p>
                </td>
                <td className="px-4 py-4">
                  <ScopeBadge scope={variable.scope} />
                </td>
                <td className="px-4 py-4 text-xs text-slate-400">
                  {variable.modelIds.map((id) => modelNameById[id] ?? id).join(", ")}
                </td>
                <td className="px-4 py-4">
                  <SourcePresence source="excel" info={variable.sources.excel} />
                </td>
                <td className="px-4 py-4">
                  <SourcePresence source="lambda" info={variable.sources.lambda} />
                </td>
                <td className="px-4 py-4">
                  <ParityBadge parity={variable.parity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourcePresence({
  source,
  info,
}: {
  source: "excel" | "lambda";
  info?: { present: boolean; defaultValue?: string | number | boolean; notes?: string };
}) {
  if (!info?.present) {
    return <span className="text-xs text-slate-600">Not present</span>;
  }

  return (
    <div className="space-y-1">
      <SourceBadge source={source} />
      {info.defaultValue !== undefined && (
        <p className="text-xs text-slate-400">Default: {String(info.defaultValue)}</p>
      )}
      {info.notes && <p className="text-xs text-slate-500">{info.notes}</p>}
    </div>
  );
}
