"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { downloadReportsPdf } from "@/lib/data-analysis/export-report-pdf";
import { getPlayerModPart2 } from "@/lib/data-analysis/player-mod-part2";
import {
  buildPart2BettorReport,
  buildPart2OverviewReport,
  type Part2BettorCrossFormat,
  type Part2FormatSlice,
} from "@/lib/data-analysis/part2-reports";
import { DashHeader, DashPage } from "./AnalysisDashboard";
import {
  ReportHorizontalBars,
  ReportMatchWinsChart,
  ReportPhaseCompareChart,
  ReportPhaseMarginChart,
  ReportSelectionShareChart,
  ReportSharpRoiChart,
} from "./ReportCharts";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
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
    <section className="report-page mb-8 rounded-xl border border-surface-border bg-white text-slate-900 shadow-sm print:mb-0 print:rounded-none print:border-0 print:shadow-none">
      <header className="border-b border-slate-200 pb-4 print:pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
          Player MoD in-play · Part 2 · Confidential
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
  segmentId,
  showTitle = true,
}: {
  slice: Part2BettorCrossFormat;
  headline: string;
  segmentId?: string;
  showTitle?: boolean;
}) {
  const activeFormats = slice.formats.filter((f) => f.summary);
  const primary =
    (segmentId
      ? slice.formats.find((f) => f.summary && f.formatLabel.toLowerCase().includes("t20"))
      : activeFormats[0]) ?? activeFormats[0];
  const data = useMemo(() => getPlayerModPart2(), []);
  const seg = segmentId
    ? data.segments.find((s) => s.id === segmentId)
    : data.segments.find((s) => s.label === primary?.formatLabel);
  const detail = seg?.sharpAnalysis.sharpBettorDetails.find(
    (d) => d.bettorId === slice.bettorId
  );
  const t20Detail =
    detail ??
    data.segments
      .flatMap((s) => s.sharpAnalysis.sharpBettorDetails)
      .find((d) => d.bettorId === slice.bettorId);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      {showTitle && (
        <h3 className="text-base font-bold text-slate-900">
          Bettor {slice.bettorId} — {headline}
        </h3>
      )}

      {activeFormats.length > 0 ? (
        <p className="mt-2 text-slate-700">
          Active in{" "}
          {activeFormats
            .map(
              (f) =>
                `${f.formatLabel} (${f.summary!.bets} bets, ${fmtPct(f.summary!.punterRoiPct)} ROI)`
            )
            .join(" · ")}
        </p>
      ) : (
        <p className="mt-2 text-slate-600">No qualified sharp volume in extract.</p>
      )}

      {primary && (
        <>
          <p className="mt-2 text-slate-700"><strong>Pattern:</strong> {primary.patternNote}</p>
          <p className="mt-1 text-slate-700"><strong>Selections:</strong> {primary.topSelections}</p>
          {primary.topPhases !== "—" && (
            <p className="mt-1 text-slate-700"><strong>Phases:</strong> {primary.topPhases}</p>
          )}
        </>
      )}

      {t20Detail && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <ReportSelectionShareChart
            title="Stake share by selection"
            items={t20Detail.bySelection.map((s) => ({
              selection: s.selection,
              sharePct: s.sharePct,
              roi: s.punterRoiPct,
            }))}
          />
          {t20Detail.chartByPhase.length > 0 && (
            <ReportPhaseMarginChart
              title="Punter ROI by innings phase"
              points={t20Detail.chartByPhase.map((p) => ({
                label: p.label.replace(/Phase \d+ /, "P"),
                marginPct: p.punterRoiPct ?? null,
              }))}
              targetMargin={12}
            />
          )}
          {t20Detail.topMatches.length > 0 && (
            <div className="sm:col-span-2 print:col-span-2">
              <ReportMatchWinsChart
                title="Top winning matches (punter P/L)"
                matches={t20Detail.topMatches.map((m) => ({
                  eventName: m.eventName,
                  punterPl: m.punterPl,
                  eventAt: m.eventAt,
                }))}
              />
            </div>
          )}
        </div>
      )}

      {primary && primary.topMatches.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 font-semibold text-slate-800">Biggest winning matches</p>
          <BulletList items={primary.topMatches} />
        </div>
      )}
    </div>
  );
}

function FormatSection({ format, target }: { format: Part2FormatSlice; target: number }) {
  const data = useMemo(() => getPlayerModPart2(), []);
  const segment = data.segments.find((s) => s.id === format.id);
  const phaseCompare = segment?.sharpAnalysis.marginByPhase ?? [];

  const marginsPage = (
    <>
      {format.insights.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">Segment insights</h3>
          <BulletList items={format.insights} />
        </div>
      )}

      <ReportHorizontalBars
        title="Book margin by selection"
        items={format.selectionMargins.map((s) => ({
          label: s.label,
          value: s.value,
          color: s.value < 0 ? "#dc2626" : s.value >= target ? "#059669" : "#d97706",
        }))}
        valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
        targetLine={target}
        targetLabel={`${target}%`}
      />

      {format.hasPhases && format.phaseMargins.length > 0 && (
        <ReportPhaseMarginChart
          title="Book margin by innings phase"
          points={format.phaseMargins}
          targetMargin={target}
          showTable
        />
      )}

      {format.negativeSelections.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">Negative-margin selections</h3>
          <p className="mt-1 text-slate-700">{format.negativeSelections.join(", ")}</p>
        </div>
      )}
    </>
  );

  const sharpsPage = (
    <>
      {format.hasPhases && phaseCompare.length > 0 && (
        <ReportPhaseCompareChart
          title="Book margin by phase — all vs sharps vs others"
          points={phaseCompare.map((p) => ({
            label: p.label.replace(/Phase \d+ /, "P"),
            allMarginPct: p.allMarginPct,
            sharpMarginPct: p.sharpMarginPct,
            otherMarginPct: p.otherMarginPct,
          }))}
          targetMargin={target}
        />
      )}

      {format.topSharps.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">Sharp bettors</h3>
          <div className="mt-3 space-y-4">
            <ReportSharpRoiChart
              title="Top sharp bettors — punter ROI %"
              items={format.topSharps.map((r) => ({
                id: r.id,
                roi: r.roi,
                highlight: r.id === 109 || r.id === 143,
              }))}
            />
            <MiniTable
              headers={["Bettor", "ROI", "Stake", "Bets"]}
              rows={format.topSharps.map((r) => [
                String(r.id),
                fmtPct(r.roi),
                fmtMoney(r.stake),
                String(r.bets),
              ])}
            />
          </div>
        </div>
      )}

      {format.sharpWeakCells.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900">Sharp weak cells (negative book margin)</h3>
          <BulletList items={format.sharpWeakCells} />
        </div>
      )}

      {format.bigBetSharpSharePct != null && format.bigBetSharpSharePct > 0 && (
        <p className="text-slate-700">
          Large losing bets: <strong>{format.bigBetSharpSharePct.toFixed(0)}%</strong> attributed to
          sharp bettors.
        </p>
      )}
    </>
  );

  const subtitle = `${format.bets.toLocaleString()} bets · ${fmtMoney(format.stake)} staked · book margin ${fmtPct(format.bookMarginPct)} (target ${target}%) · ${format.sharpCount} sharps`;

  if (format.hasPhases) {
    return (
      <>
        <ReportSection title={`${format.label} — margins & phases`} subtitle={subtitle}>
          {marginsPage}
        </ReportSection>
        <ReportSection title={`${format.label} — sharp analysis`} subtitle={subtitle}>
          {sharpsPage}
        </ReportSection>
      </>
    );
  }

  return (
    <ReportSection title={`${format.label} — format deep dive`} subtitle={subtitle}>
      {marginsPage}
      {sharpsPage}
    </ReportSection>
  );
}

export function Part2BettingReport() {
  const overview = useMemo(() => buildPart2OverviewReport(), []);
  const focus109 = useMemo(() => buildPart2BettorReport(109), []);
  const focus143 = useMemo(() => buildPart2BettorReport(143), []);
  const target = overview.target;

  const [saving, setSaving] = useState(false);

  const saveReports = useCallback(async () => {
    const root = document.getElementById("part2-betting-reports");
    if (!root) return;
    setSaving(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadReportsPdf(root, `player-mod-part2-reports-${date}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const printReports = useCallback(() => {
    window.print();
  }, []);

  const totalSharps = overview.formats.reduce((sum, f) => sum + f.sharpCount, 0);

  return (
    <DashPage>
      <style jsx global>{`
        #part2-betting-reports .report-page {
          width: 210mm;
          max-width: 210mm;
          box-sizing: border-box;
          padding: 10mm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #part2-betting-reports,
          #part2-betting-reports * {
            visibility: visible;
          }
          #part2-betting-reports {
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
          title="Part 2 export reports"
          subtitle="Multi-page A4 export — overview, sharps, and per-format deep dives."
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

      <div id="part2-betting-reports" className="space-y-0">
        <ReportSection
          title="Report 1 — Cross-format overview"
          subtitle={`${overview.sourceFile} · ${overview.overall.bets.toLocaleString()} bets · ${fmtMoney(overview.overall.stake)} staked · book margin ${fmtPct(overview.overall.bookMarginPct)} (target ${target}%)`}
        >
          <ConclusionBox items={overview.keyConclusions} />

          <div>
            <h3 className="font-semibold text-slate-900">Executive summary</h3>
            <p className="mt-1 text-slate-700">
              Part 2 splits Player MoD in-play by gender and format (men&apos;s/women&apos;s × T20,
              ODI, men&apos;s FC) with innings-phase breakdowns. Overall margin is near breakeven
              ({fmtPct(overview.overall.bookMarginPct)}) vs a {target}% target — performance is
              highly format-dependent. Women&apos;s 50-over is the weakest segment; men&apos;s T20
              is the only segment above target.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <ReportHorizontalBars
              title={`Book margin by format (vs ${target}% target)`}
              items={overview.formats.map((f) => ({
                label: f.label,
                value: f.bookMarginPct ?? 0,
                color:
                  f.bookMarginPct != null && f.bookMarginPct < 0
                    ? "#dc2626"
                    : f.bookMarginPct != null && f.bookMarginPct >= target
                      ? "#059669"
                      : "#d97706",
              }))}
              valueFmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
              targetLine={target}
              targetLabel={`${target}%`}
            />
            <ReportHorizontalBars
              title="Sharp bettor count by format"
              items={overview.formats.map((f) => ({
                label: f.label,
                value: f.sharpCount,
                color: f.sharpCount >= 10 ? "#dc2626" : "#64748b",
              }))}
              valueFmt={(v) => String(v)}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Format comparison</h3>
            <MiniTable
              headers={["Segment", "Bets", "Stake", "Book margin", `vs ${target}%`, "Sharps", "Worst selection"]}
              rows={overview.formats.map((f) => [
                f.label,
                f.bets.toLocaleString(),
                fmtMoney(f.stake),
                fmtPct(f.bookMarginPct),
                f.targetGapPp != null ? `${f.targetGapPp > 0 ? "+" : ""}${f.targetGapPp.toFixed(1)}pp` : "—",
                String(f.sharpCount),
                f.worstSelection ?? "—",
              ])}
            />
          </div>
        </ReportSection>

        <ReportSection
          title="Report 2 — Sharp bettor intelligence"
          subtitle={`${overview.thresholds} · ${totalSharps} qualified sharps across segments`}
        >
          <div>
            <h3 className="font-semibold text-slate-900">Sharp-money overview</h3>
            <p className="mt-1 text-slate-700">
              Sharp bettors (punter ROI ≥12%, min volume) are concentrated in men&apos;s T20 and
              men&apos;s ODI. Bettors <strong>109</strong> and <strong>143</strong> are the
              highest-priority accounts — they appear across multiple formats with punter ROI
              30–128% and concentrated selection/phase preferences. Women&apos;s T20 shows extreme
              sharp ROI on bettors 109 and 143 specifically.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            {overview.formats
              .filter((f) => f.topSharps.length > 0)
              .slice(0, 2)
              .map((f) => (
                <ReportSharpRoiChart
                  key={f.id}
                  title={`${f.label} — top sharps`}
                  items={f.topSharps.slice(0, 6).map((r) => ({
                    id: r.id,
                    roi: r.roi,
                    highlight: r.id === 109 || r.id === 143,
                  }))}
                />
              ))}
          </div>

          <MiniTable
            headers={["Format", "Sharps", "Qualified", "Big-bet sharp share"]}
            rows={overview.formats.map((f) => [
              f.label,
              String(f.sharpCount),
              String(f.qualifiedBettors),
              f.bigBetSharpSharePct != null && f.bigBetSharpSharePct > 0
                ? `${f.bigBetSharpSharePct.toFixed(0)}%`
                : "—",
            ])}
          />

          <div>
            <h3 className="font-semibold text-slate-900">Focus: high-priority sharps</h3>
            <p className="mt-1 text-slate-700">
              Bettors <strong>109</strong> and <strong>143</strong> are the highest-priority accounts
              across formats — concentrated selection preferences and repeatable wins on specific
              fixtures. Detail for each bettor follows on the next pages.
            </p>
          </div>
        </ReportSection>

        <ReportSection
          title="Report 2 — Bettor 109"
          subtitle="Highest volume sharp — repeat cross-format winner"
        >
          <BettorFocusBlock
            slice={focus109}
            headline="Highest volume sharp — repeat cross-format winner"
            segmentId="men-t20"
            showTitle={false}
          />
        </ReportSection>

        <ReportSection
          title="Report 2 — Bettor 143"
          subtitle="High-stake sharp — spikes on individual fixtures"
        >
          <BettorFocusBlock
            slice={focus143}
            headline="High-stake sharp — spikes on individual fixtures"
            segmentId="men-t20"
            showTitle={false}
          />
        </ReportSection>

        <ReportSection
          title="Report 2 — Trading implications"
          subtitle="Model and pricing actions from sharp-money analysis"
        >
          <BulletList
            items={[
              "Women's ODI (-11.6% margin) needs separate model path — all major selections negative.",
              "Fielder Catch underperforms in every women's segment and men's ODI — review ufoid pricing tables.",
              "109: active in Men's T20, Men's ODI, Women's T20 — cross-format sharp with late-phase preference.",
              "143: similar cross-format profile — monitor stake spikes on Run Out / LBW in middle/late phases.",
              "Phase 5–6 (T20 Ov 13–20) and Phase 4–5 (ODI Ov 31–50) show sharps beating book margin.",
            ]}
          />
        </ReportSection>

        {overview.formats.map((format) => (
          <FormatSection key={format.id} format={format} target={target} />
        ))}
      </div>
    </DashPage>
  );
}
