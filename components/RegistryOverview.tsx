import type { RegistrySummary, WorkbookSnapshot } from "@/lib/types";
import { excelConventions, pmPublicationMappings } from "@/lib/workbooks/excel-mappings";
import { nzSaMatchMarket } from "@/lib/workbooks/nz-sa-63406779";
import { PhaseBadge } from "./StatusBadge";

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  accent?: "default" | "warn" | "ok";
};

function StatCard({ label, value, hint, accent = "default" }: StatCardProps) {
  const valueStyles = {
    default: "text-white",
    warn: "text-amber-300",
    ok: "text-emerald-300",
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueStyles[accent]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export function RegistryOverview({
  summary,
  workbook,
}: {
  summary: RegistrySummary;
  workbook: WorkbookSnapshot;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Linked workbook</h2>
            <p className="mt-1 text-sm text-slate-400">
              {workbook.homeTeam} vs {workbook.awayTeam} · {workbook.format} · {workbook.venue}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">{workbook.filename}</p>
          </div>
          <PhaseBadge phase={workbook.phase} />
        </div>

        <div className="mt-6 rounded-xl border border-surface-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Match market — Prep Work
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Probabilities in <span className="font-mono text-slate-300">C10:C11</span>,
            decimal prices in <span className="font-mono text-slate-300">D10:D11</span>{" "}
            ({nzSaMatchMarket.marketType} market)
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {nzSaMatchMarket.selections.map((sel) => (
              <div
                key={sel.team}
                className="rounded-lg border border-surface-border bg-surface-raised p-3"
              >
                <p className="font-medium text-white">{sel.team}</p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">C — probability</dt>
                    <dd className="font-mono text-slate-200">
                      {(sel.probability * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">D — price</dt>
                    <dd className="font-mono text-slate-200">{sel.price.toFixed(3)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Excel conventions</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pre-match trader adjusts:{" "}
          <span className="font-mono text-slate-300">
            {excelConventions.preMatchAdjustSheet}!{excelConventions.preMatchAdjustColumn}
          </span>{" "}
          (purple cells, one per selection row). Live adjusts:{" "}
          <span className="font-mono text-slate-300">
            {excelConventions.liveAdjustSheets.join(", ")}
          </span>
          .
        </p>
        <ul className="mt-4 space-y-2 text-xs text-slate-400">
          {pmPublicationMappings.markets.map((m) => (
            <li key={m.modelId}>
              <span className="font-medium text-slate-300">{m.market}</span>
              {m.rows && ` — rows ${m.rows}`}
              {"adjustCell" in m && m.adjustCell && ` · adjust ${m.adjustCell}`}
              {"adjustCells" in m && m.adjustCells && ` · adjusts ${m.adjustCells.join(", ")}`}
            </li>
          ))}
          <li>
            <span className="font-medium text-slate-300">Dismissal probabilities</span> — Prep
            Work AO4:AQ9 · published PM Publication G45:G51
          </li>
          <li>
            <span className="font-medium text-slate-300">Dismissal method rates</span> — Prep
            Work AD3:AM18
          </li>
          <li>
            <span className="font-medium text-slate-300">Player ratings</span> — formulas e.g.
            Prep Work Q24 (bat), Z24 (bowl) → team D4/I4/D5/I5
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pre-match models"
          value={summary.preMatchModels}
          hint="PM sheets, Prep Work outputs"
        />
        <StatCard
          label="Live models"
          value={summary.inPlayModels}
          hint="UI, Scoring, Pricing"
        />
        <StatCard
          label="Trading inputs"
          value={summary.tradingInputsRequired}
          hint="Must exist in the trading interface"
          accent="ok"
        />
        <StatCard
          label="Parity issues"
          value={summary.parityIssues}
          hint="Variables not yet matched to Lambda"
          accent="warn"
        />
      </div>
    </div>
  );
}
