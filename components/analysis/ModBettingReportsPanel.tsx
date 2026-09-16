"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { downloadReportsPdf } from "@/lib/data-analysis/export-report-pdf";
import {
  buildMarketOverviewReport,
  buildSharpBettorsReport,
  fmtDate,
  type BettorReportSlice,
} from "@/lib/data-analysis/mod-reports";
import { getPlayerModTask1 } from "@/lib/data-analysis/player-mod-task1";
import { getPlayerModTask2 } from "@/lib/data-analysis/player-mod-task2";
import type { SharpBettorDetail } from "@/lib/data-analysis/player-mod-task2-types";
import { DashHeader, DashPage } from "./AnalysisDashboard";
import {
  ReportHorizontalBars,
  ReportMarginByOverChart,
  ReportMatchWinsChart,
  ReportSelectionShareChart,
  ReportSharpRoiChart,
} from "./ReportCharts";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
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
          Player MoD in-play · Confidential
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </header>
      <div className="mt-5 space-y-5 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-slate-500">None flagged at volume threshold.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-slate-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function MiniTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          {headers.map((h) => (
            <th key={h} className="px-2 py-2 text-left font-semibold text-slate-700">
              {h}
            </th>
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

function BettorFocusBlock({
  slice,
  headline,
  detail,
}: {
  slice: BettorReportSlice;
  headline: string;
  detail?: SharpBettorDetail;
}) {
  const primary = slice.formats.find((f) => f.formatId === "t20") ?? slice.formats[0];
  const summary = primary?.summary;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-bold text-slate-900">
        Bettor {slice.bettorId} — {headline}
      </h3>
      {summary ? (
        <p className="mt-2 text-slate-700">
          <strong>T20:</strong> {summary.bets} bets · {fmtMoney(summary.stake)} staked ·{" "}
          <span className="font-semibold text-red-700">{fmtPct(summary.punterRoiPct)} punter ROI</span>{" "}
          ({fmtMoney(summary.punterPl)} punter P/L) · avg odds {summary.avgOdds.toFixed(2)}
        </p>
      ) : (
        <p className="mt-2 text-slate-600">Limited T20 sharp volume in extract.</p>
      )}
      {primary && (
        <>
          <p className="mt-2 text-slate-700"><strong>Pattern:</strong> {primary.patternNote}</p>
          <p className="mt-1 text-slate-700"><strong>Markets:</strong> {primary.topSelections}</p>
          <p className="mt-1 text-slate-700"><strong>Overs:</strong> {primary.topOvers}</p>
        </>
      )}

      {detail && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <ReportSelectionShareChart
            title="Stake share by selection"
            items={detail.bySelection.map((s) => ({
              selection: s.selection,
              sharePct: s.sharePct,
              roi: s.punterRoiPct,
            }))}
          />
          <ReportMarginByOverChart
            title="Punter ROI proxy — book margin by over"
            points={detail.chartByOver.map((o) => ({
              over: o.over,
              marginPct: o.bookMarginPct,
            }))}
            targetMargin={-15}
          />
          <div className="sm:col-span-2 print:col-span-2">
            <ReportMatchWinsChart
              title="Top winning matches (punter P/L)"
              matches={primary?.topMatches ?? []}
            />
          </div>
        </div>
      )}

      {primary && primary.topMatches.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 font-semibold text-slate-800">Biggest winning matches (punter P/L)</p>
          <MiniTable
            headers={["Date", "Match", "Bets", "Stake", "Punter P/L", "Main selection"]}
            rows={primary.topMatches.map((m) => [
              fmtDate(m.eventAt),
              m.eventName.length > 42 ? `${m.eventName.slice(0, 42)}…` : m.eventName,
              String(m.bets),
              fmtMoney(m.stake),
              fmtMoney(m.punterPl),
              m.topSelection,
            ])}
          />
        </div>
      )}

      {slice.formats.some((f) => f.formatId !== "t20" && f.summary) && (
        <p className="mt-3 text-xs text-slate-600">
          Also active:{" "}
          {slice.formats
            .filter((f) => f.formatId !== "t20" && f.summary)
            .map(
              (f) =>
                `${f.formatLabel} (${f.summary!.bets} bets, ${fmtPct(f.summary!.punterRoiPct)} ROI)`
            )
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

export function ModBettingReportsPanel() {
  const market = useMemo(() => buildMarketOverviewReport(), []);
  const sharps = useMemo(() => buildSharpBettorsReport(), []);
  const task1 = useMemo(() => getPlayerModTask1(), []);
  const task2 = useMemo(() => getPlayerModTask2(), []);

  const t20Market = task1.formats.find((f) => f.id === "t20");
  const t20Sharps = task2.formats.find((f) => f.id === "t20");
  const detail109 = t20Sharps?.sharpBettorDetails.find((d) => d.bettorId === 109);
  const detail143 = t20Sharps?.sharpBettorDetails.find((d) => d.bettorId === 143);
  const target = task1.targetMarginPct;

  const [saving, setSaving] = useState(false);

  const saveReports = useCallback(async () => {
    const root = document.getElementById("mod-betting-reports");
    if (!root) return;
    setSaving(true);
    try {
      await downloadReportsPdf(root);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const printReports = useCallback(() => {
    window.print();
  }, []);

  return (
    <DashPage>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #mod-betting-reports,
          #mod-betting-reports * {
            visibility: visible;
          }
          #mod-betting-reports {
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
          title="Export reports"
          subtitle="Two report pages — save as PDF or print."
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
          Save PDF downloads both reports with charts. Generation may take a few seconds.
        </p>
      </div>

      <div id="mod-betting-reports" className="space-y-0">
        <ReportSection
          title="Report 1 — Market performance overview"
          subtitle={`Jun–Sep 2026 · ${market.overall.bets.toLocaleString()} bets · ${fmtMoney(market.overall.stake)} staked · book margin ${fmtPct(market.overall.bookMarginPct)} (target ${target}%)`}
        >
          <div>
            <h3 className="font-semibold text-slate-900">Executive summary</h3>
            <p className="mt-1 text-slate-700">
              Player method-of-dismissal in-play markets are running below the {target}% efficiency
              target overall ({fmtPct(market.overall.bookMarginPct)} book margin on{" "}
              {fmtMoney(market.overall.stake)}). T20 is the dominant volume format and the primary
              focus for model tuning; ODI shows the weakest book margin in this window.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">T20 — key findings</h3>
            <p className="mt-1 text-slate-700">
              Book margin <strong>{fmtPct(market.t20Highlights.bookMarginPct)}</strong> vs {target}%
              target ({fmtPct(market.t20Highlights.bookMarginPct - target)} gap).{" "}
              {market.t20Highlights.flaggedUnderCount} selection×over cells flagged as significant
              underperformance; {market.t20Highlights.flaggedOverCount} overperforming.
            </p>
            {t20Market && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                <ReportHorizontalBars
                  title={`Book margin by format (vs ${target}% target)`}
                  items={task1.formats.map((f) => ({
                    label: f.label,
                    value: f.overall.marginPct,
                    color:
                      f.id === "t20"
                        ? "#2563eb"
                        : f.overall.marginPct < 0
                          ? "#dc2626"
                          : "#64748b",
                  }))}
                  valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                  targetLine={target}
                  targetLabel={`${target}%`}
                />
                <ReportHorizontalBars
                  title="T20 — book margin by selection"
                  items={t20Market.bySelection.map((s) => ({
                    label: s.selection,
                    value: s.marginPct ?? 0,
                    color: (s.marginPct ?? 0) < 0 ? "#dc2626" : (s.marginPct ?? 0) >= target ? "#059669" : "#d97706",
                  }))}
                  valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                  targetLine={target}
                  targetLabel={`${target}%`}
                />
                <div className="sm:col-span-2 print:col-span-2">
                  <ReportMarginByOverChart
                    title="T20 — book margin by over (all selections)"
                    points={t20Market.chartByOver.map((o) => ({
                      over: o.over,
                      marginPct: o.marginPct,
                    }))}
                    targetMargin={target}
                  />
                </div>
              </div>
            )}
            <p className="mt-4 font-medium text-slate-800">Priority underperformers (T20):</p>
            <BulletList items={market.t20Highlights.topUnderCells} />
            <p className="mt-3 font-medium text-slate-800">Overperforming pockets (T20):</p>
            <BulletList items={market.t20Highlights.topOverCells} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Other formats (summary)</h3>
            <MiniTable
              headers={["Format", "Bets", "Stake", "Book margin", `vs ${target}% target`, "Weakest selection"]}
              rows={market.formats
                .filter((f) => f.id !== "t20")
                .map((f) => [
                  f.label,
                  f.bets.toLocaleString(),
                  fmtMoney(f.stake),
                  fmtPct(f.bookMarginPct),
                  fmtPct(f.targetGapPp),
                  f.worstSelection ?? "—",
                ])}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Recommended actions</h3>
            <BulletList
              items={[
                "Review Fielder Catch pricing in T20 — largest stake share with negative margin.",
                "Investigate LBW / Bowled in powerplay overs (4–8) where flagged underperformance clusters.",
                "Stumped: strong early overs but material loss at high-volume middle/late overs — check over-specific tables.",
                "ODI format margin negative — treat as separate model path before over-level tweaks.",
              ]}
            />
          </div>
        </ReportSection>

        <ReportSection
          title="Report 2 — Sharp bettor intelligence"
          subtitle={`${sharps.universe.totalBettors.toLocaleString()} bettors · ${sharps.thresholds}`}
        >
          <div>
            <h3 className="font-semibold text-slate-900">T20 sharp-money overview</h3>
            <p className="mt-1 text-slate-700">
              {sharps.t20.sharpCount} qualified sharp bettors vs {sharps.t20.weakCount} weak
              (book-favourable). T20 book margin {fmtPct(sharps.t20.bookMarginPct)}.{" "}
              {sharps.t20.bigBetInsight}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <ReportSharpRoiChart
                title="Top T20 sharp bettors — punter ROI %"
                items={sharps.t20.topSharps.map((r) => ({
                  id: r.id,
                  roi: r.roi,
                  highlight: r.id === 109 || r.id === 143,
                }))}
              />
              {t20Sharps && (
                <ReportMarginByOverChart
                  title="T20 — sharp bettors vs others (book margin by over)"
                  points={t20Sharps.marginByOver.sharpBettors.map((o) => ({
                    over: o.over,
                    marginPct: o.bookMarginPct,
                  }))}
                  targetMargin={target}
                />
              )}
            </div>
            <div className="mt-3">
              <MiniTable
                headers={["Bettor ID", "Punter ROI", "Stake", "Bets"]}
                rows={sharps.t20.topSharps.map((r) => [
                  String(r.id),
                  fmtPct(r.roi),
                  fmtMoney(r.stake),
                  String(r.bets),
                ])}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Other formats</h3>
            <MiniTable
              headers={["Format", "Sharp bettors", "Book margin"]}
              rows={sharps.otherFormats.map((f) => [
                f.label,
                String(f.sharpCount),
                fmtPct(f.bookMarginPct),
              ])}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Focus: high-priority sharps</h3>
            <p className="mt-1 text-slate-700">
              Bettors <strong>109</strong> and <strong>143</strong> are among the highest-volume T20
              sharps. Both show concentrated selection preferences and repeatable wins on specific
              matches — not one-off lucky hits.
            </p>
          </div>

          <BettorFocusBlock
            slice={sharps.focus109}
            headline="Highest volume sharp — repeat cross-match winner"
            detail={detail109}
          />
          <BettorFocusBlock
            slice={sharps.focus143}
            headline="High-stake sharp — spikes on individual fixtures"
            detail={detail143}
          />

          <div>
            <h3 className="font-semibold text-slate-900">Model / trading implications</h3>
            <BulletList
              items={[
                "Cross-reference Task 1 underperforming selection×over cells with 109/143 bet history — overlapping cells are highest priority.",
                "109: large wins on Bangladesh v Sri Lanka, India v Pakistan — review MoD tables for those competition contexts.",
                "143: very large per-match wins (often 1–2 bets per fixture) — monitor stake spikes on Run Out / LBW late overs.",
                "When book loses big singles, check bettor lifetime ROI before attributing to model error vs sharp action.",
              ]}
            />
          </div>
        </ReportSection>
      </div>
    </DashPage>
  );
}
