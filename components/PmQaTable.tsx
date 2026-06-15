import {
  assessPmQaRow,
  formatPmValue,
  isLineMarket,
  pmPublicationColumns,
  type PmPublicationSelection,
} from "@/lib/workbooks/pm-publication-qa";
import {
  formatTraderAdjustDelta,
  traderAdjustArchitecture,
} from "@/lib/workbooks/trader-adjust-conventions";

const statusStyles: Record<string, string> = {
  captured: "text-slate-400",
  pending_lambda: "text-sky-300",
  hint_match: "text-emerald-300",
  hint_mismatch: "text-amber-300",
  excel_error: "text-red-300",
};

const statusLabels: Record<string, string> = {
  captured: "Captured",
  pending_lambda: "Awaiting Lambda",
  hint_match: "Prep hint OK",
  hint_mismatch: "Check prep hint",
  excel_error: "Excel error",
};

export function PmQaTable({
  registryModelId,
  selections,
  fixtureId,
  showStatus = true,
}: {
  registryModelId: string;
  selections: PmPublicationSelection[];
  fixtureId?: string;
  showStatus?: boolean;
}) {
  if (selections.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No PM Publication rows extracted for this model on the NZ v SA fixture yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-3">Row</th>
            <th className="pb-2 pr-3">Selection</th>
            <th className="pb-2 pr-3">
              F <span className="normal-case text-slate-600">line</span>
            </th>
            <th className="pb-2 pr-3">
              G <span className="normal-case text-slate-600">prob</span>
            </th>
            <th className="pb-2 pr-3">
              H <span className="normal-case text-slate-600">other</span>
            </th>
            <th className="pb-2 pr-3">
              I <span className="normal-case text-slate-600">adjust</span>
            </th>
            {showStatus && <th className="pb-2">QA</th>}
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {selections.map((sel) => {
            const qa = assessPmQaRow(registryModelId, sel, fixtureId);
            const hasLine = isLineMarket(sel);
            return (
              <tr key={sel.row} className="border-b border-surface-border/60">
                <td className="py-2.5 pr-3 font-mono text-xs text-orange-200">{sel.row}</td>
                <td className="py-2.5 pr-3">
                  <span className="text-white">{sel.selection ?? sel.market ?? "—"}</span>
                  {sel.selection && sel.market && (
                    <p className="text-xs text-slate-500">{sel.market}</p>
                  )}
                </td>
                <td className="py-2.5 pr-3 font-mono">
                  {hasLine ? (
                    <>
                      <span>{formatPmValue(sel.line)}</span>
                      <p className="text-xs text-slate-500">{sel.cells.line}</p>
                    </>
                  ) : (
                    <span className="text-slate-600">n/a</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 font-mono">
                  {formatPmValue(sel.probability)}
                  <p className="text-xs text-slate-500">{sel.cells.probability}</p>
                </td>
                <td className="py-2.5 pr-3 font-mono text-slate-400">
                  {formatPmValue(sel.complementProbability)}
                </td>
                <td className="py-2.5 pr-3 font-mono text-orange-200">
                  {formatPmValue(sel.adjust)}
                  {typeof sel.adjust === "number" && sel.adjust !== 0 && (
                    <p className="text-xs text-amber-200/80">
                      {formatTraderAdjustDelta(sel.adjust)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{sel.cells.adjust}</p>
                </td>
                {showStatus && (
                  <td className={`py-2.5 text-xs ${statusStyles[qa.status]}`}>
                    {statusLabels[qa.status]}
                    {qa.message && (
                      <p className="mt-0.5 max-w-[12rem] text-slate-500">{qa.message}</p>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PmColumnLegend() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{traderAdjustArchitecture.summary}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {(
        [
          ["line", pmPublicationColumns.line],
          ["probability", pmPublicationColumns.probability],
          ["adjust", pmPublicationColumns.adjust],
          ["complement", pmPublicationColumns.complement],
        ] as const
      ).map(([key, col]) => (
        <div key={key} className="rounded-lg border border-surface-border bg-surface p-3">
          <dt className="font-mono text-orange-200">
            {col.col} — {col.label}
          </dt>
          <dd className="mt-1 text-xs text-slate-400">{col.description}</dd>
        </div>
      ))}
      </dl>
    </div>
  );
}
