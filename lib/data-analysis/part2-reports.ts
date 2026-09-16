import { getPlayerModPart2 } from "./player-mod-part2";
import type { Part2Segment, Part2SharpBettorDetail } from "./player-mod-part2-types";

export type Part2FormatSlice = {
  id: string;
  label: string;
  hasPhases: boolean;
  bets: number;
  stake: number;
  bookMarginPct: number | null;
  targetGapPp: number | null;
  sharpCount: number;
  qualifiedBettors: number;
  worstSelection: string | null;
  insights: string[];
  topSharps: Array<{ id: number; roi: number; stake: number; bets: number }>;
  selectionMargins: Array<{ label: string; value: number }>;
  phaseMargins: Array<{ label: string; marginPct: number | null; bets: number; stake: number }>;
  sharpWeakCells: string[];
  bigBetSharpSharePct: number | null;
  negativeSelections: string[];
};

export type Part2OverviewReport = {
  generatedAt: string;
  sourceFile: string;
  target: number;
  thresholds: string;
  overall: {
    bets: number;
    stake: number;
    bookMarginPct: number | null;
    bettors: number;
  };
  formats: Part2FormatSlice[];
  keyConclusions: string[];
};

export type Part2BettorCrossFormat = {
  bettorId: number;
  formats: Array<{
    formatLabel: string;
    summary: Part2SharpBettorDetail["summary"] | null;
    topSelections: string;
    topPhases: string;
    topMatches: string[];
    patternNote: string;
  }>;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildFormatSlice(segment: Part2Segment, target: number): Part2FormatSlice {
  const worst = [...segment.bySelection].sort(
    (a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0)
  )[0];
  const negative = segment.bySelection
    .filter((s) => s.marginPct != null && s.marginPct < 0)
    .map((s) => s.selection);

  return {
    id: segment.id,
    label: segment.label,
    hasPhases: segment.hasPhases,
    bets: segment.overall.bets,
    stake: segment.overall.stake,
    bookMarginPct: segment.overall.marginPct,
    targetGapPp:
      segment.overall.marginPct != null
        ? round2(segment.overall.marginPct - target)
        : null,
    sharpCount: segment.sharpAnalysis.sharpCount,
    qualifiedBettors: segment.sharpAnalysis.qualifiedBettors,
    worstSelection: worst
      ? `${worst.selection} (${worst.marginPct?.toFixed(1)}%)`
      : null,
    insights: segment.insights,
    topSharps: segment.sharpAnalysis.topSharps.slice(0, 6).map((r) => ({
      id: r.bettorId,
      roi: r.punterRoiPct,
      stake: r.stake,
      bets: r.bets,
    })),
    selectionMargins: segment.bySelection.map((s) => ({
      label: s.selection,
      value: s.marginPct ?? 0,
    })),
    phaseMargins: segment.byPhase.map((p) => ({
      label: p.label.replace(/Phase \d+ /, "P"),
      marginPct: p.marginPct,
      bets: p.bets,
      stake: p.stake,
    })),
    sharpWeakCells: segment.sharpAnalysis.sharpWeakCells.slice(0, 5).map(
      (c) => `${c.selection} · ${c.phaseLabel} (${c.marginPct.toFixed(0)}%)`
    ),
    bigBetSharpSharePct: segment.sharpAnalysis.bigBetSharpSharePct,
    negativeSelections: negative,
  };
}

function buildBettorCrossFormat(bettorId: number): Part2BettorCrossFormat {
  const data = getPlayerModPart2();
  const formats = data.segments
    .filter((s) => !s.empty)
    .map((segment) => {
      const detail = segment.sharpAnalysis.sharpBettorDetails.find(
        (d) => d.bettorId === bettorId
      );
      if (!detail) {
        return {
          formatLabel: segment.label,
          summary: null,
          topSelections: "—",
          topPhases: "—",
          topMatches: [] as string[],
          patternNote: "No qualified sharp activity in this segment.",
        };
      }

      const topSel = detail.bySelection
        .slice(0, 3)
        .map(
          (s) =>
            `${s.selection} (${s.sharePct.toFixed(0)}%, ROI ${s.punterRoiPct?.toFixed(0)}%)`
        )
        .join("; ");
      const topPh = detail.bestPhases
        .slice(0, 2)
        .map((p) => `${p.label} (${p.punterRoiPct?.toFixed(0)}% ROI)`)
        .join("; ");
      const mainSel = detail.bySelection[0];
      const bestPhase = detail.bestPhases[0];
      const patternNote =
        mainSel && bestPhase
          ? `Concentrates on ${mainSel.selection} (${mainSel.sharePct.toFixed(0)}% stake). Strongest phase: ${bestPhase.label}.`
          : mainSel
            ? `Concentrates on ${mainSel.selection} (${mainSel.sharePct.toFixed(0)}% stake).`
            : "Mixed selection profile.";

      return {
        formatLabel: segment.label,
        summary: detail.summary,
        topSelections: topSel || "—",
        topPhases: topPh || "—",
        topMatches: detail.topMatches.slice(0, 3).map(
          (m) =>
            `${fmtDate(m.eventAt)} · ${m.eventName.length > 36 ? `${m.eventName.slice(0, 36)}…` : m.eventName} (+${m.punterPl.toFixed(0)})`
        ),
        patternNote,
      };
    });

  return { bettorId, formats };
}

export function buildPart2OverviewReport(): Part2OverviewReport {
  const data = getPlayerModPart2();
  const target = data.thresholds.targetBookMarginPct;
  const formats = data.segments.filter((s) => !s.empty).map((s) => buildFormatSlice(s, target));

  const belowTarget = formats.filter((f) => f.bookMarginPct != null && f.bookMarginPct < target);
  const worstFormat = [...formats].sort(
    (a, b) => (a.bookMarginPct ?? 0) - (b.bookMarginPct ?? 0)
  )[0];
  const bestFormat = [...formats].sort(
    (a, b) => (b.bookMarginPct ?? 0) - (a.bookMarginPct ?? 0)
  )[0];
  const totalSharps = formats.reduce((sum, f) => sum + f.sharpCount, 0);

  const keyConclusions = [
    `Overall book margin ${data.overall.marginPct?.toFixed(1)}% is well below the ${target}% target on £${(data.overall.stake / 1_000_000).toFixed(2)}m staked — essentially breakeven at portfolio level.`,
    `${belowTarget.length} of ${formats.length} format segments miss target; worst is ${worstFormat?.label} (${worstFormat?.bookMarginPct?.toFixed(1)}%). Only ${bestFormat?.label} exceeds target (${bestFormat?.bookMarginPct?.toFixed(1)}%).`,
    `Fielder Catch is the recurring weak selection across women's formats and men's ODI/FC — negative margin in every segment where it underperforms.`,
    `${totalSharps} qualified sharp bettors across segments (ROI ≥${data.thresholds.sharpPunterRoiPct}%). Bettors 109 and 143 appear in multiple formats with punter ROI 30–128%.`,
    `Phase-level analysis shows sharp bettors cluster in late-innings phases (T20 Ov 13–20, ODI Ov 31–50) where book margin turns negative vs the format average.`,
    `Cross-reference sharp weak cells with Task 1 selection×over flags — overlapping pricing pockets are highest priority for MoD table review.`,
  ];

  return {
    generatedAt: data.generatedAt,
    sourceFile: data.sourceFile,
    target,
    thresholds: `Sharp = ≥${data.thresholds.minBetsBettor} bets, ≥£${data.thresholds.minStakeBettor.toLocaleString()} stake, punter ROI ≥${data.thresholds.sharpPunterRoiPct}%`,
    overall: {
      bets: data.overall.bets,
      stake: data.overall.stake,
      bookMarginPct: data.overall.marginPct,
      bettors: data.overall.bettors,
    },
    formats,
    keyConclusions,
  };
}

export function buildPart2BettorReport(bettorId: number): Part2BettorCrossFormat {
  return buildBettorCrossFormat(bettorId);
}

export function getPart2SharpDetail(
  segmentId: string,
  bettorId: number
): Part2SharpBettorDetail | undefined {
  const segment = getPlayerModPart2().segments.find((s) => s.id === segmentId);
  return segment?.sharpAnalysis.sharpBettorDetails.find((d) => d.bettorId === bettorId);
}
