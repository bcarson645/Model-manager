import { NextResponse } from "next/server";
import { requireAllowedApiUser } from "@/lib/auth/require-user";
import { models } from "@/lib/sample-data";

export async function GET() {
  const gate = await requireAllowedApiUser();
  if (!gate.ok) return gate.response;
  return NextResponse.json({ models });
}
