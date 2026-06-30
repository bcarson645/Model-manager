"""Shared scorecard workbook extraction (ODI, T20, List A, etc.)."""

import json
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

import openpyxl

HEADER_ROW = 16
DATA_SHEET = "Data"


def serialize(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, float) and value == int(value):
        return int(value)
    if isinstance(value, bool):
        return value
    return value


def fix_headers(headers: list) -> list[str]:
    seen: dict[str, int] = {}
    fixed: list[str] = []
    for h in headers:
        key = str(h).strip() if h else "col"
        if key in seen:
            seen[key] += 1
            fixed.append(f"{key}_{seen[key]}")
        else:
            seen[key] = 0
            fixed.append(key)
    return fixed


def to_bool_flag(value) -> bool:
    return value == 1 or value == "1" or value is True


def read_rows(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = wb[DATA_SHEET]
    rows_iter = sheet.iter_rows(min_row=HEADER_ROW, values_only=True)
    headers = fix_headers(list(next(rows_iter)))

    records: list[dict] = []
    for row in rows_iter:
        if not row or not any(v is not None and str(v).strip() != "" for v in row):
            continue
        rec = {
            headers[i]: serialize(row[i] if i < len(row) else None)
            for i in range(len(headers))
        }
        rec["_sourceFile"] = path.name
        records.append(rec)
    wb.close()
    return records


def player_from_row(row: dict, inferred_top_bowler_id) -> dict:
    player_id = row.get("PlayerID")
    is_inferred_top_bowler = (
        inferred_top_bowler_id is not None and player_id == inferred_top_bowler_id
    )
    return {
        "playerId": player_id,
        "name": row.get("Name"),
        "team": row.get("Team"),
        "teamId": row.get("TeamID"),
        "opponent": row.get("Opps"),
        "innings": row.get("Inns"),
        "battingOrder": row.get("Order"),
        "dismissal": row.get("Dismissal"),
        "batting": {
            "runs": row.get("Runs"),
            "balls": row.get("Balls"),
            "fours": row.get("Fours"),
            "sixes": row.get("Sixes"),
            "inningsTopBatter": to_bool_flag(row.get("Tp.Bt")),
            "matchTopBatter": to_bool_flag(row.get("Match.Tp.Bt")),
        },
        "bowling": {
            "overs": row.get("Overs"),
            "maidens": row.get("Maidens"),
            "runs": row.get("Runs_1"),
            "wickets": row.get("Wickets"),
            "inningsTopBowler": to_bool_flag(row.get("Top Bowl")),
            "matchTopBowler": is_inferred_top_bowler,
        },
        "fielding": {"catches": row.get("Catches")},
    }


def infer_top_bowler_row(rows: list[dict]) -> dict | None:
    """Most wickets in the match; ties broken by fewest runs conceded."""
    candidates: list[dict] = []
    for row in rows:
        wickets = row.get("Wickets")
        if wickets is None or wickets == "":
            continue
        wickets = int(wickets)
        if wickets <= 0:
            continue
        runs = row.get("Runs_1")
        runs_conceded = int(runs) if runs is not None and runs != "" else 999999
        candidates.append(
            {"row": row, "wickets": wickets, "runs_conceded": runs_conceded}
        )

    if not candidates:
        return None

    best = max(
        candidates,
        key=lambda c: (
            c["wickets"],
            -c["runs_conceded"],
            str(c["row"].get("PlayerID") or ""),
        ),
    )
    return best["row"]


def build_match(match_id: str, rows: list[dict]) -> dict:
    first = rows[0]
    inferred_top_bowler_row = infer_top_bowler_row(rows)
    inferred_top_bowler_id = (
        inferred_top_bowler_row.get("PlayerID") if inferred_top_bowler_row else None
    )
    innings_map: dict[tuple, dict] = {}

    for row in rows:
        key = (row["Team"], row["Inns"])
        if key not in innings_map:
            innings_map[key] = {
                "team": row["Team"],
                "teamId": row.get("TeamID"),
                "opponent": row["Opps"],
                "innings": row["Inns"],
                "total": row["Total"],
                "wickets": row["Wkts"],
                "extras": row.get("Extras"),
                "players": [],
            }
        innings_map[key]["players"].append(
            player_from_row(row, inferred_top_bowler_id)
        )

    innings_list = sorted(innings_map.values(), key=lambda x: (x["innings"], x["team"]))
    team_totals = {inn["team"]: inn["total"] for inn in innings_list}

    winner = None
    result = "decided"
    if len(team_totals) == 2:
        teams = list(team_totals.items())
        if teams[0][1] == teams[1][1]:
            result = "tie"
        else:
            winner = max(teams, key=lambda x: x[1] or 0)[0]

    top_batter_row = next((r for r in rows if to_bool_flag(r.get("Match.Tp.Bt"))), None)
    top_batter = None
    if top_batter_row:
        top_batter = {
            "playerId": top_batter_row.get("PlayerID"),
            "name": top_batter_row.get("Name"),
            "team": top_batter_row.get("Team"),
            "runs": top_batter_row.get("Runs"),
        }

    top_bowler = None
    if inferred_top_bowler_row:
        top_bowler = {
            "playerId": inferred_top_bowler_row.get("PlayerID"),
            "name": inferred_top_bowler_row.get("Name"),
            "team": inferred_top_bowler_row.get("Team"),
            "wickets": inferred_top_bowler_row.get("Wickets"),
            "runs": inferred_top_bowler_row.get("Runs_1"),
            "inferred": True,
        }

    return {
        "id": match_id,
        "sourceFile": first.get("_sourceFile"),
        "date": first.get("Date"),
        "format": first.get("Format"),
        "maxOvers": first.get("Max"),
        "venue": first.get("Venue"),
        "host": first.get("Host"),
        "competitionId": first.get("CompetitionID"),
        "venueId": first.get("VenueID"),
        "hostId": first.get("HostID"),
        "innings": innings_list,
        "teamTotals": team_totals,
        "winner": winner,
        "result": result,
        "topBatter": top_batter,
        "topBowler": top_bowler,
        "rowCount": len(rows),
    }


def matches_from_rows(rows: list[dict]) -> dict[str, dict]:
    by_match: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_match[str(row["ID"])].append(row)
    return {mid: build_match(mid, mrows) for mid, mrows in by_match.items()}


def merge_matches(sources: list[tuple[Path, dict[str, dict]]]) -> tuple[list[dict], dict]:
    merged: dict[str, dict] = {}
    clash_log: list[dict] = []

    for path, match_map in sources:
        for mid, match in match_map.items():
            if mid not in merged:
                merged[mid] = match
                continue
            existing = merged[mid]
            if match["rowCount"] > existing["rowCount"]:
                clash_log.append(
                    {"id": mid, "kept": path.name, "dropped": existing["sourceFile"]}
                )
                merged[mid] = match
            else:
                clash_log.append(
                    {"id": mid, "kept": existing["sourceFile"], "dropped": path.name}
                )

    return sorted(merged.values(), key=lambda m: m["id"]), {"duplicateIds": clash_log}


def build_profile(
    source_stats: list[dict], matches: list[dict], raw_row_count: int, merge_info: dict
) -> dict:
    row_counts = defaultdict(int)
    format_counts = defaultdict(int)
    source_counts = defaultdict(int)
    for m in matches:
        row_counts[m["rowCount"]] += 1
        if m.get("format"):
            format_counts[m["format"]] += 1
        if m.get("sourceFile"):
            source_counts[m["sourceFile"]] += 1

    return {
        "sourceFiles": source_stats,
        "sheetName": DATA_SHEET,
        "headerRow": HEADER_ROW,
        "rawRowCount": raw_row_count,
        "matchCount": len(matches),
        "rowsPerMatch": {
            "distribution": {str(k): v for k, v in sorted(row_counts.items())},
            "typical": max(row_counts, key=row_counts.get) if row_counts else 0,
        },
        "formatCounts": dict(sorted(format_counts.items(), key=lambda x: -x[1])),
        "matchesPerSource": dict(source_counts),
        "mergeInfo": merge_info,
        "inferredKeys": {
            "gameId": "ID",
            "date": "Date",
            "playerId": "PlayerID",
            "playerName": "Name",
            "team": "Team",
            "innings": "Inns",
            "teamTotal": "Total",
            "matchTopBatter": "Match.Tp.Bt",
            "matchTopBowler": "Wickets (inferred; ties by fewest Runs conceded)",
        },
        "gameStructure": (
            "Each match is grouped by ID. Match-level fields repeat on every row. "
            "Total is the team innings score; winner inferred by higher Total across "
            "the two teams."
        ),
    }


def extract_scorecards(paths: list[Path], out_dir: Path) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)

    source_stats: list[dict] = []
    source_matches: list[tuple[Path, dict[str, dict]]] = []
    total_rows = 0

    for path in paths:
        rows = read_rows(path)
        match_map = matches_from_rows(rows)
        source_stats.append(
            {"file": path.name, "rawRowCount": len(rows), "matchCount": len(match_map)}
        )
        source_matches.append((path, match_map))
        total_rows += len(rows)
        print(f"  {path.name}: {len(rows)} rows -> {len(match_map)} matches")

    matches, merge_info = merge_matches(source_matches)
    profile = build_profile(source_stats, matches, total_rows, merge_info)

    (out_dir / "matches.json").write_text(json.dumps(matches, indent=2), encoding="utf-8")
    (out_dir / "schema-profile.json").write_text(
        json.dumps(profile, indent=2), encoding="utf-8"
    )

    print(f"\nWrote {len(matches)} matches to {out_dir / 'matches.json'}")
    print(f"  Combined raw rows: {total_rows}")
    if merge_info["duplicateIds"]:
        print(f"  Duplicate IDs resolved: {len(merge_info['duplicateIds'])}")

    return matches
