"""Find consistently low-scoring SRL teams in Atlas/Auto exports."""
from __future__ import annotations

from collections import defaultdict
import statistics as st
import openpyxl

ATLAS = r"c:\Users\b.carson\Downloads\srl_atlas_0101_to_0103.xlsx"
AUTO = r"c:\Users\b.carson\Downloads\SRL Autos Scores 0107 to 1808.xlsx"


def load(path: str):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb["Scores"]
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] is None or r[11] is None:
            continue
        rows.append(
            {
                "comp": r[4],
                "home": r[6],
                "away": r[8],
                "inns": r[9],
                "bat": r[10],
                "score": r[11],
            }
        )
    wb.close()
    return rows


def key(name: str) -> str:
    return name.replace(" SRL", "").strip().lower()


def batting_stats(rows, min_n=8):
    first = [r for r in rows if r["inns"] == 1]
    by = defaultdict(list)
    for r in first:
        by[r["bat"]].append(r["score"])
    overall = sum(r["score"] for r in first) / len(first)
    stats = []
    for team, scores in by.items():
        if len(scores) < min_n:
            continue
        m = sum(scores) / len(scores)
        stats.append(
            {
                "team": team,
                "n": len(scores),
                "mean": m,
                "median": st.median(scores),
                "pct_lt_160": 100 * sum(1 for s in scores if s < 160) / len(scores),
                "pct_lt_150": 100 * sum(1 for s in scores if s < 150) / len(scores),
                "delta": m - overall,
            }
        )
    stats.sort(key=lambda x: x["mean"])
    return stats, overall, len(first)


def bowling_stats(rows, min_n=8):
    first = [r for r in rows if r["inns"] == 1]
    by = defaultdict(list)
    for r in first:
        if r["bat"] == r["home"]:
            bowl = r["away"]
        elif r["bat"] == r["away"]:
            bowl = r["home"]
        else:
            continue
        by[bowl].append(r["score"])
    overall = sum(r["score"] for r in first) / len(first)
    stats = []
    for team, scores in by.items():
        if len(scores) < min_n:
            continue
        m = sum(scores) / len(scores)
        stats.append(
            {
                "team": team,
                "n": len(scores),
                "mean": m,
                "delta": m - overall,
            }
        )
    stats.sort(key=lambda x: x["mean"])
    return stats, overall


def main():
    atlas = load(ATLAS)
    auto = load(AUTO)

    for label, rows in [("ATLAS", atlas), ("AUTO", auto)]:
        stats, overall, n = batting_stats(rows, min_n=8)
        print(f"=== {label} 1st-inns batting  overall={overall:.2f} n={n} ===")
        print("LOWEST 12:")
        for s in stats[:12]:
            print(
                f"  {s['mean']:6.1f} (d={s['delta']:+5.1f}) n={s['n']:3d} "
                f"lt160={s['pct_lt_160']:4.0f}%  {s['team']}"
            )
        print("HIGHEST 6:")
        for s in stats[-6:]:
            print(
                f"  {s['mean']:6.1f} (d={s['delta']:+5.1f}) n={s['n']:3d} "
                f"lt160={s['pct_lt_160']:4.0f}%  {s['team']}"
            )
        print()

    a_stats, _, _ = batting_stats(atlas, 8)
    o_stats, _, _ = batting_stats(auto, 8)
    a_map = {key(s["team"]): s for s in a_stats}
    o_map = {key(s["team"]): s for s in o_stats}
    both = []
    for k in set(a_map) & set(o_map):
        a, o = a_map[k], o_map[k]
        both.append(((a["mean"] + o["mean"]) / 2, a, o))
    both.sort(key=lambda x: x[0])

    print("=== Consistently low in BOTH samples (min 8 1st-inns each) ===")
    for avg, a, o in both[:15]:
        print(
            f"  combo={avg:6.1f} | Atlas {a['mean']:6.1f} n={a['n']:3d} | "
            f"Auto {o['mean']:6.1f} n={o['n']:3d} | {a['team']}"
        )

    print()
    print("=== Consistently high in BOTH ===")
    for avg, a, o in both[-8:]:
        print(
            f"  combo={avg:6.1f} | Atlas {a['mean']:6.1f} n={a['n']:3d} | "
            f"Auto {o['mean']:6.1f} n={o['n']:3d} | {a['team']}"
        )

    # teams below overall by >=8 in both
    print()
    print("=== Cold batters: >=8 below sample mean in BOTH ===")
    cold = [
        (a, o)
        for _, a, o in both
        if a["delta"] <= -8 and o["delta"] <= -8
    ]
    cold.sort(key=lambda x: (x[0]["delta"] + x[1]["delta"]) / 2)
    for a, o in cold:
        print(
            f"  Atlas d={a['delta']:+5.1f} Auto d={o['delta']:+5.1f} | {a['team']}"
        )

    for label, rows in [("ATLAS", atlas), ("AUTO", auto)]:
        stats, overall = bowling_stats(rows, 8)
        print()
        print(f"=== {label} bowling: opp 1st-inns allowed (low = tight bowl) ===")
        print("Tightest 8:")
        for s in stats[:8]:
            print(f"  opp {s['mean']:6.1f} (d={s['delta']:+5.1f}) n={s['n']:3d}  {s['team']}")
        print("Most generous 6:")
        for s in stats[-6:]:
            print(f"  opp {s['mean']:6.1f} (d={s['delta']:+5.1f}) n={s['n']:3d}  {s['team']}")


if __name__ == "__main__":
    main()
