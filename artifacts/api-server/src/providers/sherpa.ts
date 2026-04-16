import type { ProviderAdapter, ProviderResult, SearchParams } from "./types";
import { isConfigured } from "./config";

export function createSherpaAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "sherpa",
      name: "Sherpa°",
      tier: "paid",
      categories: ["visa"],
      docsUrl: "https://joinsherpa.com/api",
      signupUrl: "https://joinsherpa.com/api",
      description: "Visa & travel restriction requirements checker — pay per API call",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        // Sherpa Restrictions API: checks what documents/restrictions apply
        const url = new URL("https://requirements-api.joinsherpa.com/v3/restrictions");
        url.searchParams.set("destination", params.destination);
        url.searchParams.set("departure", params.startDate);

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { data?: any[] };

        return (data.data ?? []).map((req: any) => ({
          provider: "sherpa",
          providerRef: req.id ?? "",
          type: "visa" as const,
          title: req.category === "VISA" ? `Visa for ${params.destination}` : `${req.category ?? "Document"} Required`,
          subtitle: req.subCategory ?? req.summary?.slice(0, 80) ?? "Travel requirement",
          price: req.category === "VISA" ? 35 : 0,
          currency: params.currency,
          startTime: params.startDate,
          endTime: params.endDate,
          location: params.destination,
          details: {
            type: req.subCategory ?? req.category ?? "",
            requirement: req.isRequired ? "Required" : "Optional",
            details: req.summary?.slice(0, 100) ?? "",
          },
          bookingUrl: `https://apply.joinsherpa.com/travel-restrictions/${params.destination}`,
        }));
      } catch (err) {
        console.error("[sherpa] search error:", err);
        return [];
      }
    },
  };
}
