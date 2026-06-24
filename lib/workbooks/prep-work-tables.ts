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
  pmPublication?: string;
};

type CellDoc = Pick<
  CellExplanation,
  "summary" | "calculation" | "dataSources" | "namedInputs" | "feedsTo" | "lambdaPath" | "pmPublication"
>;

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

const TABLE2_PM_PUBLICATION: Record<number, string> = {
  3: "PM Publication row 55 — Max Runs in Over (F55 line, G55/H55 U/O probs, I55 adjust)",
  5: "PM Publication row 67 — Fifty in First Innings (G67 yes prob, I67 adjust)",
  6: "PM Publication rows 69–70 — Fifty in Match (yes/no probs, I69 adjust)",
  7: "PM Publication row 71 — Hundred in First Innings (G71 yes prob, I71 adjust)",
  8: "PM Publication row 73 — Hundred in Match (G73 yes prob, I73 adjust)",
  9: "PM Publication row 75 — Highest Individual Score (F75 line, G75/H75 U/O, I75 adjust)",
  10: "PM Publication row 76 — Rabbit Runs (F76 line; G76 may be unset on some fixtures)",
};

const TABLE2_HISTORICAL_ROWS: Record<
  number,
  {
    event: string;
    dataCol: "AE" | "AF" | "P";
    runsThreshold?: number;
    firstInningsOnly: boolean;
    rabbitInnings?: boolean;
    medianScore?: boolean;
  }
> = {
  5: {
    event: "at least one fifty in the 1st innings",
    dataCol: "AE",
    runsThreshold: 49,
    firstInningsOnly: true,
  },
  6: {
    event: "at least one fifty in the match",
    dataCol: "AF",
    runsThreshold: 49,
    firstInningsOnly: false,
  },
  7: {
    event: "at least one hundred in the 1st innings",
    dataCol: "AE",
    runsThreshold: 99,
    firstInningsOnly: true,
  },
  8: {
    event: "at least one hundred in the match",
    dataCol: "AF",
    runsThreshold: 99,
    firstInningsOnly: false,
  },
  9: {
    event: "highest individual score in the match",
    dataCol: "P",
    firstInningsOnly: false,
    medianScore: true,
  },
  10: {
    event: "rabbit batsman runs (11th batting position)",
    dataCol: "P",
    firstInningsOnly: true,
    rabbitInnings: true,
  },
};

const TABLE2_WEIGHT_FILTERS: Record<string, { filter: string; named: string[] }> = {
  U: {
    filter: "Data!AP = InfoVenueId (this venue only)",
    named: ["InfoVenueId"],
  },
  V: {
    filter: "Data!AQ = InfoHostId (host nation matches)",
    named: ["InfoHostId"],
  },
  W: {
    filter: "Data!AN = InfoCompetitionId (this competition)",
    named: ["InfoCompetitionId"],
  },
  X: {
    filter: "Data!C = n_tournament and Data!B within last ~3 years (TODAY()-1100)",
    named: ["n_tournament"],
  },
  Y: {
    filter: "No venue/host/comp filter — all qualifying innings in Data",
    named: [],
  },
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

function colToNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function numToCol(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const rem = (x - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function columnRange(startCol: string, endCol: string): string[] {
  const cols: string[] = [];
  for (let n = colToNum(startCol); n <= colToNum(endCol); n++) {
    cols.push(numToCol(n));
  }
  return cols;
}

function explainTable2Cell(row: number, col: string): CellDoc | undefined {
  const weight = TABLE2_COL_LABELS[col];
  const market = TABLE2_ROW_LABELS[row];

  if (row === 2 && weight) {
    return {
      summary: `Column header — ${weight}`,
      calculation: [
        `Labels the ${weight} weight column in Table 2.`,
        col === "Z"
          ? "Model column: calibrated value sent to Lambda MatchEvaluation."
          : col === "AB"
            ? "Now column: trader-facing published line or probability (mirrors PM Publication)."
            : "Historical blend from the Data sheet using the filter in row 1 gates (U1/Z1).",
      ],
      dataSources: [],
      namedInputs: [],
      feedsTo: col === "Z" ? ["Lambda MatchEvaluation inputs"] : col === "AB" ? ["PM Publication"] : [],
    };
  }

  if (col === "T" && market) {
    return {
      summary: market,
      calculation: [
        `Row label for the ${market} market block.`,
        LAMBDA_FEEDS[market]
          ? `Lambda: ${LAMBDA_FEEDS[market]}`
          : "Reference / par row — may not have a dedicated Lambda class.",
      ],
      dataSources: [],
      namedInputs: [],
      feedsTo: [],
    };
  }

  if (row === 3 && col === "Y") {
    return {
      summary: "Match Max Over — All-format par (format constant)",
      calculation: [
        "Static par by format: T20 → 18.9, Test → 15.9, ODI → 16.7.",
        "Used as historical reference; the model column Z3 is what Lambda consumes.",
      ],
      dataSources: [],
      namedInputs: ["n_format_a"],
      feedsTo: [],
    };
  }

  if (row === 3 && col === "Z") {
    return {
      summary: "Match Max Over — Model line → Lambda",
      calculation: [
        "Blank for T10/S6 and Test formats.",
        "T20/ODI: (AG66 or AG67) × AVERAGE(home runs E6, away runs J6) + (AH66 or AH67).",
        "Coefficients AG66:AH67 are format-specific multipliers on Prep Work.",
        "E6/J6 are team expected innings runs from the player-adjustment chain.",
      ],
      dataSources: ["Prep Work!AG66:AH67", "Prep Work!E6", "Prep Work!J6"],
      namedInputs: ["n_format_a"],
      feedsTo: [LAMBDA_FEEDS["Match Max Over"]],
      lambdaPath: LAMBDA_FEEDS["Match Max Over"],
    };
  }

  if (row === 3 && col === "AB") {
    return {
      summary: "Match Max Over — published line (Now)",
      calculation: [
        "Trader-published over/under line on PM Publication (typically rounded from Z3).",
        "On NZ v SA: 20.5 vs model 20.28.",
      ],
      dataSources: ["PM Publication"],
      namedInputs: [],
      feedsTo: ["PM Publication F55"],
      pmPublication: TABLE2_PM_PUBLICATION[3],
    };
  }

  if (row === 4 && col === "Y") {
    return {
      summary: "Team Max Over — All-format par",
      calculation: [
        "Format constant par for highest team over: T20 → 17, Test → 13.3, ODI → 15.",
        "Reference only — no Model column on this row in T2:AB10.",
      ],
      dataSources: [],
      namedInputs: ["n_format_a"],
      feedsTo: [],
    };
  }

  const hist = TABLE2_HISTORICAL_ROWS[row];
  const weightMeta = TABLE2_WEIGHT_FILTERS[col];
  if (hist && weightMeta && ["U", "V", "W", "X", "Y"].includes(col)) {
    const steps: string[] = [
      `Historical rate: ${hist.event}.`,
      `Weight: ${TABLE2_COL_LABELS[col]} — ${weightMeta.filter}.`,
      "Common filters: Data!D = n_max_original (match overs), Data!I = 1 (format flag), COUNTIFS denominator uses Data!M = 1 (first-innings rows where applicable).",
    ];
    const sources = ["Data", "Data!D", "Data!I", "Data!M", "Data!P"];

    if (hist.medianScore) {
      steps.push(
        "Array formula: MEDIAN of Data!P (individual innings runs) where Data!AF = 1 (match played), overs match, and weight filter applies.",
        "U9 is gated on U1 (venue column active); V/W/Y are always calculated."
      );
      sources.push("Data!AF");
    } else if (hist.rabbitInnings) {
      steps.push(
        "SUMIFS on Data!P where Data!M = 11 (rabbit / No.11 batsman innings) ÷ count of qualifying first-innings samples.",
        "Feeds RabbitRuns Lambda via Y10 / model column when present."
      );
      sources.push("Data!M");
    } else if (hist.runsThreshold !== undefined) {
      steps.push(
        `SUMIFS on Data!${hist.dataCol} with Data!P > ${hist.runsThreshold} (event occurred) ÷ COUNTIFS sample size.`,
        hist.firstInningsOnly
          ? "Restricted to 1st-innings rows (Data!I = 1 in SUMIFS)."
          : "Match-level flag column AF — any innings in the match."
      );
      sources.push(`Data!${hist.dataCol}`);
    }

    if (col === "U") {
      steps.unshift('Gated: returns blank when U1 = "" (venue weighting disabled for this fixture).');
    }

    return {
      summary: `${market ?? `Row ${row}`} — ${TABLE2_COL_LABELS[col]} historical`,
      calculation: steps,
      dataSources: Array.from(new Set(sources)),
      namedInputs: ["n_max_original", ...weightMeta.named],
      feedsTo:
        col === "Y"
          ? [`Model column Z${row}`, "PM Publication calibration"]
          : [`Blends into Z${row} when sample gates pass`],
    };
  }

  if (row === 5 && col === "Z") {
    return {
      summary: "Fifty in 1st innings — Model probability → Lambda",
      calculation: [
        "T20 only (other formats return blank).",
        "When X18 > 100 samples: 30% × scaled Y5 + 70% × X5, where scale = ((E6+J6)/2) / O3.",
        "Otherwise: Y5 × ((E6+J6)/2) / O3.",
        "Player rating bump: × (1 + MAX(Q24:Q34,Q45:Q55) / 100), floor 10% if no positive rating.",
        "O3 is Table 1 average 1st-innings runs (All weight).",
      ],
      dataSources: ["Prep Work!Y5", "Prep Work!X5", "Prep Work!E6", "Prep Work!J6", "Prep Work!O3", "Prep Work!Q24:Q55", "Prep Work!X18"],
      namedInputs: ["n_format_a"],
      feedsTo: [LAMBDA_FEEDS["Fifty in 1st innings"]],
      lambdaPath: LAMBDA_FEEDS["Fifty in 1st innings"],
    };
  }

  if (row === 6 && col === "Z") {
    return {
      summary: "Fifty in Match — Model probability (logistic)",
      calculation: [
        "Gated on Z1 (model column active for this fixture).",
        "T20: logistic regression EXP(CI9 + CI10 × (E6+J6)/2) / (1 + …) using coefficients CI9:CI10.",
        "No Lambda class in registry — PM rows 69–70 published directly from workbook.",
      ],
      dataSources: ["Prep Work!CI9", "Prep Work!CI10", "Prep Work!E6", "Prep Work!J6"],
      namedInputs: ["n_format_a"],
      feedsTo: ["PM Publication rows 69–70"],
      pmPublication: TABLE2_PM_PUBLICATION[6],
    };
  }

  if (row === 7 && col === "Z") {
    return {
      summary: "Hundred in 1st innings — Model (ratio from match hundred)",
      calculation: [
        "Blank in Test.",
        "(Y7 / Y8) × Z8 — scales 1st-innings historical rate by the modelled match-hundred probability.",
        "Derives first-innings hundred from match hundred model rather than direct calibration.",
      ],
      dataSources: ["Prep Work!Y7", "Prep Work!Y8", "Prep Work!Z8"],
      namedInputs: ["n_format_a"],
      feedsTo: [LAMBDA_FEEDS["Hundred in 1st innings"]],
      lambdaPath: LAMBDA_FEEDS["Hundred in 1st innings"],
    };
  }

  if (row === 8 && col === "Z") {
    return {
      summary: "Hundred in Match — Model probability → Lambda",
      calculation: [
        "Blank in Test.",
        "Y8 × (((E6+J6)/2) / O3) ^ exponent — exponent 1.25 (ODI) or 1.625 (T20).",
        "Scales all-format historical hundred rate by expected scoring vs par (O3).",
      ],
      dataSources: ["Prep Work!Y8", "Prep Work!E6", "Prep Work!J6", "Prep Work!O3"],
      namedInputs: ["n_format_a"],
      feedsTo: [LAMBDA_FEEDS["Hundred in Match"]],
      lambdaPath: LAMBDA_FEEDS["Hundred in Match"],
    };
  }

  if (row === 9 && col === "Z") {
    return {
      summary: "Highest individual score — Model line → Lambda",
      calculation: [
        "Test: MATCH lookup on PM Pricing calibration grid (XF145:ACZ145).",
        "Limited overs: AVERAGE(Y9, Y9 × ((E6+J6)/2) / O3) — historical median scaled by run expectation.",
        "Lambda rounds to line + 0.5 with trader adjust on I75.",
      ],
      dataSources: ["Prep Work!Y9", "Prep Work!E6", "Prep Work!J6", "Prep Work!O3", "PM Pricing"],
      namedInputs: ["n_format_a"],
      feedsTo: [LAMBDA_FEEDS["Highest individual score"]],
      lambdaPath: LAMBDA_FEEDS["Highest individual score"],
    };
  }

  if (row === 10 && col === "Z") {
    return {
      summary: "Rabbit runs — Model (when populated)",
      calculation: [
        "Often blank on T20 fixtures — model column may be unused when Z1 gate is off.",
        "When present: scales Y10 historical rabbit average for Lambda RabbitRuns.",
        "Lambda: Poisson-gamma median on team rabbit expectation, line = Round(total−0.8)+0.5.",
      ],
      dataSources: ["Prep Work!Y10"],
      namedInputs: [],
      feedsTo: [LAMBDA_FEEDS["Rabbit runs"]],
      lambdaPath: LAMBDA_FEEDS["Rabbit runs"],
    };
  }

  if (col === "AB" && row >= 3 && row <= 10 && TABLE2_PM_PUBLICATION[row]) {
    const kind = row === 3 || row === 9 || row === 10 ? "published line" : "published yes probability";
    return {
      summary: `${market ?? `Row ${row}`} — Now (${kind})`,
      calculation: [
        `Trader-facing ${kind} copied to PM Publication.`,
        "May be rounded from the Model (Z) column or manually set.",
        "Purple adjust cells on PM Publication column I apply on top of Lambda output.",
      ],
      dataSources: ["PM Publication"],
      namedInputs: [],
      feedsTo: [`PM Publication row ${TABLE2_PM_PUBLICATION[row].match(/\d+/)?.[0] ?? "?"}`],
      pmPublication: TABLE2_PM_PUBLICATION[row],
    };
  }

  return undefined;
}

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

  const table2Doc =
    tableId === "table-2" ? explainTable2Cell(cell.row, cell.col) : undefined;

  const generic = explainFormula(cell.formula, cell.row, cell.col, tableId);

  const calculation = table2Doc?.calculation ?? generic.calculation;
  const dataSources = table2Doc?.dataSources ?? generic.dataSources;
  const summary = table2Doc?.summary ?? generic.summary;

  const namedInputs =
    table2Doc?.namedInputs ??
    (cell.formula && isFormula(cell.formula) ? extractNamedRefs(cell.formula) : []);

  const feedsTo: string[] = [...(table2Doc?.feedsTo ?? [])];
  const lambdaPath = table2Doc?.lambdaPath;
  const pmPublication = table2Doc?.pmPublication;

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

  if (tableId === "table-2" && cell.col === "Z" && !lambdaPath) {
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
    feedsTo: Array.from(new Set(feedsTo)),
    lambdaPath:
      lambdaPath ??
      (tableId === "table-2" && cell.col === "Z"
        ? LAMBDA_FEEDS[TABLE2_ROW_LABELS[cell.row] ?? ""]
        : undefined),
    pmPublication,
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
  const colLetters = columnRange(a.col, b.col);
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
