"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { downloadReportsPdf } from "@/lib/data-analysis/export-report-pdf";
import { buildModTrendsPricingReport } from "@/lib/data-analysis/mod-trends-reports";
import type { ModTrendsSegmentReport } from "@/lib/data-analysis/mod-trends-reports";
import { DashHeader, DashPage } from "./AnalysisDashboard";
import { ModDismissalTrendChart } from "./ModDismissalTrendChart";
import {
  ReportHorizontalBars,
  ReportYearlyDismissalChart,
} from "./ReportCharts";

const SELECTIONS = [
  "Fielder Catch",
  "Keeper Catch",
  "Bowled",
  "LBW",
  "Run Out",
  "Stumped",
];

const CHART_SELECTIONS = ["Fielder Catch", "Keeper Catch", "Bowled", "LBW", "Run Out"];

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtOdds(n: number | null): string {
  if (n == null || n > 500) return "—";
  return n.toFixed(2);
}

function ReportSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="report-page mb-8 rounded-xl border border-surface-border bg-white p-6 text-slate-900 shadow-sm print:mb-0 print:rounded-none print:border-0 print:p-8 print:shadow-none">
      <header className="border-b border-slate-200 pb-4 print:pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
          MoD trends &amp; pricing · Confidential
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </header>
      <div className="mt-5 space-y-5 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function ConclusionBox({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Key conclusions</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-slate-500">None flagged.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-slate-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          {headers.map((h) => (
            <th key={h} className="px-2 py-2 text-left font-semibold text-slate-700">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="px-2 py-2 text-slate-800">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SegmentSection({ segment, portfolioTarget }: { segment: ModTrendsSegmentReport; portfolioTarget: number }) {
  const freq = segment.frequency;
  const port = segment.portfolio;
  const yearly = segment.scorecardYearly;

  if (!freq && !port) return null;

  const activeSelections = SELECTIONS.filter((s) =>
    freq?.empiricalFrequency.some((f) => f.selection === s)
  );

  return (
    <ReportSection
      title={segment.label}
      subtitle={[
        freq ? `${freq.overall.bets.toLocaleString()} bets · margin ${fmtPct(freq.overall.marginPct)}` : null,
        yearly && !yearly.empty
          ? `Scorecard: ${yearly.totalDismissals?.toLocaleString()} dismissals (${yearly.yearRange?.from}–${yearly.yearRange?.to})`
          : "No multi-year scorecard data",
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {segment.trendCallouts.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">Dismissal frequency trends</h3>
          <BulletList items={segment.trendCallouts} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {yearly && !yearly.empty && yearly.yearlyTrend && yearly.yearlyTrend.length > 0 && (
          <ReportYearlyDismissalChart
            title={`Scorecard dismissal share by year (${yearly.yearRange?.from}–${yearly.yearRange?.to})`}
            points={yearly.yearlyTrend}
            selections={CHART_SELECTIONS}
          />
        )}
        {freq && freq.monthlyTrend.length > 0 && (
          <ModDismissalTrendChart
            title="Betting outcome share by month (Jun–Sep 2026)"
            points={freq.monthlyTrend}
            selections={activeSelections.filter((s) => CHART_SELECTIONS.includes(s))}
          />
        )}
      </div>

      {yearly && !yearly.empty && yearly.emergingTrends && yearly.emergingTrends.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">
            Long-term shift ({yearly.periodLabels?.early} vs {yearly.periodLabels?.recent})
          </h3>
          <MiniTable
            headers={["Selection", "Early share", "Recent share", "Change"]}
            rows={yearly.emergingTrends.map((t) => [
              t.selection,
              `${t.earlySharePct.toFixed(1)}%`,
              `${t.recentSharePct.toFixed(1)}%`,
              `${t.deltaPp > 0 ? "+" : ""}${t.deltaPp.toFixed(1)}pp`,
            ])}
          />
        </div>
      )}

      {freq && (
        <div>
          <h3 className="font-semibold text-slate-900">Current vs recommended pricing</h3>
          <MiniTable
            headers={["Selection", "Outcome share", "Current odds", "Coherent odds", "Scale vs current"]}
            rows={freq.recommendedPricing.selections.map((r) => {
              const current = freq.currentPricing.find((c) => c.selection === r.selection);
              const joint = freq.jointPricing.selections.find((j) => j.selection === r.selection);
              const share = freq.empiricalFrequency.find((f) => f.selection === r.selection);
              return [
                r.selection,
                share ? `${share.sharePct.toFixed(1)}%` : "—",
                fmtOdds(current?.avgOdds ?? null),
                fmtOdds(joint?.recommendedOdds ?? null),
                r.oddsScaleVsCurrent != null ? `${(r.oddsScaleVsCurrent * 100).toFixed(0)}%` : "—",
              ];
            })}
          />
        </div>
      )}

      {port && !port.empty && (
        <>
          <div>
            <h3 className="font-semibold text-slate-900">
              Portfolio adjusts ({portfolioTarget}% target margin)
            </h3>
            <p className="mt-1 text-slate-700">
              Current margin {fmtPct(port.overall.currentMarginPct)} → optimised{" "}
              {fmtPct(port.overall.optimizedMarginPct)}. {port.renormFormula}
            </p>
          </div>

          <MiniTable
            headers={["Selection", "Base prob", "I adjust", "Published prob", "Δ prob", "Rec. odds", "Current odds", "Stake %"]}
            rows={port.optimalAdjusts
              .filter((r) => r.stakeSharePct > 0.1 || r.adjustI !== 0)
              .map((r) => [
                r.selection,
                `${r.baseProbPct.toFixed(1)}%`,
                r.adjustI > 0 ? `+${r.adjustI}` : String(r.adjustI),
                `${r.publishedProbPct.toFixed(1)}%`,
                `${r.deltaProbPp > 0 ? "+" : ""}${r.deltaProbPp.toFixed(1)}pp`,
                fmtOdds(r.recommendedOdds),
                fmtOdds(r.currentAvgOdds ?? null),
                `${r.stakeSharePct.toFixed(1)}%`,
              ])}
          />

          {segment.pricingCallouts.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900">Pricing improvement callouts</h3>
              <BulletList items={segment.pricingCallouts} />
            </div>
          )}
        </>
      )}
    </ReportSection>
  );
}

export function ModTrendsPricingReport() {
  const report = useMemo(() => buildModTrendsPricingReport(), []);
  const [saving, setSaving] = useState(false);

  const saveReports = useCallback(async () => {
    const root = document.getElementById("mod-trends-pricing-reports");
    if (!root) return;
    setSaving(true);
    try {
      await downloadReportsPdf(root, `mod-trends-pricing-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const printReports = useCallback(() => {
    window.print();
  }, []);

  const activeSegments = report.segments.filter((s) => s.frequency || s.portfolio);

  const marginBars = activeSegments
    .filter((s) => s.frequency)
    .map((s) => ({
      label: s.label,
      value: s.frequency!.overall.marginPct ?? 0,
      color:
        (s.frequency!.overall.marginPct ?? 0) < 0
          ? "#dc2626"
          : (s.frequency!.overall.marginPct ?? 0) >= report.portfolioTargetPct
            ? "#059669"
            : "#d97706",
    }));

  const fcAdjustBars = activeSegments
    .filter((s) => s.portfolio)
    .map((s) => {
      const fc = s.portfolio!.optimalAdjusts.find((r) => r.selection === "Fielder Catch");
      return {
        label: s.label,
        value: fc?.adjustI ?? 0,
        color: (fc?.adjustI ?? 0) > 0 ? "#dc2626" : "#64748b",
      };
    });

  return (
    <DashPage>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #mod-trends-pricing-reports,
          #mod-trends-pricing-reports * {
            visibility: visible;
          }
          #mod-trends-pricing-reports {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .report-page {
            break-after: page;
            page-break-after: always;
          }
          .report-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <DashHeader
          title="MoD trends & pricing — export reports"
          subtitle={`${activeSegments.length} segment reports with scorecard year trends and portfolio pricing.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveReports}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "Saving PDF…" : "Save PDF"}
              </button>
              <button
                type="button"
                onClick={printReports}
                className="rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-sm font-medium text-slate-200 hover:bg-surface-overlay"
              >
                Print
              </button>
            </div>
          }
        />
        <p className="mb-4 text-sm text-slate-400">
          Save PDF downloads all report pages with charts. Generation may take a few seconds.
        </p>
      </div>

      <div id="mod-trends-pricing-reports" className="space-y-0">
        <ReportSection
          title="Executive summary — MoD trends & pricing improvements"
          subtitle={`${report.frequencySource} · Portfolio target ${report.portfolioTargetPct}% · Generated ${new Date(report.generatedAt).toLocaleDateString()}`}
        >
          <ConclusionBox items={report.keyConclusions} />

          <div>
            <h3 className="font-semibold text-slate-900">Overview</h3>
            <p className="mt-1 text-slate-700">
              This report combines three data sources: (1) multi-year scorecard dismissal frequencies
              from match-analysis datasets (men&apos;s ODI &amp; T20), (2) betting-derived monthly
              outcome trends (Jun–Sep 2026), and (3) portfolio adjust optimisation to hit a{" "}
              {report.portfolioTargetPct}% target margin via I45–I51 renorm.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <ReportHorizontalBars
              title={`Book margin by segment (vs ${report.portfolioTargetPct}% target)`}
              items={marginBars}
              valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
              targetLine={report.portfolioTargetPct}
              targetLabel={`${report.portfolioTargetPct}%`}
            />
            <ReportHorizontalBars
              title="Recommended I45 (Fielder Catch adjust)"
              items={fcAdjustBars}
              valueFmt={(v) => (v > 0 ? `+${v}` : String(v))}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Data limitations</h3>
            <BulletList items={report.limitations} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Segment summary</h3>
            <MiniTable
              headers={[
                "Segment",
                "Book margin",
                "FC stake %",
                "I45",
                "Scorecard years",
                "Key trend",
              ]}
              rows={activeSegments.map((s) => {
                const fc = s.portfolio?.optimalAdjusts.find((r) => r.selection === "Fielder Catch");
                const topTrend = s.scorecardYearly?.emergingTrends?.[0] ?? s.frequency?.emergingTrends?.[0];
                const trendStr = topTrend
                  ? `${topTrend.selection} ${topTrend.direction} ${topTrend.deltaPp > 0 ? "+" : ""}${topTrend.deltaPp.toFixed(1)}pp`
                  : "—";
                return [
                  s.label,
                  s.frequency ? fmtPct(s.frequency.overall.marginPct) : "—",
                  s.portfolio ? `${s.portfolio.stakeMixPct["Fielder Catch"]?.toFixed(0) ?? 0}%` : "—",
                  fc ? (fc.adjustI > 0 ? `+${fc.adjustI}` : String(fc.adjustI)) : "—",
                  s.scorecardYearly?.yearRange
                    ? `${s.scorecardYearly.yearRange.from}–${s.scorecardYearly.yearRange.to}`
                    : "N/A",
                  trendStr,
                ];
              })}
            />
          </div>
        </ReportSection>

        {activeSegments.map((segment) => (
          <SegmentSection
            key={segment.id}
            segment={segment}
            portfolioTarget={report.portfolioTargetPct}
          />
        ))}
      </div>
    </DashPage>
  );
}
