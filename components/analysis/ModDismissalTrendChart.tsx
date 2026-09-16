"use client";

import type { ModTrendPoint } from "@/lib/data-analysis/mod-frequency-pricing-types";

const COLORS: Record<string, string> = {
  "Fielder Catch": "#2563eb",
  "Keeper Catch": "#7c3aed",
  Bowled: "#ea580c",
  LBW: "#db2777",
  "Run Out": "#059669",
  Stumped: "#0891b2",
  Other: "#64748b",
};

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 36, left: 44 };

type ModDismissalTrendChartProps = {
  title: string;
  points: ModTrendPoint[];
  selections: string[];
};

export function ModDismissalTrendChart({ title, points, selections }: ModDismissalTrendChartProps) {
  if (points.length === 0) return <p className="text-sm text-slate-500">No trend data.</p>;

  const maxY = Math.max(
    ...points.flatMap((p) => selections.map((s) => (typeof p[s] === "number" ? (p[s] as number) : 0))),
    5
  );
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const sx = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * chartW;
  const sy = (v: number) => PAD.top + (1 - v / (maxY * 1.1)) * chartH;

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
        {selections.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: COLORS[s] ?? "#94a3b8" }} />
            {s}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl" role="img" aria-label={title}>
        {selections.map((sel) => {
          const path = points
            .map((p, i) => {
              const v = typeof p[sel] === "number" ? (p[sel] as number) : 0;
              return `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`;
            })
            .join(" ");
          return (
            <path
              key={sel}
              d={path}
              fill="none"
              stroke={COLORS[sel] ?? "#94a3b8"}
              strokeWidth={2}
              opacity={0.9}
            />
          );
        })}
        {points.map((p, i) => (
          <text
            key={p.month}
            x={sx(i)}
            y={H - 10}
            textAnchor="middle"
            fontSize={8}
            fill="#94a3b8"
            transform={points.length > 4 ? `rotate(-20 ${sx(i)} ${H - 10})` : undefined}
          >
            {p.month.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
