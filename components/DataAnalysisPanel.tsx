"use client";

import { FormatPlaceholderPanel } from "./FormatPlaceholderPanel";
import { MatchAnalysisPanel } from "./analysis/MatchAnalysisPanel";
import { PlayerAnalysisPanel } from "./analysis/PlayerAnalysisPanel";
import { QueriesLogPanel } from "./analysis/QueriesLogPanel";
import type { AnalysisSection, DataFormat } from "@/lib/scorecards/types";
import { hasFormatData } from "@/lib/scorecards/format-source";

export type { DataFormat, AnalysisSection };

type DataAnalysisPanelProps = {
  activeFormat: DataFormat;
  activeSection: AnalysisSection;
};

export function DataAnalysisPanel({
  activeFormat,
  activeSection,
}: DataAnalysisPanelProps) {
  if (activeFormat === "first-class") {
    return <FormatPlaceholderPanel format="First class" />;
  }

  if (!hasFormatData(activeFormat)) {
    return (
      <FormatPlaceholderPanel
        format={activeFormat === "t20" ? "T20" : "ODI"}
        message={`Run python scripts/extract-${activeFormat}-scorecards.py to load data.`}
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
