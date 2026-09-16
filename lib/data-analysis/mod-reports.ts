import { getPlayerModTask1 } from "./player-mod-task1";
import { getPlayerModTask2 } from "./player-mod-task2";
import type {
  BettorBetRow,
  ModBettorFormatAnalysis,
  SharpBettorDetail,
} from "./player-mod-task2-types";
import type { ModFormatAnalysis as Task1Format } from "./player-mod-types";

export type MatchPnlRow = {
  eventName: string;
  eventAt: string | null;
  bets: number;
  stake: number;
  punterPl: number;
  punterRoiPct: number;
  topSelection: string;
};

export type BettorReportSlice = {
  bettorId: number;
  formats: Array<{
    formatId: string;
    formatLabel: string;
    summary: SharpBettorDetail["summary"] | null;
    topSelections: string;
    topOvers: string;
    topMatches: MatchPnlRow[];
    patternNote: string;
  }>;
};

export type MarketOverviewReport = {
  generatedAt: string;
  dateRange: { from: string; to: string };
  overall: {
    bets: number;
    stake: number;
    bookMarginPct: number;
    bookProfit: number;
  };
  formats: Array<{
    id: string;
    label: string;
    bets: number;
    stake: number;
    bookMarginPct: number;
    targetGapPp: number;
    topUnderperformers: string[];
    topOverperformers: string[];
    worstSelection: string | null;
  }>;
  t20Highlights: {
    bookMarginPct: number;
    flaggedUnderCount: number;
    flaggedOverCount: number;
    topUnderCells: string[];
    topOverCells: string[];
    bySelectionSummary: string[];
  };
};

export type SharpBettorsReport = {
  thresholds: string;
  universe: { totalBettors: number; qualified: number };
  t20: {
    sharpCount: number;
    weakCount: number;
    bookMarginPct: number;
    bigBetInsight: string;
    topSharps: Array<{ id: number; roi: number; stake: number; bets: number }>;
  };
  otherFormats: Array<{ label: string; sharpCount: number; bookMarginPct: number }>;
  focus109: BettorReportSlice;
  focus143: BettorReportSlice;
};

function groupBetsByMatch(bets: BettorBetRow[]): MatchPnlRow[] {
  const map = new Map<
    string,
    {
      eventName: string;
      eventAt: string | null;
      bets: number;
      stake: number;
      punterPl: number;
      selections: Map<string, number>;
    }
  >();

  for (const b of bets) {
    const key = b.eventName ?? "Unknown match";
    const cur = map.get(key) ?? {
      eventName: key,
      eventAt: b.eventAt,
      bets: 0,
      stake: 0,
      punterPl: 0,
      selections: new Map(),
    };
    cur.bets += 1;
    cur.stake += b.stake;
    cur.punterPl += b.punterPl;
    cur.selections.set(b.selection, (cur.selections.get(b.selection) ?? 0) + b.stake);
    if (b.eventAt && (!cur.eventAt || b.eventAt > cur.eventAt)) {
      cur.eventAt = b.eventAt;
    }
    map.set(key, cur);
  }

  return Array.from(map.values())
    .map((m) => {
      const topSel = Array.from(m.selections.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        eventName: m.eventName,
        eventAt: m.eventAt,
        bets: m.bets,
        stake: round2(m.stake),
        punterPl: round2(m.punterPl),
        punterRoiPct: round2((m.punterPl / m.stake) * 100),
        topSelection: topSel?.[0] ?? "—",
      };
    })
    .sort((a, b) => b.punterPl - a.punterPl);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildBettorSlice(bettorId: number): BettorReportSlice {
  const task2 = getPlayerModTask2();
  const formats = task2.formats.map((fmt) => {
    const detail = fmt.sharpBettorDetails.find((d) => d.bettorId === bettorId);
    if (!detail) {
      return {
        formatId: fmt.id,
        formatLabel: fmt.label,
        summary: null,
        topSelections: "—",
        topOvers: "—",
        topMatches: [] as MatchPnlRow[],
        patternNote: "No qualified sharp activity in this format window.",
      };
    }

    const topSel = detail.bySelection
      .slice(0, 3)
      .map((s) => `${s.selection} (${s.sharePct.toFixed(0)}%, ROI ${s.punterRoiPct?.toFixed(0)}%)`)
      .join("; ");
    const topOv = detail.byOver
      .filter((o) => o.punterRoiPct != null)
      .sort((a, b) => b.stake - a.stake)
      .slice(0, 4)
      .map((o) => `Ov${o.over} (${o.punterRoiPct!.toFixed(0)}% ROI, ${o.bets} bets)`)
      .join("; ");

    const bestOver = detail.byOver
      .filter((o) => o.punterRoiPct != null)
      .sort((a, b) => (b.punterRoiPct ?? 0) - (a.punterRoiPct ?? 0))[0];
    const mainSel = detail.bySelection[0];
    const patternNote = mainSel && bestOver
      ? `Concentrates on ${mainSel.selection} (${mainSel.sharePct.toFixed(0)}% of stake). Strongest over window: over ${bestOver.over} (${bestOver.punterRoiPct?.toFixed(0)}% punter ROI).`
      : "Mixed selection profile across overs.";

    return {
      formatId: fmt.id,
      formatLabel: fmt.label,
      summary: detail.summary,
      topSelections: topSel || "—",
      topOvers: topOv || "—",
      topMatches: groupBetsByMatch(detail.bets).slice(0, 6),
      patternNote,
    };
  });

  return { bettorId, formats };
}

function task1Format(id: string): Task1Format | undefined {
  return getPlayerModTask1().formats.find((f) => f.id === id);
}

function task2Format(id: string): ModBettorFormatAnalysis | undefined {
  return getPlayerModTask2().formats.find((f) => f.id === id);
}

export function buildMarketOverviewReport(): MarketOverviewReport {
  const t1 = getPlayerModTask1();
  const target = t1.targetMarginPct;
  const t20 = task1Format("t20")!;

  return {
    generatedAt: t1.generatedAt,
    dateRange: t1.overall.dateRange,
    overall: {
      bets: t1.overall.bets,
      stake: t1.overall.stake,
      bookMarginPct: t1.overall.marginPct,
      bookProfit: round2(t1.overall.profit),
    },
    formats: t1.formats.map((f) => ({
      id: f.id,
      label: f.label,
      bets: f.overall.bets,
      stake: f.overall.stake,
      bookMarginPct: f.overall.marginPct,
      targetGapPp: round2(f.overall.marginPct - target),
      topUnderperformers: f.flaggedUnder.slice(0, 4).map(
        (r) => `${r.selection} @ Ov${r.over} (${r.marginPct?.toFixed(0)}% book margin)`
      ),
      topOverperformers: f.flaggedOver.slice(0, 4).map(
        (r) => `${r.selection} @ Ov${r.over} (${r.marginPct?.toFixed(0)}%)`
      ),
      worstSelection: f.bySelection.sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))[0]
        ? `${f.bySelection.sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))[0]!.selection} (${f.bySelection.sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))[0]!.marginPct?.toFixed(1)}%)`
        : null,
    })),
    t20Highlights: {
      bookMarginPct: t20.overall.marginPct,
      flaggedUnderCount: t20.flaggedUnder.length,
      flaggedOverCount: t20.flaggedOver.length,
      topUnderCells: t20.flaggedUnder.slice(0, 6).map(
        (r) => `${r.selection} Ov${r.over}: ${r.marginPct?.toFixed(0)}% (${round2(r.stake / 1000)}k stake)`
      ),
      topOverCells: t20.flaggedOver.slice(0, 6).map(
        (r) => `${r.selection} Ov${r.over}: ${r.marginPct?.toFixed(0)}%`
      ),
      bySelectionSummary: t20.bySelection.map(
        (s) => `${s.selection}: ${s.marginPct?.toFixed(1)}% margin (${round2(s.stake / 1000)}k)`
      ),
    },
  };
}

export function buildSharpBettorsReport(): SharpBettorsReport {
  const t2 = getPlayerModTask2();
  const t20 = task2Format("t20")!;

  return {
    thresholds: `Sharp = ≥${t2.thresholds.minBetsBettor} bets, ≥£${t2.thresholds.minStakeBettor.toLocaleString()} stake, punter ROI ≥${t2.thresholds.sharpPunterRoiPct}%`,
    universe: {
      totalBettors: t2.overall.totalBettors,
      qualified: t2.overall.qualifiedBettors,
    },
    t20: {
      sharpCount: t20.bettorUniverse.sharpBettors,
      weakCount: t20.bettorUniverse.weakBettors,
      bookMarginPct: t20.overall.bookMarginPct ?? 0,
      bigBetInsight: `On bets ≥£${t2.thresholds.bigBetStake}, book lost ${t20.bigBetSummary.bookLostCount}×; avg bettor lifetime ROI when book lost: ${t20.bigBetSummary.avgBettorRoiWhenBookLost?.toFixed(1)}%. ${t20.bigBetSummary.pctBookLostFromSharps?.toFixed(0)}% of those losses came from known sharps.`,
      topSharps: t20.topSharpBettors.slice(0, 8).map((r) => ({
        id: r.bettorId,
        roi: r.punterRoiPct,
        stake: r.stake,
        bets: r.bets,
      })),
    },
    otherFormats: t2.formats
      .filter((f) => f.id !== "t20")
      .map((f) => ({
        label: f.label,
        sharpCount: f.bettorUniverse.sharpBettors,
        bookMarginPct: f.overall.bookMarginPct ?? 0,
      })),
    focus109: buildBettorSlice(109),
    focus143: buildBettorSlice(143),
  };
}

export { fmtDate };
