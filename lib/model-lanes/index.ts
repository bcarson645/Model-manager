export type { ModelLaneMeta, ModelManagerLane } from "./types";
export { liveLane } from "./live";
export { srlLane } from "./srl";

import type { ModelManagerLane } from "./types";
import { liveLane } from "./live";
import { srlLane } from "./srl";

export function getModelLaneMeta(lane: Exclude<ModelManagerLane, "pre_match">) {
  return lane === "live" ? liveLane : srlLane;
}

export const modelLaneNav: Array<{
  id: ModelManagerLane;
  label: string;
  available: boolean;
}> = [
  { id: "pre_match", label: "Pre-match", available: true },
  { id: "live", label: "Live", available: true },
  { id: "srl", label: "SRL", available: true },
  { id: "updates", label: "Updates", available: true },
];
