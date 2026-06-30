import emptyMatches from "./matches.empty.json";
import schemaProfile from "./schema-profile.json";
import type { T20Match, T20SchemaProfile } from "./types";

let cachedMatches: T20Match[] = emptyMatches as T20Match[];

export function getT20Matches(): T20Match[] {
  return cachedMatches;
}

export function setT20Matches(matches: T20Match[]): void {
  cachedMatches = matches;
}

export function getT20SchemaProfile(): T20SchemaProfile | null {
  return schemaProfile as T20SchemaProfile;
}

export function hasT20Data(): boolean {
  return getT20Matches().length > 0;
}

export function getT20MatchById(id: string): T20Match | undefined {
  return getT20Matches().find((m) => m.id === id);
}
