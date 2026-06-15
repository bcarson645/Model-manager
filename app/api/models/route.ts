import { NextResponse } from "next/server";
import { models } from "@/lib/sample-data";

export async function GET() {
  return NextResponse.json({ models });
}
