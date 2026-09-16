import type { ModDismissalByYearData } from "./mod-dismissal-by-year-types";
import raw from "./mod-dismissal-by-year.json";

const data = raw as ModDismissalByYearData;

export function getModDismissalByYear(): ModDismissalByYearData {
  return data;
}
