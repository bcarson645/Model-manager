import type {
  ModelDefinition,
  ModelPhase,
  ParityStatus,
  VariableScope,
} from "@/lib/types";

const scopeLabels: Record<VariableScope, string> = {
  embedded: "Embedded in function",
  parameter: "External parameter",
  trading_input: "Trading interface input",
};

const scopeStyles: Record<VariableScope, string> = {
  embedded: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  parameter: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  trading_input: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const parityLabels: Record<ParityStatus, string> = {
  matched: "Matched",
  excel_only: "Excel only",
  lambda_only: "Lambda only",
  scope_mismatch: "Scope mismatch",
  unverified: "Unverified",
};

const parityStyles: Record<ParityStatus, string> = {
  matched: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  excel_only: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  lambda_only: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  scope_mismatch: "bg-red-500/15 text-red-300 border-red-500/30",
  unverified: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const statusStyles: Record<ModelDefinition["status"], string> = {
  migrating: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  parity_check: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  production: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  deprecated: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const phaseLabels: Record<ModelPhase, string> = {
  pre_match: "Pre-match",
  in_play: "Live",
};

const phaseStyles: Record<ModelPhase, string> = {
  pre_match: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  in_play: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function ScopeBadge({ scope }: { scope: VariableScope }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${scopeStyles[scope]}`}
    >
      {scopeLabels[scope]}
    </span>
  );
}

export function ParityBadge({ parity }: { parity: ParityStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${parityStyles[parity]}`}
    >
      {parityLabels[parity]}
    </span>
  );
}

export function PhaseBadge({ phase }: { phase: ModelPhase }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${phaseStyles[phase]}`}
    >
      {phaseLabels[phase]}
    </span>
  );
}

export function ModelStatusBadge({ status }: { status: ModelDefinition["status"] }) {
  const labels: Record<ModelDefinition["status"], string> = {
    migrating: "Migrating",
    parity_check: "Parity check",
    production: "Production",
    deprecated: "Deprecated",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function SourceBadge({ source }: { source: "excel" | "lambda" }) {
  const styles =
    source === "excel"
      ? "bg-green-600/20 text-green-300 border-green-600/30"
      : "bg-orange-600/20 text-orange-300 border-orange-600/30";

  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold uppercase ${styles}`}>
      {source}
    </span>
  );
}
