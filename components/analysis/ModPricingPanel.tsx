"use client";

import { useState } from "react";
import { DashTabs } from "./AnalysisDashboard";
import { ModFrequencyPricingPanel } from "./ModFrequencyPricingPanel";
import { ModPortfolioPricingPanel } from "./ModPortfolioPricingPanel";
import { ModTrendsPricingReport } from "./ModTrendsPricingReport";

type ModPricingTab = "trends" | "portfolio" | "reports";

const MOD_PRICING_TABS: Array<{ id: ModPricingTab; label: string }> = [
  { id: "trends", label: "Dismissal trends" },
  { id: "portfolio", label: "Portfolio adjusts (6%)" },
  { id: "reports", label: "Reports (export)" },
];

export function ModPricingPanel() {
  const [tab, setTab] = useState<ModPricingTab>("portfolio");

  return (
    <div className="space-y-4">
      <DashTabs tabs={MOD_PRICING_TABS} value={tab} onChange={setTab} />
      {tab === "trends" && <ModFrequencyPricingPanel />}
      {tab === "portfolio" && <ModPortfolioPricingPanel />}
      {tab === "reports" && <ModTrendsPricingReport />}
    </div>
  );
}
