"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { INTERVIEW_QUESTION_BANK, type QuestionDifficulty } from "@/lib/interview-question-bank";

const CATEGORY_ALL = "All";

function difficultyStyles(d: QuestionDifficulty): string {
  if (d === "easy") return "border-emerald-800/60 bg-emerald-950/40 text-emerald-200";
  if (d === "hard") return "border-rose-800/60 bg-rose-950/35 text-rose-200";
  return "border-amber-800/60 bg-amber-950/35 text-amber-200";
}

export default function QuestionBankPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);

  const categories = useMemo(() => {
    const s = new Set(INTERVIEW_QUESTION_BANK.map((q) => q.category));
    return [CATEGORY_ALL, ...[...s].sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INTERVIEW_QUESTION_BANK.filter((item) => {
      if (category !== CATEGORY_ALL && item.category !== category) return false;
      if (!q) return true;
      const blob = `${item.title} ${item.prompt} ${item.tags.join(" ")} ${item.category}`.toLowerCase();
      return blob.includes(q);
    });
  }, [search, category]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Question bank</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-400">
        Curated prompts with instant rubrics and study outlines in{" "}
        <Link href="/mock-interview" className="text-indigo-400 hover:text-indigo-300">
          Mock interview
        </Link>
        . Optional AI commentary uses your server key—use it sparingly.
      </p>

      <input
        type="search"
        className="mt-6 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500"
        placeholder="Search title, prompt, tags, category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search questions"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                active
                  ? "rounded-full border border-indigo-500 bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-200"
                  : "rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-zinc-500"
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        {filtered.length} question{filtered.length === 1 ? "" : "s"}
        {search.trim() || category !== CATEGORY_ALL ? " (filtered)" : ""}
      </p>

      <ul className="mt-6 space-y-4">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-medium text-zinc-100">{item.title}</h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${difficultyStyles(item.difficulty)}`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{item.category}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{item.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/mock-interview?q=${encodeURIComponent(item.id)}`}
                className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-400"
              >
                Practice this
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-zinc-500">No questions match your filters. Try clearing search or category.</p>
      ) : null}
    </main>
  );
}
