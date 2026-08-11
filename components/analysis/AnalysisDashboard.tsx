import type { ReactNode } from "react";

type ClassNameProps = { className?: string; children?: ReactNode };

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Page shell with responsive padding and vertical rhythm */
export function DashPage({ className, children }: ClassNameProps) {
  return (
    <div className={cx("mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-5", className)}>
      {children}
    </div>
  );
}

type DashHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function DashHeader({ title, subtitle, badge, actions }: DashHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-raised/80 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function DashBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-300">
      {children}
    </span>
  );
}

/** Responsive CSS grid — 1 col mobile, 2 sm, 12-col from lg for span control */
export function DashGrid({ className, children }: ClassNameProps) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12",
        className
      )}
    >
      {children}
    </div>
  );
}

type DashSpan = "full" | "half" | "third" | "quarter" | "two-thirds" | "kpi";

const spanClass: Record<DashSpan, string> = {
  full: "sm:col-span-2 lg:col-span-12",
  half: "sm:col-span-1 lg:col-span-6",
  third: "sm:col-span-1 lg:col-span-4",
  quarter: "sm:col-span-1 lg:col-span-3",
  "two-thirds": "sm:col-span-2 lg:col-span-8",
  kpi: "sm:col-span-1 lg:col-span-3",
};

type DashCardProps = ClassNameProps & {
  span?: DashSpan;
  title?: string;
  description?: ReactNode;
  compact?: boolean;
  dashed?: boolean;
};

export function DashCard({
  span = "full",
  title,
  description,
  compact,
  dashed,
  className,
  children,
}: DashCardProps) {
  return (
    <section
      className={cx(
        spanClass[span],
        "flex min-w-0 flex-col rounded-xl border bg-surface-raised",
        dashed ? "border-dashed border-surface-border" : "border-surface-border",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-3 shrink-0 sm:mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          )}
          {description && (
            <div className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm sm:text-slate-400">
              {description}
            </div>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

type DashStatProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  span?: DashSpan;
  accent?: boolean;
};

export function DashStat({
  label,
  value,
  sub,
  span = "kpi",
  accent,
}: DashStatProps) {
  return (
    <div
      className={cx(
        spanClass[span],
        "rounded-xl border border-surface-border bg-surface p-3 sm:p-4",
        accent && "border-emerald-500/25 bg-emerald-950/20"
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xl text-white sm:text-2xl">
        {value}
      </p>
      {sub != null && sub !== "" && (
        <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{sub}</p>
      )}
    </div>
  );
}

type DashTabsProps<T extends string> = {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
};

export function DashTabs<T extends string>({
  tabs,
  value,
  onChange,
}: DashTabsProps<T>) {
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cx(
            "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2",
            value === t.id
              ? "bg-emerald-600/20 text-emerald-300"
              : "text-slate-400 hover:bg-surface hover:text-slate-200"
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/** Filter / picker rail — stacks above content on mobile, sticky side on xl */
export function DashSplit({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] xl:items-start">
      <aside className="min-w-0 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
        {sidebar}
      </aside>
      <div className="min-w-0 space-y-4 sm:space-y-5">{children}</div>
    </div>
  );
}

export function DashEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-border bg-surface-raised/50 px-6 py-12 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

export function DashScrollTable({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">{children}</div>
  );
}
