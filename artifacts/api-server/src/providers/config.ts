/**
 * Provider configuration — reads API keys from environment variables.
 *
 * Every provider has a corresponding env var. If the var is not set, the
 * provider is marked as `configured: false` and the unified search skips it
 * gracefully. The app never breaks from a missing key — it just has fewer
 * results from fewer providers.
 *
 * See docs/INTEGRATIONS.md for signup URLs and key setup instructions.
 */

export interface ProviderConfig {
  travelpayouts: { apiToken: string | null };
  viator: { apiKey: string | null };
  getyourguide: { apiKey: string | null };
  klook: { affiliateId: string | null };
  amadeus: { clientId: string | null; clientSecret: string | null };
  sherpa: { apiKey: string | null };
  fluxir: { apiKey: string | null };
  ticketmaster: { apiKey: string | null };
  opentable: { apiKey: string | null };
  anthropic: { apiKey: string | null };
}

function env(key: string): string | null {
  return process.env[key] ?? null;
}

export function loadConfig(): ProviderConfig {
  return {
    travelpayouts: { apiToken: env("TRAVELPAYOUTS_TOKEN") },
    viator: { apiKey: env("VIATOR_API_KEY") },
    getyourguide: { apiKey: env("GETYOURGUIDE_API_KEY") },
    klook: { affiliateId: env("KLOOK_AFFILIATE_ID") },
    amadeus: {
      clientId: env("AMADEUS_CLIENT_ID"),
      clientSecret: env("AMADEUS_CLIENT_SECRET"),
    },
    sherpa: { apiKey: env("SHERPA_API_KEY") },
    fluxir: { apiKey: env("FLUXIR_API_KEY") },
    ticketmaster: { apiKey: env("TICKETMASTER_API_KEY") },
    opentable: { apiKey: env("OPENTABLE_API_KEY") },
    anthropic: { apiKey: env("ANTHROPIC_API_KEY") },
  };
}

export function isConfigured(value: string | null): boolean {
  return value !== null && value.length > 0;
}
