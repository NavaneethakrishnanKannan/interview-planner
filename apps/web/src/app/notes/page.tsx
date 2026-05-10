"use client";

import { useState } from "react";

export default function NotesPage() {
  const [value, setValue] = useState("Trade-off notes, assumptions, bottlenecks...");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Interview Notes</h1>
      <p className="mt-4 text-zinc-400">Autosave-ready markdown notes panel linked to interview sessions.</p>
      <textarea
        className="mt-4 h-96 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 font-mono"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </main>
  );
}
