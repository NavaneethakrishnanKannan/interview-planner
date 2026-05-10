/** Best-effort message from failed fetch (includes undici / TLS cause chain). */
export function fetchErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "fetch failed";
  const parts: string[] = [];
  let cur: unknown = err;
  let depth = 0;
  while (cur instanceof Error && depth < 5) {
    const m = cur.message?.trim();
    if (m) parts.push(m);
    cur = cur.cause;
    depth++;
  }
  const joined = parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(" — ");
  return joined || "fetch failed";
}
