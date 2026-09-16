"""Dump Pricing delivery-outcome probability block A1650:H1700 and Support factors."""
import openpyxl

wb = openpyxl.load_workbook(
    r"c:\Users\b.carson\Downloads\Atlas 196 (2).xlsm",
    data_only=False,
    keep_vba=True,
)

ws = wb["Pricing"]
print("=== Pricing A1648:L1700 ===")
for r in range(1648, 1701):
    parts = []
    for c in range(1, 13):
        cell = ws.cell(r, c)
        v = cell.value
        if v is None:
            continue
        s = str(v)
        if len(s) > 90:
            s = s[:87] + "..."
        parts.append(f"{cell.coordinate}={s}")
    if parts:
        print(f"R{r}: " + " | ".join(parts))

# Also headers above
print("\n=== Pricing headers around 1640-1653 ===")
for r in range(1635, 1654):
    parts = []
    for c in range(1, 13):
        cell = ws.cell(r, c)
        v = cell.value
        if v is None:
            continue
        s = str(v)
        if len(s) > 80:
            s = s[:77] + "..."
        parts.append(f"{cell.coordinate}={s}")
    if parts:
        print(f"R{r}: " + " | ".join(parts))

ws2 = wb["Support"]
print("\n=== Support AN60:AT110 key factors ===")
for r in range(60, 110):
    parts = []
    for c in range(39, 47):  # AN..AT
        cell = ws2.cell(r, c)
        v = cell.value
        if v is None:
            continue
        s = str(v)
        if len(s) > 80:
            s = s[:77] + "..."
        parts.append(f"{cell.coordinate}={s}")
    if parts:
        print(f"R{r}: " + " | ".join(parts))

# Search Pricing for 0.034 / 1.23 / simulation-like multipliers near delivery block
print("\n=== Pricing search near delivery for extras multipliers ===")
for r in range(1600, 1800):
    for c in range(1, 40):
        v = ws.cell(r, c).value
        if v is None:
            continue
        s = str(v)
        if any(x in s for x in ["0.034", "0.064", "0.051", "0.037", "1.23", "1.15", "*1.1", "0.011", "0.005"]):
            print(f"{ws.cell(r,c).coordinate}: {s[:140]}")
