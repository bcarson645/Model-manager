import { AppShell } from "@/components/AppShell";
import { clerkPublishableKey } from "@/lib/auth/clerk-keys";
import { requireAllowedUser } from "@/lib/auth/require-user";
import {
  comparisonFixtures,
  getRegistrySummary,
  models,
  nzSaWorkbook,
  variables,
} from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!clerkPublishableKey() || !process.env.CLERK_SECRET_KEY) {
    return (
      <main className="p-6 text-sm text-slate-400">
        Clerk environment variables are not set. Add{" "}
        <code className="text-slate-200">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
        (or <code className="text-slate-200">CLERK_PUBLISHABLE_KEY</code>) and{" "}
        <code className="text-slate-200">CLERK_SECRET_KEY</code> in Vercel, then
        redeploy.
      </main>
    );
  }

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
