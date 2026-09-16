"use client";

import type { Part2SharpBettorDetail } from "@/lib/data-analysis/player-mod-part2-types";
import { DashCard, DashGrid, DashStat, DashTable } from "./AnalysisDashboard";
import { PhaseMarginChart } from "./PhaseMarginChart";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function roiClass(n: number | null): string {
  if (n == null) return "text-slate-400";
  if (n >= 12) return "text-red-400";
  if (n <= -12) return "text-emerald-400";
  return "text-slate-200";
}

function roiCell(value: number | null, key: string) {
  return (
    <span key={key} className={roiClass(value)}>
      {fmtPct(value)}
    </span>
  );
}

type Part2SharpBettorDetailPanelProps = {
  detail: Part2SharpBettorDetail;
  segmentLabel: string;
  targetBookMargin: number;
  hasPhases: boolean;
  onBack: () => void;
};

export function Part2SharpBettorDetailPanel({
  detail,
  segmentLabel,
  targetBookMargin,
  hasPhases,
  onBack,
}: Part2SharpBettorDetailPanelProps) {
  const s = detail.summary;

  const phaseRoiPoints = detail.chartByPhase.map((p) => ({
    ...p,
    marginPct: p.punterRoiPct ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-slate-300 hover:bg-surface-raised hover:text-white"
        >
          ← Back to sharp list
        </button>
        <p className="text-sm text-slate-400">
          Bettor <span className="font-mono text-white">{detail.bettorId}</span> · {segmentLabel}
        </p>
      </div>

      <DashGrid>
        <DashStat span="quarter" label="Bets" value={s.bets.toLocaleString()} />
        <DashStat span="quarter" label="Stake" value={fmtMoney(s.stake)} />
        <DashStat
          span="quarter"
          label="Punter P/L"
          value={fmtMoney(s.punterPl)}
          valueClassName={roiClass(s.punterRoiPct)}
        />
        <DashStat
          span="quarter"
          label="Punter ROI"
          value={fmtPct(s.punterRoiPct)}
          hint={`Avg odds ${s.avgOdds.toFixed(2)}`}
          valueClassName={roiClass(s.punterRoiPct)}
        />
      </DashGrid>

      {(detail.bestSelections.length > 0 || detail.bestPhases.length > 0) && (
        <DashCard title="Where they performed best" description="Highest punter ROI in this segment">
          <div className="grid gap-4 sm:grid-cols-2">
            {detail.bestSelections.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Top selections</p>
                <ul className="space-y-1 text-sm text-slate-200">
                  {detail.bestSelections.map((sel) => (
                    <li key={sel.selection}>
                      <strong>{sel.selection}</strong> — {fmtPct(sel.punterRoiPct)} ROI ·{" "}
                      {fmtMoney(sel.punterPl)} on {fmtMoney(sel.stake)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasPhases && detail.bestPhases.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Top innings phases</p>
                <ul className="space-y-1 text-sm text-slate-200">
                  {detail.bestPhases.map((p) => (
                    <li key={p.phaseId}>
                      <strong>{p.label}</strong> — {fmtPct(p.punterRoiPct)} ROI ·{" "}
                      {fmtMoney(p.punterPl)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DashCard>
      )}

      {hasPhases && detail.chartByPhase.length > 0 && (
        <DashGrid>
          <DashCard span="half" title="Punter ROI by innings phase">
            <PhaseMarginChart
              title="Punter ROI % through match phases"
              points={phaseRoiPoints}
              targetMargin={12}
            />
          </DashCard>
          <DashCard span="half" title="Book margin by phase (this bettor)">
            <PhaseMarginChart
              title="Book margin % by phase"
              points={detail.chartByPhase}
              targetMargin={targetBookMargin}
            />
          </DashCard>
        </DashGrid>
      )}

      <DashCard title="Preferred selections">
        <DashTable
          columns={["Selection", "Bets", "Stake", "Share", "Punter P/L", "Punter ROI"]}
          rows={detail.bySelection.map((r) => [
            r.selection,
            r.bets.toLocaleString(),
            fmtMoney(r.stake),
            `${r.sharePct.toFixed(1)}%`,
            fmtMoney(r.punterPl),
            roiCell(r.punterRoiPct, `sel-${r.selection}`),
          ])}
        />
      </DashCard>

      {detail.topMatches.length > 0 && (
        <DashCard title="Biggest winning matches" description="Grouped by fixture — punter P/L">
          <DashTable
            columns={["Date", "Match", "Bets", "Stake", "Punter P/L", "ROI", "Main selection"]}
            rows={detail.topMatches.map((m) => [
              fmtDate(m.eventAt),
              m.eventName.length > 48 ? `${m.eventName.slice(0, 48)}…` : m.eventName,
              m.bets.toLocaleString(),
              fmtMoney(m.stake),
              <span key={`mpl-${m.eventName}`} className="text-red-400">{fmtMoney(m.punterPl)}</span>,
              roiCell(m.punterRoiPct, `mroi-${m.eventName}`),
              m.topSelection,
            ])}
          />
        </DashCard>
      )}

      <DashGrid>
        {hasPhases && detail.bySelectionPhase.length > 0 && (
          <DashCard span="half" title="Selection × phase breakdown">
            <DashTable
              columns={["Selection", "Phase", "Bets", "Stake", "Punter ROI"]}
              rows={detail.bySelectionPhase.slice(0, 40).map((r) => [
                r.selection,
                r.phaseLabel,
                r.bets.toLocaleString(),
                fmtMoney(r.stake),
                roiCell(r.punterRoiPct, `sp-${r.selection}-${r.phase}`),
              ])}
            />
            {detail.bySelectionPhase.length > 40 && (
              <p className="mt-2 text-xs text-slate-500">
                Showing top 40 of {detail.bySelectionPhase.length} cells by stake.
              </p>
            )}
          </DashCard>
        )}
        {hasPhases && detail.byPhase.length > 0 && (
          <DashCard span="half" title="By innings phase">
            <DashTable
              columns={["Phase", "Overs", "Bets", "Stake", "Punter ROI", "Punter P/L"]}
              rows={detail.byPhase.map((r) => [
                r.label,
                r.overRange,
                r.bets.toLocaleString(),
                fmtMoney(r.stake),
                roiCell(r.punterRoiPct ?? null, `ph-${r.phaseId}`),
                fmtMoney(r.punterPl ?? -r.bookProfit),
              ])}
            />
          </DashCard>
        )}
      </DashGrid>

      <DashCard
        title="Full bet history"
        description={`${detail.bets.length} bets in this segment — newest first`}
      >
        <DashTable
          columns={["When", "Match", "Selection", "Over", "Phase", "Odds", "Stake", "Punter P/L"]}
          rows={detail.bets.map((b, i) => [
            fmtDate(b.eventAt),
            b.eventName ?? "—",
            b.selection,
            String(b.over),
            b.phaseLabel ?? "—",
            b.odds.toFixed(2),
            fmtMoney(b.stake),
            <span key={`bet-${i}`} className={b.punterPl >= 0 ? "text-red-400" : "text-emerald-400"}>
              {fmtMoney(b.punterPl)}
            </span>,
          ])}
        />
      </DashCard>
    </div>
  );
}
