"use client";

import { useMemo, useState } from "react";
import { getModPortfolioPricing } from "@/lib/data-analysis/mod-portfolio-pricing";
import type { PortfolioSegment } from "@/lib/data-analysis/mod-portfolio-pricing-types";
import {
  DashCard,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
  DashTable,
} from "./AnalysisDashboard";

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtOdds(n: number | null): string {
  if (n == null || n > 500) return "—";
  return n.toFixed(2);
}

function marginClass(current: number, target: number): string {
  if (current >= target - 0.5) return "text-emerald-400";
  if (current < 0) return "text-red-400";
  return "text-amber-300";
}

function adjustCell(value: number, key: string) {
  if (value === 0) return <span key={key} className="text-slate-500">0</span>;
  return (
    <span key={key} className={value > 0 ? "text-red-300" : "text-sky-300"}>
      {value > 0 ? "+" : ""}{value}
    </span>
  );
}

function SegmentView({ segment, target }: { segment: PortfolioSegment; target: number }) {
  const o = segment.overall;
  const hitTarget = o.optimizedMarginPct >= target - 0.5;
  const fc = segment.optimalAdjusts.find((r) => r.selection === "Fielder Catch");

  return (
    <div className="space-y-4">
      <DashGrid>
        <DashStat
          span="quarter"
          label="Current margin"
          value={fmtPct(o.currentMarginPct)}
          valueClassName={marginClass(o.currentMarginPct, target)}
        />
        <DashStat
          span="quarter"
          label="At optimised adjusts"
          value={fmtPct(o.optimizedMarginPct)}
          hint={`Target ${target}%`}
          valueClassName={marginClass(o.optimizedMarginPct, target)}
        />
        <DashStat
          span="quarter"
          label="Fielder Catch stake"
          value={`${segment.stakeMixPct["Fielder Catch"]?.toFixed(0) ?? 0}%`}
          hint="Drives margin sensitivity"
        />
        <DashStat
          span="quarter"
          label="Recommended I45"
          value={fc ? `${fc.adjustI > 0 ? "+" : ""}${fc.adjustI}` : "—"}
          hint="PM Publication adjust"
          valueClassName={fc && fc.adjustI > 0 ? "text-red-300" : "text-sky-300"}
        />
      </DashGrid>

      {!hitTarget && (
        <DashCard title="Target not fully reached">
          <p className="text-sm text-amber-200">
            Best simulated margin is {fmtPct(o.optimizedMarginPct)} on this volume. Further
            tightening (especially Fielder Catch) or phase-specific adjusts may be needed — see Part
            2.
          </p>
        </DashCard>
      )}

      <DashCard title="Stake mix" description="Why probability shifts matter differently per format">
        <DashTable
          columns={["Selection", "Stake share", "Current margin lever"]}
          rows={segment.optimalAdjusts
            .filter((r) => r.stakeSharePct > 0.1)
            .sort((a, b) => b.stakeSharePct - a.stakeSharePct)
            .map((r) => [
              r.selection,
              `${r.stakeSharePct.toFixed(1)}%`,
              r.selection === "Fielder Catch" && r.stakeSharePct > 50
                ? "Primary — FC adjust moves total P/L"
                : r.stakeSharePct > 10
                  ? "Secondary volume"
                  : "Low volume",
            ])}
        />
      </DashCard>

      <DashCard
        title="Optimal adjust package (I45–I51)"
        description={segment.renormFormula}
      >
        <DashTable
          columns={[
            "Selection",
            "Current odds",
            "I adjust",
            "Published prob",
            "Δ prob",
            "New odds",
          ]}
          rows={segment.optimalAdjusts
            .filter((r) => r.stakeSharePct > 0 || r.adjustI !== 0)
            .map((r) => [
              r.selection,
              fmtOdds(r.currentAvgOdds ?? null),
              adjustCell(r.adjustI, `i-${r.selection}`),
              `${r.publishedProbPct.toFixed(1)}%`,
              <span
                key={`d-${r.selection}`}
                className={r.deltaProbPp > 0 ? "text-red-300" : r.deltaProbPp < 0 ? "text-sky-300" : "text-slate-500"}
              >
                {r.deltaProbPp > 0 ? "+" : ""}{r.deltaProbPp.toFixed(1)}pp
              </span>,
              fmtOdds(r.recommendedOdds),
            ])}
        />
      </DashCard>

      <DashGrid>
        <DashCard span="half" title="Probability redistribution">
          <p className="mb-2 text-sm text-slate-300">
            Fielder Catch:{" "}
            <strong className={fc && fc.deltaProbPp > 0 ? "text-red-300" : "text-sky-300"}>
              {segment.probabilityTransfer.fielderCatchDeltaPp > 0 ? "+" : ""}
              {segment.probabilityTransfer.fielderCatchDeltaPp.toFixed(1)}pp
            </strong>{" "}
            after renorm (positive I45 shortens FC odds; others shift inversely).
          </p>
          <DashTable
            columns={["Selection", "Δ published prob"]}
            rows={segment.probabilityTransfer.toOtherSelections.map((t) => [
              t.selection,
              <span
                key={t.selection}
                className={t.deltaProbPp > 0 ? "text-red-300" : "text-sky-300"}
              >
                {t.deltaProbPp > 0 ? "+" : ""}{t.deltaProbPp.toFixed(1)}pp
              </span>,
            ])}
          />
        </DashCard>

        <DashCard span="half" title="Paired adjust alternatives (trader-friendly)">
          {segment.pairedAdjustAlternatives.length === 0 ? (
            <p className="text-sm text-slate-500">No paired alternatives near target on this segment.</p>
          ) : (
            <DashTable
              columns={["Pattern", "Simulated margin"]}
              rows={segment.pairedAdjustAlternatives.map((p) => [
                p.pattern,
                fmtPct(p.simulatedMarginPct),
              ])}
            />
          )}
          <p className="mt-2 text-xs text-slate-500">
            Paired ±I transfers weight between two methods without changing total before renorm.
          </p>
        </DashCard>
      </DashGrid>

      {segment.formatNotes.length > 0 && (
        <DashCard title="Format-specific notes">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {segment.formatNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </DashCard>
      )}
    </div>
  );
}

export function ModPortfolioPricingPanel() {
  const data = useMemo(() => getModPortfolioPricing(), []);
  const segments = data.segments.filter((s) => !s.empty);
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "men-odi");
  const segment = segments.find((s) => s.id === segmentId) ?? segments[0];

  return (
    <DashPage>
      <DashHeader
        title="Portfolio adjust optimisation"
        subtitle={`Target ${data.targetMarginPct}% book margin on total stake · ${data.modelParity}`}
      />

      <DashCard title="How renormalisation works">
        <p className="text-sm text-slate-300">
          Same as <code className="text-emerald-300">FirstDismissal.cs</code> and PM I45–I51: each
          adjust adds I÷100 to that method&apos;s weight, then all seven published probabilities
          are divided by the new total. Positive I45 raises Fielder Catch weight → shorter FC odds;
          every other method&apos;s published probability falls proportionally → longer odds on
          Bowled, LBW, Run Out, etc.
        </p>
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
            <span className={`ml-2 text-xs ${s.id === segmentId ? "text-emerald-100" : "text-slate-500"}`}>
              {fmtPct(s.overall.currentMarginPct)} → {fmtPct(s.overall.optimizedMarginPct)}
            </span>
          </button>
        ))}
      </div>

      {segment && <SegmentView segment={segment} target={data.targetMarginPct} />}
    </DashPage>
  );
}
