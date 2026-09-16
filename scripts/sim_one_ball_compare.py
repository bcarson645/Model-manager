"""
Monte Carlo: one delivery x 1000 — Atlas vs Auto post-processing.

Uses a shared base (pre-extras) outcome mix so the comparison isolates
known code differences in DeliveryOutcomeService vs Atlas Pricing/Support.

Atlas path: extras (Atlas coeffs) → optional Factor-1 RPB rebalance → sample
Auto path:  extras (C# coeffs) → sim multipliers (2*1.23, 4*1.15, W*1.1) → renorm → sample
"""
from __future__ import annotations

import random
from collections import Counter
from typing import Dict, Tuple

RUNS = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "6": 6,
    "W": 0,
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
}


def phase(over: int) -> int:
    # Atlas E1648 / C#: 1=PP (<=6), 2=middle, 3=death (>16)
    if over > 16:
        return 3
    if over > 6:
        return 2
    return 1


def atlas_extras_mult(over: int) -> Dict[str, float]:
    p = phase(over)
    # (pp, middle, death) matching Pricing C1660:C1678
    table = {
        "1n": (0.003, 0.00175, 0.0023),
        "2n": (0.017, 0.013, 0.031),
        "5n": (0.0027027027027027024, 0.0004, 0.009),
        "7n": (0.001, 0.0002, 0.001979166666666667),
        "1w": (0.064, 0.037, 0.051),
        "2w": (0.0182, 0.01025, 0.01512),
        "3w": (0.0625, 0.03617, 0.04475),
        "1l": 0.034215,
        "2l": 0.011451,
        "3l": 0.016013,
        "4l": 0.01044,
        "1b": 0.004739,
        "2b": 0.002949,
        "3b": 0.008365,
        "4b": 0.007501,
        "5w": 0.002,
    }
    out = {}
    for k, v in table.items():
        out[k] = v[p - 1] if isinstance(v, tuple) else v
    return out


def csharp_extras_mult(over: int) -> Dict[str, float]:
    p = phase(over)
    table = {
        "1n": (0.003, 0.00175, 0.0023),
        "2n": (0.017, 0.013, 0.031),
        "5n": (0.0027, 0.0004, 0.009),
        "7n": (0.001, 0.0002, 0.00197),
        "1w": (0.064, 0.037, 0.051),
        "2w": (0.018, 0.010, 0.015),
        "3w": (0.063, 0.036, 0.045),
        "1l": 0.034,
        "2l": 0.011,
        "3l": 0.016,
        "4l": 0.010,
        "1b": 0.005,
        "2b": 0.003,
        "3b": 0.008,
        "4b": 0.008,
        "5w": 0.002,
    }
    out = {}
    for k, v in table.items():
        out[k] = v[p - 1] if isinstance(v, tuple) else v
    return out


def carve_extras(initial: Dict[str, float], mult: Dict[str, float]) -> Dict[str, float]:
    """Mirror FillExtras + FillFinal before sim multipliers / Factor 1."""
    ex = {
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
    }
    final = {
        "0": initial["0"],
        "1": initial["1"] - ex["1l"] - ex["1b"] - ex["1w"] - ex["1n"],
        "2": initial["2"] - ex["2l"] - ex["2b"] - ex["2w"] - ex["2n"],
        "3": initial["3"] - ex["3l"] - ex["3b"] - ex["3w"],
        "4": initial["4"] - ex["4l"] - ex["4b"] - ex["5w"] - ex["5n"],
        "6": initial["6"] - ex["7n"],
        "W": initial["W"],
    }
    final.update(ex)
    # clamp tiny negatives from over-carve
    for k, v in list(final.items()):
        if v < 0:
            final[k] = 0.0
    return final


def renorm(d: Dict[str, float]) -> Dict[str, float]:
    s = sum(d.values())
    return {k: v / s for k, v in d.items()}


def apply_auto_sim_multipliers(final: Dict[str, float]) -> Dict[str, float]:
    out = dict(final)
    out["2"] *= 1.23
    out["4"] *= 1.15  # FourVolumeAdjust
    out["6"] *= 1.0  # SixVolumeAdjust
    out["W"] *= 1.1
    return renorm(out)


def expected_runs(probs: Dict[str, float]) -> float:
    return sum(probs[k] * RUNS.get(k, 0) for k in probs)


def implied_rpb_excluding_wickets(probs: Dict[str, float]) -> float:
    """Rough RPB from non-wicket mass (Atlas AL65-style idea)."""
    non_w = {k: v for k, v in probs.items() if k != "W"}
    s = sum(non_w.values())
    if s <= 0:
        return 0.0
    return sum(non_w[k] * RUNS.get(k, 0) for k in non_w) / s


def atlas_factor1_rebalance(probs: Dict[str, float], target_rpb: float, max_dot: float) -> Dict[str, float]:
    """
    Simplified Support Factor-1:
    - scale all non-dot, non-wicket outcomes by factor = target/implied
    - dots = residual, floored at max_dot
    - wickets unchanged in absolute mass then renorm
    """
    w = probs.get("W", 0.0)
    scoring_keys = [k for k in probs if k not in ("0", "W")]
    scoring_mass = sum(probs[k] for k in scoring_keys)
    if scoring_mass <= 0:
        return renorm(probs)

    # implied RPB on full distribution
    cur = expected_runs(probs)
    # If already at target, factor ~ 1
    factor = 1.0 if cur <= 1e-12 else target_rpb / cur

    out = {"W": w}
    for k in scoring_keys:
        out[k] = probs[k] * factor
    # residual dots
    used = sum(out.values())
    dots = max(1.0 - used, max_dot * (1.0 - w))  # soft floor scaled by non-wicket room
    # Prefer exact residual if above floor
    residual = 1.0 - used
    out["0"] = residual if residual >= max_dot * (1 - w) else max_dot * (1 - w)
    return renorm(out)


def sample(probs: Dict[str, float], n: int, rng: random.Random) -> Tuple[Counter, float]:
    keys = list(probs.keys())
    weights = [probs[k] for k in keys]
    # cumulative
    cum = []
    t = 0.0
    for w in weights:
        t += w
        cum.append(t)
    counts: Counter = Counter()
    total_runs = 0.0
    for _ in range(n):
        u = rng.random()
        for k, c in zip(keys, cum):
            if u <= c:
                counts[k] += 1
                total_runs += RUNS.get(k, 0)
                break
    return counts, total_runs / n


def make_base_for_over(over: int) -> Dict[str, float]:
    """
    Shared synthetic base (0/1/2/3/4/6/W) before extras.
    Calibrated loosely to:
      - opener sr.caz ~ 1.30
      - bowling SR 0.29 wickets/over → ~0.048/ball
      - econ 10.3 → ~1.72 RPB if all legal balls; blend toward batter SR
    Phase shaping mirrors typical T20 (colder PP dots, hotter death).
    """
    p_w = 0.29 / 6.0  # ~0.0483
    if over <= 2:
        # cold powerplay start — matches screenshot deficit shape
        raw = {"0": 0.38, "1": 0.32, "2": 0.07, "3": 0.01, "4": 0.12, "6": 0.04, "W": p_w}
    elif over <= 6:
        raw = {"0": 0.33, "1": 0.34, "2": 0.08, "3": 0.01, "4": 0.13, "6": 0.05, "W": p_w}
    elif over <= 16:
        raw = {"0": 0.30, "1": 0.36, "2": 0.09, "3": 0.015, "4": 0.12, "6": 0.055, "W": p_w}
    else:
        raw = {"0": 0.26, "1": 0.30, "2": 0.10, "3": 0.02, "4": 0.16, "6": 0.09, "W": p_w}

    # Ensure 0 includes room after W already separated (C# subtracts W from 0)
    # Here W is already its own mass; 0 is pure dots. Renorm to 1.
    return renorm(raw)


def fmt_counts(counts: Counter, n: int, keys) -> str:
    lines = []
    for k in keys:
        c = counts.get(k, 0)
        lines.append(f"  {k:>3}: {c:4d}  ({100 * c / n:5.1f}%)")
    return "\n".join(lines)


def main():
    n = 1000
    overs = [1, 10, 19]  # PP / middle / death — one ball each context
    order = [
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
    ]

    # Max-dot floors from Support BB135+ (over -> floor)
    max_dot = {1: 0.38, 2: 0.35, 10: 0.17, 19: 0.18}

    print("=" * 72)
    print("ONE-BALL MONTE CARLO (n=1000) — shared base, Atlas vs Auto post-process")
    print("Note: workbook had #VALUE! without a loaded squad; this isolates known")
    print("pipeline differences using a shared synthetic base mix.")
    print("=" * 72)

    innings_delta = 0.0

    for over in overs:
        base = make_base_for_over(over)
        atlas_pre = carve_extras(base, atlas_extras_mult(over))
        atlas_pre = renorm(atlas_pre)

        # Atlas Factor 1 targeting expected RPB from over prediction proxy:
        # use expected runs of atlas_pre itself as "natural"; then also a
        # boosted target (+0.033 RPB ≈ +4/innings) to show Factor-1 effect.
        natural_rpb = expected_runs(atlas_pre)
        # Use Factor1=1 first (target = natural)
        atlas = atlas_factor1_rebalance(atlas_pre, target_rpb=natural_rpb, max_dot=max_dot.get(over, 0.2))

        auto_pre = carve_extras(base, csharp_extras_mult(over))
        auto = apply_auto_sim_multipliers(auto_pre)

        rng_a = random.Random(42 + over)
        rng_b = random.Random(42 + over)
        ca, ra = sample(atlas, n, rng_a)
        cb, rb = sample(auto, n, rng_b)

        ea, eb = expected_runs(atlas), expected_runs(auto)
        innings_delta += (eb - ea) * 6  # rough per-over contribution if this over's mix held

        print(f"\n--- Over {over} (phase {phase(over)}) ---")
        print(f"Exact E[runs/ball]:  Atlas={ea:.4f}   Auto={eb:.4f}   delta={eb - ea:+.4f}")
        print(f"MC   avg runs/ball:  Atlas={ra:.4f}   Auto={rb:.4f}   delta={rb - ra:+.4f}")
        print(f"Exact P(W):          Atlas={atlas['W']:.4f}   Auto={auto['W']:.4f}")
        print(f"Exact P(4)+P(6):     Atlas={atlas['4']+atlas['6']:.4f}   Auto={auto['4']+auto['6']:.4f}")
        print(f"Exact P(0):          Atlas={atlas['0']:.4f}   Auto={auto['0']:.4f}")
        print("MC outcome rates (Atlas):")
        print(fmt_counts(ca, n, order))
        print("MC outcome rates (Auto):")
        print(fmt_counts(cb, n, order))

    # Sensitivity: how cold must Auto base be, or how hot Factor1, to explain -4/innings
    print("\n" + "=" * 72)
    print("SENSITIVITY - explaining ~4 runs/innings low (~ -0.0333 runs/ball)")
    print("=" * 72)
    over = 10
    base = make_base_for_over(over)
    atlas_pre = renorm(carve_extras(base, atlas_extras_mult(over)))
    auto = apply_auto_sim_multipliers(carve_extras(base, csharp_extras_mult(over)))
    ea, eb = expected_runs(atlas_pre), expected_runs(auto)
    print(f"Same base, Factor1=1 vs Auto sim-multipliers: delta E[r/b]={eb - ea:+.4f}")
    print(f"  → per 120 balls: {(eb - ea) * 120:+.2f} runs (Auto − Atlas)")
    print("  (Auto sim multipliers alone usually RAISE runs slightly — they do not")
    print("   explain Auto being colder. Gap must be in base DeliveryResult rates")
    print("   and/or Atlas Factor-1 RPB catch-up.)")

    # Show Factor1 boost needed on Atlas side
    for boost in (0.0, 0.02, 0.0333, 0.05):
        target = expected_runs(atlas_pre) + boost
        atlas_hot = atlas_factor1_rebalance(atlas_pre, target, max_dot=0.17)
        d = expected_runs(auto) - expected_runs(atlas_hot)
        print(
            f"  If Atlas Factor1 targets +{boost:.4f} RPB: "
            f"Auto−Atlas = {d:+.4f}/ball ({d * 120:+.1f}/innings)"
        )

    # Cold Auto base: scale scoring down
    print("\nIf Auto base scoring outcomes scaled by k (W fixed), vs Atlas Factor1=1:")
    for k in (1.0, 0.97, 0.95, 0.93):
        cold = dict(base)
        for key in ("1", "2", "3", "4", "6"):
            cold[key] *= k
        # dump residual into dots
        s = sum(cold.values())
        cold["0"] += 1 - s if s < 1 else 0
        cold = renorm(cold)
        a = renorm(carve_extras(base, atlas_extras_mult(over)))
        b = apply_auto_sim_multipliers(carve_extras(cold, csharp_extras_mult(over)))
        d = expected_runs(b) - expected_runs(a)
        print(f"  k={k:.2f}: delta={d:+.4f}/ball ({d * 120:+.1f}/innings)")


if __name__ == "__main__":
    main()
