#!/usr/bin/env python3
"""MoD dismissal frequency trends + optimal average pricing (gender x format)."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909 (3).xlsx")
OUT = ROOT / "lib" / "data-analysis" / "mod-frequency-pricing.json"

TARGET_MARGIN = 0.075
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
]


def round_or_none(v: float | None, nd: int = 2) -> float | None:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return round(float(v), nd)


def margin_pct(profit: float, stake: float) -> float | None:
    if stake <= 0:
        return None
    return profit / stake * 100.0


def simulate_margin(df: pd.DataFrame, odds_map: dict[str, float]) -> float:
    profit = 0.0
    for _, r in df.iterrows():
        s, o, d = float(r["stake"]), float(r["odds"]), float(r["profit"])
        sel = r["selection"]
        new_o = odds_map.get(sel, o)
        if d > 0:
            profit += s
        elif d < 0:
            profit += s * (1 - new_o)
        else:
            profit += d
    stake = float(df["stake"].sum())
    return profit / stake if stake else 0.0


def optimize_odds_scale(df: pd.DataFrame, target: float) -> dict[str, float]:
    """Per-selection odds scale to hit target margin (independent per selection)."""
    scales: dict[str, float] = {}
    for sel in SELECTIONS:
        sdf = df[df["selection"] == sel]
        if sdf.empty:
            scales[sel] = 1.0
            continue
        lo, hi = 0.5, 1.0

        def _margin_sel(sdf: pd.DataFrame, k: float) -> float:
            p = 0.0
            for _, r in sdf.iterrows():
                s, o, d = float(r["stake"]), float(r["odds"]), float(r["profit"])
                no = o * k
                if d > 0:
                    p += s
                elif d < 0:
                    p += s * (1 - no)
                else:
                    p += d
            st = float(sdf["stake"].sum())
            return p / st if st else 0.0

        for _ in range(60):
            mid = (lo + hi) / 2
            if _margin_sel(sdf, mid) > target:
                lo = mid
            else:
                hi = mid
        scales[sel] = round((lo + hi) / 2, 4)
    return scales


MIN_ODDS = 1.02
MAX_IMPLIED = 1 / MIN_ODDS


def joint_coherent_pricing(pi: dict[str, float], margin: float) -> dict[str, dict]:
    """Coherent book probs summing to 1+margin; cap favourite at max implied."""
    target = 1 + margin
    fc = "Fielder Catch"
    rest = [s for s in SELECTIONS if s != fc and pi.get(s, 0) > 0]
    p_fc = min(MAX_IMPLIED, pi.get(fc, 0) * (1 + margin))
    remain = max(0.0, target - p_fc)
    rest_pi = sum(pi[s] for s in rest)
    probs: dict[str, float] = {fc: p_fc}
    for s in rest:
        probs[s] = remain * pi[s] / rest_pi if rest_pi else 0.0
    rows = []
    for sel in SELECTIONS:
        if probs.get(sel, 0) <= 0:
            continue
        rows.append(
            {
                "selection": sel,
                "impliedPct": round(probs[sel] * 100, 2),
                "recommendedOdds": round(1 / probs[sel], 3),
            }
        )
    return {
        "impliedSumPct": round(sum(probs.values()) * 100, 2),
        "selections": rows,
    }


def proportional_pricing(pi: dict[str, float], margin: float) -> dict[str, float]:
    """Fair probs pi (sum=1) -> odds with overround; clamp to valid decimal odds."""
    raw = {sel: pi[sel] * (1 + margin) for sel in SELECTIONS if pi.get(sel, 0) > 0}
    # Clamp high-probability selections, redistribute excess overround to others
    clamped = {}
    excess = 0.0
    for sel, p in raw.items():
        if p > MAX_IMPLIED:
            excess += p - MAX_IMPLIED
            clamped[sel] = MAX_IMPLIED
        else:
            clamped[sel] = p
    others = [s for s in clamped if clamped[s] < MAX_IMPLIED]
    if excess > 0 and others:
        add = excess / len(others)
        for s in others:
            clamped[s] = min(MAX_IMPLIED, clamped[s] + add)
    return {sel: round(1 / clamped[sel], 3) if sel in clamped else None for sel in SELECTIONS}


def dismissal_events(df: pd.DataFrame) -> pd.DataFrame:
    """One row per dismissal outcome — dedupe punter wins on same ball."""
    wins = df[df["profit"] < 0].copy()
    keys = ["evnm", "inningsnumber", "over", "delivery"]
    present = [k for k in keys if k in wins.columns]
    if not present:
        return wins
    return wins.drop_duplicates(subset=present, keep="first")


def analyze_segment(df: pd.DataFrame, seg_id: str, label: str) -> dict:
    if df.empty:
        return {"id": seg_id, "label": label, "empty": True}

    wins = df[df["profit"] < 0].copy()
    events = dismissal_events(df)
    total_events = len(events)

    # Empirical dismissal frequency (one count per dismissal event)
    pi: dict[str, float] = {}
    for sel in SELECTIONS:
        pi[sel] = int((events["selection"] == sel).sum()) / total_events if total_events else 0.0

    # Current average offered odds (all bets)
    current: dict[str, dict] = {}
    for sel in SELECTIONS:
        sdf = df[df["selection"] == sel]
        if sdf.empty:
            current[sel] = {"bets": 0, "stake": 0, "avgOdds": None, "impliedPct": None, "marginPct": None}
            continue
        stake = float(sdf["stake"].sum())
        profit = float(sdf["profit"].sum())
        wavg = float((sdf["odds"] * sdf["stake"]).sum() / stake)
        current[sel] = {
            "bets": int(len(sdf)),
            "stake": round(stake, 2),
            "avgOdds": round(wavg, 3),
            "impliedPct": round_or_none(100 / wavg),
            "marginPct": round_or_none(margin_pct(profit, stake)),
            "outcomeSharePct": round(pi[sel] * 100, 2),
        }

    # Proportional fair pricing at target margin
    fair_odds = proportional_pricing(pi, TARGET_MARGIN)
    fair_implied = {
        sel: round_or_none(100 / fair_odds[sel]) if fair_odds.get(sel) else None for sel in SELECTIONS
    }
    implied_sum = round(sum(fair_implied[s] or 0 for s in SELECTIONS), 2)
    joint = joint_coherent_pricing(pi, TARGET_MARGIN)

    # Per-selection optimized scale (hit target margin on each selection's book independently)
    scales = optimize_odds_scale(df, TARGET_MARGIN)
    optimized_odds = {}
    optimized_implied = {}
    for sel in SELECTIONS:
        c = current[sel]["avgOdds"]
        if c and scales.get(sel):
            o = round(c * scales[sel], 3)
            optimized_odds[sel] = o
            optimized_implied[sel] = round_or_none(100 / o)
        else:
            optimized_odds[sel] = fair_odds.get(sel)
            optimized_implied[sel] = fair_implied.get(sel)

    opt_implied_sum = round(sum(optimized_implied.get(s) or 0 for s in SELECTIONS), 2)

    # Monthly trend: dismissal event share
    df["month"] = df["evsts"].dt.to_period("M").astype(str)
    events["month"] = events["evsts"].dt.to_period("M").astype(str)
    months = sorted(df["month"].unique())
    trend: list[dict] = []
    for m in months:
        mev = events[events["month"] == m]
        n = len(mev)
        point: dict = {"month": m, "totalWinStake": n}
        for sel in SELECTIONS:
            point[sel] = round(int((mev["selection"] == sel).sum()) / n * 100, 2) if n else 0.0
        trend.append(point)

    # Recent vs early trend (first half vs second half of window)
    mid = len(months) // 2
    early_months = set(months[: max(1, mid)])
    late_months = set(months[mid:])
    early_ev = events[events["month"].isin(early_months)]
    late_ev = events[events["month"].isin(late_months)]
    emerging: list[dict] = []
    for sel in SELECTIONS:
        e_n = len(early_ev)
        l_n = len(late_ev)
        e_share = int((early_ev["selection"] == sel).sum()) / e_n * 100 if e_n else 0
        l_share = int((late_ev["selection"] == sel).sum()) / l_n * 100 if l_n else 0
        delta = l_share - e_share
        if abs(delta) >= 1.5:
            emerging.append(
                {
                    "selection": sel,
                    "earlySharePct": round(e_share, 2),
                    "recentSharePct": round(l_share, 2),
                    "deltaPp": round(delta, 2),
                    "direction": "up" if delta > 0 else "down",
                }
            )
    emerging.sort(key=lambda x: abs(x["deltaPp"]), reverse=True)

    stake = float(df["stake"].sum())
    profit = float(df["profit"].sum())

    return {
        "id": seg_id,
        "label": label,
        "empty": False,
        "overall": {
            "bets": int(len(df)),
            "stake": round(stake, 2),
            "marginPct": round_or_none(margin_pct(profit, stake)),
            "outcomeSamples": int(total_events),
        },
        "currentPricing": [
            {
                "selection": sel,
                **current[sel],
            }
            for sel in SELECTIONS
            if current[sel]["bets"] > 0
        ],
        "empiricalFrequency": [
            {"selection": sel, "sharePct": round(pi[sel] * 100, 2)} for sel in SELECTIONS if pi[sel] > 0
        ],
        "jointPricing": {
            "method": "Coherent book — implied probabilities sum to 1 + margin",
            "targetMarginPct": TARGET_MARGIN * 100,
            **joint,
        },
        "recommendedPricing": {
            "method": "Per-selection fair odds + overround (may require min odds cap on favourite)",
            "targetMarginPct": TARGET_MARGIN * 100,
            "impliedSumPct": implied_sum,
            "selections": [
                {
                    "selection": sel,
                    "fairOdds": round_or_none(1 / pi[sel] if pi[sel] > 0 else None),
                    "recommendedOdds": fair_odds.get(sel),
                    "recommendedImpliedPct": fair_implied.get(sel),
                    "oddsScaleVsCurrent": round_or_none(
                        fair_odds[sel] / current[sel]["avgOdds"]
                        if fair_odds.get(sel) and current[sel]["avgOdds"]
                        else None
                    ),
                }
                for sel in SELECTIONS
                if pi.get(sel, 0) > 0
            ],
        },
        "optimizedPricing": {
            "method": "Per-selection odds scale to target margin on historical bets",
            "targetMarginPct": TARGET_MARGIN * 100,
            "impliedSumPct": opt_implied_sum,
            "selections": [
                {
                    "selection": sel,
                    "currentAvgOdds": current[sel]["avgOdds"],
                    "oddsScale": scales.get(sel),
                    "optimizedOdds": optimized_odds.get(sel),
                    "optimizedImpliedPct": optimized_implied.get(sel),
                    "currentMarginPct": current[sel]["marginPct"],
                }
                for sel in SELECTIONS
                if current[sel]["bets"] > 0
            ],
        },
        "monthlyTrend": trend,
        "emergingTrends": emerging,
    }


def load_df(src: Path) -> pd.DataFrame:
    df = pd.read_excel(src, sheet_name=0)
    df = df.rename(
        columns={
            "ufoid": "selection",
            "dstk": "stake",
            "dpl": "profit",
            "cusid": "bettorId",
        }
    )
    df["women"] = df["tournm"].astype(str).str.contains("Women", case=False, na=False)
    df["gender"] = df["women"].map({True: "women", False: "men"})
    df["evsts"] = pd.to_datetime(df["evsts"])
    df["stake"] = pd.to_numeric(df["stake"], errors="coerce")
    df["profit"] = pd.to_numeric(df["profit"], errors="coerce")
    df["odds"] = pd.to_numeric(df["odds"], errors="coerce")
    df["format"] = pd.to_numeric(df["format"], errors="coerce").fillna(0).astype(int)
    if "inningsnumber" in df.columns:
        df["inningsnumber"] = pd.to_numeric(df["inningsnumber"], errors="coerce")
    if "delivery" in df.columns:
        df["delivery"] = pd.to_numeric(df["delivery"], errors="coerce")
    return df


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not src.exists():
        raise SystemExit(f"Input not found: {src}")

    df = load_df(src)
    segments = []
    for gender, fmt, sid, label in SEGMENTS:
        sdf = df[(df["gender"] == gender) & (df["format"] == fmt)]
        segments.append(analyze_segment(sdf, sid, label))

    out = {
        "taskId": "mod-frequency-pricing",
        "title": "MoD dismissal frequency trends & optimal pricing",
        "sourceFile": src.name,
        "generatedAt": pd.Timestamp.now("UTC").isoformat(),
        "targetMarginPct": TARGET_MARGIN * 100,
        "methodology": {
            "frequency": "Dismissal events deduped by match/innings/over/delivery from punter-winning bets.",
            "proportionalPricing": "recommended_odds = 1 / (empirical_freq * (1 + margin)); implied probs sum to 1 + margin.",
            "optimizedPricing": "Per-selection odds scale on historical bets to achieve target margin.",
            "caveat": "Betting-derived frequencies; scorecard validation recommended. Caught split uses market selections.",
        },
        "segments": segments,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
