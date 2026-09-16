#!/usr/bin/env python3
"""
MoD portfolio pricing — optimal trader adjusts (renormalise like FirstDismissal / PM I45–I51)
to hit target book margin on total stake, per gender×format segment.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909 (3).xlsx")
OUT = ROOT / "lib" / "data-analysis" / "mod-portfolio-pricing.json"

TARGET_MARGIN = 0.06
SELECTIONS = [
    "Fielder Catch",
    "Keeper Catch",
    "Bowled",
    "LBW",
    "Run Out",
    "Stumped",
    "Other",
]

SEGMENTS = [
    ("men", 50, "men-odi", "Men's ODI"),
    ("women", 50, "women-odi", "Women's ODI"),
    ("men", 20, "men-t20", "Men's T20"),
    ("women", 20, "women-t20", "Women's T20"),
    ("men", 280, "men-fc", "Men's FC (280)"),
]


def published_probs(base: list[float], adjusts: list[float]) -> list[float]:
    weights = [max(1e-6, b + a / 100.0) for b, a in zip(base, adjusts)]
    total = sum(weights)
    return [w / total for w in weights]


def build_odds_map(
    base: list[float], adjusts: list[float], current_odds: list[float]
) -> dict[str, float]:
    """Scale offered odds inversely with renorm prob change (constant overround structure)."""
    new_p = published_probs(base, adjusts)
    odds_map = {}
    for i, sel in enumerate(SELECTIONS):
        if current_odds[i] and current_odds[i] > 1 and base[i] > 0:
            scaled = current_odds[i] * (base[i] / new_p[i])
            odds_map[sel] = round(max(1.01, scaled), 3)
        else:
            odds_map[sel] = round(max(1.01, current_odds[i] or 1.01), 3)
    return odds_map


def simulate_margin_fast(df: pd.DataFrame, odds_map: dict[str, float]) -> float:
    mapped = df["selection"].map(odds_map).fillna(df["odds"])
    win = df["profit"] < 0
    lose = df["profit"] > 0
    profit = (
        df["stake"].where(lose, 0)
        + (df["stake"] * (1 - mapped)).where(win, 0)
        + df["profit"].where(~win & ~lose, 0)
    ).sum()
    stake = float(df["stake"].sum())
    return float(profit) / stake if stake else 0.0


def current_offer_stats(df: pd.DataFrame) -> tuple[list[float], list[float]]:
    """Fair probs (sum=1) and stake-weighted avg odds per selection."""
    implied_raw = []
    avg_odds = []
    for sel in SELECTIONS:
        sdf = df[df["selection"] == sel]
        if sdf.empty:
            implied_raw.append(0.0)
            avg_odds.append(1.01)
            continue
        stake = float(sdf["stake"].sum())
        wavg = float((sdf["odds"] * sdf["stake"]).sum() / stake)
        avg_odds.append(wavg)
        implied_raw.append(1 / wavg if wavg > 0 else 0.0)
    total = sum(implied_raw)
    if total <= 0:
        fair = [1 / len(SELECTIONS)] * len(SELECTIONS)
    else:
        fair = [x / total for x in implied_raw]
    return fair, avg_odds


def stake_mix(df: pd.DataFrame) -> dict[str, float]:
    total = float(df["stake"].sum())
    return {
        sel: round(float(df.loc[df["selection"] == sel, "stake"].sum()) / total * 100, 2)
        if total
        else 0.0
        for sel in SELECTIONS
    }


def margin_for_adjusts(
    df: pd.DataFrame, base: list[float], adjusts: list[float], current_odds: list[float]
) -> float:
    odds_map = build_odds_map(base, adjusts, current_odds)
    return simulate_margin_fast(df, odds_map)


def actual_margin(df: pd.DataFrame) -> float:
    stake = float(df["stake"].sum())
    return float(df["profit"].sum()) / stake if stake else 0.0


def search_fc_only(
    df: pd.DataFrame, base: list[float], current_odds: list[float], target: float
) -> tuple[float, float]:
    best_i, best_m = 0.0, margin_for_adjusts(df, base, [0.0] * len(SELECTIONS), current_odds)
    for i45 in range(-20, 81):
        m = margin_for_adjusts(df, base, [float(i45)] + [0.0] * (len(SELECTIONS) - 1), current_odds)
        if abs(m - target) < abs(best_m - target):
            best_i, best_m = float(i45), m
    return best_i, best_m


def search_paired(
    df: pd.DataFrame, base: list[float], current_odds: list[float], target: float
) -> list[dict]:
    results = []
    for j in range(1, len(SELECTIONS)):
        best_d, best_m = 0, margin_for_adjusts(df, base, [0.0] * len(SELECTIONS), current_odds)
        for d in range(-25, 26):
            adj = [0.0] * len(SELECTIONS)
            adj[0] = float(d)
            adj[j] = float(-d)
            m = margin_for_adjusts(df, base, adj, current_odds)
            if abs(m - target) < abs(best_m - target):
                best_d, best_m = d, m
        if best_d != 0:
            results.append(
                {
                    "pattern": f"I45={best_d:+d}, row{45+j}={-best_d:+d} ({SELECTIONS[j]})",
                    "fcAdjust": best_d,
                    "otherAdjust": -best_d,
                    "otherSelection": SELECTIONS[j],
                    "simulatedMarginPct": round(best_m * 100, 2),
                }
            )
    results.sort(key=lambda x: abs(x["simulatedMarginPct"] - target * 100))
    return results[:3]


def refine_all(
    df: pd.DataFrame,
    base: list[float],
    current_odds: list[float],
    start: list[float],
    target: float,
) -> tuple[list[float], float]:
    adjusts = start[:]
    best_m = margin_for_adjusts(df, base, adjusts, current_odds)
    for _ in range(4):
        for i in range(len(SELECTIONS)):
            for delta in (-4, -3, -2, -1, 1, 2, 3, 4):
                trial = adjusts[:]
                trial[i] += delta
                m = margin_for_adjusts(df, base, trial, current_odds)
                if abs(m - target) < abs(best_m - target):
                    adjusts = trial
                    best_m = m
    return adjusts, best_m


def analyze_segment(df: pd.DataFrame, seg_id: str, label: str) -> dict:
    if df.empty:
        return {"id": seg_id, "label": label, "empty": True}

    base, current_odds = current_offer_stats(df)
    mix = stake_mix(df)
    stake = float(df["stake"].sum())
    current_margin = actual_margin(df)
    sim_at_zero = margin_for_adjusts(df, base, [0.0] * len(SELECTIONS), current_odds)

    fc_i, fc_m = search_fc_only(df, base, current_odds, TARGET_MARGIN)
    start = [fc_i] + [0.0] * (len(SELECTIONS) - 1)
    opt_adjusts, opt_margin = refine_all(df, base, current_odds, start, TARGET_MARGIN)

    opt_probs = published_probs(base, opt_adjusts)
    opt_odds = build_odds_map(base, opt_adjusts, current_odds)
    paired = search_paired(df, base, current_odds, TARGET_MARGIN)

    opt_rows = []
    for i, sel in enumerate(SELECTIONS):
        opt_rows.append(
            {
                "selection": sel,
                "baseProbPct": round(base[i] * 100, 2),
                "adjustI": int(round(opt_adjusts[i])),
                "publishedProbPct": round(opt_probs[i] * 100, 2),
                "deltaProbPp": round((opt_probs[i] - base[i]) * 100, 2),
                "recommendedOdds": opt_odds.get(sel),
                "currentAvgOdds": round(current_odds[i], 3),
                "stakeSharePct": mix.get(sel, 0),
            }
        )

    transfer_to = [
        {"selection": SELECTIONS[i], "deltaProbPp": round((opt_probs[i] - base[i]) * 100, 2)}
        for i in range(1, len(SELECTIONS))
        if abs(opt_probs[i] - base[i]) > 1e-6
    ]
    transfer_to.sort(key=lambda x: x["deltaProbPp"], reverse=True)

    notes = []
    if mix.get("Fielder Catch", 0) > 70:
        notes.append(f"{mix['Fielder Catch']:.0f}% of stake is Fielder Catch — I45 is the primary margin lever.")
    if opt_adjusts[0] > 0:
        notes.append(
            f"Raise FC weight: I45 ≈ {int(round(opt_adjusts[0]))} (shortens FC odds; other methods lengthen via renorm)."
        )
    for row in opt_rows[1:]:
        if row["adjustI"] < 0:
            notes.append(f"Pair down {row['selection']}: I ≈ {row['adjustI']} to fund FC shift without inflating overround.")

    return {
        "id": seg_id,
        "label": label,
        "empty": False,
        "overall": {
            "bets": int(len(df)),
            "stake": round(stake, 2),
            "currentMarginPct": round(current_margin * 100, 2),
            "targetMarginPct": TARGET_MARGIN * 100,
            "optimizedMarginPct": round(opt_margin * 100, 2),
            "fcOnlyMarginPct": round(fc_m * 100, 2),
            "simAtZeroAdjustPct": round(sim_at_zero * 100, 2),
            "impliedOverroundPct": round((sum(1 / o for o in current_odds if o > 1) - 1) * 100, 2),
        },
        "stakeMixPct": mix,
        "optimalAdjusts": opt_rows,
        "probabilityTransfer": {
            "fielderCatchDeltaPp": round((opt_probs[0] - base[0]) * 100, 2),
            "toOtherSelections": transfer_to,
        },
        "pairedAdjustAlternatives": paired,
        "formatNotes": notes,
        "renormFormula": "weight[i]=baseProb[i]+I[i]/100; published=weight/sum(weights); newOdds[i]≈currentOdds[i]×(base[i]/published[i])",
    }


def load_df(src: Path) -> pd.DataFrame:
    df = pd.read_excel(src, sheet_name=0)
    df = df.rename(columns={"ufoid": "selection", "dstk": "stake", "dpl": "profit"})
    df["women"] = df["tournm"].astype(str).str.contains("Women", case=False, na=False)
    df["gender"] = df["women"].map({True: "women", False: "men"})
    for col in ("stake", "profit", "odds"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["format"] = pd.to_numeric(df["format"], errors="coerce").fillna(0).astype(int)
    return df


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not src.exists():
        raise SystemExit(f"Input not found: {src}")

    df = load_df(src)
    segments = [
        analyze_segment(df[(df["gender"] == g) & (df["format"] == f)], sid, lbl)
        for g, f, sid, lbl in SEGMENTS
    ]

    out = {
        "taskId": "mod-portfolio-pricing",
        "title": "MoD portfolio adjust optimisation",
        "sourceFile": src.name,
        "generatedAt": pd.Timestamp.now("UTC").isoformat(),
        "targetMarginPct": TARGET_MARGIN * 100,
        "modelParity": "FirstDismissal.cs / PM I45–I51: adjust÷100 then renormalise.",
        "segments": segments,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    for s in segments:
        if not s.get("empty"):
            o = s["overall"]
            i45 = s["optimalAdjusts"][0]["adjustI"]
            print(f"  {s['label']}: {o['currentMarginPct']}% -> {o['optimizedMarginPct']}% (I45={i45})")


if __name__ == "__main__":
    main()
