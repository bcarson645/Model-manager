"use client";

import { FormEvent, useState } from "react";

type GeneratedPanel = {
  title: string;
  description: string;
  fields: Array<{ label: string; type: string }>;
};

const EXAMPLE_PROMPTS = [
  "Create a dashboard to compare model accuracy across versions",
  "Build a form to register a new ML model with name, version, and owner",
  "Design a table view for active deployments with status badges",
];

export function PromptBuilder() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedPanel | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate interface");
      }

      const data = (await response.json()) as GeneratedPanel;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Describe your interface</h2>
        <p className="mt-1 text-sm text-slate-400">
          Type what you want to build. The API stub returns a structured layout you
          can evolve into real UI generation.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Prompt
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="e.g. Create a panel to upload a model artifact and set deployment targets..."
              className="w-full min-h-[160px] resize-y rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-left text-xs text-slate-400 transition hover:border-accent/50 hover:text-slate-200"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate interface"}
          </button>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Preview</h2>
        <p className="mt-1 text-sm text-slate-400">
          Generated layout appears here. Wire this to your model or design system
          next.
        </p>

        {!result ? (
          <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface/50 p-8 text-center text-sm text-slate-500">
            Submit a prompt to see a starter interface structure.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-surface-border bg-surface p-5">
              <h3 className="text-base font-semibold text-white">{result.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{result.description}</p>
            </div>

            <div className="space-y-3">
              {result.fields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-surface-border bg-surface p-4"
                >
                  <label className="block text-sm font-medium text-slate-300">
                    {field.label}
                  </label>
                  <div className="mt-2 h-10 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs leading-10 text-slate-500">
                    {field.type} input
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
