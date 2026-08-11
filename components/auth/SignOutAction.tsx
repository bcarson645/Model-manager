"use client";

import { SignOutButton } from "@clerk/nextjs";

export function SignOutAction() {
  return (
    <SignOutButton redirectUrl="/sign-in">
      <button
        type="button"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Sign out
      </button>
    </SignOutButton>
  );
}
