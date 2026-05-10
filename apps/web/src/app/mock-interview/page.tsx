"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { platformApiUrl } from "@/lib/api-base";
import {
  DEFAULT_QUESTION_ID,
  INTERVIEW_QUESTION_BANK,
  evaluateQuestion,
  getQuestionById,
  type MockInterviewResult,
} from "@/lib/interview-question-bank";
import { AiAvailabilityNote } from "@/components/ai-availability-note";

type MockResponse = MockInterviewResult;

function isMockResponse(value: unknown): value is MockResponse {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.questionId !== "string") return false;
  if (typeof o.feedback !== "string" || o.score === null || typeof o.score !== "object") return false;
  if (typeof o.modelAnswer !== "string" || !Array.isArray(o.keyTakeaways)) return false;
  return (o.keyTakeaways as unknown[]).every((item) => typeof item === "string");
}

type AiResult = {
  personalizedFeedback: string;
  followUpQuestion: string;
};

function MockInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");

  const [questionId, setQuestionId] = useState(DEFAULT_QUESTION_ID);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MockResponse | null>(null);
  const [usedOfflineFallback, setUsedOfflineFallback] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (qParam && getQuestionById(qParam)) {
      setQuestionId(qParam);
    } else if (qParam && !getQuestionById(qParam)) {
      router.replace("/mock-interview", { scroll: false });
    }
  }, [qParam, router]);

  const currentQuestion = getQuestionById(questionId) ?? getQuestionById(DEFAULT_QUESTION_ID)!;

  const syncUrl = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("q", id);
      router.replace(`/mock-interview?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const onQuestionChange = (id: string) => {
    setQuestionId(id);
    setAnswer("");
    setResult(null);
    setUsedOfflineFallback(false);
    setShowModelAnswer(false);
    setAiResult(null);
    setAiError(null);
    syncUrl(id);
  };

  const applyOfflineFallback = () => {
    setUsedOfflineFallback(true);
    setResult(evaluateQuestion(answer, questionId));
    setShowModelAnswer(true);
  };

  const onInstantEvaluate = async () => {
    setLoading(true);
    setUsedOfflineFallback(false);
    setAiResult(null);
    setAiError(null);
    try {
      const response = await fetch(platformApiUrl("interviews/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });

      const raw = await response.text();
      let parsed: unknown;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        applyOfflineFallback();
        return;
      }

      if (response.ok && isMockResponse(parsed)) {
        setResult(parsed);
        setShowModelAnswer(true);
        return;
      }

      applyOfflineFallback();
    } catch {
      applyOfflineFallback();
    } finally {
      setLoading(false);
    }
  };

  const onAiFeedback = async () => {
    if (!answer.trim()) {
      setAiError("Add some answer text first. You can still use “Run instant rubric (free)” with the same draft.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch(platformApiUrl("interviews/ai-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      const raw = await response.text();
      let parsed: unknown;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        setAiError("Could not read AI response.");
        return;
      }
      if (!response.ok) {
        const o = parsed !== null && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
        const err = o && "error" in o ? String(o.error) : "Request failed";
        const detail = o && "detail" in o && o.detail != null ? String(o.detail) : "";
        setAiError(detail ? `${err}: ${detail}` : `${err}${raw ? ` — ${raw.slice(0, 200)}` : ""}`);
        return;
      }
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        typeof (parsed as AiResult).personalizedFeedback === "string" &&
        typeof (parsed as AiResult).followUpQuestion === "string"
      ) {
        setAiResult(parsed as AiResult);
        return;
      }
      setAiError("Unexpected AI response shape.");
    } catch {
      setAiError("Network error calling AI feedback.");
    } finally {
      setAiLoading(false);
    }
  };

  const score = result?.score;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold">AI Mock Interview</h1>
      <p className="mt-2 text-sm text-zinc-400">
        <strong className="text-zinc-300">Instant rubric</strong> is always free (keyword + length checks, scores, model answer, and study tips).{" "}
        <strong className="text-zinc-300">AI feedback</strong> is optional: your server may add short personalized commentary on the same answer when that feature is
        configured—otherwise the button will error until you add credentials locally.
      </p>
      <div className="mt-3">
        <AiAvailabilityNote context="mock" />
      </div>

      <label className="mt-6 block text-sm text-zinc-400">
        Question
        <select
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          value={questionId}
          onChange={(e) => onQuestionChange(e.target.value)}
          disabled={loading}
        >
          {INTERVIEW_QUESTION_BANK.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} · {q.category} ({q.difficulty})
            </option>
          ))}
        </select>
      </label>

      <p className="mt-4 text-zinc-300">{currentQuestion.prompt}</p>
      <textarea
        className="mt-4 h-48 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-100"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        disabled={loading}
        placeholder="Write your answer here…"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onInstantEvaluate}
          disabled={loading}
        >
          {loading ? "Scoring…" : "Run instant rubric (free)"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onAiFeedback}
          disabled={aiLoading}
        >
          {aiLoading ? "AI thinking…" : "AI personalized feedback (optional)"}
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Both actions work together: use <strong className="text-zinc-400">free rubric</strong> anytime for scores and study material; use{" "}
        <strong className="text-zinc-400">AI feedback</strong> when you want extra commentary on the same answer (needs non-empty text).
      </p>
      {!result ? (
        <p className="mt-3 text-sm text-zinc-500">
          Run the instant rubric for scores, tailored tips, and a study outline. Add AI feedback whenever you want deeper, custom commentary.
        </p>
      ) : null}

      {aiError ? (
        <section className="mt-6 rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-200">{aiError}</section>
      ) : null}

      {aiResult ? (
        <section className="mt-6 rounded-xl border border-violet-900/50 bg-violet-950/25 p-4 text-zinc-200">
          <h2 className="text-sm font-medium text-violet-200">AI personalized feedback</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{aiResult.personalizedFeedback}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-violet-300/80">Follow-up to practice</p>
          <p className="mt-1 text-sm text-zinc-300">{aiResult.followUpQuestion}</p>
        </section>
      ) : null}

      {usedOfflineFallback ? (
        <section className="mt-6 rounded-xl border border-amber-800/60 bg-amber-950/35 p-4 text-sm text-amber-100">
          The evaluate API did not return JSON (check <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_BASE_URL</code>).
          Showing the same rubric computed locally in your browser.
        </section>
      ) : null}

      {result?.interviewer ? (
        <p className="mt-6 text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">Interviewer focus: </span>
          {result.interviewer}
        </p>
      ) : null}

      {score ? (
        <ul className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-300">
          <li className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            Technical depth: <span className="font-semibold text-zinc-100">{score.technicalDepth}</span>/10
          </li>
          <li className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            Clarity: <span className="font-semibold text-zinc-100">{score.clarity}</span>/10
          </li>
          <li className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            Completeness: <span className="font-semibold text-zinc-100">{score.completeness}</span>/10
          </li>
        </ul>
      ) : null}

      {result ? (
        <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-300">
          <h2 className="text-sm font-medium text-zinc-400">Instant rubric feedback</h2>
          <p className="mt-2 whitespace-pre-wrap">{result.feedback}</p>
        </section>
      ) : null}

      {result ? (
        <section className="mt-6 rounded-xl border border-emerald-900/50 bg-emerald-950/25 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-emerald-200/90">Study: example strong answer</h2>
            <button
              type="button"
              className="text-left text-sm font-medium text-emerald-400 hover:text-emerald-300 sm:text-right"
              onClick={() => setShowModelAnswer((v) => !v)}
            >
              {showModelAnswer ? "Hide model answer" : "Show model answer"}
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-200/60">
            Compare with your draft—not for memorization. Terms and structure matter more than exact wording.
          </p>
          {showModelAnswer ? (
            <>
              <p className="mt-4 text-sm leading-relaxed text-zinc-200">{result.modelAnswer}</p>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-200/70">Key takeaways</h3>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-zinc-300">
                {result.keyTakeaways.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

export default function MockInterviewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-4xl px-6 py-10">
          <p className="text-zinc-400">Loading mock interview…</p>
        </main>
      }
    >
      <MockInterviewContent />
    </Suspense>
  );
}
