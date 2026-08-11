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
import {
  DashBadge,
  DashCard,
  DashEmpty,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
} from "./AnalysisDashboard";

import type { DataFormat } from "@/lib/scorecards/types";

type MatchAnalysisPanelProps = {
  format: DataFormat;
};

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
  const winCurves = useMemo(
    () => computeWinProbabilityCurves(matches, format),
    [matches, format]
  );

  if (!profile || allMatches.length === 0) {
    return (
      <DashPage>
        <DashEmpty>
          No {formatLabel(format)} data loaded. Run the extractor for this format.
        </DashEmpty>
      </DashPage>
    );
  }

  const maxBucket = Math.max(
    ...analysis.firstInningsScores.buckets.map((b) => b.count),
    1
  );

  return (
    <DashPage>
      <DashHeader
        title="Match analysis"
        badge={<DashBadge>{formatLabel(format)}</DashBadge>}
        subtitle={
          <>
            <span className="font-mono text-slate-300">
              {matches.length.toLocaleString()}
            </span>{" "}
            of {profile.matchCount.toLocaleString()} matches ·{" "}
            {analysis.decidedMatches.toLocaleString()} decided · {analysis.ties}{" "}
            ties
          </>
        }
      />

      {dateBounds && dateRange && (
        <DashCard span="full" compact title="Date range">
          <DateRangeSlider
            bounds={dateBounds}
            value={dateRange}
            onChange={setDateRange}
            matchCount={matches.length}
            totalCount={allMatches.length}
          />
        </DashCard>
      )}

      <DashGrid>
        <DashStat
          label="Bat first → win"
          value={`${analysis.batFirst.winPct.toFixed(1)}%`}
          sub={`${analysis.batFirst.wins} / ${analysis.batFirst.total}`}
          accent
        />
        <DashStat
          label="Chase → win"
          value={`${analysis.chase.winPct.toFixed(1)}%`}
          sub={`${analysis.chase.wins} / ${analysis.chase.total}`}
        />
        <DashStat
          label="Century → team wins"
          value={`${analysis.centuries.winPct.toFixed(1)}%`}
          sub={`${analysis.centuries.centuryTeamWon} / ${analysis.centuries.matchesWithCentury} with 100+`}
        />
        <DashStat
          label="1st inns mean / median"
          value={`${analysis.firstInningsScores.mean}`}
          sub={`Median ${analysis.firstInningsScores.median} · ${analysis.firstInningsScores.min}–${analysis.firstInningsScores.max}`}
        />
      </DashGrid>

      <DashGrid>
        <DashCard
          span="half"
          title="First innings score distribution"
          description={`Mean ${analysis.firstInningsScores.mean} · median ${analysis.firstInningsScores.median}`}
        >
          <div className="space-y-1.5 sm:space-y-2">
            {analysis.firstInningsScores.buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <span className="w-14 shrink-0 font-mono text-slate-400 sm:w-20">
                  {b.label}
                </span>
                <div className="h-5 flex-1 rounded bg-surface sm:h-6">
                  <div
                    className="flex h-full items-center rounded bg-emerald-600/50 pl-1.5 font-mono text-[10px] text-white sm:pl-2 sm:text-xs"
                    style={{
                      width: `${Math.max(
                        (b.count / maxBucket) * 100,
                        b.count > 0 ? 8 : 0
                      )}%`,
                    }}
                  >
                    {b.count > 0 ? b.count : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashCard>

        <DashCard
          span="half"
          title="Win probability vs first-innings score"
          description={`${winCurves.pairs.length.toLocaleString()} decided two-innings matches in range`}
        >
          <div className="overflow-x-auto">
            <WinProbabilityChart
              points={winCurves.byTarget}
              xLabel={`First innings total — ${formatLabel(format)}`}
              binWidth={winCurves.binWidth}
            />
          </div>
        </DashCard>

        <DashCard
          span="two-thirds"
          title="Chase innings score distribution"
          description="Empirical second-innings totals — compare peaks to par when checking chase models."
        >
          <div className="overflow-x-auto">
            <ChaseScoreDensityChart
              points={winCurves.chaseScoreDensity}
              binWidth={winCurves.binWidth}
            />
          </div>
        </DashCard>

        <DashCard span="third" title="Toss & win" dashed>
          <p className="text-sm leading-relaxed text-slate-400">
            {analysis.toss.note}
          </p>
        </DashCard>

        <DashCard span="full" title="Model tables" compact>
          <ModelTablesPanel format={format} matches={matches} dateRange={dateRange} />
        </DashCard>
      </DashGrid>
    </DashPage>
  );
}
