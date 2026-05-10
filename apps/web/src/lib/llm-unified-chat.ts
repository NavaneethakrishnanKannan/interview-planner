import { geminiGenerateContent } from "@/lib/gemini-chat";
import {
  anyLlmProviderConfigured,
  getGeminiApiKey,
  getGroqApiKey,
  getOpenAiApiKey,
} from "@/lib/llm-keys";
import {
  type OpenAiChatMessage,
  openAiChatCompletions,
  openAiCompatibleChat,
} from "@/lib/openai-chat-completions";

export type LlmProvider = "gemini" | "groq" | "openai";

export type LlmUnifiedResult =
  | { ok: true; raw: string; provider: LlmProvider }
  | { ok: false; reason: string };

/**
 * Order: Gemini → Groq → OpenAI. First success wins.
 */
export async function llmChatCompletionsUnified(params: {
  messages: OpenAiChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  maxOutputTokens: number;
}): Promise<LlmUnifiedResult> {
  if (!anyLlmProviderConfigured()) {
    return {
      ok: false,
      reason:
        "No LLM keys found. Set GEMINI_API_KEY (preferred), GROQ_API_KEY, or OPENAI_API_KEY in env or in ../wealth-saas/wealth-saas/.env next to the monorepo.",
    };
  }

  const failures: string[] = [];

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    const g = await geminiGenerateContent({
      apiKey: geminiKey,
      model,
      messages: params.messages,
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
      jsonMode: params.response_format?.type === "json_object",
    });
    if (g.ok) return { ok: true, raw: g.raw, provider: "gemini" };
    failures.push(`Gemini (${g.status}): ${g.message}`);
  }

  const groqKey = getGroqApiKey();
  if (groqKey) {
    const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
    const r = await openAiCompatibleChat({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      model,
      messages: params.messages,
      temperature: params.temperature,
      response_format: params.response_format,
      maxOutputTokens: params.maxOutputTokens,
    });
    if (r.ok) return { ok: true, raw: r.raw, provider: "groq" };
    failures.push(`Groq (${r.status}): ${r.message}`);
  }

  const openaiKey = getOpenAiApiKey();
  if (openaiKey) {
    const model =
      process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gpt-4o-mini";
    const r = await openAiChatCompletions({
      apiKey: openaiKey,
      model,
      messages: params.messages,
      temperature: params.temperature,
      response_format: params.response_format,
      maxOutputTokens: params.maxOutputTokens,
    });
    if (r.ok) return { ok: true, raw: r.raw, provider: "openai" };
    failures.push(`OpenAI (${r.status}): ${r.message}`);
  }

  return {
    ok: false,
    reason: failures.length ? failures.join(" | ") : "All configured providers failed.",
  };
}
