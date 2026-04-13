# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a full-featured travel social platform mobile app (TravelBook) built with Expo, plus a shared Express API server.

## Apps

### TravelBook Mobile App (artifacts/mobile)
A comprehensive travel social platform similar to Instagram, serving:
- **Consumers**: Solo travelers, couples, families, groups
- **Providers**: 10 categories (accommodations, transportation, flights, insurance, visas, entertainment, events, activities, dining, tours)

**5 Tabs:**
1. **Home** — Social feed with Stories bubbles + posts (likes, comments, Travel Pass sharing, Find Buddy)
2. **Explore** — Discovery engine with categories, trending experiences, curated packages, destinations
3. **Planner** — AI Trip Builder (generates full itinerary: flight, hotel, insurance, activities) + manual booking per category
4. **Passes** — Travel Pass hub (view, share, expand full itinerary, buddy requests, archive)
5. **Account** — Profile, stats, secure travel documents (passport/ID/visa), payment methods, settings

**State Management:**
- `context/AppContext.tsx` — User profile, posts, stories, documents
- `context/PlannerContext.tsx` — Travel passes, AI plan generation, card CRUD

**Key Components:**
- `components/StoryBubble.tsx` — Story circles
- `components/PostCard.tsx` — Feed posts with like/share/buddy actions
- `components/TravelCardView.tsx` — Flight/hotel/activity cards (styled per type)
- `components/ExploreCard.tsx` — Explore/destination cards
- `components/PassCard.tsx` — Travel Pass overview cards

**Theme:** Deep teal (#0E7C7B) primary, coral (#FF6B6B) accent, warm sand backgrounds

### API Server (artifacts/api-server)
Express 5 + TypeScript backend. Currently minimal (health check). Extend with routes as needed.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo (SDK 54), Expo Router, React Native
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (configured, not yet used by mobile)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
