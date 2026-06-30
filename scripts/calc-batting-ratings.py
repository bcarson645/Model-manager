#!/usr/bin/env python3
import openpyxl
from pathlib import Path

path = Path(
    r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
)
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
prep = wb["Prep Work"]

lookup = {}
for r in range(64, 75):
    pos = int(prep[f"I{r}"].value)
    lookup[pos] = (prep[f"L{r}"].value, prep[f"N{r}"].value)

# Per-row AL and CD from workbook row 24-34 pattern (AL66+r-24, CD on same row)
al_by_pos = {}
cd_by_pos = {}
for row in range(24, 35):
    pos = int(prep[f"I{row}"].value)
    al_row = 66 + (row - 24)
    al_by_pos[pos] = prep[f"AL{al_row}"].value
    cd_by_pos[pos] = prep[f"CD{row}"].value

print("AL by batting pos:", al_by_pos)
print("CD by batting pos:", cd_by_pos)

players = [
    (1, "Mohammad Rizwan", 37, 1.32, 3.27),
    (2, "Saim Ayub", 30, 1.33, 1.04),
    (3, "Babar Azam", 29, 1.38, 2.24),
    (4, "Fakhar Zaman", 26, 1.25, -0.02),
    (5, "Usman Khan", 27, 1.38, 1.71),
    (6, "Shadab Khan", 24, 1.35, 0.53),
    (7, "Imad Wasim", 24, 1.4, 1.07),
    (8, "Shaheen Shah Afridi", 22, 1.25, 0.61),
    (9, "Naseem Shah", 15, 1.25, 0.33),
    (10, "Haris Rauf", 11, 1.1, 0.13),
    (11, "Mohammad Amir", 9, 0.9, 0.03),
]


def calc_q(pos, L, N, al, cd):
    par_avg, par_sr = lookup[pos]
    t1 = al * (((L / N) / (par_avg / par_sr)) - 1)
    t2 = (L / N) * (N - par_sr)
    return (t1 + t2) * cd


def calc_q_flat_cd(pos, L, N, al, cd_flat=0.95):
    return calc_q(pos, L, N, al, cd_flat)


print("\n=== Expected (correct per-row AL+CD) vs UI ===")
print(f"{'Pos':>3} {'Name':<22} {'UI':>6} {'Excel':>7} {'Diff':>7}  (flat CD=0.95)")
total_ui = total_ex = total_flat = 0
for pos, name, L, N, ui in players:
    al = al_by_pos[pos]
    cd = cd_by_pos[pos]
    q = calc_q(pos, L, N, al, cd)
    q_flat = calc_q_flat_cd(pos, L, N, al)
    diff = ui - q
    total_ui += ui
    total_ex += q
    total_flat += q_flat
    print(
        f"{pos:>3} {name:<22} {ui:>6.2f} {q:>7.2f} {diff:>+7.2f}   flat:{q_flat:>6.2f}"
    )

bt3 = prep["BT3"].value
print(f"\nSUM UI: {total_ui:.2f}")
print(f"SUM Excel (per-row AL+CD): {total_ex:.2f}  → team bat {(bt3+total_ex)/bt3:.4f}")
print(f"SUM if flat CD=0.95 all rows: {total_flat:.2f}  → team bat {(bt3+total_flat)/bt3:.4f}")
print(f"UI team bat factor: {(bt3+total_ui)/bt3:.4f}")

wb.close()
