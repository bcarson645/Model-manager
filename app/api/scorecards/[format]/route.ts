import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ALLOWED = new Set(["odi", "t20"]);

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { format: string } }
) {
  const format = params.format;
  if (!ALLOWED.has(format)) {
    return NextResponse.json({ error: "Unknown format" }, { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "lib",
    `${format}-scorecards`,
    "matches.json"
  );

  try {
    const raw = await readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json([]);
  }
}
