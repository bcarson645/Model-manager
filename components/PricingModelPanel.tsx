import type { PricingModelDefinition } from "@/lib/pricing-models/types";
import { ScopeBadge } from "@/components/StatusBadge";
import { Highlight, SourceCodeBlock } from "@/components/SourceCodeBlock";
import { getLambdaCategory } from "@/lib/pricing-models/lambda-catalog";

type PricingModelPanelProps = {
  model: PricingModelDefinition;
  searchHighlight?: string;
  defaultShowSource?: boolean;
};

export function PricingModelPanel({
  model,
  searchHighlight,
  defaultShowSource = false,
}: PricingModelPanelProps) {
  const category = getLambdaCategory(model.namespace);

  return (
    <div
      id={model.id}
      className="rounded-2xl border border-surface-border bg-surface-raised p-6 scroll-mt-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs text-orange-300">
              <Highlight text={model.className} query={searchHighlight} />
            </p>
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
              {category}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">
            <Highlight text={model.marketName} query={searchHighlight} />
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            <Highlight text={model.description} query={searchHighlight} />
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            Code:{" "}
            <span className="font-mono text-slate-300">
              <Highlight text={model.marketCode} query={searchHighlight} />
            </span>
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
                  <span className="font-medium text-white">
                    <Highlight text={input.label} query={searchHighlight} />
                  </span>
                  <ScopeBadge scope={input.scope} />
                </div>
                <p className="mt-1 font-mono text-slate-500">
                  <Highlight text={input.csharpPath} query={searchHighlight} />
                </p>
                {input.excelRef && (
                  <p className="mt-1 text-slate-400">
                    Excel: <Highlight text={input.excelRef} query={searchHighlight} />
                  </p>
                )}
                {input.notes && (
                  <p className="mt-1 text-slate-500">
                    <Highlight text={input.notes} query={searchHighlight} />
                  </p>
                )}
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
                  <p className="font-medium text-white">
                    <Highlight text={output.label} query={searchHighlight} />
                  </p>
                  {output.excelRef && (
                    <p className="mt-1 text-slate-400">
                      Excel: <Highlight text={output.excelRef} query={searchHighlight} />
                    </p>
                  )}
                  {output.csharpPath && (
                    <p className="mt-1 font-mono text-slate-500">
                      <Highlight text={output.csharpPath} query={searchHighlight} />
                    </p>
                  )}
                  {output.notes && (
                    <p className="mt-1 text-slate-500">
                      <Highlight text={output.notes} query={searchHighlight} />
                    </p>
                  )}
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
              <li key={item}>
                <Highlight text={item} query={searchHighlight} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <SourceCodeBlock
        filePath={model.filePath}
        searchHighlight={searchHighlight}
        defaultOpen={defaultShowSource}
      />
    </div>
  );
}
