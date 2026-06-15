#!/usr/bin/env python3
"""Extract PM Publication F/G/H/I/J per row for Lambda QA snapshot."""
import json
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOKS = ROOT / "lib" / "workbooks"

# Home team block rows 147–166; away team block rows 213–232 (same template all fixtures)
ROW_GROUPS = {
    "pm-match-winner": [20, 21],
    "pm-tied-match": [22, 23],
    "pm-toss-winner": [24, 25],
    "pm-first-partnership": [44],
    "pm-first-dismissal": list(range(45, 52)),
    "pm-match-fours": [52],
    "pm-match-sixes": [53],
    "pm-match-run-outs": [54],
    "pm-match-max-over": [55],
    "pm-match-ducks": [56],
    "pm-match-wides": [57],
    "pm-match-extras": [58],
    "pm-match-wickets": [59],
    "pm-team-of-top-bat": [60, 61],
    "pm-team-of-top-bowl": [62, 63],
    "pm-fifty-first-innings": [67, 68],
    "pm-hundred-first-innings": [71, 72],
    "pm-hundred-match": [73, 74],
    "pm-highest-individual-score": [75],
    "pm-rabbit-runs": [76],
    "pm-player-runs": list(range(257, 267)),
    "pm-player-fours": list(range(267, 277)),
    "pm-player-sixes": list(range(277, 287)),
    "pm-player-performance": list(range(337, 347)),
    "pm-player-balls-faced": list(range(610, 620)),
    "pm-team-first-partnership-nz": [147],
    "pm-team-first-dismissal-nz": list(range(148, 155)),
    "pm-team-fours-nz": [155, 156, 157],
    "pm-team-sixes-nz": [158, 159, 160],
    "pm-team-run-outs-nz": [161],
    "pm-team-max-over-nz": [162],
    "pm-team-wides-nz": [163],
    "pm-team-ducks-nz": [164],
    "pm-team-extras-nz": [165],
    "pm-team-wickets-nz": [166],
    "pm-team-first-partnership-sa": [213],
    "pm-team-first-dismissal-sa": list(range(214, 221)),
    "pm-team-fours-sa": [221, 222, 223],
    "pm-team-sixes-sa": [224, 225, 226],
    "pm-team-run-outs-sa": [227],
    "pm-team-max-over-sa": [228],
    "pm-team-wides-sa": [229],
    "pm-team-ducks-sa": [230],
    "pm-team-extras-sa": [231],
    "pm-team-wickets-sa": [232],
}

FIXTURES = {
    "purulia-kings-71783382": {
        "workbook": Path(
            r"c:\Users\b.carson\Downloads\Novus Royals Purulia v Murshidabad Kings 71783382.xlsm"
        ),
        "out": "purulia-kings-pm-publication-qa.json",
        "label": "Novus Royals Purulia v Murshidabad Kings",
    },
    "nz-sa-63406779": {
        "workbook": Path(
            r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
        ),
        "out": "nz-sa-pm-publication-qa.json",
        "label": "New Zealand v South Africa",
    },
}

DEFAULT_FIXTURE = "nz-sa-63406779"


def cell_val(v):
    if v is None or v == "":
        return None
    if isinstance(v, str) and v.startswith("#"):
        return {"error": v}
    if isinstance(v, (int, float)):
        return float(v) if isinstance(v, float) or not isinstance(v, bool) else v
    return str(v)


def row_snapshot(sheet, row: int) -> dict:
    def c(col: str):
        return cell_val(sheet[f"{col}{row}"].value)

    return {
        "row": row,
        "market": c("D"),
        "selection": c("E"),
        "line": c("F"),
        "probability": c("G"),
        "complementProbability": c("H"),
        "adjust": c("I"),
        "price": c("J"),
        "cells": {
            "line": f"F{row}",
            "probability": f"G{row}",
            "complement": f"H{row}",
            "adjust": f"I{row}",
            "price": f"J{row}",
        },
    }


def extract(fixture_id: str) -> Path:
    cfg = FIXTURES[fixture_id]
    path = cfg["workbook"]
    if not path.exists():
        raise FileNotFoundError(path)

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    pm = wb["PM Publication"]

    by_model = {k: [row_snapshot(pm, r) for r in rows] for k, rows in ROW_GROUPS.items()}
    all_rows = sorted({r for rows in ROW_GROUPS.values() for r in rows})
    by_row = {str(r): row_snapshot(pm, r) for r in all_rows}

    out = {
        "fixtureId": fixture_id,
        "label": cfg["label"],
        "sheet": "PM Publication",
        "columns": {
            "F": "line",
            "G": "probability",
            "H": "complement probability (under/over other side)",
            "I": "trader adjust (purple)",
            "J": "price",
        },
        "byModel": by_model,
        "byRow": by_row,
    }

    out_path = WORKBOOKS / cfg["out"]
    out_path.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    wb.close()
    print(f"Wrote {out_path} ({len(by_model)} model groups, {len(by_row)} rows)")
    return out_path


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_FIXTURE
    if target == "all":
        for fid in FIXTURES:
            extract(fid)
    else:
        extract(target)
