"use client";

import type { SharpBettorDetail } from "@/lib/data-analysis/player-mod-task2-types";
import { DashCard, DashGrid, DashStat, DashTable } from "./AnalysisDashboard";
import { MarginByOverChart } from "./MarginByOverChart";
import { PunterRoiByOverChart } from "./PunterRoiByOverChart";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
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

type SharpBettorDetailPanelProps = {
  detail: SharpBettorDetail;
  formatLabel: string;
  targetBookMargin: number;
  onBack: () => void;
};

export function SharpBettorDetailPanel({
  detail,
  formatLabel,
  targetBookMargin,
  onBack,
}: SharpBettorDetailPanelProps) {
  const s = detail.summary;
  const marginByOver = detail.chartByOver.map((r) => ({
    over: r.over,
    bets: r.bets,
    stake: r.stake,
    profit: r.bookProfit,
    marginPct: r.bookMarginPct,
    marginGap: r.bookMarginPct != null ? r.bookMarginPct - targetBookMargin : null,
    avgStake: r.stake / r.bets,
    avgOdds: 0,
    flag: null,
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
          Bettor <span className="font-mono text-white">{detail.bettorId}</span> · {formatLabel}
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

      <DashGrid>
        <DashCard span="half" title="Returns by over">
          <PunterRoiByOverChart
            series={[{ label: "This bettor", color: "#f87171", points: detail.chartByOver }]}
            title="Punter ROI % by over"
          />
        </DashCard>
        <DashCard span="half" title="Book margin by over (this bettor)">
          <MarginByOverChart
            points={marginByOver}
            targetMargin={targetBookMargin}
            title="Book margin % by over"
          />
        </DashCard>
      </DashGrid>

      <DashCard title="Preferred markets (selection)">
        <DashTable
          columns={["Selection", "Bets", "Stake", "Share", "Punter P/L", "Punter ROI", "Avg stake"]}
          rows={detail.bySelection.map((r) => [
            r.selection,
            r.bets.toLocaleString(),
            fmtMoney(r.stake),
            `${r.sharePct.toFixed(1)}%`,
            fmtMoney(r.punterPl),
            roiCell(r.punterRoiPct, `sel-${r.selection}`),
            r.bets > 0 ? fmtMoney(r.stake / r.bets) : "—",
          ])}
        />
      </DashCard>

      <DashGrid>
        <DashCard span="half" title="Selection × over breakdown">
          <DashTable
            columns={["Selection", "Over", "Bets", "Stake", "Punter ROI"]}
            rows={detail.bySelectionOver.slice(0, 40).map((r) => [
              r.selection,
              String(r.over),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              roiCell(r.punterRoiPct, `so-${r.selection}-${r.over}`),
            ])}
          />
          {detail.bySelectionOver.length > 40 && (
            <p className="mt-2 text-xs text-slate-500">
              Showing top 40 of {detail.bySelectionOver.length} selection/over cells by stake.
            </p>
          )}
        </DashCard>
        <DashCard span="half" title="By innings">
          <DashTable
            columns={["Innings", "Bets", "Stake", "Punter ROI", "Punter P/L"]}
            rows={detail.byInnings.map((r) => [
              String(r.innings),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              roiCell(r.punterRoiPct, `inn-${r.innings}`),
              fmtMoney(r.punterPl),
            ])}
          />
        </DashCard>
      </DashGrid>

      <DashCard
        title="Full bet history"
        description={`${detail.bets.length} bets in this format — newest first.`}
      >
        <DashTable
          columns={[
            "When",
            "Match",
            "Selection",
            "Over",
            "Inns",
            "Odds",
            "Stake",
            "Punter P/L",
          ]}
          rows={detail.bets.map((b, i) => [
            b.eventAt ? new Date(b.eventAt).toLocaleDateString() : "—",
            b.eventName ?? "—",
            b.selection,
            String(b.over),
            b.innings != null ? String(b.innings) : "—",
            b.odds.toFixed(2),
            fmtMoney(b.stake),
            <span
              key={`bet-pl-${i}`}
              className={b.punterPl >= 0 ? "text-red-400" : "text-emerald-400"}
            >
              {fmtMoney(b.punterPl)}
            </span>,
          ])}
        />
      </DashCard>
    </div>
  );
}
