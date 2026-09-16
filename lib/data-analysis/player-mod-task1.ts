import type { PlayerModTask1Data } from "./player-mod-types";
import raw from "./player-mod-task1.json";

const data = raw as PlayerModTask1Data;

export function getPlayerModTask1(): PlayerModTask1Data {
  return data;
}
