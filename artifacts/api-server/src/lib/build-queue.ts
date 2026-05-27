/**
 * In-memory build queue.
 *
 * POST /planner/build creates a Pass row + enqueues a build (passId → iterable).
 * GET /planner/{passId}/build-stream pops the iterable and streams it as SSE,
 * persisting items + alternates to DB as events arrive.
 *
 * Iterables are single-consumer. Late SSE subscribers get a 410 — they should
 * read the finished pass via GET /planner/{passId}.
 */

import type { BuildEvent } from "../planner/build";

interface QueuedBuild {
  passId: string;
  buildId: string;
  iterable: AsyncIterable<BuildEvent>;
  destinationKey: string;
  createdAt: number;
}

const queue = new Map<string, QueuedBuild>(); // keyed by passId

export function enqueue(item: QueuedBuild): void {
  queue.set(item.passId, item);
}

export function take(passId: string): QueuedBuild | null {
  const entry = queue.get(passId);
  if (!entry) return null;
  queue.delete(passId);
  return entry;
}

export function peek(passId: string): QueuedBuild | null {
  return queue.get(passId) ?? null;
}

// Garbage-collect old builds (>10 min).
setInterval(() => {
  const cutoff = Date.now() - 10 * 60_000;
  for (const [k, v] of queue.entries()) {
    if (v.createdAt < cutoff) queue.delete(k);
  }
}, 60_000).unref();
