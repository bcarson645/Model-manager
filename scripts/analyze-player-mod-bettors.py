#!/usr/bin/env python3
"""Player MoD in-play — Data Task 2: bettor-level performance & sharp-money patterns."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909 (3).xlsx")
OUT = ROOT / "lib" / "data-analysis" / "player-mod-task2.json"

TARGET_BOOK_MARGIN = 7.5
MIN_BETS_BETTOR = 40
MIN_STAKE_BETTOR = 1500.0
SHARP_PUNTER_ROI = 12.0  # punter ROI % — consistently beating book
WEAK_PUNTER_ROI = -12.0
BIG_BET_STAKE = 500.0
MIN_CELL_BETS = 8

FORMAT_META = {
    20: {"id": "t20", "label": "T20", "chartMaxOver": 20},
    50: {"id": "odi", "label": "ODI (50 overs)", "chartMaxOver": 50},
    280: {"id": "unlimited", "label": "Unlimited overs", "chartMaxOver": 100},
}

COL_MAP = {
    "ufoid": "selection",
    "dstk": "stake",
    "dpl": "profit",
    "cusid": "bettorId",
    "over": "over",
    "format": "format",
    "inningsnumber": "innings",
    "reduction": "reduced",
}


def margin_pct(profit: float, stake: float) -> float | None:
    if stake <= 0:
        return None
    return profit / stake * 100.0


def round_or_none(v: float | None, nd: int = 2) -> float | None:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return round(float(v), nd)


def agg_metrics(df: pd.DataFrame) -> dict:
    stake = float(df["stake"].sum())
    profit = float(df["profit"].sum())
    punter_pl = -profit
    return {
        "bets": int(len(df)),
        "stake": round(stake, 2),
        "bookProfit": round(profit, 2),
        "punterPl": round(punter_pl, 2),
        "bookMarginPct": round_or_none(margin_pct(profit, stake)),
        "punterRoiPct": round_or_none(punter_pl / stake * 100 if stake else None),
        "avgStake": round(float(df["stake"].mean()), 2),
        "bettors": int(df["bettorId"].nunique()),
    }


def bettor_summary(df: pd.DataFrame) -> pd.DataFrame:
    g = (
        df.groupby("bettorId")
        .agg(
            bets=("stake", "count"),
            stake=("stake", "sum"),
            book_profit=("profit", "sum"),
            avg_odds=("odds", "mean"),
        )
        .reset_index()
    )
    g["punter_pl"] = -g["book_profit"]
    g["punter_roi"] = g["punter_pl"] / g["stake"] * 100
    g["book_margin"] = g["book_profit"] / g["stake"] * 100
    return g


def bettor_records(g: pd.DataFrame, limit: int | None = None) -> list[dict]:
    rows = []
    for _, r in g.iterrows():
        rows.append(
            {
                "bettorId": int(r["bettorId"]),
                "bets": int(r["bets"]),
                "stake": round(float(r["stake"]), 2),
                "bookProfit": round(float(r["book_profit"]), 2),
                "punterPl": round(float(r["punter_pl"]), 2),
                "punterRoiPct": round(float(r["punter_roi"]), 2),
                "bookMarginPct": round(float(r["book_margin"]), 2),
                "avgOdds": round(float(r["avg_odds"]), 2),
            }
        )
    if limit:
        return rows[:limit]
    return rows


def segment_agg(df: pd.DataFrame, group_cols: list[str]) -> list[dict]:
    g = (
        df.groupby(group_cols)
        .agg(
            bets=("stake", "count"),
            stake=("stake", "sum"),
            profit=("profit", "sum"),
            bettors=("bettorId", "nunique"),
        )
        .reset_index()
    )
    rows = []
    for _, r in g.iterrows():
        item = {k: (int(r[k]) if k in ("over", "innings", "bettorId") else r[k]) for k in group_cols}
        if "bettorId" in item:
            item["bettorId"] = int(item["bettorId"])
        stake = float(r["stake"])
        profit = float(r["profit"])
        punter_pl = -profit
        item.update(
            {
                "bets": int(r["bets"]),
                "stake": round(stake, 2),
                "bookProfit": round(profit, 2),
                "punterPl": round(punter_pl, 2),
                "bookMarginPct": round_or_none(margin_pct(profit, stake)),
                "punterRoiPct": round_or_none(punter_pl / stake * 100 if stake else None),
                "bettors": int(r["bettors"]),
            }
        )
        rows.append(item)
    return rows


def selection_share(df: pd.DataFrame) -> list[dict]:
    total = float(df["stake"].sum())
    g = df.groupby("selection")["stake"].sum().reset_index()
    g["sharePct"] = g["stake"] / total * 100
    return [
        {
            "selection": r["selection"],
            "stake": round(float(r["stake"]), 2),
            "sharePct": round(float(r["sharePct"]), 2),
        }
        for _, r in g.sort_values("stake", ascending=False).iterrows()
    ]


def selection_metrics(df: pd.DataFrame) -> list[dict]:
    total = float(df["stake"].sum())
    rows = segment_agg(df, ["selection"])
    for row in rows:
        row["sharePct"] = round(row["stake"] / total * 100, 2) if total else 0
    return sorted(rows, key=lambda x: x["stake"], reverse=True)


def bet_history(df: pd.DataFrame) -> list[dict]:
    sort_col = "evsts" if "evsts" in df.columns else None
    ordered = df.sort_values(sort_col, ascending=False) if sort_col else df
    rows = []
    for _, r in ordered.iterrows():
        stake = float(r["stake"])
        profit = float(r["profit"])
        punter_pl = -profit
        event_at = None
        if sort_col and pd.notna(r["evsts"]):
            event_at = pd.Timestamp(r["evsts"]).isoformat()
        rows.append(
            {
                "eventAt": event_at,
                "eventName": str(r["evnm"])[:80] if "evnm" in r.index and pd.notna(r["evnm"]) else None,
                "selection": r["selection"],
                "over": int(r["over"]),
                "delivery": int(r["delivery"]) if "delivery" in r.index else None,
                "innings": int(r["innings"]) if "innings" in r.index else None,
                "odds": round(float(r["odds"]), 2),
                "stake": round(stake, 2),
                "bookProfit": round(profit, 2),
                "punterPl": round(punter_pl, 2),
                "reduced": str(r["reduced"]) if "reduced" in r.index else None,
            }
        )
    return rows


def build_sharp_bettor_detail(bdf: pd.DataFrame, summary_row: pd.Series, chart_max: int) -> dict:
    bid = int(summary_row["bettorId"])
    by_over = sorted(segment_agg(bdf, ["over"]), key=lambda x: x["over"])
    return {
        "bettorId": bid,
        "summary": {
            "bettorId": bid,
            "bets": int(summary_row["bets"]),
            "stake": round(float(summary_row["stake"]), 2),
            "bookProfit": round(float(summary_row["book_profit"]), 2),
            "punterPl": round(float(summary_row["punter_pl"]), 2),
            "punterRoiPct": round(float(summary_row["punter_roi"]), 2),
            "bookMarginPct": round(float(summary_row["book_margin"]), 2),
            "avgOdds": round(float(summary_row["avg_odds"]), 2),
        },
        "bySelection": selection_metrics(bdf),
        "byOver": [r for r in by_over if r["over"] <= chart_max],
        "bySelectionOver": sorted(
            segment_agg(bdf, ["selection", "over"]),
            key=lambda x: (-x["stake"], x["selection"], x["over"]),
        ),
        "byInnings": segment_agg(bdf, ["innings"]),
        "chartByOver": [r for r in by_over if r["over"] <= chart_max],
        "bets": bet_history(bdf),
    }


def analyze_format(fdf: pd.DataFrame, meta: dict) -> dict:
    summary = bettor_summary(fdf)
    qualified = summary[
        (summary["bets"] >= MIN_BETS_BETTOR) & (summary["stake"] >= MIN_STAKE_BETTOR)
    ].copy()

    sharps = qualified[qualified["punter_roi"] >= SHARP_PUNTER_ROI].sort_values(
        "punter_roi", ascending=False
    )
    weak = qualified[qualified["punter_roi"] <= WEAK_PUNTER_ROI].sort_values("punter_roi")

    sharp_ids = set(sharps["bettorId"].tolist())
    sharp_df = fdf[fdf["bettorId"].isin(sharp_ids)]
    other_df = fdf[~fdf["bettorId"].isin(sharp_ids)]

    big = fdf[fdf["stake"] >= BIG_BET_STAKE].copy()
    big = big.merge(
        summary[["bettorId", "bets", "punter_roi", "book_margin"]],
        on="bettorId",
        how="left",
    )
    big["book_lost"] = big["profit"] < 0
    big_attribution = []
    for _, r in big.sort_values("stake", ascending=False).head(40).iterrows():
        big_attribution.append(
            {
                "bettorId": int(r["bettorId"]),
                "selection": r["selection"],
                "over": int(r["over"]),
                "stake": round(float(r["stake"]), 2),
                "bookProfit": round(float(r["profit"]), 2),
                "bookLost": bool(r["profit"] < 0),
                "bettorLifetimeBets": int(r["bets"]),
                "bettorLifetimeRoiPct": round(float(r["punter_roi"]), 2),
                "interpretation": (
                    "Sharp — wins overall"
                    if r["punter_roi"] >= SHARP_PUNTER_ROI
                    else "One-off or losing overall"
                    if r["punter_roi"] <= 0
                    else "Mixed lifetime record"
                ),
            }
        )

    sharp_hotspots = []
    if not sharp_df.empty:
        cell = (
            sharp_df.groupby(["selection", "over"])
            .agg(bets=("stake", "count"), stake=("stake", "sum"), profit=("profit", "sum"))
            .reset_index()
        )
        cell = cell[(cell["bets"] >= MIN_CELL_BETS) & (cell["stake"] >= 800)]
        cell["punter_roi"] = -cell["profit"] / cell["stake"] * 100
        for _, r in cell.sort_values("punter_roi", ascending=False).head(25).iterrows():
            sharp_hotspots.append(
                {
                    "selection": r["selection"],
                    "over": int(r["over"]),
                    "bets": int(r["bets"]),
                    "stake": round(float(r["stake"]), 2),
                    "punterRoiPct": round(float(r["punter_roi"]), 2),
                    "bookMarginPct": round(float(-r["profit"] / r["stake"] * 100), 2),
                }
            )

    sharp_coldspots = []
    if not sharp_df.empty:
        cell2 = (
            sharp_df.groupby(["selection", "over"])
            .agg(bets=("stake", "count"), stake=("stake", "sum"), profit=("profit", "sum"))
            .reset_index()
        )
        cell2 = cell2[(cell2["bets"] >= MIN_CELL_BETS) & (cell2["stake"] >= 800)]
        cell2["punter_roi"] = -cell2["profit"] / cell2["stake"] * 100
        for _, r in cell2.sort_values("punter_roi").head(15).iterrows():
            sharp_coldspots.append(
                {
                    "selection": r["selection"],
                    "over": int(r["over"]),
                    "bets": int(r["bets"]),
                    "stake": round(float(r["stake"]), 2),
                    "punterRoiPct": round(float(r["punter_roi"]), 2),
                }
            )

    over_sharp = segment_agg(sharp_df, ["over"]) if not sharp_df.empty else []
    over_other = segment_agg(other_df, ["over"]) if not other_df.empty else []
    over_all = segment_agg(fdf, ["over"])

    chart_max = meta["chartMaxOver"]
    over_sharp = [r for r in over_sharp if r["over"] <= chart_max]
    over_other = [r for r in over_other if r["over"] <= chart_max]
    over_all = [r for r in over_all if r["over"] <= chart_max]

    return {
        "formatCode": int(fdf["format"].iloc[0]),
        "id": meta["id"],
        "label": meta["label"],
        "chartMaxOver": chart_max,
        "overall": agg_metrics(fdf),
        "bettorUniverse": {
            "totalBettors": int(fdf["bettorId"].nunique()),
            "qualifiedBettors": int(len(qualified)),
            "sharpBettors": int(len(sharps)),
            "weakBettors": int(len(weak)),
        },
        "topSharpBettors": bettor_records(sharps, 20),
        "topWeakBettors": bettor_records(weak, 15),
        "bigBetAttribution": big_attribution,
        "bigBetSummary": {
            "count": int(len(big)),
            "bookLostCount": int((big["profit"] < 0).sum()),
            "avgBettorRoiWhenBookLost": round_or_none(
                float(big[big["profit"] < 0]["punter_roi"].mean())
                if (big["profit"] < 0).any()
                else None
            ),
            "pctBookLostFromSharps": round_or_none(
                float(
                    big[(big["profit"] < 0) & (big["punter_roi"] >= SHARP_PUNTER_ROI)].shape[0]
                    / max(1, (big["profit"] < 0).sum())
                    * 100
                )
            ),
        },
        "sharpPreferences": {
            "sharp": selection_share(sharp_df) if not sharp_df.empty else [],
            "others": selection_share(other_df) if not other_df.empty else [],
        },
        "sharpHotspots": sharp_hotspots,
        "sharpColdspots": sharp_coldspots,
        "marginByOver": {
            "allBettors": over_all,
            "sharpBettors": over_sharp,
            "otherBettors": over_other,
        },
        "sharpByInnings": segment_agg(sharp_df, ["innings"]) if not sharp_df.empty else [],
        "sharpBettorDetails": [
            build_sharp_bettor_detail(
                fdf[fdf["bettorId"] == bid],
                sharps[sharps["bettorId"] == bid].iloc[0],
                chart_max,
            )
            for bid in sharps["bettorId"].head(20).tolist()
        ],
    }


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not src.exists():
        raise SystemExit(f"Input not found: {src}")

    raw = pd.read_excel(src, sheet_name=0)
    raw = raw.rename(columns=COL_MAP)
    raw["odds"] = raw["odds"].astype(float)

    formats_out = []
    for fmt_code, meta in FORMAT_META.items():
        fdf = raw[raw["format"] == fmt_code].copy()
        if fdf.empty:
            continue
        formats_out.append(analyze_format(fdf, meta))

    summary_all = bettor_summary(raw)
    qualified_all = summary_all[
        (summary_all["bets"] >= MIN_BETS_BETTOR) & (summary_all["stake"] >= MIN_STAKE_BETTOR)
    ]

    payload = {
        "taskId": "data-task-2",
        "title": "Player MoD in-play — bettor sharp-money analysis",
        "sourceFile": src.name,
        "generatedAt": pd.Timestamp.now("UTC").isoformat(),
        "thresholds": {
            "minBetsBettor": MIN_BETS_BETTOR,
            "minStakeBettor": MIN_STAKE_BETTOR,
            "sharpPunterRoiPct": SHARP_PUNTER_ROI,
            "weakPunterRoiPct": WEAK_PUNTER_ROI,
            "bigBetStake": BIG_BET_STAKE,
            "targetBookMarginPct": TARGET_BOOK_MARGIN,
        },
        "glossary": {
            "bettorId": "Customer ID (cusid) — unique bettor.",
            "punterRoiPct": "Bettor profit ÷ stake × 100. Positive = bettor winning vs book.",
            "bookMarginPct": "Book profit ÷ stake × 100. Target ~7.5% if pricing efficient.",
            "sharp": f"Bettor with ≥{MIN_BETS_BETTOR} bets, ≥£{MIN_STAKE_BETTOR:.0f} stake, punter ROI ≥{SHARP_PUNTER_ROI}%.",
        },
        "overall": {
            **agg_metrics(raw),
            "totalBettors": int(raw["bettorId"].nunique()),
            "qualifiedBettors": int(len(qualified_all)),
            "dateRange": {
                "from": raw["evsts"].min().isoformat() if "evsts" in raw.columns else None,
                "to": raw["evsts"].max().isoformat() if "evsts" in raw.columns else None,
            },
        },
        "formats": formats_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(raw)} bets, {raw['bettorId'].nunique()} bettors)")


if __name__ == "__main__":
    main()
