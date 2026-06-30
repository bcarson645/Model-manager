import type { T20Match, T20SchemaProfile } from "./types";

let cachedMatches: T20Match[] | null | undefined;
let cachedProfile: T20SchemaProfile | null | undefined;

export function getT20Matches(): T20Match[] {
  if (cachedMatches !== undefined) return cachedMatches ?? [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMatches = require("./matches.json") as T20Match[];
  } catch {
    cachedMatches = null;
  }
  return cachedMatches ?? [];
}

export function getT20SchemaProfile(): T20SchemaProfile | null {
  if (cachedProfile !== undefined) return cachedProfile;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedProfile = require("./schema-profile.json") as T20SchemaProfile;
  } catch {
    cachedProfile = null;
  }
  return cachedProfile;
}

export function hasT20Data(): boolean {
  return getT20Matches().length > 0;
}

export function getT20MatchById(id: string): T20Match | undefined {
  return getT20Matches().find((m) => m.id === id);
}
