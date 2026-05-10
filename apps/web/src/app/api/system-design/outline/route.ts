import { NextResponse } from "next/server";
import { buildAiOutline, buildTemplateOutline } from "@/lib/system-design-custom-outline";
import { anyLlmProviderConfigured } from "@/lib/llm-keys";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }
    const b = body as { topic?: unknown; useAi?: unknown };
    const topic = typeof b.topic === "string" ? b.topic.trim() : "";
    const useAi = b.useAi === true;

    if (!topic) {
      return NextResponse.json({ message: "topic is required" }, { status: 400 });
    }
    if (topic.length > 2000) {
      return NextResponse.json({ message: "topic too long" }, { status: 400 });
    }

    const template = buildTemplateOutline(topic);

    if (!useAi) {
      return NextResponse.json({ outline: template });
    }

    if (!anyLlmProviderConfigured()) {
      return NextResponse.json({
        outline: template,
        notice:
          "Optional AI outline: no GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY was found. Add keys to this repo’s .env or to ../wealth-saas/wealth-saas/.env next to the monorepo (Gemini first, then Groq fallback), restart `npm run dev`, and try again — or keep using the free outline above.",
      });
    }

    try {
      const ai = await buildAiOutline(topic);
      if (ai.ok) {
        return NextResponse.json({ outline: ai.outline });
      }
      return NextResponse.json({
        outline: template,
        notice: `AI outline could not run: ${ai.reason}. You still have the free outline above.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        outline: template,
        notice: `AI outline error: ${msg}. Showing the free template outline.`,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ message: "Outline handler failed", detail: message }, { status: 500 });
  }
}
