import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const REF_ROOT = path.join(process.cwd(), "reference", "pricing-models");

function resolveSafePath(filePath: string): string | null {
  const normalized = path.normalize(path.join(process.cwd(), filePath));
  if (!normalized.startsWith(REF_ROOT)) return null;
  return normalized;
}

export async function GET(request: Request) {
  const filePath = new URL(request.url).searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const resolved = resolveSafePath(filePath);
  if (!resolved) {
    return NextResponse.json({ error: "invalid path" }, { status: 403 });
  }

  try {
    const content = await readFile(resolved, "utf-8");
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }
}
