"""Dump Atlas Scoring delivery-outcome probability region."""
import openpyxl

wb = openpyxl.load_workbook(
    r"c:\Users\b.carson\Downloads\Atlas 196 (2).xlsm",
    data_only=False,
    keep_vba=True,
)
ws = wb["Scoring"]

# AG3 headers said code / batruns etc - dump AG36:BB120
print("=== AG36:BB90 ===")
for r in range(36, 91):
    row_parts = []
    for c in range(33, 55):  # AG=33 .. BB=54
        cell = ws.cell(r, c)
        v = cell.value
        if v is None:
            continue
        s = str(v)
        if len(s) > 80:
            s = s[:77] + "..."
        row_parts.append(f"{cell.coordinate}={s}")
    if row_parts:
        print(f"R{r}: " + " | ".join(row_parts))

print("\n=== Search for outcome codes / multipliers across Scoring ===")
needles = [
    "1.23",
    "1.15",
    "1.1",
    "1.05",
    "1.3",
    "0.034",
    "FourVolume",
    "extras",
    "1w",
    "5w",
    "7n",
    "1l",
    "simulation",
    "cumulative",
]
for row in ws.iter_rows(min_row=1, max_row=200, max_col=80):
    for cell in row:
        v = cell.value
        if v is None:
            continue
        s = str(v)
        sl = s.lower()
        if any(n.lower() in sl for n in needles) or (
            isinstance(v, str) and v.strip() in {"0", "1", "2", "3", "4", "6", "W", "1w", "2w", "5n", "7n"}
        ):
            if len(s) < 120:
                print(f"{cell.coordinate}: {s}")
