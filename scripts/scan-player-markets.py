import openpyxl
from pathlib import Path

for label, path in [
    ("nz-sa", Path(r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm")),
    ("purulia", Path(r"c:\Users\b.carson\Downloads\Novus Royals Purulia v Murshidabad Kings 71783382.xlsm")),
]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    pm = wb["PM Publication"]
    print(f"=== {label} ===")
    for r in range(1, 400):
        d = pm[f"D{r}"].value
        if not d:
            continue
        ds = str(d)
        if any(k in ds for k in ("Balls Faced", " - Fours", " - Sixes", " - Runs", "Player Perf")):
            print(f"  r{r}: {ds[:55]}")
    wb.close()
