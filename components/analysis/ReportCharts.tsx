"use client";

/** Print-friendly SVG charts for ModBettingReportsPanel */

type BarItem = {
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
};

const W = 520;
const H_BAR = 22;
const PAD = { left: 110, right: 52, top: 8, bottom: 24 };

function niceTicks(min: number, max: number, maxTicks = 6): number[] {
  const range = max - min;
  if (range <= 0) return [min];
  const raw = range / (maxTicks - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v += step) {
    ticks.push(Math.round(v * 10) / 10);
  }
  if (!ticks.includes(0) && min < 0 && max > 0) ticks.push(0);
  return ticks.sort((a, b) => a - b);
}

function YAxisGrid({
  yMin,
  yMax,
  pad,
  chartW,
  chartH,
  fmt = (v) => `${v}%`,
}: {
  yMin: number;
  yMax: number;
  pad: { top: number; right: number; bottom: number; left: number };
  chartW: number;
  chartH: number;
  fmt?: (v: number) => string;
}) {
  const sy = (m: number) =>
    pad.top + (1 - (m - yMin) / (yMax - yMin)) * (chartH - pad.top - pad.bottom);
  const ticks = niceTicks(yMin, yMax);
  const zeroY = sy(0);

  return (
    <>
      {ticks.map((tick) => {
        const y = sy(tick);
        const isZero = Math.abs(tick) < 0.01;
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={chartW - pad.right}
              y1={y}
              y2={y}
              stroke={isZero ? "#94a3b8" : "#e2e8f0"}
              strokeWidth={isZero ? 1 : 0.5}
            />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize={9} fill="#64748b">
              {fmt(tick)}
            </text>
          </g>
        );
      })}
      <line
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={chartH - pad.bottom}
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      {yMin < 0 && yMax > 0 && (
        <line
          x1={pad.left}
          x2={chartW - pad.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#94a3b8"
          strokeWidth={1}
        />
      )}
    </>
  );
}

export function ReportHorizontalBars({
  title,
  items,
  valueFmt,
  targetLine,
  targetLabel,
}: {
  title: string;
  items: BarItem[];
  valueFmt: (v: number) => string;
  targetLine?: number;
  targetLabel?: string;
}) {
  if (items.length === 0) return null;
  const maxVal = Math.max(...items.map((i) => Math.abs(i.value)), targetLine ?? 0, 1);
  const height = PAD.top + PAD.bottom + items.length * (H_BAR + 6);
  const barArea = W - PAD.left - PAD.right;
  const zeroX = PAD.left + barArea / 2;
  const bidirectional = targetLine != null || items.some((i) => i.value < 0);

  const barX = (value: number) => {
    const barW = (Math.abs(value) / maxVal) * (barArea / 2);
    return value >= 0 ? zeroX : zeroX - barW;
  };
  const barW = (value: number) =>
    Math.max(2, (Math.abs(value) / maxVal) * (barArea / 2));

  const valueLabelX = (value: number) => {
    const x = barX(value);
    const w = barW(value);
    return value >= 0 ? x + w + 4 : x - 4;
  };

  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full max-w-xl print:max-w-none text-slate-600">
        {bidirectional && (
          <line
            x1={zeroX}
            x2={zeroX}
            y1={PAD.top - 2}
            y2={height - PAD.bottom}
            stroke="#94a3b8"
            strokeWidth={1}
          />
        )}
        {items.map((item, i) => {
          const y = PAD.top + i * (H_BAR + 6);
          const isNeg = item.value < 0;
          const fill = item.color ?? (isNeg ? "#dc2626" : item.value >= 7.5 ? "#059669" : "#d97706");
          const bx = bidirectional ? barX(item.value) : PAD.left;
          const bw = bidirectional ? barW(item.value) : (Math.abs(item.value) / maxVal) * barArea;
          const labelX = bidirectional
            ? valueLabelX(item.value)
            : PAD.left + bw + 4;
          const anchor = bidirectional && item.value < 0 ? "end" : "start";
          return (
            <g key={item.label}>
              <text x={PAD.left - 6} y={y + H_BAR / 2 + 4} textAnchor="end" fontSize={10} fill="#334155">
                {item.label.length > 14 ? `${item.label.slice(0, 14)}…` : item.label}
              </text>
              <rect
                x={bx}
                y={y}
                width={Math.max(2, bw)}
                height={H_BAR}
                fill={fill}
                rx={2}
                opacity={0.9}
              />
              <text
                x={labelX}
                y={y + H_BAR / 2 + 4}
                textAnchor={anchor}
                fontSize={9}
                fill="#475569"
              >
                {valueFmt(item.value)}
              </text>
            </g>
          );
        })}
        {targetLine != null && bidirectional && (
          <>
            <line
              x1={zeroX + (targetLine / maxVal) * (barArea / 2)}
              x2={zeroX + (targetLine / maxVal) * (barArea / 2)}
              y1={PAD.top - 2}
              y2={height - PAD.bottom}
              stroke="#059669"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            {targetLabel && (
              <text
                x={zeroX + (targetLine / maxVal) * (barArea / 2) + 4}
                y={PAD.top + 8}
                fontSize={8}
                fill="#059669"
              >
                {targetLabel}
              </text>
            )}
          </>
        )}
        {targetLine != null && !bidirectional && (
          <line
            x1={PAD.left + (targetLine / maxVal) * barArea}
            x2={PAD.left + (targetLine / maxVal) * barArea}
            y1={PAD.top - 2}
            y2={height - PAD.bottom}
            stroke="#059669"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
      </svg>
    </div>
  );
}

export function ReportMarginByOverChart({
  title,
  points,
  targetMargin = 7.5,
}: {
  title: string;
  points: Array<{ over: number; marginPct: number | null }>;
  targetMargin?: number;
}) {
  const filtered = points.filter((p) => p.marginPct != null).sort((a, b) => a.over - b.over);
  if (filtered.length === 0) return null;

  const chartW = 520;
  const chartH = 160;
  const pad = { top: 14, right: 12, bottom: 28, left: 44 };
  const minX = filtered[0]!.over;
  const maxX = filtered[filtered.length - 1]!.over;
  const margins = filtered.map((p) => p.marginPct!);
  const yMin = Math.min(-15, ...margins, targetMargin) - 5;
  const yMax = Math.max(45, ...margins, targetMargin) + 5;

  const sx = (over: number) =>
    pad.left + ((over - minX) / Math.max(1, maxX - minX)) * (chartW - pad.left - pad.right);
  const sy = (m: number) =>
    pad.top + (1 - (m - yMin) / (yMax - yMin)) * (chartH - pad.top - pad.bottom);
  const barW = Math.max(4, Math.min(14, (chartW - pad.left - pad.right) / filtered.length - 2));
  const targetY = sy(targetMargin);

  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-xl print:max-w-none">
        <YAxisGrid yMin={yMin} yMax={yMax} pad={pad} chartW={chartW} chartH={chartH} />
        <line
          x1={pad.left}
          x2={chartW - pad.right}
          y1={targetY}
          y2={targetY}
          stroke="#059669"
          strokeDasharray="5 4"
          strokeWidth={1.2}
        />
        <text x={chartW - pad.right} y={targetY - 4} textAnchor="end" fontSize={8} fill="#059669">
          Target {targetMargin}%
        </text>
        {filtered.map((p) => {
          const m = p.marginPct!;
          const x = sx(p.over) - barW / 2;
          const y0 = sy(0);
          const y1 = sy(m);
          const h = Math.abs(y1 - y0);
          const color = m < 5 ? "#dc2626" : m > 25 ? "#059669" : "#2563eb";
          return (
            <rect
              key={p.over}
              x={x}
              y={m >= 0 ? y1 : y0}
              width={barW}
              height={Math.max(1, h)}
              fill={color}
              opacity={0.85}
              rx={1}
            >
              <title>Over {p.over}: {m.toFixed(1)}%</title>
            </rect>
          );
        })}
        {filtered
          .filter((_, i) => i % Math.ceil(filtered.length / 10) === 0 || i === filtered.length - 1)
          .map((p) => (
            <text
              key={`x-${p.over}`}
              x={sx(p.over)}
              y={chartH - 8}
              textAnchor="middle"
              fontSize={8}
              fill="#64748b"
            >
              {p.over}
            </text>
          ))}
      </svg>
    </div>
  );
}

export function ReportSharpRoiChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: number; roi: number; highlight?: boolean }>;
}) {
  return (
    <ReportHorizontalBars
      title={title}
      items={items.map((r) => ({
        label: `#${r.id}`,
        value: r.roi,
        color: r.highlight ? "#dc2626" : r.roi >= 12 ? "#ea580c" : "#94a3b8",
      }))}
      valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
      targetLine={12}
      targetLabel="Sharp 12%"
    />
  );
}

export function ReportSelectionShareChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ selection: string; sharePct: number; roi?: number | null }>;
}) {
  const colors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669", "#0891b2", "#64748b"];
  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.selection}>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>{item.selection}</span>
              <span>
                {item.sharePct.toFixed(1)}%
                {item.roi != null ? ` · ROI ${item.roi > 0 ? "+" : ""}${item.roi.toFixed(0)}%` : ""}
              </span>
            </div>
            <div className="mt-0.5 h-2.5 rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, item.sharePct)}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportMatchWinsChart({
  title,
  matches,
}: {
  title: string;
  matches: Array<{ eventName: string; punterPl: number; eventAt: string | null }>;
}) {
  const top = matches.slice(0, 5);
  if (top.length === 0) return null;
  const max = Math.max(...top.map((m) => m.punterPl), 1);

  return (
    <ReportHorizontalBars
      title={title}
      items={top.map((m) => ({
        label: m.eventName.split(" vs. ")[0] ?? m.eventName,
        value: m.punterPl,
        sublabel: m.eventName,
        color: "#dc2626",
      }))}
      valueFmt={(v) => `£${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
    />
  );
}

export type PhaseMarginPoint = {
  label: string;
  marginPct: number | null;
  bets?: number;
  stake?: number;
};

export function ReportPhaseMarginChart({
  title,
  points,
  targetMargin = 7.5,
  showTable = false,
}: {
  title: string;
  points: PhaseMarginPoint[];
  targetMargin?: number;
  showTable?: boolean;
}) {
  const filtered = points.filter((p) => p.marginPct != null);
  if (filtered.length === 0) return null;

  const chartW = 520;
  const chartH = 180;
  const pad = { top: 14, right: 12, bottom: 40, left: 44 };
  const margins = filtered.map((p) => p.marginPct!);
  const yMin = Math.min(-15, ...margins, targetMargin, 0) - 3;
  const yMax = Math.max(25, ...margins, targetMargin) + 3;
  const barW = Math.max(14, Math.min(36, (chartW - pad.left - pad.right) / filtered.length - 8));

  const sx = (i: number) =>
    pad.left + i * ((chartW - pad.left - pad.right) / filtered.length) + ((chartW - pad.left - pad.right) / filtered.length - barW) / 2;
  const sy = (m: number) =>
    pad.top + (1 - (m - yMin) / (yMax - yMin)) * (chartH - pad.top - pad.bottom);
  const targetY = sy(targetMargin);

  const fmtMoney = (n: number) =>
    `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <div className={showTable ? "space-y-3" : ""}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-xl print:max-w-none">
          <YAxisGrid yMin={yMin} yMax={yMax} pad={pad} chartW={chartW} chartH={chartH} />
          <line
            x1={pad.left}
            x2={chartW - pad.right}
            y1={targetY}
            y2={targetY}
            stroke="#059669"
            strokeDasharray="5 4"
            strokeWidth={1.2}
          />
          <text x={chartW - pad.right} y={targetY - 4} textAnchor="end" fontSize={8} fill="#059669">
            Target {targetMargin}%
          </text>
          {filtered.map((p, i) => {
            const m = p.marginPct!;
            const x = sx(i);
            const y0 = sy(0);
            const y1 = sy(m);
            const h = Math.abs(y1 - y0);
            const color = m < 0 ? "#dc2626" : m < targetMargin ? "#d97706" : "#059669";
            const labelY = m >= 0 ? y1 - 4 : y0 + 10;
            return (
              <g key={p.label}>
                <rect
                  x={x}
                  y={m >= 0 ? y1 : y0}
                  width={barW}
                  height={Math.max(1, h)}
                  fill={color}
                  opacity={0.85}
                  rx={1}
                />
                <text
                  x={x + barW / 2}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#334155"
                  fontWeight={600}
                >
                  {m > 0 ? "+" : ""}{m.toFixed(1)}%
                </text>
                <text
                  x={x + barW / 2}
                  y={chartH - 8}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#64748b"
                >
                  {p.label.length > 12 ? `${p.label.slice(0, 10)}…` : p.label}
                </text>
              </g>
            );
          })}
        </svg>
        {showTable && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Phase</th>
                <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Bets</th>
                <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Stake</th>
                <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.label} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 text-slate-800">{p.label}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700">
                    {p.bets != null ? p.bets.toLocaleString() : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-700">
                    {p.stake != null ? fmtMoney(p.stake) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium text-slate-800">
                    {p.marginPct! > 0 ? "+" : ""}{p.marginPct!.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function ReportPhaseCompareChart({
  title,
  points,
  targetMargin = 7.5,
}: {
  title: string;
  points: Array<{
    label: string;
    allMarginPct: number | null;
    sharpMarginPct: number | null;
    otherMarginPct: number | null;
  }>;
  targetMargin?: number;
}) {
  const filtered = points.filter((p) => p.allMarginPct != null);
  if (filtered.length === 0) return null;

  const chartW = 520;
  const chartH = 190;
  const pad = { top: 18, right: 12, bottom: 40, left: 44 };
  const allVals = filtered.flatMap((p) =>
    [p.allMarginPct, p.sharpMarginPct, p.otherMarginPct].filter((v) => v != null) as number[]
  );
  const yMin = Math.min(-15, ...allVals, targetMargin, 0) - 3;
  const yMax = Math.max(25, ...allVals, targetMargin) + 3;
  const groupW = (chartW - pad.left - pad.right) / filtered.length;
  const barW = Math.min(9, groupW / 4);

  const sy = (m: number) =>
    pad.top + (1 - (m - yMin) / (yMax - yMin)) * (chartH - pad.top - pad.bottom);
  const targetY = sy(targetMargin);

  const series = [
    { key: "allMarginPct" as const, color: "#64748b", label: "All" },
    { key: "sharpMarginPct" as const, color: "#dc2626", label: "Sharps" },
    { key: "otherMarginPct" as const, color: "#2563eb", label: "Others" },
  ];

  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-xl print:max-w-none">
        <YAxisGrid yMin={yMin} yMax={yMax} pad={pad} chartW={chartW} chartH={chartH} />
        <line
          x1={pad.left}
          x2={chartW - pad.right}
          y1={targetY}
          y2={targetY}
          stroke="#059669"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <text x={chartW - pad.right} y={targetY - 4} textAnchor="end" fontSize={8} fill="#059669">
          Target {targetMargin}%
        </text>
        {filtered.map((p, i) => {
          const gx = pad.left + i * groupW + groupW / 2;
          return (
            <g key={p.label}>
              {series.map((s, si) => {
                const val = p[s.key];
                if (val == null) return null;
                const x = gx + (si - 1) * (barW + 2);
                const y0 = sy(0);
                const y1 = sy(val);
                const h = Math.abs(y1 - y0);
                const labelY = val >= 0 ? y1 - 3 : y0 + 9;
                return (
                  <g key={s.key}>
                    <rect
                      x={x}
                      y={val >= 0 ? y1 : y0}
                      width={barW}
                      height={Math.max(1, h)}
                      fill={s.color}
                      opacity={0.85}
                      rx={1}
                    />
                    <text
                      x={x + barW / 2}
                      y={labelY}
                      textAnchor="middle"
                      fontSize={6}
                      fill="#334155"
                    >
                      {val > 0 ? "+" : ""}{val.toFixed(0)}%
                    </text>
                  </g>
                );
              })}
              <text
                x={gx}
                y={chartH - 8}
                textAnchor="middle"
                fontSize={7}
                fill="#64748b"
              >
                {p.label.length > 10 ? `${p.label.slice(0, 8)}…` : p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const YEARLY_COLORS: Record<string, string> = {
  "Fielder Catch": "#2563eb",
  "Keeper Catch": "#7c3aed",
  Bowled: "#ea580c",
  LBW: "#db2777",
  "Run Out": "#059669",
  Stumped: "#0891b2",
  Other: "#64748b",
};

export function ReportYearlyDismissalChart({
  title,
  points,
  selections,
}: {
  title: string;
  points: Array<{ year: string; [key: string]: string | number }>;
  selections: string[];
}) {
  if (points.length === 0) return null;

  const chartW = 520;
  const chartH = 200;
  const pad = { top: 16, right: 12, bottom: 32, left: 44 };

  const maxY = Math.max(
    ...points.flatMap((p) =>
      selections.map((s) => {
        const key = `${s}SharePct`;
        const v = p[key];
        return typeof v === "number" ? v : 0;
      })
    ),
    10
  );

  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;
  const sx = (i: number) => pad.left + (i / Math.max(1, points.length - 1)) * innerW;
  const sy = (v: number) => pad.top + (1 - v / (maxY * 1.1)) * innerH;

  return (
    <div className="report-chart">
      <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
      <div className="mb-2 flex flex-wrap gap-2 text-[9px] text-slate-500">
        {selections.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ backgroundColor: YEARLY_COLORS[s] ?? "#94a3b8" }}
            />
            {s}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-xl print:max-w-none">
        {selections.map((sel) => {
          const key = `${sel}SharePct`;
          const path = points
            .map((p, i) => {
              const v = typeof p[key] === "number" ? (p[key] as number) : 0;
              return `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`;
            })
            .join(" ");
          return (
            <path
              key={sel}
              d={path}
              fill="none"
              stroke={YEARLY_COLORS[sel] ?? "#94a3b8"}
              strokeWidth={1.8}
              opacity={0.9}
            />
          );
        })}
        {points.map((p, i) => (
          <text
            key={p.year}
            x={sx(i)}
            y={chartH - 8}
            textAnchor="middle"
            fontSize={7}
            fill="#64748b"
            transform={points.length > 8 ? `rotate(-25 ${sx(i)} ${chartH - 8})` : undefined}
          >
            {p.year}
          </text>
        ))}
      </svg>
    </div>
  );
}
