import { NextResponse } from "next/server";
import { DEFAULT_QUESTION_ID, evaluateQuestion } from "@/lib/interview-question-bank";

/** @deprecated Prefer POST /api/interviews/evaluate with { questionId, answer }. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const answer =
    typeof body === "object" && body !== null && "answer" in body && typeof (body as { answer: unknown }).answer === "string"
      ? (body as { answer: string }).answer
      : "";
  return NextResponse.json(evaluateQuestion(answer, DEFAULT_QUESTION_ID));
}
