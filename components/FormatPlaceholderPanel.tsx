type FormatPlaceholderPanelProps = {
  format: string;
  message?: string;
};

export function FormatPlaceholderPanel({ format, message }: FormatPlaceholderPanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
        {format}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">Coming soon</h2>
      <p className="mt-3 max-w-xl text-sm text-slate-400">
        {message ??
          (format === "T20"
            ? "T20 scorecard data will appear here once the workbook is loaded and extracted."
            : "First class scorecard data will appear here once a workbook is provided.")}
      </p>
    </div>
  );
}
