"use client";

import type { PhaseMarginCompare } from "@/lib/data-analysis/player-mod-part2-types";

const W = 560;
const H = 200;
const PAD = { top: 20, right: 12, bottom: 44, left: 48 };

type PhaseCompareChartProps = {
  title: string;
  points: PhaseMarginCompare[];
  targetMargin?: number;
};

export function PhaseCompareChart({
  title,
  points,
  targetMargin = 7.5,
}: PhaseCompareChartProps) {
  const filtered = points.filter((p) => p.allMarginPct != null);
  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500">No phase comparison data.</p>;
  }

  const allVals = filtered.flatMap((p) =>
    [p.allMarginPct, p.sharpMarginPct, p.otherMarginPct].filter((v) => v != null) as number[]
  );
  const yMin = Math.min(-20, ...allVals, targetMargin) - 5;
  const yMax = Math.max(40, ...allVals, targetMargin) + 5;
  const chartW = W - PAD.left - PAD.right;
  const groupW = chartW / filtered.length;
  const barW = Math.min(10, groupW / 4);

  const sy = (m: number) =>
    PAD.top + (1 - (m - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const zeroY = sy(0);
  const targetY = sy(targetMargin);

  const series = [
    { key: "allMarginPct" as const, color: "#64748b", label: "All" },
    { key: "sharpMarginPct" as const, color: "#dc2626", label: "Sharps" },
    { key: "otherMarginPct" as const, color: "#2563eb", label: "Others" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl" role="img" aria-label={title}>
        <line x1={PAD.left} x2={W - PAD.right} y1={targetY} y2={targetY} stroke="#059669" strokeDasharray="4 3" />
        <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="#334155" strokeWidth={0.5} />
        {filtered.map((p, i) => {
          const gx = PAD.left + i * groupW + groupW / 2;
          return (
            <g key={p.phaseId}>
              {series.map((s, j) => {
                const val = p[s.key];
                if (val == null) return null;
                const x = gx - barW * 1.5 + j * (barW + 2);
                const y1 = sy(val);
                const h = Math.abs(y1 - zeroY);
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={val >= 0 ? y1 : zeroY}
                    width={barW}
                    height={Math.max(1, h)}
                    fill={s.color}
                    opacity={0.85}
                    rx={1}
                  >
                    <title>{s.label} {p.label}: {val.toFixed(1)}%</title>
                  </rect>
                );
              })}
              <text x={gx} y={H - 22} textAnchor="middle" fontSize={7} fill="#94a3b8">
                P{p.phaseId}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
