import emptyMatches from "./matches.empty.json";
import schemaProfile from "./schema-profile.json";
import type { OdiMatch, OdiSchemaProfile } from "./types";

let cachedMatches: OdiMatch[] = emptyMatches as OdiMatch[];

export function getOdiMatches(): OdiMatch[] {
  return cachedMatches;
}

export function setOdiMatches(matches: OdiMatch[]): void {
  cachedMatches = matches;
}

export function getOdiSchemaProfile(): OdiSchemaProfile | null {
  return schemaProfile as OdiSchemaProfile;
}

export function hasOdiData(): boolean {
  return getOdiMatches().length > 0;
}

export function getMatchById(id: string): OdiMatch | undefined {
  return getOdiMatches().find((m) => m.id === id);
}
