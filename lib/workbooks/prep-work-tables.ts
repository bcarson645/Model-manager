import raw from "./prep-work-table-cells.json";

export type PrepWorkTableCell = {
  address: string;
  row: number;
  col: string;
  formula: string | null;
  value: string | number | boolean | null;
};

export type PrepWorkTable = {
  id: string;
  name: string;
  range: string;
  cells: PrepWorkTableCell[];
};

export type PrepWorkTableSnapshot = {
  fixtureId: string;
  label: string;
  sheet: string;
  tables: PrepWorkTable[];
};

export type CellExplanation = {
  address: string;
  rowLabel: string;
  colLabel: string;
  summary: string;
  formula: string | null;
  value: PrepWorkTableCell["value"];
  calculation: string[];
  dataSources: string[];
  namedInputs: string[];
  feedsTo: string[];
  lambdaPath?: string;
};

const snapshot = raw as PrepWorkTableSnapshot;

const TABLE1_ROW_LABELS: Record<number, string> = {
  3: "1st Inns (average innings runs)",
  4: "Wickets (per innings)",
  5: "Fours (per innings)",
  6: "Sixes (per innings)",
  7: "T5.Avg (top-5 batter average)",
  8: "T5.SR (top-5 strike rate)",
  9: "1st over (runs)",
  10: "1st partnership over (label from B30)",
  11: "1st group overs (6/12/15 depending on format)",
  12: "Fours proportion (boundary share of runs)",
  13: "Sixes proportion",
  14: "Extras (per innings)",
  15: "Wides (per innings)",
  16: "Ducks (per innings)",
  17: "Run outs (per innings)",
  18: "Samples (innings count — denominator)",
};

const TABLE1_COL_LABELS: Record<string, string> = {
  K: "Metric",
  L: "Venue",
  M: "Host",
  N: "Competition",
  O: "All",
  P: "Last 5 years",
};

const TABLE2_ROW_LABELS: Record<number, string> = {
  3: "Match Max Over",
  4: "Team Max Over",
  5: "Fifty in 1st innings",
  6: "Fifty in Match",
  7: "Hundred in 1st innings",
  8: "Hundred in Match",
  9: "Highest individual score",
  10: "Rabbit runs",
};

const TABLE2_COL_LABELS: Record<string, string> = {
  T: "Market",
  U: "Venue",
  V: "Host",
  W: "Competition",
  X: "3-year competition",
  Y: "All",
  Z: "Model",
  AB: "Now (published)",
};

const LAMBDA_FEEDS: Record<string, string> = {
  "Match Max Over": "MatchEvaluation.MatchMaxOver → MatchMaxOver.cs",
  "Fifty in 1st innings": "MatchEvaluation.FiftyInnings → FiftyInnings.cs",
  "Fifty in Match": "PM rows 69–70 (no Lambda in registry)",
  "Hundred in 1st innings": "MatchEvaluation.HundredInnings → HundredInnings.cs",
  "Hundred in Match": "MatchEvaluation.HundredMatch → HundredMatch.cs",
  "Highest individual score": "MatchEvaluation.MatchHighScore → HighestIndividualScore.cs",
  "Rabbit runs": "MatchEvaluation.RabbitRuns → RabbitRuns.cs",
  Wickets: "Par / historical — feeds team wicket expectations",
  Extras: "O14 per-innings blend — par for extras",
  Wides: "O15 — W39/W60 par wides reference",
  Ducks: "O16 per team → InningsDucks; 2×O16 → MatchDucks",
  "Run outs": "O17 per-innings blend → InningsRunOuts par",
};

function isFormula(s: string | null): boolean {
  return !!s && s.startsWith("=");
}

function extractSheets(formula: string): string[] {
  const matches = formula.match(/'([^']+)'!|[A-Za-z][\w ]*!/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace(/!$/, "").replace(/^'|'$/g, ""))));
}

function extractNamedRefs(formula: string): string[] {
  const names = [
    "n_format_a",
    "n_max_original",
    "InfoVenueId",
    "InfoHostId",
    "InfoCompetitionId",
    "n_host",
    "n_tournament",
    "InfoCompetitionId",
  ];
  return names.filter((n) => formula.includes(n));
}

function explainFormula(
  formula: string | null,
  row: number,
  col: string,
  tableId: string
): { calculation: string[]; dataSources: string[]; summary: string } {
  if (!formula) {
    return { calculation: ["Empty cell."], dataSources: [], summary: "No formula." };
  }

  if (!isFormula(formula)) {
    return {
      calculation: [`Static label: "${formula}"`],
      dataSources: [],
      summary: formula,
    };
  }

  const f = formula;
  const sheets = extractSheets(f);
  const calculation: string[] = [];
  const dataSources = [...sheets];

  if (f.includes("AVERAGEIFS") && f.includes("Data!")) {
    const dataCol = f.match(/Data!\$?([A-Z]+)/)?.[1] ?? "?";
    calculation.push(
      `AVERAGEIFS on Data!${dataCol} — filter by format (Data!I), max overs (n_max_original → Data!D), and column weight (${TABLE1_COL_LABELS[col] ?? TABLE2_COL_LABELS[col] ?? col}).`
    );
    if (f.includes("Data!$M:$M,1")) {
      calculation.push("Restricted to first-innings rows (Data!M = 1).");
    }
  }

  if (f.includes("SUMIFS") && f.includes("Data!")) {
    const dataCol = f.match(/Data!\$?([A-Z]+)/)?.[1] ?? "?";
    calculation.push(
      `SUMIFS on Data!${dataCol} with same format/venue/host/competition filters as other rows.`
    );
    if (f.includes("/L$18") || f.includes("/O$18") || f.includes("/P$18")) {
      calculation.push(`Divided by sample count row 18 (${col}18) → per-innings rate.`);
    }
  }

  if (f.includes("COUNTIFS")) {
    calculation.push(
      "COUNTIFS — counts qualifying innings in Data sheet; row 18 is the sample denominator for rates above."
    );
  }

  if (f.includes("Prog Data")) {
    calculation.push(
      "Pulls progressive/average over blocks from Prog Data sheet (1st over, partnership, group overs)."
    );
    dataSources.push("Prog Data");
  }

  if (f.includes("E6") || f.includes("J6")) {
    calculation.push(
      "Uses team expected innings runs Prep Work!E6 (home) and J6 (away) from player adjustment chain."
    );
    dataSources.push("Prep Work!E6", "Prep Work!J6");
  }

  if (f.includes("O3")) {
    calculation.push("Normalises against Table 1 O3 (all-format average 1st-innings runs).");
    dataSources.push("Prep Work!O3");
  }

  if (f.includes("AG66") || f.includes("AG67") || f.includes("AH66") || f.includes("AH67")) {
    calculation.push("Coefficients from Prep Work AG/AH block (format-specific max-over multipliers).");
    dataSources.push("Prep Work!AG66:AH67");
  }

  if (f.includes("Q24:Q34") || f.includes("Q45:Q55")) {
    calculation.push("Top player batting rating bump from squad ratings (max of Q columns).");
    dataSources.push("Prep Work!Q24:Q55");
  }

  if (f.includes("PM Pricing")) {
    calculation.push("References PM Pricing sheet for model calibration.");
    dataSources.push("PM Pricing");
  }

  if (tableId === "table-1" && col === "K") {
    return {
      calculation: [`Row label for ${TABLE1_ROW_LABELS[row] ?? "metric"}.`],
      dataSources: [],
      summary: TABLE1_ROW_LABELS[row] ?? formula.replace(/^=/, ""),
    };
  }

  if (tableId === "table-2" && col === "T") {
    return {
      calculation: [`Market name row for ${TABLE2_ROW_LABELS[row] ?? "market"}.`],
      dataSources: [],
      summary: TABLE2_ROW_LABELS[row] ?? formula.replace(/^=/, ""),
    };
  }

  if (tableId === "table-2" && col === "Z" && row === 5) {
    calculation.push(
      "Model fifty probability: blends historical Y5 and 3-year X5 when X18>100; scales by average team runs (E6+J6)/2 vs O3; adds max player rating bump."
    );
  }

  if (tableId === "table-2" && col === "Z" && row === 8) {
    calculation.push(
      "Model hundred-in-match: Y8 historical rate × ((E6+J6)/2 / O3)^exponent (1.25 ODI, 1.625 T20)."
    );
  }

  if (tableId === "table-2" && col === "AB") {
    calculation.push(
      "Now column — current published line or probability (trader-facing value on PM Publication)."
    );
    dataSources.push("PM Publication (derived)");
  }

  const weight = TABLE1_COL_LABELS[col] ?? TABLE2_COL_LABELS[col];
  const rowLabel =
    tableId === "table-1"
      ? TABLE1_ROW_LABELS[row]
      : TABLE2_ROW_LABELS[row];

  let summary = `${rowLabel ?? `Row ${row}`}`;
  if (weight && col !== "K" && col !== "T") {
    summary += ` — ${weight} weight`;
  }
  if (col === "O" || col === "Y") {
    summary += " (typically used as ‘All’ blend in downstream calcs)";
  }
  if (col === "Z") {
    summary += " → feeds Lambda MatchEvaluation";
  }

  return {
    calculation: calculation.length ? calculation : ["See formula — pattern not yet documented."],
    dataSources: Array.from(new Set(dataSources)),
    summary,
  };
}

export function getPrepWorkTableSnapshot(): PrepWorkTableSnapshot {
  return snapshot;
}

export function getPrepWorkTables(): PrepWorkTable[] {
  return snapshot.tables;
}

export function getPrepWorkTable(id: string): PrepWorkTable | undefined {
  return snapshot.tables.find((t) => t.id === id);
}

export function explainPrepWorkCell(
  tableId: string,
  address: string
): CellExplanation | undefined {
  const table = getPrepWorkTable(tableId);
  const cell = table?.cells.find((c) => c.address === address);
  if (!cell) return undefined;

  const rowLabel =
    tableId === "table-1"
      ? (TABLE1_ROW_LABELS[cell.row] ?? `Row ${cell.row}`)
      : (TABLE2_ROW_LABELS[cell.row] ?? `Row ${cell.row}`);

  const colLabel =
    tableId === "table-1"
      ? (TABLE1_COL_LABELS[cell.col] ?? cell.col)
      : (TABLE2_COL_LABELS[cell.col] ?? cell.col);

  const { calculation, dataSources, summary } = explainFormula(
    cell.formula,
    cell.row,
    cell.col,
    tableId
  );

  const namedInputs = cell.formula && isFormula(cell.formula)
    ? extractNamedRefs(cell.formula)
    : [];

  const feedsTo: string[] = [];
  const lambdaKey =
    tableId === "table-1"
      ? Object.keys(LAMBDA_FEEDS).find((k) => rowLabel.includes(k.split(" ")[0]) && rowLabel.toLowerCase().includes(k.toLowerCase().split(" ")[0]))
      : TABLE2_ROW_LABELS[cell.row];

  if (tableId === "table-1") {
    if (cell.row === 16 && cell.col === "O") {
      feedsTo.push(LAMBDA_FEEDS.Ducks);
    }
    if (cell.row === 15 && cell.col === "O") {
      feedsTo.push(LAMBDA_FEEDS.Wides);
    }
    if (cell.row === 14 && cell.col === "O") {
      feedsTo.push(LAMBDA_FEEDS.Extras);
    }
    if (cell.row === 4 && cell.col === "O") {
      feedsTo.push(LAMBDA_FEEDS.Wickets);
    }
    if (cell.row === 17 && cell.col === "O") {
      feedsTo.push(LAMBDA_FEEDS["Run outs"]);
    }
  }

  if (tableId === "table-2" && cell.col === "Z") {
    const market = TABLE2_ROW_LABELS[cell.row];
    if (market && LAMBDA_FEEDS[market]) {
      feedsTo.push(LAMBDA_FEEDS[market]);
    }
  }

  return {
    address: cell.address,
    rowLabel,
    colLabel,
    summary,
    formula: cell.formula,
    value: cell.value,
    calculation,
    dataSources,
    namedInputs,
    feedsTo,
    lambdaPath:
      tableId === "table-2" && cell.col === "Z"
        ? LAMBDA_FEEDS[TABLE2_ROW_LABELS[cell.row] ?? ""]
        : undefined,
  };
}

/** Build row×col grid for rendering (includes empty cells in range). */
export function buildTableGrid(table: PrepWorkTable): {
  rows: number[];
  cols: string[];
  cellMap: Map<string, PrepWorkTableCell>;
} {
  const [start, end] = table.range.split(":");
  const parse = (ref: string) => {
    const col = ref.match(/[A-Z]+/)![0];
    const row = parseInt(ref.match(/\d+/)![0], 10);
    return { col, row };
  };
  const a = parse(start);
  const b = parse(end);
  const colLetters: string[] = [];
  for (let c = a.col.charCodeAt(0); c <= b.col.charCodeAt(0); c++) {
    colLetters.push(String.fromCharCode(c));
  }
  const rows: number[] = [];
  for (let r = a.row; r <= b.row; r++) rows.push(r);

  const cellMap = new Map(table.cells.map((c) => [c.address, c]));
  return { rows, cols: colLetters, cellMap };
}

export function formatCellValue(value: PrepWorkTableCell["value"]): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (value > 0 && value < 1) return value.toFixed(4);
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2);
  }
  return String(value);
}
