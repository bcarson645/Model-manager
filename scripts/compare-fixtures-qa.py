#!/usr/bin/env python3
"""Compare prep → PM Publication chain across two fixtures."""
import math
import sys
from pathlib import Path

import openpyxl

FIXTURES = {
    "nz-sa": Path(
        r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
    ),
    "purulia": Path(
        r"c:\Users\b.carson\Downloads\Novus Royals Purulia v Murshidabad Kings 71783382.xlsm"
    ),
}


def rnd_line(x: float) -> float:
    return math.floor(x - 0.8) + 0.5


def num(v):
    return float(v) if isinstance(v, (int, float)) else None


def analyze(path: Path, name: str) -> dict:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    prep, pm = wb["Prep Work"], wb["PM Publication"]

    def c(sheet, addr):
        return sheet[addr].value

    o36, o57 = num(c(prep, "O36")), num(c(prep, "O57"))
    p36, p57 = num(c(prep, "P36")), num(c(prep, "P57"))
    o16, p16 = num(c(prep, "O16")), num(c(prep, "P16"))
    m35, m56 = num(c(prep, "M35")), num(c(prep, "M56"))
    u38, u59 = num(c(prep, "U38")), num(c(prep, "U59"))
    w38, w59 = num(c(prep, "W38")), num(c(prep, "W59"))
    z5, z7, z8 = num(c(prep, "Z5")), num(c(prep, "Z7")), num(c(prep, "Z8"))

    ducks_sum = (o16 or 0) + (p16 or 0) if o16 is not None and p16 is not None else None

    markets = [
        ("match-fours", 52, o36 + o57 if o36 and o57 else None, "line"),
        ("match-sixes", 53, p36 + p57 if p36 and p57 else None, "line"),
        ("match-ducks", 56, ducks_sum, "line"),
        ("match-wides", 57, (w38 or 0) + (w59 or 0), "line"),
        ("match-extras", 58, (m35 or 0) + (m56 or 0), "line"),
        ("match-wickets", 59, (u38 or 0) + (u59 or 0), "line"),
        ("fifty-yes", 67, z5, "prob"),
        ("hundred-inn-yes", 71, z7, "prob"),
        ("hundred-match-yes", 73, z8, "prob"),
        ("team-fours-home", 155, o36, "line"),
        ("team-fours-away", 221, o57, "line"),
        ("team-sixes-home", 158, p36, "line"),
        ("team-sixes-away", 224, p57, "line"),
    ]

    rows = []
    for label, row, prep_val, kind in markets:
        f = num(c(pm, f"F{row}"))
        g_raw = c(pm, f"G{row}")
        g = num(g_raw)
        exp_line = rnd_line(prep_val) if kind == "line" and prep_val is not None else None
        line_ok = exp_line is None or (f is not None and abs(f - exp_line) < 0.01)
        prob_ok = (
            kind != "prob"
            or g is None
            or prep_val is None
            or abs(g - prep_val) < 0.02
        )
        rows.append(
            {
                "fixture": name,
                "market": label,
                "row": row,
                "prep": round(prep_val, 4) if prep_val is not None else None,
                "exp_line": exp_line,
                "pm_f": f,
                "pm_g": round(g, 4) if g is not None else str(g_raw),
                "line_ok": line_ok,
                "prob_ok": prob_ok,
            }
        )

    # first dismissal prob sum
    fd_probs = []
    for r in range(45, 52):
        g = num(c(pm, f"G{r}"))
        if g is not None:
            fd_probs.append(g)
    fd_sum = sum(fd_probs) if fd_probs else None

    wb.close()
    return {"markets": rows, "first_dismissal_g_sum": fd_sum}


if __name__ == "__main__":
    all_rows = []
    for name, path in FIXTURES.items():
        if not path.exists():
            print(f"Missing: {path}")
            continue
        result = analyze(path, name)
        print(f"\n=== {name} ===")
        print(f"First dismissal G sum (rows 45-51): {result['first_dismissal_g_sum']}")
        for r in result["markets"]:
            all_rows.append(r)
            flag = ""
            if r["exp_line"] is not None and not r["line_ok"]:
                flag = " LINE_MISMATCH"
            elif not r["prob_ok"]:
                flag = " PROB_MISMATCH"
            print(
                f"  {r['market']:20} prep={r['prep']} expF={r['exp_line']} "
                f"F={r['pm_f']} G={r['pm_g']}{flag}"
            )

    # cross-fixture: same structural checks pass on both?
    by_market = {}
    for r in all_rows:
        by_market.setdefault(r["market"], []).append(r)

    print("\n=== Cross-fixture consistency ===")
    for market, items in sorted(by_market.items()):
        if len(items) < 2:
            continue
        lines_ok = all(x["line_ok"] for x in items if x["exp_line"] is not None)
        probs_ok = all(x["prob_ok"] for x in items)
        status = "PASS" if lines_ok and probs_ok else "REVIEW"
        print(f"  {market:22} {status}")
