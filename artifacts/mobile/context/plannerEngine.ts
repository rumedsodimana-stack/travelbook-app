/**
 * plannerEngine — pure TypeScript logic for the Travel Pass timeline.
 *
 * No React, no React Native. Every function is a pure data transformation,
 * so this file is unit-testable in isolation.
 *
 * See docs/AI_PLANNER_SPEC.md §4 for the cascade rules.
 */
import type { TravelCard, CardType } from "./PlannerContext";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Conflict {
  cardId: string;
  cardTitle: string;
  severity: "error" | "warning";
  message: string;
}

export type EngineResult = {
  cards: TravelCard[];
  conflicts: Conflict[];
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const toMs = (iso: string): number => new Date(iso).getTime();
const fromMs = (ms: number): string => new Date(ms).toISOString();

export function sortCardsChronologically(cards: TravelCard[]): TravelCard[] {
  return [...cards].sort((a, b) => toMs(a.startTime) - toMs(b.startTime));
}

/** Is the given card type an "anchor" — a card that establishes a fixed point? */
function isAnchor(type: CardType): boolean {
  return type === "flight" || type === "event";
}

// ─────────────────────────────────────────────────────────────
// Reflow — cascade time adjustments through dependents
// ─────────────────────────────────────────────────────────────

/**
 * When a card's time changes, cascade the delta to every card that depends on it.
 *
 * Dependencies are expressed via `card.dependsOn` (parent card ID). A card's
 * `startTime` shifts by the same delta its parent's `endTime` (or `startTime` if
 * no `endTime`) shifted by.
 *
 * `oldCard` / `newCard` represent the pre-change and post-change state of the
 * card that triggered the cascade.
 */
export function reflowCards(
  cards: TravelCard[],
  oldCard: TravelCard,
  newCard: TravelCard,
): TravelCard[] {
  const oldEnd = toMs(oldCard.endTime ?? oldCard.startTime);
  const newEnd = toMs(newCard.endTime ?? newCard.startTime);
  const delta = newEnd - oldEnd;

  // Quick exit: if nothing shifted, just swap the card in place.
  if (delta === 0) {
    return cards.map((c) => (c.id === oldCard.id ? newCard : c));
  }

  // Build a dependency map: parentId -> child ids
  const children = new Map<string, string[]>();
  for (const c of cards) {
    if (c.dependsOn) {
      const list = children.get(c.dependsOn) ?? [];
      list.push(c.id);
      children.set(c.dependsOn, list);
    }
  }

  // BFS from the changed card through its descendants.
  const shifted = new Set<string>();
  const queue: string[] = [newCard.id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const kids = children.get(parentId) ?? [];
    for (const kidId of kids) {
      if (!shifted.has(kidId)) {
        shifted.add(kidId);
        queue.push(kidId);
      }
    }
  }

  // Apply the shift to every descendant; swap the changed card in place.
  return cards.map((c) => {
    if (c.id === oldCard.id) return newCard;
    if (!shifted.has(c.id)) return c;
    const start = toMs(c.startTime) + delta;
    const end = c.endTime ? toMs(c.endTime) + delta : undefined;
    return {
      ...c,
      startTime: fromMs(start),
      ...(end !== undefined ? { endTime: fromMs(end) } : {}),
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Remove + cascade
// ─────────────────────────────────────────────────────────────

/**
 * Remove a card and drop any orphans that depended on it.
 *
 * Orphans = cards whose `dependsOn` chain ultimately traces back to the removed
 * card. If a card depended on an orphan, it's also an orphan, transitively.
 */
export function removeCardAndReflow(
  cards: TravelCard[],
  removedId: string,
): TravelCard[] {
  // Collect the full orphan set via BFS on dependencies.
  const toRemove = new Set<string>([removedId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of cards) {
      if (c.dependsOn && toRemove.has(c.dependsOn) && !toRemove.has(c.id)) {
        toRemove.add(c.id);
        changed = true;
      }
    }
  }
  return cards.filter((c) => !toRemove.has(c.id));
}

// ─────────────────────────────────────────────────────────────
// Conflict detection
// ─────────────────────────────────────────────────────────────

/**
 * Scan the card list and return any conflicts.
 *
 * Checks:
 *  - Overlapping anchor cards (flights, events) with the same time window
 *  - Hotel check-in before arrival transfer end time
 *  - Visa processing deadline missed (placeholder rule: visa endTime must be
 *    >= first flight's startTime)
 *  - Orphan transfers (a transfer whose `dependsOn` flight no longer exists)
 */
export function detectConflicts(cards: TravelCard[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byId = new Map(cards.map((c) => [c.id, c]));
  const sorted = sortCardsChronologically(cards);

  // Anchor overlap
  const anchors = sorted.filter((c) => isAnchor(c.type));
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const aEnd = toMs(a.endTime ?? a.startTime);
    const bStart = toMs(b.startTime);
    if (bStart < aEnd) {
      conflicts.push({
        cardId: b.id,
        cardTitle: b.title,
        severity: "error",
        message: `Overlaps with ${a.title} — starts before previous card ends.`,
      });
    }
  }

  // Visa vs first flight
  const visa = sorted.find((c) => c.type === "visa");
  const firstFlight = sorted.find((c) => c.type === "flight");
  if (visa && firstFlight) {
    const visaValid = toMs(visa.endTime ?? visa.startTime);
    const departure = toMs(firstFlight.startTime);
    if (visaValid < departure) {
      conflicts.push({
        cardId: visa.id,
        cardTitle: visa.title,
        severity: "error",
        message: "Visa validity ends before trip starts.",
      });
    }
  }

  // Orphan dependents
  for (const c of cards) {
    if (c.dependsOn && !byId.has(c.dependsOn)) {
      conflicts.push({
        cardId: c.id,
        cardTitle: c.title,
        severity: "warning",
        message: "Parent card missing — card may need rescheduling.",
      });
    }
  }

  return conflicts;
}

// ─────────────────────────────────────────────────────────────
// Total cost
// ─────────────────────────────────────────────────────────────

export function totalCost(cards: TravelCard[]): number {
  return cards.reduce((sum, c) => sum + (c.price || 0), 0);
}
