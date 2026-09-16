#!/usr/bin/env python3
"""Player method-of-dismissal in-play betting — Data Task 1 aggregates."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909.xlsx")
OUT = ROOT / "lib" / "data-analysis" / "player-mod-task1.json"

TARGET_MARGIN = 7.5
MIN_STAKE_CELL = 2500.0
MIN_BETS_CELL = 25
MARGIN_GAP_FLAG = 6.0  # pp away from 7.5% target

FORMAT_META = {
    20: {"id": "t20", "label": "T20", "chartMaxOver": 20},
    50: {"id": "odi", "label": "ODI (50 overs)", "chartMaxOver": 50},
    280: {"id": "unlimited", "label": "Unlimited overs", "chartMaxOver": 100},
}


def margin_pct(profit: float, stake: float) -> float | None:
    if stake <= 0:
        return None
    return profit / stake * 100.0


def flag_performance(m: float | None, stake: float, bets: int) -> str | None:
    if m is None or stake < MIN_STAKE_CELL or bets < MIN_BETS_CELL:
        return None
    gap = m - TARGET_MARGIN
    if gap <= -MARGIN_GAP_FLAG:
        return "under"
    if gap >= MARGIN_GAP_FLAG:
        return "over"
    return None


def agg_frame(df: pd.DataFrame, group_cols: list[str]) -> pd.DataFrame:
    g = (
        df.groupby(group_cols, dropna=False)
        .agg(
            bets=("Stake", "count"),
            stake=("Stake", "sum"),
            profit=("Profit", "sum"),
            avg_stake=("Stake", "mean"),
            avg_odds=("Odds", "mean"),
        )
        .reset_index()
    )
    g["margin_pct"] = g.apply(lambda r: margin_pct(r["profit"], r["stake"]), axis=1)
    g["margin_gap"] = g["margin_pct"] - TARGET_MARGIN
    g["flag"] = g.apply(
        lambda r: flag_performance(r["margin_pct"], r["stake"], int(r["bets"])),
        axis=1,
    )
    return g


def records_from_df(g: pd.DataFrame, extra_keys: list[str]) -> list[dict]:
    rows: list[dict] = []
    for _, r in g.iterrows():
        item = {k: r[k] for k in extra_keys}
        item.update(
            {
                "bets": int(r["bets"]),
                "stake": round(float(r["stake"]), 2),
                "profit": round(float(r["profit"]), 2),
                "marginPct": round(float(r["margin_pct"]), 2)
                if r["margin_pct"] is not None and not math.isnan(r["margin_pct"])
                else None,
                "marginGap": round(float(r["margin_gap"]), 2)
                if r["margin_gap"] is not None and not math.isnan(r["margin_gap"])
                else None,
                "avgStake": round(float(r["avg_stake"]), 2),
                "avgOdds": round(float(r["avg_odds"]), 2),
                "flag": r["flag"] if pd.notna(r["flag"]) else None,
            }
        )
        rows.append(item)
    return rows


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not src.exists():
        raise SystemExit(f"Input not found: {src}")

    df = pd.read_excel(src, sheet_name=0)
    df = df.rename(
        columns={
            "Over": "over",
            "Format": "format",
            "Selection": "selection",
            "Reduced?": "reduced",
        }
    )

    overall = {
        "bets": int(len(df)),
        "stake": round(float(df["Stake"].sum()), 2),
        "profit": round(float(df["Profit"].sum()), 2),
        "marginPct": round(margin_pct(df["Profit"].sum(), df["Stake"].sum()) or 0, 2),
        "dateRange": {
            "from": df["EventStart"].min().isoformat(),
            "to": df["EventStart"].max().isoformat(),
        },
        "selections": sorted(df["selection"].unique().tolist()),
    }

    formats_out: list[dict] = []
    for fmt_code, meta in FORMAT_META.items():
        fdf = df[df["format"] == fmt_code].copy()
        if fdf.empty:
            continue

        fmt_overall = {
            "bets": int(len(fdf)),
            "stake": round(float(fdf["Stake"].sum()), 2),
            "profit": round(float(fdf["Profit"].sum()), 2),
            "marginPct": round(margin_pct(fdf["Profit"].sum(), fdf["Stake"].sum()) or 0, 2),
        }

        by_sel_over = agg_frame(fdf, ["selection", "over"])
        by_over = agg_frame(fdf, ["over"])
        by_selection = agg_frame(fdf, ["selection"])
        by_innings = agg_frame(fdf, ["inningsnumber"])
        by_reduced = agg_frame(fdf, ["reduced"])
        stake_by_over = (
            fdf.groupby("over")["Stake"]
            .agg(["count", "mean", "sum"])
            .reset_index()
            .rename(columns={"count": "bets", "mean": "avgStake", "sum": "stake"})
        )

        flagged_under = (
            by_sel_over[by_sel_over["flag"] == "under"]
            .sort_values("margin_gap")
            .head(20)
        )
        flagged_over = (
            by_sel_over[by_sel_over["flag"] == "over"]
            .sort_values("margin_gap", ascending=False)
            .head(20)
        )

        chart_max = meta["chartMaxOver"]
        over_chart = by_over[by_over["over"] <= chart_max].sort_values("over")

        formats_out.append(
            {
                "formatCode": int(fmt_code),
                "id": meta["id"],
                "label": meta["label"],
                "chartMaxOver": chart_max,
                "overall": fmt_overall,
                "bySelection": records_from_df(by_selection, ["selection"]),
                "byOverSummary": records_from_df(by_over, ["over"]),
                "bySelectionOver": records_from_df(by_sel_over, ["selection", "over"]),
                "chartByOver": records_from_df(over_chart, ["over"]),
                "flaggedUnder": records_from_df(flagged_under, ["selection", "over"]),
                "flaggedOver": records_from_df(flagged_over, ["selection", "over"]),
                "byInnings": records_from_df(
                    by_innings.rename(columns={"inningsnumber": "innings"}),
                    ["innings"],
                ),
                "byReduced": records_from_df(by_reduced, ["reduced"]),
                "stakeProfileByOver": [
                    {
                        "over": int(r["over"]),
                        "bets": int(r["bets"]),
                        "avgStake": round(float(r["avgStake"]), 2),
                        "stake": round(float(r["stake"]), 2),
                    }
                    for _, r in stake_by_over[stake_by_over["over"] <= chart_max]
                    .sort_values("over")
                    .iterrows()
                ],
            }
        )

    payload = {
        "taskId": "data-task-1",
        "title": "Player MoD in-play — P/L by selection & over",
        "sourceFile": src.name,
        "generatedAt": pd.Timestamp.now("UTC").isoformat(),
        "targetMarginPct": TARGET_MARGIN,
        "significance": {
            "minStake": MIN_STAKE_CELL,
            "minBets": MIN_BETS_CELL,
            "marginGapFlag": MARGIN_GAP_FLAG,
            "note": "Flagged when margin deviates ≥6pp from 7.5% target with sufficient volume.",
        },
        "glossary": {
            "marginPct": "Book profit ÷ stake × 100. Target ~7.5% if model is efficient.",
            "over": "Current over of innings (column N).",
            "selection": "Method-of-dismissal market selection (column D).",
        },
        "overall": overall,
        "formats": formats_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(df)} bets, {len(formats_out)} formats)")


if __name__ == "__main__":
    main()
