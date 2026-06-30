"use client";

import {
  battingPositionRefs,
  compareUiBattingPositionRefs,
  type UiBattingPositionRef,
} from "@/lib/workbooks/batting-position-refs";
import { uiBattingFieldMapping } from "@/lib/workbooks/rating-formulas";

/** Example from Player Adjustment UI — illustrates common mapping errors. */
export const exampleUiBattingPositionRefs: UiBattingPositionRef[] = [
  { expectedRunsTotal: 28.1, expectedRunsPerBall: 1.3, globalExpectedRunsPerBall: 0.95, positionRating: 9.6995366 },
  { expectedRunsTotal: 28.1, expectedRunsPerBall: 1.3, globalExpectedRunsPerBall: 0.95, positionRating: 9.6995366 },
  { expectedRunsTotal: 27.1, expectedRunsPerBall: 1.25, globalExpectedRunsPerBall: 0.91, positionRating: 8.6646396 },
  { expectedRunsTotal: 26.1, expectedRunsPerBall: 1.25, globalExpectedRunsPerBall: 0.83, positionRating: 6.98499815 },
  { expectedRunsTotal: 25.1, expectedRunsPerBall: 1.25, globalExpectedRunsPerBall: 0.715, positionRating: 5.97292988 },
  { expectedRunsTotal: 23.1, expectedRunsPerBall: 1.3, globalExpectedRunsPerBall: 0.595, positionRating: 4.56046522 },
  { expectedRunsTotal: 19.1, expectedRunsPerBall: 1.3, globalExpectedRunsPerBall: 0.46, positionRating: 3.67093068 },
  { expectedRunsTotal: 16.1, expectedRunsPerBall: 1.2, globalExpectedRunsPerBall: 0.32, positionRating: 3.31467534 },
  { expectedRunsTotal: 14.1, expectedRunsPerBall: 1.1, globalExpectedRunsPerBall: 0.205, positionRating: 2.6298476 },
  { expectedRunsTotal: 11.1, expectedRunsPerBall: 0.95, globalExpectedRunsPerBall: 0.115, positionRating: 2.28517524 },
  { expectedRunsTotal: 10.1, expectedRunsPerBall: 0.8, globalExpectedRunsPerBall: 0.05, positionRating: 2.28517524 },
];

export function BattingPositionRefsPanel() {
  const mismatches = compareUiBattingPositionRefs(exampleUiBattingPositionRefs);
  const mismatchKeys = new Set(
    mismatches.map((m) => `${m.position}-${m.field}`)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">Batting position references</h3>
        <p className="mt-2 text-sm text-slate-400">
          Prep Work <span className="font-mono">Q</span> rating uses one row per batting slot.{" "}
          <span className="font-mono">positionRating</span> = AL coefficient and{" "}
          <span className="font-mono">globalExpectedRunsPerBall</span> = CD multiplier — names in
          your UI are misleading.
        </p>
        <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          {Object.entries(uiBattingFieldMapping).map(([uiField, map]) => (
            <div key={uiField} className="rounded-lg border border-surface-border bg-surface p-3">
              <dt className="font-mono text-amber-200">{uiField}</dt>
              <dd className="mt-1">
                Excel: <span className="font-mono text-slate-300">{map.excel}</span> — {map.source}
              </dd>
              <dd className="mt-1 text-slate-500">Not: {map.not}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-surface-border">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-surface-raised">
              <th className="border border-surface-border px-2 py-2 text-left text-xs text-slate-500">
                Pos
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                par avg (L)
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                par SR (N)
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                AL
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                CD
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                Your UI avg
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                Your UI SR
              </th>
              <th className="border border-surface-border px-2 py-2 text-xs text-slate-400">
                Excel cells
              </th>
            </tr>
          </thead>
          <tbody>
            {battingPositionRefs.map((ref, idx) => {
              const ui = exampleUiBattingPositionRefs[idx];
              const avgWrong = mismatchKeys.has(`${ref.position}-expectedRunsTotal`);
              const srWrong = mismatchKeys.has(`${ref.position}-expectedRunsPerBall`);
              return (
                <tr key={ref.position}>
                  <td className="border border-surface-border px-2 py-2 font-mono text-white">
                    {ref.position}
                  </td>
                  <td className="border border-surface-border px-2 py-2 font-mono text-emerald-300">
                    {ref.parAverage}
                  </td>
                  <td className="border border-surface-border px-2 py-2 font-mono text-emerald-300">
                    {ref.parStrikeRate}
                  </td>
                  <td className="border border-surface-border px-2 py-2 font-mono text-sky-300">
                    {ref.alCoefficient.toFixed(4)}
                  </td>
                  <td className="border border-surface-border px-2 py-2 font-mono text-sky-300">
                    {ref.cdMultiplier}
                  </td>
                  <td
                    className={`border border-surface-border px-2 py-2 font-mono ${
                      avgWrong ? "bg-red-950/40 text-red-300" : "text-slate-500"
                    }`}
                  >
                    {ui.expectedRunsTotal}
                  </td>
                  <td
                    className={`border border-surface-border px-2 py-2 font-mono ${
                      srWrong ? "bg-red-950/40 text-red-300" : "text-slate-500"
                    }`}
                  >
                    {ui.expectedRunsPerBall}
                  </td>
                  <td className="border border-surface-border px-2 py-1 font-mono text-[10px] text-slate-500">
                    {ref.excelCells.alCell} / {ref.excelCells.cdExampleCell}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mismatches.length > 0 && (
        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
          <h4 className="text-sm font-semibold text-red-200">
            Mismatches in your UI JSON ({mismatches.length})
          </h4>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs text-red-100/90">
            {mismatches.map((m) => (
              <li key={`${m.position}-${m.field}`}>
                <span className="font-mono">#{m.position}</span> {m.field}: UI {m.uiValue} → Excel{" "}
                {m.excelValue} ({m.excelField}). {m.issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
