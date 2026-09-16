"use client";

import type { PhaseRow } from "@/lib/data-analysis/player-mod-part2-types";

const W = 520;
const H = 180;
const PAD = { top: 16, right: 12, bottom: 44, left: 44 };

type PhaseMarginChartProps = {
  title: string;
  points: PhaseRow[];
  targetMargin?: number;
};

export function PhaseMarginChart({
  title,
  points,
  targetMargin = 7.5,
}: PhaseMarginChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">No phase data.</p>;
  }

  const margins = points.map((p) => p.marginPct ?? 0);
  const yMin = Math.min(-20, ...margins, targetMargin) - 5;
  const yMax = Math.max(40, ...margins, targetMargin) + 5;
  const chartW = W - PAD.left - PAD.right;
  const barW = Math.max(18, Math.min(48, chartW / points.length - 8));

  const sx = (i: number) => PAD.left + i * (chartW / points.length) + (chartW / points.length - barW) / 2;
  const sy = (m: number) =>
    PAD.top + (1 - (m - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const zeroY = sy(0);
  const targetY = sy(targetMargin);

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl text-slate-500" role="img" aria-label={title}>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={targetY}
          y2={targetY}
          stroke="#059669"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <text x={W - PAD.right} y={targetY - 4} textAnchor="end" fontSize={8} fill="#059669">
          Target {targetMargin}%
        </text>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#cbd5e1"
          strokeWidth={0.5}
        />
        {points.map((p, i) => {
          const m = p.marginPct ?? 0;
          const x = sx(i);
          const y1 = sy(m);
          const h = Math.abs(y1 - zeroY);
          const color = m < 0 ? "#dc2626" : m < 10 ? "#d97706" : "#2563eb";
          return (
            <g key={p.phaseId}>
              <rect
                x={x}
                y={m >= 0 ? y1 : zeroY}
                width={barW}
                height={Math.max(1, h)}
                fill={color}
                opacity={0.9}
                rx={2}
              >
                <title>{p.label}: {m.toFixed(1)}%</title>
              </rect>
              <text
                x={x + barW / 2}
                y={H - 22}
                textAnchor="middle"
                fontSize={7}
                fill="#64748b"
              >
                P{p.phaseId}
              </text>
              <text
                x={x + barW / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize={6}
                fill="#94a3b8"
              >
                {p.overRange}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
