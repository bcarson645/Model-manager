"use client";

import type { ModOverRow } from "@/lib/data-analysis/player-mod-types";

const W = 760;
const H = 260;
const PAD = { top: 18, right: 16, bottom: 40, left: 52 };

type MarginByOverChartProps = {
  points: ModOverRow[];
  targetMargin: number;
  maxOver?: number;
  title?: string;
};

function scaleX(over: number, min: number, max: number): number {
  if (max <= min) return PAD.left;
  return PAD.left + ((over - min) / (max - min)) * (W - PAD.left - PAD.right);
}

function scaleY(margin: number, yMin: number, yMax: number): number {
  if (yMax <= yMin) return H / 2;
  return PAD.top + (1 - (margin - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
}

export function MarginByOverChart({
  points,
  targetMargin,
  maxOver,
  title = "Margin % by over (all selections)",
}: MarginByOverChartProps) {
  const filtered = points
    .filter((p) => p.marginPct != null && (maxOver == null || p.over <= maxOver))
    .sort((a, b) => a.over - b.over);

  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500">No over-level data for this format.</p>;
  }

  const minX = filtered[0]!.over;
  const maxX = filtered[filtered.length - 1]!.over;
  const margins = filtered.map((p) => p.marginPct!);
  const yMin = Math.min(-10, ...margins, targetMargin) - 5;
  const yMax = Math.max(40, ...margins, targetMargin) + 5;
  const targetY = scaleY(targetMargin, yMin, yMax);

  const barWidth = Math.max(
    4,
    Math.min(18, (W - PAD.left - PAD.right) / filtered.length - 2)
  );

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{title}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full text-slate-500"
        role="img"
        aria-label={title}
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={targetY}
          y2={targetY}
          stroke="#34d399"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text x={W - PAD.right} y={targetY - 6} textAnchor="end" fontSize={10} fill="#34d399">
          Target {targetMargin}%
        </text>
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="currentColor" strokeOpacity={0.2} />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        {filtered.map((p) => {
          const x = scaleX(p.over, minX, maxX) - barWidth / 2;
          const y0 = scaleY(0, yMin, yMax);
          const y1 = scaleY(p.marginPct!, yMin, yMax);
          const h = Math.abs(y1 - y0);
          const y = p.marginPct! >= 0 ? y1 : y0;
          const color =
            p.flag === "under"
              ? "#f87171"
              : p.flag === "over"
                ? "#4ade80"
                : p.marginPct! >= targetMargin
                  ? "#60a5fa"
                  : "#fbbf24";
          return (
            <g key={p.over}>
              <rect x={x} y={y} width={barWidth} height={Math.max(1, h)} fill={color} rx={1} opacity={0.85} />
              <title>
                Over {p.over}: {p.marginPct!.toFixed(1)}% margin · {p.bets} bets · £
                {p.stake.toLocaleString()}
              </title>
            </g>
          );
        })}
        {[yMin, 0, targetMargin, yMax].filter((v, i, a) => a.indexOf(v) === i).map((t) => (
          <text key={t} x={PAD.left - 6} y={scaleY(t, yMin, yMax) + 4} textAnchor="end" fontSize={9} fill="currentColor">
            {Math.round(t)}%
          </text>
        ))}
        {filtered
          .filter((_, i) => i % Math.ceil(filtered.length / 12) === 0 || i === filtered.length - 1)
          .map((p) => (
            <text
              key={`x-${p.over}`}
              x={scaleX(p.over, minX, maxX)}
              y={H - 12}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
            >
              {p.over}
            </text>
          ))}
      </svg>
    </div>
  );
}
