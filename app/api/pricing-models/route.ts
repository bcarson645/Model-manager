import { NextResponse } from "next/server";
import { pricingModels } from "@/lib/pricing-models/registry";
import { sharedPricingArtifacts } from "@/lib/pricing-models/registry-shared";

export async function GET() {
  return NextResponse.json({ pricingModels, sharedPricingArtifacts });
}