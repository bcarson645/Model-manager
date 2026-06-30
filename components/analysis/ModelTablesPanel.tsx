"use client";

import { useMemo, useState } from "react";
import { flattenScorecardData } from "@/lib/scorecards/flatten";
import {
  computeTable1,
  computeTable2,
  listFilterOptions,
  type ModelTable,
  type TableFilterContext,
} from "@/lib/scorecards/model-tables";
import type { DataFormat } from "@/lib/scorecards/types";
import { getMatchesForFormat } from "@/lib/scorecards/format-source";
import { SearchableSelect } from "./SearchableSelect";

function formatValue(table: ModelTable, value: number | null, rowIdx: number): string {
  if (value == null) return "—";
  const label = table.rowLabels[rowIdx] ?? "";
  if (
    label.includes("Fifty") ||
    label.includes("Hundred") ||
    label.includes("proportion") ||
    label.includes("Prop")
  ) {
    return value < 1 && value > 0 ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
  }
  if (label === "T5.SR") return value.toFixed(3);
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function ModelTableView({ table }: { table: ModelTable }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-surface text-slate-500">
          <tr>
            <th className="px-3 py-2">Metric</th>
            {table.weightLabels.map((label) => (
              <th key={label} className="px-3 py-2 text-right">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {table.rowLabels.map((rowLabel, ri) => (
            <tr key={rowLabel} className="text-slate-300">
              <td className="px-3 py-2 font-medium text-slate-200">{rowLabel}</td>
              {table.weightColumns.map((w) => {
                const cell = table.rows[ri][w];
                return (
                  <td
                    key={w}
                    className="px-3 py-2 text-right font-mono"
                    title={cell.note}
                  >
                    {formatValue(table, cell.value, ri)}
                    {cell.sampleSize != null &&
                      table.rowLabels[ri] === "Samples" &&
                      w !== "all" && (
                        <span className="ml-1 text-slate-600">n</span>
                      )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ModelTablesPanelProps = {
  format: DataFormat;
};

export function ModelTablesPanel({ format }: ModelTablesPanelProps) {
  const matches = useMemo(() => getMatchesForFormat(format), [format]);
  const flat = useMemo(() => flattenScorecardData(matches), [matches]);
  const options = useMemo(() => listFilterOptions(flat), [flat]);

  const [venue, setVenue] = useState("");
  const [host, setHost] = useState("");
  const [tournament, setTournament] = useState("");
  const [team, setTeam] = useState("");

  const ctx: TableFilterContext = useMemo(() => {
    const c: TableFilterContext = {};
    if (venue) c.venue = venue;
    if (host) c.host = host;
    if (tournament) c.tournament = tournament;
    if (team) c.team = team;
    return c;
  }, [venue, host, tournament, team]);

  const table1 = useMemo(() => computeTable1(flat, format, ctx), [flat, format, ctx]);
  const table2 = useMemo(() => computeTable2(flat, format, ctx), [flat, format, ctx]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">Fixture context (optional)</h3>
        <p className="mt-1 text-sm text-slate-400">
          Search and pick venue, host, competition, or team to populate the matching weight
          columns. The <span className="text-slate-300">All</span> column always uses the full
          format dataset for comparison.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchableSelect
            label="Venue"
            placeholder="Search venues…"
            options={options.venues}
            value={venue}
            onChange={setVenue}
          />
          <SearchableSelect
            label="Host"
            placeholder="Search hosts…"
            options={options.hosts}
            value={host}
            onChange={setHost}
          />
          <SearchableSelect
            label="Competition"
            placeholder="Search competitions…"
            options={options.tournaments}
            value={tournament}
            onChange={setTournament}
          />
          <SearchableSelect
            label="Team"
            placeholder="Search teams…"
            options={options.teams}
            value={team}
            onChange={setTeam}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">{table1.name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          Per-innings historical blends from scorecard Data (K2:P18 equivalent). Prog Data rows
          and Model column require fixture workbook inputs.
        </p>
        <div className="mt-4">
          <ModelTableView table={table1} />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">{table2.name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          Match-level historical rates (T2:Z10 equivalent). Model (Z) and Now (AB) columns need
          per-fixture Prep Work inputs — historical U–Y weights computed from scorecards.
        </p>
        <div className="mt-4">
          <ModelTableView table={table2} />
        </div>
      </section>
    </div>
  );
}
