"use client";

import type {
  IntegrationReadiness,
  IntegrationWiringGuide,
  WiringCheckItem,
} from "@/lib/trading-guide/integration-wiring";
import {
  platformIntegrationOverview,
  readinessLabels,
  connectedLabel,
  listMarketsByReadiness,
  listConnectedMarkets,
} from "@/lib/trading-guide/integration-wiring";

const statusStyles: Record<WiringCheckItem["status"], string> = {
  have: "text-emerald-400",
  need: "text-rose-400",
  lookup: "text-sky-400",
  decision: "text-amber-400",
};

const statusLabels: Record<WiringCheckItem["status"], string> = {
  have: "Have",
  need: "Need in UI / payload",
  lookup: "Backend lookup",
  decision: "Architecture choice",
};

function Checklist({
  title,
  items,
}: {
  title: string;
  items: WiringCheckItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-surface-border bg-surface/60 px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium uppercase ${statusStyles[item.status]}`}>
                {statusLabels[item.status]}
              </span>
              <span className="font-medium text-white">{item.label}</span>
            </div>
            <p className="mt-1 text-slate-400">{item.detail}</p>
            {item.source && (
              <p className="mt-1 font-mono text-xs text-slate-500">{item.source}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlatformIntegrationOverview() {
  const o = platformIntegrationOverview;
  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/15 p-6">
      <h3 className="text-lg font-semibold text-white">{o.title}</h3>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{o.summary}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {o.screens.map((screen) => (
          <div
            key={screen.name}
            className="rounded-xl border border-surface-border bg-surface-raised p-4"
          >
            <p className="font-medium text-white">{screen.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">Replaces {screen.replaces}</p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-400">
              {screen.provides.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Universal pipeline
        </h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          {o.universalPipeline.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <p className="mt-4 rounded-lg border border-amber-900/30 bg-amber-950/10 px-3 py-2 text-xs text-amber-200/90">
        {o.adjustArchitectureNote}
      </p>
    </div>
  );
}

export function ConnectedBadge() {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${connectedLabel.className}`}
      title={connectedLabel.description}
    >
      {connectedLabel.label}
    </span>
  );
}

export function ReadinessBadge({
  readiness,
  connected,
}: {
  readiness: IntegrationReadiness;
  connected?: boolean;
}) {
  if (connected) return <ConnectedBadge />;
  const meta = readinessLabels[readiness];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}

export function IntegrationWiringSection({ wiring }: { wiring: IntegrationWiringGuide }) {
  const meta = readinessLabels[wiring.readiness];

  return (
    <section className="rounded-2xl border border-cyan-900/35 bg-cyan-950/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Integration wiring</h3>
          <p className="mt-1 text-xs text-slate-500">
            What to connect between Player Adjustment → Lambda → Market Configuration
          </p>
        </div>
        <ReadinessBadge readiness={wiring.readiness} connected={wiring.connected} />
      </div>

      {wiring.connected && wiring.connectedNote && (
        <p className="mt-4 rounded-lg border border-teal-900/40 bg-teal-950/20 px-3 py-2 text-sm text-teal-200">
          {wiring.connectedNote}
        </p>
      )}

      {!wiring.connected && (
        <p className={`mt-4 text-sm ${meta.className.split(" ").pop()}`}>{wiring.readinessSummary}</p>
      )}
      {wiring.connected && (
        <p className="mt-4 text-sm text-teal-300">{wiring.readinessSummary}</p>
      )}

      {!wiring.connected && wiring.blockers && wiring.blockers.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-rose-400">Blockers</p>
          <ul className="mt-1 list-disc pl-4 text-sm text-rose-200/90">
            {wiring.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {wiring.fromPlayerAdjustment.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Already from Player Adjustment
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {wiring.fromPlayerAdjustment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Checklist title="Extra evaluation inputs" items={wiring.extraEvaluationInputs} />
        <Checklist title="Backend only (no UI tab)" items={wiring.backendOnly} />
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Market Configuration must
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {wiring.marketConfiguration.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Wiring steps
        </h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          {wiring.wiringSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {wiring.uiNotes && wiring.uiNotes.length > 0 && (
        <div className="mt-5 rounded-lg border border-surface-border bg-surface/50 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-slate-500">UI notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-400">
            {wiring.uiNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ReadyMarketsSummary() {
  const connected = listConnectedMarkets();
  const byReadiness = listMarketsByReadiness();

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="text-lg font-semibold text-white">Implementation priority</h3>
      <p className="mt-1 text-sm text-slate-400">
        Connected markets are live end-to-end. Next: green (ready), then amber (ready soon).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-xl border p-4 ${connectedLabel.className.split(" ").slice(0, 2).join(" ")} bg-surface/40`}>
          <p className="font-medium text-teal-300">{connectedLabel.label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{connected.length}</p>
          <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-400">
            {connected.map((id) => (
              <li key={id} className="font-mono">
                {id}
              </li>
            ))}
          </ul>
        </div>
        {(["ready", "ready_soon", "blocked"] as const).map((tier) => {
          const meta = readinessLabels[tier];
          const ids = byReadiness[tier];
          const borderClass =
            tier === "ready"
              ? "border-emerald-900/40"
              : tier === "ready_soon"
                ? "border-amber-900/40"
                : "border-rose-900/40";
          return (
            <div key={tier} className={`rounded-xl border p-4 ${borderClass} bg-surface/40`}>
              <p className="font-medium">{meta.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{ids.length}</p>
              <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-400">
                {ids.map((id) => (
                  <li key={id} className="font-mono">
                    {id}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
