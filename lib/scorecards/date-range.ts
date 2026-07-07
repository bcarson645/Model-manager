import type { ScorecardMatch } from "./types";

export type DateRangeBounds = {
  min: string;
  max: string;
};

export type DateRange = {
  start: string;
  end: string;
};

const DAY_MS = 86_400_000;

export function getMatchDateBounds(matches: ScorecardMatch[]): DateRangeBounds | null {
  const dates = matches
    .map((m) => m.date)
    .filter((d): d is string => !!d && d.length >= 10)
    .sort();
  if (dates.length === 0) return null;
  return { min: dates[0]!, max: dates[dates.length - 1]! };
}

export function isFullDateRange(range: DateRange, bounds: DateRangeBounds): boolean {
  return range.start === bounds.min && range.end === bounds.max;
}

export function filterMatchesByDateRange(
  matches: ScorecardMatch[],
  range: DateRange,
  bounds: DateRangeBounds
): ScorecardMatch[] {
  const full = isFullDateRange(range, bounds);
  return matches.filter((m) => {
    if (!m.date) return full;
    return m.date >= range.start && m.date <= range.end;
  });
}

export function dateToSliderValue(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getTime();
}

export function sliderValueToDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function clampDateRange(
  startTs: number,
  endTs: number,
  bounds: DateRangeBounds
): DateRange {
  const minTs = dateToSliderValue(bounds.min);
  const maxTs = dateToSliderValue(bounds.max);
  const lo = Math.max(minTs, Math.min(startTs, endTs));
  const hi = Math.min(maxTs, Math.max(startTs, endTs));
  return {
    start: sliderValueToDate(lo),
    end: sliderValueToDate(hi),
  };
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function referenceYearFromRange(range: DateRange): number {
  return parseInt(range.end.slice(0, 4), 10) || new Date().getFullYear();
}

export { DAY_MS };
