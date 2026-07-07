"use client";

import { useState } from "react";
import { modelUpdates } from "@/lib/model-updates/registry";
import type { ModelUpdate, ModelUpdateCategory, ModelUpdateStatus } from "@/lib/model-updates/types";

const categoryLabels: Record<ModelUpdateCategory, string> = {
  pricing_skew: "Pricing skew",
  market_suspend: "Suspend rule",
  market_visibility: "Offer / visibility",
  lookup_data: "Lookup table",
};

const statusStyles: Record<ModelUpdateStatus, string> = {
  documented: "bg-slate-700 text-slate-200",
  lambda_mapped: "bg-blue-900/50 text-blue-200",
  implemented: "bg-amber-900/50 text-amber-200",
  verified: "bg-emerald-900/50 text-emerald-200",
};

function UpdateDetail({ update }: { update: ModelUpdate }) {
  return (
    <div className="space-y-5 text-sm">
      <p className="text-slate-300">{update.summary}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-border bg-surface p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Atlas change
          </h4>
          <dl className="mt-3 space-y-2 text-slate-300">
            <div>
              <dt className="text-slate-500">Workbook / sheet</dt>
              <dd className="font-mono text-xs">
                {update.atlas.workbook} → {update.atlas.sheet}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Cells</dt>
              <dd className="font-mono text-emerald-400">{update.atlas.cells.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Change</dt>
              <dd>{update.atlas.changeSummary}</dd>
            </div>
            {update.atlas.before && (
              <div>
                <dt className="text-slate-500">Before</dt>
                <dd className="font-mono text-xs text-red-300/90">{update.atlas.before}</dd>
              </div>
            )}
            {update.atlas.after && (
              <div>
                <dt className="text-slate-500">After</dt>
                <dd className="font-mono text-xs text-emerald-300">{update.atlas.after}</dd>
              </div>
            )}
            {update.atlas.formulaNote && (
              <div>
                <dt className="text-slate-500">Context</dt>
                <dd className="text-xs text-slate-400">{update.atlas.formulaNote}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lambda implementation
          </h4>
          <dl className="mt-3 space-y-2 text-slate-300">
            <div>
              <dt className="text-slate-500">Layer</dt>
              <dd>{update.lambda.layer.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Target (search in pcs.lib.pricing)</dt>
              <dd className="text-xs">{update.lambda.targetHint}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Steps</dt>
              <dd>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-slate-400">
                  {update.lambda.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-surface-border p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Verification checklist
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
          {update.verification.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ModelUpdatesPanel() {
  const [selectedId, setSelectedId] = useState(modelUpdates[0]?.id ?? "");

  const selected = modelUpdates.find((u) => u.id === selectedId);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Model updates</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Track Atlas template changes and map them to Lambda. Each item documents Excel cells,
          the intended behaviour change, and where to implement in{" "}
          <span className="font-mono text-slate-300">pcs.lib.pricing</span> (not yet mirrored in
          this repo&apos;s reference folder for live batter milestones).
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Workflow: document here → locate Lambda class / lookup → implement → paste reference
          `.cs` into <span className="font-mono">reference/pricing-models</span> → mark verified
          after Atlas parity on sample states.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {modelUpdates.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedId(u.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selectedId === u.id
                  ? "border-emerald-600/50 bg-emerald-950/30"
                  : "border-surface-border bg-surface-raised hover:border-slate-600"
              }`}
            >
              <p className="text-sm font-medium text-white">{u.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${statusStyles[u.status]}`}
                >
                  {u.status.replace("_", " ")}
                </span>
                <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-slate-500">
                  {categoryLabels[u.category]}
                </span>
              </div>
            </button>
          ))}
        </aside>

        {selected && (
          <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-white">{selected.title}</h3>
              <span className="text-xs text-slate-500">
                {selected.formats.join(" · ")} · {selected.phase}
              </span>
            </div>
            {selected.relatedMarkets && (
              <p className="mt-1 text-xs text-slate-500">
                Markets: {selected.relatedMarkets.join(", ")}
              </p>
            )}
            <div className="mt-5">
              <UpdateDetail update={selected} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
