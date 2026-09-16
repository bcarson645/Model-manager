"use client";

import { useMemo, useState } from "react";
import { getModFrequencyPricing } from "@/lib/data-analysis/mod-frequency-pricing";
import type { ModFrequencySegment } from "@/lib/data-analysis/mod-frequency-pricing-types";
import {
  DashCard,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
  DashTable,
} from "./AnalysisDashboard";
import { ModDismissalTrendChart } from "./ModDismissalTrendChart";

const SELECTIONS = [
  "Fielder Catch",
  "Keeper Catch",
  "Bowled",
  "LBW",
  "Run Out",
  "Stumped",
  "Other",
];

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtOdds(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(2);
}

function SegmentView({ segment, target }: { segment: ModFrequencySegment; target: number }) {
  const activeSelections = SELECTIONS.filter((s) =>
    segment.empiricalFrequency.some((f) => f.selection === s)
  );

  return (
    <div className="space-y-4">
      <DashGrid>
        <DashStat span="quarter" label="Bets" value={segment.overall.bets.toLocaleString()} />
        <DashStat span="quarter" label="Book margin" value={fmtPct(segment.overall.marginPct)} />
        <DashStat
          span="quarter"
          label="Outcome samples"
          value={segment.overall.outcomeSamples.toLocaleString()}
          hint="Punter-winning bets"
        />
        <DashStat span="quarter" label="Target margin" value={`${target}%`} />
      </DashGrid>

      {segment.emergingTrends.length > 0 && (
        <DashCard
          title="Emerging trends"
          description="Early window vs recent — share of dismissals (punter wins) by selection"
        >
          <DashTable
            columns={["Selection", "Early share", "Recent share", "Change", "Pricing note"]}
            rows={segment.emergingTrends.map((t) => [
              t.selection,
              `${t.earlySharePct.toFixed(1)}%`,
              `${t.recentSharePct.toFixed(1)}%`,
              <span
                key={`d-${t.selection}`}
                className={t.direction === "up" ? "text-amber-300" : "text-sky-300"}
              >
                {t.deltaPp > 0 ? "+" : ""}{t.deltaPp.toFixed(1)}pp
              </span>,
              t.direction === "up"
                ? "Raise implied prob / shorten odds"
                : "Room to lengthen odds",
            ])}
          />
        </DashCard>
      )}

      <DashCard title="Dismissal frequency trend" description="Monthly share of outcomes by selection">
        <ModDismissalTrendChart
          title="Stake-weighted outcome share (%)"
          points={segment.monthlyTrend}
          selections={activeSelections}
        />
      </DashCard>

      <DashCard
        title="Coherent average prices (innings-wide)"
        description={`Implied probabilities sum to ${segment.jointPricing.impliedSumPct}% — use as model target across overs`}
      >
        <DashTable
          columns={["Selection", "Recommended odds", "Implied %"]}
          rows={segment.jointPricing.selections.map((r) => [
            r.selection,
            fmtOdds(r.recommendedOdds),
            `${r.impliedPct.toFixed(1)}%`,
          ])}
        />
      </DashCard>

      <DashGrid>
        <DashCard span="half" title="Current vs empirical frequency">
          <DashTable
            columns={["Selection", "Outcome %", "Avg odds", "Implied %", "Book margin"]}
            rows={segment.currentPricing.map((r) => [
              r.selection,
              `${r.outcomeSharePct.toFixed(1)}%`,
              fmtOdds(r.avgOdds),
              r.impliedPct != null ? `${r.impliedPct.toFixed(1)}%` : "—",
              fmtPct(r.marginPct),
            ])}
          />
        </DashCard>
        <DashCard
          span="half"
          title="Recommended average prices"
          description={`Proportional overround — implied sum ${segment.recommendedPricing.impliedSumPct}%`}
        >
          <DashTable
            columns={["Selection", "Fair odds", "Recommended", "Implied %", "vs current"]}
            rows={segment.recommendedPricing.selections.map((r) => [
              r.selection,
              fmtOdds(r.fairOdds),
              fmtOdds(r.recommendedOdds),
              r.recommendedImpliedPct != null ? `${r.recommendedImpliedPct.toFixed(1)}%` : "—",
              r.oddsScaleVsCurrent != null ? `${(r.oddsScaleVsCurrent * 100).toFixed(0)}%` : "—",
            ])}
          />
        </DashCard>
      </DashGrid>

      <DashCard
        title="Optimized average prices (P/L-adjusted)"
        description={`Per-selection scale to hit ${target}% margin on historical bets — implied sum ${segment.optimizedPricing.impliedSumPct}%`}
      >
        <DashTable
          columns={[
            "Selection",
            "Current odds",
            "Scale",
            "Optimized odds",
            "Implied %",
            "Current margin",
          ]}
          rows={segment.optimizedPricing.selections.map((r) => [
            r.selection,
            fmtOdds(r.currentAvgOdds),
            r.oddsScale != null ? r.oddsScale.toFixed(3) : "—",
            fmtOdds(r.optimizedOdds),
            r.optimizedImpliedPct != null ? `${r.optimizedImpliedPct.toFixed(1)}%` : "—",
            fmtPct(r.currentMarginPct),
          ])}
        />
        <p className="mt-3 text-xs text-slate-500">
          Scale &lt; 1 = shorten odds. Use optimized prices as innings-average targets; phase-specific
          tweaks may still be needed (see Part 2).
        </p>
      </DashCard>
    </div>
  );
}

export function ModFrequencyPricingPanel() {
  const data = useMemo(() => getModFrequencyPricing(), []);
  const segments = data.segments.filter((s) => !s.empty);
  const odiSegments = segments.filter((s) => s.id.includes("odi"));
  const [segmentId, setSegmentId] = useState(odiSegments[0]?.id ?? segments[0]?.id ?? "men-odi");
  const segment = segments.find((s) => s.id === segmentId) ?? segments[0];

  return (
    <DashPage>
      <DashHeader
        title="MoD frequency trends & optimal pricing"
        subtitle={`${data.sourceFile} · dismissal proxy from punter-winning bets · target ${data.targetMarginPct}% margin`}
      />

      <DashCard title="Methodology" description={data.methodology.frequency}>
        <p className="text-sm text-slate-400">{data.methodology.proportionalPricing}</p>
        <p className="mt-1 text-xs text-slate-500">{data.methodology.caveat}</p>
      </DashCard>

      <div className="flex flex-wrap gap-2">
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSegmentId(s.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              s.id === segmentId
                ? "bg-emerald-600 text-white"
                : "bg-surface-raised text-slate-400 hover:text-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {segment && <SegmentView segment={segment} target={data.targetMarginPct} />}
    </DashPage>
  );
}
