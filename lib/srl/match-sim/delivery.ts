/**
 * Player-aware delivery outcome probabilities for match simulation.
 * Uses Auto (C#) extras + sim multipliers; scales base mix by batter/bowler.
 */

import {
  buildAutoProbs,
  buildAtlasProbs,
  type ProbMap,
} from "@/lib/srl/monte-carlo-outcomes";
import type { BatterProfile, BowlerProfile } from "./types";

const REF_SR = 1.25;
const REF_ECON = 10.3;
const REF_BT = 24;
const REF_BOWL_SR = 0.29;

function renorm(d: ProbMap): ProbMap {
  const s = Object.values(d).reduce((a, b) => a + b, 0);
  if (s <= 0) throw new Error("zero probs");
  const out: ProbMap = {};
  for (const [k, v] of Object.entries(d)) out[k] = v / s;
  return out;
}

/**
 * Start from phase base (Auto or Atlas path), then nudge by matchup:
 * - higher batter sr.caz / lower bowler econ → more scoring
 * - higher bowl sr / lower bt.caz → more wickets
 */
export function deliveryProbs(opts: {
  over: number; // 1-based current over
  batter: BatterProfile;
  bowler: BowlerProfile;
  model: "auto" | "atlas";
  freeHit: boolean;
}): ProbMap {
  const base =
    opts.model === "auto"
      ? buildAutoProbs(opts.over)
      : buildAtlasProbs(opts.over);

  const scoreFactor =
    (opts.batter.srCaz / REF_SR) * (REF_ECON / Math.max(0.5, opts.bowler.econ));
  const wicketFactor =
    (opts.bowler.sr / REF_BOWL_SR) * (REF_BT / Math.max(1, opts.batter.btCaz));

  const out: ProbMap = { ...base };

  // Scale scoring outcomes
  for (const k of ["1", "2", "3", "4", "6", "1w", "2w", "3w", "5w", "1n", "2n", "5n", "7n", "1l", "2l", "3l", "4l", "1b", "2b", "3b", "4b"]) {
    if (out[k] != null) out[k] *= scoreFactor;
  }
  if (out.W != null) out.W *= wicketFactor;

  if (opts.freeHit) {
    out.W = 0;
  }

  // Absorb imbalance into dots
  const keys = Object.keys(out);
  let s = 0;
  for (const k of keys) if (k !== "0") s += out[k];
  out["0"] = Math.max(0.05, 1 - s);

  return renorm(out);
}

export function sampleOutcome(probs: ProbMap, rng: () => number): string {
  const keys = Object.keys(probs);
  let u = rng();
  let c = 0;
  for (const k of keys) {
    c += probs[k];
    if (u <= c) return k;
  }
  return keys[keys.length - 1] ?? "0";
}

export type DeliveryEffect = {
  outcome: string;
  teamRuns: number;
  isWicket: boolean;
  isTeamBall: boolean;
  isStrikeChange: boolean;
  isNoBall: boolean;
  isWide: boolean;
};

/** Mirror DeliveryOutcomeService.ConvertToDeliveryOutcome run/strike rules. */
export function interpretOutcome(outcome: string): DeliveryEffect {
  const isWicket = outcome[0] === "W" || outcome === "W";
  if (isWicket) {
    return {
      outcome,
      teamRuns: 0,
      isWicket: true,
      isTeamBall: true,
      isStrikeChange: false,
      isNoBall: false,
      isWide: false,
    };
  }

  const isNoBall = outcome.endsWith("n");
  const isWide = outcome.endsWith("w");
  const isBye = outcome.endsWith("b") && !outcome.endsWith("l"); // "1b"
  const isLegBye = outcome.endsWith("l");

  let runs = 0;
  if (/^\d+$/.test(outcome)) runs = Number(outcome);
  else if (outcome.length >= 1 && /\d/.test(outcome[0]!)) runs = Number(outcome[0]);
  else if (outcome.length >= 2 && /\d/.test(outcome[1]!)) runs = Number(outcome[1]);

  const automaticExtra = isNoBall || isWide ? 1 : 0;
  const strikeChangeRuns = isBye || isLegBye ? runs : runs - automaticExtra;

  return {
    outcome,
    teamRuns: runs,
    isWicket: false,
    isTeamBall: !(isNoBall || isWide),
    isStrikeChange: strikeChangeRuns % 2 === 1,
    isNoBall,
    isWide,
  };
}
