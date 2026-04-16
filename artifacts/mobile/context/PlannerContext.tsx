import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  reflowCards,
  removeCardAndReflow,
  detectConflicts,
  totalCost,
  type Conflict,
} from "./plannerEngine";
import { fetchAiSuggestions } from "@/lib/aiPlanner";

export type CardType =
  | "flight"
  | "hotel"
  | "activity"
  | "insurance"
  | "visa"
  | "dining"
  | "transport"
  | "event";

export type TripPurpose =
  | "leisure"
  | "business"
  | "honeymoon"
  | "family"
  | "wellness"
  | "bachelor"
  | "adventure"
  | "culture"
  | "celebration"
  | "other";

export interface TravelCard {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  provider: string;
  startTime: string;
  endTime?: string;
  location: string;
  price: number;
  currency: string;
  status: "confirmed" | "alternative" | "cancelled";
  details: Record<string, string>;
  alternatives?: TravelCard[];
  /** ID of the card this one's time depends on (used by plannerEngine for cascade reflow). */
  dependsOn?: string;
}

export interface TravelPass {
  id: string;
  title: string;
  destination: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  cards: TravelCard[];
  status: "active" | "upcoming" | "archived";
  isPublic: boolean;
  travelBuddyRequests: number;
  createdAt: string;
  totalCost: number;
  currency: string;
  /** Optional natural-language insights from the LLM (api-server /v1/plan). */
  aiNotes?: string;
  /** Source of the itinerary: "scripted" (default) or "llm-augmented". */
  aiSource?: "scripted" | "llm-augmented";
}

export interface PlannerPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: number;
  interests: string[];
  travelStyle: "budget" | "comfort" | "luxury";
  purpose: TripPurpose;
  description: string;
}

interface PlannerContextType {
  passes: TravelPass[];
  activePlan: TravelPass | null;
  plannerPrefs: PlannerPreferences | null;
  isGenerating: boolean;
  conflicts: Conflict[];
  setPlannerPrefs: (prefs: PlannerPreferences) => void;
  generateItinerary: (prefs: PlannerPreferences) => Promise<void>;
  updateCard: (passId: string, cardId: string, updates: Partial<TravelCard>) => void;
  removeCard: (passId: string, cardId: string) => void;
  bookAll: (passId: string) => void;
  sharePass: (passId: string) => void;
  archivePass: (passId: string) => void;
  addManualCard: (passId: string, card: Omit<TravelCard, "id" | "alternatives">) => void;
  createEmptyPlan: () => void;
  discardPlan: () => void;
  requestJoinTrip: (passId: string) => void;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

const MOCK_PASS_1: TravelPass = {
  id: "pass_1",
  title: "Japan Spring Adventure",
  destination: "Tokyo, Japan",
  startDate: "2026-04-05",
  endDate: "2026-04-17",
  status: "upcoming",
  isPublic: true,
  travelBuddyRequests: 3,
  createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  totalCost: 3240,
  currency: "USD",
  cards: [
    {
      id: "c1",
      type: "flight",
      title: "JFK → NRT",
      subtitle: "United Airlines UA837",
      provider: "United Airlines",
      startTime: "2026-04-05T14:00:00Z",
      endTime: "2026-04-06T17:30:00Z",
      location: "John F. Kennedy International Airport",
      price: 920,
      currency: "USD",
      status: "confirmed",
      details: { seat: "23A", class: "Economy", duration: "14h 30m", baggage: "23kg" },
      alternatives: [
        {
          id: "c1_alt1",
          type: "flight",
          title: "JFK → NRT",
          subtitle: "ANA NH010 · Non-stop",
          provider: "ANA",
          startTime: "2026-04-05T11:00:00Z",
          endTime: "2026-04-06T15:20:00Z",
          location: "John F. Kennedy International Airport",
          price: 1080,
          currency: "USD",
          status: "alternative",
          details: { seat: "14C", class: "Economy+", duration: "14h 20m", baggage: "23kg" },
        },
        {
          id: "c1_alt2",
          type: "flight",
          title: "JFK → NRT",
          subtitle: "JAL JL006 · Via Seattle",
          provider: "Japan Airlines",
          startTime: "2026-04-05T09:30:00Z",
          endTime: "2026-04-06T19:00:00Z",
          location: "John F. Kennedy International Airport",
          price: 860,
          currency: "USD",
          status: "alternative",
          details: { seat: "28B", class: "Economy", duration: "16h 30m", baggage: "23kg" },
        },
      ],
    },
    {
      id: "c2",
      type: "hotel",
      title: "The Tokyo Edition",
      subtitle: "Deluxe Room · Check-in Apr 6",
      provider: "The Tokyo Edition",
      startTime: "2026-04-06T15:00:00Z",
      endTime: "2026-04-12T11:00:00Z",
      location: "Toranomon, Tokyo",
      price: 1400,
      currency: "USD",
      status: "confirmed",
      details: { nights: "6 nights", roomType: "Deluxe Double", breakfast: "Included", wifi: "Free" },
      alternatives: [
        {
          id: "c2_alt1",
          type: "hotel",
          title: "Park Hyatt Tokyo",
          subtitle: "City View Room · Check-in Apr 6",
          provider: "Park Hyatt",
          startTime: "2026-04-06T15:00:00Z",
          endTime: "2026-04-12T11:00:00Z",
          location: "Shinjuku, Tokyo",
          price: 1850,
          currency: "USD",
          status: "alternative",
          details: { nights: "6 nights", roomType: "City View King", breakfast: "À la carte", wifi: "Free" },
        },
        {
          id: "c2_alt2",
          type: "hotel",
          title: "Citadines Shinjuku",
          subtitle: "Studio Apartment · Check-in Apr 6",
          provider: "Citadines",
          startTime: "2026-04-06T15:00:00Z",
          endTime: "2026-04-12T11:00:00Z",
          location: "Shinjuku, Tokyo",
          price: 680,
          currency: "USD",
          status: "alternative",
          details: { nights: "6 nights", roomType: "Studio", breakfast: "Not incl.", wifi: "Free" },
        },
      ],
    },
    {
      id: "c3",
      type: "activity",
      title: "Tsukiji Market Tour",
      subtitle: "Guided food experience · 8:00 AM",
      provider: "Tokyo Local Guides",
      startTime: "2026-04-07T08:00:00Z",
      endTime: "2026-04-07T12:00:00Z",
      location: "Tsukiji, Tokyo",
      price: 85,
      currency: "USD",
      status: "confirmed",
      details: { groupSize: "Max 8", includes: "Breakfast + tasting", language: "English" },
      alternatives: [
        {
          id: "c3_alt1",
          type: "activity",
          title: "Mt. Fuji Day Trip",
          subtitle: "Private car · Departs 7:00 AM",
          provider: "Fuji Explorer",
          startTime: "2026-04-07T07:00:00Z",
          endTime: "2026-04-07T18:00:00Z",
          location: "Mt. Fuji, Yamanashi",
          price: 145,
          currency: "USD",
          status: "alternative",
          details: { groupSize: "Private", includes: "Transport + guide", language: "English" },
        },
        {
          id: "c3_alt2",
          type: "activity",
          title: "Asakusa Temple Walk",
          subtitle: "Cultural tour · 9:00 AM",
          provider: "Culture Tokyo",
          startTime: "2026-04-07T09:00:00Z",
          endTime: "2026-04-07T13:00:00Z",
          location: "Asakusa, Tokyo",
          price: 45,
          currency: "USD",
          status: "alternative",
          details: { groupSize: "Max 12", includes: "Entry fees", language: "English" },
        },
      ],
    },
    {
      id: "c4",
      type: "insurance",
      title: "Travel Shield Premium",
      subtitle: "Comprehensive coverage · 13 days",
      provider: "WorldNomads",
      startTime: "2026-04-05T00:00:00Z",
      endTime: "2026-04-17T23:59:00Z",
      location: "Worldwide",
      price: 89,
      currency: "USD",
      status: "confirmed",
      details: { medical: "$500,000", cancellation: "Trip cost", luggage: "$2,500" },
      alternatives: [
        {
          id: "c4_alt1",
          type: "insurance",
          title: "SafeTrip Plus",
          subtitle: "Standard coverage · 13 days",
          provider: "SafeTrip",
          startTime: "2026-04-05T00:00:00Z",
          endTime: "2026-04-17T23:59:00Z",
          location: "Worldwide",
          price: 54,
          currency: "USD",
          status: "alternative",
          details: { medical: "$250,000", cancellation: "80% trip cost", luggage: "$1,500" },
        },
        {
          id: "c4_alt2",
          type: "insurance",
          title: "Allianz Global Elite",
          subtitle: "Premium coverage · 13 days",
          provider: "Allianz",
          startTime: "2026-04-05T00:00:00Z",
          endTime: "2026-04-17T23:59:00Z",
          location: "Worldwide",
          price: 139,
          currency: "USD",
          status: "alternative",
          details: { medical: "$1,000,000", cancellation: "Full trip cost", luggage: "$5,000" },
        },
      ],
    },
    {
      id: "c5",
      type: "visa",
      title: "Japan eVisa",
      subtitle: "Tourist visa · 30 days",
      provider: "TravelBook Visa Services",
      startTime: "2026-04-05T00:00:00Z",
      endTime: "2026-05-05T23:59:00Z",
      location: "Japan",
      price: 35,
      currency: "USD",
      status: "confirmed",
      details: { type: "Single entry", validity: "30 days", processing: "3-5 days" },
      alternatives: [
        {
          id: "c5_alt1",
          type: "visa",
          title: "Japan eVisa Express",
          subtitle: "Tourist visa · 30 days · Rush",
          provider: "TravelBook Visa Services",
          startTime: "2026-04-05T00:00:00Z",
          endTime: "2026-05-05T23:59:00Z",
          location: "Japan",
          price: 65,
          currency: "USD",
          status: "alternative",
          details: { type: "Single entry", validity: "30 days", processing: "24 hours" },
        },
      ],
    },
  ],
};

const MOCK_PASS_2: TravelPass = {
  id: "pass_2",
  title: "Bali Wellness Retreat",
  destination: "Ubud, Bali",
  startDate: "2026-03-01",
  endDate: "2026-03-10",
  status: "archived",
  isPublic: true,
  travelBuddyRequests: 7,
  createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  totalCost: 1980,
  currency: "USD",
  cards: [
    {
      id: "c10",
      type: "flight",
      title: "SFO → DPS",
      subtitle: "Cathay Pacific CX872",
      provider: "Cathay Pacific",
      startTime: "2026-03-01T11:00:00Z",
      endTime: "2026-03-02T22:30:00Z",
      location: "San Francisco International Airport",
      price: 780,
      currency: "USD",
      status: "confirmed",
      details: { seat: "15C", class: "Economy Plus", duration: "18h 30m" },
    },
    {
      id: "c11",
      type: "hotel",
      title: "Komaneka at Bisma",
      subtitle: "Jungle View Suite · 9 nights",
      provider: "Komaneka Resorts",
      startTime: "2026-03-02T15:00:00Z",
      endTime: "2026-03-10T11:00:00Z",
      location: "Ubud, Bali",
      price: 1200,
      currency: "USD",
      status: "confirmed",
      details: { nights: "9 nights", roomType: "Jungle Suite", pool: "Private plunge pool" },
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// AI-gen itinerary builder (simulated)
// ────────────────────────────────────────────────────────────────────

const MS_DAY = 86400000;
const MS_HOUR = 3600000;
const MS_MIN = 60000;

function purposeLabel(p: TripPurpose): string {
  switch (p) {
    case "leisure": return "Getaway";
    case "business": return "Business Trip";
    case "honeymoon": return "Honeymoon";
    case "family": return "Family Trip";
    case "wellness": return "Wellness Retreat";
    case "bachelor": return "Celebration Trip";
    case "adventure": return "Adventure";
    case "culture": return "Cultural Tour";
    case "celebration": return "Celebration";
    default: return "Trip";
  }
}

function addTime(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

function makeAlts<T extends Partial<TravelCard>>(
  base: TravelCard,
  variants: T[],
  idPrefix: string,
): TravelCard[] {
  return variants.map((v, i) => ({
    ...base,
    ...v,
    id: `${idPrefix}_alt${i + 1}`,
    status: "alternative" as const,
  }));
}

/**
 * Build the full 12-slot itinerary for a trip. Each card gets a stable ID and
 * an explicit `dependsOn` parent where applicable — this is what the
 * plannerEngine uses to cascade reflows when cards are swapped or removed.
 *
 * Time sequencing is scripted (not LLM-powered yet); Phase 6 swaps the body
 * for a real Anthropic call.
 */
function buildFullItinerary(prefs: PlannerPreferences): TravelCard[] {
  const ts = Date.now();
  const id = (tag: string) => `${tag}_${ts}`;

  const isLux = prefs.travelStyle === "luxury";
  const isBudget = prefs.travelStyle === "budget";
  const cur = prefs.currency;

  const start = prefs.startDate;
  const end = prefs.endDate;
  const tripDays = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / MS_DAY),
  );

  const budget = prefs.budget;
  const flightBase = Math.round(budget * 0.25); // one-way share
  const hotelPerNight = Math.round((budget * 0.35) / tripDays);
  const hotelTotal = hotelPerNight * tripDays;
  const insBase = Math.round(budget * 0.03);
  const actBase = Math.round(budget * 0.06);
  const diningBase = Math.round(budget * 0.04);
  const transferBase = Math.round(budget * 0.015);
  const visaBase = 35;
  const eventBase = Math.round(budget * 0.05);

  const hotelProvider = isLux ? "Four Seasons" : isBudget ? "Ibis" : "Marriott";
  const hotelStar = isLux ? "5-star" : isBudget ? "3-star" : "4-star";

  // Time skeleton
  const visaProcessingStart = addTime(start, -14 * MS_DAY);
  const visaValidEnd = addTime(end, 30 * MS_DAY);
  const outboundDepart = addTime(start, 10 * MS_HOUR);
  const outboundArrive = addTime(start, 20 * MS_HOUR);
  const arrTransferStart = addTime(outboundArrive, 30 * MS_MIN);
  const arrTransferEnd = addTime(arrTransferStart, 45 * MS_MIN);
  const hotelCheckIn = arrTransferEnd;
  const hotelCheckOut = addTime(end, 11 * MS_HOUR);
  const returnDepart = addTime(end, 14 * MS_HOUR);
  const returnArrive = addTime(returnDepart, 10 * MS_HOUR);
  const depTransferStart = addTime(returnDepart, -3 * MS_HOUR);
  const depTransferEnd = addTime(returnDepart, -30 * MS_MIN);

  const cards: TravelCard[] = [];

  // 1. Visa
  const visaCard: TravelCard = {
    id: id("visa"),
    type: "visa",
    title: `${prefs.destination} eVisa`,
    subtitle: "Tourist visa · 30 days",
    provider: "TravelBook Visa Services",
    startTime: visaProcessingStart,
    endTime: visaValidEnd,
    location: prefs.destination,
    price: visaBase,
    currency: cur,
    status: "confirmed",
    details: { type: "Single entry", validity: "30 days", processing: "3–5 days" },
  };
  visaCard.alternatives = makeAlts(
    visaCard,
    [
      {
        subtitle: "Tourist visa · Rush 24h",
        price: visaBase + 30,
        details: { type: "Single entry", validity: "30 days", processing: "24 hours" },
      },
      {
        subtitle: "Multi-entry · 90 days",
        price: visaBase + 60,
        details: { type: "Multi-entry", validity: "90 days", processing: "5–7 days" },
      },
    ],
    visaCard.id,
  );
  cards.push(visaCard);

  // 2. Insurance
  const insCard: TravelCard = {
    id: id("insurance"),
    type: "insurance",
    title: "Travel Insurance",
    subtitle: "Comprehensive coverage",
    provider: "WorldNomads",
    startTime: start + "T00:00:00.000Z",
    endTime: end + "T23:59:00.000Z",
    location: "Worldwide",
    price: insBase,
    currency: cur,
    status: "confirmed",
    details: { medical: "$500,000", cancellation: "Trip cost", luggage: "$2,500" },
  };
  insCard.alternatives = makeAlts(
    insCard,
    [
      {
        title: "Basic Coverage",
        provider: "SafeTrip",
        subtitle: "Essential protection",
        price: Math.round(insBase * 0.6),
        details: { medical: "$250,000", cancellation: "80% trip cost", luggage: "$1,500" },
      },
      {
        title: "Elite Coverage",
        provider: "Allianz",
        subtitle: "Maximum protection",
        price: Math.round(insBase * 1.7),
        details: { medical: "$1,000,000", cancellation: "Full trip cost", luggage: "$5,000" },
      },
    ],
    insCard.id,
  );
  cards.push(insCard);

  // 3. Outbound flight
  const outboundCard: TravelCard = {
    id: id("flight_out"),
    type: "flight",
    title: `Flight to ${prefs.destination}`,
    subtitle: isLux ? "Business · Non-stop" : "Economy · Best value",
    provider: isLux ? "Emirates" : "Qatar Airways",
    startTime: outboundDepart,
    endTime: outboundArrive,
    location: "Departure Airport",
    price: flightBase,
    currency: cur,
    status: "confirmed",
    details: { class: isLux ? "Business" : "Economy", baggage: "23kg", stops: isLux ? "Non-stop" : "1 stop" },
  };
  outboundCard.alternatives = makeAlts(
    outboundCard,
    [
      {
        subtitle: "Economy+ · Non-stop",
        provider: "Singapore Airlines",
        price: Math.round(flightBase * 1.18),
        startTime: addTime(outboundDepart, -2 * MS_HOUR),
        endTime: addTime(outboundArrive, -2 * MS_HOUR - 30 * MS_MIN),
        details: { class: "Economy+", baggage: "23kg", stops: "Non-stop" },
      },
      {
        subtitle: "Economy · Budget",
        provider: "Turkish Airlines",
        price: Math.round(flightBase * 0.82),
        startTime: addTime(outboundDepart, -4 * MS_HOUR),
        endTime: addTime(outboundArrive, 2 * MS_HOUR),
        details: { class: "Economy", baggage: "20kg", stops: "2 stops" },
      },
      {
        subtitle: "Premium Economy · Non-stop",
        provider: "British Airways",
        price: Math.round(flightBase * 1.45),
        startTime: outboundDepart,
        endTime: addTime(outboundArrive, -1 * MS_HOUR),
        details: { class: "Premium", baggage: "32kg", stops: "Non-stop" },
      },
    ],
    outboundCard.id,
  );
  cards.push(outboundCard);

  // 4. Arrival transfer (depends on outbound flight)
  const arrTransferCard: TravelCard = {
    id: id("transfer_arr"),
    type: "transport",
    title: "Airport Pickup",
    subtitle: "Private car · Airport → Hotel",
    provider: "TravelBook Transfers",
    startTime: arrTransferStart,
    endTime: arrTransferEnd,
    location: prefs.destination,
    price: transferBase,
    currency: cur,
    status: "confirmed",
    dependsOn: outboundCard.id,
    details: { vehicle: isLux ? "Luxury sedan" : "Private car", duration: "45 min", meetAt: "Arrivals Hall" },
  };
  arrTransferCard.alternatives = makeAlts(
    arrTransferCard,
    [
      {
        subtitle: "Shared shuttle · Airport → Hotel",
        provider: "AirportShuttle",
        price: Math.round(transferBase * 0.4),
        details: { vehicle: "Shared van", duration: "75 min", meetAt: "Shuttle Desk" },
      },
      {
        subtitle: "Premium chauffeur · Airport → Hotel",
        provider: "Blacklane",
        price: Math.round(transferBase * 1.6),
        details: { vehicle: "Mercedes S-Class", duration: "40 min", meetAt: "Arrivals Hall" },
      },
    ],
    arrTransferCard.id,
  );
  cards.push(arrTransferCard);

  // 5. Hotel (depends on arrival transfer)
  const hotelCard: TravelCard = {
    id: id("hotel"),
    type: "hotel",
    title: `${hotelStar} Hotel · ${prefs.destination}`,
    subtitle: `${hotelProvider} · ${tripDays} nights`,
    provider: hotelProvider,
    startTime: hotelCheckIn,
    endTime: hotelCheckOut,
    location: prefs.destination,
    price: hotelTotal,
    currency: cur,
    status: "confirmed",
    dependsOn: arrTransferCard.id,
    details: {
      roomType: isLux ? "Suite" : "Standard",
      breakfast: isBudget ? "Not incl." : "Included",
      nights: `${tripDays} nights`,
    },
  };
  hotelCard.alternatives = makeAlts(
    hotelCard,
    [
      {
        title: `Boutique Hotel · ${prefs.destination}`,
        provider: "Design Hotels",
        subtitle: `Local charm · ${tripDays} nights`,
        price: Math.round(hotelTotal * 0.75),
        details: { roomType: "Deluxe Room", breakfast: "Included", nights: `${tripDays} nights` },
      },
      {
        title: `Premium Resort · ${prefs.destination}`,
        provider: isLux ? "Aman Resorts" : "Hilton",
        subtitle: `Luxury all-inclusive · ${tripDays} nights`,
        price: Math.round(hotelTotal * 1.45),
        details: { roomType: "Suite", breakfast: "All-inclusive", pool: "Private" },
      },
      {
        title: `Serviced Apartment · ${prefs.destination}`,
        provider: "Citadines",
        subtitle: `Studio · ${tripDays} nights`,
        price: Math.round(hotelTotal * 0.55),
        details: { roomType: "Studio", breakfast: "Not incl.", kitchen: "Full" },
      },
    ],
    hotelCard.id,
  );
  cards.push(hotelCard);

  // 6. Activities — one per full day (excluding arrival and departure days)
  const activityDays = Math.max(1, tripDays - 1);
  for (let d = 0; d < activityDays; d++) {
    const actStart = addTime(start, (d + 1) * MS_DAY + 9 * MS_HOUR);
    const actEnd = addTime(actStart, 4 * MS_HOUR);
    const actCard: TravelCard = {
      id: id(`activity_${d}`),
      type: "activity",
      title: d === 0 ? `City Highlights Tour · ${prefs.destination}` : `Day ${d + 1} Experience`,
      subtitle: purposeActivitySubtitle(prefs, d),
      provider: "Local Experts",
      startTime: actStart,
      endTime: actEnd,
      location: prefs.destination,
      price: actBase,
      currency: cur,
      status: "confirmed",
      dependsOn: hotelCard.id,
      details: { groupSize: `${prefs.travelers} pax`, language: "English", duration: "4h" },
    };
    actCard.alternatives = makeAlts(
      actCard,
      [
        {
          title: `Private Tour · Day ${d + 1}`,
          subtitle: "Exclusive guided experience",
          provider: "Premium Tours",
          price: Math.round(actBase * 2.2),
          details: { groupSize: "Private", language: "English", transport: "Included" },
        },
        {
          title: `Self-Guided Walk · Day ${d + 1}`,
          subtitle: "At your own pace",
          provider: "TravelBook Guides",
          price: Math.round(actBase * 0.2),
          details: { groupSize: "Self-guided", language: "App", duration: "Flexible" },
        },
      ],
      actCard.id,
    );
    cards.push(actCard);
  }

  // 7. Dining — dinner on the 2nd and 4th nights of the trip if long enough
  const diningNights = [1, 3].filter((n) => n < tripDays);
  for (const n of diningNights) {
    const dinnerStart = addTime(start, n * MS_DAY + 19 * MS_HOUR + 30 * MS_MIN);
    const dinnerEnd = addTime(dinnerStart, 2 * MS_HOUR);
    const dineCard: TravelCard = {
      id: id(`dining_${n}`),
      type: "dining",
      title: n === 1 ? `Welcome Dinner · ${prefs.destination}` : `Signature Dinner · ${prefs.destination}`,
      subtitle: isLux ? "Michelin-star restaurant" : "Chef's tasting menu",
      provider: isLux ? "Ryugin" : "The Local Table",
      startTime: dinnerStart,
      endTime: dinnerEnd,
      location: prefs.destination,
      price: diningBase,
      currency: cur,
      status: "confirmed",
      dependsOn: hotelCard.id,
      details: { reservation: "Confirmed", dressCode: isLux ? "Smart casual" : "Casual", courses: "5" },
    };
    dineCard.alternatives = makeAlts(
      dineCard,
      [
        {
          title: `Street Food Tour · ${prefs.destination}`,
          subtitle: "Local market crawl",
          provider: "Foodie Walks",
          price: Math.round(diningBase * 0.35),
          details: { reservation: "Walk-in", dressCode: "Casual", stops: "6" },
        },
        {
          title: `Omakase Experience · ${prefs.destination}`,
          subtitle: "Private chef counter",
          provider: "Chef's Table",
          price: Math.round(diningBase * 2.5),
          details: { reservation: "Confirmed", dressCode: "Formal", courses: "15" },
        },
      ],
      dineCard.id,
    );
    cards.push(dineCard);
  }

  // 8. Event — one signature event mid-trip if purpose supports it
  if (tripDays >= 4 && ["leisure", "culture", "celebration", "adventure"].includes(prefs.purpose)) {
    const eventStart = addTime(start, 2 * MS_DAY + 19 * MS_HOUR);
    const eventEnd = addTime(eventStart, 3 * MS_HOUR);
    const eventCard: TravelCard = {
      id: id("event"),
      type: "event",
      title: `Signature ${prefs.destination} Event`,
      subtitle: "Live performance · Premium seats",
      provider: "Ticketmaster",
      startTime: eventStart,
      endTime: eventEnd,
      location: prefs.destination,
      price: eventBase,
      currency: cur,
      status: "confirmed",
      dependsOn: hotelCard.id,
      details: { seating: "Premium", doors: "18:30", duration: "3h" },
    };
    eventCard.alternatives = makeAlts(
      eventCard,
      [
        {
          subtitle: "Live performance · Standard seats",
          price: Math.round(eventBase * 0.55),
          details: { seating: "Standard", doors: "18:30", duration: "3h" },
        },
        {
          title: `Cultural Show · ${prefs.destination}`,
          subtitle: "Intimate venue",
          provider: "Local Arts",
          price: Math.round(eventBase * 0.3),
          details: { seating: "Open", doors: "19:00", duration: "2h" },
        },
      ],
      eventCard.id,
    );
    cards.push(eventCard);
  }

  // 9. Departure transfer (depends on return flight)
  const returnCard: TravelCard = {
    id: id("flight_ret"),
    type: "flight",
    title: `Flight from ${prefs.destination}`,
    subtitle: isLux ? "Business · Non-stop" : "Economy · Best value",
    provider: isLux ? "Emirates" : "Qatar Airways",
    startTime: returnDepart,
    endTime: returnArrive,
    location: `${prefs.destination} Airport`,
    price: flightBase,
    currency: cur,
    status: "confirmed",
    details: { class: isLux ? "Business" : "Economy", baggage: "23kg", stops: isLux ? "Non-stop" : "1 stop" },
  };
  returnCard.alternatives = makeAlts(
    returnCard,
    [
      {
        subtitle: "Economy+ · Non-stop",
        provider: "Singapore Airlines",
        price: Math.round(flightBase * 1.18),
        startTime: addTime(returnDepart, -3 * MS_HOUR),
        endTime: addTime(returnArrive, -3 * MS_HOUR - 30 * MS_MIN),
        details: { class: "Economy+", baggage: "23kg", stops: "Non-stop" },
      },
      {
        subtitle: "Economy · Budget",
        provider: "Turkish Airlines",
        price: Math.round(flightBase * 0.82),
        startTime: addTime(returnDepart, -6 * MS_HOUR),
        endTime: addTime(returnArrive, 2 * MS_HOUR),
        details: { class: "Economy", baggage: "20kg", stops: "2 stops" },
      },
    ],
    returnCard.id,
  );

  const depTransferCard: TravelCard = {
    id: id("transfer_dep"),
    type: "transport",
    title: "Airport Drop-off",
    subtitle: "Private car · Hotel → Airport",
    provider: "TravelBook Transfers",
    startTime: depTransferStart,
    endTime: depTransferEnd,
    location: prefs.destination,
    price: transferBase,
    currency: cur,
    status: "confirmed",
    dependsOn: returnCard.id,
    details: { vehicle: isLux ? "Luxury sedan" : "Private car", duration: "45 min", pickup: "Hotel lobby" },
  };
  depTransferCard.alternatives = makeAlts(
    depTransferCard,
    [
      {
        subtitle: "Shared shuttle · Hotel → Airport",
        provider: "AirportShuttle",
        price: Math.round(transferBase * 0.4),
        details: { vehicle: "Shared van", duration: "75 min", pickup: "Hotel lobby" },
      },
      {
        subtitle: "Premium chauffeur · Hotel → Airport",
        provider: "Blacklane",
        price: Math.round(transferBase * 1.6),
        details: { vehicle: "Mercedes S-Class", duration: "40 min", pickup: "Hotel lobby" },
      },
    ],
    depTransferCard.id,
  );

  cards.push(depTransferCard);
  cards.push(returnCard);

  return cards;
}

function purposeActivitySubtitle(prefs: PlannerPreferences, dayIdx: number): string {
  const interests = prefs.interests ?? [];
  if (interests.includes("Food") && dayIdx === 0) return "Food-focused walking tour";
  if (interests.includes("Adventure")) return dayIdx % 2 === 0 ? "Guided adventure experience" : "Outdoor discovery";
  if (interests.includes("Culture")) return "Curated cultural tour";
  if (interests.includes("Wellness")) return "Spa & wellness experience";
  if (interests.includes("Nature")) return "Nature excursion";
  if (interests.includes("Beach")) return "Coastal experience";
  if (prefs.purpose === "honeymoon") return "Romantic private experience";
  if (prefs.purpose === "family") return "Family-friendly activity";
  return "Guided tour · Half day";
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [passes, setPasses] = useState<TravelPass[]>([MOCK_PASS_1, MOCK_PASS_2]);
  const [activePlan, setActivePlan] = useState<TravelPass | null>(null);
  const [plannerPrefs, setPlannerPrefsState] = useState<PlannerPreferences | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("travelbook_passes");
        if (stored) {
          const extra = JSON.parse(stored) as TravelPass[];
          setPasses((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...extra.filter((p) => !ids.has(p.id))];
          });
        }
      } catch {}
    };
    load();
  }, []);

  const setPlannerPrefs = useCallback((prefs: PlannerPreferences) => {
    setPlannerPrefsState(prefs);
  }, []);

  const generateItinerary = useCallback(async (prefs: PlannerPreferences) => {
    setIsGenerating(true);

    // Kick off the scripted itinerary build immediately, and the LLM call in
    // parallel. The scripted result is the source of truth for the cards;
    // the LLM result is appended as `aiNotes` if it succeeds.
    const [_, ai] = await Promise.all([
      new Promise((r) => setTimeout(r, 2500)), // pacing — feels like real generation
      fetchAiSuggestions(prefs),
    ]);

    const cards = buildFullItinerary(prefs);
    const ts = Date.now();

    const newPass: TravelPass = {
      id: ts.toString(),
      title: `${prefs.destination} ${purposeLabel(prefs.purpose)}`,
      destination: prefs.destination,
      startDate: prefs.startDate,
      endDate: prefs.endDate,
      status: "upcoming",
      isPublic: false,
      travelBuddyRequests: 0,
      createdAt: new Date().toISOString(),
      totalCost: totalCost(cards),
      currency: prefs.currency,
      cards,
      aiNotes: ai.source === "llm" && ai.suggestions ? ai.suggestions : undefined,
      aiSource: ai.source === "llm" ? "llm-augmented" : "scripted",
    };

    setActivePlan(newPass);
    setConflicts(detectConflicts(cards));
    setIsGenerating(false);
  }, []);

  /**
   * updateCard: applies a partial update to a card and cascades the time delta
   * through every descendant via plannerEngine.reflowCards.
   */
  const updateCard = useCallback(
    (passId: string, cardId: string, updates: Partial<TravelCard>) => {
      const applyTo = (cards: TravelCard[]): TravelCard[] => {
        const oldCard = cards.find((c) => c.id === cardId);
        if (!oldCard) return cards;
        const newCard: TravelCard = { ...oldCard, ...updates };
        return reflowCards(cards, oldCard, newCard);
      };

      setPasses((prev) =>
        prev.map((p) => (p.id === passId ? { ...p, cards: applyTo(p.cards), totalCost: totalCost(applyTo(p.cards)) } : p)),
      );
      setActivePlan((prev) => {
        if (prev?.id !== passId) return prev;
        const nextCards = applyTo(prev.cards);
        return { ...prev, cards: nextCards, totalCost: totalCost(nextCards) };
      });
      setConflicts((prevConflicts) => {
        const target = activePlan?.id === passId ? activePlan : passes.find((p) => p.id === passId);
        if (!target) return prevConflicts;
        return detectConflicts(applyTo(target.cards));
      });
    },
    [activePlan, passes],
  );

  /**
   * removeCard: removes a card AND any descendants that depended on it
   * (via plannerEngine.removeCardAndReflow).
   */
  const removeCard = useCallback((passId: string, cardId: string) => {
    const applyTo = (cards: TravelCard[]): TravelCard[] => removeCardAndReflow(cards, cardId);

    setPasses((prev) =>
      prev.map((p) =>
        p.id === passId ? { ...p, cards: applyTo(p.cards), totalCost: totalCost(applyTo(p.cards)) } : p,
      ),
    );
    setActivePlan((prev) => {
      if (prev?.id !== passId) return prev;
      const nextCards = applyTo(prev.cards);
      return { ...prev, cards: nextCards, totalCost: totalCost(nextCards) };
    });
    setConflicts((prevConflicts) => {
      const target = activePlan?.id === passId ? activePlan : passes.find((p) => p.id === passId);
      if (!target) return prevConflicts;
      return detectConflicts(applyTo(target.cards));
    });
  }, [activePlan, passes]);

  const bookAll = useCallback(async (passId: string) => {
    const targetPass = passId === activePlan?.id ? activePlan : passes.find((p) => p.id === passId);
    if (!targetPass) return;

    // Compile the final pass: recompute totalCost from the (potentially reflowed) cards,
    // ensure status is upcoming, and supply coverImage fallback if none was set.
    const bookedPass: TravelPass = {
      ...targetPass,
      status: "upcoming",
      totalCost: totalCost(targetPass.cards),
      coverImage: targetPass.coverImage ?? "",
    };

    setPasses((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const updated = ids.has(passId)
        ? prev.map((p) => (p.id === passId ? bookedPass : p))
        : [bookedPass, ...prev];
      AsyncStorage.setItem(
        "travelbook_passes",
        JSON.stringify(updated.filter((p) => p.id !== "pass_1" && p.id !== "pass_2")),
      );
      return updated;
    });
    setActivePlan(null);
    setConflicts([]);
  }, [activePlan, passes]);

  const sharePass = useCallback((passId: string) => {
    setPasses((prev) =>
      prev.map((p) => (p.id === passId ? { ...p, isPublic: true } : p))
    );
  }, []);

  const archivePass = useCallback((passId: string) => {
    setPasses((prev) =>
      prev.map((p) => (p.id === passId ? { ...p, status: "archived" } : p))
    );
  }, []);

  const addManualCard = useCallback((passId: string, card: Omit<TravelCard, "id" | "alternatives">) => {
    const newCard: TravelCard = {
      ...card,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setActivePlan((prev) =>
      prev?.id === passId ? { ...prev, cards: [...prev.cards, newCard] } : prev
    );
  }, []);

  const createEmptyPlan = useCallback(() => {
    const emptyPlan: TravelPass = {
      id: Date.now().toString(),
      title: "New Trip",
      destination: "",
      startDate: "",
      endDate: "",
      status: "upcoming",
      isPublic: false,
      travelBuddyRequests: 0,
      createdAt: new Date().toISOString(),
      totalCost: 0,
      currency: "USD",
      cards: [],
    };
    setActivePlan(emptyPlan);
  }, []);

  const discardPlan = useCallback(() => {
    setActivePlan(null);
    setPlannerPrefsState(null);
  }, []);

  const requestJoinTrip = useCallback((passId: string) => {
    setPasses((prev) =>
      prev.map((p) =>
        p.id === passId ? { ...p, travelBuddyRequests: p.travelBuddyRequests + 1 } : p
      )
    );
  }, []);

  return (
    <PlannerContext.Provider
      value={{
        passes,
        activePlan,
        plannerPrefs,
        isGenerating,
        conflicts,
        setPlannerPrefs,
        generateItinerary,
        updateCard,
        removeCard,
        bookAll,
        sharePass,
        archivePass,
        addManualCard,
        createEmptyPlan,
        discardPlan,
        requestJoinTrip,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
