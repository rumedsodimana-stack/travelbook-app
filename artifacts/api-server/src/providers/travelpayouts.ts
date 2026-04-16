import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

const BASE = "https://api.travelpayouts.com";
const HOTEL_BASE = "https://engine.hotellook.com/api/v2";

export function createTravelPayoutsAdapter(cfg: { apiToken: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiToken);

  return {
    meta: {
      id: "travelpayouts",
      name: "TravelPayouts",
      tier: "free",
      categories: ["flight", "hotel", "activity", "transport"],
      docsUrl: "https://www.travelpayouts.com/developers/api",
      signupUrl: "https://www.travelpayouts.com/programs",
      description: "Commission-based affiliate: flights, hotels, tours, car rentals",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiToken) return [];

      try {
        if (params.category === "flight") return searchFlights(cfg.apiToken, params);
        if (params.category === "hotel") return searchHotels(cfg.apiToken, params);
        return [];
      } catch (err) {
        console.error("[travelpayouts] search error:", err);
        return [];
      }
    },
  };
}

async function searchFlights(token: string, p: SearchParams): Promise<ProviderResult[]> {
  const url = new URL(`${BASE}/aviasales/v3/prices_for_dates`);
  url.searchParams.set("origin", p.destination.slice(0, 3).toUpperCase());
  url.searchParams.set("departure_at", p.startDate);
  url.searchParams.set("return_at", p.endDate);
  url.searchParams.set("currency", p.currency.toLowerCase());
  url.searchParams.set("token", token);
  url.searchParams.set("limit", "10");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: any[] };

  return (data.data ?? []).map((f: any) => ({
    provider: "travelpayouts",
    providerRef: f.departure_at ?? "",
    type: "flight" as const,
    title: `${f.origin ?? "???"} → ${f.destination ?? "???"}`,
    subtitle: `${f.airline ?? "Airline"} · ${f.transfers === 0 ? "Non-stop" : `${f.transfers} stop(s)`}`,
    price: f.price ?? 0,
    currency: p.currency,
    startTime: f.departure_at ?? p.startDate,
    endTime: f.return_at ?? p.endDate,
    location: f.origin ?? "",
    details: {
      airline: f.airline ?? "",
      transfers: String(f.transfers ?? 0),
      flightNumber: f.flight_number ?? "",
    },
    affiliateLink: `https://www.aviasales.com/search/${f.origin}${f.destination}${p.startDate.replace(/-/g, "")}`,
  }));
}

async function searchHotels(token: string, p: SearchParams): Promise<ProviderResult[]> {
  const url = new URL(`${HOTEL_BASE}/lookup.json`);
  url.searchParams.set("query", p.destination);
  url.searchParams.set("token", token);
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "10");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: { hotels?: any[] } };

  return (data.results?.hotels ?? []).map((h: any) => ({
    provider: "travelpayouts",
    providerRef: String(h.id ?? ""),
    type: "hotel" as const,
    title: h.label ?? h.fullName ?? "Hotel",
    subtitle: `${h.locationName ?? p.destination}`,
    price: 0, // lookup doesn't return price — needs separate availability call
    currency: p.currency,
    startTime: p.startDate,
    endTime: p.endDate,
    location: h.locationName ?? p.destination,
    details: { stars: String(h.category ?? ""), country: h.countryName ?? "" },
    affiliateLink: `https://search.hotellook.com/hotels?destination=${encodeURIComponent(p.destination)}`,
  }));
}
