#!/usr/bin/env python3
import openpyxl
from pathlib import Path

PATH = Path(r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm")
wb = openpyxl.load_workbook(PATH, read_only=True, data_only=True)
pp = wb["PM Pricing"]

# Row 51-56 headers
for r in range(50, 57):
    row = {}
    for c in "UVWXYZAAABAC":
        v = pp[f"{c}{r}"].value
        if v is not None:
            row[c] = v
    if row:
        print(f"r{r}: {row}")

wb.close()

wb2 = openpyxl.load_workbook(PATH, read_only=True, data_only=False)
pp2 = wb2["PM Pricing"]
print("\nFormulas V56:AA62 row labels:")
for r in range(56, 63):
    v = pp2[f"V{r}"].value
    aa = pp2[f"AA{r}"].value
    print(f"  r{r} V={v} AA={aa}")
wb2.close()
