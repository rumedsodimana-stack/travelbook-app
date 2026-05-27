/**
 * Alternate generation.
 *
 * For an itinerary item produced by composeFromFixture, generate up to N
 * alternates from the same fixture pool — ranked by simple scoring (price
 * delta + tag overlap with budget preference).
 *
 * Returned shape matches lib/db `Alternate` row (without DB ids).
 */

import { randomUUID } from "node:crypto";

import { FIXTURES, type DestinationFixture } from "./fixtures";
import type {
  ActivityOffer,
  DiningOffer,
  FlightOffer,
  StayOffer,
} from "./fixtures/types";
import type { BuildItem } from "./build";

export type AlternateOffer = {
  id: string;
  itemId: string;
  rank: number;
  data: Record<string, unknown>;
  tags: string[];
  deltaCost: number; // signed
  deltaMinutes: number;
  score: number;
};

const TOP_N = 5;

export function generateAlternates(
  item: BuildItem,
  destinationKey: keyof typeof FIXTURES,
): AlternateOffer[] {
  const fixture = FIXTURES[destinationKey];
  switch (item.kind) {
    case "flight":
      return flightAlternates(item, fixture);
    case "stay":
      return stayAlternates(item, fixture);
    case "activity":
      return activityAlternates(item, fixture);
    case "dining":
      return diningAlternates(item, fixture);
    default:
      return [];
  }
}

function flightAlternates(
  item: BuildItem,
  fixture: DestinationFixture,
): AlternateOffer[] {
  const d = item.data as Record<string, string>;
  const isReturn = (item.tags ?? []).includes("RETURN");
  const candidates = fixture.flights.filter((f) =>
    isReturn ? f.from === d.depAirport : f.to === d.arrAirport,
  );
  const ranked = candidates
    .filter((f) => f.flightNo !== d.flightNo)
    .map((f, i) => mapFlightAlt(item, f, i + 2));
  return ranked.slice(0, TOP_N - 1);
}

function mapFlightAlt(
  item: BuildItem,
  f: FlightOffer,
  rank: number,
): AlternateOffer {
  const currentPrice = item.cost; // already x travelers
  const altPrice = f.priceUSD * Math.max(1, Math.round(currentPrice / (f.priceUSD || 1)));
  const baseDateIso = (item.data as { depTime: string }).depTime.slice(0, 10);
  const depISO = `${baseDateIso}T${f.depTimeLocal}:00`;
  const minutesDelta = minutesBetween(
    (item.data as { depTime: string }).depTime,
    depISO,
  );
  const tags: string[] = [...f.tags];
  if (altPrice < currentPrice) tags.push("CHEAPER");
  if (minutesDelta < 0) tags.push("EARLIER");
  if (minutesDelta > 60) tags.push("LATER");
  return {
    id: randomUUID(),
    itemId: item.id,
    rank,
    data: {
      carrier: f.carrier,
      flightNo: f.flightNo,
      depAirport: f.from,
      depTime: depISO,
      arrAirport: f.to,
      arrTime: shiftIso(depISO, f.durationMin),
      stops: f.stops,
      fare: f.fare,
      aircraft: f.aircraft,
      meals: f.meals,
      wifi: f.wifi,
    },
    tags: dedupe(tags),
    deltaCost: altPrice - currentPrice,
    deltaMinutes: minutesDelta,
    score: 0.9 - (rank - 2) * 0.1,
  };
}

function stayAlternates(
  item: BuildItem,
  fixture: DestinationFixture,
): AlternateOffer[] {
  const d = item.data as { checkIn: string; checkOut: string; guests: number };
  const nights = Math.round(
    (Date.parse(d.checkOut) - Date.parse(d.checkIn)) / (24 * 3600 * 1000),
  );
  const candidates = fixture.stays.filter((s) => s.name !== item.title);
  return candidates
    .map<AlternateOffer>((s, i) => {
      const altPrice = s.nightlyUSD * nights;
      const tags: string[] = [...s.tags];
      if (altPrice < item.cost) tags.push("CHEAPER");
      if (altPrice > item.cost) tags.push("LUXURY");
      return {
        id: randomUUID(),
        itemId: item.id,
        rank: i + 2,
        data: {
          name: s.name,
          address: s.address,
          checkIn: d.checkIn,
          checkOut: d.checkOut,
          guests: d.guests,
          view: s.view,
        },
        tags: dedupe(tags),
        deltaCost: altPrice - item.cost,
        deltaMinutes: 0,
        score: 0.85 - i * 0.08,
      };
    })
    .slice(0, TOP_N - 1);
}

function activityAlternates(
  item: BuildItem,
  fixture: DestinationFixture,
): AlternateOffer[] {
  const candidates = fixture.activities.filter((a) => a.name !== item.title);
  const tickets = (item.data as { tickets: number }).tickets;
  const dayDate = (item.data as { starts: string }).starts.slice(0, 10);
  return candidates
    .map<AlternateOffer>((a: ActivityOffer, i) => {
      const altCost = a.priceUSD * tickets;
      const startISO = `${dayDate}T${a.startsTimeLocal}:00`;
      const tags: string[] = [...a.tags];
      if (altCost < item.cost) tags.push("CHEAPER");
      return {
        id: randomUUID(),
        itemId: item.id,
        rank: i + 2,
        data: {
          name: a.name,
          venue: a.venue,
          starts: startISO,
          ends: shiftIso(startISO, a.durationMin),
          tickets,
        },
        tags: dedupe(tags),
        deltaCost: altCost - item.cost,
        deltaMinutes: minutesBetween(
          (item.data as { starts: string }).starts,
          startISO,
        ),
        score: 0.8 - i * 0.06,
      };
    })
    .slice(0, TOP_N - 1);
}

function diningAlternates(
  item: BuildItem,
  fixture: DestinationFixture,
): AlternateOffer[] {
  const candidates = fixture.dining.filter((d) => d.name !== item.title);
  const dayDate = (item.data as { starts: string }).starts.slice(0, 10);
  const tickets = (item.data as { tickets: number }).tickets;
  return candidates
    .map<AlternateOffer>((d: DiningOffer, i) => {
      const altCost = d.pricePerPersonUSD * tickets;
      const startISO = `${dayDate}T${d.startsTimeLocal}:00`;
      const tags: string[] = [...d.tags];
      if (altCost < item.cost) tags.push("CHEAPER");
      return {
        id: randomUUID(),
        itemId: item.id,
        rank: i + 2,
        data: {
          name: d.name,
          venue: d.venue,
          starts: startISO,
          ends: shiftIso(startISO, d.durationMin),
          tickets,
        },
        tags: dedupe(tags),
        deltaCost: altCost - item.cost,
        deltaMinutes: minutesBetween(
          (item.data as { starts: string }).starts,
          startISO,
        ),
        score: 0.75 - i * 0.06,
      };
    })
    .slice(0, TOP_N - 1);
}

function minutesBetween(aIso: string, bIso: string): number {
  return Math.round((Date.parse(bIso) - Date.parse(aIso)) / (60 * 1000));
}

function shiftIso(iso: string, plusMinutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + plusMinutes);
  return d.toISOString().replace(/\.\d{3}Z$/, "");
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
