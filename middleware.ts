import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkPublishableKey } from "@/lib/auth/clerk-keys";

const publicExact = new Set(["/unauthorized"]);
const publicPrefixes = ["/sign-in", "/sign-up"];

function isPublicPath(pathname: string): boolean {
  if (publicExact.has(pathname)) return true;
  return publicPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function clerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && clerkPublishableKey());
}

/**
 * Internal tool: require sign-in for everything except Clerk pages.
 * Domain allowlist is enforced in pages/API via requireAllowedUser*.
 *
 * Next.js 14 → middleware.ts (proxy.ts is for Next.js 16+).
 * Do not throw when Clerk env is missing: Vercel treats uncaught middleware
 * errors as MIDDLEWARE_INVOCATION_FAILED (CDN 500).
 */
const clerk = clerkMiddleware(
  async (auth, req) => {
    if (isPublicPath(req.nextUrl.pathname)) return;
    await auth.protect({ unauthenticatedUrl: "/sign-in" });
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  }
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured()) {
    return new NextResponse(
      "Clerk is not configured. Set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) in Vercel → Settings → Environment Variables, then redeploy.",
      {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }
    );
  }
  return clerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
