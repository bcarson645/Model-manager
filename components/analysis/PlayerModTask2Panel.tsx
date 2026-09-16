"use client";

import { useState } from "react";
import { getPlayerModTask2 } from "@/lib/data-analysis/player-mod-task2";
import type { ModBettorFormatAnalysis } from "@/lib/data-analysis/player-mod-task2-types";
import {
  DashBadge,
  DashCard,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
  DashTable,
} from "./AnalysisDashboard";
import { PunterRoiByOverChart } from "./PunterRoiByOverChart";
import { SelectionShareChart } from "./SelectionShareChart";
import { SharpBettorDetailPanel } from "./SharpBettorDetailPanel";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function roiClass(n: number | null, invert = false): string {
  if (n == null) return "text-slate-400";
  const v = invert ? -n : n;
  if (v >= 12) return "text-red-400";
  if (v <= -12) return "text-emerald-400";
  return "text-slate-200";
}

function roiCell(value: number | null, key: string, invert = false) {
  return (
    <span key={key} className={roiClass(value, invert)}>
      {fmtPct(value)}
    </span>
  );
}

function FormatBettorPanel({
  format,
  selectedBettorId,
  onSelectBettor,
}: {
  format: ModBettorFormatAnalysis;
  selectedBettorId: number | null;
  onSelectBettor: (id: number | null) => void;
}) {
  const data = getPlayerModTask2();
  const t = data.thresholds;
  const selectedDetail =
    selectedBettorId != null
      ? format.sharpBettorDetails.find((d) => d.bettorId === selectedBettorId)
      : undefined;

  if (selectedDetail) {
    return (
      <SharpBettorDetailPanel
        detail={selectedDetail}
        formatLabel={format.label}
        targetBookMargin={t.targetBookMarginPct}
        onBack={() => onSelectBettor(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DashGrid>
        <DashStat span="quarter" label="Bettors" value={format.bettorUniverse.totalBettors.toLocaleString()} />
        <DashStat
          span="quarter"
          label="Sharp bettors"
          value={format.bettorUniverse.sharpBettors.toLocaleString()}
          hint={`≥${t.minBetsBettor} bets · ROI ≥${t.sharpPunterRoiPct}%`}
          valueClassName="text-red-300"
        />
        <DashStat
          span="quarter"
          label="Weak for book"
          value={format.bettorUniverse.weakBettors.toLocaleString()}
          hint={`Punter ROI ≤${t.weakPunterRoiPct}%`}
          valueClassName="text-emerald-300"
        />
        <DashStat
          span="quarter"
          label="Book margin"
          value={fmtPct(format.overall.bookMarginPct)}
          hint={`Target ${t.targetBookMarginPct}%`}
          valueClassName={roiClass(format.overall.bookMarginPct, true)}
        />
      </DashGrid>

      <DashCard
        title="Big bet attribution"
        description={`Bets ≥£${t.bigBetStake} — is the book loss a one-off or a sharp bettor?`}
      >
        <DashGrid>
          <DashStat
            span="quarter"
            label="Big bets"
            value={format.bigBetSummary.count.toLocaleString()}
          />
          <DashStat
            span="quarter"
            label="Book lost on"
            value={format.bigBetSummary.bookLostCount.toLocaleString()}
          />
          <DashStat
            span="quarter"
            label="Avg bettor ROI when book lost"
            value={fmtPct(format.bigBetSummary.avgBettorRoiWhenBookLost)}
            valueClassName={roiClass(format.bigBetSummary.avgBettorRoiWhenBookLost)}
          />
          <DashStat
            span="quarter"
            label="Book losses from sharps"
            value={fmtPct(format.bigBetSummary.pctBookLostFromSharps)}
            valueClassName="text-red-300"
          />
        </DashGrid>
        <div className="mt-4">
          <DashTable
            columns={[
              "Bettor",
              "Selection",
              "Over",
              "Stake",
              "Book P/L",
              "Lifetime ROI",
              "Bets",
              "Read",
            ]}
            rows={format.bigBetAttribution.map((r) => [
              String(r.bettorId),
              r.selection,
              String(r.over),
              fmtMoney(r.stake),
              <span key={`bp-${r.bettorId}-${r.over}`} className={r.bookLost ? "text-red-400" : "text-emerald-400"}>
                {fmtMoney(r.bookProfit)}
              </span>,
              roiCell(r.bettorLifetimeRoiPct, `lr-${r.bettorId}-${r.over}`),
              r.bettorLifetimeBets.toLocaleString(),
              r.interpretation,
            ])}
          />
        </div>
      </DashCard>

      <DashGrid>
        <DashCard span="half" title="Where sharps bet — punter ROI by over">
          <PunterRoiByOverChart
            series={[
              {
                label: "Sharp bettors",
                color: "#f87171",
                points: format.marginByOver.sharpBettors,
              },
              {
                label: "Everyone else",
                color: "#64748b",
                points: format.marginByOver.otherBettors,
              },
            ]}
          />
        </DashCard>
        <DashCard span="half" title="Selection preference — sharps vs others">
          <SelectionShareChart
            sharp={format.sharpPreferences.sharp}
            others={format.sharpPreferences.others}
          />
        </DashCard>
      </DashGrid>

      <DashGrid>
        <DashCard
          span="half"
          title="Top sharp bettors (qualified volume)"
          description="Click a row for full market breakdown and bet history."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-slate-500">
                  {["ID", "Bets", "Stake", "Punter P/L", "Punter ROI", "Avg odds", ""].map(
                    (col) => (
                      <th key={col || "action"} className="whitespace-nowrap px-2 py-2 font-medium first:pl-0">
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {format.topSharpBettors.map((r) => (
                  <tr
                    key={r.bettorId}
                    className="cursor-pointer border-b border-surface-border/60 text-slate-300 transition hover:bg-emerald-500/10"
                    onClick={() => onSelectBettor(r.bettorId)}
                  >
                    <td className="whitespace-nowrap px-2 py-2 font-mono text-emerald-300 first:pl-0">
                      {r.bettorId}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">{r.bets.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-2 py-2">{fmtMoney(r.stake)}</td>
                    <td className="whitespace-nowrap px-2 py-2">{fmtMoney(r.punterPl)}</td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {roiCell(r.punterRoiPct, `sharp-${r.bettorId}`)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">{r.avgOdds.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-slate-500">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashCard>
        <DashCard span="half" title="Best book customers (weak punters)">
          <DashTable
            columns={["ID", "Bets", "Stake", "Book profit", "Book margin", "Avg odds"]}
            rows={format.topWeakBettors.map((r) => [
              String(r.bettorId),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              fmtMoney(r.bookProfit),
              roiCell(r.bookMarginPct, `weak-${r.bettorId}`, true),
              r.avgOdds.toFixed(2),
            ])}
          />
        </DashCard>
      </DashGrid>

      <DashGrid>
        <DashCard
          span="half"
          title="Sharp winning hotspots (selection × over)"
          description="Where qualified sharps cluster and beat the book."
        >
          <DashTable
            columns={["Selection", "Over", "Bets", "Stake", "Punter ROI"]}
            rows={format.sharpHotspots.map((r) => [
              r.selection,
              String(r.over),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              roiCell(r.punterRoiPct, `hot-${r.selection}-${r.over}`),
            ])}
          />
        </DashCard>
        <DashCard
          span="half"
          title="Quick sharp snapshots"
          description="Click any bettor in the table for the full breakdown."
        >
          <div className="space-y-2">
            {format.sharpBettorDetails.slice(0, 6).map((p) => (
              <button
                key={p.bettorId}
                type="button"
                onClick={() => onSelectBettor(p.bettorId)}
                className="w-full rounded-lg border border-surface-border bg-surface/40 p-3 text-left transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                <p className="text-sm font-medium text-white">
                  Bettor {p.bettorId}{" "}
                  <span className={roiClass(p.summary.punterRoiPct)}>
                    {fmtPct(p.summary.punterRoiPct)} ROI
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {p.summary.bets} bets · {fmtMoney(p.summary.stake)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Favours:{" "}
                  {p.bySelection
                    .slice(0, 3)
                    .map((s) => `${s.selection} (${s.sharePct.toFixed(0)}%)`)
                    .join(", ")}
                </p>
              </button>
            ))}
          </div>
        </DashCard>
      </DashGrid>

      <DashCard title="Book margin by over — all bettors (sanity check vs Task 1)">
        <DashTable
          columns={["Over", "Bets", "Bettors", "Stake", "Book margin", "Punter ROI"]}
          rows={format.marginByOver.allBettors.map((r) => [
            String(r.over),
            r.bets.toLocaleString(),
            r.bettors.toLocaleString(),
            fmtMoney(r.stake),
            roiCell(r.bookMarginPct, `bm-${r.over}`, true),
            roiCell(r.punterRoiPct, `pr-${r.over}`),
          ])}
        />
      </DashCard>
    </div>
  );
}

export function PlayerModTask2Panel() {
  const data = getPlayerModTask2();
  const [activeFormatId, setActiveFormatId] = useState(data.formats[0]?.id ?? "t20");
  const [selectedBettorId, setSelectedBettorId] = useState<number | null>(null);
  const activeFormat = data.formats.find((f) => f.id === activeFormatId) ?? data.formats[0];

  return (
    <DashPage>
      <DashHeader
        title="Data tasks · Task 2 — Bettor sharp-money analysis"
        badge={<DashBadge>{data.overall.totalBettors.toLocaleString()} bettors</DashBadge>}
        subtitle={
          <>
            {data.sourceFile} · {data.overall.bets.toLocaleString()} bets · identifies bettors who
            consistently win and where they bet
          </>
        }
      />

      <DashCard compact>
        <p className="text-sm text-slate-400">
          Bettor ID = <code className="text-emerald-400/90">cusid</code>. Sharp = ≥
          {data.thresholds.minBetsBettor} bets, ≥£
          {data.thresholds.minStakeBettor.toLocaleString()} stake, punter ROI ≥
          {data.thresholds.sharpPunterRoiPct}%. Positive punter ROI = bettor beating the book.
          Re-run{" "}
          <code className="text-emerald-400/90">python scripts/analyze-player-mod-bettors.py</code>
        </p>
      </DashCard>

      <div className="flex flex-wrap gap-2">
        {data.formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setActiveFormatId(f.id);
              setSelectedBettorId(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeFormatId === f.id
                ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-surface-raised text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
            <span className="ml-2 text-xs opacity-70">
              {f.bettorUniverse.sharpBettors} sharps
            </span>
          </button>
        ))}
      </div>

      {activeFormat && (
        <FormatBettorPanel
          format={activeFormat}
          selectedBettorId={selectedBettorId}
          onSelectBettor={setSelectedBettorId}
        />
      )}
    </DashPage>
  );
}
