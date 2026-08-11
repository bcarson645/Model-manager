import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = fs.readFileSync(path.join(root, "lib/sample-data.ts"), "utf8");
const excel = fs.readFileSync(
  path.join(root, "lib/workbooks/excel-mappings.ts"),
  "utf8"
);
const registryExt = fs.readFileSync(
  path.join(root, "lib/pricing-models/registry-ext.ts"),
  "utf8"
);
const registryGroups = fs.readFileSync(
  path.join(root, "lib/pricing-models/registry-groups.ts"),
  "utf8"
);

/** Connected / ticked off + already ticketed (exclude from CSV). */
const EXCLUDE = new Set([
  "pm-match-winner",
  "pm-toss-winner",
  "pm-tied-match",
  "pm-toss-win-double",
  "pm-team-of-top-bat",
  "pm-team-of-top-bowl",
  "pm-first-partnership",
  "pm-fifty-first-innings",
  "pm-hundred-first-innings",
  "pm-hundred-match",
  "pm-first-innings-lead",
  "pm-first-dismissal",
  "pm-player-runs",
  "pm-match-top-batter",
]);

/** Aggregate placeholder, not a single wireable market. */
const SKIP_PLACEHOLDERS = new Set(["pm-totals"]);

function parseModels(src) {
  const models = [];
  const re =
    /\{\s*id:\s*"(pm-[^"]+)",\s*name:\s*"([^"]+)",([\s\S]*?)(?=\n  \{\s*id:|\n\];)/g;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1];
    const name = m[2];
    const body = m[3];
    const phase = (body.match(/phase:\s*"([^"]+)"/) || [])[1] || "";
    const marketCode = (body.match(/marketCode:\s*"([^"]+)"/) || [])[1] || "";
    const lambda =
      (body.match(/location:\s*"(PreMatch[^"]+)"/) || [])[1] || "";
    const description =
      (body.match(/description:\s*\n?\s*"([^"]*(?:\\.[^"]*)*)"/) || [])[1] ||
      "";
    models.push({
      id,
      name,
      phase,
      marketCode,
      lambda,
      description: description.replace(/\\n/g, " "),
    });
  }
  return models;
}

function parseExcelMappings(src) {
  const map = new Map();
  const blockRe = /\{\s*modelId:\s*"(pm-[^"]+)",([\s\S]*?)\n\s*\},?/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const id = m[1];
    const body = m[2];
    const market = (body.match(/market:\s*"([^"]+)"/) || [])[1] || "";
    const rows = (body.match(/rows:\s*"([^"]+)"/) || [])[1] || "";
    const adjustCell = (body.match(/adjustCell:\s*"([^"]+)"/) || [])[1] || "";
    const lineCell = (body.match(/lineCell:\s*"([^"]+)"/) || [])[1] || "";
    const lambdaAdjust =
      (body.match(/lambdaAdjust:\s*"([^"]+)"/) || [])[1] || "";
    const notesRaw = body.match(/notes:\s*"([^"]*(?:\\.[^"]*)*)"/);
    const notes = notesRaw
      ? notesRaw[1].replace(/\\n/g, " ")
      : (body.match(/notes:\s*\n\s*"([^"]*(?:\\.[^"]*)*)"/) || [])[1]?.replace(
          /\\n/g,
          " "
        ) || "";
    map.set(id, {
      market,
      rows,
      adjustCell,
      lineCell,
      lambdaAdjust,
      notes,
    });
  }
  return map;
}

function parseRegistryMeta(src) {
  const map = new Map();
  // Split on registry entries loosely
  const chunks = src.split(/registryModelId:\s*/).slice(1);
  for (const chunk of chunks) {
    const id = (chunk.match(/^"(pm-[^"]+)"/) || [])[1];
    if (!id) continue;
    const className = (chunk.match(/className:\s*"([^"]+)"/) || [])[1] || "";
    const marketName =
      (chunk.match(/marketName:\s*"([^"]+)"/) || [])[1] || "";
    const marketCode =
      (chunk.match(/marketCode:\s*"([^"]+)"/) || [])[1] || "";
    const lambdaFolder =
      (chunk.match(/folder:\s*"([^"]+)"/) || [])[1] ||
      (chunk.match(/subfolder:\s*"([^"]+)"/) || [])[1] ||
      "";
    map.set(id, { className, marketName, marketCode, lambdaFolder });
  }
  return map;
}

const models = parseModels(sample).filter((m) => m.phase === "pre_match");
const excelMap = parseExcelMappings(excel);
const regMeta = new Map([
  ...parseRegistryMeta(registryExt),
  ...parseRegistryMeta(registryGroups),
]);

for (const [id, x] of excelMap) {
  if (!models.find((m) => m.id === id)) {
    const meta = regMeta.get(id);
    models.push({
      id,
      name:
        meta?.marketName ||
        x.market
          .replace(/^\{Team\}\s*/, "Team ")
          .replace(/\s*\([^)]*\)\s*$/, ""),
      phase: "pre_match",
      marketCode: meta?.marketCode || "",
      lambda: meta?.className
        ? `PreMatch.Models.${meta.lambdaFolder || "…"}.${meta.className}`
        : "",
      description: x.notes,
    });
  }
}

for (const [id, meta] of regMeta) {
  if (!models.find((m) => m.id === id) && id.startsWith("pm-")) {
    models.push({
      id,
      name: meta.marketName || id,
      phase: "pre_match",
      marketCode: meta.marketCode || "",
      lambda: meta.className
        ? `PreMatch.Models.${meta.lambdaFolder || "…"}.${meta.className}`
        : "",
      description: "",
    });
  }
}

const included = models
  .filter((m) => !EXCLUDE.has(m.id) && !SKIP_PLACEHOLDERS.has(m.id))
  .sort((a, b) => a.name.localeCompare(b.name));

function csvEscape(s) {
  const t = String(s ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function buildDescription(m) {
  const x = excelMap.get(m.id);
  const meta = regMeta.get(m.id);
  const marketName = m.name;
  const lambda =
    m.lambda ||
    (meta?.className
      ? `PreMatch.Models.${meta.lambdaFolder || "…"}.${meta.className}`
      : "TBC");
  const rows = x?.rows || "—";
  const excelMarket = x?.market || marketName;
  const adjust = x?.adjustCell || "";
  const line = x?.lineCell || "";
  const notes = x?.notes || m.description || "";
  const code = m.marketCode || meta?.marketCode || "";

  const dataFlow = [
    "h3. Data flow",
    "",
    "# *Player Adjustment / Prep* — Capture fixture, squad, conditions, and team/player ratings used by this market.",
    `# *Evaluation payload* — Map prep outputs into the pre-match evaluation object required by *${marketName}* (see Excel notes below).`,
    `# *Lambda* — Invoke \`${lambda}\` and capture base line / outcome probabilities.`,
    "# *Trader skew (FE)* — Store purple adjust (PM column I) on the FE; apply after Lambda returns base probs/line (do not send skew as a Lambda input unless the model already expects it).",
    "# *Market Configuration* — Display published line/prob/price; publish selections for trading.",
    "",
    `*Lambda / class:* \`${lambda}\``,
    `*Registry:* \`${m.id}\``,
    code ? `*Market code:* \`${code}\`` : "*Market code:* TBC",
    `*Excel today:* PM Publication rows ${rows} (${excelMarket})`,
    line ? `*Line cell:* ${line}` : null,
    adjust ? `*Adjust cell:* ${adjust}` : "*Trader adjust:* none / TBC",
    x?.lambdaAdjust ? `*Lambda adjust path:* \`${x.lambdaAdjust}\`` : null,
    notes ? `*Notes:* ${notes}` : null,
    "*Default QA fixture:* NZ v SA (Atlas / workbook default) with adjust = 0",
    "*Component:* Development — deliver for all formats where the model applies",
    "*Epic:* PCS Trading UI: Pre Match (PC-3808)",
  ]
    .filter(Boolean)
    .join("\n");

  const processFlow = [
    "h3. Process flow",
    `# *Map evaluation inputs* — Confirm fixture + format and any player/team fields required for ${marketName}.`,
    "# *Wire extra evaluation fields* — Add any missing MatchEvaluation / BatterEvaluation / Innings fields called out in the Excel mapping notes.",
    `# *Call Lambda market* — Invoke ${lambda === "TBC" ? marketName : lambda} and capture base outcomes / line.`,
    `# *Market Configuration UI* — Render ${marketName} in Market Configuration (prob / line / adjust / price) aligned to PM rows ${rows}.`,
    "# *Apply trader adjust post-model* — Store purple skew; apply after Lambda per market skew rules (÷100 / ÷10 / line nudge as documented).",
    "# *QA against default fixture* — Compare published outputs to PM Publication defaults (adjust = 0) before marking Matched.",
  ].join("\n");

  const ac = [
    "h3. Acceptance criteria",
    `* [ ] AC1: ${marketName} appears in Market Configuration${rows !== "—" ? ` (PM rows ${rows})` : ""} with correct market code ${code || "(TBC)"}.`,
    `* [ ] AC2: Pricing call returns Lambda outcomes for ${marketName}; UI displays base probabilities and/or line without requiring a non-zero trader adjust.`,
    "* [ ] AC3: Trader adjust control is available where the sheet has a purple I column; +1 / −1 (or documented unit) updates published values after Lambda.",
    "* [ ] AC4 (expected value): With default fixture inputs and adjust = 0, published probs/lines match captured PM Publication for the default NZ v SA fixture (capture from QA tab if missing).",
    "* [ ] AC5 (wiring): Model Manager Overview can mark this market Matched once QA passes on the default fixture.",
    "* [ ] AC6: Behaviour is validated for applicable formats (T20 / ODI / Test as relevant to the model).",
  ].join("\n");

  return [
    `Wire pre-match market *${marketName}* into Player Adjustment → Lambda → Market Configuration.`,
    "",
    dataFlow,
    "",
    processFlow,
    "",
    ac,
  ].join("\n");
}

const headers = [
  "Summary",
  "Issue Type",
  "Description",
  "Component/s",
  "Labels",
  "Assignee",
];

const rows = included.map((m) => {
  const summary = `Wire (${m.name})`;
  const description = buildDescription(m);
  const labels = ["pre-match", "trading-ui", "development", m.id].join(" ");
  // Epic left blank — link to PC-3808 via bulk edit after import (Epic Link
  // failures cause "Issue does not exist or you do not have permission").
  return [summary, "Story", description, "Development", labels, ""]
    .map(csvEscape)
    .join(",");
});

const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });
const outName =
  process.env.JIRA_CSV_OUT || "jira-wire-markets-pc-3808-no-epic.csv";
const outPath = path.join(outDir, outName);
fs.writeFileSync(outPath, [headers.join(","), ...rows].join("\n") + "\n", "utf8");

console.log("Wrote", outPath);
console.log("Count:", included.length);
console.log("Included:");
for (const m of included) console.log(` - ${m.id} | ${m.name}`);
console.log("\nExcluded:");
for (const id of [...EXCLUDE].sort()) console.log(` - ${id}`);
console.log("\nSkipped placeholders:");
for (const id of SKIP_PLACEHOLDERS) console.log(` - ${id}`);
