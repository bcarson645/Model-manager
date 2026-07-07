"use client";

import type { ChaseScoreDensityPoint } from "@/lib/scorecards/win-probability-curves";

const W = 720;
const H = 240;
const PAD = { top: 12, right: 20, bottom: 44, left: 48 };

type ChaseScoreDensityChartProps = {
  points: ChaseScoreDensityPoint[];
  binWidth: number;
};

export function ChaseScoreDensityChart({ points, binWidth }: ChaseScoreDensityChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-slate-500">No second-innings scores in the selected matches.</p>
    );
  }

  const minX = points[0]!.score - binWidth;
  const maxX = points[points.length - 1]!.score + binWidth;
  const maxDensity = Math.max(...points.map((p) => p.density), 0.001);

  const scaleX = (v: number) =>
    PAD.left + ((v - minX) / (maxX - minX)) * (W - PAD.left - PAD.right);
  const scaleY = (d: number) =>
    PAD.top + (1 - d / maxDensity) * (H - PAD.top - PAD.bottom);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.score).toFixed(1)} ${scaleY(p.density).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${scaleX(points[points.length - 1]!.score).toFixed(1)} ${scaleY(0).toFixed(1)} L ${scaleX(points[0]!.score).toFixed(1)} ${scaleY(0).toFixed(1)} Z`;

  const xTickStep = maxX - minX > 200 ? 50 : maxX - minX > 100 ? 25 : 10;
  const xTicks: number[] = [];
  const start = Math.ceil(minX / xTickStep) * xTickStep;
  for (let v = start; v <= maxX; v += xTickStep) xTicks.push(v);

  const peak = points.reduce((a, b) => (b.density > a.density ? b : a), points[0]!);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-3xl text-slate-500"
        role="img"
        aria-label="Distribution of second innings chase scores"
      >
        <path d={areaPath} fill="#f59e0b" fillOpacity={0.15} />
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth={2} />

        {points.map((p) => (
          <circle
            key={p.score}
            cx={scaleX(p.score)}
            cy={scaleY(p.density)}
            r={3}
            fill="#f59e0b"
            opacity={0.7}
          >
            <title>
              ~{Math.round(p.score)} runs: {(p.density * 100).toFixed(1)}% of chases (n={p.count})
            </title>
          </circle>
        ))}

        {xTicks.map((t) => (
          <text
            key={t}
            x={scaleX(t)}
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
          Chase innings total (runs)
        </text>
        <text
          x={14}
          y={(PAD.top + H - PAD.bottom) / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
          transform={`rotate(-90 14 ${(PAD.top + H - PAD.bottom) / 2})`}
        >
          Share of chases
        </text>
      </svg>

      <p className="mt-2 text-xs text-slate-500">
        Peak chase score ~{Math.round(peak.score)} ({(peak.density * 100).toFixed(1)}% of matches).{" "}
        {points.reduce((s, p) => s + p.count, 0).toLocaleString()} chase innings in range.
      </p>
    </div>
  );
}
