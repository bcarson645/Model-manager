"use client";

import { useMemo, useState } from "react";
import {
  buildSrlVariables,
  getSrlPmSnapshot,
  srlPmModels,
  srlPmModelsAsRegistry,
} from "@/lib/model-lanes/srl-pm-registry";
import { ModelRegistry } from "./ModelRegistry";
import { VariableMatrix } from "./VariableMatrix";

type SrlTab = "overview" | "models" | "pm-qa" | "variables";

const tabs: Array<{ id: SrlTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "PM models" },
  { id: "pm-qa", label: "PM Publication" },
  { id: "variables", label: "Variables" },
];

function formatPmValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object" && v !== null && "error" in v) {
    return String((v as { error: string }).error);
  }
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(4);
  return String(v);
}

export function SrlPmPanel() {
  const [activeTab, setActiveTab] = useState<SrlTab>("overview");
  const snapshot = useMemo(() => getSrlPmSnapshot(), []);
  const registryModels = useMemo(() => srlPmModelsAsRegistry(), []);
  const variables = useMemo(() => buildSrlVariables(), []);
  const [selectedModelId, setSelectedModelId] = useState(srlPmModels[0]?.id ?? "");

  const selected = srlPmModels.find((m) => m.id === selectedModelId);
  const pmRows = selected
    ? (snapshot.byModel[selected.id as keyof typeof snapshot.byModel] ?? [])
    : [];

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
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            Atlas 196 · SRL pre-match
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">PM model capture</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            {srlPmModels.length} pre-match models mapped from{" "}
            <span className="font-mono text-violet-200">PM Publication</span> on the Atlas
            template workbook. Published outcomes are column{" "}
            <span className="font-mono">G</span> (and lines in{" "}
            <span className="font-mono">F</span> where applicable). SRL PM models are{" "}
            <strong className="font-medium text-white">not trader-adjusted</strong> — column
            I is unused.
          </p>
          <p className="mt-3 text-sm text-slate-400">{snapshot.adjustNote}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="PM models mapped" value={String(srlPmModels.length)} />
            <Stat
              label="PM Publication rows"
              value={String(Object.keys(snapshot.byRow).length)}
            />
            <Stat
              label="Unique markets"
              value={String(snapshot.marketCatalog.length)}
            />
            <Stat label="Trader adjusts" value="0" />
          </div>
          <div className="mt-6 rounded-xl border border-surface-border bg-surface/40 p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-300">Re-extract from workbook</p>
            <p className="mt-2 font-mono text-xs text-slate-500">
              python scripts/extract-srl-atlas.py [&quot;path/to/Atlas 196 (3).xlsm&quot;]
            </p>
          </div>
        </section>
      )}

      {activeTab === "models" && <ModelRegistry models={registryModels} />}

      {activeTab === "pm-qa" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h3 className="text-sm font-semibold text-white">PM Publication baseline</h3>
            <p className="mt-2 text-sm text-slate-400">
              Fixture: {snapshot.label} · Compare Lambda output to column G (and F for
              lines). {snapshot.adjustNote}
            </p>
            <label className="mt-4 block text-xs font-medium uppercase text-slate-500">
              Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="mt-1 block w-full max-w-xl rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              {srlPmModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (rows {m.pmRows.join(", ")})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="overflow-x-auto rounded-2xl border border-surface-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-raised text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Selection</th>
                    <th className="px-3 py-2">F line</th>
                    <th className="px-3 py-2">G prob</th>
                    <th className="px-3 py-2">H</th>
                    <th className="px-3 py-2">I adjust</th>
                    <th className="px-3 py-2">Lambda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pmRows.map((row) => (
                    <tr key={row.row} className="text-slate-300">
                      <td className="px-3 py-2 font-mono text-xs">{row.row}</td>
                      <td className="px-3 py-2">{formatPmValue(row.selection)}</td>
                      <td className="px-3 py-2 font-mono">{formatPmValue(row.line)}</td>
                      <td className="px-3 py-2 font-mono text-violet-300">
                        {formatPmValue(row.probability)}
                      </td>
                      <td className="px-3 py-2 font-mono">{formatPmValue(row.complementProbability)}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {formatPmValue(row.adjust)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {selected.lambdaClass ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h3 className="text-sm font-semibold text-white">Prep Work inputs (shared)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Snapshot values from Atlas template — feed multiple PM models.
            </p>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(snapshot.prepWorkInputs).map(([key, inp]) => (
                <div
                  key={key}
                  className="rounded-lg border border-surface-border bg-surface px-3 py-2"
                >
                  <dt className="text-xs text-slate-500">{inp.label}</dt>
                  <dd className="font-mono text-sm text-white">
                    {formatPmValue(inp.value)}
                  </dd>
                  <dd className="font-mono text-[10px] text-slate-600">{inp.cell}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {activeTab === "variables" && (
        <VariableMatrix variables={variables} models={registryModels} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-white">{value}</p>
    </div>
  );
}
