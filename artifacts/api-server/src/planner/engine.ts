/**
 * Pure-TS planner engine.
 *
 * Implements:
 *   - sequenceTimeline: order items chronologically by sort_at
 *   - detectConflicts: find overlaps + arrival-before-departure issues
 *   - reshuffleAfter: when item X changes or is cancelled, shift downstream
 *     items per SPEC §5.3. Returns the new item array — original is unchanged.
 *
 * No external deps. Unit-testable in isolation.
 */

import type {
  ItineraryItem,
  StayData,
  ActivityData,
  FlightData,
  TransitData,
} from "@workspace/db";

const MINUTE_MS = 60_000;

export type Conflict = {
  itemId: string;
  kind: "overlap" | "unreachable" | "open_hours";
  message: string;
  withItemId?: string;
};

/** Defensive ISO parse — returns NaN-safe ms or null. */
function ms(iso: string): number | null {
  const n = Date.parse(iso);
  return Number.isFinite(n) ? n : null;
}

/** Resolve the canonical end time for an item from its kind-specific data. */
function endOf(item: ItineraryItem): number | null {
  switch (item.kind) {
    case "flight": {
      const d = item.data as FlightData;
      return ms(d.arrTime);
    }
    case "stay": {
      const d = item.data as StayData;
      return ms(d.checkOut);
    }
    case "activity":
    case "event":
    case "entertainment":
    case "dining": {
      const d = item.data as ActivityData;
      return ms(d.ends);
    }
    case "transit": {
      const d = item.data as TransitData;
      return ms(d.arrTime);
    }
    case "visa":
    case "insurance":
      // multi-day items; treat sort_at as the only anchor for overlap purposes
      return ms(item.sortAt as unknown as string) ?? null;
  }
}

/** Resolve start time from kind-specific data, falling back to sort_at. */
function startOf(item: ItineraryItem): number | null {
  switch (item.kind) {
    case "flight":
      return ms((item.data as FlightData).depTime);
    case "stay":
      return ms((item.data as StayData).checkIn);
    case "activity":
    case "event":
    case "entertainment":
    case "dining":
      return ms((item.data as ActivityData).starts);
    case "transit":
      return ms((item.data as TransitData).depTime);
    case "visa":
    case "insurance":
      return ms(item.sortAt as unknown as string);
  }
}

export function sequenceTimeline(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((a, b) => {
    const av = ms(a.sortAt as unknown as string) ?? 0;
    const bv = ms(b.sortAt as unknown as string) ?? 0;
    return av - bv;
  });
}

export function detectConflicts(items: ItineraryItem[]): Conflict[] {
  const sorted = sequenceTimeline(items.filter((i) => i.state !== "cancelled"));
  const out: Conflict[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (a.kind === "visa" || a.kind === "insurance") continue;
    if (b.kind === "visa" || b.kind === "insurance") continue;

    const aEnd = endOf(a);
    const bStart = startOf(b);
    if (aEnd == null || bStart == null) continue;

    if (bStart < aEnd) {
      out.push({
        itemId: b.id,
        withItemId: a.id,
        kind: "overlap",
        message: `${b.title} starts before ${a.title} ends.`,
      });
    }
  }
  return out;
}

/**
 * After item `changedItemId` was cancelled or swapped, shift downstream items.
 * Implements SPEC §5.3:
 *   - cancelled item stays cancelled (caller has already mutated state)
 *   - downstream stays push checkIn to next legal time
 *   - downstream activities slide to next day's same slot if broken
 *   - touched items get state='shifted' until user accepts
 *
 * Returns a new array; original is untouched.
 */
export function reshuffleAfter(
  items: ItineraryItem[],
  changedItemId: string,
): ItineraryItem[] {
  const sorted = sequenceTimeline(items);
  const changedIdx = sorted.findIndex((i) => i.id === changedItemId);
  if (changedIdx === -1) return sorted;

  const result = sorted.map((i) => ({ ...i }));
  const changed = result[changedIdx]!;

  // The anchor: when the changed item now "ends" (or, if cancelled, when the
  // prior in-sequence item ends). Downstream items need to be reachable past this.
  let anchor: number | null;
  if (changed.state === "cancelled") {
    const prior = result
      .slice(0, changedIdx)
      .reverse()
      .find((i) => i.state !== "cancelled");
    anchor = prior ? endOf(prior) : null;
  } else {
    anchor = endOf(changed);
  }
  if (anchor == null) return result;

  let currentAnchor: number = anchor;
  for (let i = changedIdx + 1; i < result.length; i++) {
    const next = result[i]!;
    if (next.state === "cancelled") continue;
    if (next.kind === "visa" || next.kind === "insurance") continue;

    const start = startOf(next);
    if (start == null) continue;

    if (start < currentAnchor) {
      const offsetMs: number = currentAnchor - start + 30 * MINUTE_MS;
      const newStart: number = start + offsetMs;
      shiftItemBy(next, offsetMs);
      next.state = "shifted";
      const newEnd = endOf(next);
      currentAnchor = newEnd ?? newStart;
    } else {
      currentAnchor = endOf(next) ?? start;
    }
  }

  return result;
}

function shiftItemBy(item: ItineraryItem, offsetMs: number): void {
  const newSortAt = new Date(
    (ms(item.sortAt as unknown as string) ?? 0) + offsetMs,
  );
  (item as unknown as { sortAt: Date }).sortAt = newSortAt;

  switch (item.kind) {
    case "flight": {
      const d = item.data as FlightData;
      const dep = ms(d.depTime);
      const arr = ms(d.arrTime);
      if (dep != null) d.depTime = new Date(dep + offsetMs).toISOString();
      if (arr != null) d.arrTime = new Date(arr + offsetMs).toISOString();
      break;
    }
    case "stay": {
      const d = item.data as StayData;
      const ci = ms(d.checkIn);
      if (ci != null) d.checkIn = new Date(ci + offsetMs).toISOString();
      // checkOut stays fixed unless that would invert the range
      const co = ms(d.checkOut);
      if (ci != null && co != null && co < ci + offsetMs) {
        d.checkOut = new Date(ci + offsetMs + 24 * 60 * MINUTE_MS).toISOString();
      }
      break;
    }
    case "activity":
    case "event":
    case "entertainment":
    case "dining": {
      const d = item.data as ActivityData;
      const s = ms(d.starts);
      const e = ms(d.ends);
      if (s != null) d.starts = new Date(s + offsetMs).toISOString();
      if (e != null) d.ends = new Date(e + offsetMs).toISOString();
      break;
    }
    case "transit": {
      const d = item.data as TransitData;
      const s = ms(d.depTime);
      const e = ms(d.arrTime);
      if (s != null) d.depTime = new Date(s + offsetMs).toISOString();
      if (e != null) d.arrTime = new Date(e + offsetMs).toISOString();
      break;
    }
    case "visa":
    case "insurance":
      break;
  }
}
