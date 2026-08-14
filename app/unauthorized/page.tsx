import { allowedEmailDomains } from "@/lib/auth/allowed-domain";
import { SignOutAction } from "@/components/auth/SignOutAction";
import { clerkPublishableKey } from "@/lib/auth/clerk-keys";

export const dynamic = "force-dynamic";

export default function UnauthorizedPage() {
  if (!clerkPublishableKey()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4 text-sm text-slate-400">
        Access denied.
      </main>
    );
  }

  const domains = allowedEmailDomains().map((d) => `@${d}`).join(", ");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <h1 className="text-xl font-semibold text-white">Access denied</h1>
      <p className="max-w-md text-sm text-slate-400">
        Model Manager is limited to company accounts ({domains}). Sign out and
        use an allowed email, or ask an admin to grant access.
      </p>
      <SignOutAction />
    </main>
  );
}
