import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

export function createKlookAdapter(cfg: { affiliateId: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.affiliateId);

  return {
    meta: {
      id: "klook",
      name: "Klook",
      tier: "free",
      categories: ["activity"],
      docsUrl: "https://affiliate.klook.com",
      signupUrl: "https://affiliate.klook.com",
      description: "Commission-based affiliate: Asia-focused activities, tickets, transfers",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.affiliateId) return [];
      try {
        const url = new URL("https://www.klook.com/v1/affiliateapi/activities");
        url.searchParams.set("affiliate_id", cfg.affiliateId);
        url.searchParams.set("city", params.destination);
        url.searchParams.set("limit", "10");

        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const data = (await res.json()) as { result?: any[] };

        return (data.result ?? []).map((a: any) => ({
          provider: "klook",
          providerRef: String(a.activity_id ?? a.id ?? ""),
          type: "activity" as const,
          title: a.name ?? a.title ?? "Activity",
          subtitle: a.introduction?.slice(0, 80) ?? "",
          price: a.retail_price ?? a.price ?? 0,
          currency: a.currency_code ?? params.currency,
          startTime: params.startDate,
          location: a.city_name ?? params.destination,
          details: {
            category: a.category_name ?? "",
            duration: a.duration ?? "Flexible",
          },
          rating: a.score,
          reviewCount: a.review_total_count,
          imageUrl: a.image_url,
          affiliateLink: a.deeplink ?? `https://www.klook.com/activity/${a.activity_id}`,
        }));
      } catch (err) {
        console.error("[klook] search error:", err);
        return [];
      }
    },
  };
}
