"use client";

import "reactflow/dist/style.css";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "reactflow";
import { AiAvailabilityNote } from "@/components/ai-availability-note";
import { platformApiUrl } from "@/lib/api-base";
import type { CustomDesignOutline } from "@/lib/system-design-custom-outline";
import { OutlineVisualSummary } from "./outline-visuals";
import {
  DEFAULT_TOPIC_ID,
  SYSTEM_DESIGN_TOPICS,
  getTopicById,
  type SystemDesignTopic,
} from "./topics";

type TabId = "guide" | "whiteboard" | "hld" | "lld";

function SelfCheckPanel({ topic }: { topic: SystemDesignTopic }) {
  const [openAnswers, setOpenAnswers] = useState<Record<string, boolean>>({});

  const toggleAnswer = (id: string) => {
    setOpenAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Self-check</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Answer aloud or in notes first. Reveal sample answers to compare — same rhythm as a real interviewer follow-up.
      </p>
      <ul className="mt-4 space-y-5">
        {topic.selfChecks.map((item) => {
          const revealed = openAnswers[item.id];
          return (
            <li key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="font-medium text-zinc-200">{item.question}</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                onClick={() => toggleAnswer(item.id)}
              >
                {revealed ? "Hide sample answer" : "Show sample answer"}
              </button>
              {revealed ? (
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.answer}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function InterviewGuidePanel({ topic }: { topic: SystemDesignTopic }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Before you draw (clarify)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Strong candidates spend the first minutes scoping the problem. Treat this like questions you would ask the interviewer — not trivia, but
          requirements and scale.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-300">
          {topic.clarifications.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Typical round flow</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-zinc-300">
          {topic.interviewFlow.map((step) => (
            <li key={step} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Likely deep dives</h2>
        <p className="mt-2 text-sm text-zinc-400">After your HLD, interviewers often zoom into one or two of these — have a point of view ready.</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-300">
          {topic.commonDeepDives.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function HldPanel({ topic }: { topic: SystemDesignTopic }) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-zinc-300">{topic.hld.summary}</p>
      <div className="mt-6 space-y-6">
        {topic.hld.blocks.map((block) => (
          <section key={block.title}>
            <h3 className="text-base font-medium text-zinc-100">{block.title}</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-zinc-400">
              {block.bullets.map((b) => (
                <li key={b} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LldPanel({ topic }: { topic: SystemDesignTopic }) {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-zinc-300">{topic.lld.summary}</p>
      <section>
        <h3 className="text-base font-medium text-zinc-100">APIs & channels</h3>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Method</th>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {topic.lld.apis.map((row) => (
                <tr key={`${row.method}-${row.path}`}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-indigo-300">{row.method}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">{row.path}</td>
                  <td className="px-3 py-2">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3 className="text-base font-medium text-zinc-100">Core entities (sketch)</h3>
        <ul className="mt-3 space-y-4">
          {topic.lld.entities.map((ent) => (
            <li key={ent.name} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="font-medium text-zinc-200">{ent.name}</p>
              <p className="mt-2 font-mono text-xs text-zinc-500">{ent.fields.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-base font-medium text-zinc-100">Happy path (critical sequence)</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-zinc-300">
          {topic.lld.happyPath.map((step) => (
            <li key={step} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ImplementationSketchPanel({
  sketch,
}: {
  sketch: NonNullable<CustomDesignOutline["implementationSketch"]>;
}) {
  return (
    <div className="rounded-xl border border-violet-900/45 bg-violet-950/25 p-5">
      <h3 className="text-sm font-semibold text-violet-200">
        Implementation sketch — types, data structures & worked examples
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-violet-100/85">{sketch.summary}</p>
      <div className="mt-4 space-y-4">
        {sketch.blocks.map((block) => (
          <div key={block.title}>
            <h4 className="text-xs font-medium text-zinc-200">{block.title}</h4>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-4 text-xs text-zinc-400">
              {block.bullets.map((bullet, i) => (
                <li key={`${block.title}-${i}`} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomOutlineDisplay({ outline }: { outline: CustomDesignOutline }) {
  return (
    <div className="mt-5 space-y-8 border-t border-zinc-800 pt-6">
      <p className="text-xs text-zinc-500">
        Source:{" "}
        <span className="text-zinc-400">
          {outline.source === "ai" ? "AI-generated outline (tailored)" : "Free template + keyword hints"}
        </span>
      </p>
      {outline.userPrompt && outline.userPrompt !== outline.topicTitle ? (
        <p className="text-xs text-zinc-500">
          Your prompt: <span className="italic text-zinc-400">{outline.userPrompt}</span> · Focus:{" "}
          <span className="font-medium text-zinc-300">{outline.topicTitle}</span>
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          Focus: <span className="font-medium text-zinc-300">{outline.topicTitle}</span>
        </p>
      )}
      <OutlineVisualSummary outline={outline} />
      <InterviewGuidePanel
        topic={{
          id: "custom",
          label: outline.topicTitle,
          blurb: "",
          nodes: [],
          edges: [],
          clarifications: outline.clarifications,
          interviewFlow: outline.interviewFlow,
          commonDeepDives: outline.commonDeepDives,
          hld: outline.hld,
          lld: outline.lld,
          selfChecks: [],
        }}
      />
      {outline.implementationSketch ? (
        <ImplementationSketchPanel sketch={outline.implementationSketch} />
      ) : null}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <HldPanel
          topic={{
            id: "custom",
            label: outline.topicTitle,
            blurb: "",
            nodes: [],
            edges: [],
            clarifications: [],
            interviewFlow: [],
            commonDeepDives: [],
            hld: outline.hld,
            lld: outline.lld,
            selfChecks: [],
          }}
        />
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <LldPanel
          topic={{
            id: "custom",
            label: outline.topicTitle,
            blurb: "",
            nodes: [],
            edges: [],
            clarifications: [],
            interviewFlow: [],
            commonDeepDives: [],
            hld: outline.hld,
            lld: outline.lld,
            selfChecks: [],
          }}
        />
      </div>
    </div>
  );
}

function AskYourOwnTopicSection() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState<false | "template" | "ai">(false);
  const [outline, setOutline] = useState<CustomDesignOutline | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchOutline = async (useAi: boolean) => {
    const topic = text.trim();
    if (!topic) {
      setNotice("Type a design question first (e.g. “Design a cloud-backed Notepad”).");
      return;
    }
    setLoading(useAi ? "ai" : "template");
    setNotice(null);
    try {
      const res = await fetch(platformApiUrl("system-design/outline"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, useAi }),
      });
      const data = (await res.json()) as { outline?: CustomDesignOutline; notice?: string; message?: string };
      if (!res.ok) {
        setOutline(null);
        setNotice(data.message ?? "Request failed.");
        return;
      }
      if (data.outline) {
        setOutline(data.outline);
        setNotice(typeof data.notice === "string" ? data.notice : null);
      }
    } catch {
      setOutline(null);
      setNotice("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-indigo-900/40 bg-indigo-950/15 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Your own design question</h2>
      <div className="mt-3">
        <AiAvailabilityNote context="design" />
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        Ask anything you would solve in a design round — e.g. &quot;How would you design Notepad?&quot; You always get a{" "}
        <strong className="text-zinc-300">free</strong> structured outline (clarifications, flow, HLD, LLD). For editor /
        Notepad-style prompts we also add an <strong className="text-zinc-300">implementation sketch</strong> (types like
        caret offsets, buffer structures, and worked examples e.g. moving the cursor).{" "}
        <strong className="text-zinc-300">AI outline</strong> adds the same depth tailored to your exact wording. You also get{" "}
        <strong className="text-zinc-300">visual summaries</strong> (HLD flow, entity rail, implementation map when available).
      </p>
      <textarea
        className="mt-4 min-h-[88px] w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-600"
        placeholder='e.g. "Design a minimal Notepad with autosave and optional sharing"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading !== false}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={loading !== false}
          onClick={() => fetchOutline(false)}
        >
          {loading === "template" ? "Building…" : "Get free outline"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
          disabled={loading !== false}
          onClick={() => fetchOutline(true)}
        >
          {loading === "ai" ? "Calling AI…" : "AI outline (optional)"}
        </button>
      </div>
      {notice ? <p className="mt-3 text-sm text-amber-200/90">{notice}</p> : null}
      {outline ? <CustomOutlineDisplay outline={outline} /> : null}
    </section>
  );
}

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "guide", label: "Interview flow", hint: "Clarify → HLD → deep dives" },
  { id: "whiteboard", label: "Whiteboard", hint: "Boxes & arrows" },
  { id: "hld", label: "HLD", hint: "Subsystems & flow" },
  { id: "lld", label: "LLD", hint: "APIs, data, sequences" },
];

export default function SystemDesignPage() {
  const [topicId, setTopicId] = useState(DEFAULT_TOPIC_ID);
  const [tab, setTab] = useState<TabId>("guide");
  const topic = useMemo(() => getTopicById(topicId) ?? SYSTEM_DESIGN_TOPICS[0]!, [topicId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(topic.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(topic.edges as Edge[]);

  useEffect(() => {
    const next = getTopicById(topicId) ?? SYSTEM_DESIGN_TOPICS[0]!;
    setNodes(next.nodes as Node[]);
    setEdges(next.edges as Edge[]);
  }, [topicId, setNodes, setEdges]);

  const onTopicChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setTopicId(event.target.value);
    setTab("guide");
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">System design practice</h1>
      <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-400">
        <p>
          A real design round is not only a diagram. Interviewers expect you to move from{" "}
          <strong className="text-zinc-300">requirements</strong> → <strong className="text-zinc-300">HLD</strong> (major components and data flow) →{" "}
          <strong className="text-zinc-300">LLD</strong> (interfaces, schemas, critical sequences) → <strong className="text-zinc-300">trade-offs</strong>.
        </p>
        <p>
          <strong className="text-zinc-300">HLD</strong> answers &quot;what are the big boxes and how does data move between them?&quot;{" "}
          <strong className="text-zinc-300">LLD</strong> answers &quot;what would you actually build — APIs, tables, and step-by-step behavior for one path?&quot;
          Use the tabs below in order the first time; then jump around like you would in a live round.
        </p>
      </div>

      <AskYourOwnTopicSection />

      <h2 className="mt-12 text-xl font-semibold text-zinc-200">Curated scenarios</h2>
      <p className="mt-1 text-sm text-zinc-500">Fixed examples with whiteboard starter diagrams and self-checks.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-2 text-sm text-zinc-400">
          Scenario
          <select
            className="max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
            value={topicId}
            onChange={onTopicChange}
          >
            {SYSTEM_DESIGN_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-zinc-500">{topic.blurb}</p>
      </div>

      <div
        className="mt-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-3"
        role="tablist"
        aria-label="System design sections"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={
                selected
                  ? "rounded-lg bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white shadow-md ring-2 ring-indigo-300 ring-offset-2 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-indigo-200"
                  : "rounded-lg px-3 py-2 text-left text-sm text-zinc-400 ring-2 ring-transparent ring-offset-2 ring-offset-zinc-950 hover:bg-zinc-800/90 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-zinc-500"
              }
              onClick={() => setTab(t.id)}
            >
              <span className="block">{t.label}</span>
              <span
                className={
                  selected
                    ? "mt-0.5 block text-xs font-normal text-indigo-100/90"
                    : "mt-0.5 block text-xs font-normal text-zinc-500"
                }
              >
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-[120px]">
        {tab === "guide" ? (
          <div role="tabpanel">
            <InterviewGuidePanel topic={topic} />
          </div>
        ) : null}
        {tab === "whiteboard" ? (
          <div role="tabpanel" className="h-[520px] rounded-xl border border-zinc-700 bg-zinc-900">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        ) : null}
        {tab === "hld" ? (
          <div role="tabpanel" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <HldPanel topic={topic} />
          </div>
        ) : null}
        {tab === "lld" ? (
          <div role="tabpanel" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <LldPanel topic={topic} />
          </div>
        ) : null}
      </div>

      <SelfCheckPanel key={topic.id} topic={topic} />
    </main>
  );
}
