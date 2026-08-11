import fs from "fs";

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

const rows = parseCsv(fs.readFileSync("docs/jira-wire-markets-minimal.csv", "utf8"));
const out = [["Summary", "Issue Type", "Description", "Component/s"]];
for (let i = 1; i < rows.length; i++) {
  if (!rows[i]?.[0]) continue;
  out.push([rows[i][0], rows[i][1], rows[i][2], "Development"]);
}

const outPath = "docs/jira-wire-markets-with-component.csv";
fs.writeFileSync(outPath, out.map((r) => r.map(esc).join(",")).join("\n") + "\n");
console.log("Wrote", outPath, "rows:", out.length - 1);
console.log("header:", out[0].join(" | "));
console.log("component sample:", out[1][3]);
