#!/usr/bin/env python3
import sys
from pathlib import Path

import openpyxl
from openpyxl.utils import coordinate_to_tuple

path = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)

wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
prep = wb["Prep Work"]


def cell_value(addr: str):
    row, col = coordinate_to_tuple(addr)
    for r in prep.iter_rows(
        min_row=row, max_row=row, min_col=col, max_col=col, values_only=True
    ):
        return r[0]
    return None


cells = ["A1", "B6", "D6", "E6", "I6", "J6", "BT3", "D3", "D4", "D5", "I4", "I5"]
values = {c: cell_value(c) for c in cells}
for c in cells:
    print(f"{c}={values[c]}")

d3, d4, d5, i4, i5 = values["D3"], values["D4"], values["D5"], values["I4"], values["I5"]
bt3 = values["BT3"]
print(f"D4*D5*D3={d4 * d5 * d3}")
print(f"I4*I5*D3={i4 * i5 * d3}")
print(f"D6*BT3={values['D6'] * bt3}")
print(f"E6 match D6*BT3={abs(values['E6'] - values['D6'] * bt3) < 0.01}")
print(f"I6*BT3={values['I6'] * bt3}")
print(f"J6 match I6*BT3={abs(values['J6'] - values['I6'] * bt3) < 0.01}")

wb.close()
