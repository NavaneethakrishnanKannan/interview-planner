"use client";

import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import {
  detectLanguageFromSource,
  humanizeLanguage,
  isRunnableInBrowser,
  runJavaScriptInVm,
  transpileTypeScript,
  type PlaygroundLanguageId,
} from "@/lib/coding-playground-run";

const starterCode = `function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const d = debounce((x) => console.log("done", x), 200);
d("a");
d("b");
`;

const LANGUAGE_OPTIONS: { id: PlaygroundLanguageId; label: string }[] = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
];

export default function CodingPlaygroundPage() {
  const [code, setCode] = useState(starterCode);
  const [language, setLanguage] = useState<PlaygroundLanguageId>("typescript");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const detected = useMemo(() => detectLanguageFromSource(code), [code]);

  const detectionNotice = useMemo(() => {
    if (detected === "unknown") return null;
    if (detected === language) return null;
    return `This snippet looks like ${humanizeLanguage(detected)}, but the editor is set to ${humanizeLanguage(language)}. Pick the matching mode for syntax highlighting, or ignore if the guess is wrong.`;
  }, [detected, language]);

  const unsupportedNotice =
    !isRunnableInBrowser(language) &&
    `In-browser Run only supports JavaScript and TypeScript. ${humanizeLanguage(language)} needs a server sandbox (not available here yet).`;

  async function handleRun() {
    if (!isRunnableInBrowser(language)) {
      setOutput(
        `Cannot run ${humanizeLanguage(language)} in the browser.\n\nSupported for Run: JavaScript, TypeScript.\n\nFor C, C++, Java, Python, Go, and Rust you would add a secure compile/run service later.`
      );
      return;
    }

    setRunning(true);
    setOutput("");
    try {
      let source = code;
      if (language === "typescript") {
        source = await transpileTypeScript(code);
      }
      const result = runJavaScriptInVm(source);
      if (result.ok) setOutput(result.output);
      else setOutput(`Runtime error:\n${result.error}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOutput(`Compile/transpile error:\n${msg}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Coding Playground</h1>
      <p className="mt-4 text-zinc-300">
        Edit code with Monaco. <strong className="font-medium text-zinc-200">Run</strong> executes{" "}
        <span className="text-zinc-200">JavaScript</span> or{" "}
        <span className="text-zinc-200">TypeScript</span> in your browser (same security model as opening
        devtools — only run code you trust).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="whitespace-nowrap">Language</span>
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100"
            value={language}
            onChange={(e) => setLanguage(e.target.value as PlaygroundLanguageId)}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {running ? "Running…" : "Run"}
        </button>
      </div>

      {detectionNotice ? (
        <p className="mt-3 rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/90">
          {detectionNotice}
        </p>
      ) : null}

      {unsupportedNotice ? (
        <p className="mt-3 rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300">
          {unsupportedNotice}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-700">
        <Editor
          height="420px"
          language={language}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
        />
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-medium text-zinc-400">Output</h2>
        <pre className="mt-2 min-h-[120px] whitespace-pre-wrap rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-200">
          {output || "—"}
        </pre>
      </div>
    </main>
  );
}
