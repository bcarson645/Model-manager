import { PromptBuilder } from "@/components/PromptBuilder";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-surface-border bg-surface-raised/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Model Manager
            </p>
            <h1 className="text-xl font-semibold text-white">
              Prompt &amp; build interfaces
            </h1>
          </div>
          <span className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-slate-400">
            v0.1 — ready for Vercel
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PromptBuilder />
      </div>
    </main>
  );
}
