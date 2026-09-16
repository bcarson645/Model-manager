"use client";

import type { OverSegmentRow } from "@/lib/data-analysis/player-mod-task2-types";

const W = 760;
const H = 260;
const PAD = { top: 18, right: 16, bottom: 40, left: 52 };

type Series = {
  label: string;
  color: string;
  points: OverSegmentRow[];
};

type PunterRoiByOverChartProps = {
  series: Series[];
  title?: string;
};

function scaleX(over: number, min: number, max: number): number {
  if (max <= min) return PAD.left;
  return PAD.left + ((over - min) / (max - min)) * (W - PAD.left - PAD.right);
}

function scaleY(value: number, yMin: number, yMax: number): number {
  if (yMax <= yMin) return H / 2;
  return PAD.top + (1 - (value - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
}

export function PunterRoiByOverChart({
  series,
  title = "Punter ROI % by over",
}: PunterRoiByOverChartProps) {
  const allPoints = series.flatMap((s) => s.points).filter((p) => p.punterRoiPct != null);
  if (allPoints.length === 0) {
    return <p className="text-sm text-slate-500">No over-level bettor data.</p>;
  }

  const minX = Math.min(...allPoints.map((p) => p.over));
  const maxX = Math.max(...allPoints.map((p) => p.over));
  const values = allPoints.map((p) => p.punterRoiPct!);
  const yMin = Math.min(-30, ...values) - 5;
  const yMax = Math.max(40, ...values) + 5;
  const zeroY = scaleY(0, yMin, yMax);

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-500" role="img">
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity={0.25}
        />
        {series.map((s) => {
          const sorted = [...s.points].sort((a, b) => a.over - b.over);
          const path = sorted
            .filter((p) => p.punterRoiPct != null)
            .map((p, i) => {
              const x = scaleX(p.over, minX, maxX);
              const y = scaleY(p.punterRoiPct!, yMin, yMax);
              return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <g key={s.label}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
              {sorted.map((p) =>
                p.punterRoiPct != null ? (
                  <circle
                    key={`${s.label}-${p.over}`}
                    cx={scaleX(p.over, minX, maxX)}
                    cy={scaleY(p.punterRoiPct, yMin, yMax)}
                    r={3}
                    fill={s.color}
                  >
                    <title>
                      {s.label} · Over {p.over}: {p.punterRoiPct.toFixed(1)}% punter ROI
                    </title>
                  </circle>
                ) : null
              )}
            </g>
          );
        })}
        <text x={PAD.left + 4} y={PAD.top + 10} fontSize={10} fill="#94a3b8">
          {series.map((s) => s.label).join(" · ")}
        </text>
      </svg>
    </div>
  );
}
