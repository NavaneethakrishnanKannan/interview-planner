export type QuestionDifficulty = "easy" | "medium" | "hard";

export type BankQuestion = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  interviewer: string;
  modelAnswer: string;
  keyTakeaways: string[];
  /** Terms that signal technical depth (lowercase matching). */
  depthKeywords: string[];
  /** Terms expected for a complete answer (lowercase matching). */
  completenessKeywords: string[];
};

export type MockInterviewResult = {
  questionId: string;
  interviewer: string;
  feedback: string;
  score: {
    technicalDepth: number;
    clarity: number;
    completeness: number;
  };
  modelAnswer: string;
  keyTakeaways: string[];
};

export const DEFAULT_QUESTION_ID = "react-rendering-perf";

export const INTERVIEW_QUESTION_BANK: BankQuestion[] = [
  {
    id: "react-rendering-perf",
    title: "React rendering performance",
    category: "React",
    difficulty: "medium",
    tags: ["fiber", "reconciliation", "profiling"],
    prompt: "Explain React rendering performance in production systems.",
    interviewer: "Can you explain how React handles rendering performance under heavy updates?",
    depthKeywords: ["reconcil", "fiber", "virtual dom", "batch", "concurrent", "memo", "profiler"],
    completenessKeywords: ["dom", "render", "state", "commit", "performance", "production"],
    modelAnswer:
      "React keeps a lightweight tree of your UI and reconciles it with the real DOM: when state changes, it computes the smallest set of mutations instead of rewriting the whole page. Under the hood, Fiber models units of work so rendering can be incremental and (with concurrent features) interruptible when something more urgent arrives. In production you still measure and shape work: batch updates (automatic in modern React), split bundles and lazy-load routes, stabilize props with memo/useMemo/useCallback where profiling shows wasted child renders, virtualize huge lists, and defer non-critical updates. Use the React Profiler and browser performance tools to verify—not every memo helps.",
    keyTakeaways: [
      "Reconciliation + Virtual DOM idea: fewer DOM operations than naive full rewrites.",
      "Fiber: schedulable units of work; ties into concurrent rendering and priorities.",
      "Render → commit: React applies DOM updates after it knows what changed.",
      "Production levers: code-splitting, lazy routes, list virtualization, intentional memoization after profiling.",
    ],
  },
  {
    id: "js-event-loop",
    title: "JavaScript event loop",
    category: "JavaScript",
    difficulty: "medium",
    tags: ["async", "promises", "tasks"],
    prompt: "Explain how the JavaScript event loop handles asynchronous work in the browser.",
    interviewer: "Walk me through what happens when you schedule a promise, a setTimeout, and a DOM click.",
    depthKeywords: ["microtask", "macrotask", "call stack", "queue", "promise", "event loop", "render"],
    completenessKeywords: ["async", "callback", "task", "browser", "single thread"],
    modelAnswer:
      "JavaScript runs your synchronous code on the call stack until it is empty. Async APIs (timers, network, promises) complete outside that stack and enqueue work: microtasks (promise jobs, queueMicrotask) run after the current task and before the next macrotask; macrotasks (setTimeout, I/O, user events) run one per turn. The browser may interleave rendering. Practically: never starve the main thread with long tasks; chunk work or move heavy CPU off-thread where possible.",
    keyTakeaways: [
      "One main thread for JS + layout in typical browsers; async completion queues callbacks.",
      "Microtasks drain before the next macrotask — promise chains can run before the next timer tick.",
      "Long synchronous work blocks paint and input; use scheduling and profiling.",
    ],
  },
  {
    id: "nextjs-data-fetching",
    title: "Next.js data fetching patterns",
    category: "Next.js",
    difficulty: "medium",
    tags: ["ssr", "rsc", "caching"],
    prompt: "When would you choose SSR, static generation, or client-side data fetching in Next.js?",
    interviewer: "How do you decide between server components, getStaticProps-style patterns, and useEffect fetching?",
    depthKeywords: ["server component", "cache", "static", "ssr", "streaming", "revalidate", "fetch"],
    completenessKeywords: ["seo", "latency", "personalization", "build", "runtime"],
    modelAnswer:
      "Pick based on freshness, personalization, and SEO. Static / cached server output is best for fast global delivery of content that changes rarely (use revalidate or on-demand revalidation). SSR (or dynamic server rendering) helps when every request needs fresh or user-specific HTML. Client fetching suits highly interactive dashboards where SEO is irrelevant and you can tolerate loading states. App Router: default server components reduce JS; mark client boundaries only where needed; use caching tags and revalidatePath/revalidateTag deliberately.",
    keyTakeaways: [
      "Static + revalidation optimizes for cost and TTFB when content can be slightly stale.",
      "SSR shines for auth-heavy or per-request data that must be in the first HTML.",
      "Client fetch adds flexibility but shifts loading UX and bundle cost to the browser.",
    ],
  },
  {
    id: "nodejs-streams-backpressure",
    title: "Node.js streams & backpressure",
    category: "Node.js",
    difficulty: "hard",
    tags: ["streams", "memory", "pipes"],
    prompt: "What is backpressure in Node.js streams and how do you handle it?",
    interviewer: "If a fast producer feeds a slow consumer, what breaks and how do streams help?",
    depthKeywords: ["backpressure", "highwatermark", "pipe", "readable", "writable", "drain"],
    completenessKeywords: ["buffer", "memory", "async", "chunk"],
    modelAnswer:
      "Backpressure is a signal that the consumer cannot keep up. In Node streams, a writable returns false from write when its buffer is full; the producer should pause (or await drain) instead of buffering unbounded data in memory. pipe() wires read→write and coordinates pause/resume. Without this, large files or sockets can blow heap. For HTTP, stream responses; tune highWaterMark only when you understand memory/latency trade-offs.",
    keyTakeaways: [
      "Unbounded buffering in userland arrays is a common outage mode for large payloads.",
      "Stream .write false + 'drain' event is the core backpressure contract.",
      "Prefer composing transforms with pipeline() for error propagation.",
    ],
  },
  {
    id: "nestjs-di",
    title: "NestJS dependency injection",
    category: "NestJS",
    difficulty: "easy",
    tags: ["di", "providers", "modules"],
    prompt: "How does dependency injection work in NestJS and why use scopes?",
    interviewer: "What is a provider, and when would you use request-scoped providers?",
    depthKeywords: ["provider", "injectable", "module", "singleton", "scope", "constructor"],
    completenessKeywords: ["ioc", "test", "instance"],
    modelAnswer:
      "Nest builds a dependency graph: classes decorated with @Injectable() are providers the container can construct and inject via constructor parameters. Modules declare providers and exports; imports wire graphs. Default scope is singleton (one instance per app). Request scope creates one instance per HTTP request — useful for per-request context (user, tenant) but costs performance; use sparingly. For testing, override providers with mocks in the module under test.",
    keyTakeaways: [
      "Constructor injection keeps dependencies explicit and testable.",
      "Singleton is the default; request scope trades isolation for overhead.",
      "Dynamic modules pattern configures third-party integrations cleanly.",
    ],
  },
  {
    id: "typescript-structural-typing",
    title: "TypeScript structural typing",
    category: "TypeScript",
    difficulty: "easy",
    tags: ["types", "interfaces", "generics"],
    prompt: "What is structural typing in TypeScript and how does it differ from nominal typing?",
    interviewer: "If two types have the same shape, are they compatible?",
    depthKeywords: ["structural", "compatible", "excess", "freshness", "generic", "narrow"],
    completenessKeywords: ["type", "interface", "assignable"],
    modelAnswer:
      "TypeScript uses structural (duck) typing: a value matches a type if it has the required members, regardless of declaration name. This differs from nominal systems where type identity is by name. Watch for excess property checks on object literals (freshness) and use discriminated unions for safer narrowing. Generics let you preserve relationships between inputs and outputs instead of erasing to any.",
    keyTakeaways: [
      "Shape matters more than the name of the interface.",
      "Excess property checks help catch typos on fresh object literals.",
      "Brands / symbols can simulate nominal typing when you truly need it.",
    ],
  },
  {
    id: "auth-session-jwt",
    title: "Sessions vs JWT",
    category: "Authentication",
    difficulty: "medium",
    tags: ["cookies", "oauth", "security"],
    prompt: "Compare cookie-based sessions with JWTs for web authentication. When would you pick each?",
    interviewer: "How do revocation and XSS/CSRF risks differ between the two?",
    depthKeywords: ["csrf", "xss", "http-only", "refresh", "revoke", "opaque", "bearer"],
    completenessKeywords: ["cookie", "token", "storage", "server"],
    modelAnswer:
      "Cookie sessions store an opaque session id server-side (or signed server state); browsers send cookies automatically; pair with SameSite, secure, httpOnly to mitigate CSRF/XSS. JWTs are self-contained; easy for mobile/API gateways but revocation and size are harder—often combine short-lived JWT + refresh or use server-side blocklists for sensitive apps. For SPAs, avoid localStorage for long-lived secrets; prefer httpOnly cookies when you control the web origin.",
    keyTakeaways: [
      "HttpOnly cookies keep tokens out of JS and reduce XSS blast radius for classic web.",
      "JWT simplifies horizontal scale but complicates instant revocation.",
      "Threat model (XSS vs CSRF vs mobile) should drive the choice—not hype.",
    ],
  },
  {
    id: "rate-limiting-strategies",
    title: "Rate limiting strategies",
    category: "System Design",
    difficulty: "medium",
    tags: ["redis", "api-gateway", "throttle"],
    prompt: "Describe common rate-limiting algorithms and where you might enforce them.",
    interviewer: "How would you protect an API from abuse while keeping legitimate burst traffic?",
    depthKeywords: ["token bucket", "leaky bucket", "sliding window", "redis", "gateway", "429"],
    completenessKeywords: ["quota", "abuse", "distributed", "user"],
    modelAnswer:
      "Common algorithms: fixed window (simple but can allow spikes at edges), sliding window log or counter (fairer), token bucket (allows controlled bursts). Enforce at the edge (API gateway, CDN/WAF) for cheap rejection, and optionally in-app for nuanced rules. Distributed counters need a shared store (e.g. Redis) and careful key design (per user, per IP, per API key). Return 429 with Retry-After; consider cost of synchronous Redis on hot paths.",
    keyTakeaways: [
      "Edge enforcement saves origin capacity; app-level adds business-aware rules.",
      "Token bucket shapes traffic better than naive fixed windows.",
      "Distributed limits need consistency and TTL strategy to avoid unbounded memory.",
    ],
  },
];

const byId = new Map(INTERVIEW_QUESTION_BANK.map((q) => [q.id, q]));

export function getQuestionById(id: string): BankQuestion | undefined {
  return byId.get(id);
}

export function evaluateQuestion(answer: string, questionId: string): MockInterviewResult {
  const q = getQuestionById(questionId) ?? getQuestionById(DEFAULT_QUESTION_ID)!;
  const lower = answer.toLowerCase().trim();

  let depthHits = 0;
  for (const kw of q.depthKeywords) {
    if (lower.includes(kw.toLowerCase())) depthHits++;
  }
  let technicalDepth = Math.min(10, 4 + depthHits + (answer.length > 120 ? 1 : 0));

  let compHits = 0;
  for (const kw of q.completenessKeywords) {
    if (lower.includes(kw.toLowerCase())) compHits++;
  }
  let completeness = Math.min(10, 4 + compHits + (answer.length > 80 ? 1 : 0));

  const clarity = Math.min(
    10,
    5 + (answer.length > 40 ? 1 : 0) + (answer.split(/\n/).filter((l) => l.trim()).length > 2 ? 1 : 0),
  );

  const missing = q.completenessKeywords.filter((kw) => !lower.includes(kw.toLowerCase()));
  let feedback: string;
  if (answer.trim().length < 20) {
    feedback = "Expand your answer with concrete terms and a short example. Right now it is too thin to assess fairly.";
  } else if (missing.length === 0) {
    feedback =
      "Nice coverage of the core ideas. Add a concrete production example or an explicit trade-off to make it interview-strong.";
  } else if (missing.length <= 2) {
    feedback = `Good start. Strengthen the answer by also addressing: ${missing.slice(0, 3).join(", ")}.`;
  } else {
    feedback = `Structure your answer around these themes: ${q.completenessKeywords.slice(0, 4).join(", ")}.`;
  }

  return {
    questionId: q.id,
    interviewer: q.interviewer,
    feedback,
    score: { technicalDepth, clarity, completeness },
    modelAnswer: q.modelAnswer,
    keyTakeaways: q.keyTakeaways,
  };
}

export function listQuestionsPublic(): Pick<BankQuestion, "id" | "title" | "category" | "difficulty" | "tags" | "prompt">[] {
  return INTERVIEW_QUESTION_BANK.map(({ id, title, category, difficulty, tags, prompt }) => ({
    id,
    title,
    category,
    difficulty,
    tags,
    prompt,
  }));
}
