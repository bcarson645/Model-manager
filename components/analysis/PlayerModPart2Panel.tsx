"use client";

import { useMemo, useState } from "react";
import { getPlayerModPart2 } from "@/lib/data-analysis/player-mod-part2";
import type { Part2Segment, SelectionRow } from "@/lib/data-analysis/player-mod-part2-types";
import { AvgStakeByPhaseChart } from "./AvgStakeByPhaseChart";
import {
  DashCard,
  DashGrid,
  DashHeader,
  DashPage,
  DashStat,
  DashTable,
} from "./AnalysisDashboard";
import { Part2SharpBettorDetailPanel } from "./Part2SharpBettorDetailPanel";
import { PhaseCompareChart } from "./PhaseCompareChart";
import { PhaseMarginChart } from "./PhaseMarginChart";
import { SelectionShareChart } from "./SelectionShareChart";

function fmtMoney(n: number): string {
  return `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function marginClass(m: number | null): string {
  if (m == null) return "text-slate-400";
  if (m < 0) return "text-red-400";
  if (m < 8) return "text-amber-300";
  if (m >= 7.5) return "text-emerald-400";
  return "text-slate-200";
}

function marginCell(value: number | null, key: string) {
  return (
    <span key={key} className={marginClass(value)}>
      {fmtPct(value)}
    </span>
  );
}

function SelectionTable({ rows, target }: { rows: SelectionRow[]; target: number }) {
  return (
    <DashTable
      columns={["Selection (ufoid)", "Bets", "Stake", "Book P/L", "Margin", "vs target"]}
      rows={rows.map((r) => {
        const gap = r.marginPct != null ? r.marginPct - target : null;
        const key = r.selection;
        return [
          r.selection,
          r.bets.toLocaleString(),
          fmtMoney(r.stake),
          fmtMoney(r.bookProfit),
          marginCell(r.marginPct, `${key}-m`),
          gap != null ? (
            <span key={`${key}-g`} className={marginClass(gap)}>
              {gap > 0 ? "+" : ""}{gap.toFixed(1)}pp
            </span>
          ) : (
            "—"
          ),
        ];
      })}
    />
  );
}

function SegmentPanel({
  segment,
  target,
  selectedBettorId,
  onSelectBettor,
}: {
  segment: Part2Segment;
  target: number;
  selectedBettorId: number | null;
  onSelectBettor: (id: number | null) => void;
}) {
  const sharps = segment.sharpAnalysis;
  const negativeSelections = segment.bySelection.filter(
    (s) => s.phaseChart && s.phaseChart.length > 0
  );
  const selectedDetail =
    selectedBettorId != null
      ? sharps.sharpBettorDetails.find((d) => d.bettorId === selectedBettorId)
      : undefined;

  if (selectedDetail) {
    return (
      <Part2SharpBettorDetailPanel
        detail={selectedDetail}
        segmentLabel={segment.label}
        targetBookMargin={target}
        hasPhases={segment.hasPhases}
        onBack={() => onSelectBettor(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DashGrid>
        <DashStat span="quarter" label="Bets" value={segment.overall.bets.toLocaleString()} />
        <DashStat span="quarter" label="Stake" value={fmtMoney(segment.overall.stake)} />
        <DashStat
          span="quarter"
          label="Book margin"
          value={fmtPct(segment.overall.marginPct)}
          hint={`Target ${target}%`}
          valueClassName={marginClass(segment.overall.marginPct)}
        />
        <DashStat
          span="quarter"
          label="Sharp bettors"
          value={sharps.sharpCount.toLocaleString()}
          hint={`${sharps.qualifiedBettors} qualified`}
          valueClassName="text-red-300"
        />
      </DashGrid>

      {segment.insights.length > 0 && (
        <DashCard title="Key insights" description="Auto-generated from this format segment">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {segment.insights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DashCard>
      )}

      <DashCard
        title="Summary by selection (ufoid)"
        description="Stake, book P/L and margin — each format analysed separately"
      >
        <SelectionTable rows={segment.bySelection} target={target} />
      </DashCard>

      {segment.hasPhases && segment.byPhase.length > 0 && (
        <DashCard title="Overall margin by innings phase">
          <PhaseMarginChart
            title="All selections combined"
            points={segment.byPhase}
            targetMargin={target}
          />
          <div className="mt-4">
            <DashTable
              columns={["Phase", "Overs", "Bets", "Stake", "Margin"]}
              rows={segment.byPhase.map((p) => [
                p.label,
                p.overRange,
                p.bets.toLocaleString(),
                fmtMoney(p.stake),
                marginCell(p.marginPct, `phase-${p.phaseId}`),
              ])}
            />
          </div>
        </DashCard>
      )}

      {negativeSelections.length > 0 && (
        <DashCard
          title="Negative-margin selections — margin by phase"
          description="Phase breakdown where overall selection margin is below zero"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {negativeSelections.map((sel) => (
              <div key={sel.selection} className="rounded-lg border border-surface-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-100">{sel.selection}</h4>
                  <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
                    {fmtPct(sel.marginPct)} overall
                  </span>
                </div>
                <PhaseMarginChart
                  title={`${sel.selection} — margin through phases`}
                  points={sel.phaseChart!}
                  targetMargin={target}
                />
              </div>
            ))}
          </div>
        </DashCard>
      )}

      {segment.hasPhases && segment.selectionPhaseMatrix.length > 0 && (
        <DashCard
          title="Selection × phase heatmap (table)"
          description="Cells with sufficient volume — red flags = negative margin"
        >
          <DashTable
            columns={["Selection", "Phase", "Bets", "Stake", "Margin"]}
            rows={segment.selectionPhaseMatrix
              .filter((c) => c.marginPct != null && c.marginPct < target - 5)
              .sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))
              .slice(0, 20)
              .map((c) => [
                c.selection,
                c.phaseLabel,
                c.bets.toLocaleString(),
                fmtMoney(c.stake),
                marginCell(c.marginPct, `${c.selection}-${c.phaseId}`),
              ])}
          />
        </DashCard>
      )}

      <DashCard
        title="Sharp bettor focus"
        description="Click a bettor for full breakdown — selections, phases, matches and bet history"
      >
        {sharps.sharpCount === 0 ? (
          <p className="text-sm text-slate-500">No qualified sharp bettors in this segment.</p>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 first:pl-0">Bettor ID</th>
                    <th className="px-2 py-2">Bets</th>
                    <th className="px-2 py-2">Stake</th>
                    <th className="px-2 py-2">Punter ROI</th>
                    <th className="px-2 py-2">Book margin</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sharps.topSharps.map((r) => (
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
                      <td className="whitespace-nowrap px-2 py-2 text-red-400">{fmtPct(r.punterRoiPct)}</td>
                      <td className="whitespace-nowrap px-2 py-2">{marginCell(r.bookMarginPct, `bm-${r.bettorId}`)}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-500">View →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sharps.sharpBettorDetails.slice(0, 6).map((d) => (
                <button
                  key={d.bettorId}
                  type="button"
                  onClick={() => onSelectBettor(d.bettorId)}
                  className="rounded-lg border border-surface-border bg-surface/40 p-3 text-left transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  <p className="text-sm font-medium text-white">
                    Bettor {d.bettorId}{" "}
                    <span className="text-red-400">{fmtPct(d.summary.punterRoiPct)} ROI</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.summary.bets} bets · {fmtMoney(d.summary.stake)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Best: {d.bestSelections[0]?.selection ?? "—"}
                    {d.bestPhases[0] ? ` · ${d.bestPhases[0].label}` : ""}
                  </p>
                </button>
              ))}
            </div>

            {segment.hasPhases && sharps.marginByPhase.length > 0 && (
              <PhaseCompareChart
                title="Book margin by phase — all vs sharps vs others"
                points={sharps.marginByPhase}
                targetMargin={target}
              />
            )}

            {sharps.sharpSelectionPrefs.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Sharp stake share by selection</p>
                <SelectionShareChart
                  sharp={sharps.sharpSelectionPrefs.map((s) => ({
                    selection: s.selection,
                    stake: s.stake,
                    sharePct: s.sharePct,
                  }))}
                  others={segment.bySelection.map((sel) => {
                    const sharpStake =
                      sharps.sharpSelectionPrefs.find((s) => s.selection === sel.selection)?.stake ?? 0;
                    const otherStake = Math.max(0, sel.stake - sharpStake);
                    const otherTotal = segment.bySelection.reduce((sum, s) => {
                      const ss =
                        sharps.sharpSelectionPrefs.find((p) => p.selection === s.selection)?.stake ?? 0;
                      return sum + Math.max(0, s.stake - ss);
                    }, 0);
                    return {
                      selection: sel.selection,
                      stake: otherStake,
                      sharePct: otherTotal > 0 ? (otherStake / otherTotal) * 100 : 0,
                    };
                  })}
                />
              </div>
            )}

            {segment.hasPhases && sharps.avgStakeByPhase.some((p) => p.spike) && (
              <AvgStakeByPhaseChart
                title="Average stake by phase (orange = spike vs format average)"
                points={sharps.avgStakeByPhase}
              />
            )}

            {sharps.sharpWeakCells.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">
                  Sharp bettor cells where book margin is negative
                </p>
                <DashTable
                  columns={["Selection", "Phase", "Bets", "Stake", "Margin"]}
                  rows={sharps.sharpWeakCells.map((c) => [
                    c.selection,
                    c.phaseLabel,
                    c.bets.toLocaleString(),
                    fmtMoney(c.stake),
                    marginCell(c.marginPct, `sw-${c.selection}-${c.phaseId}`),
                  ])}
                />
              </div>
            )}

            {sharps.bigBetSharpSharePct != null && (
              <p className="text-sm text-slate-400">
                Large losing bets: <strong className="text-red-300">{sharps.bigBetSharpSharePct.toFixed(0)}%</strong>{" "}
                attributed to sharp bettors (lifetime ROI ≥ threshold).
              </p>
            )}
          </div>
        )}
      </DashCard>
    </div>
  );
}

export function PlayerModPart2Panel() {
  const data = useMemo(() => getPlayerModPart2(), []);
  const segments = data.segments.filter((s) => !s.empty);
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "men-t20");
  const [selectedBettorId, setSelectedBettorId] = useState<number | null>(null);
  const segment = segments.find((s) => s.id === segmentId) ?? segments[0];
  const target = data.thresholds.targetBookMarginPct;

  return (
    <DashPage>
      <DashHeader
        title="Part 2 — Gender × format × phase"
        subtitle={`${data.sourceFile} · ${data.overall.bets.toLocaleString()} bets · margin ${fmtPct(data.overall.marginPct)} (target ${target}%)`}
      />

      <DashCard title="Format segments" description="Women = tournament name contains 'Women'. FC = 280 overs. No cross-format mixing.">
        <div className="flex flex-wrap gap-2">
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSegmentId(s.id);
                setSelectedBettorId(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                s.id === segmentId
                  ? "bg-emerald-600 text-white"
                  : "bg-surface-raised text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.label}
              <span className={`ml-2 text-xs ${s.id === segmentId ? "text-emerald-100" : "text-slate-500"}`}>
                {fmtPct(s.overall.marginPct)}
              </span>
            </button>
          ))}
        </div>
      </DashCard>

      <div className="mt-2 overflow-x-auto">
        <DashTable
          columns={["Segment", "Bets", "Stake", "Book margin", "Sharps", "Worst selection"]}
          rows={segments.map((s) => {
            const worst = [...s.bySelection].sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))[0];
            return [
              s.label,
              s.overall.bets.toLocaleString(),
              fmtMoney(s.overall.stake),
              marginCell(s.overall.marginPct, `ov-${s.id}`),
              String(s.sharpAnalysis.sharpCount),
              worst ? `${worst.selection} (${fmtPct(worst.marginPct)})` : "—",
            ];
          })}
        />
      </div>

      {segment && (
        <SegmentPanel
          segment={segment}
          target={target}
          selectedBettorId={selectedBettorId}
          onSelectBettor={setSelectedBettorId}
        />
      )}
    </DashPage>
  );
}
