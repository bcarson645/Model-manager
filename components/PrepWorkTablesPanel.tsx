"use client";

import { useMemo, useState } from "react";
import {
  buildTableGrid,
  explainPrepWorkCell,
  formatCellValue,
  getPrepWorkTableSnapshot,
  getPrepWorkTables,
  type CellExplanation,
} from "@/lib/workbooks/prep-work-tables";

function CellDetail({ detail }: { detail: CellExplanation }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-lg text-orange-300">{detail.address}</p>
        <p className="mt-1 text-white">{detail.rowLabel}</p>
        <p className="text-sm text-slate-400">{detail.colLabel}</p>
        <p className="mt-3 text-sm text-slate-300">{detail.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Value (NZ v SA)</p>
          <p className="mt-2 font-mono text-xl text-white">{formatCellValue(detail.value)}</p>
        </div>
        {detail.lambdaPath && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Lambda</p>
            <p className="mt-2 font-mono text-sm text-accent">{detail.lambdaPath}</p>
          </div>
        )}
      </div>

      {detail.formula && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Excel formula</p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-surface-border bg-surface p-3 font-mono text-xs text-slate-300">
            {detail.formula}
          </pre>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">How it is calculated</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          {detail.calculation.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {detail.dataSources.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Sheets / cells used</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.dataSources.map((s) => (
              <li
                key={s}
                className="rounded-md border border-surface-border bg-surface px-2 py-1 font-mono text-xs text-slate-300"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.namedInputs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Named inputs</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.namedInputs.map((n) => (
              <li
                key={n}
                className="rounded-md border border-amber-900/40 bg-amber-950/20 px-2 py-1 font-mono text-xs text-amber-200"
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.pmPublication && (
        <div className="rounded-lg border border-violet-900/40 bg-violet-950/20 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">PM Publication</p>
          <p className="mt-2 text-sm text-violet-200">{detail.pmPublication}</p>
        </div>
      )}

      {detail.feedsTo.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Feeds into</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {detail.feedsTo.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TABLE_DEFAULT_CELL: Record<string, string> = {
  "table-1": "O16",
  "table-2": "Z5",
};

export function PrepWorkTablesPanel() {
  const tables = getPrepWorkTables();
  const meta = getPrepWorkTableSnapshot();
  const [tableId, setTableId] = useState(tables[0]?.id ?? "table-1");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    TABLE_DEFAULT_CELL[tables[0]?.id ?? "table-1"] ?? null
  );

  const table = tables.find((t) => t.id === tableId)!;
  const grid = useMemo(() => buildTableGrid(table), [table]);
  const detail = useMemo(
    () => (selectedAddress ? explainPrepWorkCell(tableId, selectedAddress) : undefined),
    [tableId, selectedAddress]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Tables</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Prep Work reference tables — click any cell to see the Excel formula, data sources, and
          what it feeds into Lambda / PM Publication. Snapshot: {meta.label}.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Re-extract from workbook:{" "}
          <span className="font-mono text-slate-400">
            python scripts/extract-prep-work-table-formulas.py [path-to-xlsm]
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTableId(t.id);
                  setSelectedAddress(TABLE_DEFAULT_CELL[t.id] ?? null);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  tableId === t.id
                    ? "border-accent bg-accent/20 text-white"
                    : "border-surface-border text-slate-400 hover:text-white"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <p className="font-mono text-xs text-slate-500">
            {meta.sheet}!{table.range}
          </p>

          <div className="overflow-x-auto rounded-2xl border border-surface-border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-surface-raised">
                  <th className="border border-surface-border px-2 py-2 text-left text-xs text-slate-500">
                    #
                  </th>
                  {grid.cols.map((col) => (
                    <th
                      key={col}
                      className="border border-surface-border px-2 py-2 text-center text-xs font-medium text-slate-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row}>
                    <td className="border border-surface-border bg-surface-raised px-2 py-1 text-xs text-slate-500">
                      {row}
                    </td>
                    {grid.cols.map((col) => {
                      const addr = `${col}${row}`;
                      const cell = grid.cellMap.get(addr);
                      const isSelected = selectedAddress === addr;
                      const hasFormula = cell?.formula?.startsWith("=");
                      return (
                        <td key={addr} className="border border-surface-border p-0">
                          <button
                            type="button"
                            onClick={() => setSelectedAddress(addr)}
                            className={`block min-w-[4.5rem] px-2 py-2 text-left transition ${
                              isSelected
                                ? "bg-accent/25 ring-1 ring-inset ring-accent"
                                : cell
                                  ? hasFormula
                                    ? "bg-surface hover:bg-surface-raised"
                                    : "bg-surface-raised/50 hover:bg-surface-raised"
                                  : "bg-surface/30"
                            }`}
                            title={cell?.formula ?? addr}
                          >
                            {cell ? (
                              <>
                                <span className="block truncate font-mono text-xs text-white">
                                  {formatCellValue(cell.value)}
                                </span>
                                {col === "K" || col === "T" ? (
                                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                                    {String(cell.formula ?? "").replace(/^=/, "").slice(0, 20)}
                                  </span>
                                ) : hasFormula ? (
                                  <span className="mt-0.5 block text-[10px] text-sky-500/80">ƒx</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-600">·</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            <span className="text-sky-500">ƒx</span> = formula cell · Click to inspect · Column O / Y
            / Z are the usual paths into Lambda · AB = published Now on PM Publication
          </p>
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-surface-border bg-surface-raised p-6 lg:w-[28rem]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Cell detail
          </h3>
          {detail ? (
            <div className="mt-4">
              <CellDetail detail={detail} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a cell in the table.</p>
          )}
        </div>
      </div>
    </div>
  );
}
