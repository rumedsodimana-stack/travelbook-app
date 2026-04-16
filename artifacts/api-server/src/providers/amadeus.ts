import type { ProviderAdapter, ProviderResult, SearchParams, BookingRequest, BookingConfirmation } from "./types";
import { isConfigured } from "./config";

const BASE = "https://api.amadeus.com";
// Amadeus sandbox for dev — switch to production base when ready
const SANDBOX_BASE = "https://test.api.amadeus.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  try {
    const res = await fetch(`${SANDBOX_BASE}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return cachedToken.token;
  } catch {
    return null;
  }
}

export function createAmadeusAdapter(cfg: { clientId: string | null; clientSecret: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.clientId) && isConfigured(cfg.clientSecret);

  return {
    meta: {
      id: "amadeus",
      name: "Amadeus",
      tier: "paid",
      categories: ["flight", "hotel", "insurance"],
      docsUrl: "https://developers.amadeus.com",
      signupUrl: "https://developers.amadeus.com/register",
      description: "GDS: flights, hotels, insurance — free sandbox tier, paid production",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.clientId || !cfg.clientSecret) return [];
      const token = await getAccessToken(cfg.clientId, cfg.clientSecret);
      if (!token) return [];

      try {
        if (params.category === "flight") return searchFlights(token, params);
        if (params.category === "hotel") return searchHotels(token, params);
        return [];
      } catch (err) {
        console.error("[amadeus] search error:", err);
        return [];
      }
    },

    async book(req: BookingRequest): Promise<BookingConfirmation> {
      // Amadeus booking requires Flight Orders API — complex multi-step flow.
      // For now, return the affiliate deep link.
      return {
        success: true,
        provider: "amadeus",
        providerRef: req.providerRef,
        bookingRef: `amadeus-${Date.now()}`,
        bookingUrl: `https://www.amadeus.com/book/${req.providerRef}`,
      };
    },
  };
}

async function searchFlights(token: string, p: SearchParams): Promise<ProviderResult[]> {
  const url = new URL(`${SANDBOX_BASE}/v2/shopping/flight-offers`);
  url.searchParams.set("originLocationCode", p.filters?.origin ?? "JFK");
  url.searchParams.set("destinationLocationCode", p.destination.slice(0, 3).toUpperCase());
  url.searchParams.set("departureDate", p.startDate);
  url.searchParams.set("returnDate", p.endDate);
  url.searchParams.set("adults", String(p.travelers));
  url.searchParams.set("currencyCode", p.currency);
  url.searchParams.set("max", "10");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: any[] };

  return (data.data ?? []).map((offer: any) => {
    const seg = offer.itineraries?.[0]?.segments?.[0];
    const lastSeg = offer.itineraries?.[0]?.segments?.slice(-1)?.[0];
    return {
      provider: "amadeus",
      providerRef: offer.id ?? "",
      type: "flight" as const,
      title: `${seg?.departure?.iataCode ?? "???"} → ${lastSeg?.arrival?.iataCode ?? "???"}`,
      subtitle: `${seg?.carrierCode ?? ""} ${seg?.number ?? ""} · ${offer.itineraries?.[0]?.segments?.length === 1 ? "Non-stop" : `${offer.itineraries[0].segments.length - 1} stop(s)`}`,
      price: parseFloat(offer.price?.total ?? "0"),
      currency: offer.price?.currency ?? p.currency,
      startTime: seg?.departure?.at ?? p.startDate,
      endTime: lastSeg?.arrival?.at ?? p.endDate,
      location: seg?.departure?.iataCode ?? "",
      details: {
        airline: seg?.carrierCode ?? "",
        class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? "ECONOMY",
        duration: offer.itineraries?.[0]?.duration ?? "",
        baggage: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.weight
          ? `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weight}kg`
          : "23kg",
      },
    };
  });
}

async function searchHotels(token: string, p: SearchParams): Promise<ProviderResult[]> {
  // Step 1: find hotel IDs by city
  const cityUrl = new URL(`${SANDBOX_BASE}/v1/reference-data/locations/hotels/by-city`);
  cityUrl.searchParams.set("cityCode", p.destination.slice(0, 3).toUpperCase());
  cityUrl.searchParams.set("radius", "20");
  cityUrl.searchParams.set("radiusUnit", "KM");

  const cityRes = await fetch(cityUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!cityRes.ok) return [];
  const cityData = (await cityRes.json()) as { data?: any[] };
  const hotelIds = (cityData.data ?? []).slice(0, 10).map((h: any) => h.hotelId).filter(Boolean);

  if (hotelIds.length === 0) return [];

  // Step 2: get offers for those hotels
  const offerUrl = new URL(`${SANDBOX_BASE}/v3/shopping/hotel-offers`);
  offerUrl.searchParams.set("hotelIds", hotelIds.join(","));
  offerUrl.searchParams.set("checkInDate", p.startDate);
  offerUrl.searchParams.set("checkOutDate", p.endDate);
  offerUrl.searchParams.set("adults", String(p.travelers));
  offerUrl.searchParams.set("currency", p.currency);

  const offerRes = await fetch(offerUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!offerRes.ok) return [];
  const offerData = (await offerRes.json()) as { data?: any[] };

  return (offerData.data ?? []).map((h: any) => {
    const offer = h.offers?.[0];
    return {
      provider: "amadeus",
      providerRef: h.hotel?.hotelId ?? "",
      type: "hotel" as const,
      title: h.hotel?.name ?? "Hotel",
      subtitle: `${offer?.room?.typeEstimated?.category ?? "Room"} · ${h.hotel?.rating ? `${h.hotel.rating}-star` : ""}`,
      price: parseFloat(offer?.price?.total ?? "0"),
      currency: offer?.price?.currency ?? p.currency,
      startTime: p.startDate,
      endTime: p.endDate,
      location: h.hotel?.cityCode ?? p.destination,
      details: {
        roomType: offer?.room?.typeEstimated?.category ?? "",
        board: offer?.boardType ?? "",
        cancellation: offer?.policies?.cancellation?.description?.text ?? "",
      },
    };
  });
}
