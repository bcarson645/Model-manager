#!/usr/bin/env python3
"""Player MoD in-play — Data Task Part 2: gender × format × phase × selection."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"c:\Users\b.carson\Downloads\PlayerMoD0106To0909 (3).xlsx")
OUT = ROOT / "lib" / "data-analysis" / "player-mod-part2.json"

TARGET_MARGIN = 7.5
MIN_BETS_BETTOR = 40
MIN_STAKE_BETTOR = 1500.0
SHARP_PUNTER_ROI = 12.0
BIG_BET_STAKE = 500.0
MIN_PHASE_BETS = 5
STAKE_SPIKE_RATIO = 1.35  # vs format average stake

T20_PHASES = [
    (1, "Phase 1 (Ov 1–3)", 1, 3),
    (2, "Phase 2 (Ov 4–6)", 4, 6),
    (3, "Phase 3 (Ov 7–9)", 7, 9),
    (4, "Phase 4 (Ov 10–12)", 10, 12),
    (5, "Phase 5 (Ov 13–15)", 13, 15),
    (6, "Phase 6 (Ov 16–20)", 16, 20),
]

ODI_PHASES = [
    (1, "Phase 1 (Ov 1–10)", 1, 10),
    (2, "Phase 2 (Ov 11–20)", 11, 20),
    (3, "Phase 3 (Ov 21–30)", 21, 30),
    (4, "Phase 4 (Ov 31–40)", 31, 40),
    (5, "Phase 5 (Ov 41–50)", 41, 50),
]

SEGMENTS = [
    ("men", 20, "men-t20", "Men's T20"),
    ("men", 50, "men-odi", "Men's 50-over"),
    ("men", 280, "men-fc", "Men's FC (280)"),
    ("women", 20, "women-t20", "Women's T20"),
    ("women", 50, "women-odi", "Women's 50-over"),
]


def margin_pct(profit: float, stake: float) -> float | None:
    if stake <= 0:
        return None
    return profit / stake * 100.0


def round_or_none(v: float | None, nd: int = 2) -> float | None:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return round(float(v), nd)


def assign_phase(over: int, fmt: int) -> int | None:
    phases = T20_PHASES if fmt == 20 else ODI_PHASES if fmt == 50 else None
    if phases is None:
        return None
    for phase_id, _, lo, hi in phases:
        if lo <= over <= hi:
            return phase_id
    return None


def phase_meta(fmt: int) -> list[tuple[int, str, int, int]]:
    if fmt == 20:
        return T20_PHASES
    if fmt == 50:
        return ODI_PHASES
    return []


def agg_row(df: pd.DataFrame) -> dict:
    stake = float(df["stake"].sum())
    profit = float(df["profit"].sum())
    punter_pl = -profit
    return {
        "bets": int(len(df)),
        "stake": round(stake, 2),
        "bookProfit": round(profit, 2),
        "punterPl": round(punter_pl, 2),
        "marginPct": round_or_none(margin_pct(profit, stake)),
        "punterRoiPct": round_or_none(punter_pl / stake * 100 if stake else None),
        "avgStake": round(float(df["stake"].mean()), 2) if len(df) else 0,
        "bettors": int(df["bettorId"].nunique()) if "bettorId" in df.columns else 0,
    }


def selection_summary(df: pd.DataFrame, fmt: int) -> list[dict]:
    phases = phase_meta(fmt)
    rows: list[dict] = []
    for selection, sdf in df.groupby("selection"):
        base = agg_row(sdf)
        margin = base["marginPct"]
        item = {"selection": selection, **base}
        if margin is not None and margin < 0 and phases:
            phase_rows = []
            for phase_id, label, lo, hi in phases:
                pdf = sdf[(sdf["over"] >= lo) & (sdf["over"] <= hi)]
                if len(pdf) < MIN_PHASE_BETS:
                    continue
                pr = agg_row(pdf)
                phase_rows.append(
                    {
                        "phaseId": phase_id,
                        "label": label,
                        "overRange": f"{lo}–{hi}",
                        **{k: pr[k] for k in ("bets", "stake", "bookProfit", "marginPct", "avgStake")},
                    }
                )
            item["phaseChart"] = phase_rows
        rows.append(item)
    return sorted(rows, key=lambda x: x["stake"], reverse=True)


def phase_summary(df: pd.DataFrame, fmt: int) -> list[dict]:
    phases = phase_meta(fmt)
    if not phases:
        return []
    rows = []
    for phase_id, label, lo, hi in phases:
        pdf = df[(df["over"] >= lo) & (df["over"] <= hi)]
        if pdf.empty:
            continue
        row = agg_row(pdf)
        rows.append(
            {
                "phaseId": phase_id,
                "label": label,
                "overRange": f"{lo}–{hi}",
                **row,
            }
        )
    return rows


def segment_agg(df: pd.DataFrame, group_cols: list[str]) -> list[dict]:
    g = (
        df.groupby(group_cols, dropna=False)
        .agg(
            bets=("stake", "count"),
            stake=("stake", "sum"),
            profit=("profit", "sum"),
        )
        .reset_index()
    )
    rows = []
    for _, r in g.iterrows():
        item = {k: r[k] for k in group_cols}
        if "phase" in item and pd.notna(item["phase"]):
            item["phase"] = int(item["phase"])
        if "over" in item:
            item["over"] = int(item["over"])
        stake = float(r["stake"])
        profit = float(r["profit"])
        punter_pl = -profit
        rows.append(
            {
                **item,
                "bets": int(r["bets"]),
                "stake": round(stake, 2),
                "bookProfit": round(profit, 2),
                "punterPl": round(punter_pl, 2),
                "bookMarginPct": round_or_none(margin_pct(profit, stake)),
                "punterRoiPct": round_or_none(punter_pl / stake * 100 if stake else None),
            }
        )
    return rows


def selection_metrics(df: pd.DataFrame) -> list[dict]:
    total = float(df["stake"].sum())
    rows = segment_agg(df, ["selection"])
    for row in rows:
        row["sharePct"] = round(row["stake"] / total * 100, 2) if total else 0
    return sorted(rows, key=lambda x: x["stake"], reverse=True)


def bet_history(df: pd.DataFrame) -> list[dict]:
    ordered = df.sort_values("evsts", ascending=False) if "evsts" in df.columns else df
    rows = []
    for _, r in ordered.iterrows():
        stake = float(r["stake"])
        profit = float(r["profit"])
        punter_pl = -profit
        event_at = None
        if "evsts" in r.index and pd.notna(r["evsts"]):
            event_at = pd.Timestamp(r["evsts"]).isoformat()
        phase_id = r["phase"] if "phase" in r.index and pd.notna(r["phase"]) else None
        rows.append(
            {
                "eventAt": event_at,
                "eventName": str(r["evnm"])[:100] if "evnm" in r.index and pd.notna(r["evnm"]) else None,
                "tournament": str(r["tournm"])[:80] if "tournm" in r.index and pd.notna(r["tournm"]) else None,
                "selection": r["selection"],
                "over": int(r["over"]),
                "phaseId": int(phase_id) if phase_id is not None else None,
                "phaseLabel": next(
                    (p[1] for p in phase_meta(int(r["format"])) if p[0] == phase_id),
                    None,
                )
                if phase_id is not None
                else None,
                "innings": int(r["inningsnumber"]) if "inningsnumber" in r.index and pd.notna(r["inningsnumber"]) else None,
                "odds": round(float(r["odds"]), 2) if "odds" in r.index else 0,
                "stake": round(stake, 2),
                "bookProfit": round(profit, 2),
                "punterPl": round(punter_pl, 2),
            }
        )
    return rows


def top_matches(df: pd.DataFrame, limit: int = 10) -> list[dict]:
    if "evnm" not in df.columns:
        return []
    g = (
        df.groupby("evnm", dropna=False)
        .agg(
            bets=("stake", "count"),
            stake=("stake", "sum"),
            profit=("profit", "sum"),
            event_at=("evsts", "min"),
        )
        .reset_index()
    )
    g["punter_pl"] = -g["profit"]
    g["punter_roi"] = g["punter_pl"] / g["stake"] * 100
    top_sel = (
        df.groupby(["evnm", "selection"])["stake"]
        .sum()
        .reset_index()
        .sort_values("stake", ascending=False)
        .drop_duplicates("evnm")
    )
    sel_map = dict(zip(top_sel["evnm"], top_sel["selection"]))
    rows = []
    for _, r in g.sort_values("punter_pl", ascending=False).head(limit).iterrows():
        event_at = pd.Timestamp(r["event_at"]).isoformat() if pd.notna(r["event_at"]) else None
        rows.append(
            {
                "eventName": str(r["evnm"])[:100],
                "eventAt": event_at,
                "bets": int(r["bets"]),
                "stake": round(float(r["stake"]), 2),
                "punterPl": round(float(r["punter_pl"]), 2),
                "punterRoiPct": round(float(r["punter_roi"]), 2),
                "topSelection": sel_map.get(r["evnm"], "—"),
            }
        )
    return rows


def build_sharp_bettor_detail(bdf: pd.DataFrame, summary_row: pd.Series, fmt: int) -> dict:
    bid = int(summary_row["bettorId"])
    phases = phase_meta(fmt)
    by_phase = []
    for phase_id, label, lo, hi in phases:
        pdf = bdf[(bdf["over"] >= lo) & (bdf["over"] <= hi)]
        if pdf.empty:
            continue
        row = agg_row(pdf)
        by_phase.append(
            {
                "phaseId": phase_id,
                "label": label,
                "overRange": f"{lo}–{hi}",
                "bets": row["bets"],
                "stake": row["stake"],
                "bookProfit": row["bookProfit"],
                "punterPl": row["punterPl"],
                "marginPct": row["marginPct"],
                "punterRoiPct": row["punterRoiPct"],
                "avgStake": row["avgStake"],
            }
        )

    by_sel_phase = segment_agg(bdf[bdf["phase"].notna()], ["selection", "phase"])
    for row in by_sel_phase:
        row["phaseLabel"] = next((p[1] for p in phases if p[0] == row["phase"]), f"Phase {row['phase']}")

    best_phases = sorted(
        [p for p in by_phase if p.get("punterRoiPct") is not None],
        key=lambda x: x["punterRoiPct"],
        reverse=True,
    )[:3]
    best_selections = sorted(
        selection_metrics(bdf),
        key=lambda x: x.get("punterRoiPct") or 0,
        reverse=True,
    )[:3]

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
        "byPhase": by_phase,
        "bySelectionPhase": sorted(
            by_sel_phase,
            key=lambda x: (-x["stake"], x["selection"], x.get("phase", 0)),
        ),
        "chartByPhase": by_phase,
        "topMatches": top_matches(bdf),
        "bestPhases": [
            {"phaseId": p["phaseId"], "label": p["label"], "punterRoiPct": p["punterRoiPct"], "punterPl": p["punterPl"]}
            for p in best_phases
        ],
        "bestSelections": [
            {
                "selection": s["selection"],
                "punterRoiPct": s["punterRoiPct"],
                "punterPl": s["punterPl"],
                "stake": s["stake"],
            }
            for s in best_selections
        ],
        "bets": bet_history(bdf),
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


def sharp_analysis(df: pd.DataFrame, fmt: int) -> dict:
    summary = bettor_summary(df)
    qualified = summary[
        (summary["bets"] >= MIN_BETS_BETTOR) & (summary["stake"] >= MIN_STAKE_BETTOR)
    ]
    sharps = qualified[qualified["punter_roi"] >= SHARP_PUNTER_ROI].sort_values(
        "punter_roi", ascending=False
    )
    sharp_ids = set(sharps["bettorId"].tolist())
    sharp_df = df[df["bettorId"].isin(sharp_ids)]
    other_df = df[~df["bettorId"].isin(sharp_ids)]

    top_sharps = []
    for _, r in sharps.head(15).iterrows():
        top_sharps.append(
            {
                "bettorId": int(r["bettorId"]),
                "bets": int(r["bets"]),
                "stake": round(float(r["stake"]), 2),
                "punterRoiPct": round(float(r["punter_roi"]), 2),
                "bookMarginPct": round(float(r["book_margin"]), 2),
            }
        )

    phases = phase_meta(fmt)
    margin_by_phase = []
    avg_stake_by_phase = []
    sharp_stake_by_phase = []
    for phase_id, label, lo, hi in phases:
        all_p = df[(df["over"] >= lo) & (df["over"] <= hi)]
        sharp_p = sharp_df[(sharp_df["over"] >= lo) & (sharp_df["over"] <= hi)]
        other_p = other_df[(other_df["over"] >= lo) & (other_df["over"] <= hi)]
        all_m = agg_row(all_p) if len(all_p) else None
        sharp_m = agg_row(sharp_p) if len(sharp_p) else None
        other_m = agg_row(other_p) if len(other_p) else None
        margin_by_phase.append(
            {
                "phaseId": phase_id,
                "label": label,
                "allMarginPct": all_m["marginPct"] if all_m else None,
                "sharpMarginPct": sharp_m["marginPct"] if sharp_m else None,
                "otherMarginPct": other_m["marginPct"] if other_m else None,
            }
        )
        format_avg = float(df["stake"].mean()) if len(df) else 1
        phase_avg = float(all_p["stake"].mean()) if len(all_p) else 0
        avg_stake_by_phase.append(
            {
                "phaseId": phase_id,
                "label": label,
                "avgStake": round(phase_avg, 2),
                "ratioVsFormat": round_or_none(phase_avg / format_avg if format_avg else None),
                "spike": bool(phase_avg >= format_avg * STAKE_SPIKE_RATIO and len(all_p) >= MIN_PHASE_BETS),
            }
        )
        sharp_stake_by_phase.append(
            {
                "phaseId": phase_id,
                "label": label,
                "sharpAvgStake": round(float(sharp_p["stake"].mean()), 2) if len(sharp_p) else None,
                "otherAvgStake": round(float(other_p["stake"].mean()), 2) if len(other_p) else None,
            }
        )

    # Sharp selection preferences (within this format only)
    sharp_sel = []
    if not sharp_df.empty:
        total = float(sharp_df["stake"].sum())
        for sel, sdf in sharp_df.groupby("selection"):
            stake = float(sdf["stake"].sum())
            profit = float(sdf["profit"].sum())
            sharp_sel.append(
                {
                    "selection": sel,
                    "stake": round(stake, 2),
                    "sharePct": round(stake / total * 100, 2) if total else 0,
                    "marginPct": round_or_none(margin_pct(profit, stake)),
                    "punterRoiPct": round_or_none(-profit / stake * 100 if stake else None),
                }
            )
        sharp_sel.sort(key=lambda x: x["stake"], reverse=True)

    # Negative-margin selections where sharps concentrate
    weak_cells = []
    if not sharp_df.empty:
        cell = (
            sharp_df.groupby(["selection", "phase"])
            .agg(bets=("stake", "count"), stake=("stake", "sum"), profit=("profit", "sum"))
            .reset_index()
        )
        cell = cell[cell["bets"] >= MIN_PHASE_BETS]
        cell["margin"] = cell["profit"] / cell["stake"] * 100
        for _, r in cell[cell["margin"] < 0].sort_values("margin").head(12).iterrows():
            phase_label = next((p[1] for p in phases if p[0] == r["phase"]), f"Phase {r['phase']}")
            weak_cells.append(
                {
                    "selection": r["selection"],
                    "phaseId": int(r["phase"]),
                    "phaseLabel": phase_label,
                    "bets": int(r["bets"]),
                    "stake": round(float(r["stake"]), 2),
                    "marginPct": round(float(r["margin"]), 2),
                }
            )

    big = df[df["stake"] >= BIG_BET_STAKE]
    big_sharp_pct = None
    if len(big) and (big["profit"] < 0).any():
        lost = big[big["profit"] < 0]
        sharp_lost = lost[lost["bettorId"].isin(sharp_ids)]
        big_sharp_pct = round_or_none(len(sharp_lost) / len(lost) * 100)

    sharp_details = [
        build_sharp_bettor_detail(
            df[df["bettorId"] == bid],
            sharps[sharps["bettorId"] == bid].iloc[0],
            fmt,
        )
        for bid in sharps["bettorId"].head(15).tolist()
    ]

    return {
        "sharpCount": int(len(sharps)),
        "qualifiedBettors": int(len(qualified)),
        "topSharps": top_sharps,
        "sharpBettorDetails": sharp_details,
        "marginByPhase": margin_by_phase,
        "avgStakeByPhase": avg_stake_by_phase,
        "sharpStakeByPhase": sharp_stake_by_phase,
        "sharpSelectionPrefs": sharp_sel,
        "sharpWeakCells": weak_cells,
        "bigBetSharpSharePct": big_sharp_pct,
    }


def selection_phase_matrix(df: pd.DataFrame, fmt: int) -> list[dict]:
    """Per selection × phase margin for heatmap-style table."""
    phases = phase_meta(fmt)
    if not phases:
        return []
    rows = []
    for selection, sdf in df.groupby("selection"):
        for phase_id, label, lo, hi in phases:
            pdf = sdf[(sdf["over"] >= lo) & (sdf["over"] <= hi)]
            if len(pdf) < MIN_PHASE_BETS:
                continue
            m = margin_pct(float(pdf["profit"].sum()), float(pdf["stake"].sum()))
            rows.append(
                {
                    "selection": selection,
                    "phaseId": phase_id,
                    "phaseLabel": label,
                    "bets": int(len(pdf)),
                    "stake": round(float(pdf["stake"].sum()), 2),
                    "marginPct": round_or_none(m),
                }
            )
    return rows


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
    df["over"] = pd.to_numeric(df["over"], errors="coerce").fillna(0).astype(int)
    df["format"] = pd.to_numeric(df["format"], errors="coerce").fillna(0).astype(int)
    df["phase"] = df.apply(lambda r: assign_phase(int(r["over"]), int(r["format"])), axis=1)
    if "odds" in df.columns:
        df["odds"] = pd.to_numeric(df["odds"], errors="coerce").fillna(0)
    if "inningsnumber" in df.columns:
        df["inningsnumber"] = pd.to_numeric(df["inningsnumber"], errors="coerce")
    return df


def analyze_segment(df: pd.DataFrame, gender: str, fmt: int, seg_id: str, label: str) -> dict:
    sdf = df[(df["gender"] == gender) & (df["format"] == fmt)].copy()
    if sdf.empty:
        return {"id": seg_id, "label": label, "gender": gender, "formatCode": fmt, "empty": True}

    overall = agg_row(sdf)
    by_selection = selection_summary(sdf, fmt)
    by_phase = phase_summary(sdf, fmt)
    matrix = selection_phase_matrix(sdf, fmt)
    sharps = sharp_analysis(sdf, fmt)

    negative_selections = [s["selection"] for s in by_selection if (s.get("marginPct") or 0) < 0]
    stake_spikes = [p for p in sharps["avgStakeByPhase"] if p.get("spike")]

    insights: list[str] = []
    if overall["marginPct"] is not None and overall["marginPct"] < TARGET_MARGIN:
        insights.append(
            f"Overall book margin {overall['marginPct']:.1f}% is below the {TARGET_MARGIN:.1f}% target."
        )
    if negative_selections:
        insights.append(
            f"Negative-margin selections: {', '.join(negative_selections)} — phase charts generated."
        )
    if stake_spikes:
        insights.append(
            "Stake spikes vs format average in: "
            + ", ".join(f"{p['label']} ({p['ratioVsFormat']:.2f}×)" for p in stake_spikes)
        )
    if sharps["sharpCount"] > 0 and sharps.get("bigBetSharpSharePct"):
        insights.append(
            f"{sharps['bigBetSharpSharePct']:.0f}% of large losing bets (≥£{BIG_BET_STAKE}) came from sharp bettors."
        )

    return {
        "id": seg_id,
        "label": label,
        "gender": gender,
        "formatCode": fmt,
        "empty": False,
        "overall": overall,
        "bySelection": by_selection,
        "byPhase": by_phase,
        "selectionPhaseMatrix": matrix,
        "sharpAnalysis": sharps,
        "insights": insights,
        "hasPhases": fmt in (20, 50),
    }


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not src.exists():
        raise SystemExit(f"Input not found: {src}")

    df = load_df(src)
    segments = [analyze_segment(df, g, f, sid, lbl) for g, f, sid, lbl in SEGMENTS]

    out = {
        "taskId": "player-mod-part2",
        "part": 2,
        "title": "Gender × format × phase — margin & sharp-money",
        "sourceFile": src.name,
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "thresholds": {
            "targetBookMarginPct": TARGET_MARGIN,
            "minBetsBettor": MIN_BETS_BETTOR,
            "minStakeBettor": MIN_STAKE_BETTOR,
            "sharpPunterRoiPct": SHARP_PUNTER_ROI,
            "bigBetStake": BIG_BET_STAKE,
            "stakeSpikeRatio": STAKE_SPIKE_RATIO,
        },
        "phaseDefinitions": {
            "t20": [{"id": p[0], "label": p[1], "overMin": p[2], "overMax": p[3]} for p in T20_PHASES],
            "odi": [{"id": p[0], "label": p[1], "overMin": p[2], "overMax": p[3]} for p in ODI_PHASES],
        },
        "overall": agg_row(df),
        "segments": segments,
        "glossary": {
            "marginPct": "Book profit / stake × 100 (dpl/dstk). Positive = book winning.",
            "phase": "Innings over grouped by format-specific match phases.",
            "sharp": f"Bettor with ≥{MIN_BETS_BETTOR} bets, ≥£{MIN_STAKE_BETTOR} stake, punter ROI ≥{SHARP_PUNTER_ROI}%.",
            "women": "Tournament name (tournm) contains 'Women'.",
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    for seg in segments:
        if not seg.get("empty"):
            m = seg["overall"]["marginPct"]
            print(f"  {seg['label']}: {seg['overall']['bets']} bets, margin {m}%")


if __name__ == "__main__":
    main()
