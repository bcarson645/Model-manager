import type { OdiMatch, OdiSchemaProfile } from "./types";

let cachedMatches: OdiMatch[] | null | undefined;
let cachedProfile: OdiSchemaProfile | null | undefined;

export function getOdiMatches(): OdiMatch[] {
  if (cachedMatches !== undefined) return cachedMatches ?? [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMatches = require("./matches.json") as OdiMatch[];
  } catch {
    cachedMatches = null;
  }
  return cachedMatches ?? [];
}

export function getOdiSchemaProfile(): OdiSchemaProfile | null {
  if (cachedProfile !== undefined) return cachedProfile;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedProfile = require("./schema-profile.json") as OdiSchemaProfile;
  } catch {
    cachedProfile = null;
  }
  return cachedProfile;
}

export function hasOdiData(): boolean {
  return getOdiMatches().length > 0;
}

export function getMatchById(id: string): OdiMatch | undefined {
  return getOdiMatches().find((m) => m.id === id);
}
