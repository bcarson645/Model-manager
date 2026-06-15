import type { SharedPricingArtifact } from "@/lib/pricing-models/types-shared";
import { ScopeBadge } from "@/components/StatusBadge";

export function SharedArtifactPanel({ artifact }: { artifact: SharedPricingArtifact }) {
  const kindLabel =
    artifact.kind === "static_helper"
      ? "Static helper"
      : artifact.kind === "interface"
        ? "Interface"
        : "Base class";

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs text-orange-300">{artifact.name}</p>
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {kindLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{artifact.description}</p>
        </div>
        <p className="font-mono text-xs text-slate-500">{artifact.filePath}</p>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Used by:{" "}
        <span className="text-slate-300">{artifact.usedBy.join(", ")}</span>
      </p>

      {artifact.methods && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-300">Methods</h4>
          <ul className="mt-2 space-y-2">
            {artifact.methods.map((method) => (
              <li
                key={method.name}
                className="rounded-lg border border-surface-border bg-surface p-3 text-xs"
              >
                <p className="font-mono font-medium text-white">{method.name}</p>
                <p className="mt-1 font-mono text-slate-500">{method.signature}</p>
                {method.notes && <p className="mt-1 text-slate-400">{method.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {artifact.inputs && artifact.inputs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300">Inputs</h4>
            <ul className="mt-2 space-y-2">
              {artifact.inputs.map((input) => (
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
        )}

        <div className="space-y-6">
          {artifact.embeddedConstants && artifact.embeddedConstants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300">Embedded constants</h4>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {artifact.embeddedConstants.map((c) => (
                  <li key={c.name}>
                    <span className="font-mono text-slate-300">{c.name}</span> = {c.value}
                    {c.notes && <span className="text-slate-500"> — {c.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {artifact.missingForParity && artifact.missingForParity.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-400/90">Parity gaps</h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-500">
                {artifact.missingForParity.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
