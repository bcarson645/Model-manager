"use client";

import { useMemo, useState } from "react";
import { getPlayerModTask1 } from "@/lib/data-analysis/player-mod-task1";
import type { ModFormatAnalysis, ModSelectionOverRow } from "@/lib/data-analysis/player-mod-types";
import {
  DashBadge,
  DashCard,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
  DashTable,
} from "./AnalysisDashboard";
import { MarginByOverChart } from "./MarginByOverChart";
import { StakeByOverChart } from "./StakeByOverChart";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

function marginClass(m: number | null, flag: string | null): string {
  if (flag === "under") return "text-red-400";
  if (flag === "over") return "text-emerald-400";
  if (m == null) return "text-slate-400";
  if (m < 5) return "text-red-300";
  if (m > 25) return "text-emerald-300";
  return "text-slate-200";
}

function marginCell(value: number | null, flag: string | null, key: string) {
  return (
    <span key={key} className={marginClass(value, flag)}>
      {fmtPct(value)}
    </span>
  );
}

function gapCell(value: number | null, flag: string | null, key: string) {
  return (
    <span key={key} className={marginClass(value, flag)}>
      {value != null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}pp` : "—"}
    </span>
  );
}

function FlaggedTable({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: ModSelectionOverRow[];
  tone: "under" | "over";
}) {
  return (
    <DashCard title={title} description={`≥6pp from target · min £2.5k stake & 25 bets`}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No significant {tone}performance cells in this format.</p>
      ) : (
        <DashTable
          columns={["Selection", "Over", "Bets", "Stake", "Profit", "Margin", "Gap vs target"]}
          rows={rows.map((r) => {
            const key = `${r.selection}-${r.over}`;
            return [
              r.selection,
              String(r.over),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              fmtMoney(r.profit),
              marginCell(r.marginPct, r.flag, `${key}-m`),
              gapCell(r.marginGap, r.flag, `${key}-g`),
            ];
          })}
        />
      )}
    </DashCard>
  );
}

function FormatPanel({ format }: { format: ModFormatAnalysis }) {
  const [selection, setSelection] = useState<string>("all");
  const target = getPlayerModTask1().targetMarginPct;
  const overallAvgStake = format.overall.stake / format.overall.bets;

  const selectionOverRows = useMemo(() => {
    if (selection === "all") return [];
    return format.bySelectionOver
      .filter((r) => r.selection === selection && r.over <= format.chartMaxOver)
      .sort((a, b) => a.over - b.over);
  }, [format, selection]);

  return (
    <div className="space-y-4">
      <DashGrid>
        <DashStat
          span="quarter"
          label="Bets"
          value={format.overall.bets.toLocaleString()}
        />
        <DashStat span="quarter" label="Stake" value={fmtMoney(format.overall.stake)} />
        <DashStat span="quarter" label="Profit" value={fmtMoney(format.overall.profit)} />
        <DashStat
          span="quarter"
          label="Margin"
          value={fmtPct(format.overall.marginPct)}
          hint={`Target ${target}%`}
          valueClassName={marginClass(format.overall.marginPct, null)}
        />
      </DashGrid>

      <DashGrid>
        <DashCard span="half" title="Margin by over — all selections combined">
          <MarginByOverChart
            points={format.chartByOver}
            targetMargin={target}
            maxOver={format.chartMaxOver}
          />
        </DashCard>
        <DashCard span="half" title="Stake concentration by over">
          <StakeByOverChart
            points={format.stakeProfileByOver}
            overallAvgStake={overallAvgStake}
          />
        </DashCard>
      </DashGrid>

      <DashGrid>
        <FlaggedTable
          title="Significant underperformance (selection × over)"
          rows={format.flaggedUnder}
          tone="under"
        />
        <FlaggedTable
          title="Significant overperformance (selection × over)"
          rows={format.flaggedOver}
          tone="over"
        />
      </DashGrid>

      <DashCard
        title="Summary by over (all selections)"
        description="Combined P/L for every selection at each over in the innings."
      >
        <DashTable
          columns={["Over", "Bets", "Stake", "Profit", "Margin", "Gap vs target", "Avg stake"]}
          rows={format.byOverSummary
            .filter((r) => r.over <= format.chartMaxOver)
            .map((r) => [
              String(r.over),
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              fmtMoney(r.profit),
              marginCell(r.marginPct, r.flag, `over-${r.over}-m`),
              gapCell(r.marginGap, r.flag, `over-${r.over}-g`),
              `£${r.avgStake.toFixed(0)}`,
            ])}
        />
      </DashCard>

      <DashGrid>
        <DashCard span="half" title="By selection (format total)">
          <DashTable
            columns={["Selection", "Bets", "Stake", "Margin", "Avg odds"]}
            rows={format.bySelection.map((r) => [
              r.selection,
              r.bets.toLocaleString(),
              fmtMoney(r.stake),
              marginCell(r.marginPct, r.flag, `sel-${r.selection}-m`),
              r.avgOdds.toFixed(2),
            ])}
          />
        </DashCard>
        <DashCard span="half" title="Additional splits">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">By innings</p>
          <DashTable
            columns={["Innings", "Bets", "Margin", "Avg stake"]}
            rows={format.byInnings.map((r) => [
              String(r.innings),
              r.bets.toLocaleString(),
              marginCell(r.marginPct, r.flag, `inn-${r.innings}-m`),
              `£${r.avgStake.toFixed(0)}`,
            ])}
          />
          <p className="mb-3 mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">
            Rain / reduction
          </p>
          <DashTable
            columns={["Reduced", "Bets", "Margin", "Stake"]}
            rows={format.byReduced.map((r) => [
              r.reduced,
              r.bets.toLocaleString(),
              marginCell(r.marginPct, r.flag, `red-${r.reduced}-m`),
              fmtMoney(r.stake),
            ])}
          />
        </DashCard>
      </DashGrid>

      <DashCard
        title="Selection × over drill-down"
        description="Pick a selection to see margin at each over — useful for model variable tuning."
        actions={
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-slate-200"
          >
            <option value="all">Choose selection…</option>
            {format.bySelection.map((s) => (
              <option key={s.selection} value={s.selection}>
                {s.selection}
              </option>
            ))}
          </select>
        }
      >
        {selection === "all" ? (
          <p className="text-sm text-slate-500">Select a dismissal type to view over-by-over performance.</p>
        ) : (
          <>
            <MarginByOverChart
              points={selectionOverRows}
              targetMargin={target}
              maxOver={format.chartMaxOver}
              title={`${selection} — margin % by over`}
            />
            <div className="mt-4 overflow-x-auto">
              <DashTable
                columns={["Over", "Bets", "Stake", "Profit", "Margin", "Flag"]}
                rows={selectionOverRows.map((r) => [
                  String(r.over),
                  r.bets.toLocaleString(),
                  fmtMoney(r.stake),
                  fmtMoney(r.profit),
                  marginCell(r.marginPct, r.flag, `drill-${r.over}-m`),
                  r.flag ?? "—",
                ])}
              />
            </div>
          </>
        )}
      </DashCard>
    </div>
  );
}

export function PlayerModTask1Panel() {
  const data = getPlayerModTask1();
  const [activeFormatId, setActiveFormatId] = useState(data.formats[0]?.id ?? "t20");
  const activeFormat = data.formats.find((f) => f.id === activeFormatId) ?? data.formats[0];

  return (
    <DashPage>
      <DashHeader
        title="Task 1 — Player MoD in-play P/L"
        badge={<DashBadge>Jun–Sep 2026</DashBadge>}
        subtitle={
          <>
            {data.sourceFile} · {data.overall.bets.toLocaleString()} bets · book margin{" "}
            <span className={marginClass(data.overall.marginPct, null)}>
              {fmtPct(data.overall.marginPct)}
            </span>{" "}
            (target {data.targetMarginPct}% if model efficient)
          </>
        }
      />

      <DashCard compact>
        <p className="text-sm text-slate-400">
          Each format is analysed separately. Margin = profit ÷ stake. Positive margin = book winning.
          Over-level analysis uses column N (current over). Flagged cells deviate ≥12 percentage points
          from the {data.targetMarginPct}% target with ≥£{data.significance.minStake.toLocaleString()} stake and ≥
          {data.significance.minBets} bets. Re-run{" "}
          <code className="text-emerald-400/90">python scripts/analyze-player-mod-bets.py</code>{" "}
          after updating the Excel export.
        </p>
      </DashCard>

      <div className="flex flex-wrap gap-2">
        {data.formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFormatId(f.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeFormatId === f.id
                ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-surface-raised text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
            <span className="ml-2 text-xs opacity-70">{fmtPct(f.overall.marginPct)}</span>
          </button>
        ))}
      </div>

      {activeFormat && <FormatPanel format={activeFormat} />}
    </DashPage>
  );
}
