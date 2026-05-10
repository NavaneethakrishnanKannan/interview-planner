import fs from "fs";
import path from "path";

function findMonorepoRoot(): string | null {
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "apps", "web", "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let mergedDiskEnv: Record<string, string> | undefined;

/**
 * Env merged from disk (later files override). Includes optional sibling
 * `../wealth-saas/wealth-saas/.env` next to the monorepo root (e.g. Dashboard layout).
 */
export function getMergedEnvFromDisk(): Record<string, string> {
  if (mergedDiskEnv) return mergedDiskEnv;
  const merged: Record<string, string> = {};
  const root = findMonorepoRoot();
  const files: string[] = [];
  if (root) {
    files.push(
      path.join(root, ".env"),
      path.join(root, ".env.local"),
      path.join(root, "apps", "web", ".env"),
      path.join(root, "apps", "web", ".env.local"),
      path.join(root, "..", "wealth-saas", "wealth-saas", ".env"),
      path.join(root, "..", "wealth-saas", "wealth-saas", ".env.local"),
    );
  }
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    try {
      const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
      Object.assign(merged, parseDotEnv(raw));
    } catch {
      /* ignore */
    }
  }
  mergedDiskEnv = merged;
  return merged;
}

function pick(name: string): string | undefined {
  const fromProc = process.env[name]?.trim();
  if (fromProc) return fromProc;
  return getMergedEnvFromDisk()[name]?.trim();
}

export function getGeminiApiKey(): string | undefined {
  return pick("GEMINI_API_KEY");
}

export function getGroqApiKey(): string | undefined {
  return pick("GROQ_API_KEY");
}

export function getOpenAiApiKey(): string | undefined {
  return pick("OPENAI_API_KEY") || pick("AI_API_KEY");
}

export function anyLlmProviderConfigured(): boolean {
  return Boolean(getGeminiApiKey() || getGroqApiKey() || getOpenAiApiKey());
}
