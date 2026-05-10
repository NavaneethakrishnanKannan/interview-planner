"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

const starterCode = `function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}`;

export default function CodingPlaygroundPage() {
  const [code, setCode] = useState(starterCode);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Coding Playground</h1>
      <p className="mt-4 text-zinc-300">Solve senior-level coding problems with JS/TS editor support.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-700">
        <Editor
          height="500px"
          defaultLanguage="typescript"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
        />
      </div>
    </main>
  );
}
