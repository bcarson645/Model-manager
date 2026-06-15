"use client";

import { useMemo, useState } from "react";
import {
  getLambdaForTemplate,
  getPmMarketStats,
  pmMarketCategories,
  pmMarketTemplates,
} from "@/lib/workbooks/pm-markets";

export function PmMarketCatalog() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lambdaOnly, setLambdaOnly] = useState(false);
  const stats = getPmMarketStats();

  const filtered = useMemo(() => {
    return pmMarketTemplates.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (lambdaOnly && !getLambdaForTemplate(m.marketTemplate)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${m.category} ${m.marketTemplate} ${m.exampleNames.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [category, search, lambdaOnly]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">PM Publication markets</h2>
        <p className="mt-1 text-sm text-slate-400">
          {stats.totalTemplates} unique market templates · {stats.totalSelections} selection
          rows in NZ v SA fixture. Probabilities in column G, adjusts in column I (purple).
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <span key={cat} className="rounded-lg border border-surface-border bg-surface px-2 py-1">
              {cat}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets…"
          className="min-w-[200px] flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-300"
        >
          <option value="all">All categories</option>
          {pmMarketCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={lambdaOnly}
            onChange={(e) => setLambdaOnly(e.target.checked)}
          />
          Lambda mapped only
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Market template</th>
              <th className="px-4 py-3 font-medium">Rows</th>
              <th className="px-4 py-3 font-medium">Selections</th>
              <th className="px-4 py-3 font-medium">Lambda</th>
              <th className="px-4 py-3 font-medium">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface">
            {filtered.map((m) => {
              const lambda = getLambdaForTemplate(m.marketTemplate);
              return (
                <tr key={`${m.category}-${m.marketTemplate}`} className="align-top">
                  <td className="px-4 py-3 text-xs text-slate-400">{m.category}</td>
                  <td className="px-4 py-3 font-medium text-white">{m.marketTemplate}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {m.firstRow === m.lastRow ? m.firstRow : `${m.firstRow}–${m.lastRow}`}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{m.selectionCount}</td>
                  <td className="px-4 py-3">
                    {lambda ? (
                      <span className="font-mono text-xs text-orange-300">{lambda}</span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {m.exampleNames[0] ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {stats.totalTemplates} templates ·{" "}
        {stats.withLambda} linked to pasted Lambda models
      </p>
    </div>
  );
}
