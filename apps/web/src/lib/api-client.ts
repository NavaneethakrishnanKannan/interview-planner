import { platformApiUrl } from "./api-base";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(platformApiUrl(path.replace(/^\//, "")), { cache: "no-store" });
  if (!response.ok) throw new Error(`API error (${response.status})`);
  return response.json() as Promise<T>;
}

export async function apiPost<T, U>(path: string, body: U): Promise<T> {
  const response = await fetch(platformApiUrl(path.replace(/^\//, "")), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API error (${response.status})`);
  return response.json() as Promise<T>;
}
