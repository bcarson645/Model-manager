import { getOdiMatches, getOdiSchemaProfile, setOdiMatches } from "@/lib/odi-scorecards/matches";
import {
  getT20Matches,
  getT20SchemaProfile,
  setT20Matches,
} from "@/lib/t20-scorecards/matches";
import type { DataFormat, SchemaProfile, ScorecardMatch } from "./types";

export function getMatchesForFormat(format: DataFormat): ScorecardMatch[] {
  if (format === "odi") return getOdiMatches();
  if (format === "t20") return getT20Matches();
  return [];
}

/** Load gitignored matches.json from disk via API (local dev / custom deploy). */
export async function loadMatchesForFormat(format: DataFormat): Promise<ScorecardMatch[]> {
  if (format !== "odi" && format !== "t20") return [];

  try {
    const res = await fetch(`/api/scorecards/${format}`);
    if (!res.ok) return getMatchesForFormat(format);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return getMatchesForFormat(format);

    if (format === "odi") setOdiMatches(data);
    else setT20Matches(data);
  } catch {
    // Offline or static export — keep bundled empty fallback.
  }

  return getMatchesForFormat(format);
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
