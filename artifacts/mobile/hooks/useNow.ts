import { useEffect, useState } from "react";

/**
 * Returns the current time, refreshed on an interval.
 *
 * Default: refresh every 60 seconds (good enough for "next-up" countdowns and
 * status badges; avoids re-rendering trees more than once per minute).
 *
 * Pass `intervalMs` to refresh faster if a screen needs second-level precision
 * (e.g. live boarding countdown). Don't go below 1000ms.
 */
export function useNow(intervalMs: number = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Format a duration (in milliseconds) as a short human-friendly string.
 *
 * Examples:
 *  - 1500000  → "25m"
 *  - 7200000  → "2h"
 *  - 90000000 → "1d 1h"
 *  - 0 / negative → "Now"
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "Now";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 && hours < 6 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

/**
 * Returns a card's lifecycle state relative to `now`:
 *  - "past"    — endTime (or startTime) < now
 *  - "active"  — now between startTime and endTime
 *  - "soon"    — startTime > now and within `soonWindowMs` (default 24h)
 *  - "future"  — startTime > now and beyond the soon window
 */
export function cardLifecycle(
  startTime: string,
  endTime: string | undefined,
  now: Date,
  soonWindowMs: number = 24 * 60 * 60_000,
): "past" | "active" | "soon" | "future" {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : start;
  const t = now.getTime();
  if (t > end) return "past";
  if (t >= start) return "active";
  if (start - t <= soonWindowMs) return "soon";
  return "future";
}
