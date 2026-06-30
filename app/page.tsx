import { AppShell } from "@/components/AppShell";
import {
  comparisonFixtures,
  getRegistrySummary,
  models,
  nzSaWorkbook,
  variables,
} from "@/lib/sample-data";

export default function HomePage() {
  const summary = getRegistrySummary();
  const comparison = comparisonFixtures[0];

  return (
    <AppShell
      summary={summary}
      models={models}
      variables={variables}
      comparison={comparison}
      workbook={nzSaWorkbook}
      matchId={nzSaWorkbook.matchId}
    />
  );
}
