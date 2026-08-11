import { NextResponse } from "next/server";
import { requireAllowedApiUser } from "@/lib/auth/require-user";
import { pricingModels } from "@/lib/pricing-models/registry";
import { sharedPricingArtifacts } from "@/lib/pricing-models/registry-shared";

export async function GET() {
  const gate = await requireAllowedApiUser();
  if (!gate.ok) return gate.response;
  return NextResponse.json({ pricingModels, sharedPricingArtifacts });
}