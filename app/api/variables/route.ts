import { NextRequest, NextResponse } from "next/server";
import { requireAllowedApiUser } from "@/lib/auth/require-user";
import { variables } from "@/lib/sample-data";
import type { VariableScope } from "@/lib/types";

export async function GET(request: NextRequest) {
  const gate = await requireAllowedApiUser();
  if (!gate.ok) return gate.response;

  const scope = request.nextUrl.searchParams.get("scope") as VariableScope | null;
  const issuesOnly = request.nextUrl.searchParams.get("issues") === "true";

  let result = variables;

  if (scope) {
    result = result.filter((v) => v.scope === scope);
  }

  if (issuesOnly) {
    result = result.filter((v) => v.parity !== "matched");
  }

  return NextResponse.json({ variables: result });
}
