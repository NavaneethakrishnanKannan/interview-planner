import { NextResponse } from "next/server";
import { evaluateQuestion } from "@/lib/interview-question-bank";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }
  const b = body as { answer?: unknown; questionId?: unknown };
  const answer = typeof b.answer === "string" ? b.answer : "";
  const questionId = typeof b.questionId === "string" ? b.questionId : "";
  return NextResponse.json(evaluateQuestion(answer, questionId));
}
