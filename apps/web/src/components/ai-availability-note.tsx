"use client";

import { useAiStatus } from "@/hooks/use-ai-status";

/**
 * Only surfaces when optional LLM features are unavailable — avoids listing vendors or env var names when things work.
 */
export function AiAvailabilityNote({ context }: { context: "mock" | "design" }) {
  const configured = useAiStatus();

  const freeHint =
    context === "mock"
      ? "Instant rubric, scores, and study outline still work with no setup."
      : "The free template outline and curated scenarios still work with no setup.";

  if (configured !== false) {
    return null;
  }

  return (
    <p
      className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs leading-relaxed text-zinc-400"
      role="status"
    >
      <span className="font-medium text-zinc-300">Optional AI isn’t enabled here.</span> {freeHint} To turn it on locally, add
      your provider credentials to the project <code className="rounded bg-zinc-800 px-1 text-zinc-300">.env</code> and restart
      the dev server.
    </p>
  );
}
