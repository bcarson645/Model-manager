"use client";

import { useMemo, useState } from "react";
import type { MarketTradingGuide } from "@/lib/trading-guide";
import { buildJiraTicketDraft } from "@/lib/trading-guide/jira-ticket";

const kindStyles: Record<string, string> = {
  expected_value: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  functional: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  wiring: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  ui: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const kindLabels: Record<string, string> = {
  expected_value: "Expected value",
  functional: "Functional",
  wiring: "Wiring",
  ui: "UI",
};

export function JiraTicketSection({ guide }: { guide: MarketTradingGuide }) {
  const draft = useMemo(() => buildJiraTicketDraft(guide), [guide]);
  const [copied, setCopied] = useState(false);

  async function copyPasteText() {
    try {
      await navigator.clipboard.writeText(draft.pasteText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-900/50 bg-indigo-950/20 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-indigo-100">JIRA ticket scaffold</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Copy into a Story for wiring this market to the trading UI. Acceptance criteria include
            default fixture probs / lines (adjust = 0).
          </p>
        </div>
        <button
          type="button"
          onClick={copyPasteText}
          className="rounded-lg border border-indigo-500/40 bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/30"
        >
          {copied ? "Copied" : "Copy for JIRA"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-surface-border bg-surface/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</p>
        <p className="mt-1 font-medium text-white">{draft.summary}</p>
        <p className="mt-2 text-xs text-slate-500">
          Type: {draft.issueTypeHint} · Labels: {draft.labels.join(", ")}
        </p>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-white">Process flow</h4>
        <ol className="mt-3 space-y-3">
          {draft.processFlow.map((step) => (
            <li
              key={step.step}
              className="flex gap-3 rounded-lg border border-surface-border bg-surface/40 px-3 py-2.5 text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-200">
                {step.step}
              </span>
              <div>
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-0.5 text-slate-400">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-white">Acceptance criteria</h4>
        <ul className="mt-3 space-y-2">
          {draft.acceptanceCriteria.map((ac, i) => (
            <li
              key={ac.id}
              className="rounded-lg border border-surface-border bg-surface/40 px-3 py-2.5 text-sm text-slate-300"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500">AC{i + 1}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${kindStyles[ac.kind] ?? kindStyles.ui}`}
                >
                  {kindLabels[ac.kind] ?? ac.kind}
                </span>
              </div>
              {ac.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
