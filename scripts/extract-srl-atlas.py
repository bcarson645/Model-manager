#!/usr/bin/env python3
"""Extract Atlas SRL workbook: PM Publication QA + market catalog (fast pass)."""
import json
import sys
from collections import OrderedDict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOKS = ROOT / "lib" / "workbooks"
DEFAULT_PATH = Path(r"c:\Users\b.carson\Downloads\Atlas 196 (3).xlsm")

MARKET_TO_MODEL: dict[str, str] = {
    "Match Betting (3-Way)": "srl-pm-match-betting-3w",
    "Match Winner Double Chance": "srl-pm-match-double-chance",
    "Match Betting": "srl-pm-match-winner",
    "Tied Match": "srl-pm-tied-match",
    "Toss Winner": "srl-pm-toss-winner",
    "Toss/Win Double": "srl-pm-toss-win-double",
    "Runs in First Innings": "srl-pm-first-innings-runs",
    "Runs in First Partnership": "srl-pm-first-partnership",
    "Method of First Dismissal": "srl-pm-first-dismissal",
    "Match Fours": "srl-pm-match-fours",
    "Match Sixes": "srl-pm-match-sixes",
    "Match Run Outs": "srl-pm-match-run-outs",
    "Max Runs Scored in an Over": "srl-pm-match-max-over",
    "Match Ducks": "srl-pm-match-ducks",
    "Match Wides": "srl-pm-match-wides",
    "Match Extras": "srl-pm-match-extras",
    "Match Wickets": "srl-pm-match-wickets",
    "Team of Top Bat": "srl-pm-team-of-top-bat",
    "Team of Top Bowl": "srl-pm-team-of-top-bowl",
    "First Innings Lead": "srl-pm-first-innings-lead",
    "Fifty in First Innings": "srl-pm-fifty-first-innings",
    "Fifty in Match": "srl-pm-fifty-match",
    "Hundred in First Innings": "srl-pm-hundred-first-innings",
    "Hundred in Match": "srl-pm-hundred-match",
    "Highest Individual Score": "srl-pm-highest-individual-score",
    "Rabbit Runs": "srl-pm-rabbit-runs",
    "Runs in Highest Scoring Session": "srl-pm-highest-scoring-session",
}

PREP_WORK_INPUTS = [
    ("D3", "conditions", "Conditions factor"),
    ("D4", "homeBattingRating", "Home batting rating"),
    ("I4", "awayBattingRating", "Away batting rating"),
    ("D5", "homeBowlingRating", "Home bowling rating"),
    ("I5", "awayBowlingRating", "Away bowling rating"),
    ("D6", "homeTotalFactor", "Home total factor"),
    ("I6", "awayTotalFactor", "Away total factor"),
    ("E6", "homeExpectedRuns", "Home expected innings runs"),
    ("J6", "awayExpectedRuns", "Away expected innings runs"),
    ("C10", "homeWinProb", "Home win probability (2-way)"),
    ("C11", "awayWinProb", "Away win probability (2-way)"),
    ("O3", "firstInnsPar", "Table 1 — All format 1st innings par"),
]


def cell_val(v):
    if v is None or v == "":
        return None
    if isinstance(v, str) and v.startswith("#"):
        return {"error": v}
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return float(v)
    return str(v)


def row_snapshot(row_num: int, row_vals: tuple) -> dict:
    def col(idx: int):
        return cell_val(row_vals[idx] if idx < len(row_vals) else None)

    return {
        "row": row_num,
        "category": col(2),
        "market": col(3),
        "selection": col(4),
        "line": col(5),
        "probability": col(6),
        "complementProbability": col(7),
        "adjust": col(8),
        "price": col(9),
        "cells": {
            "line": f"F{row_num}",
            "probability": f"G{row_num}",
            "complement": f"H{row_num}",
            "adjust": f"I{row_num}",
            "price": f"J{row_num}",
        },
    }


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not path.exists():
        raise FileNotFoundError(path)

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    pm = wb["PM Publication"]
    prep = wb["Prep Work"]

    by_row: dict[str, dict] = {}
    by_model: dict[str, list] = {}
    catalog: OrderedDict[str, dict] = OrderedDict()

    for row_num, row in enumerate(pm.iter_rows(min_row=1, values_only=True), start=1):
        market = row[3] if len(row) > 3 else None
        if not market or not isinstance(market, str):
            continue
        market = market.strip()
        if market in ("Market1", "Market2"):
            continue

        snap = row_snapshot(row_num, row)
        by_row[str(row_num)] = snap

        if market not in catalog:
            catalog[market] = {
                "category": row[2] if len(row) > 2 else None,
                "market": market,
                "firstRow": row_num,
                "selectionCount": 0,
                "rows": [],
            }
        catalog[market]["selectionCount"] += 1
        catalog[market]["rows"].append(row_num)
        catalog[market]["lastRow"] = row_num

        model_id = MARKET_TO_MODEL.get(market)
        if model_id:
            by_model.setdefault(model_id, []).append(snap)

    prep_inputs = {}
    for addr, key, label in PREP_WORK_INPUTS:
        prep_inputs[key] = {
            "cell": f"Prep Work!{addr}",
            "label": label,
            "value": cell_val(prep[addr].value),
        }

    qa = {
        "fixtureId": "atlas-196",
        "label": "Atlas 196 (SRL template)",
        "workbook": path.name,
        "sheet": "PM Publication",
        "lane": "srl",
        "adjustNote": "SRL pre-match models are not trader-adjusted — column I should remain empty or informational.",
        "columns": {
            "F": "line",
            "G": "probability",
            "H": "complement probability",
            "I": "adjust (unused for SRL PM)",
            "J": "price",
        },
        "byModel": by_model,
        "byRow": by_row,
        "marketCatalog": list(catalog.values()),
        "prepWorkInputs": prep_inputs,
        "marketToModel": MARKET_TO_MODEL,
    }

    out_qa = WORKBOOKS / "atlas-196-pm-publication-qa.json"
    out_markets = WORKBOOKS / "atlas-196-pm-markets.json"
    out_qa.write_text(json.dumps(qa, indent=2, default=str), encoding="utf-8")
    out_markets.write_text(json.dumps(list(catalog.values()), indent=2, default=str), encoding="utf-8")

    wb.close()
    print(f"Wrote {out_qa} ({len(by_model)} model groups, {len(by_row)} PM rows)")
    print(f"Wrote {out_markets} ({len(catalog)} unique markets)")


if __name__ == "__main__":
    main()
