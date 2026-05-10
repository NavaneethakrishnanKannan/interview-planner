import { fetchErrorMessage } from "@/lib/fetch-error-message";
import { llmHttpRequest } from "@/lib/llm-https";
import "@/lib/llm-network-bootstrap";

export type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAiChatResult =
  | { ok: true; raw: string }
  | { ok: false; status: number; message: string };

function extractOpenAiError(raw: string): string {
  try {
    const j = JSON.parse(raw) as { error?: { message?: string } };
    return (j.error?.message ?? raw).slice(0, 600);
  } catch {
    return raw.slice(0, 400);
  }
}

/**
 * OpenAI-compatible Chat Completions (OpenAI, Groq, etc.).
 */
export async function openAiCompatibleChat(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  maxOutputTokens: number;
}): Promise<OpenAiChatResult> {
  const baseUrl = params.baseUrl.replace(/\/$/, "");
  const { apiKey, model, messages, temperature, response_format, maxOutputTokens } = params;

  const base: Record<string, unknown> = {
    model,
    messages,
  };
  if (temperature !== undefined) base.temperature = temperature;
  if (response_format) base.response_format = response_format;

  const limitVariants = [{ max_completion_tokens: maxOutputTokens }, { max_tokens: maxOutputTokens }] as const;

  for (let i = 0; i < limitVariants.length; i++) {
    let raw: string;
    let statusCode: number;
    try {
      const r = await llmHttpRequest({
        url: `${baseUrl}/chat/completions`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...base, ...limitVariants[i] }),
      });
      raw = r.text;
      statusCode = r.statusCode;
    } catch (e) {
      return { ok: false, status: 0, message: fetchErrorMessage(e) };
    }

    if (statusCode >= 200 && statusCode < 300) {
      return { ok: true, raw };
    }

    const msg = extractOpenAiError(raw);
    const retryable =
      statusCode === 400 &&
      i === 0 &&
      (/max_tokens|max_completion_tokens|Unsupported parameter|unsupported_parameter/i.test(msg) ||
        /max_tokens|max_completion_tokens/i.test(raw));

    if (retryable) {
      continue;
    }

    return { ok: false, status: statusCode, message: msg };
  }

  return { ok: false, status: 400, message: "Provider rejected both token limit formats." };
}

export async function openAiChatCompletions(params: {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  maxOutputTokens: number;
}): Promise<OpenAiChatResult> {
  return openAiCompatibleChat({
    baseUrl: "https://api.openai.com/v1",
    ...params,
  });
}
