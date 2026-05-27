/**
 * Direct fetch helpers for endpoints that don't go through orval's React Query
 * client cleanly.
 *
 * Every read helper has a mock fallback (see `./mock-data.ts`):
 *   - If EXPO_PUBLIC_USE_MOCK=true is set, the mock is returned without a
 *     network round-trip.
 *   - Otherwise, the real API is tried first; on any failure (no server, no
 *     DATABASE_URL, 5xx) we fall back to mock data so the UI stays populated.
 *
 * Writes (buildPlan, bookAll, swapItem, cancelItem) never fall back — they're
 * real intent. If they fail, the caller surfaces the error.
 */

import { devHeaders, getApiBaseUrl } from "./api";
import {
  MOCK_ALTERNATES,
  MOCK_PASSES,
  MOCK_PASS_DETAIL,
  USE_MOCK,
} from "./mock-data";

export interface BuildPlanInput {
  prompt: string;
  preferences?: {
    pace?: string;
    budget?: string;
    mornings?: string;
    diet?: string;
    interests?: string[];
  };
  travelers?: number;
  dates?: { start: string; end: string };
  budgetUsd?: number;
}

export interface BuildPlanAccepted {
  passId: string;
  buildId: string;
}

export async function buildPlan(input: BuildPlanInput): Promise<BuildPlanAccepted> {
  if (USE_MOCK) {
    // Mock build: return the live Japan pass id so polling lands on populated data.
    return { passId: "11111111-1111-4111-8111-111111111111", buildId: "mock-build" };
  }
  const res = await fetch(`${getApiBaseUrl()}/api/planner/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...devHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`buildPlan failed (${res.status}): ${text}`);
  }
  return (await res.json()) as BuildPlanAccepted;
}

export async function fetchPlan(passId: string): Promise<{
  pass: { id: string; aiBuiltAt: string | null; title: string; state: string; totalCost: string };
  items: Array<{
    id: string;
    kind: string;
    state: string;
    title: string;
    subtitle: string;
    code: string | null;
    cost: string | null;
    sortAt: string;
    data: Record<string, unknown>;
  }>;
  members: Array<{ userId: string; role: string }>;
}> {
  const mock = MOCK_PASS_DETAIL[passId];
  if (USE_MOCK && mock) return mock as never;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/planner/${passId}`, {
      headers: devHeaders(),
    });
    if (!res.ok) throw new Error(`fetchPlan failed (${res.status})`);
    return await res.json();
  } catch (err) {
    if (mock) return mock as never;
    throw err;
  }
}

export async function bookAll(passId: string): Promise<void> {
  if (USE_MOCK) return;
  const res = await fetch(`${getApiBaseUrl()}/api/planner/${passId}/book-all`, {
    method: "POST",
    headers: devHeaders(),
    redirect: "follow",
  });
  if (!res.ok && res.status !== 303) {
    throw new Error(`bookAll failed (${res.status})`);
  }
}

export async function fetchAlternates(itemId: string): Promise<
  Array<{
    id: string;
    rank: number;
    data: Record<string, unknown>;
    tags: string[];
    deltaCost: string | null;
    deltaMinutes: number | null;
    score: number | null;
  }>
> {
  const mock = MOCK_ALTERNATES[itemId] ?? MOCK_ALTERNATES["i-jp-flight-out"]!;
  if (USE_MOCK) return mock as never;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/items/${itemId}/alternates`, {
      headers: devHeaders(),
    });
    if (!res.ok) throw new Error(`fetchAlternates failed (${res.status})`);
    return await res.json();
  } catch {
    return mock as never;
  }
}

export async function swapItem(
  passId: string,
  itemId: string,
  alternateId: string,
): Promise<void> {
  if (USE_MOCK) return;
  const res = await fetch(
    `${getApiBaseUrl()}/api/planner/${passId}/items/${itemId}/swap`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...devHeaders() },
      body: JSON.stringify({ alternateId }),
      redirect: "manual",
    },
  );
  if (!res.ok && res.status !== 303) {
    throw new Error(`swapItem failed (${res.status})`);
  }
}

export async function cancelItem(passId: string, itemId: string): Promise<void> {
  if (USE_MOCK) return;
  const res = await fetch(
    `${getApiBaseUrl()}/api/planner/${passId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...devHeaders() },
      body: JSON.stringify({ state: "cancelled" }),
      redirect: "manual",
    },
  );
  if (!res.ok && res.status !== 303) {
    throw new Error(`cancelItem failed (${res.status})`);
  }
}

export async function fetchPasses(): Promise<{
  live: Array<unknown>;
  upcoming: Array<unknown>;
  drafts: Array<unknown>;
  archived: Array<unknown>;
}> {
  if (USE_MOCK) return MOCK_PASSES;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/passes`, {
      headers: devHeaders(),
    });
    if (!res.ok) throw new Error(`fetchPasses failed (${res.status})`);
    return await res.json();
  } catch {
    return MOCK_PASSES;
  }
}
