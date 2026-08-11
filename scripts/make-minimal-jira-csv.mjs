import fs from "fs";

const srcPath = "docs/jira-wire-markets-pc-3808-no-epic.csv";
const outPath = "docs/jira-wire-markets-minimal.csv";
const src = fs.readFileSync(srcPath, "utf8");

if (src.includes("111111ddd")) {
  console.error("Source CSV unexpectedly contains 111111ddd");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || (c === "\r" && n === "\n")) {
      if (c === "\r") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function esc(s) {
  const t = String(s ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const rows = parseCsv(src);
console.log("header:", rows[0]);
console.log("sample component:", rows[1]?.[3]);
console.log("sample labels:", rows[1]?.[4]);

const out = [["Summary", "Issue Type", "Description"]];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r?.[0]) continue;
  out.push([r[0], r[1], r[2]]);
}

fs.writeFileSync(
  outPath,
  out.map((r) => r.map(esc).join(",")).join("\n") + "\n"
);
console.log("Wrote", outPath, "rows:", out.length - 1);
