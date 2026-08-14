import { SignUp } from "@clerk/nextjs";
import { clerkPublishableKey } from "@/lib/auth/clerk-keys";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!clerkPublishableKey()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4 text-sm text-slate-400">
        Clerk is not configured for this deployment.
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </main>
  );
}
