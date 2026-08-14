"use client";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function AppClerkShell({
  publishableKey,
  children,
}: {
  publishableKey: string;
  children: React.ReactNode;
}) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <header className="flex items-center justify-end gap-3 border-b border-surface-border bg-surface-raised/50 px-4 py-2">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-surface hover:text-white"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              Sign up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
      </header>
      {children}
    </ClerkProvider>
  );
}
