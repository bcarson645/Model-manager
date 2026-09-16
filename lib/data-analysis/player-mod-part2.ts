import type { PlayerModPart2Data } from "./player-mod-part2-types";
import raw from "./player-mod-part2.json";

const data = raw as PlayerModPart2Data;

export function getPlayerModPart2(): PlayerModPart2Data {
  return data;
}
