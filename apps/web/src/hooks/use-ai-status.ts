"use client";

import { useEffect, useState } from "react";
import { platformApiUrl } from "@/lib/api-base";

/** Whether the server has Gemini, Groq, or OpenAI configured (never exposes keys). */
export function useAiStatus(): boolean | null {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(platformApiUrl("ai-status"))
      .then((r) => r.json())
      .then((d: unknown) => {
        if (cancelled || d === null || typeof d !== "object") return;
        const o = d as { llmConfigured?: unknown; openaiConfigured?: unknown };
        const v =
          typeof o.llmConfigured === "boolean"
            ? o.llmConfigured
            : typeof o.openaiConfigured === "boolean"
              ? o.openaiConfigured
              : false;
        setConfigured(v);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return configured;
}
