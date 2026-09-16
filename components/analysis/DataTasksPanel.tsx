"use client";

import { useState } from "react";
import { DashTabs } from "./AnalysisDashboard";
import { ModBettingReportsPanel } from "./ModBettingReportsPanel";
import { ModPricingPanel } from "./ModPricingPanel";
import { Part2BettingReport } from "./Part2BettingReport";
import { PlayerModPart2Panel } from "./PlayerModPart2Panel";
import { PlayerModTask1Panel } from "./PlayerModTask1Panel";
import { PlayerModTask2Panel } from "./PlayerModTask2Panel";

type DataPartId = "part-1" | "part-2" | "mod-pricing";
type Part1TaskId = "task-1" | "task-2" | "reports";
type Part2TaskId = "analysis" | "reports";

const PART_TABS: Array<{ id: DataPartId; label: string }> = [
  { id: "part-1", label: "Part 1 — Selection & bettor P/L" },
  { id: "part-2", label: "Part 2 — Gender, format & phases" },
  { id: "mod-pricing", label: "MoD trends & pricing" },
];

const PART1_TABS: Array<{ id: Part1TaskId; label: string }> = [
  { id: "task-1", label: "P/L by selection & over" },
  { id: "task-2", label: "Bettor sharp-money" },
  { id: "reports", label: "Reports (export)" },
];

const PART2_TABS: Array<{ id: Part2TaskId; label: string }> = [
  { id: "analysis", label: "Analysis dashboard" },
  { id: "reports", label: "Reports (export)" },
];

export function DataTasksPanel() {
  const [part, setPart] = useState<DataPartId>("part-1");
  const [task, setTask] = useState<Part1TaskId>("task-1");
  const [part2Task, setPart2Task] = useState<Part2TaskId>("analysis");

  return (
    <div className="space-y-4">
      <DashTabs tabs={PART_TABS} value={part} onChange={setPart} />

      {part === "part-1" && (
        <>
          <DashTabs tabs={PART1_TABS} value={task} onChange={setTask} />
          {task === "task-1" && <PlayerModTask1Panel />}
          {task === "task-2" && <PlayerModTask2Panel />}
          {task === "reports" && <ModBettingReportsPanel />}
        </>
      )}

      {part === "part-2" && (
        <>
          <DashTabs tabs={PART2_TABS} value={part2Task} onChange={setPart2Task} />
          {part2Task === "analysis" && <PlayerModPart2Panel />}
          {part2Task === "reports" && <Part2BettingReport />}
        </>
      )}

      {part === "mod-pricing" && <ModPricingPanel />}
    </div>
  );
}
