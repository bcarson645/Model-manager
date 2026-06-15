import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  artifactSearchHaystack,
  matchesQuery,
  modelSearchHaystack,
} from "@/lib/pricing-models/lambda-catalog";
import { pricingModels } from "@/lib/pricing-models/registry";
import { sharedPricingArtifacts } from "@/lib/pricing-models/registry-shared";

const REF_ROOT = path.join(process.cwd(), "reference", "pricing-models");

async function readSource(filePath: string): Promise<string> {
  const resolved = path.normalize(path.join(process.cwd(), filePath));
  if (!resolved.startsWith(REF_ROOT)) return "";
  try {
    return await readFile(resolved, "utf-8");
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ modelIds: [], artifactIds: [], query: q });
  }

  const modelIds: string[] = [];
  for (const model of pricingModels) {
    if (matchesQuery(modelSearchHaystack(model), q)) {
      modelIds.push(model.id);
      continue;
    }
    const source = await readSource(model.filePath);
    if (matchesQuery(source, q)) {
      modelIds.push(model.id);
    }
  }

  const artifactIds: string[] = [];
  for (const artifact of sharedPricingArtifacts) {
    if (matchesQuery(artifactSearchHaystack(artifact), q)) {
      artifactIds.push(artifact.id);
      continue;
    }
    const source = await readSource(artifact.filePath);
    if (matchesQuery(source, q)) {
      artifactIds.push(artifact.id);
    }
  }

  return NextResponse.json({ modelIds, artifactIds, query: q });
}
