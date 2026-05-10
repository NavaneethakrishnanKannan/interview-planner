import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

/**
 * Find monorepo root (folder that contains `apps/web`), whether `next dev` runs from
 * `apps/web`, repo root, or another subfolder — so root `.env` with OPENAI_API_KEY loads reliably.
 */
function getMonorepoRoot(): string {
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 10; i++) {
    const appsWeb = path.join(dir, "apps", "web");
    if (fs.existsSync(path.join(appsWeb, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const repoRoot = getMonorepoRoot();
const webDir = path.join(repoRoot, "apps", "web");

// Broad → specific so apps/web/.env.local can override repo .env (Next merges per directory).
loadEnvConfig(repoRoot);
if (fs.existsSync(webDir)) {
  loadEnvConfig(webDir);
}
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
