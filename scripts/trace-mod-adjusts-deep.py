#!/usr/bin/env python3
"""Deep trace MOD: PM Pricing rows 53-60, columns G-M, P-Q."""
import openpyxl
from pathlib import Path

PATH = Path(
    r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)

wb = openpyxl.load_workbook(PATH, read_only=True, data_only=False)
pp = wb["PM Pricing"]
wb_d = openpyxl.load_workbook(PATH, read_only=True, data_only=True)
pp_d = wb_d["PM Pricing"]

print("=== Row 60 (normalizer G$60) ===\n")
for c in "ABCDEFGHIJKLMNOPQ":
    cell = pp[f"{c}60"]
    if cell.value is not None:
        print(f"  {c}60 formula: {cell.value}")
        print(f"  {c}60 value:   {pp_d[f'{c}60'].value}")
        print()

print("=== Rows 53-59: all columns with content ===\n")
for r in range(53, 60):
    print(f"--- Row {r} ---")
    for c in "ABCDEFGHIJKLMNOPQRSTUVW":
        f = pp[f"{c}{r}"]
        if f.value is not None:
            vd = pp_d[f"{c}{r}"].value
            print(f"  {c}{r}: {str(f.value)[:100]}")
            if vd is not None and str(f.value) != str(vd):
                print(f"       → {vd}")
    print()

# Simulate adjust: what if I45=1?
print("=== Simulate I45=+1 (others 0) — read structure only ===\n")
print("G53 = AVERAGE(J53:M53) + I45/100")
print("C53 = G53 / G$60  (renormalize so sum C53:C59 = 1)")
print("G60 likely = SUM(G53:G59)")

g60_f = pp["G60"].value
print(f"G60 formula: {g60_f}")

wb.close()
wb_d.close()
