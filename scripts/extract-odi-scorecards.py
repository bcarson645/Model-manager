#!/usr/bin/env python3
"""Extract ODI / List A scorecard workbooks into lib/odi-scorecards/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scorecard_core import extract_scorecards

OUT_DIR = Path(__file__).resolve().parent.parent / "lib" / "odi-scorecards"

DEFAULT_SOURCES = [
    Path(r"c:\Users\b.carson\Downloads\odi_major_scorecard_data.xlsm"),
    Path(r"c:\Users\b.carson\Downloads\List A Scorecard Data.xlsm"),
]


def main():
    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else DEFAULT_SOURCES
    paths = [p for p in paths if p.exists()]
    if not paths:
        print("No source workbooks found.", file=sys.stderr)
        sys.exit(1)

    matches = extract_scorecards(paths, OUT_DIR)

    top_bat_lost = sum(
        1
        for m in matches
        if m["topBatter"] and m["winner"] and m["topBatter"]["team"] != m["winner"]
    )
    with_top_bat = sum(1 for m in matches if m["topBatter"])
    if with_top_bat:
        print(
            f"  Top batter team lost: {top_bat_lost}/{with_top_bat} "
            f"({top_bat_lost / with_top_bat * 100:.1f}%)"
        )


if __name__ == "__main__":
    main()
