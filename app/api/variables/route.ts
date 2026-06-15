import { NextRequest, NextResponse } from "next/server";
import { variables } from "@/lib/sample-data";
import type { VariableScope } from "@/lib/types";

export async function GET(request: NextRequest) {
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
