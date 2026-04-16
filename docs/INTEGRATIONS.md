# TravelBook API Integrations Guide

This document covers every third-party API integrated into TravelBook, how to get API keys, and how to configure them.

> **Architecture:** The mobile app NEVER calls third-party APIs directly. All calls go through the `api-server` (`artifacts/api-server/`), which proxies to providers via adapter modules in `src/providers/`. The mobile app uses `lib/providerClient.ts` to talk to the unified `/v1/search` and `/v1/book` endpoints.

---

## Quick setup

1. Sign up for the APIs you want (see table below).
2. Create a `.env` file in `artifacts/api-server/`:

```bash
# artifacts/api-server/.env

# Free tier (commission-based) — start here
TRAVELPAYOUTS_TOKEN=your_token_here
VIATOR_API_KEY=your_key_here
GETYOURGUIDE_API_KEY=your_key_here
KLOOK_AFFILIATE_ID=your_id_here
TICKETMASTER_API_KEY=your_key_here

# Paid tier
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
SHERPA_API_KEY=your_key_here
FLUXIR_API_KEY=your_key_here
OPENTABLE_API_KEY=your_key_here

# AI (for /v1/plan LLM suggestions)
ANTHROPIC_API_KEY=your_key_here
```

3. Start the api-server: `corepack pnpm --filter @workspace/api-server run dev`
4. Check which providers are active: `curl http://localhost:3001/v1/providers`

Any provider without a key is **silently skipped** — the app works with whatever is configured.

---

## Provider reference

### Free tier (commission-based)

| Provider | Env var | Categories | Signup | Notes |
|---|---|---|---|---|
| **TravelPayouts** | `TRAVELPAYOUTS_TOKEN` | flights, hotels, tours, cars | [travelpayouts.com/programs](https://www.travelpayouts.com/programs) | Affiliate network. Commission on bookings via deep links. Flight search via Aviasales API, hotels via HotelLook. |
| **Viator** | `VIATOR_API_KEY` | activities, tours | [viator.com/partner](https://www.viator.com/partner) | Tripadvisor-owned. 8% commission. Huge inventory. Partner API (apply for access). |
| **GetYourGuide** | `GETYOURGUIDE_API_KEY` | activities, tours | [partner.getyourguide.com](https://partner.getyourguide.com/) | European-focused but global. Partner program. Similar to Viator. |
| **Klook** | `KLOOK_AFFILIATE_ID` | activities (Asia focus) | [affiliate.klook.com](https://affiliate.klook.com) | Asia-Pacific specialist. Affiliate program, deep links. |
| **Ticketmaster** | `TICKETMASTER_API_KEY` | events, concerts | [developer.ticketmaster.com](https://developer.ticketmaster.com) | Free tier: 5000 calls/day. Discovery API for event search. Global. |

### Paid tier (usage-based)

| Provider | Env var(s) | Categories | Signup | Pricing |
|---|---|---|---|---|
| **Amadeus** | `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` | flights, hotels, insurance | [developers.amadeus.com](https://developers.amadeus.com/register) | **Free sandbox** (test data). Production: pay per transaction. OAuth2 auth. |
| **Sherpa°** | `SHERPA_API_KEY` | visa requirements | [joinsherpa.com/api](https://joinsherpa.com/api) | Pay per call. Checks visa/travel restriction requirements for any country pair. |
| **Fluxir** | `FLUXIR_API_KEY` | visa (eVisa submission) | [fluxir.com](https://fluxir.com) | Full eVisa processing service. Handles application end-to-end. Pay per application. |
| **OpenTable / TheFork** | `OPENTABLE_API_KEY` | dining reservations | [partner.thefork.com](https://partner.thefork.com/) | TheFork partner API (Europe). OpenTable's public API is deprecated — use their affiliate program for US. |

### AI

| Provider | Env var | Purpose | Signup |
|---|---|---|---|
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | LLM-powered trip suggestions (POST /v1/plan) | [console.anthropic.com](https://console.anthropic.com) |

---

## API endpoints

All endpoints are on the api-server (default: `http://localhost:3001`).

### `POST /v1/search` — unified search

Searches all configured providers for a given card type.

```json
// Request
{
  "category": "flight",
  "destination": "Tokyo",
  "startDate": "2026-06-01",
  "endDate": "2026-06-10",
  "travelers": 2,
  "currency": "USD",
  "budget": 3000,
  "filters": { "origin": "JFK" }
}

// Response
{
  "results": [
    {
      "provider": "amadeus",
      "providerRef": "offer-123",
      "type": "flight",
      "title": "JFK → NRT",
      "subtitle": "NH010 · Non-stop",
      "price": 920,
      "currency": "USD",
      "startTime": "2026-06-01T10:00:00Z",
      "endTime": "2026-06-01T22:00:00Z",
      "location": "JFK",
      "details": { "airline": "ANA", "class": "Economy", "duration": "14h" },
      "bookingUrl": "https://..."
    }
  ],
  "providers": ["amadeus", "travelpayouts"],
  "totalResults": 8,
  "category": "flight",
  "destination": "Tokyo"
}
```

### `POST /v1/book` — book an item

```json
// Request
{
  "provider": "amadeus",
  "providerRef": "offer-123",
  "type": "flight",
  "travelers": 2,
  "contactEmail": "alex@travelbook.com",
  "passengerNames": ["Alex Rivera", "Mia Chen"]
}

// Response
{
  "success": true,
  "provider": "amadeus",
  "providerRef": "offer-123",
  "bookingRef": "AMADEUS-ABC123",
  "bookingUrl": "https://..."
}
```

### `GET /v1/providers` — list all providers

```json
{
  "total": 9,
  "configured": 3,
  "providers": [
    {
      "id": "travelpayouts",
      "name": "TravelPayouts",
      "tier": "free",
      "categories": ["flight", "hotel", "activity", "transport"],
      "configured": true,
      "description": "Commission-based affiliate..."
    }
  ]
}
```

### `GET /v1/search/categories` — available categories

```json
{
  "categories": {
    "flight": ["TravelPayouts", "Amadeus"],
    "hotel": ["TravelPayouts", "Amadeus"],
    "activity": ["Viator", "GetYourGuide", "Klook"],
    "event": ["Ticketmaster"],
    "visa": ["Sherpa°", "Fluxir"],
    "dining": ["OpenTable / TheFork"]
  }
}
```

### `POST /v1/plan` — AI trip suggestions (LLM)

See [`CLAUDE.md` §C1](../CLAUDE.md) — returns natural-language insights, not structured bookings. Uses Anthropic Claude.

---

## How the mobile app uses providers

### Explore tab
When the user searches or browses, the Explore tab calls `/v1/search` with the selected category. Results are mapped to `ExploreCard` items and rendered in the existing UI. No mock data needed if at least one provider is configured.

### Planner manual booking grid
When the user taps a category (Flights, Hotels, Activities, etc.), the category-search modal calls `/v1/search` with that category. Results replace the mock `MOCK_RESULTS_BY_CATEGORY` data.

### AI Trip Builder
`generateItinerary` calls `/v1/plan` for LLM suggestions AND `/v1/search` per card type to find real alternatives. The scripted `buildFullItinerary()` output is augmented with real provider results as alternatives on each card.

### Pass booking
When the user taps "Confirm & Create Travel Pass", each card's `provider` + `providerRef` are used to call `/v1/book`. For affiliate providers, the response includes a `bookingUrl` that opens in a WebView.

---

## Adding a new provider

1. Create `artifacts/api-server/src/providers/<name>.ts` implementing `ProviderAdapter`.
2. Add the env var to `config.ts` → `ProviderConfig`.
3. Import and instantiate in `registry.ts` → `createRegistry()`.
4. Add the env var to the `.env` example above.
5. Update this file's provider table.
6. Run typecheck: `corepack pnpm --filter @workspace/api-server run typecheck`.

---

## Rate limiting & caching (future)

Currently, every search hits the provider API directly. For production:

- **Cache:** add a Redis/in-memory cache keyed by `(provider, category, destination, dates)` with a 15-minute TTL.
- **Rate limit:** per-user rate limiting on `/v1/search` (e.g. 30 req/min) to prevent abuse.
- **Circuit breaker:** if a provider returns 5xx errors 3 times in 60 seconds, disable it for 5 minutes.

These are documented here so they don't get forgotten. Implement when you move to production deployment.

---

*Updated 2026-04-16. Keep this file in sync with any new provider added.*
