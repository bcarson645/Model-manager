"use client";

import type { StakePhaseRow } from "@/lib/data-analysis/player-mod-part2-types";

const W = 520;
const H = 170;
const PAD = { top: 14, right: 12, bottom: 36, left: 48 };

type AvgStakeByPhaseChartProps = {
  title: string;
  points: StakePhaseRow[];
};

export function AvgStakeByPhaseChart({ title, points }: AvgStakeByPhaseChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">No stake-by-phase data.</p>;
  }

  const maxStake = Math.max(...points.map((p) => p.avgStake), 1);
  const chartW = W - PAD.left - PAD.right;
  const barW = Math.max(20, Math.min(48, chartW / points.length - 8));

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img" aria-label={title}>
        {points.map((p, i) => {
          const barH = (p.avgStake / maxStake) * (H - PAD.top - PAD.bottom);
          const x = PAD.left + i * (chartW / points.length) + (chartW / points.length - barW) / 2;
          const y = H - PAD.bottom - barH;
          const color = p.spike ? "#ea580c" : "#475569";
          return (
            <g key={p.phaseId}>
              <rect x={x} y={y} width={barW} height={Math.max(2, barH)} fill={color} opacity={0.9} rx={2}>
                <title>
                  {p.label}: £{p.avgStake.toFixed(0)} avg
                  {p.ratioVsFormat != null ? ` (${p.ratioVsFormat.toFixed(2)}× format avg)` : ""}
                </title>
              </rect>
              <text x={x + barW / 2} y={H - 18} textAnchor="middle" fontSize={7} fill="#94a3b8">
                P{p.phaseId}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={7} fill="#cbd5e1">
                £{p.avgStake.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
