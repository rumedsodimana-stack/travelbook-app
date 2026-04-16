import type { ProviderAdapter, ProviderResult, SearchParams, BookingRequest, BookingConfirmation } from "./types";
import { isConfigured } from "./config";

export function createFluxirAdapter(cfg: { apiKey: string | null }): ProviderAdapter {
  const configured = isConfigured(cfg.apiKey);

  return {
    meta: {
      id: "fluxir",
      name: "Fluxir",
      tier: "paid",
      categories: ["visa"],
      docsUrl: "https://fluxir.com/api",
      signupUrl: "https://fluxir.com",
      description: "Full eVisa submission service — handles application processing end-to-end",
      configured,
    },

    async search(params: SearchParams): Promise<ProviderResult[]> {
      if (!configured || !cfg.apiKey) return [];
      try {
        // Fluxir eVisa availability check
        const res = await fetch("https://api.fluxir.com/v1/visa/availability", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination: params.destination,
            travelDate: params.startDate,
            nationality: params.filters?.nationality ?? "US",
          }),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { visas?: any[] };

        return (data.visas ?? []).map((v: any) => ({
          provider: "fluxir",
          providerRef: v.visaId ?? "",
          type: "visa" as const,
          title: v.name ?? `${params.destination} eVisa`,
          subtitle: `${v.type ?? "Tourist"} · ${v.validityDays ?? 30} days · ${v.processingTime ?? "3-5 business days"}`,
          price: v.totalFee ?? 65,
          currency: v.currency ?? params.currency,
          startTime: params.startDate,
          endTime: params.endDate,
          location: params.destination,
          details: {
            type: v.type ?? "Tourist",
            validity: `${v.validityDays ?? 30} days`,
            processing: v.processingTime ?? "3-5 days",
            entries: v.entries ?? "Single",
          },
          bookingUrl: v.applicationUrl ?? `https://fluxir.com/apply/${params.destination}`,
        }));
      } catch (err) {
        console.error("[fluxir] search error:", err);
        return [];
      }
    },

    async book(req: BookingRequest): Promise<BookingConfirmation> {
      if (!configured || !cfg.apiKey) {
        return { success: false, provider: "fluxir", providerRef: req.providerRef, error: "Not configured" };
      }
      try {
        const res = await fetch("https://api.fluxir.com/v1/visa/apply", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visaId: req.providerRef,
            applicantEmail: req.contactEmail,
            passportNumber: req.passportNumber,
            passengerNames: req.passengerNames,
          }),
        });
        if (!res.ok) {
          return { success: false, provider: "fluxir", providerRef: req.providerRef, error: `HTTP ${res.status}` };
        }
        const data = (await res.json()) as { applicationId?: string; statusUrl?: string };
        return {
          success: true,
          provider: "fluxir",
          providerRef: req.providerRef,
          bookingRef: data.applicationId,
          bookingUrl: data.statusUrl,
        };
      } catch (err) {
        return { success: false, provider: "fluxir", providerRef: req.providerRef, error: String(err) };
      }
    },
  };
}
