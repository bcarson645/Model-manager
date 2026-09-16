import type { BatterProfile, BowlerProfile, TeamProfile } from "./types";

/** Standard XI from the investigation table (identical both sides by default). */
export const STANDARD_BATTERS: BatterProfile[] = [
  { batOrder: 1, bowlOrder: 11, name: "Bat 1", btCaz: 28, srCaz: 1.3, rating: 28 },
  { batOrder: 2, bowlOrder: 10, name: "Bat 2", btCaz: 28, srCaz: 1.3, rating: 28 },
  { batOrder: 3, bowlOrder: 9, name: "Bat 3", btCaz: 27, srCaz: 1.25, rating: 26 },
  { batOrder: 4, bowlOrder: 8, name: "Bat 4", btCaz: 26, srCaz: 1.25, rating: 25 },
  { batOrder: 5, bowlOrder: 7, name: "Bat 5", btCaz: 25, srCaz: 1.25, rating: 24 },
  { batOrder: 6, bowlOrder: 6, name: "Bat 6", btCaz: 23, srCaz: 1.3, rating: 23 },
  { batOrder: 7, bowlOrder: 5, name: "Bat 7", btCaz: 19, srCaz: 1.3, rating: 19 },
  { batOrder: 8, bowlOrder: 4, name: "Bat 8", btCaz: 16, srCaz: 1.2, rating: 15 },
  { batOrder: 9, bowlOrder: 3, name: "Bat 9", btCaz: 14, srCaz: 1.1, rating: 12 },
  { batOrder: 10, bowlOrder: 2, name: "Bat 10", btCaz: 11, srCaz: 0.95, rating: 8 },
  { batOrder: 11, bowlOrder: 1, name: "Bat 11", btCaz: 10, srCaz: 0.8, rating: 6 },
];

/** Top 5 bowlers × 4 overs, econ 10.3, SR 0.29 wkts/over. */
export function standardBowlers(prefix: string): BowlerProfile[] {
  return [1, 2, 3, 4, 5].map((i) => ({
    name: `${prefix} Bowl ${i}`,
    econ: 10.3,
    sr: 0.29,
    maxOvers: 4,
  }));
}

export function cloneStandardTeam(id: "home" | "away", name: string): TeamProfile {
  const prefix = id === "home" ? "H" : "A";
  return {
    id,
    name,
    batters: STANDARD_BATTERS.map((b, i) => ({
      ...b,
      name: `${prefix} ${b.name}`,
    })),
    bowlers: standardBowlers(prefix),
  };
}

export function defaultHomeTeam(): TeamProfile {
  return cloneStandardTeam("home", "Home");
}

export function defaultAwayTeam(): TeamProfile {
  return cloneStandardTeam("away", "Away");
}
