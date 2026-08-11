import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { anyEmailMatchesAllowedDomain } from "./allowed-domain";

function userEmails(
  user: Awaited<ReturnType<typeof currentUser>>
): string[] {
  if (!user) return [];
  return user.emailAddresses.map((e) => e.emailAddress);
}

/** Pages / Server Components — redirects if signed out or wrong domain. */
export async function requireAllowedUser() {
  await auth.protect();
  const user = await currentUser();
  if (!anyEmailMatchesAllowedDomain(userEmails(user))) {
    redirect("/unauthorized");
  }
  return user!;
}

/** Route Handlers — returns a Response if denied, otherwise the user. */
export async function requireAllowedApiUser(): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof currentUser>>> }
  | { ok: false; response: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await currentUser();
  if (!anyEmailMatchesAllowedDomain(userEmails(user))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden — company email required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user: user! };
}
