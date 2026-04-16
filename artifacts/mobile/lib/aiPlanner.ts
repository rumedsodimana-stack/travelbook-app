/**
 * Client adapter for the api-server /v1/plan LLM endpoint.
 *
 * In dev, `EXPO_PUBLIC_API_BASE` (or sane localhost defaults) points at the
 * api-server. In prod, the api-server URL ships with the app build.
 *
 * The adapter is FAILURE-TOLERANT: any error (network, server, no key) returns
 * `{ source: "fallback", suggestions: "" }` so the caller can keep going with
 * the scripted itinerary. The mobile UI never depends on the LLM being up.
 */
import type { PlannerPreferences } from "@/context/PlannerContext";

interface PlanResponse {
  source: "llm" | "fallback";
  suggestions: string;
  reason?: string;
  error?: string;
}

const DEFAULT_API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  (typeof globalThis.location !== "undefined"
    ? `${globalThis.location.protocol}//${globalThis.location.hostname}:3001`
    : "http://localhost:3001");

export async function fetchAiSuggestions(prefs: PlannerPreferences): Promise<PlanResponse> {
  try {
    const res = await fetch(`${DEFAULT_API_BASE}/v1/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(prefs),
      // 8s timeout — anything slower and we fall back, the user shouldn't wait.
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return { source: "fallback", suggestions: "", error: `HTTP ${res.status}` };
    }
    return (await res.json()) as PlanResponse;
  } catch (err) {
    return {
      source: "fallback",
      suggestions: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
