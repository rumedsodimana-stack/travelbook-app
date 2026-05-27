/**
 * AI build pipeline.
 *
 * Inputs: a free-text prompt + optional preferences + traveler count + window.
 * Steps:
 *   1. Resolve the destination (Claude Haiku intent parse — fallback regex).
 *   2. Select fixture items (flights, stays, activities, ...) ranked by prefs.
 *   3. Sequence the timeline (flights anchor → stay check-in → activities →
 *      return flight).
 *   4. Stream events as each item is "settled".
 *
 * Producer side of the SSE: yields async iterable of BuildEvents.
 * The Express SSE handler consumes the iterable and serializes to wire format.
 *
 * No-AI fallback: when ANTHROPIC_API_KEY is unset, intent parsing uses regex
 * over the fixture corpus and composition is deterministic. The user-visible
 * UX is identical (stream emits the same events); only the matching quality
 * is lower.
 */

import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";

import {
  FIXTURES,
  matchDestination,
  type DestinationFixture,
} from "./fixtures";
import type {
  ActivityOffer,
  DiningOffer,
  FlightOffer,
  InsuranceOffer,
  StayOffer,
  TransitOffer,
  VisaOffer,
} from "./fixtures/types";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export type BuildBriefInput = {
  prompt: string;
  preferences?: {
    pace?: "slow" | "steady" | "packed";
    budget?: "lean" | "mid" | "splurge";
    mornings?: "sleep_in" | "coffee" | "early";
    diet?: "any" | "pescatarian" | "vegetarian" | "vegan";
    interests?: string[];
  };
  travelers?: number;
  dates?: { start: string; end: string };
  budgetUsd?: number;
};

export type ResolvedBrief = {
  destinationKey: keyof typeof FIXTURES;
  startsOn: string; // YYYY-MM-DD
  endsOn: string;
  travelers: number;
  budgetUsd?: number;
  title: string;
};

export type BuildItem = {
  id: string; // local id (mapped to DB id by caller)
  kind:
    | "flight"
    | "stay"
    | "activity"
    | "transit"
    | "dining"
    | "insurance"
    | "visa";
  sortAt: string; // ISO timestamp
  title: string;
  subtitle: string;
  code?: string;
  cost: number; // USD
  data: Record<string, unknown>;
  tags?: string[];
};

export type BuildEvent =
  | { kind: "progress"; step: number; of: number; label: string; percent: number }
  | { kind: "item"; item: BuildItem }
  | { kind: "complete"; summary: { totalItems: number; totalCostUsd: number } }
  | { kind: "error"; message: string };

// ────────────────────────────────────────────── Intent parsing
export async function resolveBrief(input: BuildBriefInput): Promise<ResolvedBrief> {
  const today = new Date();
  const defaultStart = new Date(today.getTime() + 30 * DAY_MS);
  const defaultEnd = new Date(today.getTime() + 37 * DAY_MS);

  const startsOn =
    input.dates?.start ?? defaultStart.toISOString().slice(0, 10);
  const endsOn = input.dates?.end ?? defaultEnd.toISOString().slice(0, 10);

  // Try AI intent parse first; fall back to regex against fixture keys.
  let destinationKey = matchDestination(input.prompt);

  if (!destinationKey && anthropic) {
    try {
      const reply = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 200,
        system:
          "You are a travel intent parser. Read the user's prompt and return JSON " +
          `{"destination": "<one of: japan, bali, lisbon, iceland, nyc>"}. If none match, return {"destination": "japan"}. ` +
          "Respond with JSON only.",
        messages: [{ role: "user", content: input.prompt }],
      });
      const text = reply.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      const match = text.match(/"destination"\s*:\s*"([a-z]+)"/);
      const candidate = match?.[1];
      if (candidate && candidate in FIXTURES) {
        destinationKey = candidate as keyof typeof FIXTURES;
      }
    } catch {
      /* fall through to default */
    }
  }

  if (!destinationKey) destinationKey = "japan";

  const fixture = FIXTURES[destinationKey];
  const title = `${fixture.name}, ${daysBetween(startsOn, endsOn)} days`;

  return {
    destinationKey,
    startsOn,
    endsOn,
    travelers: input.travelers ?? 1,
    budgetUsd: input.budgetUsd,
    title,
  };
}

// ────────────────────────────────────────────── Selection
function rankByBudget<T extends { priceUSD?: number; nightlyUSD?: number; pricePerPersonUSD?: number; priceUSDPerDay?: number }>(
  items: T[],
  budget: BuildBriefInput["preferences"] extends infer P
    ? P extends { budget?: infer B }
      ? B
      : undefined
    : undefined,
): T[] {
  const priceOf = (i: T): number =>
    i.priceUSD ?? i.nightlyUSD ?? i.pricePerPersonUSD ?? i.priceUSDPerDay ?? 0;
  const sorted = [...items].sort((a, b) => priceOf(a) - priceOf(b));
  if (budget === "lean") return sorted;
  if (budget === "splurge") return sorted.reverse();
  // mid: middle third
  const start = Math.floor(sorted.length / 3);
  const end = Math.ceil((sorted.length * 2) / 3);
  return sorted.slice(start, end).concat(sorted.slice(0, start), sorted.slice(end));
}

function pickFirst<T>(items: T[]): T | null {
  return items[0] ?? null;
}

// ────────────────────────────────────────────── Composition
function combineLocalTime(date: string, hhmm: string): string {
  // Returns ISO with no zone offset — caller treats as local. Good enough for v1.
  const [h, m] = hhmm.split(":").map(Number);
  return `${date}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`;
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS));
}

function dayOffset(start: string, offsetDays: number): string {
  const d = new Date(start + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Produce the full ordered item list from a fixture + brief.
 * Deterministic; the AI is layered on top for ranking/composition variance.
 */
export function composeFromFixture(
  brief: ResolvedBrief,
  fixture: DestinationFixture,
): BuildItem[] {
  const items: BuildItem[] = [];
  const totalDays = daysBetween(brief.startsOn, brief.endsOn);
  const budget = brief.budgetUsd
    ? brief.budgetUsd < 2000
      ? ("lean" as const)
      : brief.budgetUsd > 6000
      ? ("splurge" as const)
      : ("mid" as const)
    : ("mid" as const);

  // 1. Visa
  const visa = pickFirst(fixture.visa);
  if (visa) {
    items.push({
      id: randomUUID(),
      kind: "visa",
      sortAt: combineLocalTime(brief.startsOn, "00:00"),
      title: `Visa · ${fixture.name}`,
      subtitle: visa.evisa ? "eVisa" : "Visa on arrival",
      code: visa.country,
      cost: visa.priceUSD,
      data: {
        country: visa.country,
        type: visa.type,
        validityDays: visa.validityDays,
        evisa: visa.evisa,
      },
    });
  }

  // 2. Insurance
  const insurance = pickFirst(rankByBudget<InsuranceOffer>(fixture.insurance, budget));
  if (insurance) {
    items.push({
      id: randomUUID(),
      kind: "insurance",
      sortAt: combineLocalTime(brief.startsOn, "00:01"),
      title: `Insurance · ${insurance.carrier} ${insurance.tier}`,
      subtitle: insurance.coverage,
      cost: insurance.priceUSDPerDay * totalDays * brief.travelers,
      data: {
        carrier: insurance.carrier,
        tier: insurance.tier,
        coverage: insurance.coverage,
        starts: brief.startsOn,
        ends: brief.endsOn,
      },
    });
  }

  // 3. Outbound flight
  const outboundCandidates = fixture.flights.filter(
    (f) => fixture.airports.includes(f.to) && !fixture.airports.includes(f.from),
  );
  const outbound = pickFirst(rankByBudget<FlightOffer>(outboundCandidates, budget));
  if (outbound) {
    items.push(buildFlightItem(outbound, brief.startsOn, "outbound", brief.travelers));
  }

  // 4. Stay (one for now — multi-city is v2)
  const stay = pickFirst(rankByBudget<StayOffer>(fixture.stays, budget));
  if (stay) {
    items.push({
      id: randomUUID(),
      kind: "stay",
      sortAt: combineLocalTime(brief.startsOn, "15:00"),
      title: stay.name,
      subtitle: stay.address,
      code: stay.view,
      cost: stay.nightlyUSD * totalDays,
      data: {
        name: stay.name,
        address: stay.address,
        checkIn: combineLocalTime(brief.startsOn, "15:00"),
        checkOut: combineLocalTime(brief.endsOn, "11:00"),
        guests: brief.travelers,
        view: stay.view,
      },
    });
  }

  // 5. Daily activities — 1 per day (days 1..N-1), skip last day
  const acts = rankByBudget<ActivityOffer>(fixture.activities, budget);
  for (let day = 1; day < totalDays; day++) {
    const act = acts[(day - 1) % acts.length]!;
    const dayDate = dayOffset(brief.startsOn, day);
    items.push({
      id: randomUUID(),
      kind: "activity",
      sortAt: combineLocalTime(dayDate, act.startsTimeLocal),
      title: act.name,
      subtitle: act.venue,
      code: act.category.toUpperCase(),
      cost: act.priceUSD * brief.travelers,
      data: {
        name: act.name,
        venue: act.venue,
        starts: combineLocalTime(dayDate, act.startsTimeLocal),
        ends: combineLocalTime(
          dayDate,
          shiftHHmm(act.startsTimeLocal, act.durationMin),
        ),
        tickets: brief.travelers,
      },
      tags: act.tags,
    });
  }

  // 6. Dining anchors — 1 dinner on days 1, mid-trip, and last
  const dining = rankByBudget<DiningOffer>(fixture.dining, budget);
  const diningDays = [0, Math.floor(totalDays / 2), totalDays - 1];
  diningDays.forEach((d, i) => {
    const item = dining[i % dining.length]!;
    const dayDate = dayOffset(brief.startsOn, d);
    items.push({
      id: randomUUID(),
      kind: "dining",
      sortAt: combineLocalTime(dayDate, item.startsTimeLocal),
      title: item.name,
      subtitle: item.cuisine,
      cost: item.pricePerPersonUSD * brief.travelers,
      data: {
        name: item.name,
        venue: item.venue,
        starts: combineLocalTime(dayDate, item.startsTimeLocal),
        ends: combineLocalTime(
          dayDate,
          shiftHHmm(item.startsTimeLocal, item.durationMin),
        ),
        tickets: brief.travelers,
      },
      tags: item.tags,
    });
  });

  // 7. Return flight
  const returnCandidates = fixture.flights.filter(
    (f) => fixture.airports.includes(f.from) && !fixture.airports.includes(f.to),
  );
  const ret = pickFirst(rankByBudget<FlightOffer>(returnCandidates, budget));
  if (ret) {
    items.push(buildFlightItem(ret, brief.endsOn, "return", brief.travelers));
  }

  return items.sort((a, b) => Date.parse(a.sortAt) - Date.parse(b.sortAt));
}

function buildFlightItem(
  f: FlightOffer,
  date: string,
  leg: "outbound" | "return",
  travelers: number,
): BuildItem {
  return {
    id: randomUUID(),
    kind: "flight",
    sortAt: combineLocalTime(date, f.depTimeLocal),
    title: `${f.from} → ${f.to}`,
    subtitle: `${f.carrier} ${f.flightNo} · ${f.fare}`,
    code: `${f.carrier.slice(0, 2).toUpperCase()}${f.flightNo}`,
    cost: f.priceUSD * travelers,
    data: {
      carrier: f.carrier,
      flightNo: f.flightNo,
      depAirport: f.from,
      depTime: combineLocalTime(date, f.depTimeLocal),
      arrAirport: f.to,
      arrTime: combineLocalTime(
        date,
        shiftHHmm(f.depTimeLocal, f.durationMin),
      ),
      stops: f.stops,
      fare: f.fare,
      aircraft: f.aircraft,
      meals: f.meals,
      wifi: f.wifi,
    },
    tags: [...f.tags, leg === "return" ? "RETURN" : "OUTBOUND"],
  };
}

function shiftHHmm(hhmm: string, plusMinutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + plusMinutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(wrapped / 60);
  const nm = wrapped % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

// ────────────────────────────────────────────── Streaming
/**
 * Drive a build and yield SSE-ready events. The caller (Express SSE handler)
 * serializes each event to the wire.
 *
 * Cadence:
 *   1. progress: step 1 of 3 — Resolving brief
 *   2. progress: step 2 of 3 — Sourcing items
 *   3. for each item, emit `item` events (with brief jitter for UX feel)
 *   4. progress: step 3 of 3 — Sequencing timeline
 *   5. complete
 */
export async function* runBuild(
  input: BuildBriefInput,
): AsyncIterable<BuildEvent> {
  try {
    yield {
      kind: "progress",
      step: 1,
      of: 3,
      label: "Resolving brief…",
      percent: 10,
    };

    const brief = await resolveBrief(input);
    const fixture = FIXTURES[brief.destinationKey];

    yield {
      kind: "progress",
      step: 2,
      of: 3,
      label: "Sourcing flights, stays, activities…",
      percent: 35,
    };

    const items = composeFromFixture(brief, fixture);

    yield {
      kind: "progress",
      step: 3,
      of: 3,
      label: "Threading timeline…",
      percent: 75,
    };

    let totalCost = 0;
    for (const item of items) {
      totalCost += item.cost;
      yield { kind: "item", item };
      await new Promise((r) => setTimeout(r, 120)); // small UX jitter
    }

    yield {
      kind: "complete",
      summary: { totalItems: items.length, totalCostUsd: totalCost },
    };
  } catch (err) {
    yield {
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Convenience for non-streaming callers (tests, e2e). */
export async function buildAll(input: BuildBriefInput): Promise<{
  brief: ResolvedBrief;
  items: BuildItem[];
  totalCostUsd: number;
}> {
  const brief = await resolveBrief(input);
  const fixture = FIXTURES[brief.destinationKey];
  const items = composeFromFixture(brief, fixture);
  const totalCostUsd = items.reduce((acc, i) => acc + i.cost, 0);
  return { brief, items, totalCostUsd };
}
