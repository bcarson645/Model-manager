import type { OutputComparisonRow } from "./types";

export function isWithinTolerance(row: OutputComparisonRow): boolean {
  if (row.excelValue === null || row.lambdaValue === null) return false;
  return Math.abs(row.excelValue - row.lambdaValue) <= row.tolerance;
}

export function formatOutputValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "prob" || unit === "percentage") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === "price") {
    return value.toFixed(3);
  }
  return value.toFixed(1);
}

export function outputDelta(row: OutputComparisonRow): number | null {
  if (row.excelValue === null || row.lambdaValue === null) return null;
  return row.lambdaValue - row.excelValue;
}
