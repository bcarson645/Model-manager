import type { TraderSkewGuide } from "@/lib/trading-guide/trader-skew-guides";
import type { AdjustOutcomePreview } from "@/lib/trading-guide/adjust-outcomes";
import { traderAdjustArchitecture } from "@/lib/workbooks/trader-adjust-conventions";
import { excelConventions } from "@/lib/workbooks/excel-mappings";
import { AdjustOutcomeTable } from "@/components/AdjustOutcomeTable";
const kindStyles: Record<TraderSkewGuide["kind"], string> = {
  none: "border-surface-border bg-surface-raised",
  probability_div100: "border-accent/40 bg-accent/5",
  multi_selection_renorm: "border-violet-900/50 bg-violet-950/20",
  line_direct: "border-amber-900/40 bg-amber-950/15",
};

export function TraderAdjustOverview() {
  const arch = traderAdjustArchitecture;
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="text-lg font-semibold text-white">Trader skew (post-model)</h3>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">{arch.summary}</p>
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
        {arch.applyOrder.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {arch.patterns.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-surface-border bg-surface p-3 text-sm"
          >
            <p className="font-medium text-white">{p.label}</p>
            <p className="mt-1 font-mono text-xs text-orange-200">{p.formula}</p>
            <p className="mt-1 text-xs text-slate-500">{p.exampleRows}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Prep Work {arch.prepWork.e10.cell}: {arch.prepWork.e10.formula} — reference for the ÷100
        unit. Purple cells: {excelConventions.preMatchAdjustSheet} column{" "}
        {excelConventions.preMatchAdjustColumn}.
      </p>
    </div>
  );
}

export function TraderSkewGuideSection({
  skew,
  adjustOutcomePreview,
}: {
  skew: TraderSkewGuide;
  adjustOutcomePreview?: AdjustOutcomePreview | null;
}) {  return (
    <section
      className={`rounded-2xl border p-6 ${kindStyles[skew.kind]}`}
    >
      <h3 className="text-lg font-semibold text-white">How skew works on this market</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {skew.title} · post-model on FE
      </p>
      <p className="mt-3 text-sm text-slate-300">{skew.summary}</p>

      {skew.formula && (
        <p className="mt-4 rounded-lg border border-surface-border bg-surface/80 px-3 py-2 font-mono text-sm text-orange-200">
          {skew.formula}
        </p>
      )}

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          New FE implementation
        </h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          {skew.feImplementation.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {skew.pmPricingNotes && skew.pmPricingNotes.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Excel PM Pricing chain
          </h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 font-mono text-xs text-slate-400">
            {skew.pmPricingNotes.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {skew.excelRefs.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          Excel refs:{" "}
          <span className="font-mono text-orange-200">{skew.excelRefs.join(" · ")}</span>
        </p>
      )}

      {skew.examples.length > 0 && (
        <div className="mt-5 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Examples
          </h4>
          {skew.examples.map((ex) => (
            <div
              key={ex.label}
              className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2 text-sm"
            >
              <p className="font-medium text-slate-200">{ex.label}</p>
              <p className="mt-0.5 text-slate-400">{ex.detail}</p>
            </div>
          ))}
        </div>
      )}

      {adjustOutcomePreview && adjustOutcomePreview.rows.length > 0 && (
        <AdjustOutcomeTable preview={adjustOutcomePreview} />
      )}

      {skew.selectionRows && skew.selectionRows.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Per-selection adjust cells
          </h4>
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 pr-3">Selection</th>
                <th className="pb-2 pr-3">Row</th>
                <th className="pb-2 pr-3">Adjust</th>
                <th className="pb-2">Prob</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {skew.selectionRows.map((s) => (
                <tr key={s.row} className="border-t border-surface-border/60">
                  <td className="py-2 pr-3">{s.selection}</td>
                  <td className="py-2 pr-3 font-mono">{s.row}</td>
                  <td className="py-2 pr-3 font-mono text-orange-200">{s.adjustCell}</td>
                  <td className="py-2 font-mono">{s.probCell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
