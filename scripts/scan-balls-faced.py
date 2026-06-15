import openpyxl
from pathlib import Path

p = Path(r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm")
wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
pm = wb["PM Publication"]
for r in range(250, 350):
    d = pm[f"D{r}"].value
    if d and "Balls" in str(d):
        print(f"r{r}: D={d!r} F={pm[f'F{r}'].value} G={pm[f'G{r}'].value} I={pm[f'I{r}'].value}")
wb.close()
