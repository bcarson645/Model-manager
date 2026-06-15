"use client";

import { useMemo, useState } from "react";
import { buildMarketGuides, type MarketTradingGuide } from "@/lib/trading-guide";
import { excelConventions } from "@/lib/workbooks/excel-mappings";
import { traderAdjustArchitecture } from "@/lib/workbooks/trader-adjust-conventions";
import { PM_QA_DEFAULT_FIXTURE_ID, pmQaFixtureList } from "@/lib/workbooks/pm-publication-qa";
import { PhaseBadge } from "@/components/StatusBadge";
import { PmQaTable } from "@/components/PmQaTable";
import {
  TraderAdjustOverview,
  TraderSkewGuideSection,
} from "@/components/TraderSkewGuideSection";

function groupLabel(guide: MarketTradingGuide): string {
  if (guide.lambdaClass.includes(".Teams.")) return "Team markets";
  if (guide.lambdaClass.includes(".Players.")) return "Player markets";
  if (guide.lambdaClass.includes(".HeadToHeads.")) return "Head-to-head";
  return "Match markets";
}

function FieldList({
  items,
  empty,
}: {
  items: MarketTradingGuide["traderAdjusts"];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((field) => (
        <li
          key={field.id}
          className="rounded-lg border border-surface-border bg-surface p-4 text-sm"
        >
          <p className="font-medium text-white">{field.label}</p>
          {field.description && (
            <p className="mt-1 text-slate-400">{field.description}</p>
          )}
          {field.excelRef && (
            <p className="mt-2 text-xs text-slate-400">
              Excel today: <span className="font-mono text-orange-200">{field.excelRef}</span>
            </p>
          )}
          {field.csharpPath && (
            <p className="mt-1 font-mono text-xs text-slate-500">{field.csharpPath}</p>
          )}
          {field.lambdaNotes && (
            <p className="mt-1 text-xs text-slate-500">Lambda: {field.lambdaNotes}</p>
          )}
          {field.defaultValue !== undefined && (
            <p className="mt-1 text-xs text-slate-500">
              Fixture example: <span className="text-slate-300">{String(field.defaultValue)}</span>
            </p>
          )}
          {field.feControl && (
            <p className="mt-2 rounded border border-accent/30 bg-accent/10 px-2 py-1 text-xs text-accent-100">
              New FE: {field.feControl}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ExcelTradingCard({ guide }: { guide: MarketTradingGuide }) {
  const ex = guide.excelTrading;
  if (!ex) {
    return (
      <p className="text-sm text-slate-500">
        No PM Publication row mapped yet — check Lambda code tab for inputs/outputs.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-300">
        <span className="text-slate-500">Sheet</span> {ex.sheet} ·{" "}
        <span className="text-slate-500">rows</span> {ex.rows} ·{" "}
        <span className="text-slate-500">market</span> {ex.market}
      </p>
      {ex.lineCell && (
        <p className="text-slate-400">
          Line column <span className="font-mono text-slate-200">F</span> e.g.{" "}
          <span className="font-mono text-orange-200">{ex.lineCell}</span>
        </p>
      )}
      {(ex.adjustCell || ex.adjustCells) && (
        <p className="text-slate-400">
          Trader adjust (purple):{" "}
          <span className="font-mono text-orange-200">
            {ex.adjustCells?.join(", ") ?? ex.adjustCell}
          </span>
        </p>
      )}
      {ex.lambdaAdjust && (
        <p className="font-mono text-xs text-slate-500">
          Legacy C# path (parity review): {ex.lambdaAdjust}
        </p>
      )}
      {ex.probabilityCells && (
        <p className="text-slate-400">
          Probabilities:{" "}
          <span className="font-mono text-orange-200">{ex.probabilityCells.join(", ")}</span>
        </p>
      )}
      {ex.selections && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 pr-3">Selection</th>
                <th className="pb-2 pr-3">Prob</th>
                <th className="pb-2 pr-3">Adjust</th>
                <th className="pb-2">Lambda</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ex.selections.map((s) => (
                <tr key={s.row} className="border-t border-surface-border">
                  <td className="py-2 pr-3">{s.selection}</td>
                  <td className="py-2 pr-3 font-mono">{s.prob}</td>
                  <td className="py-2 pr-3 font-mono text-orange-200">{s.adjust}</td>
                  <td className="py-2 font-mono text-slate-500">{s.lambda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ex.notes && <p className="text-xs text-slate-500">{ex.notes}</p>}
    </div>
  );
}

function GuideDetail({ guide }: { guide: MarketTradingGuide }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-orange-300">{guide.className}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{guide.marketName}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">{guide.description}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>
              Code <span className="font-mono text-slate-300">{guide.marketCode}</span>
            </p>
            <p className="mt-1 font-mono text-slate-400">{guide.lambdaClass}</p>
            <PhaseBadge phase={guide.phase} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Data flow
        </h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          {guide.dataFlow.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <TraderSkewGuideSection skew={guide.traderSkewGuide} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            Trader adjust fields (registry)
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Post-model skew — replaces purple {excelConventions.preMatchAdjustSheet} column{" "}
            {excelConventions.preMatchAdjustColumn}. Typically I÷100 = ±0.01 probability (see Prep
            Work {traderAdjustArchitecture.prepWork.e10.cell}). Not sent into Lambda.
          </p>
          <div className="mt-4">
            <FieldList
              items={guide.traderAdjusts}
              empty="No per-row trader skew on this market — display Lambda output only."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
          <h3 className="text-lg font-semibold text-white">Excel trading today</h3>
          <p className="mt-1 text-xs text-slate-400">
            How traders interact with this market in the workbook
          </p>
          <div className="mt-4">
            <ExcelTradingCard guide={guide} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
          <h3 className="text-lg font-semibold text-white">Static values to store</h3>
          <p className="mt-1 text-xs text-slate-400">
            Parameters the backend holds per fixture — from prep / evaluation, not trader skew
          </p>
          <div className="mt-4">
            <FieldList
              items={guide.staticInputs}
              empty="No explicit parameters — may rely entirely on evaluation graph."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
          <h3 className="text-lg font-semibold text-white">Sheet exports &amp; evaluation</h3>
          <p className="mt-1 text-xs text-slate-400">
            Values exported from Prep Work (or equivalent) to build IPricingInputs before Lambda
          </p>
          <div className="mt-4">
            <FieldList
              items={guide.sheetExports}
              empty="Uses shared evaluation only — see Overview / Variables tabs for Prep Work chain."
            />
          </div>
        </section>
      </div>

      {guide.embeddedLookups.length > 0 && (
        <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
          <h3 className="text-lg font-semibold text-white">Lookups &amp; embedded constants</h3>
          <p className="mt-1 text-xs text-slate-400">
            Not shown on trading FE — live in Lambda config / lookup provider
          </p>
          <div className="mt-4">
            <FieldList items={guide.embeddedLookups} empty="" />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6">
        <h3 className="text-lg font-semibold text-emerald-100">
          Expected on new FE after Lambda runs
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          What to render once the model returns — mirrors PM Publication output columns
        </p>
        <ul className="mt-4 space-y-4">
          {guide.expectedOutputs.map((out) => (
            <li
              key={out.label}
              className="rounded-lg border border-emerald-900/40 bg-surface/50 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{out.label}</span>
                <span className="rounded bg-surface-raised px-2 py-0.5 text-xs text-slate-400">
                  {out.type}
                </span>
              </div>
              <p className="mt-2 text-emerald-100/90">{out.feDisplay}</p>
              {out.excelRef && (
                <p className="mt-2 text-xs text-slate-400">Excel ref: {out.excelRef}</p>
              )}
              {out.csharpPath && (
                <p className="mt-1 font-mono text-xs text-slate-500">{out.csharpPath}</p>
              )}
              {out.notes && <p className="mt-1 text-xs text-slate-500">{out.notes}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-orange-900/40 bg-orange-950/15 p-6">
        <h3 className="text-lg font-semibold text-orange-100">PM Publication QA (F / G / I)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Extracted workbook values for this fixture — line in column F, probability in G, trader
          adjust in I. Status becomes a full Lambda compare once pricing output is wired.
        </p>
        <div className="mt-4">
          <PmQaTable
            registryModelId={guide.registryModelId}
            selections={guide.pmQaSelections}
            fixtureId={guide.pmQaFixtureId}
          />
        </div>
      </section>

      {guide.parityGaps.length > 0 && (
        <section className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6">
          <h3 className="text-sm font-semibold text-amber-200">Parity gaps / open questions</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
            {guide.parityGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function MarketTradingGuidePanel() {
  const [fixtureId, setFixtureId] = useState(PM_QA_DEFAULT_FIXTURE_ID);
  const { guides } = useMemo(() => buildMarketGuides(fixtureId), [fixtureId]);
  const [selectedId, setSelectedId] = useState(guides[0]?.id ?? "");

  const grouped = useMemo(() => {
    const map = new Map<string, MarketTradingGuide[]>();
    for (const g of guides) {
      const key = groupLabel(g);
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [guides]);

  const selected = guides.find((g) => g.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Trading interface guide</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Select a Lambda market to see what the new trading web app needs: trader-adjustable
          fields (today&apos;s purple Excel cells), static inputs to store, Prep Work exports
          for the evaluation payload, and what to display after pricing runs.
        </p>
        <div className="mt-4">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            PM Publication fixture
          </label>
          <select
            value={fixtureId}
            onChange={(e) => setFixtureId(e.target.value)}
            className="mt-1 block max-w-md rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          >
            {pmQaFixtureList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TraderAdjustOverview />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-72">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Market
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-white"
          >
            {grouped.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.marketName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">{guides.length} Lambda models documented</p>
        </div>

        <div className="min-w-0 flex-1">
          {selected ? (
            <GuideDetail guide={selected} />
          ) : (
            <p className="text-sm text-slate-500">Select a market.</p>
          )}
        </div>
      </div>
    </div>
  );
}
