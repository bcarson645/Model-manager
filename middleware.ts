import { clerkMiddleware } from "@clerk/nextjs/server";

const publicExact = new Set(["/unauthorized"]);
const publicPrefixes = ["/sign-in", "/sign-up"];

function isPublicPath(pathname: string): boolean {
  if (publicExact.has(pathname)) return true;
  return publicPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Internal tool: require sign-in for everything except Clerk pages.
 * Domain allowlist is enforced in pages/API via requireAllowedUser*.
 *
 * Next.js 14 → middleware.ts (proxy.ts is for Next.js 16+).
 */
export default clerkMiddleware(async (auth, req) => {
  if (isPublicPath(req.nextUrl.pathname)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
