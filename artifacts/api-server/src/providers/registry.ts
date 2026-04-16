/**
 * Provider registry — aggregates all adapters into a single search interface.
 *
 * Usage:
 *   const registry = createRegistry();
 *   const results = await registry.search({ category: "flight", ... });
 *
 * The registry calls every configured adapter that supports the requested
 * category in parallel, then merges + sorts results by price ascending.
 */
import type {
  ProviderAdapter,
  ProviderMeta,
  ProviderResult,
  SearchParams,
  BookingRequest,
  BookingConfirmation,
} from "./types";
import { loadConfig } from "./config";
import { createTravelPayoutsAdapter } from "./travelpayouts";
import { createViatorAdapter } from "./viator";
import { createGetYourGuideAdapter } from "./getyourguide";
import { createKlookAdapter } from "./klook";
import { createAmadeusAdapter } from "./amadeus";
import { createSherpaAdapter } from "./sherpa";
import { createTicketmasterAdapter } from "./ticketmaster";
import { createOpenTableAdapter } from "./opentable";
import { createFluxirAdapter } from "./fluxir";

export interface ProviderRegistry {
  adapters: ProviderAdapter[];
  search(params: SearchParams): Promise<ProviderResult[]>;
  book(req: BookingRequest): Promise<BookingConfirmation>;
  listProviders(): ProviderMeta[];
}

export function createRegistry(): ProviderRegistry {
  const config = loadConfig();

  const adapters: ProviderAdapter[] = [
    createTravelPayoutsAdapter(config.travelpayouts),
    createViatorAdapter(config.viator),
    createGetYourGuideAdapter(config.getyourguide),
    createKlookAdapter(config.klook),
    createAmadeusAdapter(config.amadeus),
    createSherpaAdapter(config.sherpa),
    createTicketmasterAdapter(config.ticketmaster),
    createOpenTableAdapter(config.opentable),
    createFluxirAdapter(config.fluxir),
  ];

  async function search(params: SearchParams): Promise<ProviderResult[]> {
    const eligible = adapters.filter(
      (a) => a.meta.configured && a.meta.categories.includes(params.category),
    );

    if (eligible.length === 0) {
      return [];
    }

    const settled = await Promise.allSettled(
      eligible.map((a) =>
        a.search(params).catch((err) => {
          console.error(`[${a.meta.id}] search failed:`, err?.message ?? err);
          return [] as ProviderResult[];
        }),
      ),
    );

    const results: ProviderResult[] = [];
    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.push(...s.value);
      }
    }

    results.sort((a, b) => a.price - b.price);
    return results;
  }

  async function book(req: BookingRequest): Promise<BookingConfirmation> {
    const adapter = adapters.find((a) => a.meta.id === req.provider);
    if (!adapter) {
      return { success: false, provider: req.provider, providerRef: req.providerRef, error: `Unknown provider: ${req.provider}` };
    }
    if (!adapter.meta.configured) {
      return { success: false, provider: req.provider, providerRef: req.providerRef, error: `Provider ${req.provider} is not configured (missing API key)` };
    }
    if (!adapter.book) {
      return {
        success: true,
        provider: req.provider,
        providerRef: req.providerRef,
        bookingRef: `affiliate-${Date.now()}`,
        bookingUrl: `https://${req.provider}.com/book/${req.providerRef}`,
      };
    }
    return adapter.book(req);
  }

  function listProviders(): ProviderMeta[] {
    return adapters.map((a) => a.meta);
  }

  return { adapters, search, book, listProviders };
}
