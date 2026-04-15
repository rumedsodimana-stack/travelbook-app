# TravelBook — Project Overview

This document describes **what TravelBook is** — the product, the users, the scope. For working rules and engineering guardrails, see [`CLAUDE.md`](CLAUDE.md). For setup and commands, see [`README.md`](README.md).

---

## 1. Vision

A **social-first travel platform** — a travel diary that also books. The feed comes first; the booking flow falls out of it naturally. Trips are not invoices; they're keepsakes worth sharing.

The tagline: *your travels, in one pass.*

---

## 2. Two-sided product

TravelBook serves **two distinct audiences** from a single app:

### Consumers

- Solo travelers, couples, families, groups.
- Post trips, share itineraries, find travel buddies, book end-to-end.
- Carry every component of a trip (flight, hotel, activity, insurance, visa, dining, transport, event) in one **Travel Pass**.
- Discover what friends and strangers are doing — the social feed is the primary surface.

### Providers

Ten provider categories — each category is a first-class card type in the app:

| # | Category | Examples |
|---|---|---|
| 1 | Accommodations | Hotels, vacation rentals, boutiques, hostels |
| 2 | Transportation | Trains, buses, rental cars, taxis |
| 3 | Flights | Airlines, charters |
| 4 | Insurance | Travel, medical, cancellation |
| 5 | Visas | E-visas, visa processing, invitation letters |
| 6 | Entertainment | Shows, concerts, performances |
| 7 | Events | Festivals, conferences, sports |
| 8 | Activities | Tours, excursions, experiences |
| 9 | Dining | Restaurants, food tours, cooking classes |
| 10 | Tours | Multi-day packages, guided tours |

Providers list inventory, receive bookings, and appear inside passes as cards. The card types are pinned — adding an 11th is a product decision, not an engineering one.

---

## 3. Core concept — the Travel Pass

A **Travel Pass** is the unit of value. One trip = one pass. Each pass contains:

- **Identity:** title, destination, travel dates, status (`upcoming` · `active` · `archived`), privacy (`public` / `private`).
- **Cards:** one or more items of each provider category (see above).
- **Social fabric:** travel buddy requests, share count, inclusion in the owner's feed when shared publicly.
- **Financials:** total cost, itemized per card.

Passes are the spine connecting every other part of the app:

- **Home feed** — shared passes surface as embedded pass cards inside posts.
- **Planner** — the output of AI itinerary generation is a draft pass.
- **Passes tab** — the user's library of upcoming / active / archived passes.
- **Account** — payment methods, saved documents (passport, ID, visas) used to auto-fill and protect a pass.

---

## 4. Five-tab architecture

The app is organized around five tabs. This is **product-locked** — do not propose a 6th tab.

| # | Tab | What it does |
|---|-----|---|
| 1 | **Home** | Social feed. Stories bubbles at the top, post cards below. Posts can include a shared Travel Pass (tap → request to join). Actions: like, comment, join, share. |
| 2 | **Explore** | Discovery engine. Category filter bar (Beach, Adventure, Culture, Food, Wellness, City, Nature). Sections: Trending Experiences → Curated Packages → Top Destinations. |
| 3 | **Planner** | Two paths. (a) AI Trip Builder — a one-screen form that generates a complete itinerary. (b) Manual booking — category grid for picking flight/hotel/activity/etc. one at a time. |
| 4 | **Passes** | The user's passes library. Sections: Active Now → Upcoming Trips → Past Trips. Tap a pass for full-detail modal (summary, buddy requests, itinerary cards). |
| 5 | **Account** | Profile, stats, secure travel documents (passport / ID / visa vault), payment methods, app settings. |

---

## 5. Signature interactions

Four interactions carry the brand. Every new feature should reinforce — not dilute — these:

1. **Share a pass in the feed.** A post with an embedded Travel Pass tile. Friend taps → sees itinerary → requests to join. This is how buddy travel spreads.
2. **AI Trip Builder — complete, time-sensitive itinerary.** User enters destination + dates + budget + style + **purpose** + interests + optional free-text description. The AI generates the **entire trip**: visa, travel insurance, outbound flight, arrival airport transfer, hotel(s) for every night, inter-city transport, activities matched to purpose, dining reservations, events / entertainment, hotel-to-airport transfer, return flight. Every card is time-sensitive and sequenced. See [`docs/AI_PLANNER_SPEC.md`](docs/AI_PLANNER_SPEC.md).
3. **Swipe-as-deck alternatives.** Each card in the itinerary *is* a deck of alternatives. Swipe the card horizontally to page through other options (different flight times, different hotels) in place — the same slot, same position, new content. Haptic tick on commit. No cap on how many alternatives exist.
4. **Live timeline reflow.** Any change (swipe to alternative or × to remove) auto-adjusts every card below it on the timeline. Flight moves → transfer moves → hotel check-in moves. No overlaps, no orphans. Conflicts surface as toasts, not silent failures.
5. **Secure document vault.** Passport, ID, visa stored once — auto-populated into new passes and visa applications. Face-ID / PIN-gated access.

---

## 6. Technical architecture (short form — see CLAUDE.md for details)

- **Monorepo:** pnpm workspaces. Apps in `artifacts/`, shared libs in `lib/`.
- **Mobile (main product):** Expo SDK 54, React Native 0.81, React 19.1, Expo Router, TanStack Query, Reanimated, expo-haptics, @expo-google-fonts/inter.
- **API:** Express 5 + TypeScript, esbuild-bundled. Currently scaffold — health check only.
- **DB:** PostgreSQL + Drizzle ORM.
- **Validation:** Zod + drizzle-zod.
- **API contract:** OpenAPI spec in `lib/api-spec/` → Orval-generated React Query hooks + Zod schemas → consumed in the mobile app.
- **Design tokens:** `artifacts/mobile/constants/colors.ts`, accessed via `useColors()` hook. Full rules in [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md).

---

## 7. Product pillars (the "why" behind each tab)

| Pillar | Mechanism | Why it matters |
|---|---|---|
| **Trust** | Encrypted document vault, Zod-validated inputs, pnpm minimum release age (supply-chain defense). | Travelers hand over passports and money — the UX must feel safer than a bank. |
| **Warmth** | Cream backgrounds, hashed avatar colors, coral accent, Inter-only typography, haptics on every intent. | Travel is emotional. The product should feel like a journal, not a kiosk. |
| **Completeness** | Eight card types cover every trip component; AI Builder produces an end-to-end itinerary in one call. | Users shouldn't bounce between apps. One pass = one trip. |
| **Social** | Stories, feed, public passes, buddy requests. | Travel is better shared. The feed is the top funnel. |
| **Provider-native** | Every provider category is a first-class card type, not a generic "product." | Providers see their own category in the app — they're not a rounding-error tab inside a consumer app. |

---

## 8. Open scope questions (non-exhaustive)

Questions that still need product decisions. When any of these are answered, update this section and move the decision into CLAUDE.md.

- **Onboarding flow.** First-run experience is not yet designed. What does a brand-new user see? Sign-up first, or browse-as-guest?
- **Provider onboarding.** How do providers sign up, verify, list inventory? Separate app? Same app with a role switch? Web portal only?
- **Payments.** Stripe? Adyen? Split payments for group trips? Provider payouts?
- **Chat / buddy messaging.** Pass sharing → buddy request → … → how do matched travelers coordinate? In-app DMs? Hand off to WhatsApp?
- **Review / rating system.** Ratings show on Explore cards today (hardcoded). How are they collected? Who moderates?
- **Currency.** All prices are `USD` in the prototype. Multi-currency? Auto-convert? Per-market?
- **Offline mode.** A user in a foreign country on spotty wifi needs their pass to work. What's cached, what's not?
- **Push notifications.** Buddy requests, trip-start reminders, flight delays — which platforms, which cadence?

---

## 9. What TravelBook is NOT

To keep scope clean:

- ❌ **A hotel PMS.** Hotels listed inside TravelBook are providers, not operators. Hotel operations (housekeeping, maintenance, revenue management) are out of scope.
- ❌ **A CRM.** We track trips, not leads.
- ❌ **A B2B travel agency tool.** The consumer is always the primary user; providers are second-class in terms of UI chrome.
- ❌ **A closed marketplace.** Users can discover organically via the feed; it's not a transactional-only app.
- ❌ **A blog or CMS.** Posts are short, feed-native. Long-form travel writing is not the product.

---

## 10. Roadmap (working draft)

Rough phase ordering. Specifics get broken out into GitHub issues as they firm up.

### Phase 0 — foundation (current)

- Prototype renamed, documented, design system extracted.
- `CLAUDE.md`, `PROJECT.md`, `README.md`, `docs/UI_GUIDELINES.md`, `docs/UI_COMPONENT_LIBRARY.md` all in place.
- Dev server runs on iOS / Android / web.

### Phase 1 — planner depth + wiring

- **AI Planner upgrade** per [`docs/AI_PLANNER_SPEC.md`](docs/AI_PLANNER_SPEC.md):
  - `plannerEngine.ts` — pure timeline reflow / conflict detection.
  - `generateItinerary` emits all 12 card slots (visa, insurance, flights both ways, both airport transfers, hotels, inter-city transport, activities, dining, events).
  - `TravelCardView` refactored to swipe-as-deck (alt-chip carousel removed).
  - Purpose pill + free-text fields added to planner form.
- OpenAPI spec expanded beyond health check.
- Drizzle schema for: users, posts, stories, passes, cards, providers, buddies.
- AppContext + PlannerContext backed by real API.
- Onboarding + auth flow designed and implemented.

### Phase 2 — provider-side

- Provider onboarding + inventory listing.
- Payments + payouts.
- Booking confirmation → pass card creation.

### Phase 3 — social layer

- Real-time buddy messaging.
- Push notifications.
- Share-to-outside (link preview, OG image for a public pass).

### Phase 4 — polish

- Offline mode, localization, multi-currency, reviews, moderation tooling.

---

## 11. Relationship to other repos

TravelBook is a **standalone product**. It is explicitly **not** a fork, sibling, or module of:

- Orbit OS (hotel PMS) — different product, different users.
- Singularity Property OS — different product.
- Paraiso Ceylon Tours — different product (built for a specific client).

Any code, pattern, or asset that crossed over from another product must have been deliberately lifted into TravelBook with a note here. No silent reuse.

Archived predecessor: [`../travelbook-old/`](../travelbook-old/) — the previous Next.js web prototype. Preserved for history only; new work does not reference it.

---

*Updated 2026-04-15. Keep this document current with scope & product decisions — it's the source of truth for "what are we building?"*
