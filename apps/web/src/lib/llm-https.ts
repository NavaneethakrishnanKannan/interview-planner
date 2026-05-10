import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

function envTruthy(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Whether to skip TLS certificate verification for LLM provider HTTPS only.
 *
 * - **Development (`next dev`):** defaults to skip — corporate AV / SSL inspection often breaks Node’s CA store, and env vars are easy to miss.
 * - **Production (`next start`):** verify unless `LLM_INSECURE_TLS=1`.
 * - **Force strict TLS anywhere:** `LLM_STRICT_TLS=1`.
 *
 * Uses bracket access so Next is less likely to strip unknown env keys at compile time.
 */
export function llmTlsSkipVerification(): boolean {
  if (envTruthy("LLM_STRICT_TLS")) {
    return false;
  }
  const insecureFlag = envTruthy("LLM_INSECURE_TLS");
  const nodeEnv = process.env["NODE_ENV"];
  if (nodeEnv !== "production") {
    return true;
  }
  return insecureFlag;
}

/** @deprecated use llmTlsSkipVerification */
export function llmInsecureTlsEnabled(): boolean {
  return llmTlsSkipVerification();
}

/** HTTPS/HTTP request for LLM providers — relaxes TLS in dev per llmTlsSkipVerification(). */
export async function llmHttpRequest(params: {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body: string;
}): Promise<{ statusCode: number; text: string }> {
  const u = new URL(params.url);
  const isHttps = u.protocol === "https:";
  const bodyBuf = Buffer.from(params.body, "utf8");
  const headers = {
    ...params.headers,
    "Content-Length": String(bodyBuf.length),
  };

  const port = u.port ? Number(u.port) : isHttps ? 443 : 80;

  return new Promise((resolve, reject) => {
    const reqOpts: https.RequestOptions = {
      hostname: u.hostname,
      port,
      path: `${u.pathname}${u.search}`,
      method: params.method ?? "POST",
      headers,
    };

    if (isHttps && llmTlsSkipVerification()) {
      reqOpts.rejectUnauthorized = false;
    }

    const lib = isHttps ? https : http;
    const req = lib.request(reqOpts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          text: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}
