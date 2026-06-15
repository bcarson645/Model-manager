import { Dashboard } from "@/components/Dashboard";
import {
  comparisonFixtures,
  getRegistrySummary,
  models,
  nzSaWorkbook,
  variables,
} from "@/lib/sample-data";

export default function HomePage() {
  const summary = getRegistrySummary();
  const comparison = comparisonFixtures[0];

  return (
    <main className="min-h-screen">
      <header className="border-b border-surface-border bg-surface-raised/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Model Manager
            </p>
            <h1 className="text-xl font-semibold text-white">
              Cricket betting model registry
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Pre-match &amp; live · Excel → Lambda migration · variable parity
            </p>
          </div>
          <span className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-slate-400">
            Match {nzSaWorkbook.matchId}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Dashboard
          summary={summary}
          models={models}
          variables={variables}
          comparison={comparison}
          workbook={nzSaWorkbook}
        />
      </div>
    </main>
  );
}
