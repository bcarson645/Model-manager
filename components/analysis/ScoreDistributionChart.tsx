"use client";

import type { ScoreDistributionResult } from "@/lib/scorecards/player-stats";

type ScoreDistributionChartProps = {
  distribution: ScoreDistributionResult;
  bucketWidth: number;
  onBucketWidthChange: (width: number) => void;
};

const WIDTH_OPTIONS = [5, 10, 15, 20, 25];

export function ScoreDistributionChart({
  distribution,
  bucketWidth,
  onBucketWidthChange,
}: ScoreDistributionChartProps) {
  const { buckets } = distribution;
  const maxPct = Math.max(
    ...buckets.flatMap((b) => [b.playerPct, b.datasetPct]),
    1
  );

  // Cap displayed buckets for very high scorers — keep tail collapsed visually
  // by showing all buckets that have any player or dataset mass above 0.5%
  // plus always the first few low-score bands.
  const visible = buckets.filter(
    (b, i) => i < 8 || b.playerPct >= 0.5 || b.datasetPct >= 0.5 || b.playerCount > 0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="% scores ≥ 30"
            value={`${distribution.pctAbove30.toFixed(1)}%`}
            sub={`Dataset ${distribution.datasetPctAbove30.toFixed(1)}%`}
            better={
              distribution.pctAbove30 - distribution.datasetPctAbove30
            }
          />
          <Metric
            label="% scores ≥ 50"
            value={`${distribution.pctAbove50.toFixed(1)}%`}
            sub={`Dataset ${distribution.datasetPctAbove50.toFixed(1)}%`}
            better={
              distribution.pctAbove50 - distribution.datasetPctAbove50
            }
          />
          <Metric
            label="Player innings"
            value={String(distribution.playerInnings)}
          />
          <Metric
            label="Dataset innings"
            value={distribution.datasetInnings.toLocaleString()}
          />
        </div>
        <label className="block text-xs text-slate-400">
          Band width
          <select
            value={bucketWidth}
            onChange={(e) => onBucketWidthChange(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          >
            {WIDTH_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w} runs
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1.5">
        {visible.map((b) => {
          const playerW = (b.playerPct / maxPct) * 100;
          const datasetW = (b.datasetPct / maxPct) * 100;
          const barColor = !b.highlighted
            ? "bg-emerald-600/55"
            : b.aboveDataset
              ? "bg-emerald-400"
              : "bg-rose-500/80";
          return (
            <div
              key={b.label}
              className={`rounded-lg px-1 py-1 sm:px-2 ${
                b.highlighted
                  ? b.aboveDataset
                    ? "bg-emerald-950/35"
                    : "bg-rose-950/30"
                  : ""
              }`}
              title={`${b.label}: player ${b.playerPct.toFixed(1)}% (${b.playerCount}) · dataset ${b.datasetPct.toFixed(1)}% · Δ ${b.vsAvgPp >= 0 ? "+" : ""}${b.vsAvgPp.toFixed(1)} pp · z ${b.zScore >= 0 ? "+" : ""}${b.zScore.toFixed(2)}`}
            >
              <div className="flex items-center gap-2 text-xs sm:gap-3">
                <span className="w-14 shrink-0 font-mono text-slate-400 sm:w-16">
                  {b.label}
                </span>
                <div className="relative h-7 flex-1 rounded bg-surface">
                  {/* Dataset mean marker */}
                  <div
                    className="absolute inset-y-1 rounded bg-slate-500/35"
                    style={{ width: `${Math.max(datasetW, b.datasetPct > 0 ? 2 : 0)}%` }}
                  />
                  <div
                    className={`absolute inset-y-1 rounded ${barColor}`}
                    style={{
                      width: `${Math.max(playerW, b.playerCount > 0 ? 3 : 0)}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 font-mono text-[10px] text-white/90 sm:text-xs">
                    {b.playerCount > 0
                      ? `${b.playerPct.toFixed(1)}% · ${b.playerCount}`
                      : ""}
                  </div>
                </div>
                <span
                  className={`w-14 shrink-0 text-right font-mono text-[10px] sm:w-16 sm:text-xs ${
                    b.highlighted
                      ? b.aboveDataset
                        ? "text-emerald-300"
                        : "text-rose-300"
                      : "text-slate-500"
                  }`}
                >
                  {b.vsAvgPp >= 0 ? "+" : ""}
                  {b.vsAvgPp.toFixed(1)}pp
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-emerald-600/55" />{" "}
          Player %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-slate-500/35" />{" "}
          Dataset %
        </span>
        <span>
          Highlighted: |z| ≥ 1.96 or |Δ| ≥ 8pp (min 8 innings)
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  better,
}: {
  label: string;
  value: string;
  sub?: string;
  better?: number;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-mono text-lg ${
          better == null
            ? "text-white"
            : better > 1
              ? "text-emerald-300"
              : better < -1
                ? "text-rose-300"
                : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}
