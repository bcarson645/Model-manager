#!/usr/bin/env python3
"""Extract T20 scorecard workbooks into lib/t20-scorecards/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scorecard_core import extract_scorecards

OUT_DIR = Path(__file__).resolve().parent.parent / "lib" / "t20-scorecards"

DEFAULT_SOURCES = [
    Path(r"c:\Users\b.carson\Downloads\T20 Major Scorecard Data.xlsm"),
]


def main():
    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else DEFAULT_SOURCES
    paths = [p for p in paths if p.exists()]
    if not paths:
        print("No source workbooks found.", file=sys.stderr)
        sys.exit(1)

    extract_scorecards(paths, OUT_DIR)


if __name__ == "__main__":
    main()
