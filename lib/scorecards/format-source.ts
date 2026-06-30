import { getOdiMatches, getOdiSchemaProfile } from "@/lib/odi-scorecards/matches";
import { getT20Matches, getT20SchemaProfile } from "@/lib/t20-scorecards/matches";
import type { DataFormat, SchemaProfile, ScorecardMatch } from "./types";

export function getMatchesForFormat(format: DataFormat): ScorecardMatch[] {
  if (format === "odi") return getOdiMatches();
  if (format === "t20") return getT20Matches();
  return [];
}

export function getProfileForFormat(format: DataFormat): SchemaProfile | null {
  if (format === "odi") return getOdiSchemaProfile();
  if (format === "t20") return getT20SchemaProfile();
  return null;
}

export function hasFormatData(format: DataFormat): boolean {
  return getMatchesForFormat(format).length > 0;
}

export function formatLabel(format: DataFormat): string {
  if (format === "odi") return "ODI";
  if (format === "t20") return "T20";
  return "First class";
}
