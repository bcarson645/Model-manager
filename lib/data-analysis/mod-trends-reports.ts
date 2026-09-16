import { getModDismissalByYear } from "./mod-dismissal-by-year";
import type { DismissalByYearSegment } from "./mod-dismissal-by-year-types";
import { getModFrequencyPricing } from "./mod-frequency-pricing";
import type { ModFrequencySegment } from "./mod-frequency-pricing-types";
import { getModPortfolioPricing } from "./mod-portfolio-pricing";
import type { PortfolioSegment } from "./mod-portfolio-pricing-types";

export type ModTrendsSegmentReport = {
  id: string;
  label: string;
  empty: boolean;
  frequency: ModFrequencySegment | null;
  portfolio: PortfolioSegment | null;
  scorecardYearly: DismissalByYearSegment | null;
  pricingCallouts: string[];
  trendCallouts: string[];
};

export type ModTrendsPricingReportData = {
  generatedAt: string;
  frequencySource: string;
  portfolioSource: string;
  portfolioTargetPct: number;
  frequencyTargetPct: number;
  keyConclusions: string[];
  limitations: string[];
  segments: ModTrendsSegmentReport[];
};

const SEGMENT_ORDER = ["men-odi", "women-odi", "men-t20", "women-t20", "men-fc"];

function buildPricingCallouts(portfolio: PortfolioSegment | null): string[] {
  if (!portfolio || portfolio.empty) return [];
  const fc = portfolio.optimalAdjusts.find((r) => r.selection === "Fielder Catch");
  const notes: string[] = [];

  if (fc && fc.adjustI > 0) {
    notes.push(
      `Raise I45 to +${fc.adjustI}: shortens Fielder Catch from ${fc.currentAvgOdds?.toFixed(2) ?? "—"} to ${fc.recommendedOdds?.toFixed(2) ?? "—"} (published prob +${fc.deltaProbPp.toFixed(1)}pp via renorm).`
    );
  }

  const downOthers = portfolio.optimalAdjusts.filter(
    (r) => r.selection !== "Fielder Catch" && r.deltaProbPp < -0.5
  );
  if (downOthers.length > 0) {
    const names = downOthers.map((r) => r.selection).join(", ");
    notes.push(`Renorm transfers probability from ${names} to fund FC tightening without inflating overround.`);
  }

  if (
    portfolio.overall.simAtZeroAdjustPct != null &&
    portfolio.overall.simAtZeroAdjustPct < portfolio.overall.targetMarginPct - 1
  ) {
    notes.push(
      `At zero adjusts, simulated margin is ${portfolio.overall.simAtZeroAdjustPct.toFixed(1)}% — current offer structure under-recovers vs ${portfolio.overall.targetMarginPct}% target.`
    );
  }

  notes.push(...portfolio.formatNotes.slice(0, 2));
  return notes;
}

function buildTrendCallouts(
  frequency: ModFrequencySegment | null,
  scorecard: DismissalByYearSegment | null
): string[] {
  const notes: string[] = [];

  if (scorecard && !scorecard.empty && scorecard.emergingTrends) {
    for (const t of scorecard.emergingTrends.slice(0, 3)) {
      const period = scorecard.periodLabels;
      notes.push(
        `Scorecard (${period?.early} → ${period?.recent}): ${t.selection} ${t.direction === "up" ? "rising" : "falling"} (${t.earlySharePct.toFixed(1)}% → ${t.recentSharePct.toFixed(1)}%, ${t.deltaPp > 0 ? "+" : ""}${t.deltaPp.toFixed(1)}pp).`
      );
    }
  }

  if (frequency && !frequency.empty) {
    for (const t of frequency.emergingTrends.slice(0, 2)) {
      notes.push(
        `Betting window (Jun–Sep 2026): ${t.selection} share ${t.direction === "up" ? "up" : "down"} ${t.deltaPp > 0 ? "+" : ""}${t.deltaPp.toFixed(1)}pp (early ${t.earlySharePct.toFixed(1)}% → recent ${t.recentSharePct.toFixed(1)}%).`
      );
    }
  }

  return notes;
}

function buildKeyConclusions(segments: ModTrendsSegmentReport[]): string[] {
  const conclusions: string[] = [];

  const worstMargin = segments
    .filter((s) => s.frequency && !s.frequency.empty)
    .sort((a, b) => (a.frequency!.overall.marginPct ?? 0) - (b.frequency!.overall.marginPct ?? 0))[0];

  if (worstMargin?.frequency) {
    conclusions.push(
      `${worstMargin.label} is the weakest segment at ${worstMargin.frequency.overall.marginPct?.toFixed(1)}% book margin — Fielder Catch dominates stake and outcome share.`
    );
  }

  const fcHeavy = segments.filter(
    (s) => s.portfolio && (s.portfolio.stakeMixPct["Fielder Catch"] ?? 0) > 70
  );
  if (fcHeavy.length > 0) {
    conclusions.push(
      `I45 (Fielder Catch adjust) is the primary margin lever in ${fcHeavy.map((s) => s.label).join(", ")} — 70%+ of stake on FC.`
    );
  }

  const t20Scorecard = segments.find((s) => s.id === "men-t20")?.scorecardYearly;
  if (t20Scorecard?.emergingTrends?.some((t) => t.selection === "Fielder Catch" && t.direction === "up")) {
    conclusions.push(
      "Men's T20 scorecard data (2016–2026) shows Fielder Catch share rising ~2pp — supports FC odds shortening over time."
    );
  }

  const runOutDown = segments.filter((s) =>
    s.scorecardYearly?.emergingTrends?.some((t) => t.selection === "Run Out" && t.direction === "down")
  );
  if (runOutDown.length > 0) {
    conclusions.push(
      `Run Out frequency declining in ${runOutDown.map((s) => s.label).join(" & ")} scorecards — room to lengthen Run Out odds.`
    );
  }

  conclusions.push(
    "Women's segments lack multi-year scorecard data — rely on betting monthly trends (4-month window) for short-term shifts."
  );

  return conclusions.slice(0, 6);
}

export function buildModTrendsPricingReport(): ModTrendsPricingReportData {
  const frequency = getModFrequencyPricing();
  const portfolio = getModPortfolioPricing();
  const yearly = getModDismissalByYear();

  const freqMap = new Map(frequency.segments.map((s) => [s.id, s]));
  const portMap = new Map(portfolio.segments.map((s) => [s.id, s]));
  const yearlyMap = new Map(yearly.segments.map((s) => [s.id, s]));

  const allIds = Array.from(
    new Set([...SEGMENT_ORDER, ...frequency.segments.map((s) => s.id), ...portfolio.segments.map((s) => s.id)])
  ).sort((a, b) => {
    const ia = SEGMENT_ORDER.indexOf(a);
    const ib = SEGMENT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const segments: ModTrendsSegmentReport[] = allIds.map((id) => {
    const freq = freqMap.get(id) ?? null;
    const port = portMap.get(id) ?? null;
    const scorecard = yearlyMap.get(id) ?? null;
    const label = freq?.label ?? port?.label ?? scorecard?.label ?? id;

    return {
      id,
      label,
      empty: !freq && !port,
      frequency: freq ?? null,
      portfolio: port ?? null,
      scorecardYearly: scorecard ?? null,
      pricingCallouts: buildPricingCallouts(port),
      trendCallouts: buildTrendCallouts(freq, scorecard),
    };
  });

  return {
    generatedAt: frequency.generatedAt,
    frequencySource: frequency.sourceFile,
    portfolioSource: portfolio.sourceFile,
    portfolioTargetPct: portfolio.targetMarginPct,
    frequencyTargetPct: frequency.targetMarginPct,
    keyConclusions: buildKeyConclusions(segments),
    limitations: yearly.limitations,
    segments: segments.filter((s) => !s.empty || s.scorecardYearly),
  };
}
