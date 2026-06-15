import type { PricingModelDefinition } from "@/lib/pricing-models/types";
import { ScopeBadge } from "@/components/StatusBadge";

export function PricingModelPanel({ model }: { model: PricingModelDefinition }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-orange-300">{model.className}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{model.marketName}</h3>
          <p className="mt-1 text-sm text-slate-400">{model.description}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            Code: <span className="font-mono text-slate-300">{model.marketCode}</span>
          </p>
          <p>
            ID: {model.marketId} · Legacy: {model.legacyMarketId}
          </p>
        </div>
      </div>

      {model.childModels && (
        <p className="mt-3 text-xs text-slate-500">
          Child markets:{" "}
          <span className="text-slate-300">{model.childModels.join(", ")}</span>
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-medium text-slate-300">Inputs</h4>
          <ul className="mt-2 space-y-2">
            {model.inputs.map((input) => (
              <li
                key={input.name}
                className="rounded-lg border border-surface-border bg-surface p-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-white">{input.label}</span>
                  <ScopeBadge scope={input.scope} />
                </div>
                <p className="mt-1 font-mono text-slate-500">{input.csharpPath}</p>
                {input.excelRef && (
                  <p className="mt-1 text-slate-400">Excel: {input.excelRef}</p>
                )}
                {input.notes && <p className="mt-1 text-slate-500">{input.notes}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-slate-300">Outputs</h4>
            <ul className="mt-2 space-y-2">
              {model.outputs.map((output) => (
                <li
                  key={output.name}
                  className="rounded-lg border border-surface-border bg-surface p-3 text-xs"
                >
                  <p className="font-medium text-white">{output.label}</p>
                  {output.excelRef && (
                    <p className="mt-1 text-slate-400">Excel: {output.excelRef}</p>
                  )}
                  {output.csharpPath && (
                    <p className="mt-1 font-mono text-slate-500">{output.csharpPath}</p>
                  )}
                  {output.notes && <p className="mt-1 text-slate-500">{output.notes}</p>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300">Embedded constants</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {model.embeddedConstants.map((c) => (
                <li key={c.name}>
                  <span className="font-mono text-slate-300">{c.name}</span> = {c.value}
                  {c.notes && <span className="text-slate-500"> — {c.notes}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {model.missingForParity.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h4 className="text-sm font-medium text-amber-300">Still needed for Excel parity</h4>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-200/80">
            {model.missingForParity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
