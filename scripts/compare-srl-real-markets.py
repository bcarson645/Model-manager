#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

atlas = json.loads((ROOT / "lib/workbooks/atlas-196-pm-markets.json").read_text())
real_qa = json.loads((ROOT / "lib/workbooks/nz-sa-pm-publication-qa.json").read_text())
real_m = {r["market"].strip().rstrip(".") for r in real_qa["byRow"].values() if r.get("market")}
atlas_m = {x["market"].strip().rstrip(".") for x in atlas}

only_atlas = sorted(atlas_m - real_m)
only_real = sorted(real_m - atlas_m)
both = sorted(atlas_m & real_m)

print(f"Atlas unique markets: {len(atlas_m)}")
print(f"Real unique markets: {len(real_m)}")
print(f"In both: {len(both)}")
print(f"Atlas only: {len(only_atlas)}")
print(f"Real only: {len(only_real)}")
print("\n=== Atlas-only ===")
for m in only_atlas:
    print(f"  {m}")
print("\n=== Real-only (first 50) ===")
for m in only_real[:50]:
    print(f"  {m}")

qa_atlas = json.loads((ROOT / "lib/workbooks/atlas-196-pm-publication-qa.json").read_text())
qa_real = json.loads((ROOT / "lib/workbooks/nz-sa-pm-publication-qa.json").read_text())

def adjust_stats(qa, label):
    rows = list(qa["byRow"].values())
    non_null = [r for r in rows if r.get("adjust") not in (None, "", 0, 0.0)]
    print(f"\n{label}: {len(rows)} rows, {len(non_null)} with non-null/non-zero adjust")
    for r in non_null[:12]:
        print(f"  row {r['row']}: {r.get('market')!r} -> {r.get('adjust')!r}")

adjust_stats(qa_atlas, "Atlas SRL")
adjust_stats(qa_real, "Real NZ-SA")
