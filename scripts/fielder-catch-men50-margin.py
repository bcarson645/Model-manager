#!/usr/bin/env python3
"""Price correction for Men's 50-over Fielder Catch to achieve target margin."""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909 (3).xlsx")
TARGET_MARGIN = 0.05


def margin_at_odds_scale(df: pd.DataFrame, k: float) -> float:
    profit = 0.0
    for _, r in df.iterrows():
        s, o, d = float(r["dstk"]), float(r["odds"]), float(r["dpl"])
        if d >= 0:
            profit += s
        else:
            profit += s * (1 - k * o)
    stake = float(df["dstk"].sum())
    return profit / stake if stake else 0.0


def solve_scale(df: pd.DataFrame, target: float) -> float:
    lo, hi = 0.4, 1.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if margin_at_odds_scale(df, mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    df = pd.read_excel(src)
    df["women"] = df["tournm"].astype(str).str.contains("Women", case=False, na=False)
    seg = df[(~df["women"]) & (df["format"] == 50) & (df["ufoid"] == "Fielder Catch")].copy()
    seg["odds"] = pd.to_numeric(seg["odds"], errors="coerce")
    seg["dstk"] = pd.to_numeric(seg["dstk"], errors="coerce")
    seg["dpl"] = pd.to_numeric(seg["dpl"], errors="coerce")

    stake = float(seg["dstk"].sum())
    profit = float(seg["dpl"].sum())
    margin = profit / stake
    wavg_odds = float((seg["odds"] * seg["dstk"]).sum() / stake)
    punter_wins = (seg["dpl"] < 0).sum()
    punter_win_stake = float(seg.loc[seg["dpl"] < 0, "dstk"].sum())

    k = solve_scale(seg, TARGET_MARGIN)
    new_wavg = wavg_odds * k
    implied_now = 1 / wavg_odds
    implied_new = 1 / new_wavg
    overround_pp = (implied_new - implied_now) * 100

    print("Men's 50-over — Fielder Catch")
    print(f"  Bets: {len(seg):,}  |  Stake: £{stake:,.0f}  |  Book P/L: £{profit:,.0f}")
    print(f"  Actual book margin: {margin*100:.2f}%  |  Weighted avg odds: {wavg_odds:.2f}")
    print(f"  Punter win rate: {punter_wins/len(seg)*100:.1f}% of bets ({punter_win_stake/stake*100:.1f}% of stake)")
    print()
    print(f"Target: {TARGET_MARGIN*100:.0f}% book margin")
    print(f"  Required extra book profit: £{TARGET_MARGIN*stake - profit:,.0f}")
    print()
    print("Suggested correction (uniform odds scaling):")
    print(f"  Multiply all offered Fielder Catch prices by {k:.4f}")
    print(f"  Equivalent: shorten average odds {wavg_odds:.2f} → {new_wavg:.2f} ({(1-k)*100:.1f}% reduction)")
    print(f"  Implied probability: {implied_now*100:.2f}% → {implied_new*100:.2f}% (+{overround_pp:.2f}pp)")
    print(f"  Simulated margin at adjusted prices: {margin_at_odds_scale(seg, k)*100:.2f}%")


if __name__ == "__main__":
    main()
