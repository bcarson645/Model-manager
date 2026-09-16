import re
import zipfile

p = r"c:\Users\b.carson\Downloads\New Zealand v South Africa 63406779 (1).xlsm"
with zipfile.ZipFile(p) as z:
    pr = z.read("xl/worksheets/sheet13.xml").decode("utf-8", errors="ignore")
    prep = z.read("xl/worksheets/sheet7.xml").decode("utf-8", errors="ignore")


def show(xml, cell):
    m = re.search(rf'<c r="{cell}"[^>]*>.*?</c>', xml)
    if not m:
        print(cell, "NOT FOUND")
        return None
    f = re.search(r"<f[^>]*>([^<]*)</f>", m.group(0))
    v = re.search(r"<v>([^<]*)</v>", m.group(0))
    print(cell, (f.group(1)[:350] if f else "no f"), "|", (v.group(1) if v else ""))
    return float(v.group(1)) if v and re.match(r"^-?\d", v.group(1)) else None


print("=== headers / ratio table M/N/O/P 857 ===")
for cell in [
    "L856",
    "M856",
    "N856",
    "O856",
    "P856",
    "M857",
    "N857",
    "O857",
    "P857",
    "C856",
    "C857",
    "C858",
    "C863",
    "C864",
    "C865",
    "C866",
    "C867",
    "J863",
    "I863",
    "H863",
    "I864",
    "H864",
    "I865",
    "H865",
    "I866",
    "H866",
    "I867",
    "H867",
]:
    show(pr, cell)

print("\n=== Prep M45:M49 (SA raw) ===")
for r in range(45, 50):
    show(prep, f"M{r}")
    show(prep, f"L{r}")
    show(prep, f"K{r}")

print("\n=== compute Round(raw*0.72)+0.5 ===")
raws = {
    "Conway": 31.94966128,
    "Latham": 29.04514662,
    "Ester": None,
}
for r in range(45, 50):
    m = re.search(rf'<c r="M{r}"[^>]*>.*?</c>', prep)
    k = re.search(rf'<c r="K{r}"[^>]*>.*?</c>', prep)
    mv = re.search(r"<v>([^<]*)</v>", m.group(0)).group(1)
    # name may be shared string - skip
    print(r, "M", mv, "line", round(float(mv) * 0.72) + 0.5, "csharp Round", int(round(float(mv) * 0.72)) + 0.5)
