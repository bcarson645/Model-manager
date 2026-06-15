import type { AdjustOutcomePreview } from "@/lib/trading-guide/adjust-outcomes";
import {
  formatAdjustOutcome,
  formatAdjustPrice,
  STANDARD_ADJUST_STEPS,
} from "@/lib/trading-guide/adjust-outcomes";

export function AdjustOutcomeTable({ preview }: { preview: AdjustOutcomePreview }) {
  const showPrice = preview.rows.some((r) => r.priceByAdjust !== undefined);

  return (
    <div className="mt-5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {preview.title}
      </h4>
      <p className="mt-1 text-xs text-slate-400">{preview.note}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 pr-3">Selection</th>
              <th className="pb-2 pr-3">I cell</th>
              <th className="pb-2 pr-3">Base</th>
              {STANDARD_ADJUST_STEPS.map((step) => (
                <th key={step} className="pb-2 pr-3 text-center font-mono">
                  I={step > 0 ? `+${step}` : step}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {preview.rows.map((row) => (
              <tr key={row.row} className="border-t border-surface-border/60">
                <td className="py-2.5 pr-3">
                  <span className="text-white">{row.selection}</span>
                  <p className="font-mono text-slate-600">r{row.row}</p>
                </td>
                <td className="py-2.5 pr-3 font-mono text-orange-200">{row.adjustCell}</td>
                <td className="py-2.5 pr-3 font-mono text-slate-400">
                  {row.baseProbability !== undefined
                    ? formatAdjustOutcome(row.baseProbability, preview.kind)
                    : row.baseLine !== undefined
                      ? formatAdjustOutcome(row.baseLine, preview.kind)
                      : "—"}
                </td>
                {STANDARD_ADJUST_STEPS.map((step) => (
                  <td key={step} className="py-2.5 pr-3 text-center">
                    <span
                      className={`font-mono ${
                        step === 0 ? "text-slate-400" : step > 0 ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {formatAdjustOutcome(row.byAdjust[step], preview.kind)}
                    </span>
                    {showPrice && row.priceByAdjust?.[step] !== undefined && (
                      <p className="mt-0.5 font-mono text-slate-600">
                        J≈{formatAdjustPrice(row.priceByAdjust[step])}
                      </p>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview.pairedExample && (
        <div className="mt-4 rounded-lg border border-violet-900/40 bg-violet-950/20 px-3 py-2 text-xs">
          <p className="font-medium text-violet-200">{preview.pairedExample.label}</p>
          <ul className="mt-1 space-y-0.5 text-slate-400">
            {preview.pairedExample.rows.map((r) => (
              <li key={r.selection}>
                {r.selection}:{" "}
                <span className="font-mono text-slate-300">
                  {(r.probability * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
