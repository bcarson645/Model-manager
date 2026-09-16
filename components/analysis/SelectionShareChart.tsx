"use client";

import type { SelectionShareRow } from "@/lib/data-analysis/player-mod-task2-types";

type SelectionShareChartProps = {
  sharp: SelectionShareRow[];
  others: SelectionShareRow[];
};

const COLORS = ["#34d399", "#64748b"];

export function SelectionShareChart({ sharp, others }: SelectionShareChartProps) {
  const selections = Array.from(
    new Set([...sharp.map((s) => s.selection), ...others.map((s) => s.selection)])
  );
  const sharpMap = new Map(sharp.map((s) => [s.selection, s.sharePct]));
  const otherMap = new Map(others.map((s) => [s.selection, s.sharePct]));
  const max = Math.max(
    ...selections.map((sel) => Math.max(sharpMap.get(sel) ?? 0, otherMap.get(sel) ?? 0)),
    1
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-[10px] uppercase tracking-wide text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Sharp bettors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-500" /> Everyone else
        </span>
      </div>
      <div className="space-y-2">
        {selections.map((sel) => (
          <div key={sel}>
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>{sel}</span>
              <span>
                {(sharpMap.get(sel) ?? 0).toFixed(1)}% / {(otherMap.get(sel) ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1">
              {[sharpMap, otherMap].map((map, i) => {
                const pct = map.get(sel) ?? 0;
                return (
                  <div key={i} className="h-2 rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(pct / max) * 100}%`,
                        backgroundColor: COLORS[i],
                        opacity: i === 0 ? 0.9 : 0.55,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
