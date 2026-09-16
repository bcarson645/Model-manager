"""Dump Support sheet delivery-outcome probability table (codes like 0,1,2,4,6,W,1w,7n)."""
import openpyxl

wb = openpyxl.load_workbook(
    r"c:\Users\b.carson\Downloads\Atlas 196 (2).xlsm",
    data_only=False,
    keep_vba=True,
)
ws = wb["Support"]

# Around AI/AL 70-160 where codes were found
print("=== Support AI70:AZ160 ===")
for r in range(70, 161):
    parts = []
    for c in range(35, 52):  # AI=35 .. AZ=52
        cell = ws.cell(r, c)
        v = cell.value
        if v is None:
            continue
        s = str(v)
        if len(s) > 70:
            s = s[:67] + "..."
        parts.append(f"{cell.coordinate}={s}")
    if parts:
        print(f"R{r}: " + " | ".join(parts))

print("\n=== Support headers / nearby labels row 1-100 cols AG-BB ===")
for r in range(1, 100):
    for c in range(33, 55):
        cell = ws.cell(r, c)
        v = cell.value
        if isinstance(v, str) and len(v) < 40:
            print(f"{cell.coordinate}: {v}")
