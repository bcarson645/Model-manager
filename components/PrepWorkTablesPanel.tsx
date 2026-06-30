"use client";

import { useMemo, useState } from "react";
import {
  buildBowlerRowGrid,
  buildPlayerRowGrid,
  explainBowlerRowCell,
  explainPlayerRowCell,
  formatCellValue,
  getPlayerRowSnapshot,
  getPlayerSquads,
  type PlayerCellExplanation,
} from "@/lib/workbooks/prep-player-rows";
import { BattingPositionRefsPanel } from "./BattingPositionRefsPanel";
import {
  buildTableGrid,
  explainPrepWorkCell,
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

function PlayerCellDetail({ detail }: { detail: PlayerCellExplanation }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-lg text-orange-300">{detail.address}</p>
        <p className="mt-1 text-white">{detail.rowLabel}</p>
        <p className="text-sm text-slate-400">{detail.colLabel}</p>
        {detail.playerName && (
          <p className="mt-1 text-xs text-slate-500">
            Batting #{detail.battingPosition} · example: {detail.playerName}
          </p>
        )}
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

      {detail.upstreamCells.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Upstream cells</p>
          <ul className="mt-2 space-y-3">
            {detail.upstreamCells.map((u) => (
              <li
                key={u.address}
                className="rounded-lg border border-surface-border bg-surface p-3"
              >
                <p className="font-mono text-sm text-orange-300">{u.address}</p>
                <p className="mt-1 text-xs text-slate-400">{u.role}</p>
                <p className="mt-1 font-mono text-sm text-white">{formatCellValue(u.value)}</p>
                {u.formula && (
                  <pre className="mt-2 overflow-x-auto font-mono text-[10px] text-slate-500">
                    {u.formula}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
  "player-bat": "Q24",
  "player-bowl": "Z24",
  "player-raw": "M24",
};

const BAT_HIGHLIGHT = new Set(["L", "N", "Q"]);
const RAW_HIGHLIGHT = new Set(["M", "O", "P"]);
const BOWL_HIGHLIGHT = new Set(["V", "W", "X", "Z"]);

type ViewId = "table-1" | "table-2" | "player-bat" | "player-bowl" | "player-raw" | "batting-refs";

export function PrepWorkTablesPanel() {
  const tables = getPrepWorkTables();
  const meta = getPrepWorkTableSnapshot();
  const playerMeta = getPlayerRowSnapshot();
  const squads = getPlayerSquads();

  const [viewId, setViewId] = useState<ViewId>("table-1");
  const [squadId, setSquadId] = useState(squads[0]?.id ?? "home");
  const [selectedAddress, setSelectedAddress] = useState<string | null>("O16");

  const isPlayerBat = viewId === "player-bat";
  const isPlayerBowl = viewId === "player-bowl";
  const isPlayerRaw = viewId === "player-raw";
  const isBattingRefs = viewId === "batting-refs";
  const isPlayerView = isPlayerBat || isPlayerBowl || isPlayerRaw;

  const table = tables.find((t) => t.id === viewId);
  const grid = useMemo(
    () => (table ? buildTableGrid(table) : null),
    [table]
  );
  const playerGrid = useMemo(
    () => (isPlayerBat || isPlayerRaw ? buildPlayerRowGrid(squadId) : null),
    [isPlayerBat, isPlayerRaw, squadId]
  );
  const bowlerGrid = useMemo(
    () => (isPlayerBowl ? buildBowlerRowGrid(squadId) : null),
    [isPlayerBowl, squadId]
  );

  const highlightCols = isPlayerBat
    ? BAT_HIGHLIGHT
    : isPlayerRaw
      ? RAW_HIGHLIGHT
      : isPlayerBowl
        ? BOWL_HIGHLIGHT
        : new Set<string>();

  const prepDetail = useMemo(
    () =>
      !isPlayerView && !isBattingRefs && selectedAddress && table
        ? explainPrepWorkCell(viewId, selectedAddress)
        : undefined,
    [isPlayerView, isBattingRefs, viewId, selectedAddress, table]
  );

  const playerDetail = useMemo(
    () =>
      (isPlayerBat || isPlayerRaw) && selectedAddress
        ? explainPlayerRowCell(squadId, selectedAddress)
        : undefined,
    [isPlayerBat, isPlayerRaw, squadId, selectedAddress]
  );

  const bowlerDetail = useMemo(
    () =>
      isPlayerBowl && selectedAddress
        ? explainBowlerRowCell(squadId, selectedAddress)
        : undefined,
    [isPlayerBowl, squadId, selectedAddress]
  );

  const squad = squads.find((s) => s.id === squadId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Tables</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Prep Work reference tables — click any cell to see the Excel formula, upstream inputs, and
          what it feeds into Lambda / PM Publication. Snapshot: {meta.label}.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Re-extract:{" "}
          <span className="font-mono text-slate-400">
            python scripts/extract-prep-work-table-formulas.py [xlsm]
          </span>
          {" · "}
          <span className="font-mono text-slate-400">
            python scripts/extract-prep-player-row.py [xlsm]
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
                  setViewId(t.id as ViewId);
                  setSelectedAddress(TABLE_DEFAULT_CELL[t.id] ?? null);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  viewId === t.id
                    ? "border-accent bg-accent/20 text-white"
                    : "border-surface-border text-slate-400 hover:text-white"
                }`}
              >
                {t.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setViewId("player-bat");
                setSquadId("home");
                setSelectedAddress("Q24");
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isPlayerBat
                  ? "border-accent bg-accent/20 text-white"
                  : "border-surface-border text-slate-400 hover:text-white"
              }`}
            >
              Batting ratings (Q)
            </button>
            <button
              type="button"
              onClick={() => {
                setViewId("player-bowl");
                setSquadId("home");
                setSelectedAddress("Z24");
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isPlayerBowl
                  ? "border-accent bg-accent/20 text-white"
                  : "border-surface-border text-slate-400 hover:text-white"
              }`}
            >
              Bowling ratings (Z)
            </button>
            <button
              type="button"
              onClick={() => {
                setViewId("player-raw");
                setSquadId("home");
                setSelectedAddress("M24");
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isPlayerRaw
                  ? "border-accent bg-accent/20 text-white"
                  : "border-surface-border text-slate-400 hover:text-white"
              }`}
            >
              Raw / Fours / Sixes
            </button>
            <button
              type="button"
              onClick={() => {
                setViewId("batting-refs");
                setSelectedAddress(null);
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isBattingRefs
                  ? "border-accent bg-accent/20 text-white"
                  : "border-surface-border text-slate-400 hover:text-white"
              }`}
            >
              Batting position refs
            </button>
          </div>

          {isPlayerView && (
            <div className="flex flex-wrap gap-2">
              {squads.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSquadId(s.id);
                    const defaultRow = s.playerRows[0] ?? 24;
                    setSelectedAddress(`M${defaultRow}`);
                  }}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    squadId === s.id
                      ? "border-sky-700 bg-sky-950/40 text-sky-200"
                      : "border-surface-border text-slate-500 hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <p className="font-mono text-xs text-slate-500">
            {isBattingRefs
              ? "Prep Work I64:N74 + AL66:AL76 + CD24:CD34 (T20 men template)"
              : isPlayerBowl
                ? `${playerMeta.sheet}!V23:Z${squad?.playerRows[squad.playerRows.length - 1] ?? 34} · ${squad?.name}`
                : isPlayerView
                  ? `${playerMeta.sheet}!H23:Q${squad?.playerRows[squad.playerRows.length - 1] ?? 34} · ${squad?.name}`
                  : `${meta.sheet}!${table?.range}`}
          </p>

          {isBattingRefs ? (
            <BattingPositionRefsPanel />
          ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-surface-raised">
                  <th className="border border-surface-border px-2 py-2 text-left text-xs text-slate-500">
                    Row
                  </th>
                  {(isPlayerBowl
                    ? bowlerGrid!.cols
                    : isPlayerView
                      ? playerGrid!.cols
                      : grid!.cols
                  ).map((col) => (
                    <th
                      key={col}
                      className={`border border-surface-border px-2 py-2 text-center text-xs font-medium ${
                        isPlayerView && highlightCols.has(col)
                          ? "bg-emerald-950/30 text-emerald-300"
                          : "text-slate-400"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(isPlayerBowl
                  ? bowlerGrid!.rows
                  : isPlayerView
                    ? playerGrid!.rows
                    : grid!.rows
                ).map((row) => (
                  <tr key={row}>
                    <td className="max-w-[10rem] border border-surface-border bg-surface-raised px-2 py-1 text-xs text-slate-500">
                      {isPlayerBowl ? (
                        <span className="block truncate" title={bowlerGrid!.rowLabels.get(row)}>
                          {bowlerGrid!.rowLabels.get(row) ?? row}
                        </span>
                      ) : isPlayerView ? (
                        <span className="block truncate" title={playerGrid!.rowLabels.get(row)}>
                          {playerGrid!.rowLabels.get(row) ?? row}
                        </span>
                      ) : (
                        row
                      )}
                    </td>
                    {(isPlayerBowl
                      ? bowlerGrid!.cols
                      : isPlayerView
                        ? playerGrid!.cols
                        : grid!.cols
                    ).map((col) => {
                      const addr = `${col}${row}`;
                      const cellMap = isPlayerBowl
                        ? bowlerGrid!.cellMap
                        : isPlayerView
                          ? playerGrid!.cellMap
                          : grid!.cellMap;
                      const cell = cellMap.get(addr);
                      const isSelected = selectedAddress === addr;
                      const hasFormula = cell?.formula?.startsWith("=");
                      const isHighlight = (isPlayerBat || isPlayerBowl || isPlayerRaw) && highlightCols.has(col);
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
                                    ? isHighlight
                                      ? "bg-emerald-950/20 hover:bg-emerald-950/35"
                                      : "bg-surface hover:bg-surface-raised"
                                    : isHighlight
                                      ? "bg-emerald-950/10 hover:bg-emerald-950/25"
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
                                    {String(cell.formula ?? "").replace(/^=/, "").slice(0, 24)}
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
          )}

          {!isBattingRefs && (
          <p className="text-xs text-slate-500">
            {isPlayerBowl ? (
              <>
                <span className="text-emerald-400">Z = overs × ((W63−econ) + Y63×(sr−X63))</span> ·
                No position coeffs · V=0 → Z=0
              </>
            ) : isPlayerBat ? (
              <>
                <span className="text-emerald-400">Q</span> = batting rating — uses per-position AL
                + CD · See Batting position refs tab
              </>
            ) : isPlayerRaw ? (
              <>
                <span className="text-emerald-400">M → O → P</span> Raw / Fours / Sixes chain
              </>
            ) : (
              <>
                <span className="text-sky-500">ƒx</span> = formula cell · Column O / Y / Z → Lambda ·
                AB = PM Publication Now
              </>
            )}
          </p>
          )}
        </div>

        {!isBattingRefs && (
        <div className="w-full shrink-0 rounded-2xl border border-surface-border bg-surface-raised p-6 lg:w-[28rem]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Cell detail
          </h3>
          {isPlayerBowl ? (
            bowlerDetail ? (
              <div className="mt-4">
                <PlayerCellDetail detail={bowlerDetail} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a cell in the bowler row.</p>
            )
          ) : isPlayerView ? (
            playerDetail ? (
              <div className="mt-4">
                <PlayerCellDetail detail={playerDetail} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a cell in the player row.</p>
            )
          ) : prepDetail ? (
            <div className="mt-4">
              <CellDetail detail={prepDetail} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a cell in the table.</p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
