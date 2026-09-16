#!/usr/bin/env python3
"""Year-over-year MoD dismissal frequencies from match-analysis scorecard datasets."""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lib" / "data-analysis" / "mod-dismissal-by-year.json"

SELECTIONS = [
    "Fielder Catch",
    "Keeper Catch",
    "Bowled",
    "LBW",
    "Run Out",
    "Stumped",
    "Other",
]

SKIP_DISMISSALS = {"dnb", "not out", "retired not out"}

SEGMENTS = [
    ("odi", "men-odi", "Men's ODI", 50),
    ("t20", "men-t20", "Men's T20", 20),
]


def normalize_dismissal(raw: str | None) -> str | None:
    if not raw:
        return None
    d = raw.strip()
    if d.lower() in SKIP_DISMISSALS:
        return None
    if d in SELECTIONS:
        return d
    low = d.lower()
    if "catch" in low:
        return "Keeper Catch" if "keeper" in low else "Fielder Catch"
    if low == "bowled":
        return "Bowled"
    if low == "lbw":
        return "LBW"
    if "run out" in low:
        return "Run Out"
    if low == "stumped":
        return "Stumped"
    return "Other"


def matches_format(max_overs: int | float | None, target: int) -> bool:
    if max_overs is None:
        return True
    return abs(float(max_overs) - target) <= 1


def load_matches(format_key: str) -> list[dict]:
    path = ROOT / "lib" / f"{format_key}-scorecards" / "matches.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def count_dismissals(matches: list[dict], max_overs_target: int) -> tuple[dict[str, int], dict[str, dict[str, int]]]:
    """Return (totals by selection, year -> selection counts)."""
    totals: dict[str, int] = defaultdict(int)
    by_year: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for match in matches:
        if not matches_format(match.get("maxOvers"), max_overs_target):
            continue
        date = match.get("date")
        year = str(date)[:4] if date else "Unknown"
        for inn in match.get("innings", []):
            if inn.get("innings", 0) > 2:
                continue
            for player in inn.get("players", []):
                sel = normalize_dismissal(player.get("dismissal"))
                if not sel:
                    continue
                totals[sel] += 1
                by_year[year][sel] += 1

    return dict(totals), {y: dict(c) for y, c in sorted(by_year.items())}


def share_row(counts: dict[str, int]) -> dict[str, float]:
    total = sum(counts.values())
    if total == 0:
        return {s: 0.0 for s in SELECTIONS}
    return {s: round(counts.get(s, 0) / total * 100, 2) for s in SELECTIONS}


def emerging_trends(
    yearly: list[dict], early_years: set[str], late_years: set[str]
) -> list[dict]:
    early_counts: dict[str, int] = defaultdict(int)
    late_counts: dict[str, int] = defaultdict(int)

    for point in yearly:
        y = point["year"]
        for sel in SELECTIONS:
            n = point.get(sel, 0)
            if isinstance(n, (int, float)):
                if y in early_years:
                    early_counts[sel] += int(n)
                if y in late_years:
                    late_counts[sel] += int(n)

    early_total = sum(early_counts.values())
    late_total = sum(late_counts.values())
    trends: list[dict] = []

    for sel in SELECTIONS:
        e_share = early_counts[sel] / early_total * 100 if early_total else 0
        l_share = late_counts[sel] / late_total * 100 if late_total else 0
        delta = l_share - e_share
        if abs(delta) >= 1.0:
            trends.append(
                {
                    "selection": sel,
                    "earlySharePct": round(e_share, 2),
                    "recentSharePct": round(l_share, 2),
                    "deltaPp": round(delta, 2),
                    "direction": "up" if delta > 0 else "down",
                }
            )

    trends.sort(key=lambda x: abs(x["deltaPp"]), reverse=True)
    return trends


def analyze_segment(format_key: str, seg_id: str, label: str, max_overs: int) -> dict:
    matches = load_matches(format_key)
    if not matches:
        return {"id": seg_id, "label": label, "empty": True, "source": f"{format_key}-scorecards"}

    totals, by_year_counts = count_dismissals(matches, max_overs)
    total_dismissals = sum(totals.values())
    years = sorted(y for y in by_year_counts if y != "Unknown")

    yearly: list[dict] = []
    for year in years:
        counts = by_year_counts[year]
        n = sum(counts.values())
        shares = share_row(counts)
        point: dict = {"year": year, "dismissals": n}
        for sel in SELECTIONS:
            point[sel] = counts.get(sel, 0)
            point[f"{sel}SharePct"] = shares[sel]
        yearly.append(point)

    mid = len(years) // 2
    early_years = set(years[: max(1, mid)])
    late_years = set(years[mid:])

    return {
        "id": seg_id,
        "label": label,
        "empty": False,
        "source": f"{format_key}-scorecards/matches.json",
        "matchCount": len(matches),
        "totalDismissals": total_dismissals,
        "yearRange": {"from": years[0] if years else None, "to": years[-1] if years else None},
        "overallShares": [
            {"selection": s, "sharePct": round(totals.get(s, 0) / total_dismissals * 100, 2) if total_dismissals else 0}
            for s in SELECTIONS
            if totals.get(s, 0) > 0
        ],
        "yearlyTrend": yearly,
        "emergingTrends": emerging_trends(yearly, early_years, late_years),
        "periodLabels": {
            "early": f"{min(early_years)}–{max(early_years)}" if early_years else None,
            "recent": f"{min(late_years)}–{max(late_years)}" if late_years else None,
        },
    }


def main() -> None:
    segments = [analyze_segment(fmt, sid, lbl, mo) for fmt, sid, lbl, mo in SEGMENTS]

    out = {
        "taskId": "mod-dismissal-by-year",
        "title": "MoD dismissal frequency by year (scorecard datasets)",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "methodology": {
            "source": "Match-analysis scorecard exports (ODI & T20 matches.json)",
            "counting": "One dismissal per batting innings (excludes DNB, not out, retired not out)",
            "categories": "Scorecard Dismissal column — Fielder Catch, Keeper Catch, Bowled, LBW, Run Out, Stumped, Other",
            "genderNote": "Current scorecard extracts are men's domestic/international only — no women's matches in dataset",
            "bettingNote": "Betting extract (PlayerMoD) covers Jun–Sep 2026 only — insufficient for multi-year betting trends",
        },
        "limitations": [
            "Women's ODI/T20 year-over-year trends unavailable — scorecard exports contain no women's fixtures",
            "Betting-derived monthly trends (mod-frequency-pricing.json) cover ~4 months in 2026 only",
            "Scorecard FC/KC split is native; betting FC share may differ due to market selection mapping",
        ],
        "segments": segments,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    for s in segments:
        if not s.get("empty"):
            yr = s["yearRange"]
            print(
                f"  {s['label']}: {s['totalDismissals']:,} dismissals, "
                f"{yr['from']}–{yr['to']}, {len(s['yearlyTrend'])} years"
            )


if __name__ == "__main__":
    main()
