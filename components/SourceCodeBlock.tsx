"use client";

import { useEffect, useState, type ReactNode } from "react";

function highlightSource(source: string, query?: string): ReactNode {
  if (!query || query.length < 2) return source;

  const lower = source.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(q, start);

  while (idx !== -1) {
    if (idx > start) parts.push(source.slice(start, idx));
    parts.push(
      <mark key={idx} className="rounded bg-amber-500/40 text-amber-100">
        {source.slice(idx, idx + query.length)}
      </mark>
    );
    start = idx + query.length;
    idx = lower.indexOf(q, start);
  }

  if (start < source.length) parts.push(source.slice(start));
  return parts;
}

export function SourceCodeBlock({
  filePath,
  searchHighlight,
  defaultOpen = false,
}: {
  filePath: string;
  searchHighlight?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || content !== null || loading) return;

    setLoading(true);
    fetch(`/api/pricing-models/source?path=${encodeURIComponent(filePath)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        const data = (await r.json()) as { content: string };
        setContent(data.content);
      })
      .catch(() => setError("Could not load source file"))
      .finally(() => setLoading(false));
  }, [open, content, loading, filePath]);

  return (
    <details
      className="mt-6 rounded-xl border border-surface-border bg-surface"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-300 marker:content-none">
        <span className="font-mono text-xs text-orange-200">{filePath}</span>
      </summary>
      <div className="border-t border-surface-border p-4">
        {loading && <p className="text-xs text-slate-500">Loading…</p>}
        {error && <p className="text-xs text-red-300">{error}</p>}
        {content && (
          <pre className="max-h-[32rem] overflow-auto rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-slate-300">
            <code>{highlightSource(content, searchHighlight)}</code>
          </pre>
        )}
      </div>
    </details>
  );
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || query.length < 2 || !text.toLowerCase().includes(query.toLowerCase())) {
    return <>{text}</>;
  }

  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(q, start);

  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx));
    parts.push(
      <mark key={idx} className="rounded bg-amber-500/30 text-amber-100">
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    start = idx + query.length;
    idx = lower.indexOf(q, start);
  }

  if (start < text.length) parts.push(text.slice(start));
  return <>{parts}</>;
}

export function Highlight({ text, query }: { text: string; query?: string }) {
  return <HighlightText text={text} query={query} />;
}
