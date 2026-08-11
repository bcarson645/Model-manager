"use client";

const W = 720;
const H = 280;
const PAD = { top: 16, right: 48, bottom: 44, left: 48 };

export type ChartPoint = {
  inningsIndex: number;
  date?: string | null;
  opponent?: string | null;
  tooltip?: string;
  [key: string]: string | number | null | undefined | boolean;
};

type PlayerCareerFormChartProps = {
  points: ChartPoint[];
  cumulativeKey: string;
  rollingKey: string;
  title: string;
  unitLabel: string;
  /** Allow y-axis below 0 (e.g. relative indexes around 1.0 still stay positive) */
  allowNegative?: boolean;
  /** Draw a horizontal reference line (e.g. 1.0 = match par) */
  referenceLine?: number;
  yDigits?: number;
};

function scaleX(index: number, maxIndex: number): number {
  if (maxIndex <= 1) return PAD.left;
  return PAD.left + ((index - 1) / (maxIndex - 1)) * (W - PAD.left - PAD.right);
}

function scaleY(value: number, min: number, max: number): number {
  if (max <= min) return PAD.top + (H - PAD.top - PAD.bottom) / 2;
  return PAD.top + (1 - (value - min) / (max - min)) * (H - PAD.top - PAD.bottom);
}

function pathFor(
  points: ChartPoint[],
  key: string,
  yMin: number,
  yMax: number
): string {
  const parts: string[] = [];
  points.forEach((p) => {
    const raw = p[key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) return;
    const x = scaleX(p.inningsIndex, points.length);
    const y = scaleY(raw, yMin, yMax);
    parts.push(`${parts.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  return parts.join(" ");
}

export function PlayerCareerFormChart({
  points,
  cumulativeKey,
  rollingKey,
  title,
  unitLabel,
  allowNegative = false,
  referenceLine,
  yDigits = 1,
}: PlayerCareerFormChartProps) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-slate-500">
        Need at least 2 innings to plot career progression.
      </p>
    );
  }

  const values = points
    .flatMap((p) => [p[cumulativeKey], p[rollingKey], referenceLine])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  if (values.length === 0) {
    return <p className="text-sm text-slate-500">No data to plot for {title}.</p>;
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.08, 0.05);
  const yMin = allowNegative
    ? Math.floor((rawMin - pad) * 100) / 100
    : Math.max(0, Math.floor((rawMin - pad) * 100) / 100);
  const yMax = Math.ceil((rawMax + pad) * 100) / 100;
  const yTicks = 5;
  const yStep = (yMax - yMin) / (yTicks - 1);
  const ticks = Array.from({ length: yTicks }, (_, i) => yMin + i * yStep);

  const cumPath = pathFor(points, cumulativeKey, yMin, yMax);
  const rollPath = pathFor(points, rollingKey, yMin, yMax);

  const xTickCount = Math.min(8, points.length);
  const xTicks: number[] = [];
  for (let i = 0; i < xTickCount; i++) {
    const idx =
      xTickCount === 1
        ? 1
        : 1 + Math.round((i * (points.length - 1)) / (xTickCount - 1));
    if (!xTicks.includes(idx)) xTicks.push(idx);
  }

  return (
    <div>
      {title ? (
        <p className="mb-2 text-sm font-medium text-white">{title}</p>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-3xl text-slate-500"
        role="img"
        aria-label={title}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={scaleY(t, yMin, yMax)}
              y2={scaleY(t, yMin, yMax)}
              stroke="currentColor"
              strokeOpacity={0.12}
            />
            <text
              x={PAD.left - 8}
              y={scaleY(t, yMin, yMax) + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
            >
              {t.toFixed(yDigits)}
            </text>
          </g>
        ))}

        {referenceLine != null && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={scaleY(referenceLine, yMin, yMax)}
            y2={scaleY(referenceLine, yMin, yMax)}
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}

        {xTicks.map((idx) => (
          <text
            key={idx}
            x={scaleX(idx, points.length)}
            y={H - 14}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
          >
            {idx}
          </text>
        ))}
        <text
          x={(PAD.left + W - PAD.right) / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
        >
          Innings
        </text>

        <path d={cumPath} fill="none" stroke="#10b981" strokeWidth={2.5} />
        <path
          d={rollPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="6 4"
        />

        {points.map((p) => {
          const v = p[cumulativeKey];
          if (typeof v !== "number" || !Number.isFinite(v)) return null;
          return (
            <circle
              key={p.inningsIndex}
              cx={scaleX(p.inningsIndex, points.length)}
              cy={scaleY(v, yMin, yMax)}
              r={2.5}
              fill="#10b981"
            >
              <title>
                {p.tooltip ??
                  `Inn ${p.inningsIndex}${p.date ? ` · ${p.date}` : ""}${
                    p.opponent ? ` vs ${p.opponent}` : ""
                  }: career ${unitLabel} ${v.toFixed(yDigits)}`}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-emerald-500" /> Career{" "}
          {unitLabel} (cumulative)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-amber-500" />{" "}
          Last 10 innings {unitLabel}
        </span>
        {referenceLine != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-slate-400" />{" "}
            Match par ({referenceLine.toFixed(1)})
          </span>
        )}
      </div>
    </div>
  );
}
