/**
 * Runs Next with `node --use-system-ca` when the current Node build supports it (Node 22+).
 * Older Node exits with "bad option: --use-system-ca" — we fall back to plain `node` and rely on
 * LLM_INSECURE_TLS=1 for outbound LLM calls if TLS inspection breaks verification.
 */
const { spawn, spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const path = require("node:path");
const fs = require("node:fs");

/** Resolve `next` from apps/web (works with hoisted monorepo root `node_modules`). */
function resolveNextBin() {
  const webPkg = path.join(__dirname, "..", "..", "package.json");
  const req = createRequire(webPkg);
  const nextPkgDir = path.dirname(req.resolve("next/package.json"));
  const bin = path.join(nextPkgDir, "dist", "bin", "next");
  if (!fs.existsSync(bin)) {
    throw new Error(`Next CLI not found at ${bin} (is next installed?)`);
  }
  return bin;
}

const nextBin = resolveNextBin();
const forward = process.argv.slice(2);

if (forward.length === 0) {
  console.error("usage: run-next-with-system-ca.cjs <dev|start|...> [args]");
  process.exit(1);
}

const probe = spawnSync(process.execPath, ["--use-system-ca", "-e", "process.exit(0)"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const useSystemCa = probe.status === 0;

if (!useSystemCa) {
  console.warn(
    "[@apps/web] Node does not support --use-system-ca (need Node 22+ for OS trust store). " +
      "Using default TLS. If LLM requests fail certificate checks, set LLM_INSECURE_TLS=1 in .env for local dev only.",
  );
}

const nodeArgs = useSystemCa ? ["--use-system-ca", nextBin, ...forward] : [nextBin, ...forward];

const child = spawn(process.execPath, nodeArgs, { stdio: "inherit", shell: false });
child.on("exit", (code) => process.exit(code == null ? 1 : code));
