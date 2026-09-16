"use client";

import { useMemo } from "react";
import { buildMarketGuides } from "@/lib/trading-guide";
import {
  getWiringConnectionStatus,
  matchedLabel,
  parityReviewLabel,
} from "@/lib/trading-guide/integration-wiring";
import { PM_QA_DEFAULT_FIXTURE_ID } from "@/lib/workbooks/pm-publication-qa";

function parsePmRowOrder(rows?: string): number {
  if (!rows) return 9999;
  const match = rows.match(/(\d+)/);
  return match ? Number(match[1]) : 9999;
}

type RegistryOverviewProps = {
  onSelectMarket: (guideId: string) => void;
};

function WiringStatusBadge({
  status,
}: {
  status: ReturnType<typeof getWiringConnectionStatus>;
}) {
  if (status === "matched") {
    return (
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${matchedLabel.className}`}
        title={matchedLabel.description}
      >
        {matchedLabel.label}
      </span>
    );
  }
  if (status === "parity_review") {
    return (
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${parityReviewLabel.className}`}
        title={parityReviewLabel.description}
      >
        {parityReviewLabel.label}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-400">
      Not matched
    </span>
  );
}

export function RegistryOverview({ onSelectMarket }: RegistryOverviewProps) {
  const guides = useMemo(() => {
    const { guides: list } = buildMarketGuides(PM_QA_DEFAULT_FIXTURE_ID);
    return [...list]
      .filter((g) => g.phase === "pre_match")
      .sort((a, b) => {
        const rowDiff =
          parsePmRowOrder(a.excelTrading?.rows) - parsePmRowOrder(b.excelTrading?.rows);
        if (rowDiff !== 0) return rowDiff;
        return a.marketName.localeCompare(b.marketName);
      });
  }, []);

  const matchedCount = guides.filter(
    (g) => getWiringConnectionStatus(g.integrationWiring) === "matched"
  ).length;
  const reviewCount = guides.filter(
    (g) => getWiringConnectionStatus(g.integrationWiring) === "parity_review"
  ).length;
  const notYetCount = guides.length - matchedCount - reviewCount;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-white">Pre-match markets</h2>
        <p className="mt-1 text-sm text-slate-400">
          PM Publication order. Click a market for the trading guide (how to map inputs).
        </p>
        <p className="mt-3 text-xs text-slate-500">
          <span className="text-emerald-400">{matchedCount}</span> matched ·{" "}
          <span className="text-orange-400">{reviewCount}</span> wired — review ·{" "}
          <span className="text-slate-400">{notYetCount}</span> not yet · {guides.length} total
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">PM rows</th>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => {
              const status = getWiringConnectionStatus(guide.integrationWiring);
              return (
                <tr
                  key={guide.id}
                  className="cursor-pointer border-b border-surface-border/60 last:border-0 transition hover:bg-surface"
                  onClick={() => onSelectMarket(guide.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {guide.excelTrading?.rows ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{guide.marketName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {guide.marketCode || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <WiringStatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
