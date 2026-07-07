"use client";

import type { TargetWinPoint } from "@/lib/scorecards/win-probability-curves";

const W = 720;
const H = 280;
const PAD = { top: 16, right: 20, bottom: 44, left: 48 };

type WinProbabilityChartProps = {
  points: TargetWinPoint[];
  xLabel: string;
  binWidth: number;
};

function scaleX(value: number, min: number, max: number): number {
  if (max <= min) return PAD.left;
  return PAD.left + ((value - min) / (max - min)) * (W - PAD.left - PAD.right);
}

function scaleY(pct: number): number {
  return PAD.top + (1 - pct / 100) * (H - PAD.top - PAD.bottom);
}

function pathFor(
  points: TargetWinPoint[],
  minX: number,
  maxX: number,
  accessor: (p: TargetWinPoint) => number
): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => {
      const x = scaleX(p.target, minX, maxX);
      const y = scaleY(accessor(p));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function WinProbabilityChart({ points, xLabel, binWidth }: WinProbabilityChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-slate-500">Not enough decided matches with both innings scores.</p>
    );
  }

  const minX = points[0]!.target - binWidth;
  const maxX = points[points.length - 1]!.target + binWidth;
  const yTicks = [0, 25, 50, 75, 100];

  const batPath = pathFor(points, minX, maxX, (p) => p.batFirstWinPct);
  const chasePath = pathFor(points, minX, maxX, (p) => p.chaseWinPct);

  const xTickStep = maxX - minX > 200 ? 50 : maxX - minX > 100 ? 25 : 10;
  const xTicks: number[] = [];
  const start = Math.ceil(minX / xTickStep) * xTickStep;
  for (let v = start; v <= maxX; v += xTickStep) xTicks.push(v);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-3xl text-slate-500"
        role="img"
        aria-label="Win probability by first innings score"
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={scaleY(t)}
              y2={scaleY(t)}
              stroke="currentColor"
              strokeOpacity={0.12}
            />
            <text x={PAD.left - 8} y={scaleY(t) + 4} textAnchor="end" fontSize={10} fill="currentColor">
              {t}%
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={scaleY(50)}
          y2={scaleY(50)}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeDasharray="4 4"
        />

        <path d={batPath} fill="none" stroke="#10b981" strokeWidth={2.5} />
        <path d={chasePath} fill="none" stroke="#f59e0b" strokeWidth={2.5} />

        {points.map((p) => (
          <g key={p.target}>
            <circle
              cx={scaleX(p.target, minX, maxX)}
              cy={scaleY(p.batFirstWinPct)}
              r={Math.min(4, 2 + p.total / 40)}
              fill="#10b981"
              opacity={0.85}
            >
              <title>
                Target ~{Math.round(p.target)}: defend {p.batFirstWinPct.toFixed(1)}% (n={p.total})
              </title>
            </circle>
            <circle
              cx={scaleX(p.target, minX, maxX)}
              cy={scaleY(p.chaseWinPct)}
              r={Math.min(4, 2 + p.total / 40)}
              fill="#f59e0b"
              opacity={0.85}
            >
              <title>
                Target ~{Math.round(p.target)}: chase {p.chaseWinPct.toFixed(1)}% (n={p.total})
              </title>
            </circle>
          </g>
        ))}

        {xTicks.map((t) => (
          <text
            key={t}
            x={scaleX(t, minX, maxX)}
            y={H - 12}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
          >
            {t}
          </text>
        ))}

        <text
          x={(PAD.left + W - PAD.right) / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
        >
          {xLabel}
        </text>
        <text
          x={14}
          y={(PAD.top + H - PAD.bottom) / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
          transform={`rotate(-90 14 ${(PAD.top + H - PAD.bottom) / 2})`}
        >
          Win %
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-emerald-500" />
          Bat first wins (defend target)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-amber-500" />
          Chase wins (2nd innings)
        </span>
        <span className="text-slate-600">Bins ±{binWidth / 2} runs · min 3 matches per point · smoothed</span>
      </div>
    </div>
  );
}
