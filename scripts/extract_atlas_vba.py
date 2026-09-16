"""Minimal OLE compound-file reader + MS-OVBA decompress for Atlas VBA."""
from __future__ import annotations

import struct
from pathlib import Path


def copy_token_help(difference: int):
    if difference <= 1:
        bit_count = 4
    else:
        bit_count = max((difference - 1).bit_length(), 4)
    length_mask = 0xFFFF >> bit_count
    offset_mask = (~length_mask) & 0xFFFF
    return length_mask, offset_mask, bit_count


def decompress_vba(compressed: bytes) -> bytes:
    if not compressed or compressed[0] != 0x01:
        return compressed
    out = bytearray()
    i = 1
    while i + 2 <= len(compressed):
        chunk_start = i
        header = compressed[i] | (compressed[i + 1] << 8)
        size = (header & 0x0FFF) + 3
        chunk_sig = (header >> 12) & 0x7
        is_compressed = (header >> 15) & 0x1
        end = min(len(compressed), chunk_start + size)
        i = chunk_start + 2
        if chunk_sig != 0x3:
            break
        if is_compressed == 0:
            out.extend(compressed[i:i + 4096])
            i = end
            continue
        chunk_out_start = len(out)
        while i < end:
            flag = compressed[i]
            i += 1
            for bit in range(8):
                if i >= end:
                    break
                if (flag & (1 << bit)) == 0:
                    out.append(compressed[i])
                    i += 1
                else:
                    if i + 1 >= end:
                        break
                    token = compressed[i] | (compressed[i + 1] << 8)
                    i += 2
                    diff = len(out) - chunk_out_start
                    length_mask, offset_mask, bit_count = copy_token_help(diff)
                    length = (token & length_mask) + 3
                    offset = ((token & offset_mask) >> (16 - bit_count)) + 1
                    src = len(out) - offset
                    for j in range(src, src + length):
                        out.append(out[j])
    return bytes(out)


class OleReader:
    def __init__(self, data: bytes):
        self.data = data
        magic = data[0:8]
        if magic != b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
            raise ValueError("Not an OLE compound file")
        # Header after signature(8)+CLSID(16)+minor(2)+major(2)+byteOrder(2) @ offset 30:
        # sectorShift u16, miniSectorShift u16, reserved 6, numDirSectors u32,
        # numFatSectors u32, firstDirSector u32, transaction u32, miniStreamCutoff u32,
        # firstMiniFatSector u32, numMiniFatSectors u32, firstDifatSector u32, numDifatSectors u32
        (
            self.sector_shift,
            self.mini_sector_shift,
        ) = struct.unpack_from("<HH", data, 30)
        (
            _num_dir,
            self.fat_count,
            self.dir_first,
            _tx,
            self.mini_cutoff,
            self.mini_fat_first,
            self.mini_fat_count,
            self.difat_first,
            self.difat_count,
        ) = struct.unpack_from("<IIIIIIIII", data, 40)
        self.sector_size = 1 << self.sector_shift
        self.mini_sector_size = 1 << self.mini_sector_shift
        self.fat = self._build_fat()
        self.entries = self._read_dir()

    def _sector(self, index: int) -> bytes:
        start = 512 + index * self.sector_size
        return self.data[start : start + self.sector_size]

    def _build_fat(self) -> list[int]:
        difat = list(struct.unpack_from("<" + "I" * 109, self.data, 76))
        sector = self.difat_first
        for _ in range(self.difat_count):
            if sector >= 0xFFFFFFFE:
                break
            blob = self._sector(sector)
            vals = list(struct.unpack_from("<" + "I" * (self.sector_size // 4), blob))
            difat.extend(vals[:-1])
            sector = vals[-1]
        fat: list[int] = []
        for fat_sec in difat[: self.fat_count]:
            if fat_sec >= 0xFFFFFFFE:
                break
            blob = self._sector(fat_sec)
            fat.extend(struct.unpack_from("<" + "I" * (self.sector_size // 4), blob))
        return fat

    def _chain(self, start: int) -> bytes:
        out = bytearray()
        sec = start
        seen = set()
        while sec < 0xFFFFFFFE:
            if sec in seen:
                break
            seen.add(sec)
            out.extend(self._sector(sec))
            if sec >= len(self.fat):
                break
            sec = self.fat[sec]
        return bytes(out)

    def _read_dir(self):
        blob = self._chain(self.dir_first)
        entries = []
        for i in range(0, len(blob), 128):
            e = blob[i : i + 128]
            if len(e) < 128:
                break
            name_len = struct.unpack_from("<H", e, 64)[0]
            name = e[0:name_len].decode("utf-16le", errors="replace").rstrip("\x00")
            obj_type = e[66]
            start_sector = struct.unpack_from("<I", e, 116)[0]
            size = struct.unpack_from("<I", e, 120)[0]
            entries.append(
                {
                    "name": name,
                    "type": obj_type,
                    "start": start_sector,
                    "size": size,
                    "index": i // 128,
                }
            )
        return entries

    def read_stream(self, name: str) -> bytes:
        entry = next((e for e in self.entries if e["name"] == name and e["type"] == 2), None)
        if entry is None:
            raise KeyError(name)
        if entry["size"] < self.mini_cutoff:
            # mini stream via root storage
            root = next(e for e in self.entries if e["type"] == 5)
            mini_stream = self._chain(root["start"])
            # mini FAT
            mini_fat_blob = self._chain(self.mini_fat_first) if self.mini_fat_count else b""
            mini_fat = list(
                struct.unpack_from("<" + "I" * (len(mini_fat_blob) // 4), mini_fat_blob)
            )
            out = bytearray()
            sec = entry["start"]
            seen = set()
            while sec < 0xFFFFFFFE and len(out) < entry["size"]:
                if sec in seen:
                    break
                seen.add(sec)
                start = sec * self.mini_sector_size
                out.extend(mini_stream[start : start + self.mini_sector_size])
                if sec >= len(mini_fat):
                    break
                sec = mini_fat[sec]
            return bytes(out[: entry["size"]])
        data = self._chain(entry["start"])
        return data[: entry["size"]]


def main():
    bin_path = Path(__file__).parent / "atlas_vba_extract" / "vbaProject.bin"
    out_dir = Path(__file__).parent / "atlas_vba_extract" / "modules"
    out_dir.mkdir(parents=True, exist_ok=True)

    ole = OleReader(bin_path.read_bytes())
    print("streams:")
    for e in ole.entries:
        if e["type"] == 2:
            print(f"  {e['name']}: {e['size']}")

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
        try:
            raw = ole.read_stream(name)
        except KeyError:
            print(f"MISSING {name}")
            continue
        dec = None
        for idx in range(min(256, len(raw))):
            if raw[idx] != 0x01:
                continue
            try:
                cand = decompress_vba(raw[idx:])
                if b"Attribute VB_Name" in cand or b"Sub " in cand:
                    dec = cand
                    print(f"  {name}: offset {idx}")
                    break
            except Exception:
                continue
        if dec is None:
            (out_dir / f"{name}.bin").write_bytes(raw)
            print(f"FAIL {name} ({len(raw)} bytes)")
            continue
        text = dec.decode("latin-1", errors="replace")
        (out_dir / f"{name}.bas").write_text(text, encoding="utf-8", errors="replace")
        print(f"OK {name}: {len(text)} chars")


if __name__ == "__main__":
    main()
