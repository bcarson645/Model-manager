"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pricingModels } from "@/lib/pricing-models/registry";
import { sharedPricingArtifacts } from "@/lib/pricing-models/registry-shared";
import {
  getLambdaCategory,
  matchesQuery,
  modelSearchHaystack,
  artifactSearchHaystack,
  type LambdaCategory,
} from "@/lib/pricing-models/lambda-catalog";
import { PricingModelPanel } from "./PricingModelPanel";
import { SharedArtifactPanel } from "./SharedArtifactPanel";

type PhaseFilter = "all" | "pre_match" | "in_play";

export function LambdaCodePanel() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<LambdaCategory>("all");
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [parityGapsOnly, setParityGapsOnly] = useState(false);
  const [sourceMatchIds, setSourceMatchIds] = useState<Set<string> | null>(null);
  const [sourceArtifactIds, setSourceArtifactIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSourceMatchIds(null);
      setSourceArtifactIds(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    fetch(`/api/pricing-models/search?q=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((data: { modelIds: string[]; artifactIds: string[] }) => {
        if (cancelled) return;
        setSourceMatchIds(new Set(data.modelIds));
        setSourceArtifactIds(new Set(data.artifactIds));
      })
      .catch(() => {
        if (!cancelled) {
          setSourceMatchIds(new Set());
          setSourceArtifactIds(new Set());
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const filterModel = useCallback(
    (model: (typeof pricingModels)[0]) => {
      if (category !== "all" && getLambdaCategory(model.namespace) !== category) {
        return false;
      }
      if (phase !== "all" && model.phase !== phase) return false;
      if (parityGapsOnly && model.missingForParity.length === 0) return false;

      const q = search.trim();
      if (!q) return true;

      const metaMatch = matchesQuery(modelSearchHaystack(model), q);
      if (metaMatch) return true;
      if (sourceMatchIds) return sourceMatchIds.has(model.id);
      return false;
    },
    [category, phase, parityGapsOnly, search, sourceMatchIds]
  );

  const filterArtifact = useCallback(
    (artifact: (typeof sharedPricingArtifacts)[0]) => {
      if (category !== "all" && category !== "Shared") return false;

      const q = search.trim();
      if (!q) return true;

      const metaMatch = matchesQuery(artifactSearchHaystack(artifact), q);
      if (metaMatch) return true;
      if (sourceArtifactIds) return sourceArtifactIds.has(artifact.id);
      return false;
    },
    [category, search, sourceArtifactIds]
  );

  const filteredModels = useMemo(
    () => pricingModels.filter(filterModel),
    [filterModel]
  );

  const filteredArtifacts = useMemo(
    () => sharedPricingArtifacts.filter(filterArtifact),
    [filterArtifact]
  );

  const showShared =
    category === "all" || category === "Shared";

  const categories: LambdaCategory[] = [
    "all",
    "Matches",
    "Teams",
    "Players",
    "Head-to-head",
    "Groups",
    "Shared",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Lambda pricing models</h2>
        <p className="mt-1 text-sm text-slate-400">
          {pricingModels.length} models · {sharedPricingArtifacts.length} shared artifacts
          in <span className="font-mono text-slate-300">reference/pricing-models/</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class, market, inputs, C# source…"
            className="min-w-[220px] flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LambdaCategory)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-300"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All folders" : c}
              </option>
            ))}
          </select>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as PhaseFilter)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-300"
          >
            <option value="all">All phases</option>
            <option value="pre_match">Pre-match</option>
            <option value="in_play">Live</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={parityGapsOnly}
              onChange={(e) => setParityGapsOnly(e.target.checked)}
            />
            Parity gaps only
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}
          {showShared &&
            ` · ${filteredArtifacts.length} shared artifact${filteredArtifacts.length !== 1 ? "s" : ""}`}
          {searching && " · searching source files…"}
          {debouncedSearch.length >= 2 && !searching && search.trim() && (
            <span className="text-slate-400">
              {" "}
              (includes matches in .cs source when not in metadata)
            </span>
          )}
        </p>
      </div>

      {filteredModels.length === 0 && (!showShared || filteredArtifacts.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
          No models match your filters.
        </div>
      ) : (
        <>
          {filteredModels.map((model) => (
            <PricingModelPanel
              key={model.id}
              model={model}
              searchHighlight={search.trim() || undefined}
              defaultShowSource={Boolean(search.trim())}
            />
          ))}

          {showShared && filteredArtifacts.length > 0 && (
            <>
              <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
                <h2 className="text-lg font-semibold text-white">Shared helpers &amp; interfaces</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Cross-market utilities referenced by multiple pricing models.
                </p>
              </div>
              {filteredArtifacts.map((artifact) => (
                <SharedArtifactPanel
                  key={artifact.id}
                  artifact={artifact}
                  searchHighlight={search.trim() || undefined}
                  defaultShowSource={Boolean(search.trim())}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
