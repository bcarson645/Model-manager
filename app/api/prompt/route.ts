import { NextRequest, NextResponse } from "next/server";

type Field = { label: string; type: string };

function inferFields(prompt: string): Field[] {
  const lower = prompt.toLowerCase();

  if (lower.includes("table") || lower.includes("dashboard")) {
    return [
      { label: "Search", type: "text" },
      { label: "Status filter", type: "select" },
      { label: "Date range", type: "date" },
    ];
  }

  if (lower.includes("form") || lower.includes("register") || lower.includes("upload")) {
    return [
      { label: "Name", type: "text" },
      { label: "Version", type: "text" },
      { label: "Owner", type: "text" },
      { label: "Notes", type: "textarea" },
    ];
  }

  return [
    { label: "Primary input", type: "text" },
    { label: "Configuration", type: "select" },
    { label: "Actions", type: "button" },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const title = prompt.length > 60 ? `${prompt.slice(0, 57)}…` : prompt;

    return NextResponse.json({
      title,
      description:
        "Starter layout generated from your prompt. Connect an LLM or rules engine here to produce full UI.",
      fields: inferFields(prompt),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
