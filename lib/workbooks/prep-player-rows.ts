import raw from "./prep-player-row-cells.json";
import { calcBattingRating, calcBowlingRating, bowlingBenchmarksT20Men } from "./batting-position-refs";
import {
  formatCellValue,
  type CellExplanation,
} from "./prep-work-tables";

export type PlayerRowCell = {
  address: string;
  row: number;
  col: string;
  formula: string | null;
  value: string | number | boolean | null;
};

export type PlayerMeta = {
  row: number;
  name: string | number | boolean | null;
  battingPosition: string | number | boolean | null;
  bowlingPosition: string | number | boolean | null;
  playerId: string | number | boolean | null;
};

export type PlayerSquad = {
  id: string;
  name: string;
  playerRows: number[];
  teamFoursTotal: PlayerRowCell;
  teamSixesTotal: PlayerRowCell;
  cells: PlayerRowCell[];
  bowlingCells?: PlayerRowCell[];
  dependencyCells: PlayerRowCell[];
  players: PlayerMeta[];
};

export type PlayerRowSnapshot = {
  fixtureId: string;
  label: string;
  sheet: string;
  headers: PlayerRowCell[];
  bowlingHeaders?: PlayerRowCell[];
  sharedInputs: PlayerRowCell[];
  squads: PlayerSquad[];
};

export type UpstreamCell = {
  address: string;
  formula: string | null;
  value: PlayerRowCell["value"];
  role: string;
};

export type PlayerCellExplanation = CellExplanation & {
  playerName?: string;
  battingPosition?: string | number | boolean | null;
  upstreamCells: UpstreamCell[];
};

const snapshot = raw as PlayerRowSnapshot;

const COL_LABELS: Record<string, string> = {
  H: "playerID",
  I: "bat (batting order)",
  J: "bowl (bowling order)",
  K: "name",
  L: "bt.caz (batting average)",
  M: "Raw (expected runs)",
  N: "sr.caz (strike rate factor)",
  O: "Fours",
  P: "Sixes",
  Q: "Rating (batting Q)",
};

const BOWLER_COL_LABELS: Record<string, string> = {
  H: "playerID",
  K: "name",
  J: "bowl (bowling order)",
  V: "overs",
  W: "econ",
  X: "sr",
  Y: "bprop (not in Z)",
  Z: "rating (bowling)",
  AA: "style",
};

const UPSTREAM_ROLES: Record<string, string> = {
  L: "Player batting average (trader input / caz)",
  CD: "Format batting multiplier (CG63 etc. by format)",
  M21: "Team batting scale = conditions × bowling ÷ BW3",
  DV: "Format runs bump (Test +2)",
  DH: "ODI innings modifier (DF24)",
  DF: "ODI pricing blend factor",
  O21: "Match fours calibration constant",
  P21: "Match sixes calibration constant",
  M: "Raw expected runs (feeds fours and sixes)",
  AO: "Fours share of runs (career blend from AG)",
  AR: "Sixes share of runs (career blend from AG)",
  AG: "Career runs in format (Data!P sum for player)",
  CE: "Par fours proportion at low career runs",
  CF: "Par sixes proportion at low career runs",
  AN: "Observed fours/run rate from career data",
  AQ: "Observed sixes/run rate from career data",
  AM: "Career fours count",
  AP: "Career sixes count",
  D3: "Conditions adjustment",
  D5: "Team bowling rating (home)",
  BW3: "Batting weight divisor",
};

function cellMapForSquad(squad: PlayerSquad): Map<string, PlayerRowCell> {
  const map = new Map<string, PlayerRowCell>();
  for (const c of squad.cells) map.set(c.address, c);
  for (const c of squad.dependencyCells) map.set(c.address, c);
  for (const c of snapshot.sharedInputs) map.set(c.address, c);
  map.set(squad.teamFoursTotal.address, squad.teamFoursTotal as PlayerRowCell);
  map.set(squad.teamSixesTotal.address, squad.teamSixesTotal as PlayerRowCell);
  return map;
}

function playerForRow(squad: PlayerSquad, row: number): PlayerMeta | undefined {
  return squad.players.find((p) => p.row === row);
}

function refsForColumn(col: string, row: number): string[] {
  const r = String(row);
  const shared: Record<string, string[]> = {
    M: [`L${r}`, `CD${r}`, "M21", `DV${r}`, `DH${r}`],
    O: ["O21", `M${r}`, `AO${r}`],
    P: ["P21", `M${r}`, `AR${r}`],
  };
  const extra: Record<string, string[]> = {
    M: ["D3", "D5", "BW3"],
    O: [`AG${r}`, `CE${r}`, `AN${r}`, `AM${r}`],
    P: [`AG${r}`, `CF${r}`, `AQ${r}`, `AP${r}`],
  };
  return [...(shared[col] ?? []), ...(extra[col] ?? [])];
}

function explainPlayerColumn(
  col: string,
  row: number,
  squadId: string
): Pick<
  PlayerCellExplanation,
  "summary" | "calculation" | "dataSources" | "namedInputs" | "feedsTo" | "lambdaPath" | "upstreamCells"
> {
  const squad = getPlayerSquad(squadId)!;
  const map = cellMapForSquad(squad);
  const player = playerForRow(squad, row);
  const name = player?.name ?? `Row ${row}`;

  const upstreamCells: UpstreamCell[] = refsForColumn(col, row)
    .filter((addr) => map.has(addr))
    .map((addr) => {
      const c = map.get(addr)!;
      const roleCol = addr.replace(/\d+/g, "");
      return {
        address: addr,
        formula: c.formula,
        value: c.value,
        role: UPSTREAM_ROLES[roleCol] ?? UPSTREAM_ROLES[addr] ?? roleCol,
      };
    });

  if (col === "M") {
    return {
      summary: `${name} — Raw expected runs before boundaries split`,
      calculation: [
        "((L × CD × M21) + DV) × DH",
        "L = player batting average (bt.caz column).",
        "CD = format multiplier from CG block (T20 → CG63 on NZ v SA).",
        "M21 = IF(Match Info Man, D3×D5, D3×D5/BW3) — team conditions × bowling scaled.",
        "DV = +2 runs in Test only; DH = ODI DF modifier else 1.",
        "Raw runs feed O (fours) and P (sixes) on the same row.",
      ],
      dataSources: [
        "Prep Work",
        `Prep Work!L${row}`,
        `Prep Work!CD${row}`,
        "Prep Work!M21",
        "Match Info",
        "Prep Work!D3",
        "Prep Work!D5",
      ],
      namedInputs: ["n_format_a"],
      feedsTo: [`Prep Work!O${row}`, `Prep Work!P${row}`, "PlayerEvaluation expected runs"],
      lambdaPath: "BatsmanEvaluation → expected runs before boundary split",
      upstreamCells,
    };
  }

  if (col === "O") {
    const total = squad.teamFoursTotal;
    return {
      summary: `${name} — expected fours`,
      calculation: [
        "(O21 × M × AO) ÷ 4",
        "O21 = match-level fours calibration (1.03 on NZ v SA).",
        "M = Raw expected runs on this row.",
        "AO = fours proportion of runs — blends CE (par) and AN (career fours/runs) by career runs AG.",
        "AG = SUMIFS career runs from Data!P for this player (H row → Data!AM).",
        `Team total: ${total.address} = ${total.formula?.replace(/^=/, "") ?? "SUM(player O col)"}.`,
        "Lambda: summed into TeamEvaluation.GetTeamFours() → MatchFours.",
      ],
      dataSources: [
        "Prep Work",
        "Data",
        `Prep Work!M${row}`,
        `Prep Work!AO${row}`,
        `Prep Work!AG${row}`,
        total.address,
      ],
      namedInputs: ["n_format_a", "n_max_original", "InfoTeam1Id"],
      feedsTo: [total.address, "TeamEvaluation.GetTeamFours()", "MatchFours.cs"],
      lambdaPath: "SUM(O rows) → GetTeamFours() → MatchFours limited-overs total",
      upstreamCells,
    };
  }

  if (col === "P") {
    const total = squad.teamSixesTotal;
    return {
      summary: `${name} — expected sixes`,
      calculation: [
        "(P21 × M × AR) ÷ 6",
        "P21 = match-level sixes calibration (1.2 on NZ v SA).",
        "M = Raw expected runs on this row.",
        "AR = sixes proportion — blends CF (par) and AQ (career sixes/runs) by career runs AG.",
        "AG/AP/AM chain from Data sheet career boundary counts.",
        `Team total: ${total.address} = ${total.formula?.replace(/^=/, "") ?? "SUM(player P col)"}.`,
        "Lambda: summed into TeamEvaluation.GetTeamSixes() → MatchSixes.",
      ],
      dataSources: [
        "Prep Work",
        "Data",
        `Prep Work!M${row}`,
        `Prep Work!AR${row}`,
        `Prep Work!AG${row}`,
        total.address,
      ],
      namedInputs: ["n_format_a", "n_max_original"],
      feedsTo: [total.address, "TeamEvaluation.GetTeamSixes()", "MatchSixes.cs"],
      lambdaPath: "SUM(P rows) → GetTeamSixes() → MatchSixes limited-overs total",
      upstreamCells,
    };
  }

  if (col === "K") {
    return {
      summary: `${name} — player name`,
      calculation: [
        "Pulled from Match Info squad list (e.g. C43 for opener).",
        "Used to MATCH player on Rosters sheet for playerID in column H.",
      ],
      dataSources: ["Match Info", "Rosters"],
      namedInputs: [],
      feedsTo: [`Prep Work!H${row}`],
      upstreamCells,
    };
  }

  if (col === "I") {
    return {
      summary: `${name} — batting order slot ${player?.battingPosition ?? "?"}`,
      calculation: [
        "Batting position 1–11 in the XI.",
        "Feeds VLOOKUP in Q column batting rating and milestone tables.",
      ],
      dataSources: ["Prep Work!I64:N74 lookup"],
      namedInputs: [],
      feedsTo: [`Prep Work!Q${row}`, "Table 2 fifty/hundred calibrations"],
      upstreamCells,
    };
  }

  if (col === "H") {
    return {
      summary: `${name} — roster player ID`,
      calculation: [
        "INDEX(Rosters!A:A, MATCH(name in K, Rosters!C:C)).",
        "Links row to Data!AM career stats for AG and boundary proportions.",
      ],
      dataSources: ["Rosters", "Data!AM"],
      namedInputs: [],
      feedsTo: [`Prep Work!AG${row}`],
      upstreamCells,
    };
  }

  if (col === "L") {
    return {
      summary: `${name} — batting average input (bt.caz)`,
      calculation: [
        "Trader/stat input for player average.",
        "Primary driver of Raw (M) alongside format multiplier CD.",
      ],
      dataSources: ["Prep Work (trader/stat input)"],
      namedInputs: [],
      feedsTo: [`Prep Work!M${row}`, `Prep Work!Q${row}`],
      upstreamCells,
    };
  }

  if (col === "N") {
    return {
      summary: `${name} — strike rate factor (sr.caz)`,
      calculation: [
        "Trader/stat strike rate input.",
        "Used in Q column batting rating formula (limited-overs path).",
      ],
      dataSources: ["Prep Work (trader/stat input)"],
      namedInputs: [],
      feedsTo: [`Prep Work!Q${row}`],
      upstreamCells,
    };
  }

  if (col === "AG") {
    return {
      summary: `${name} — career runs in this format`,
      calculation: [
        "SUMIFS Data!P (innings runs) for this player (Data!AM = H playerID), matching format overs.",
        "Drives AO/AR boundary proportion blends.",
      ],
      dataSources: ["Data", `Prep Work!H${row}`],
      namedInputs: ["n_max_original"],
      feedsTo: [`Prep Work!AO${row}`, `Prep Work!AR${row}`],
      upstreamCells,
    };
  }

  if (col === "AO") {
    return {
      summary: `${name} — fours proportion of runs`,
      calculation: [
        "IF AG<10 use CE (par); IF AG>6000 use AN; else linear blend between CE and AN by career runs.",
        "AN = (AM×4)/AG — observed fours per run from career data.",
      ],
      dataSources: [`Prep Work!AG${row}`, `Prep Work!CE${row}`, `Prep Work!AN${row}`],
      namedInputs: ["n_format_a"],
      feedsTo: [`Prep Work!O${row}`],
      upstreamCells,
    };
  }

  if (col === "AR") {
    return {
      summary: `${name} — sixes proportion of runs`,
      calculation: [
        "IF AG<10 use CF (par); IF AG>1500 use AQ; else linear blend between CF and AQ.",
        "AQ = (AP×6)/AG — observed sixes per run from career data.",
      ],
      dataSources: [`Prep Work!AG${row}`, `Prep Work!CF${row}`, `Prep Work!AQ${row}`],
      namedInputs: ["n_format_a"],
      feedsTo: [`Prep Work!P${row}`],
      upstreamCells,
    };
  }

  if (col === "CD") {
    return {
      summary: `${name} — position CD multiplier (batting)`,
      calculation: [
        "Per-batting-slot multiplier on Q rating — decays from 0.95 (opener) to 0.05 (#11).",
        "NOT the same as CG63 format cell — use CD on this player row.",
      ],
      dataSources: [`Prep Work!CD${row}`],
      namedInputs: ["n_format_a"],
      feedsTo: [`Prep Work!Q${row}`],
      upstreamCells,
    };
  }

  if (col === "Q") {
    const pos = Number(player?.battingPosition ?? 0);
    const L = map.get(`L${row}`)?.value;
    const N = map.get(`N${row}`)?.value;
    const expected =
      typeof L === "number" && typeof N === "number" && pos
        ? calcBattingRating(pos, L, N)
        : undefined;
    return {
      summary: `${name} — batting rating (Q)`,
      calculation: [
        "Limited overs: (AL[pos] × (((L/N)/(parAvg/parSR)) − 1) + (L/N)×(N − parSR)) × CD[row].",
        "AL and CD both vary by batting position (AL66+offset, CD24+offset).",
        "Test format: (L − parAvg) × CD only.",
        expected !== undefined
          ? `Recalc check: ${expected.toFixed(2)} (compare to cell value).`
          : "See batting position refs table for parAvg/parSR/AL/CD per slot.",
      ],
      dataSources: [
        `Prep Work!L${row}`,
        `Prep Work!N${row}`,
        `Prep Work!CD${row}`,
        `Prep Work!AL${65 + pos}`,
        "Prep Work!I64:N74",
      ],
      namedInputs: ["n_format_a", "ImpactActive"],
      feedsTo: ["SUM(Q) → team batting D4/I4", "Prep Work!M row (raw runs)"],
      lambdaPath: "TeamEvaluation.BattingRating rollup",
      upstreamCells,
    };
  }

  return {
    summary: `${name} — ${COL_LABELS[col] ?? col}`,
    calculation: ["See Excel formula in this cell."],
    dataSources: ["Prep Work"],
    namedInputs: [],
    feedsTo: [],
    upstreamCells,
  };
}

export function getPlayerRowSnapshot(): PlayerRowSnapshot {
  return snapshot;
}

export function getPlayerSquads(): PlayerSquad[] {
  return snapshot.squads;
}

export function getPlayerSquad(id: string): PlayerSquad | undefined {
  return snapshot.squads.find((s) => s.id === id);
}

export function getPlayerRowCols(): string[] {
  return ["H", "I", "K", "L", "N", "Q", "M", "O", "P"];
}

export function getBowlerRowCols(): string[] {
  return ["H", "K", "J", "V", "W", "X", "Z"];
}

function bowlerCellMapForSquad(squad: PlayerSquad): Map<string, PlayerRowCell> {
  const map = new Map<string, PlayerRowCell>();
  for (const c of squad.cells) {
    if (["H", "K", "J", "I"].includes(c.col)) map.set(c.address, c);
  }
  for (const c of squad.bowlingCells ?? []) map.set(c.address, c);
  for (const c of snapshot.sharedInputs) map.set(c.address, c);
  if (snapshot.bowlingHeaders) {
    for (const h of snapshot.bowlingHeaders) map.set(h.address, h);
  }
  return map;
}

function explainBowlerColumn(
  col: string,
  row: number,
  squadId: string
): Pick<
  PlayerCellExplanation,
  "summary" | "calculation" | "dataSources" | "namedInputs" | "feedsTo" | "lambdaPath" | "upstreamCells"
> {
  const squad = getPlayerSquad(squadId)!;
  const map = bowlerCellMapForSquad(squad);
  const player = playerForRow(squad, row);
  const name = player?.name ?? `Row ${row}`;
  const upstreamCells: UpstreamCell[] = [];

  if (col === "Z") {
    const v = map.get(`V${row}`)?.value;
    const w = map.get(`W${row}`)?.value;
    const x = map.get(`X${row}`)?.value;
    const expected =
      typeof v === "number" && typeof w === "number" && typeof x === "number"
        ? calcBowlingRating(v, w, x)
        : undefined;
    return {
      summary: `${name} — bowling rating (Z)`,
      calculation: [
        "Z = overs × ((W63 − economy) + Y63 × (sr − X63)).",
        "Same formula every row — NO position coefficients.",
        "If overs (V) = 0, rating must be 0.",
        "W column is economy (header econ), not bowling average.",
        "Y (bprop) and AA (style) are NOT in the Z formula.",
        expected !== undefined
          ? `Recalc: ${expected.toFixed(2)} vs cell ${formatCellValue(map.get(`Z${row}`)?.value ?? null)}.`
          : "",
      ].filter(Boolean),
      dataSources: [
        `Prep Work!V${row}`,
        `Prep Work!W${row}`,
        `Prep Work!X${row}`,
        "Prep Work!W63",
        "Prep Work!Y63",
        "Prep Work!X63",
      ],
      namedInputs: ["n_format_a", "n_gender"],
      feedsTo: ["SUM(Z) → team bowling D5/I5", "(BT3 − SUM(Z)) / BT3"],
      lambdaPath: "TeamEvaluation.BowlingRating",
      upstreamCells,
    };
  }

  if (col === "V") {
    return {
      summary: `${name} — overs (multiplier)`,
      calculation: ["Overs bowled — scales entire Z rating. Zero overs → Z = 0."],
      dataSources: [`Prep Work!V${row}`],
      namedInputs: [],
      feedsTo: [`Prep Work!Z${row}`],
      upstreamCells,
    };
  }

  if (col === "W") {
    return {
      summary: `${name} — economy`,
      calculation: [
        "(W63 − W) term — lower economy (better) increases Z.",
        "Do not map from Avg=0 column; use econ column.",
      ],
      dataSources: [`Prep Work!W${row}`, "Prep Work!W63"],
      namedInputs: [],
      feedsTo: [`Prep Work!Z${row}`],
      upstreamCells,
    };
  }

  if (col === "X") {
    return {
      summary: `${name} — strike rate factor`,
      calculation: ["Y63 × (X − X63) term inside Z formula."],
      dataSources: [`Prep Work!X${row}`, "Prep Work!X63"],
      namedInputs: [],
      feedsTo: [`Prep Work!Z${row}`],
      upstreamCells,
    };
  }

  return {
    summary: `${name} — ${BOWLER_COL_LABELS[col] ?? col}`,
    calculation: ["See Excel cell."],
    dataSources: ["Prep Work"],
    namedInputs: [],
    feedsTo: [],
    upstreamCells,
  };
}

export function explainBowlerRowCell(
  squadId: string,
  address: string
): PlayerCellExplanation | undefined {
  const squad = getPlayerSquad(squadId);
  if (!squad) return undefined;

  const map = bowlerCellMapForSquad(squad);
  const cell = map.get(address);
  if (!cell) return undefined;

  const player = playerForRow(squad, cell.row);
  const colLabel = BOWLER_COL_LABELS[cell.col] ?? cell.col;
  const doc = explainBowlerColumn(cell.col, cell.row, squadId);

  const rowLabel =
    cell.row === 23
      ? `Header — ${colLabel}`
      : `${player?.name ?? "Player"} (bowl #${player?.bowlingPosition ?? "?"})`;

  return {
    address: cell.address,
    rowLabel,
    colLabel,
    playerName: player?.name != null ? String(player.name) : undefined,
    battingPosition: player?.bowlingPosition,
    summary: doc.summary,
    formula: cell.formula,
    value: cell.value,
    calculation: doc.calculation,
    dataSources: doc.dataSources,
    namedInputs: doc.namedInputs,
    feedsTo: doc.feedsTo,
    lambdaPath: doc.lambdaPath,
    upstreamCells: doc.upstreamCells,
  };
}

export function buildBowlerRowGrid(squadId: string): {
  rows: number[];
  cols: string[];
  cellMap: Map<string, PlayerRowCell>;
  rowLabels: Map<number, string>;
} {
  const squad = getPlayerSquad(squadId)!;
  const cols = getBowlerRowCols();
  const rows = [23, ...squad.playerRows];
  const cellMap = bowlerCellMapForSquad(squad);

  const rowLabels = new Map<number, string>();
  rowLabels.set(23, "Headers");
  for (const p of squad.players) {
    rowLabels.set(p.row, `${p.name} (bowl #${p.bowlingPosition})`);
  }

  return { rows, cols, cellMap, rowLabels };
}

export function explainPlayerRowCell(
  squadId: string,
  address: string
): PlayerCellExplanation | undefined {
  const squad = getPlayerSquad(squadId);
  if (!squad) return undefined;

  const map = cellMapForSquad(squad);
  const cell = map.get(address) ?? squad.cells.find((c) => c.address === address);
  if (!cell) return undefined;

  const player = playerForRow(squad, cell.row);
  const colLabel = COL_LABELS[cell.col] ?? cell.col;
  const doc = explainPlayerColumn(cell.col, cell.row, squadId);

  const rowLabel =
    cell.row === 23
      ? `Header — ${colLabel}`
      : `${player?.name ?? "Player"} (bat #${player?.battingPosition ?? "?"})`;

  return {
    address: cell.address,
    rowLabel,
    colLabel,
    playerName: player?.name != null ? String(player.name) : undefined,
    battingPosition: player?.battingPosition,
    summary: doc.summary,
    formula: cell.formula,
    value: cell.value,
    calculation: doc.calculation,
    dataSources: doc.dataSources,
    namedInputs: doc.namedInputs,
    feedsTo: doc.feedsTo,
    lambdaPath: doc.lambdaPath,
    upstreamCells: doc.upstreamCells,
  };
}

export function buildPlayerRowGrid(squadId: string): {
  rows: number[];
  cols: string[];
  cellMap: Map<string, PlayerRowCell>;
  rowLabels: Map<number, string>;
} {
  const squad = getPlayerSquad(squadId)!;
  const cols = getPlayerRowCols();
  const rows = [23, ...squad.playerRows];
  const cellMap = cellMapForSquad(squad);
  for (const h of snapshot.headers) cellMap.set(h.address, h);

  const rowLabels = new Map<number, string>();
  rowLabels.set(23, "Headers");
  for (const p of squad.players) {
    rowLabels.set(p.row, `${p.name} (#${p.battingPosition})`);
  }

  return { rows, cols, cellMap, rowLabels };
}

export { formatCellValue };
