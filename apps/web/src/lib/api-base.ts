function trimTrailingSlash(s: string): string {
  return s.trim().replace(/\/$/, "");
}

/**
 * Paths served by Next.js Route Handlers (port 3000), not by Nest (4000).
 * When `NEXT_PUBLIC_API_BASE_URL` points at Nest, these must still use same-origin `/api/*`.
 */
const NEXT_ROUTE_HANDLER_PATHS = new Set([
  "ai-status",
  "interviews/evaluate",
  "interviews/ai-feedback",
  "system-design/outline",
]);

function isNextAppApiPath(normalizedPath: string): boolean {
  return NEXT_ROUTE_HANDLER_PATHS.has(normalizedPath);
}

/**
 * URL for JSON API calls from the browser.
 *
 * - **Default:** Next.js Route Handlers under `/api/*`.
 * - **Optional:** `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:4000/api`) sends most calls to Nest.
 *   Paths listed above always stay on the Next app so they are not 404 on the backend.
 */
export function platformApiUrl(pathAfterApiPrefix: string): string {
  const path = pathAfterApiPrefix.replace(/^\//, "");
  const external = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (external && !isNextAppApiPath(path)) {
    return `${trimTrailingSlash(external)}/${path}`;
  }
  return `/api/${path}`;
}
