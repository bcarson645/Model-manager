"use client";

import { useMemo, useState } from "react";
import {
  OUTCOME_ORDER,
  phaseLabel,
  runMonteCarlo,
  type MonteCarloResult,
  type SideResult,
} from "@/lib/srl/monte-carlo-outcomes";

const OVER_PRESETS = [1, 5, 10, 15, 19, 20] as const;

function pct(x: number): string {
  return `${(100 * x).toFixed(1)}%`;
}

function runs(x: number): string {
  return x.toFixed(4);
}

function deltaClass(d: number): string {
  if (Math.abs(d) < 0.0005) return "text-slate-500";
  return d > 0 ? "text-amber-300" : "text-sky-300";
}

export function SrlMonteCarloPanel() {
  const [over, setOver] = useState(1);
  const [n, setN] = useState(1000);
  const [seed, setSeed] = useState(43);
  const [result, setResult] = useState<MonteCarloResult | null>(() =>
    runMonteCarlo({ over: 1, n: 1000, seed: 43 }),
  );

  const summary = useMemo(() => {
    if (!result) return null;
    const dRuns = result.auto.mcAvgRuns - result.atlas.mcAvgRuns;
    const dExact = result.auto.exactAvgRuns - result.atlas.exactAvgRuns;
    return { dRuns, dExact, perInns: dExact * 120 };
  }, [result]);

  function run() {
    setResult(runMonteCarlo({ over, n, seed }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Outcome generator
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Monte Carlo</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Simulate one delivery many times and compare outcome rates and average team
          runs. Shared synthetic base (bowl SR 0.29 wkts/over, opener-style scoring);
          Atlas uses sheet extras coeffs, Auto applies C# sim multipliers (
          <span className="font-mono text-violet-200">2×1.23</span>,{" "}
          <span className="font-mono text-violet-200">4×1.15</span>,{" "}
          <span className="font-mono text-violet-200">W×1.1</span>).
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <label className="block text-xs font-medium uppercase text-slate-500">
            Over
            <input
              type="number"
              min={1}
              max={20}
              value={over}
              onChange={(e) => setOver(Number(e.target.value) || 1)}
              className="mt-1 block w-24 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-medium uppercase text-slate-500">
            Samples
            <input
              type="number"
              min={100}
              max={100000}
              step={100}
              value={n}
              onChange={(e) => setN(Number(e.target.value) || 1000)}
              className="mt-1 block w-28 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-medium uppercase text-slate-500">
            Seed
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="mt-1 block w-28 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={run}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Run Monte Carlo
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {OVER_PRESETS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                setOver(o);
                setResult(runMonteCarlo({ over: o, n, seed }));
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                over === o
                  ? "bg-violet-600/80 text-white"
                  : "bg-surface text-slate-400 hover:text-slate-200"
              }`}
            >
              Over {o}
            </button>
          ))}
        </div>
      </section>

      {result && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Context"
              value={`Over ${result.over}`}
              hint={phaseLabel(result.phase)}
            />
            <Stat
              label="Atlas avg runs / ball"
              value={runs(result.atlas.mcAvgRuns)}
              hint={`Exact ${runs(result.atlas.exactAvgRuns)}`}
            />
            <Stat
              label="Auto avg runs / ball"
              value={runs(result.auto.mcAvgRuns)}
              hint={`Exact ${runs(result.auto.exactAvgRuns)}`}
            />
            <Stat
              label="Delta (Auto − Atlas)"
              value={`${summary.dExact >= 0 ? "+" : ""}${runs(summary.dExact)}`}
              hint={`~${summary.perInns >= 0 ? "+" : ""}${summary.perInns.toFixed(1)} / 120 balls`}
              valueClass={deltaClass(summary.dExact)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SideCard title="Atlas" side={result.atlas} n={result.n} accent="sky" />
            <SideCard title="Auto" side={result.auto} n={result.n} accent="amber" />
          </div>

          <OutcomeTable result={result} />
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-2xl text-white ${valueClass ?? ""}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SideCard({
  title,
  side,
  n,
  accent,
}: {
  title: string;
  side: SideResult;
  n: number;
  accent: "sky" | "amber";
}) {
  const ring = accent === "sky" ? "border-sky-500/30" : "border-amber-500/30";
  const tag = accent === "sky" ? "text-sky-300" : "text-amber-300";
  return (
    <div className={`rounded-2xl border ${ring} bg-surface-raised p-5`}>
      <h3 className={`text-sm font-semibold ${tag}`}>{title}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="MC avg runs" value={runs(side.mcAvgRuns)} />
        <Metric label="Exact E[runs]" value={runs(side.exactAvgRuns)} />
        <Metric label="P(W)" value={pct(side.exactPWicket)} />
        <Metric label="P(4)+P(6)" value={pct(side.exactPBoundary)} />
        <Metric label="P(0)" value={pct(side.exactPDot)} />
        <Metric label="Samples" value={String(n)} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-white">{value}</dd>
    </div>
  );
}

function OutcomeTable({ result }: { result: MonteCarloResult }) {
  const rows = OUTCOME_ORDER.filter(
    (k) =>
      (result.atlas.counts[k] ?? 0) > 0 ||
      (result.auto.counts[k] ?? 0) > 0 ||
      (result.atlas.probs[k] ?? 0) > 0.0005 ||
      (result.auto.probs[k] ?? 0) > 0.0005,
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-raised text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Outcome</th>
            <th className="px-3 py-2 text-right">Atlas count</th>
            <th className="px-3 py-2 text-right">Atlas %</th>
            <th className="px-3 py-2 text-right">Auto count</th>
            <th className="px-3 py-2 text-right">Auto %</th>
            <th className="px-3 py-2 text-right">Δ pp</th>
            <th className="px-3 py-2 text-right">Exact Atlas</th>
            <th className="px-3 py-2 text-right">Exact Auto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {rows.map((k) => {
            const aC = result.atlas.counts[k] ?? 0;
            const bC = result.auto.counts[k] ?? 0;
            const aR = aC / result.n;
            const bR = bC / result.n;
            const dPp = 100 * (bR - aR);
            return (
              <tr key={k} className="text-slate-300">
                <td className="px-3 py-2 font-mono text-violet-200">{k}</td>
                <td className="px-3 py-2 text-right font-mono">{aC}</td>
                <td className="px-3 py-2 text-right font-mono">{pct(aR)}</td>
                <td className="px-3 py-2 text-right font-mono">{bC}</td>
                <td className="px-3 py-2 text-right font-mono">{pct(bR)}</td>
                <td className={`px-3 py-2 text-right font-mono ${deltaClass(dPp / 100)}`}>
                  {dPp >= 0 ? "+" : ""}
                  {dPp.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-500">
                  {pct(result.atlas.probs[k] ?? 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-500">
                  {pct(result.auto.probs[k] ?? 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-surface-border px-3 py-2 text-xs text-slate-500">
        n={result.n} · seed={result.seed} · Δ pp = Auto % − Atlas % (percentage points)
      </p>
    </div>
  );
}
