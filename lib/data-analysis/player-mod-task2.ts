import type { PlayerModTask2Data } from "./player-mod-task2-types";
import raw from "./player-mod-task2.json";

const data = raw as PlayerModTask2Data;

export function getPlayerModTask2(): PlayerModTask2Data {
  return data;
}
