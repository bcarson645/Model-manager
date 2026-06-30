"use client";

import { useMemo } from "react";
import { buildLoggedQueries } from "@/lib/scorecards/queries";
import { getMatchesForFormat, formatLabel } from "@/lib/scorecards/format-source";
import type { DataFormat } from "@/lib/scorecards/types";

type QueriesLogPanelProps = {
  format: DataFormat;
};

export function QueriesLogPanel({ format }: QueriesLogPanelProps) {
  const matches = useMemo(() => getMatchesForFormat(format), [format]);
  const queries = useMemo(() => buildLoggedQueries(format, matches), [format, matches]);

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
        No {formatLabel(format)} data — queries will appear here once data is loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Query log</h2>
        <p className="mt-1 text-sm text-slate-400">
          Results from analysis questions asked in chat. New queries will be added here as
          they are run across the {formatLabel(format)} dataset.
        </p>
      </section>

      {queries.map((q) => (
        <section
          key={q.id}
          className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{q.title}</h3>
            <span className="text-xs text-slate-500">{q.askedAt}</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">{q.description}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {q.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-surface-border bg-surface p-3"
              >
                <p className="text-xs uppercase text-slate-500">{m.label}</p>
                <p className="mt-1 font-mono text-lg text-emerald-300">{m.value}</p>
              </div>
            ))}
          </div>

          {q.notes && q.notes.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
              {q.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
