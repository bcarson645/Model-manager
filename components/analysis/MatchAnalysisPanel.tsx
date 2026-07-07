"use client";

import { useEffect, useMemo, useState } from "react";
import { computeMatchAnalysis } from "@/lib/scorecards/match-analysis";
import {
  filterMatchesByDateRange,
  getMatchDateBounds,
  type DateRange,
} from "@/lib/scorecards/date-range";
import { getMatchesForFormat, getProfileForFormat, formatLabel } from "@/lib/scorecards/format-source";
import { DateRangeSlider } from "./DateRangeSlider";
import { ModelTablesPanel } from "./ModelTablesPanel";
import { WinProbabilityChart } from "./WinProbabilityChart";
import { ChaseScoreDensityChart } from "./ChaseScoreDensityChart";
import { computeWinProbabilityCurves } from "@/lib/scorecards/win-probability-curves";

import type { DataFormat } from "@/lib/scorecards/types";

type MatchAnalysisPanelProps = {
  format: DataFormat;
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function MatchAnalysisPanel({ format }: MatchAnalysisPanelProps) {
  const allMatches = useMemo(() => getMatchesForFormat(format), [format]);
  const profile = useMemo(() => getProfileForFormat(format), [format]);
  const dateBounds = useMemo(() => getMatchDateBounds(allMatches), [allMatches]);

  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    if (dateBounds) {
      setDateRange({ start: dateBounds.min, end: dateBounds.max });
    } else {
      setDateRange(null);
    }
  }, [format, dateBounds?.min, dateBounds?.max]);

  const matches = useMemo(() => {
    if (!dateBounds || !dateRange) return allMatches;
    return filterMatchesByDateRange(allMatches, dateRange, dateBounds);
  }, [allMatches, dateBounds, dateRange]);

  const analysis = useMemo(() => computeMatchAnalysis(matches), [matches]);
  const winCurves = useMemo(() => computeWinProbabilityCurves(matches, format), [matches, format]);

  if (!profile || allMatches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
        No {formatLabel(format)} data loaded. Run the extractor for this format.
      </div>
    );
  }

  const maxBucket = Math.max(...analysis.firstInningsScores.buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Match analysis</h2>
        <p className="mt-1 text-sm text-slate-400">
          {matches.length.toLocaleString()} of {profile.matchCount.toLocaleString()}{" "}
          {formatLabel(format)} matches · {analysis.decidedMatches.toLocaleString()} decided ·{" "}
          {analysis.ties} ties
        </p>
        {dateBounds && dateRange && (
          <DateRangeSlider
            bounds={dateBounds}
            value={dateRange}
            onChange={setDateRange}
            matchCount={matches.length}
            totalCount={allMatches.length}
          />
        )}
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">First innings score distribution</h3>
        <p className="mt-1 text-sm text-slate-400">
          Mean {analysis.firstInningsScores.mean} · Median {analysis.firstInningsScores.median}{" "}
          · Range {analysis.firstInningsScores.min}–{analysis.firstInningsScores.max}
        </p>
        <div className="mt-5 space-y-2">
          {analysis.firstInningsScores.buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 font-mono text-slate-400">{b.label}</span>
              <div className="h-6 flex-1 rounded bg-surface">
                <div
                  className="flex h-full items-center rounded bg-emerald-600/50 pl-2 font-mono text-xs text-white"
                  style={{ width: `${Math.max((b.count / maxBucket) * 100, b.count > 0 ? 8 : 0)}%` }}
                >
                  {b.count > 0 ? b.count : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">Win probability vs first-innings score</h3>
        <p className="mt-1 text-sm text-slate-400">
          How often the team batting first defends their total, and how often the chaser wins, by
          target score. Based on {winCurves.pairs.length.toLocaleString()} decided two-innings
          matches in the selected date range.
        </p>
        <div className="mt-5">
          <WinProbabilityChart
            points={winCurves.byTarget}
            xLabel={`First innings total (target) — ${formatLabel(format)}`}
            binWidth={winCurves.binWidth}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-white">Chase innings score distribution</h3>
        <p className="mt-1 text-sm text-slate-400">
          Empirical distribution of second-innings totals across all chases in the filter. Compare
          the peak to common par scores when sanity-checking chase models.
        </p>
        <div className="mt-5">
          <ChaseScoreDensityChart
            points={winCurves.chaseScoreDensity}
            binWidth={winCurves.binWidth}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Bat first → win"
          value={`${analysis.batFirst.winPct.toFixed(1)}%`}
          sub={`${analysis.batFirst.wins} / ${analysis.batFirst.total} matches`}
        />
        <StatCard
          label="Chase → win"
          value={`${analysis.chase.winPct.toFixed(1)}%`}
          sub={`${analysis.chase.wins} / ${analysis.chase.total} matches`}
        />
        <StatCard
          label="Century scored → team wins"
          value={`${analysis.centuries.winPct.toFixed(1)}%`}
          sub={`${analysis.centuries.centuryTeamWon} / ${analysis.centuries.matchesWithCentury} matches with 100+`}
        />
      </section>

      <section className="rounded-2xl border border-dashed border-surface-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-slate-300">Toss &amp; win correlation</h3>
        <p className="mt-2 text-sm text-slate-500">{analysis.toss.note}</p>
      </section>

      <ModelTablesPanel format={format} matches={matches} dateRange={dateRange} />
    </div>
  );
}
