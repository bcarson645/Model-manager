#!/usr/bin/env python3
import openpyxl
from pathlib import Path

path = Path(
    r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
prep = wb["Prep Work"]
for r in range(66, 77):
    print(f"AL{r}={prep[f'AL{r}'].value}")
for c in ["AM66", "AN66", "AO66", "AP66", "AQ66", "AL66"]:
    print(f"{c}={prep[c].value}")
wb.close()
