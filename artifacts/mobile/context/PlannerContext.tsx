import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CardType =
  | "flight"
  | "hotel"
  | "activity"
  | "insurance"
  | "visa"
  | "dining"
  | "transport"
  | "event";

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
}

interface PlannerContextType {
  passes: TravelPass[];
  activePlan: TravelPass | null;
  plannerPrefs: PlannerPreferences | null;
  isGenerating: boolean;
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

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [passes, setPasses] = useState<TravelPass[]>([MOCK_PASS_1, MOCK_PASS_2]);
  const [activePlan, setActivePlan] = useState<TravelPass | null>(null);
  const [plannerPrefs, setPlannerPrefsState] = useState<PlannerPreferences | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    await new Promise((r) => setTimeout(r, 2500));

    const ts = Date.now();
    const flightBase = Math.round(prefs.budget * 0.28);
    const hotelBase  = Math.round(prefs.budget * 0.40);
    const insBase    = Math.round(prefs.budget * 0.03);
    const actBase    = Math.round(prefs.budget * 0.08);
    const isLux = prefs.travelStyle === "luxury";
    const isBudget = prefs.travelStyle === "budget";
    const hotelProvider = isLux ? "Four Seasons" : isBudget ? "Ibis" : "Marriott";
    const hotelStar = isLux ? "5-star" : isBudget ? "3-star" : "4-star";

    const start2 = new Date(new Date(prefs.startDate).getTime() + 86400000 * 2).toISOString();
    const start2End = new Date(new Date(prefs.startDate).getTime() + 86400000 * 2 + 28800000).toISOString();

    const newPass: TravelPass = {
      id: ts.toString(),
      title: `${prefs.destination} Trip`,
      destination: prefs.destination,
      startDate: prefs.startDate,
      endDate: prefs.endDate,
      status: "upcoming",
      isPublic: false,
      travelBuddyRequests: 0,
      createdAt: new Date().toISOString(),
      totalCost: Math.round(prefs.budget * 0.85),
      currency: prefs.currency,
      cards: [
        {
          id: `flight_${ts}`,
          type: "flight",
          title: `Flight to ${prefs.destination}`,
          subtitle: isLux ? "Business Class · Non-stop" : "Economy · Best value",
          provider: isLux ? "Emirates" : "Qatar Airways",
          startTime: prefs.startDate + "T10:00:00Z",
          endTime: prefs.startDate + "T22:00:00Z",
          location: "Departure Airport",
          price: flightBase,
          currency: prefs.currency,
          status: "confirmed",
          details: { class: isLux ? "Business" : "Economy", baggage: "23kg", stops: isLux ? "Non-stop" : "1 stop" },
          alternatives: [
            {
              id: `flight_${ts}_alt1`,
              type: "flight",
              title: `Flight to ${prefs.destination}`,
              subtitle: "Economy · Non-stop",
              provider: "Singapore Airlines",
              startTime: prefs.startDate + "T07:30:00Z",
              endTime: prefs.startDate + "T19:00:00Z",
              location: "Departure Airport",
              price: Math.round(flightBase * 1.15),
              currency: prefs.currency,
              status: "alternative",
              details: { class: "Economy+", baggage: "23kg", stops: "Non-stop" },
            },
            {
              id: `flight_${ts}_alt2`,
              type: "flight",
              title: `Flight to ${prefs.destination}`,
              subtitle: "Economy · Budget option",
              provider: "Turkish Airlines",
              startTime: prefs.startDate + "T05:00:00Z",
              endTime: prefs.startDate + "T21:30:00Z",
              location: "Departure Airport",
              price: Math.round(flightBase * 0.78),
              currency: prefs.currency,
              status: "alternative",
              details: { class: "Economy", baggage: "20kg", stops: "2 stops" },
            },
          ],
        },
        {
          id: `hotel_${ts}`,
          type: "hotel",
          title: `${hotelStar} Hotel · ${prefs.destination}`,
          subtitle: `${hotelProvider} · Check-in ${prefs.startDate}`,
          provider: hotelProvider,
          startTime: prefs.startDate + "T15:00:00Z",
          endTime: prefs.endDate + "T11:00:00Z",
          location: prefs.destination,
          price: hotelBase,
          currency: prefs.currency,
          status: "confirmed",
          details: { roomType: isLux ? "Suite" : "Standard", breakfast: isBudget ? "Not incl." : "Included", wifi: "Free" },
          alternatives: [
            {
              id: `hotel_${ts}_alt1`,
              type: "hotel",
              title: `Boutique Hotel · ${prefs.destination}`,
              subtitle: "Local charm · Central location",
              provider: "Design Hotels",
              startTime: prefs.startDate + "T15:00:00Z",
              endTime: prefs.endDate + "T11:00:00Z",
              location: prefs.destination,
              price: Math.round(hotelBase * 0.75),
              currency: prefs.currency,
              status: "alternative",
              details: { roomType: "Deluxe Room", breakfast: "Included", wifi: "Free" },
            },
            {
              id: `hotel_${ts}_alt2`,
              type: "hotel",
              title: `Premium Resort · ${prefs.destination}`,
              subtitle: "Luxury all-inclusive",
              provider: isLux ? "Aman Resorts" : "Hilton",
              startTime: prefs.startDate + "T15:00:00Z",
              endTime: prefs.endDate + "T11:00:00Z",
              location: prefs.destination,
              price: Math.round(hotelBase * 1.45),
              currency: prefs.currency,
              status: "alternative",
              details: { roomType: "Deluxe Suite", breakfast: "All-inclusive", pool: "Private" },
            },
          ],
        },
        {
          id: `insurance_${ts}`,
          type: "insurance",
          title: "Travel Insurance",
          subtitle: "Comprehensive trip coverage",
          provider: "WorldNomads",
          startTime: prefs.startDate + "T00:00:00Z",
          endTime: prefs.endDate + "T23:59:00Z",
          location: "Worldwide",
          price: insBase,
          currency: prefs.currency,
          status: "confirmed",
          details: { medical: "$500,000", cancellation: "Trip cost", luggage: "$2,500" },
          alternatives: [
            {
              id: `insurance_${ts}_alt1`,
              type: "insurance",
              title: "Basic Coverage",
              subtitle: "Essential protection",
              provider: "SafeTrip",
              startTime: prefs.startDate + "T00:00:00Z",
              endTime: prefs.endDate + "T23:59:00Z",
              location: "Worldwide",
              price: Math.round(insBase * 0.6),
              currency: prefs.currency,
              status: "alternative",
              details: { medical: "$250,000", cancellation: "80% trip cost", luggage: "$1,500" },
            },
            {
              id: `insurance_${ts}_alt2`,
              type: "insurance",
              title: "Elite Coverage",
              subtitle: "Maximum protection",
              provider: "Allianz",
              startTime: prefs.startDate + "T00:00:00Z",
              endTime: prefs.endDate + "T23:59:00Z",
              location: "Worldwide",
              price: Math.round(insBase * 1.7),
              currency: prefs.currency,
              status: "alternative",
              details: { medical: "$1,000,000", cancellation: "Full trip cost", luggage: "$5,000" },
            },
          ],
        },
        {
          id: `activity_${ts}`,
          type: "activity",
          title: `Top Experience in ${prefs.destination}`,
          subtitle: "Guided tour · Full day",
          provider: "Local Experts",
          startTime: start2,
          endTime: start2End,
          location: prefs.destination,
          price: actBase,
          currency: prefs.currency,
          status: "confirmed",
          details: { groupSize: `${prefs.travelers} pax`, language: "English", duration: "8h" },
          alternatives: [
            {
              id: `activity_${ts}_alt1`,
              type: "activity",
              title: `Private Tour · ${prefs.destination}`,
              subtitle: "Exclusive guided experience",
              provider: "Premium Tours",
              startTime: start2,
              endTime: start2End,
              location: prefs.destination,
              price: Math.round(actBase * 2.2),
              currency: prefs.currency,
              status: "alternative",
              details: { groupSize: "Private", language: "English", transport: "Included" },
            },
            {
              id: `activity_${ts}_alt2`,
              type: "activity",
              title: `Self-Guided City Walk`,
              subtitle: "Explore at your own pace",
              provider: "TravelBook Guides",
              startTime: start2,
              endTime: start2End,
              location: prefs.destination,
              price: Math.round(actBase * 0.25),
              currency: prefs.currency,
              status: "alternative",
              details: { groupSize: "Self-guided", language: "App guide", duration: "Flexible" },
            },
          ],
        },
      ],
    };

    setActivePlan(newPass);
    setIsGenerating(false);
  }, []);

  const updateCard = useCallback((passId: string, cardId: string, updates: Partial<TravelCard>) => {
    const updateInList = (list: TravelPass[]) =>
      list.map((p) =>
        p.id === passId
          ? { ...p, cards: p.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)) }
          : p
      );
    setPasses(updateInList);
    setActivePlan((prev) =>
      prev?.id === passId
        ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)) }
        : prev
    );
  }, []);

  const removeCard = useCallback((passId: string, cardId: string) => {
    const removeFromList = (list: TravelPass[]) =>
      list.map((p) =>
        p.id === passId ? { ...p, cards: p.cards.filter((c) => c.id !== cardId) } : p
      );
    setPasses(removeFromList);
    setActivePlan((prev) =>
      prev?.id === passId ? { ...prev, cards: prev.cards.filter((c) => c.id !== cardId) } : prev
    );
  }, []);

  const bookAll = useCallback(async (passId: string) => {
    const targetPass = passId === activePlan?.id ? activePlan : passes.find((p) => p.id === passId);
    if (!targetPass) return;
    const bookedPass = { ...targetPass, status: "upcoming" as const };
    setPasses((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      if (ids.has(passId)) return prev.map((p) => (p.id === passId ? bookedPass : p));
      const updated = [bookedPass, ...prev];
      AsyncStorage.setItem("travelbook_passes", JSON.stringify(updated.filter((p) => p.id !== "pass_1" && p.id !== "pass_2")));
      return updated;
    });
    setActivePlan(null);
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
