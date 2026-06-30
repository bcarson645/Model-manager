#!/usr/bin/env python3
import openpyxl
from pathlib import Path

path = Path(
    r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)
wb = openpyxl.load_workbook(path, read_only=True, data_only=False)
wbv = openpyxl.load_workbook(path, read_only=True, data_only=True)
prep = wb["Prep Work"]
prepv = wbv["Prep Work"]
for row in range(24, 35):
    qf = str(prep[f"Q{row}"].value)
    qv = prepv[f"Q{row}"].value
    print(f"Q{row}={qv}")
    print(f"  formula: {qf[:200]}")
    print(
        f"  I={prepv[f'I{row}'].value} L={prepv[f'L{row}'].value} "
        f"N={prepv[f'N{row}'].value} CD={prepv[f'CD{row}'].value}"
    )
wb.close()
wbv.close()
