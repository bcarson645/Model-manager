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

/**
 * Internal tool: require sign-in for everything except Clerk pages.
 * Domain allowlist is enforced in pages/API via requireAllowedUser*.
 *
 * Next.js 14 → middleware.ts (proxy.ts is for Next.js 16+).
 * unauthenticatedUrl must be absolute — NextResponse.redirect("/sign-in")
 * throws on Edge and Vercel reports MIDDLEWARE_INVOCATION_FAILED.
 */
export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const publishableKey = clerkPublishableKey();
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!publishableKey || !secretKey) {
    return new NextResponse(
      "Clerk is not configured. Set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) in Vercel → Settings → Environment Variables, then redeploy.",
      {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }
    );
  }

  const signInUrl = new URL("/sign-in", req.url).href;
  const signUpUrl = new URL("/sign-up", req.url).href;

  const clerk = clerkMiddleware(
    async (auth, request) => {
      if (isPublicPath(request.nextUrl.pathname)) return;
      await auth.protect({ unauthenticatedUrl: signInUrl });
    },
    {
      publishableKey,
      secretKey,
      signInUrl,
      signUpUrl,
    }
  );

  try {
    return await clerk(req, event);
  } catch (err) {
    console.error("clerk middleware failed", err);
    return new NextResponse("Auth middleware failed. Check Vercel function logs.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
