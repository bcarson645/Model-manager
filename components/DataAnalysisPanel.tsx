"use client";

import { useEffect, useState } from "react";
import { FormatPlaceholderPanel } from "./FormatPlaceholderPanel";
import { MatchAnalysisPanel } from "./analysis/MatchAnalysisPanel";
import { PlayerAnalysisPanel } from "./analysis/PlayerAnalysisPanel";
import { QueriesLogPanel } from "./analysis/QueriesLogPanel";
import type { AnalysisSection, DataFormat } from "@/lib/scorecards/types";
import { hasFormatData, loadMatchesForFormat } from "@/lib/scorecards/format-source";

export type { DataFormat, AnalysisSection };

type DataAnalysisPanelProps = {
  activeFormat: DataFormat;
  activeSection: AnalysisSection;
};

export function DataAnalysisPanel({
  activeFormat,
  activeSection,
}: DataAnalysisPanelProps) {
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    loadMatchesForFormat(activeFormat).then(() => {
      if (!cancelled) setLoadState("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [activeFormat]);

  if (activeFormat === "first-class") {
    return <FormatPlaceholderPanel format="First class" />;
  }

  if (loadState === "loading") {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-400">
        Loading {activeFormat === "t20" ? "T20" : "ODI"} scorecard data…
      </div>
    );
  }

  if (!hasFormatData(activeFormat)) {
    return (
      <FormatPlaceholderPanel
        format={activeFormat === "t20" ? "T20" : "ODI"}
        message={`Run python scripts/extract-${activeFormat}-scorecards.py to load data locally.`}
      />
    );
  }

  if (activeSection === "match-analysis") {
    return <MatchAnalysisPanel format={activeFormat} />;
  }
  if (activeSection === "player-analysis") {
    return <PlayerAnalysisPanel format={activeFormat} />;
  }
  return <QueriesLogPanel format={activeFormat} />;
}
