import { NextResponse } from "next/server";
import {
  anyLlmProviderConfigured,
  getGeminiApiKey,
  getGroqApiKey,
  getOpenAiApiKey,
} from "@/lib/llm-keys";

export const runtime = "nodejs";

/** Public: which LLM keys exist (never exposes values). */
export async function GET() {
  try {
    const geminiConfigured = Boolean(getGeminiApiKey());
    const groqConfigured = Boolean(getGroqApiKey());
    const openaiConfigured = Boolean(getOpenAiApiKey());
    const llmConfigured = anyLlmProviderConfigured();
    return NextResponse.json({
      llmConfigured,
      geminiConfigured,
      groqConfigured,
      openaiConfigured,
    });
  } catch {
    return NextResponse.json(
      {
        llmConfigured: false,
        geminiConfigured: false,
        groqConfigured: false,
        openaiConfigured: false,
      },
      { status: 200 },
    );
  }
}
