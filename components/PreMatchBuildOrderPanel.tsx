"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildLayers,
  buildNodeById,
  preMatchBuildNodes,
  type BuildLayer,
} from "@/lib/model-build-order";

type Completion = {
  frontend: boolean;
  backend: boolean;
};

type CompletionMap = Record<string, Completion>;
type ViewFilter = "all" | "incomplete" | "blocked";

const STORAGE_KEY = "model-manager:pre-match-build-order:v1";

function seededCompletion(): CompletionMap {
  return Object.fromEntries(
    preMatchBuildNodes.map((node) => [
      node.id,
      node.initiallyComplete ?? { frontend: false, backend: false },
    ])
  );
}

function isDone(value: Completion | undefined): boolean {
  return Boolean(value?.frontend && value?.backend);
}

function completionCount(completion: CompletionMap): number {
  return preMatchBuildNodes.filter((node) => isDone(completion[node.id])).length;
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function LayerIcon({ order, done }: { order: number; done: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold ${
        done
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
          : "border-surface-border bg-surface text-slate-400"
      }`}
    >
      {done ? "✓" : order}
    </span>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-border bg-surface/70 px-2.5 py-2 text-xs text-slate-300 transition hover:border-slate-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-surface-border bg-surface text-emerald-500 accent-emerald-500"
      />
      {label}
    </label>
  );
}

export function PreMatchBuildOrderPanel() {
  const [completion, setCompletion] = useState<CompletionMap>(seededCompletion);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CompletionMap;
        setCompletion({ ...seededCompletion(), ...parsed });
      }
    } catch {
      // Keep seeded state if local storage is unavailable or invalid.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completion));
  }, [completion, hydrated]);

  const blockedIds = useMemo(
    () =>
      new Set(
        preMatchBuildNodes
          .filter(
            (node) =>
              !isDone(completion[node.id]) &&
              node.dependsOn.some((id) => !isDone(completion[id]))
          )
          .map((node) => node.id)
      ),
    [completion]
  );

  const done = completionCount(completion);
  const frontendDone = preMatchBuildNodes.filter(
    (node) => completion[node.id]?.frontend
  ).length;
  const backendDone = preMatchBuildNodes.filter(
    (node) => completion[node.id]?.backend
  ).length;

  function toggle(id: string, side: keyof Completion) {
    setCompletion((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { frontend: false, backend: false }),
        [side]: !current[id]?.[side],
      },
    }));
  }

  function reset() {
    setCompletion(seededCompletion());
  }

  function visible(id: string): boolean {
    if (filter === "all") return true;
    if (filter === "blocked") return blockedIds.has(id);
    return !isDone(completion[id]);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Workbook → interface dependency map
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Pre-match model build order
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Work from root data downward. A row is complete only when both its
              frontend and backend contracts are checked. Blocked rows show the
              unfinished prerequisites that should be built first.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-3 gap-2 sm:min-w-[390px]">
            <Summary
              label="Complete"
              value={`${done}/${preMatchBuildNodes.length}`}
              sub={`${percent(done, preMatchBuildNodes.length)}%`}
            />
            <Summary
              label="Frontend"
              value={`${frontendDone}/${preMatchBuildNodes.length}`}
              sub={`${percent(frontendDone, preMatchBuildNodes.length)}%`}
            />
            <Summary
              label="Backend"
              value={`${backendDone}/${preMatchBuildNodes.length}`}
              sub={`${percent(backendDone, preMatchBuildNodes.length)}%`}
            />
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
            style={{ width: `${percent(done, preMatchBuildNodes.length)}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "incomplete", "blocked"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filter === value
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-surface-border bg-surface text-slate-400 hover:text-white"
                }`}
              >
                {value}
                {value === "blocked" ? ` (${blockedIds.size})` : ""}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
          >
            Reset to confirmed capabilities
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Progress is saved in this browser. Seeded checks reflect the capabilities
          confirmed in this project; they can be changed at any time.
        </p>
      </section>

      <div className="space-y-3">
        {buildLayers.map((layer, layerIndex) => {
          const nodes = preMatchBuildNodes.filter(
            (node) => node.layer === layer.id && visible(node.id)
          );
          const allLayerNodes = preMatchBuildNodes.filter(
            (node) => node.layer === layer.id
          );
          const layerDone = allLayerNodes.filter((node) =>
            isDone(completion[node.id])
          ).length;
          const fullyDone = layerDone === allLayerNodes.length;

          if (nodes.length === 0 && filter !== "all") return null;

          return (
            <section key={layer.id} className="relative">
              {layerIndex > 0 && (
                <div className="flex h-5 items-center pl-4">
                  <span className="h-full w-px bg-surface-border" />
                  <span className="ml-[-3px] mt-3 text-xs text-slate-600">▼</span>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised">
                <header className="flex items-start gap-3 border-b border-surface-border bg-surface/50 px-4 py-4 sm:px-5">
                  <LayerIcon order={layer.order} done={fullyDone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-white">{layer.label}</h3>
                      <span className="font-mono text-xs text-slate-500">
                        {layerDone}/{allLayerNodes.length} complete
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {layer.description}
                    </p>
                  </div>
                </header>

                <div className="divide-y divide-surface-border">
                  {nodes.map((node) => {
                    const value =
                      completion[node.id] ?? {
                        frontend: false,
                        backend: false,
                      };
                    const nodeDone = isDone(value);
                    const blockers = node.dependsOn.filter(
                      (id) => !isDone(completion[id])
                    );
                    const open = Boolean(expanded[node.id]);

                    return (
                      <article
                        key={node.id}
                        className={`px-4 py-4 sm:px-5 ${
                          nodeDone
                            ? "bg-emerald-950/10"
                            : blockers.length > 0
                              ? "bg-amber-950/5"
                              : ""
                        }`}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                  nodeDone
                                    ? "bg-emerald-400"
                                    : blockers.length > 0
                                      ? "bg-amber-400"
                                      : "bg-cyan-400"
                                }`}
                              />
                              <h4 className="font-medium text-white">
                                {node.label}
                              </h4>
                              {node.initiallyComplete && (
                                <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-emerald-300">
                                  Confirmed available
                                </span>
                              )}
                              {blockers.length > 0 && !nodeDone && (
                                <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-300">
                                  {blockers.length} prerequisite
                                  {blockers.length === 1 ? "" : "s"} missing
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm text-slate-400">
                              {node.purpose}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {node.excel.map((ref) => (
                                <span
                                  key={ref}
                                  className="rounded bg-surface px-2 py-1 font-mono text-[10px] text-slate-500"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>

                            {node.dependsOn.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="text-slate-600">Needs</span>
                                {node.dependsOn.map((id) => {
                                  const dependency = buildNodeById.get(id);
                                  const dependencyDone = isDone(completion[id]);
                                  return (
                                    <span
                                      key={id}
                                      className={
                                        dependencyDone
                                          ? "text-emerald-400/80"
                                          : "text-amber-300"
                                      }
                                    >
                                      {dependencyDone ? "✓" : "○"}{" "}
                                      {dependency?.label ?? id}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((current) => ({
                                  ...current,
                                  [node.id]: !current[node.id],
                                }))
                              }
                              className="mt-2 text-xs text-cyan-400/80 hover:text-cyan-300"
                            >
                              {open ? "Hide" : "Show"} implementation contract
                            </button>

                            {open && (
                              <div className="mt-3 grid gap-2 md:grid-cols-2">
                                <Contract
                                  title="Frontend"
                                  detail={node.frontend}
                                  complete={value.frontend}
                                />
                                <Contract
                                  title="Backend"
                                  detail={node.backend}
                                  complete={value.backend}
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Check
                              label="Frontend"
                              checked={value.frontend}
                              onChange={() => toggle(node.id, "frontend")}
                            />
                            <Check
                              label="Backend"
                              checked={value.backend}
                              onChange={() => toggle(node.id, "backend")}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <DependencySummary completion={completion} />
    </div>
  );
}

function Summary({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function Contract({
  title,
  detail,
  complete,
}: {
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface/70 p-3">
      <p
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          complete ? "text-emerald-400" : "text-slate-500"
        }`}
      >
        {complete ? "✓ " : ""}
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
    </div>
  );
}

function DependencySummary({ completion }: { completion: CompletionMap }) {
  const nextByLayer = buildLayers
    .map((layer) => {
      const node = preMatchBuildNodes.find(
        (candidate) =>
          candidate.layer === layer.id &&
          !isDone(completion[candidate.id]) &&
          candidate.dependsOn.every((id) => isDone(completion[id]))
      );
      return node ? { layer: layer.label, node } : null;
    })
    .filter(
      (
        value
      ): value is {
        layer: string;
        node: (typeof preMatchBuildNodes)[number];
      } => value != null
    );

  return (
    <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/10 p-5">
      <h3 className="font-semibold text-white">Recommended next unblocked work</h3>
      {nextByLayer.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nextByLayer.map(({ layer, node }) => (
            <div
              key={node.id}
              className="rounded-xl border border-surface-border bg-surface-raised p-3"
            >
              <p className="text-[10px] uppercase tracking-wide text-cyan-400">
                {layer}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{node.label}</p>
              <p className="mt-1 text-xs text-slate-500">{node.purpose}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-emerald-300">
          All currently defined work is complete.
        </p>
      )}
    </section>
  );
}
