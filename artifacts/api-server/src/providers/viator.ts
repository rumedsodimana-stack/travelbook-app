import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

export function createViatorAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "viator",
      name: "Viator",
      tier: "free",
      categories: ["activity"],
      docsUrl: "https://docs.viator.com",
      signupUrl: "https://www.viator.com/partner",
      description: "Commission-based affiliate: activities, tours, experiences worldwide",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        const res = await fetch("https://api.viator.com/partner/products/search", {
          method: "POST",
          headers: {
            "exp-api-key": cfg.apiKey,
            "Accept-Language": "en-US",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filtering: { destination: params.destination },
            sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
            pagination: { offset: 0, limit: 10 },
            currency: params.currency,
          }),
        });

        if (!res.ok) return [];
        const data = (await res.json()) as { products?: any[] };

        return (data.products ?? []).map((p: any) => ({
          provider: "viator",
          providerRef: p.productCode ?? "",
          type: "activity" as const,
          title: p.title ?? "Activity",
          subtitle: p.description?.slice(0, 80) ?? "",
          price: p.pricing?.summary?.fromPrice ?? 0,
          currency: params.currency,
          startTime: params.startDate,
          location: params.destination,
          details: {
            duration: p.duration?.fixedDurationInMinutes ? `${Math.round(p.duration.fixedDurationInMinutes / 60)}h` : "Flexible",
            rating: String(p.reviews?.combinedAverageRating?.toFixed(1) ?? ""),
          },
          rating: p.reviews?.combinedAverageRating,
          reviewCount: p.reviews?.totalReviews,
          imageUrl: p.images?.[0]?.variants?.[0]?.url,
          bookingUrl: `https://www.viator.com/tours/${p.productCode}`,
          affiliateLink: `https://www.viator.com/tours/${p.productCode}`,
        }));
      } catch (err) {
        console.error("[viator] search error:", err);
        return [];
      }
    },
  };
}
