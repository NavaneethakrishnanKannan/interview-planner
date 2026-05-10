import type { HldBlock, LldApi, LldEntity } from "@/app/system-design/topics";
import { llmChatCompletionsUnified } from "@/lib/llm-unified-chat";

/** Concrete structs, types, and mini worked examples (e.g. caret offsets). */
export type ImplementationSketchBlock = {
  title: string;
  bullets: string[];
};

export type ImplementationSketch = {
  summary: string;
  blocks: ImplementationSketchBlock[];
};

export type CustomDesignOutline = {
  topicTitle: string;
  /** Original prompt from the user (may be a full question). */
  userPrompt?: string;
  source: "template" | "ai";
  clarifications: string[];
  interviewFlow: string[];
  commonDeepDives: string[];
  hld: {
    summary: string;
    blocks: HldBlock[];
  };
  lld: {
    summary: string;
    apis: LldApi[];
    entities: LldEntity[];
    happyPath: string[];
  };
  /** Data structures, types, and examples — especially for editors, APIs, and stateful clients. */
  implementationSketch?: ImplementationSketch;
};

function lower(s: string): string {
  return s.toLowerCase();
}

function isEditorLikePrompt(l: string): boolean {
  return (
    l.includes("notepad") ||
    l.includes("editor") ||
    l.includes("notes") ||
    l.includes("document") ||
    l.includes("caret") ||
    (l.includes("cursor") &&
      (l.includes("position") || l.includes("offset") || l.includes("text") || l.includes("move"))) ||
    l.includes("text editor") ||
    l.includes("code editor")
  );
}

/** Rich LLD-style examples: types, structures, caret math — used for Notepad / editor prompts. */
function buildEditorImplementationSketch(topic: string): ImplementationSketch {
  return {
    summary: `How you’d nail LLD follow-ups for “${topic}”: name **types**, pick **structures** for buffer + caret, and walk a **tiny example** (e.g. moving the caret) so the interviewer sees you can implement, not only draw boxes.`,
    blocks: [
      {
        title: "Core types (client in-memory)",
        bullets: [
          "`DocumentBuffer`: plain `string` (JavaScript/TypeScript) for small docs; **rope**, **piece table**, or **gap buffer** when files can be large — each trades memory vs insert/delete cost.",
          "`CaretPosition`: usually `offset: number` = **0-based index into UTF-16 code units** in browsers (surrogate pairs = 2 units); alternative: `{ line: number, column: number }` plus a cached newline index or `Int32Array` of line starts.",
          "`Selection` (optional): `{ anchor: number, focus: number }`; ordered range for replace/delete.",
          "`Revision` / `version: number`: bump on each edit for OT/CRDT or optimistic UI conflict detection.",
        ],
      },
      {
        title: "Worked example: move caret from position 1 → 56",
        bullets: [
          "**Clarify indexing in the interview:** “Position 1” often means **first character** (1-based UI) → internal offset **0**. “56” might be 1-based column 56 → offset **55**, or **0-based offset 56** — state your convention.",
          "**If both are 0-based code-unit offsets:** `caret = clamp(56, 0, buffer.length)` after `setCaret(1)` you’d set `caret = 56` directly.",
          "**If 1-based user columns:** `internalOffset = userPos - 1`; move from 1→56 → `caret = 55` (still clamp).",
          "**If using line/column:** binary-search newline table for line L, `caret = lineStarts[L] + (col - 1)` (adjust for UTF-16 if you promise that in API).",
        ],
      },
      {
        title: "Edit operations (how you achieve insert/delete)",
        bullets: [
          "`insert(at, text)`: splice into string O(n) naive; rope/piece-table gives better asymptotics for huge buffers.",
          "`delete(range)` / `backspace`: remove code units at `[start, end)`, then fix caret: `caret = start`.",
          "Undo stack: store **inverse ops** `{ kind, at, text }` or snapshots with periodic checkpoints for memory.",
        ],
      },
      {
        title: "Optional: sync / cloud Notepad",
        bullets: [
          "Server stores blob + metadata; **ETag** or **version** on `GET`/`PATCH`; client sends **patch** (diff) or whole body under size cap.",
          "WebSocket or SSE for collaborative caret: broadcast `{ userId, offset }` throttled (e.g. 50ms).",
        ],
      },
    ],
  };
}

/**
 * Turn a natural-language prompt into a short product name for outline copy
 * (avoids "Who uses How would you design Notepad…").
 */
export function shortLabelForOutline(raw: string): string {
  let s = raw.trim().replace(/\?+$/g, "").replace(/\s+/g, " ");
  if (!s) return "this system";

  const patterns = [
    /^how would you design\s+/i,
    /^how do you design\s+/i,
    /^how would you build\s+/i,
    /^how do you build\s+/i,
    /^can you design\s+/i,
    /^design (me )?(a|an|the)?\s*/i,
    /^build (me )?(a|an|the)?\s*/i,
    /^implement (a|an|the)?\s*/i,
    /^i need (a|an|the)?\s*/i,
  ];
  for (const re of patterns) {
    const next = s.replace(re, "").trim();
    if (next !== s) s = next;
  }

  if (!s) return "this system";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Free outline: interview-style structure + light keyword hints. No API calls. */
export function buildTemplateOutline(raw: string): CustomDesignOutline {
  const prompt = raw.trim() || "your system";
  const topic = shortLabelForOutline(prompt);
  const l = lower(prompt);

  const clarifications: string[] = [
    `Who uses ${topic} and what is the primary job-to-be-done (read vs write vs share)?`,
    "Scale: how many users, documents, or sessions — peak vs average?",
    "Consistency: strong consistency everywhere, or can some reads be eventual?",
    "Offline or flaky networks in scope? Multi-device sync?",
    "Compliance: retention, encryption at rest, audit logs?",
  ];

  const interviewFlow: string[] = [
    `Clarify scope for “${topic}” and agree on 2–3 non-goals.`,
    "Back-of-envelope: storage, bandwidth, and hot paths.",
    "HLD: clients, API edge, core services, caches, storage, async work.",
    "LLD: 3–5 key APIs, main entities, one happy path end-to-end.",
    "Trade-offs: failure modes, migrations, and what you would load-test first.",
  ];

  const commonDeepDives: string[] = [
    "Idempotency and deduplication for writes.",
    "Pagination vs streaming for large payloads.",
    "Caching and invalidation; hot keys.",
    "Observability: metrics, traces, SLOs for core user journeys.",
  ];

  if (l.includes("notepad") || l.includes("editor") || l.includes("notes") || l.includes("document")) {
    clarifications.push("File size limits, rich text vs plain text, encoding (UTF-8), attachments?");
    clarifications.push("Auto-save interval vs explicit save; crash recovery expectations?");
    commonDeepDives.push("Large-file editing: chunking, memory mapping, or server-side diff.");
    commonDeepDives.push("Version history, undo stack, and storage cost.");
  }
  if (l.includes("collab") || l.includes("real-time") || l.includes("multiplayer") || l.includes("google doc")) {
    clarifications.push("Conflict resolution: last-write-wins, OT, or CRDT?");
    commonDeepDives.push("Operational transformation vs CRDT — latency and convergence.");
    commonDeepDives.push("Presence, cursors, and fan-out architecture.");
  }
  if (l.includes("offline") || l.includes("pwa")) {
    clarifications.push("Offline queue, sync on reconnect, conflict policy?");
    commonDeepDives.push("Local-first storage (IndexedDB) vs server source of truth.");
  }

  const hldBlocks: HldBlock[] = [
    {
      title: "Clients & experience",
      bullets: [
        `How users interact with ${topic}: web, mobile, desktop, or API-only.`,
        "Authentication and session/device binding if multi-device.",
      ],
    },
    {
      title: "Edge & API tier",
      bullets: [
        "TLS termination, rate limits, request validation, and routing to services.",
        "Optional BFF if mobile/web need different aggregation.",
      ],
    },
    {
      title: "Core services",
      bullets: [
        "Domain services that own business rules; keep them stateless behind a LB.",
        "Background workers for heavy work (thumbnails, indexing, email).",
      ],
    },
    {
      title: "Data & storage",
      bullets: [
        "System of record (SQL vs object store vs both) and what is cached.",
        "Backup, replication, and RPO/RTO in one sentence each.",
      ],
    },
  ];

  const apis: LldApi[] = [
    { method: "POST", path: "/v1/resources", purpose: `Create primary resource for ${topic}.` },
    { method: "GET", path: "/v1/resources/:id", purpose: "Fetch current state; support ETag / versioning if needed." },
    { method: "PATCH", path: "/v1/resources/:id", purpose: "Partial updates; idempotency key header." },
    { method: "GET", path: "/v1/resources/:id/events", purpose: "Optional: change feed or audit stream." },
  ];

  const entities: LldEntity[] = [
    {
      name: "Resource",
      fields: ["id", "owner_id", "title or name", "body or blob_ref", "version", "updated_at"],
    },
    {
      name: "User",
      fields: ["id", "email", "plan_tier", "created_at"],
    },
  ];

  const happyPath: string[] = [
    `Client authenticates; receives token or session for ${topic} operations.`,
    "Client creates or opens resource; server returns metadata + content URL or inline body.",
    "Edits applied via PATCH or WebSocket frames; server validates and persists.",
    "Async pipeline updates search index, notifications, or analytics.",
    "Reads served from DB or cache; cache invalidated on write with TTL or version checks.",
  ];

  return {
    topicTitle: topic,
    userPrompt: raw.trim() || undefined,
    source: "template",
    clarifications,
    interviewFlow,
    commonDeepDives,
    hld: {
      summary: `High-level map for “${topic}”: separate user-facing clients from edge APIs, stateless domain services, durable storage, and async workers. Adjust boxes once you lock requirements from clarifications.`,
      blocks: hldBlocks,
    },
    lld: {
      summary: `Sketch-level LLD for “${topic}”: concrete enough to discuss APIs and persistence; refine field names once you pick SQL vs blob storage and consistency rules.`,
      apis,
      entities,
      happyPath,
    },
    ...(isEditorLikePrompt(l) ? { implementationSketch: buildEditorImplementationSketch(topic) } : {}),
  };
}

type AiOutlineJson = {
  clarifications?: string[];
  interviewFlow?: string[];
  commonDeepDives?: string[];
  hld?: { summary?: string; blocks?: { title?: string; bullets?: string[] }[] };
  lld?: {
    summary?: string;
    apis?: { method?: string; path?: string; purpose?: string }[];
    entities?: { name?: string; fields?: string[] }[];
    happyPath?: string[];
  };
  implementationSketch?: {
    summary?: string;
    blocks?: { title?: string; bullets?: string[] }[];
  };
};

function normalizeImplementationSketch(userTopic: string, raw: AiOutlineJson): ImplementationSketch | undefined {
  const blocks: ImplementationSketchBlock[] = (raw.implementationSketch?.blocks ?? [])
    .filter((b) => typeof b.title === "string" && Array.isArray(b.bullets))
    .map((b) => ({
      title: b.title as string,
      bullets: (b.bullets as unknown[]).filter((x) => typeof x === "string") as string[],
    }));
  const summary =
    raw.implementationSketch?.summary?.trim() ||
    (blocks.length
      ? "Concrete data structures, field types, and step-by-step examples for this design."
      : "");
  if (summary && blocks.length) {
    return { summary, blocks };
  }
  if (isEditorLikePrompt(lower(userTopic))) {
    return buildEditorImplementationSketch(shortLabelForOutline(userTopic));
  }
  return undefined;
}

function normalizeAiOutline(topic: string, raw: AiOutlineJson): CustomDesignOutline {
  const fallback = buildTemplateOutline(topic);

  const blocks: HldBlock[] = (raw.hld?.blocks ?? [])
    .filter((b) => typeof b.title === "string" && Array.isArray(b.bullets))
    .map((b) => ({
      title: b.title as string,
      bullets: (b.bullets as unknown[]).filter((x) => typeof x === "string") as string[],
    }));

  const apis: LldApi[] = (raw.lld?.apis ?? [])
    .filter((a) => typeof a.method === "string" && typeof a.path === "string" && typeof a.purpose === "string")
    .map((a) => ({ method: a.method!, path: a.path!, purpose: a.purpose! }));

  const entities: LldEntity[] = (raw.lld?.entities ?? [])
    .filter((e) => typeof e.name === "string" && Array.isArray(e.fields))
    .map((e) => ({
      name: e.name as string,
      fields: (e.fields as unknown[]).filter((x) => typeof x === "string") as string[],
    }));

  const clarifications = (raw.clarifications ?? []).filter((x) => typeof x === "string");
  const interviewFlow = (raw.interviewFlow ?? []).filter((x) => typeof x === "string");
  const commonDeepDives = (raw.commonDeepDives ?? []).filter((x) => typeof x === "string");
  const happyPath = (raw.lld?.happyPath ?? []).filter((x) => typeof x === "string");

  const impl = normalizeImplementationSketch(topic, raw);

  return {
    topicTitle: shortLabelForOutline(topic),
    userPrompt: topic.trim() || undefined,
    source: "ai",
    clarifications: clarifications.length ? clarifications : fallback.clarifications,
    interviewFlow: interviewFlow.length ? interviewFlow : fallback.interviewFlow,
    commonDeepDives: commonDeepDives.length ? commonDeepDives : fallback.commonDeepDives,
    hld: {
      summary:
        typeof raw.hld?.summary === "string" && raw.hld.summary.trim() ? raw.hld.summary : fallback.hld.summary,
      blocks: blocks.length ? blocks : fallback.hld.blocks,
    },
    lld: {
      summary:
        typeof raw.lld?.summary === "string" && raw.lld.summary.trim() ? raw.lld.summary : fallback.lld.summary,
      apis: apis.length ? apis : fallback.lld.apis,
      entities: entities.length ? entities : fallback.lld.entities,
      happyPath: happyPath.length ? happyPath : fallback.lld.happyPath,
    },
    ...(impl ? { implementationSketch: impl } : {}),
  };
}

export type BuildAiOutlineResult =
  | { ok: true; outline: CustomDesignOutline }
  | { ok: false; reason: string };

export async function buildAiOutline(topic: string): Promise<BuildAiOutlineResult> {
  const system = `You are a senior system design interviewer coach. The user will name a system to design (e.g. "Notepad", "collaborative editor").
Return ONLY valid JSON with this shape:
{
  "clarifications": string[] (5-8 questions the candidate should ask the interviewer),
  "interviewFlow": string[] (5-7 steps for the round),
  "commonDeepDives": string[] (4-6 likely follow-up topics),
  "hld": { "summary": string (2-3 sentences), "blocks": [{ "title": string, "bullets": string[] }] (4-6 blocks, 2-4 bullets each) },
  "lld": {
    "summary": string (2 sentences),
    "apis": [{ "method": string, "path": string, "purpose": string }] (4-6 rows),
    "entities": [{ "name": string, "fields": string[] }] (2-4 entities, fields as short snake_case names),
    "happyPath": string[] (5-8 steps)
  },
  "implementationSketch": {
    "summary": string (1-2 sentences: why types + examples matter for THIS system),
    "blocks": [{ "title": string, "bullets": string[] }] (3-5 blocks)
  }
}
For "implementationSketch" you MUST include concrete LLD detail: real **data types** (e.g. structs, TypeScript-style fields), **data structures** when relevant (string vs rope, array of line starts), and at least one **worked mini-example** (e.g. for a text editor: moving caret from offset A to B, 0-based vs 1-based, UTF-16 in browsers). If the prompt mentions cursor/caret/positions, spell out the indexing convention and the update step. No markdown fences.`;

  const chat = await llmChatCompletionsUnified({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Design question: ${topic.slice(0, 500)}` },
    ],
    temperature: 0.35,
    response_format: { type: "json_object" },
    maxOutputTokens: 2200,
  });

  if (!chat.ok) {
    return { ok: false, reason: chat.reason };
  }

  try {
    const data = JSON.parse(chat.raw) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, reason: "Empty message content from the model." };
    }
    const parsed = JSON.parse(content) as AiOutlineJson;
    return { ok: true, outline: normalizeAiOutline(topic, parsed) };
  } catch {
    return { ok: false, reason: "Could not parse JSON from the model response." };
  }
}
