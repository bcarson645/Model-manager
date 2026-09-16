"use client";

import type { ModStakeProfileRow } from "@/lib/data-analysis/player-mod-types";

const W = 760;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 52 };

type StakeByOverChartProps = {
  points: ModStakeProfileRow[];
  overallAvgStake: number;
};

function scaleX(over: number, min: number, max: number): number {
  if (max <= min) return PAD.left;
  return PAD.left + ((over - min) / (max - min)) * (W - PAD.left - PAD.right);
}

function scaleY(value: number, yMax: number): number {
  if (yMax <= 0) return H / 2;
  return PAD.top + (1 - value / yMax) * (H - PAD.top - PAD.bottom);
}

export function StakeByOverChart({ points, overallAvgStake }: StakeByOverChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">No stake profile data.</p>;
  }

  const minX = points[0]!.over;
  const maxX = points[points.length - 1]!.over;
  const yMax = Math.max(...points.map((p) => p.avgStake), overallAvgStake) * 1.15;
  const refY = scaleY(overallAvgStake, yMax);
  const path = points
    .map((p, i) => {
      const x = scaleX(p.over, minX, maxX);
      const y = scaleY(p.avgStake, yMax);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">Average stake by over</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-500" role="img">
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={refY}
          y2={refY}
          stroke="#a78bfa"
          strokeDasharray="5 4"
          strokeWidth={1}
        />
        <text x={W - PAD.right} y={refY - 5} textAnchor="end" fontSize={9} fill="#a78bfa">
          Format avg £{overallAvgStake.toFixed(0)}
        </text>
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth={2} />
        {points.map((p) => (
          <circle
            key={p.over}
            cx={scaleX(p.over, minX, maxX)}
            cy={scaleY(p.avgStake, yMax)}
            r={3}
            fill="#38bdf8"
          >
            <title>Over {p.over}: avg stake £{p.avgStake.toFixed(2)}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
