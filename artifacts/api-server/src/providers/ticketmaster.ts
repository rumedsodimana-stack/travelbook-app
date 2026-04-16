import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

export function createTicketmasterAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "ticketmaster",
      name: "Ticketmaster",
      tier: "paid",
      categories: ["event"],
      docsUrl: "https://developer.ticketmaster.com",
      signupUrl: "https://developer.ticketmaster.com",
      description: "Events, concerts, sports, theatre — free tier available (5000 calls/day)",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
        url.searchParams.set("apikey", cfg.apiKey);
        url.searchParams.set("city", params.destination);
        url.searchParams.set("startDateTime", `${params.startDate}T00:00:00Z`);
        url.searchParams.set("endDateTime", `${params.endDate}T23:59:59Z`);
        url.searchParams.set("size", "10");
        url.searchParams.set("sort", "date,asc");

        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const data = (await res.json()) as { _embedded?: { events?: any[] } };

        return (data._embedded?.events ?? []).map((e: any) => ({
          provider: "ticketmaster",
          providerRef: e.id ?? "",
          type: "event" as const,
          title: e.name ?? "Event",
          subtitle: e.classifications?.[0]?.genre?.name ?? e._embedded?.venues?.[0]?.name ?? "",
          price: e.priceRanges?.[0]?.min ?? 0,
          currency: e.priceRanges?.[0]?.currency ?? params.currency,
          startTime: e.dates?.start?.dateTime ?? params.startDate,
          endTime: e.dates?.end?.dateTime,
          location: e._embedded?.venues?.[0]?.name ?? params.destination,
          details: {
            venue: e._embedded?.venues?.[0]?.name ?? "",
            genre: e.classifications?.[0]?.genre?.name ?? "",
            segment: e.classifications?.[0]?.segment?.name ?? "",
          },
          imageUrl: e.images?.[0]?.url,
          bookingUrl: e.url,
          affiliateLink: e.url,
        }));
      } catch (err) {
        console.error("[ticketmaster] search error:", err);
        return [];
      }
    },
  };
}
