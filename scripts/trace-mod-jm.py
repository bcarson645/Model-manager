#!/usr/bin/env python3
import openpyxl
from pathlib import Path

PATH = Path(r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm")
wb = openpyxl.load_workbook(PATH, read_only=True, data_only=False)
pp = wb["PM Pricing"]
wb_d = openpyxl.load_workbook(PATH, read_only=True, data_only=True)
pd = wb_d["PM Pricing"]

for r in range(53, 60):
    print(f"Row {r} ({pp[f'B{r}'].value}):")
    for c in "JKLMOPQ":
        v = pp[f"{c}{r}"].value
        if v:
            print(f"  {c}{r}: {v}")
            dv = pd[f"{c}{r}"].value
            if dv is not None:
                print(f"    val={dv}")
    print()

# Header row for J-M?
for r in [52, 53]:
    vals = [pp[f"{c}{r}"].value for c in "IJKLMN"]
    print(f"Header r{r} I-N: {vals}")

wb.close()
wb_d.close()
