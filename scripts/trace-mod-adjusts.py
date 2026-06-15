#!/usr/bin/env python3
"""Trace Method of First Dismissal adjust chain: PM Publication I45-51 → PM Pricing."""
import openpyxl
from pathlib import Path

PATH = Path(
    r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)

wb = openpyxl.load_workbook(PATH, read_only=True, data_only=False)
pm_pub = wb["PM Publication"]
pm_price = wb["PM Pricing"]
prep = wb["Prep Work"]

print("=== PM Publication rows 45-51 (MOD) ===\n")
for r in range(45, 52):
    row = {}
    for c in "DEFGHIJ":
        cell = pm_pub[f"{c}{r}"]
        v = cell.value
        if v is not None:
            row[c] = str(v)[:120]
    print(f"Row {r}:")
    for k, v in row.items():
        print(f"  {k}{r}: {v}")
    print()

print("=== PM Pricing rows 50-65 (data values) ===\n")
wb_data = openpyxl.load_workbook(PATH, read_only=True, data_only=True)
pp_data = wb_data["PM Pricing"]
for r in range(50, 66):
    a = pp_data[f"A{r}"].value
    b = pp_data[f"B{r}"].value
    c = pp_data[f"C{r}"].value
    d = pp_data[f"D{r}"].value
    if any(x is not None for x in (a, b, c, d)):
        print(f"  r{r}: A={a!r} B={b} C={c} D={d}")

print("\n=== PM Pricing rows 53-59 (formulas) ===\n")
for r in range(53, 60):
    row = {}
    for c in "ABCDEFGHIJK":
        cell = pm_price[f"{c}{r}"]
        if cell.value is not None:
            row[c] = str(cell.value)[:150]
    if row:
        print(f"Row {r}:")
        for k, v in row.items():
            print(f"  {k}{r}: {v}")
        print()

print("=== PM Pricing links from PM Publication G45-51 ===\n")
for r in range(45, 52):
    g = pm_pub[f"G{r}"]
    print(f"G{r}: {g.value}")

print("\n=== Prep Work dismissal probs AQ4:AQ10 (data) ===\n")
for r in range(4, 11):
    aq = prep[f"AQ{r}"].value
    d = prep[f"D{r}"].value if r <= 9 else None
    print(f"  AQ{r}={aq}  (D{r}={prep[f'D{r}'].value if r<=10 else 'n/a'})")

wb.close()
wb_data.close()
