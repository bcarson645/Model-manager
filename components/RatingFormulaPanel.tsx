import { ratingFormulas } from "@/lib/workbooks/rating-formulas";

export function RatingFormulaPanel() {
  const entries = Object.entries(ratingFormulas);

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-white">Prep Work rating chain</h2>
      <p className="mt-1 text-sm text-slate-400">
        Player formulas (Q24, Z24) roll up to team ratings (D4/I4, D5/I5), then with
        conditions (D3) feed match price (C10/C11).
      </p>
      <div className="mt-6 space-y-4">
        {entries.map(([key, item]) => (
          <div
            key={key}
            className="rounded-xl border border-surface-border bg-surface p-4"
          >
            <p className="font-medium text-white">
              <span className="font-mono text-xs text-slate-400">{key}</span>
              {"cell" in item && "cell" in item && item.cell && ` · ${item.cell}`}
              {"exampleCell" in item && item.exampleCell && ` · ${item.exampleCell}`}
              {"cells" in item && item.cells && ` · ${item.cells.join(" / ")}`}
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-slate-400">
              {item.formula}
            </pre>
            {"inputs" in item && item.inputs && (
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {item.inputs.map((inp) => (
                  <li key={inp.name}>
                    <span className="font-mono text-slate-400">{inp.cell ?? inp.range}</span>{" "}
                    — {inp.description}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-orange-300/80">→ {item.lambdaTarget}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
