import type { OpenAiChatMessage, OpenAiChatResult } from "@/lib/openai-chat-completions";
import { fetchErrorMessage } from "@/lib/fetch-error-message";
import { llmHttpRequest } from "@/lib/llm-https";
import "@/lib/llm-network-bootstrap";

function geminiErrorMessage(raw: string): string {
  try {
    const j = JSON.parse(raw) as { error?: { message?: string; status?: string } };
    return (j.error?.message ?? raw).slice(0, 600);
  } catch {
    return raw.slice(0, 400);
  }
}

/**
 * Gemini generateContent; normalizes response to OpenAI-style `{ choices: [{ message: { content } }] }` JSON string.
 */
export async function geminiGenerateContent(params: {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
  maxOutputTokens: number;
  jsonMode: boolean;
}): Promise<OpenAiChatResult> {
  const { apiKey, model, messages, temperature, maxOutputTokens, jsonMode } = params;

  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const user = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    temperature: temperature ?? 0.35,
    maxOutputTokens,
  };
  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: user }],
      },
    ],
    generationConfig,
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  let raw: string;
  let statusCode: number;
  try {
    const r = await llmHttpRequest({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    raw = r.text;
    statusCode = r.statusCode;
  } catch (e) {
    return { ok: false, status: 0, message: fetchErrorMessage(e) };
  }

  if (statusCode < 200 || statusCode >= 300) {
    return { ok: false, status: statusCode, message: geminiErrorMessage(raw) };
  }

  try {
    const data = JSON.parse(raw) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      return { ok: false, status: 502, message: "Empty Gemini candidates[0].content" };
    }
    const wrapped = JSON.stringify({
      choices: [{ message: { content: text } }],
    });
    return { ok: true, raw: wrapped };
  } catch {
    return { ok: false, status: 502, message: "Could not parse Gemini response JSON" };
  }
}
