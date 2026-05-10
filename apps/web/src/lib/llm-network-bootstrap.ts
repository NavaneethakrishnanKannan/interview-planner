import dns from "node:dns";

/**
 * Node's fetch (undici) often fails when IPv6 is broken or misrouted (common on Windows).
 * Prefer A records before AAAA for outbound LLM calls.
 */
const force =
  process.platform === "win32" ||
  process.env.LLM_IPV4_FIRST === "1" ||
  /^true$/i.test(process.env.LLM_IPV4_FIRST ?? "");
if (force) {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    /* Node too old */
  }
}

export {};
