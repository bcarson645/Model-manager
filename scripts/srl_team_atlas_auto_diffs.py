from collections import defaultdict
import openpyxl

ATLAS = r"c:\Users\b.carson\Downloads\srl_atlas_0101_to_0103.xlsx"
AUTO = r"c:\Users\b.carson\Downloads\SRL Autos Scores 0107 to 1808.xlsx"


def load(path):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb["Scores"]
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] is None or r[11] is None:
            continue
        rows.append({"inns": r[9], "bat": r[10], "score": r[11]})
    wb.close()
    return rows


def key(name: str) -> str:
    return name.replace(" SRL", "").strip().lower()


def bat_means(rows, min_n=8):
    by = defaultdict(list)
    for r in rows:
        if r["inns"] != 1:
            continue
        by[r["bat"]].append(r["score"])
    out = {}
    for team, scores in by.items():
        if len(scores) < min_n:
            continue
        out[key(team)] = {
            "team": team,
            "n": len(scores),
            "mean": sum(scores) / len(scores),
        }
    return out


def main():
    atlas = bat_means(load(ATLAS))
    auto = bat_means(load(AUTO))
    rows = []
    for k in set(atlas) & set(auto):
        a, o = atlas[k], auto[k]
        d = o["mean"] - a["mean"]
        rows.append((abs(d), d, a, o))
    rows.sort(reverse=True)

    print("Top 10 biggest |Auto - Atlas| 1st-inns batting avg (min n=8 each)")
    print("Note: different date windows (Atlas Jan-Feb vs Auto Jul-Aug)")
    for i, (_, d, a, o) in enumerate(rows[:10], 1):
        print(
            f"{i:2d}. {a['team']}: Atlas {a['mean']:.1f} (n={a['n']}) -> "
            f"Auto {o['mean']:.1f} (n={o['n']})  diff={d:+.1f}"
        )


if __name__ == "__main__":
    main()
