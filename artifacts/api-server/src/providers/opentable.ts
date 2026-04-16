import type { ProviderAdapter, ProviderResult, SearchParams, BookingRequest, BookingConfirmation } from "./types";
import { isConfigured } from "./config";

/**
 * OpenTable / TheFork adapter.
 *
 * OpenTable deprecated their public API — the modern path is through their
 * Affiliate Partnership program (application-only). TheFork (owned by
 * Tripadvisor) has a partner API for Europe.
 *
 * This adapter uses TheFork's partner API when configured, with OpenTable's
 * affiliate deep-link pattern as fallback for booking URLs.
 */
export function createOpenTableAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "opentable",
      name: "OpenTable / TheFork",
      tier: "paid",
      categories: ["dining"],
      docsUrl: "https://partner.thefork.com/",
      signupUrl: "https://partner.thefork.com/",
      description: "Restaurant reservations — OpenTable affiliate + TheFork partner API",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        // TheFork partner search
        const res = await fetch("https://api.thefork.com/api/1.0/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: params.destination,
            date: params.startDate,
            partySize: params.travelers,
            limit: 10,
          }),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { restaurants?: any[] };

        return (data.restaurants ?? []).map((r: any) => ({
          provider: "opentable",
          providerRef: String(r.id ?? ""),
          type: "dining" as const,
          title: r.name ?? "Restaurant",
          subtitle: `${r.cuisine_type ?? "Restaurant"} · ${r.price_range ?? "$$"}`,
          price: r.average_price ?? 0,
          currency: params.currency,
          startTime: `${params.startDate}T19:30:00Z`,
          endTime: `${params.startDate}T21:30:00Z`,
          location: r.address ?? params.destination,
          details: {
            cuisine: r.cuisine_type ?? "",
            priceRange: r.price_range ?? "$$",
            dress: r.dress_code ?? "Casual",
          },
          rating: r.rate,
          reviewCount: r.review_count,
          imageUrl: r.main_photo_url,
          bookingUrl: r.booking_url ?? `https://www.opentable.com/r/${r.id}`,
        }));
      } catch (err) {
        console.error("[opentable] search error:", err);
        return [];
      }
    },

    async book(req: BookingRequest): Promise<BookingConfirmation> {
      if (!configured || !cfg.apiKey) {
        return { success: false, provider: "opentable", providerRef: req.providerRef, error: "Not configured" };
      }
      try {
        const res = await fetch("https://api.thefork.com/api/1.0/booking", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId: req.providerRef,
            partySize: req.travelers,
            email: req.contactEmail,
            phone: req.contactPhone,
          }),
        });
        if (!res.ok) {
          return { success: false, provider: "opentable", providerRef: req.providerRef, error: `HTTP ${res.status}` };
        }
        const data = (await res.json()) as { bookingId?: string; confirmationUrl?: string };
        return {
          success: true,
          provider: "opentable",
          providerRef: req.providerRef,
          bookingRef: data.bookingId,
          bookingUrl: data.confirmationUrl,
        };
      } catch (err) {
        return { success: false, provider: "opentable", providerRef: req.providerRef, error: String(err) };
      }
    },
  };
}
