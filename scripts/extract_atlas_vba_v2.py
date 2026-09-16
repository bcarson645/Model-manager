"""Parse MS-OVBA dir stream for MODULEOFFSET and decompress correctly."""
from __future__ import annotations

import struct
from pathlib import Path

# reuse OleReader + decompress from extract_atlas_vba
import importlib.util

spec = importlib.util.spec_from_file_location(
    "extract_atlas_vba",
    Path(__file__).parent / "extract_atlas_vba.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def parse_dir(dir_data: bytes):
    """Parse PROJECTINFORMATION / MODULE records from dir stream (often compressed)."""
    # dir stream itself is compressed
    if dir_data and dir_data[0] == 0x01:
        data = mod.decompress_vba(dir_data)
    else:
        data = dir_data
    Path(__file__).parent.joinpath("atlas_vba_extract", "dir_decompressed.bin").write_bytes(data)
    # Also try raw
    results = []
    i = 0
    # records: id u16, size u32, data
    while i + 6 <= len(data):
        rec_id = struct.unpack_from("<H", data, i)[0]
        size = struct.unpack_from("<I", data, i + 2)[0]
        i += 6
        payload = data[i : i + size]
        i += size
        results.append((rec_id, size, payload))
        if size > 10_000_000:
            break
    return results, data


def main():
    bin_path = Path(__file__).parent / "atlas_vba_extract" / "vbaProject.bin"
    ole = mod.OleReader(bin_path.read_bytes())
    dir_raw = ole.read_stream("dir")
    records, data = parse_dir(dir_raw)
    print("dir decompressed len", len(data), "records", len(records))
    # Known record IDs from MS-OVBA:
    # 0x0019 MODULESTREAMNAME
    # 0x0031 MODULEOFFSET
    # 0x0047 MODULEDOCSTRING
    name = None
    offsets = {}
    for rec_id, size, payload in records:
        if rec_id == 0x0019:  # MODULESTREAMNAME
            # unicode name size then name
            if len(payload) >= 2:
                # actually payload is the name in unicode already sized by record
                name = payload.decode("utf-16le", errors="replace").rstrip("\x00")
        elif rec_id == 0x0031:  # MODULEOFFSET
            if len(payload) >= 4 and name:
                off = struct.unpack_from("<I", payload, 0)[0]
                offsets[name] = off
                print(f"MODULE {name} offset={off}")
                name = None
        elif rec_id == 0x001A:  # MODULESTREAMNAME unicode? 
            pass

    # Also dump record id histogram
    from collections import Counter
    c = Counter(r[0] for r in records)
    print("top record ids:", c.most_common(20))

    out_dir = Path(__file__).parent / "atlas_vba_extract" / "modules_v2"
    out_dir.mkdir(exist_ok=True)
    want = [
        "SRLDeliveryModule",
        "SRLRandomModule",
        "SRLAutomationModule",
        "SRLWicketModule",
        "SRLFirstInningsModule",
        "SRLSecondInningsModule",
        "ScoringInputModule",
        "SRLSuperOverModule",
    ]
    for name in want:
        off = offsets.get(name, 0)
        try:
            raw = ole.read_stream(name)
        except KeyError:
            print("missing", name)
            continue
        start = off if off < len(raw) else 0
        chunk = raw[start:]
        # find 0x01
        dec = None
        for idx in range(min(16, len(chunk))):
            if chunk[idx] == 0x01:
                try:
                    cand = mod.decompress_vba(chunk[idx:])
                    if b"Attribute VB_Name" in cand or b"Attribute VB_Name".replace(b" ", b"") in cand:
                        dec = cand
                        break
                    if b"Sub " in cand and b"End Sub" in cand:
                        dec = cand
                        break
                except Exception as e:
                    print("decomp err", name, e)
        if dec is None:
            # try whole from offset
            try:
                dec = mod.decompress_vba(chunk if chunk[:1] == b"\x01" else raw)
            except Exception:
                dec = None
        if dec is None:
            print(f"FAIL {name} off={off} rawlen={len(raw)} first16={raw[:16].hex()}")
            continue
        text = dec.decode("latin-1", errors="replace")
        # strip nulls that may appear before Attribute
        if "Attribute VB_Name" in text:
            text = text[text.index("Attribute VB_Name") :]
        (out_dir / f"{name}.bas").write_text(text, encoding="utf-8", errors="replace")
        print(f"OK {name}: {len(text)} chars, has Attribute={('Attribute VB_Name' in text)}")


if __name__ == "__main__":
    main()
