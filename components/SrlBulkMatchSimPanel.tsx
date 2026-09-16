"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  aggregateResults,
  cloneStandardTeam,
  defaultAwayTeam,
  defaultHomeTeam,
  runBulkChunk,
  type BulkSimAggregate,
  type MatchResultSummary,
  type StartMode,
  type TeamProfile,
  type TossChoice,
} from "@/lib/srl/match-sim";

const CHUNK = 50;
const RESULT_PREVIEW = 100;

type StartKind = "full" | "from_over" | "chase";

function fmtPct(x: number): string {
  return `${x.toFixed(1)}%`;
}

function fmtAvg(x: number): string {
  return x.toFixed(2);
}

function TeamEditor({
  label,
  team,
  onChange,
}: {
  label: string;
  team: TeamProfile;
  onChange: (t: TeamProfile) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{label}</h4>
        <button
          type="button"
          className="text-xs text-violet-300 hover:text-violet-200"
          onClick={() =>
            onChange(cloneStandardTeam(team.id, team.id === "home" ? "Home" : "Away"))
          }
        >
          Reset to standard XI
        </button>
      </div>
      <label className="mt-3 block text-xs uppercase text-slate-500">
        Team name
        <input
          value={team.name}
          onChange={(e) => onChange({ ...team, name: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
        />
      </label>

      <p className="mt-4 text-xs font-medium uppercase text-slate-500">Batters</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-1 py-1">#</th>
              <th className="px-1 py-1">Name</th>
              <th className="px-1 py-1">bt.caz</th>
              <th className="px-1 py-1">sr.caz</th>
              <th className="px-1 py-1">rating</th>
            </tr>
          </thead>
          <tbody>
            {team.batters.map((b, i) => (
              <tr key={i} className="border-t border-surface-border/60">
                <td className="px-1 py-1 text-slate-500">{b.batOrder}</td>
                <td className="px-1 py-1">
                  <input
                    value={b.name}
                    onChange={(e) => {
                      const batters = team.batters.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      );
                      onChange({ ...team, batters });
                    }}
                    className="w-full rounded border border-surface-border bg-surface px-1.5 py-1 text-white"
                  />
                </td>
                {(["btCaz", "srCaz", "rating"] as const).map((field) => (
                  <td key={field} className="px-1 py-1">
                    <input
                      type="number"
                      step={field === "srCaz" ? 0.05 : 1}
                      value={b[field]}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const batters = team.batters.map((x, j) =>
                          j === i ? { ...x, [field]: Number.isFinite(v) ? v : x[field] } : x,
                        );
                        onChange({ ...team, batters });
                      }}
                      className="w-16 rounded border border-surface-border bg-surface px-1.5 py-1 font-mono text-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs font-medium uppercase text-slate-500">Bowlers</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="px-1 py-1">Name</th>
              <th className="px-1 py-1">Econ</th>
              <th className="px-1 py-1">SR (wkt/ov)</th>
              <th className="px-1 py-1">Max ov</th>
            </tr>
          </thead>
          <tbody>
            {team.bowlers.map((b, i) => (
              <tr key={i} className="border-t border-surface-border/60">
                <td className="px-1 py-1">
                  <input
                    value={b.name}
                    onChange={(e) => {
                      const bowlers = team.bowlers.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      );
                      onChange({ ...team, bowlers });
                    }}
                    className="w-full rounded border border-surface-border bg-surface px-1.5 py-1 text-white"
                  />
                </td>
                {(["econ", "sr", "maxOvers"] as const).map((field) => (
                  <td key={field} className="px-1 py-1">
                    <input
                      type="number"
                      step={field === "maxOvers" ? 1 : 0.01}
                      value={b[field]}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const bowlers = team.bowlers.map((x, j) =>
                          j === i ? { ...x, [field]: Number.isFinite(v) ? v : x[field] } : x,
                        );
                        onChange({ ...team, bowlers });
                      }}
                      className="w-16 rounded border border-surface-border bg-surface px-1.5 py-1 font-mono text-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SrlBulkMatchSimPanel() {
  const [home, setHome] = useState<TeamProfile>(() => defaultHomeTeam());
  const [away, setAway] = useState<TeamProfile>(() => defaultAwayTeam());
  const [toss, setToss] = useState<TossChoice>("alternate");
  const [simulations, setSimulations] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [model, setModel] = useState<"auto" | "atlas">("auto");
  const [startKind, setStartKind] = useState<StartKind>("full");
  const [fromOver, setFromOver] = useState(10);
  const [fromBall, setFromBall] = useState(0);
  const [fromInnings, setFromInnings] = useState<1 | 2>(1);
  const [partialRuns, setPartialRuns] = useState(0);
  const [partialWkts, setPartialWkts] = useState(0);
  const [chaseTarget, setChaseTarget] = useState(160);
  const [showTeams, setShowTeams] = useState(false);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aggregate, setAggregate] = useState<BulkSimAggregate | null>(null);
  const cancelRef = useRef(false);

  const startMode: StartMode = useMemo(() => {
    if (startKind === "full") return { kind: "full" };
    if (startKind === "chase") {
      return {
        kind: "chase",
        target: chaseTarget,
        over: fromOver,
        ballInOver: fromBall,
        runs: partialRuns,
        wickets: partialWkts,
      };
    }
    return {
      kind: "from_over",
      over: fromOver,
      ballInOver: fromBall,
      innings: fromInnings,
      runs: partialRuns,
      wickets: partialWkts,
      target: fromInnings === 2 ? chaseTarget : undefined,
    };
  }, [
    startKind,
    fromOver,
    fromBall,
    fromInnings,
    partialRuns,
    partialWkts,
    chaseTarget,
  ]);

  const run = useCallback(async () => {
    cancelRef.current = false;
    setRunning(true);
    setProgress(0);
    setAggregate(null);

    const req = {
      home,
      away,
      toss,
      simulations,
      seed,
      start: startMode,
      model,
    };

    const all: MatchResultSummary[] = [];
    const total = Math.max(1, Math.min(20000, simulations));

    for (let from = 0; from < total; from += CHUNK) {
      if (cancelRef.current) break;
      const count = Math.min(CHUNK, total - from);
      all.push(...runBulkChunk(req, from, count));
      setProgress(all.length);
      // yield so the UI can paint
      await new Promise<void>((r) => setTimeout(r, 0));
    }

    setAggregate(aggregateResults(all));
    setRunning(false);
  }, [home, away, toss, simulations, seed, startMode, model]);

  const preview = aggregate?.results.slice(0, RESULT_PREVIEW) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Match simulator
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Bulk run SRLs</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Run full (or partial) matches end-to-end through the delivery outcome generator.
          Default teams use the standard XI / bowling attack; expand Teams to tweak
          bt.caz, sr.caz, econ and bowl SR.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-medium uppercase text-slate-500">
            Simulations
            <input
              type="number"
              min={1}
              max={20000}
              step={100}
              value={simulations}
              disabled={running}
              onChange={(e) => setSimulations(Number(e.target.value) || 1000)}
              className="mt-1 block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-medium uppercase text-slate-500">
            Bat first
            <select
              value={toss}
              disabled={running}
              onChange={(e) => setToss(e.target.value as TossChoice)}
              className="mt-1 block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              <option value="home">Home always</option>
              <option value="away">Away always</option>
              <option value="alternate">Alternate</option>
            </select>
          </label>
          <label className="block text-xs font-medium uppercase text-slate-500">
            Delivery model
            <select
              value={model}
              disabled={running}
              onChange={(e) => setModel(e.target.value as "auto" | "atlas")}
              className="mt-1 block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              <option value="auto">Auto (lambda)</option>
              <option value="atlas">Atlas extras path</option>
            </select>
          </label>
          <label className="block text-xs font-medium uppercase text-slate-500">
            Seed
            <input
              type="number"
              value={seed}
              disabled={running}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-slate-500">Start point</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["full", "Full match"],
                ["from_over", "From over"],
                ["chase", "2nd innings chase"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={running}
                onClick={() => setStartKind(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  startKind === id
                    ? "bg-violet-600 text-white"
                    : "bg-surface text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {startKind !== "full" && (
            <div className="mt-3 flex flex-wrap gap-3">
              {startKind === "from_over" && (
                <label className="text-xs uppercase text-slate-500">
                  Innings
                  <select
                    value={fromInnings}
                    disabled={running}
                    onChange={(e) => setFromInnings(Number(e.target.value) as 1 | 2)}
                    className="mt-1 block rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                  </select>
                </label>
              )}
              <label className="text-xs uppercase text-slate-500">
                Over (1-based)
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={fromOver}
                  disabled={running}
                  onChange={(e) => setFromOver(Number(e.target.value) || 1)}
                  className="mt-1 block w-20 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs uppercase text-slate-500">
                Ball in over
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={fromBall}
                  disabled={running}
                  onChange={(e) => setFromBall(Number(e.target.value) || 0)}
                  className="mt-1 block w-20 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs uppercase text-slate-500">
                Runs so far
                <input
                  type="number"
                  min={0}
                  value={partialRuns}
                  disabled={running}
                  onChange={(e) => setPartialRuns(Number(e.target.value) || 0)}
                  className="mt-1 block w-24 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs uppercase text-slate-500">
                Wickets
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={partialWkts}
                  disabled={running}
                  onChange={(e) => setPartialWkts(Number(e.target.value) || 0)}
                  className="mt-1 block w-20 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                />
              </label>
              {(startKind === "chase" || fromInnings === 2) && (
                <label className="text-xs uppercase text-slate-500">
                  Target (1st inns total)
                  <input
                    type="number"
                    min={1}
                    value={chaseTarget}
                    disabled={running}
                    onChange={(e) => setChaseTarget(Number(e.target.value) || 160)}
                    className="mt-1 block w-28 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={running}
            onClick={() => void run()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {running ? `Running… ${progress}/${simulations}` : "Run simulations"}
          </button>
          {running && (
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true;
              }}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300 hover:bg-surface"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            disabled={running}
            onClick={() => setShowTeams((v) => !v)}
            className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300 hover:bg-surface"
          >
            {showTeams ? "Hide teams" : "Edit teams"}
          </button>
        </div>

        {running && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{
                width: `${Math.min(100, (100 * progress) / Math.max(1, simulations))}%`,
              }}
            />
          </div>
        )}
      </section>

      {showTeams && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TeamEditor label="Home" team={home} onChange={setHome} />
          <TeamEditor label="Away" team={away} onChange={setAway} />
        </div>
      )}

      {aggregate && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Sims completed" value={String(aggregate.n)} />
            <Stat
              label="Avg 1st innings"
              value={fmtAvg(aggregate.avgFirstInnings)}
              hint={`2nd avg ${fmtAvg(aggregate.avgSecondInnings)}`}
            />
            <Stat
              label="Home win %"
              value={fmtPct(aggregate.homeWinPct)}
              hint={`Away ${fmtPct(aggregate.awayWinPct)} · Tie ${fmtPct(aggregate.tiePct)}`}
            />
            <Stat
              label="Bat 1st win %"
              value={fmtPct(aggregate.batFirstWinPct)}
              hint={`Bat 2nd ${fmtPct(aggregate.batSecondWinPct)}`}
            />
          </div>

          <section className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h3 className="text-sm font-semibold text-white">
              Match results
              <span className="ml-2 font-normal text-slate-500">
                (first {Math.min(RESULT_PREVIEW, aggregate.n)} of {aggregate.n})
              </span>
            </h3>
            <div className="mt-4 max-h-[420px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="sticky top-0 bg-surface-raised text-slate-500">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Bat 1st</th>
                    <th className="px-2 py-2">1st</th>
                    <th className="px-2 py-2">2nd</th>
                    <th className="px-2 py-2">Winner</th>
                    <th className="px-2 py-2">Won batting</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.simIndex} className="border-t border-surface-border/50">
                      <td className="px-2 py-1.5 font-mono text-slate-500">{r.simIndex + 1}</td>
                      <td className="px-2 py-1.5 capitalize text-slate-300">{r.battingFirst}</td>
                      <td className="px-2 py-1.5 font-mono text-white">
                        {r.firstInningsRuns}/{r.firstInningsWkts}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-white">
                        {r.secondInningsRuns}/{r.secondInningsWkts}
                      </td>
                      <td className="px-2 py-1.5 capitalize text-violet-200">{r.winner}</td>
                      <td className="px-2 py-1.5 capitalize text-slate-400">{r.winnerBat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
