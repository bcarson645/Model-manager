import { NextResponse } from "next/server";
import { comparisonFixtures } from "@/lib/sample-data";

export async function GET() {
  return NextResponse.json({ fixtures: comparisonFixtures });
}
