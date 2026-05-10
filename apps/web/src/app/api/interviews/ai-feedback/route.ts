import { NextResponse } from "next/server";
import { getQuestionById } from "@/lib/interview-question-bank";
import { anyLlmProviderConfigured } from "@/lib/llm-keys";
import { llmChatCompletionsUnified } from "@/lib/llm-unified-chat";

export const runtime = "nodejs";

type AiPayload = {
  personalizedFeedback: string;
  followUpQuestion: string;
};

function parseAiJson(text: string): AiPayload | null {
  try {
    const v = JSON.parse(text) as unknown;
    if (v === null || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (typeof o.personalizedFeedback !== "string" || typeof o.followUpQuestion !== "string") return null;
    return { personalizedFeedback: o.personalizedFeedback, followUpQuestion: o.followUpQuestion };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!anyLlmProviderConfigured()) {
      return NextResponse.json(
        {
          error:
            "AI feedback is not configured. Add GEMINI_API_KEY (preferred) and/or GROQ_API_KEY to this repo’s .env or to ../wealth-saas/wealth-saas/.env. Instant rubric stays free without it.",
        },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }
    const b = body as { questionId?: unknown; answer?: unknown };
    const questionId = typeof b.questionId === "string" ? b.questionId : "";
    const answer = typeof b.answer === "string" ? b.answer : "";
    const q = getQuestionById(questionId);
    if (!q) {
      return NextResponse.json({ message: "Unknown questionId" }, { status: 400 });
    }
  if (!answer.trim()) {
    return NextResponse.json({ error: "Answer is empty", detail: "Add some text before requesting AI feedback." }, { status: 400 });
  }

    const system =
      "You are a concise technical interviewer coach. Reply as JSON only with keys personalizedFeedback (string, max ~120 words, 2 short paragraphs) and followUpQuestion (string, one sharp interview question). No markdown code fences.";

    const user = `Question title: ${q.title}\nPrompt: ${q.prompt}\nCandidate answer:\n${answer.slice(0, 6000)}`;

    let chat: Awaited<ReturnType<typeof llmChatCompletionsUnified>>;
    try {
      chat = await llmChatCompletionsUnified({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
        maxOutputTokens: 400,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      return NextResponse.json({ error: "Could not reach LLM provider", detail: msg }, { status: 502 });
    }

    if (!chat.ok) {
      return NextResponse.json({ error: "LLM request failed", detail: chat.reason }, { status: 502 });
    }

    const raw = chat.raw;

    let content: string | undefined;
    try {
      const data = JSON.parse(raw) as {
        choices?: { message?: { content?: string } }[];
      };
      content = data.choices?.[0]?.message?.content;
    } catch {
      return NextResponse.json({ error: "Bad response from model provider" }, { status: 502 });
    }
    if (!content) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    const parsed = parseAiJson(content);
    if (!parsed) {
      return NextResponse.json({ error: "Could not parse model JSON", raw: content.slice(0, 400) }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: "AI feedback handler failed", detail: message }, { status: 500 });
  }
}
