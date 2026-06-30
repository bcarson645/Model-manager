"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type SearchableSelectProps = {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 80);
  }, [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function select(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  function commitQuery() {
    const trimmed = query.trim();
    if (!trimmed) {
      clear();
      return;
    }
    const exact = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (exact) select(exact);
    else {
      setQuery(value);
      setOpen(false);
    }
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <div className="flex gap-1">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => commitQuery()}
          className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg border border-surface-border bg-surface px-2 text-sm text-slate-400 hover:text-white"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface-raised py-1 shadow-lg"
        >
          {filtered.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(option)}
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-surface ${
                  option === value ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <p className="absolute z-20 mt-1 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-slate-500">
          No matches
        </p>
      )}
    </div>
  );
}
