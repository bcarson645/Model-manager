import { AppShell } from "@/components/AppShell";
import { requireAllowedUser } from "@/lib/auth/require-user";
import {
  comparisonFixtures,
  getRegistrySummary,
  models,
  nzSaWorkbook,
  variables,
} from "@/lib/sample-data";

export default async function HomePage() {
  await requireAllowedUser();

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
