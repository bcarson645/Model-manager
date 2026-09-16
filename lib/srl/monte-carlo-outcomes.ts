/**
 * Delivery-outcome Monte Carlo for SRL Outcome Generator.
 * Compares Atlas-style extras path vs Auto (C#) sim multipliers on a shared base mix.
 */

export type OutcomeKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "6"
  | "W"
  | "1n"
  | "2n"
  | "5n"
  | "7n"
  | "1w"
  | "2w"
  | "3w"
  | "5w"
  | "1l"
  | "2l"
  | "3l"
  | "4l"
  | "1b"
  | "2b"
  | "3b"
  | "4b";

export const OUTCOME_ORDER: OutcomeKey[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "6",
  "W",
  "1w",
  "2w",
  "3w",
  "5w",
  "1n",
  "2n",
  "5n",
  "7n",
  "1l",
  "2l",
  "3l",
  "4l",
  "1b",
  "2b",
  "3b",
  "4b",
];

export const TEAM_RUNS: Record<OutcomeKey, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "6": 6,
  W: 0,
  "1n": 1,
  "2n": 2,
  "5n": 5,
  "7n": 7,
  "1w": 1,
  "2w": 2,
  "3w": 3,
  "5w": 5,
  "1l": 1,
  "2l": 2,
  "3l": 3,
  "4l": 4,
  "1b": 1,
  "2b": 2,
  "3b": 3,
  "4b": 4,
};

export type ProbMap = Record<string, number>;

export type ModelSide = "atlas" | "auto";

export type MonteCarloResult = {
  over: number;
  phase: 1 | 2 | 3;
  n: number;
  seed: number;
  atlas: SideResult;
  auto: SideResult;
};

export type SideResult = {
  probs: ProbMap;
  exactAvgRuns: number;
  exactPWicket: number;
  exactPBoundary: number;
  exactPDot: number;
  counts: Record<string, number>;
  mcAvgRuns: number;
  mcRates: Record<string, number>;
};

function phase(over: number): 1 | 2 | 3 {
  if (over > 16) return 3;
  if (over > 6) return 2;
  return 1;
}

function pick<T>(tuple: [T, T, T], p: 1 | 2 | 3): T {
  return tuple[p - 1];
}

function renorm(d: ProbMap): ProbMap {
  const s = Object.values(d).reduce((a, b) => a + b, 0);
  if (s <= 0) throw new Error("Probability sum is zero");
  const out: ProbMap = {};
  for (const [k, v] of Object.entries(d)) out[k] = v / s;
  return out;
}

function atlasExtrasMult(over: number): ProbMap {
  const p = phase(over);
  return {
    "1n": pick([0.003, 0.00175, 0.0023], p),
    "2n": pick([0.017, 0.013, 0.031], p),
    "5n": pick([0.0027027027027027024, 0.0004, 0.009], p),
    "7n": pick([0.001, 0.0002, 0.001979166666666667], p),
    "1w": pick([0.064, 0.037, 0.051], p),
    "2w": pick([0.0182, 0.01025, 0.01512], p),
    "3w": pick([0.0625, 0.03617, 0.04475], p),
    "1l": 0.034215,
    "2l": 0.011451,
    "3l": 0.016013,
    "4l": 0.01044,
    "1b": 0.004739,
    "2b": 0.002949,
    "3b": 0.008365,
    "4b": 0.007501,
    "5w": 0.002,
  };
}

function autoExtrasMult(over: number): ProbMap {
  const p = phase(over);
  return {
    "1n": pick([0.003, 0.00175, 0.0023], p),
    "2n": pick([0.017, 0.013, 0.031], p),
    "5n": pick([0.0027, 0.0004, 0.009], p),
    "7n": pick([0.001, 0.0002, 0.00197], p),
    "1w": pick([0.064, 0.037, 0.051], p),
    "2w": pick([0.018, 0.01, 0.015], p),
    "3w": pick([0.063, 0.036, 0.045], p),
    "1l": 0.034,
    "2l": 0.011,
    "3l": 0.016,
    "4l": 0.01,
    "1b": 0.005,
    "2b": 0.003,
    "3b": 0.008,
    "4b": 0.008,
    "5w": 0.002,
  };
}

/** Shared synthetic base before extras — bowl SR 0.29 wkts/over, opener-ish scoring. */
export function makeBaseForOver(over: number): ProbMap {
  const pW = 0.29 / 6;
  let raw: ProbMap;
  if (over <= 2) {
    raw = { "0": 0.38, "1": 0.32, "2": 0.07, "3": 0.01, "4": 0.12, "6": 0.04, W: pW };
  } else if (over <= 6) {
    raw = { "0": 0.33, "1": 0.34, "2": 0.08, "3": 0.01, "4": 0.13, "6": 0.05, W: pW };
  } else if (over <= 16) {
    raw = { "0": 0.3, "1": 0.36, "2": 0.09, "3": 0.015, "4": 0.12, "6": 0.055, W: pW };
  } else {
    raw = { "0": 0.26, "1": 0.3, "2": 0.1, "3": 0.02, "4": 0.16, "6": 0.09, W: pW };
  }
  return renorm(raw);
}

function carveExtras(initial: ProbMap, mult: ProbMap): ProbMap {
  const ex: ProbMap = {
    "1l": initial["1"] * mult["1l"],
    "2l": initial["2"] * mult["2l"],
    "3l": initial["3"] * mult["3l"],
    "4l": initial["4"] * mult["4l"],
    "1b": initial["1"] * mult["1b"],
    "2b": initial["2"] * mult["2b"],
    "3b": initial["3"] * mult["3b"],
    "4b": initial["4"] * mult["4b"],
    "1w": initial["1"] * mult["1w"],
    "2w": initial["2"] * mult["2w"],
    "3w": initial["3"] * mult["3w"],
    "5w": mult["5w"],
    "1n": initial["1"] * mult["1n"],
    "2n": initial["2"] * mult["2n"],
    "5n": initial["4"] * mult["5n"],
    "7n": initial["6"] * mult["7n"],
  };
  const final: ProbMap = {
    "0": initial["0"],
    "1": initial["1"] - ex["1l"] - ex["1b"] - ex["1w"] - ex["1n"],
    "2": initial["2"] - ex["2l"] - ex["2b"] - ex["2w"] - ex["2n"],
    "3": initial["3"] - ex["3l"] - ex["3b"] - ex["3w"],
    "4": initial["4"] - ex["4l"] - ex["4b"] - ex["5w"] - ex["5n"],
    "6": initial["6"] - ex["7n"],
    W: initial.W,
    ...ex,
  };
  for (const [k, v] of Object.entries(final)) {
    if (v < 0) final[k] = 0;
  }
  return renorm(final);
}

function applyAutoSimMultipliers(final: ProbMap): ProbMap {
  const out = { ...final };
  out["2"] *= 1.23;
  out["4"] *= 1.15;
  out["6"] *= 1.0;
  out.W *= 1.1;
  return renorm(out);
}

export function expectedRuns(probs: ProbMap): number {
  let e = 0;
  for (const [k, p] of Object.entries(probs)) {
    e += p * (TEAM_RUNS[k as OutcomeKey] ?? 0);
  }
  return e;
}

export function buildAtlasProbs(over: number): ProbMap {
  return carveExtras(makeBaseForOver(over), atlasExtrasMult(over));
}

export function buildAutoProbs(over: number): ProbMap {
  return applyAutoSimMultipliers(
    carveExtras(makeBaseForOver(over), autoExtrasMult(over)),
  );
}

/** Mulberry32 — deterministic, fast, fine for UI Monte Carlo. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleSide(probs: ProbMap, n: number, rng: () => number): SideResult {
  const keys = Object.keys(probs);
  const cum: number[] = [];
  let run = 0;
  for (const k of keys) {
    run += probs[k];
    cum.push(run);
  }

  const counts: Record<string, number> = {};
  for (const k of keys) counts[k] = 0;
  let totalRuns = 0;

  for (let i = 0; i < n; i++) {
    const u = rng();
    for (let j = 0; j < keys.length; j++) {
      if (u <= cum[j]) {
        const k = keys[j];
        counts[k] += 1;
        totalRuns += TEAM_RUNS[k as OutcomeKey] ?? 0;
        break;
      }
    }
  }

  const mcRates: Record<string, number> = {};
  for (const k of keys) mcRates[k] = counts[k] / n;

  return {
    probs,
    exactAvgRuns: expectedRuns(probs),
    exactPWicket: probs.W ?? 0,
    exactPBoundary: (probs["4"] ?? 0) + (probs["6"] ?? 0),
    exactPDot: probs["0"] ?? 0,
    counts,
    mcAvgRuns: totalRuns / n,
    mcRates,
  };
}

export function runMonteCarlo(opts: {
  over: number;
  n?: number;
  seed?: number;
}): MonteCarloResult {
  const over = Math.min(20, Math.max(1, Math.round(opts.over)));
  const n = opts.n ?? 1000;
  const seed = opts.seed ?? 42 + over;
  const atlasProbs = buildAtlasProbs(over);
  const autoProbs = buildAutoProbs(over);
  const rngA = mulberry32(seed);
  const rngB = mulberry32(seed);
  return {
    over,
    phase: phase(over),
    n,
    seed,
    atlas: sampleSide(atlasProbs, n, rngA),
    auto: sampleSide(autoProbs, n, rngB),
  };
}

export function phaseLabel(p: 1 | 2 | 3): string {
  return p === 1 ? "Powerplay" : p === 2 ? "Middle" : "Death";
}
