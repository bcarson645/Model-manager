/** Publishable key for ClerkProvider. Prefer the non-NEXT_PUBLIC name on Vercel so it is read at request time, not inlined empty at build. */
export function clerkPublishableKey(): string | undefined {
  return (
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    undefined
  );
}

export function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}
