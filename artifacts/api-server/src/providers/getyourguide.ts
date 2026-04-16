import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

export function createGetYourGuideAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "getyourguide",
      name: "GetYourGuide",
      tier: "free",
      categories: ["activity"],
      docsUrl: "https://partner.getyourguide.com/",
      signupUrl: "https://partner.getyourguide.com/",
      description: "Commission-based affiliate: activities, tours, skip-the-line tickets",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        const url = new URL("https://api.getyourguide.com/1/tours");
        url.searchParams.set("q", params.destination);
        url.searchParams.set("date[gte]", params.startDate);
        url.searchParams.set("date[lte]", params.endDate);
        url.searchParams.set("currency", params.currency);
        url.searchParams.set("limit", "10");

        const res = await fetch(url.toString(), {
          headers: { "X-Access-Token": cfg.apiKey },
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { data?: { tours?: any[] } };

        return (data.data?.tours ?? []).map((t: any) => ({
          provider: "getyourguide",
          providerRef: String(t.tour_id ?? ""),
          type: "activity" as const,
          title: t.title ?? "Activity",
          subtitle: t.abstract?.slice(0, 80) ?? "",
          price: t.price?.values?.amount ?? 0,
          currency: params.currency,
          startTime: params.startDate,
          location: t.locations?.[0]?.name ?? params.destination,
          details: {
            duration: t.durations?.[0]?.duration ?? "Flexible",
            cancellation: t.free_cancellation ? "Free" : "Non-refundable",
          },
          rating: t.overall_rating,
          reviewCount: t.number_of_ratings,
          imageUrl: t.pictures?.[0]?.url,
          bookingUrl: t.url,
          affiliateLink: t.url,
        }));
      } catch (err) {
        console.error("[getyourguide] search error:", err);
        return [];
      }
    },
  };
}
