export type PlaygroundLanguageId =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "c"
  | "go"
  | "rust"
  | "plaintext";

export type DetectedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "c"
  | "go"
  | "rust"
  | "unknown";

const RUNNABLE = new Set<string>(["javascript", "typescript"]);

export function isRunnableInBrowser(lang: string): boolean {
  return RUNNABLE.has(lang);
}

/** Best-effort guess from source (for hints only). */
export function detectLanguageFromSource(code: string): DetectedLanguage {
  const t = code.trim();
  if (!t) return "unknown";
  if (/^\s*#include\s*[<"]/m.test(code)) {
    return /\bstd::|namespace\s+|template\s*</m.test(code) ? "cpp" : "c";
  }
  if (
    /\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\w*\s*\]\s*\)/m.test(code) ||
    /\bpublic\s+class\s+\w+/m.test(code)
  ) {
    return "java";
  }
  if (/^\s*fn\s+main\s*\(\s*\)/m.test(code) && /\blet\s+mut\s+/.test(code)) return "rust";
  if (/^\s*func\s+main\s*\(\s*\)/m.test(code)) return "go";
  if (/^\s*def\s+\w+\s*\(/m.test(code) || /^\s*from\s+[\w.]+\s+import/m.test(code)) return "python";
  if (
    /:\s*(?:number|string|boolean|void|unknown|any|never)\b/m.test(code) ||
    /\binterface\s+\w+\b/m.test(code) ||
    /\btype\s+\w+\s*=\s*(?:{|\(|\w+)/m.test(code) ||
    /\sas\s+const\b/m.test(code)
  ) {
    return "typescript";
  }
  if (/\b(function|const|let|var)\s+\w+|=>/.test(code)) return "javascript";
  return "unknown";
}

export function humanizeLanguage(id: DetectedLanguage | PlaygroundLanguageId | string): string {
  const m: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    go: "Go",
    rust: "Rust",
    unknown: "unknown",
    plaintext: "Plain text",
  };
  return m[id] ?? id;
}

export async function transpileTypeScript(source: string): Promise<string> {
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
    },
    reportDiagnostics: true,
  });
  return outputText;
}

export type RunResult = { ok: true; output: string } | { ok: false; error: string };

export function runJavaScriptInVm(source: string): RunResult {
  const lines: string[] = [];
  const append = (prefix: string, args: unknown[]) => {
    lines.push(
      prefix +
        args.map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }).join(" ")
    );
  };
  const fakeConsole = {
    log: (...a: unknown[]) => append("", a),
    info: (...a: unknown[]) => append("", a),
    warn: (...a: unknown[]) => append("[warn] ", a),
    error: (...a: unknown[]) => append("[error] ", a),
    debug: (...a: unknown[]) => append("[debug] ", a),
  };
  try {
    const runner = new Function(
      "console",
      `"use strict";
${source}`
    );
    runner(fakeConsole);
    return {
      ok: true,
      output: lines.join("\n") || "(no output — use console.log to print)",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
