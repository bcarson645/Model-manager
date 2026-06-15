import {
  formatOutputValue,
  isWithinTolerance,
  outputDelta,
} from "@/lib/compare";
import type { ComparisonFixture } from "@/lib/types";
import { PhaseBadge } from "./StatusBadge";

export function OutputComparison({ fixture }: { fixture: ComparisonFixture }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Output comparison</h2>
        <p className="mt-1 text-sm text-slate-400">
          Run the same fixture through Excel and Lambda with identical inputs. Flag
          outputs that diverge beyond tolerance before switching pricing to Lambda.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Fixture</p>
            <p className="mt-1 font-medium text-white">{fixture.match}</p>
            <p className="text-sm text-slate-400">
              {fixture.format} · {fixture.venue}
            </p>
            <div className="mt-2">
              <PhaseBadge phase={fixture.phase} />
            </div>
          </div>
          {fixture.workbook && (
            <div className="rounded-xl border border-surface-border bg-surface p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Workbook</p>
              <p className="mt-1 font-mono text-sm text-slate-300">{fixture.workbook}</p>
            </div>
          )}
          <div className="rounded-xl border border-surface-border bg-surface p-4 md:col-span-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Prep Work inputs (feeding match market)
            </p>
            <dl className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(fixture.inputs).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 text-xs">
                  <dt className="font-mono text-slate-500">{key}</dt>
                  <dd className="text-slate-300">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Output</th>
              <th className="px-4 py-3 font-medium">Excel ref</th>
              <th className="px-4 py-3 font-medium">Excel</th>
              <th className="px-4 py-3 font-medium">Lambda</th>
              <th className="px-4 py-3 font-medium">Delta</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface">
            {fixture.outputs.map((row) => {
              const awaitingLambda = row.lambdaValue === null;
              const ok = !awaitingLambda && isWithinTolerance(row);
              const delta = outputDelta(row);

              return (
                <tr key={row.outputKey}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{row.label}</p>
                    <p className="font-mono text-xs text-slate-500">{row.outputKey}</p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">
                    {row.excelRef
                      ? `${row.excelRef.sheet}!${row.excelRef.cell}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-300">
                    {formatOutputValue(row.excelValue, row.unit)}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-300">
                    {awaitingLambda ? "—" : formatOutputValue(row.lambdaValue, row.unit)}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-400">
                    {delta === null
                      ? "—"
                      : row.unit === "prob"
                        ? `${(delta * 100).toFixed(2)}pp`
                        : delta.toFixed(3)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        awaitingLambda
                          ? "border-slate-500/30 bg-slate-500/15 text-slate-300"
                          : ok
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-red-500/30 bg-red-500/15 text-red-300"
                      }`}
                    >
                      {awaitingLambda
                        ? "Awaiting Lambda"
                        : ok
                          ? "Within tolerance"
                          : "Mismatch"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
