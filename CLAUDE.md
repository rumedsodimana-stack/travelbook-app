# TravelBook — Working Rules for Claude

This file is the **project constitution** for TravelBook. Read it at the start of every session before touching any code. The rules here are non-negotiable for this project.

> **TravelBook is its own product.** It is NOT Orbit OS, NOT Singularity, NOT Paraiso Tours. Do not import rules, tokens, components, or patterns from any other project in this workspace. The prototype that seeded this project is the source of truth — everything flows from `artifacts/mobile/`.

---

## 1. What TravelBook is

A social-first travel platform — the product serves two sides:

- **Consumers:** solo travelers, couples, families, groups. They post trips, share Travel Passes, find buddies, and book.
- **Providers:** 10 categories — accommodations, transportation, flights, insurance, visas, entertainment, events, activities, dining, tours.

**Five tabs — this is the spine of the app, do not invent new tabs:**

| # | Tab | Route | Purpose |
|---|-----|-------|---------|
| 1 | **Home** | `app/(tabs)/index.tsx` | Stories + Feed (posts with like, comment, share Travel Pass, Find Buddy) |
| 2 | **Explore** | `app/(tabs)/explore.tsx` | Discovery — categories, trending experiences, curated packages, top destinations |
| 3 | **Planner** | `app/(tabs)/planner.tsx` | AI Trip Builder (full itinerary generation) + manual booking per category |
| 4 | **Passes** | `app/(tabs)/passes.tsx` | Travel Pass hub — view, share, expand full itinerary, buddy requests, archive |
| 5 | **Account** | `app/(tabs)/account.tsx` | Profile, stats, secure travel documents (passport / ID / visa), payments, settings |

A Travel Pass is the core unit — a bundle of cards (flight, hotel, activity, insurance, visa, dining, transport, event) representing one trip. Passes have statuses (`upcoming`, `active`, `archived`), can be public/private, and accept buddy requests.

---

## 2. Repository layout (pnpm workspace monorepo)

```
travelbook/
├── artifacts/
│   ├── mobile/              ← THE product: Expo / React Native consumer app
│   ├── api-server/          ← Express 5 + TypeScript backend (health check only today)
│   └── mockup-sandbox/      ← Vite web mockup surface (design-iteration scratchpad)
├── lib/
│   ├── api-client-react/    ← Generated React Query hooks (from api-spec)
│   ├── api-spec/            ← OpenAPI spec — the source of truth for API contracts
│   ├── api-zod/             ← Generated Zod schemas (from api-spec)
│   └── db/                  ← Drizzle ORM + PostgreSQL schema
├── scripts/                 ← Repo-wide scripts (post-merge etc.)
├── pnpm-workspace.yaml      ← Workspace config + pnpm catalog (shared versions)
├── tsconfig.base.json       ← Base TS config, extended by each package
└── CLAUDE.md                ← This file
```

- **Never install a package into a single artifact without checking the catalog first.** Versions for `react`, `tailwindcss`, `@tanstack/react-query`, `framer-motion`, `lucide-react`, `zod` etc. are pinned in `pnpm-workspace.yaml > catalog`. Use `"package": "catalog:"` in the consuming `package.json`.
- **Minimum release age is 1440 minutes (1 day).** Do not disable this in `pnpm-workspace.yaml` without explicit approval — it is a supply-chain defense. To install something published in the last 24 hours, add it to `minimumReleaseAgeExclude` only if it comes from a trusted publisher.
- **Platform binary overrides.** The workspace is pinned to linux-x64 (Replit). The `overrides:` block in `pnpm-workspace.yaml` blocks other platforms to keep installs fast. Do not touch this unless you know why.

---

## 3. Stack — exact versions, no drift

| Layer | Tech | Version |
|-------|------|---------|
| Monorepo | pnpm workspaces | 10+ |
| Node | | 24 |
| TypeScript | | ~5.9.2 |
| **Mobile** | Expo SDK | ~54 |
| | React Native | 0.81.5 |
| | React | 19.1.0 (pinned — Expo requirement) |
| | Expo Router | ~6.0.17 |
| | React Native Reanimated | ~4.1.1 |
| | React Query | catalog (^5.90.21) |
| | Zod | catalog (^3.25.76) |
| | `@expo-google-fonts/inter` | Inter 400 / 500 / 600 / 700 |
| | `@expo/vector-icons` | Ionicons, Feather, MaterialCommunityIcons |
| | `expo-symbols` | SF Symbols on iOS |
| | `expo-blur`, `expo-glass-effect`, `expo-haptics`, `expo-linear-gradient` | iOS-native feel |
| **API** | Express | ^5 |
| | esbuild | 0.27.3 (CJS bundle) |
| **DB** | PostgreSQL + Drizzle ORM | ^0.45.1 |
| **Validation** | Zod | `zod/v4` + `drizzle-zod` |
| **Codegen** | Orval (OpenAPI → hooks + Zod) | |

- **Never upgrade React or React Native.** Expo 54 pins them.
- **Never add a second icon library.** Use `@expo/vector-icons` + `expo-symbols` only.
- **Never add `framer-motion` to the mobile app.** It is a web-only dependency in the catalog. Use `react-native-reanimated` for mobile animation.

---

## 4. Build commands

```bash
# From repo root
pnpm install                              # install all workspace deps
pnpm run typecheck                        # full typecheck (all packages)
pnpm run build                            # typecheck + build all

# Mobile (artifacts/mobile)
pnpm --filter @workspace/mobile run dev          # Expo dev server
pnpm --filter @workspace/mobile run typecheck    # mobile-only typecheck
pnpm --filter @workspace/mobile run build        # production bundle
pnpm --filter @workspace/mobile run serve        # serve built bundle

# API (artifacts/api-server)
pnpm --filter @workspace/api-server run dev

# DB
pnpm --filter @workspace/db run push             # push Drizzle schema (dev only)

# API spec regeneration
pnpm --filter @workspace/api-spec run codegen    # regenerate hooks + Zod
```

Prefer the filtered commands over `cd`-ing into artifact directories.

---

## 5. Respect the prototype UI — the design system

- **The UI of the prototype is the source of truth.** Study [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md) and [`docs/UI_COMPONENT_LIBRARY.md`](docs/UI_COMPONENT_LIBRARY.md) before writing any UI code.
- **All colors come from [`artifacts/mobile/constants/colors.ts`](artifacts/mobile/constants/colors.ts) via the [`useColors()`](artifacts/mobile/hooks/useColors.ts) hook.** Never hardcode a hex value inside a screen or component — import the token.
- **All typography comes from the Inter font family** loaded in [`app/_layout.tsx`](artifacts/mobile/app/_layout.tsx): `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`. Reference the exact family name in `fontFamily` — do not rely on `fontWeight`.
- **The default radius is 12**, exposed as `colors.radius`. Larger surfaces (explore cards, pass cards, trip cards) use 16 / 18 / 20 — each is already established in the prototype. Do not invent a new radius without checking.
- **No new icon sets.** Reuse existing `CARD_CONFIGS` in [`components/TravelCardView.tsx`](artifacts/mobile/components/TravelCardView.tsx) when mapping card types to icons/colors.

Full rules: [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md).

---

## 6. Reuse before you build

Before you create any new file in `artifacts/mobile/`, check if it already exists:

1. **Components** → [`artifacts/mobile/components/`](artifacts/mobile/components/) — `PostCard`, `StoryBubble`, `ExploreCard`, `PassCard`, `TravelCardView`, `ErrorBoundary`, `ErrorFallback`, `KeyboardAwareScrollViewCompat`.
2. **State** → [`artifacts/mobile/context/`](artifacts/mobile/context/) — `AppContext` (user, posts, stories, documents) and `PlannerContext` (passes, plan generation, card CRUD). If your feature needs user, posts, passes, or cards — use these; do not fork.
3. **Hooks** → [`artifacts/mobile/hooks/`](artifacts/mobile/hooks/) — `useColors`. Add new hooks here, next to `useColors.ts`, never inline in a screen.
4. **Constants** → [`artifacts/mobile/constants/`](artifacts/mobile/constants/) — `colors.ts`. Add new tokens here, never in-line.
5. **Routes** → [`artifacts/mobile/app/`](artifacts/mobile/app/) — one file per route. `(tabs)/` is the tab group. Modals and detail screens go at the root of `app/` as separate routes.

If something similar already exists → **extend it, do not duplicate**. Duplication is the #1 risk in a fast-moving monorepo.

Search checklist before creating anything new:

```bash
# From repo root
grep -rn "ComponentName\|actionVerb\|modelName" artifacts/mobile/
grep -rn "useSomething" artifacts/mobile/hooks
grep -rn "createX\|updateX\|fetchX" artifacts/mobile/context
```

---

## 7. API contracts

- **The OpenAPI spec in `lib/api-spec/` is canonical.** Change the spec first, regenerate, then adapt callers. Never write an `fetch()` call against a URL that isn't in the spec.
- **Use generated hooks from `@workspace/api-client-react`.** Never hand-roll React Query hooks for server data.
- **Use Zod schemas from `@workspace/api-zod`** for runtime validation at trust boundaries (user input, API responses). Trust internal TS types — don't double-validate.
- **Drizzle schema in `lib/db/`** is the DB source of truth. Use `drizzle-zod` to derive validation from the schema when possible.

---

## 8. Platform awareness

The mobile app targets **iOS, Android, and web** (React Native Web).

- **iOS** gets the premium treatment: SF Symbols (`SymbolView`), `BlurView` tab bar, liquid-glass detection (`isLiquidGlassAvailable()`), native `NativeTabs` when available. Haptics via `expo-haptics`.
- **Android** falls back to `@expo/vector-icons` Feather/Ionicons/MCI equivalents. No blur unless you explicitly test it.
- **Web** gets a solid-colored tab bar and web-specific safe-area padding (see `Platform.OS === "web"` checks in each tab screen).

When adding a new tab or screen, handle all three branches. Copy the pattern from [`app/(tabs)/_layout.tsx`](artifacts/mobile/app/(tabs)/_layout.tsx) and from any of the existing tab screens (`index.tsx`, `explore.tsx`, `planner.tsx`).

---

## 9. State management rules

Two contexts cover everything today:

- **`AppContext`** — user profile, posts, stories, saved travel documents. Mutations: `toggleLike`, `markStorySeen`, etc.
- **`PlannerContext`** — travel passes, active plan, AI itinerary generation, card CRUD, trip sharing, buddy requests.

Rules:
- **Put domain mutations in the context, not in the screen.** A screen calls `planner.removeCard(id)`, never mutates state directly.
- **Do not add a third context unless the new domain is truly orthogonal.** Adding a context means adding a provider in [`app/_layout.tsx`](artifacts/mobile/app/_layout.tsx) — keep the provider tree shallow.
- **Server state lives in React Query**, not in context. Context is for local/session state.

---

## 10. Definition of "done" for every change

A change is only complete when all of these are true:

- [ ] The prototype UI is respected — no new visual language.
- [ ] No duplication of existing components, hooks, context methods, or utilities.
- [ ] Every color flows through `useColors()`. No hardcoded hex in new code.
- [ ] Every font uses `fontFamily: "Inter_XXX"`. No raw `fontWeight`.
- [ ] `pnpm run typecheck` passes clean.
- [ ] iOS, Android, and web branches all handled where relevant.
- [ ] `README.md` is updated if user-visible behavior or setup changed.
- [ ] Haptic feedback added on every destructive / confirming / selection action that already has a precedent (see `PostCard`, `PassCard`, `TravelCardView`).

---

## 11. Pre-flight checklist (before writing UI code)

```
[ ] I opened docs/UI_GUIDELINES.md and docs/UI_COMPONENT_LIBRARY.md.
[ ] I searched artifacts/mobile/components/ for an existing component that does this.
[ ] I searched artifacts/mobile/app/(tabs)/ for a similar screen pattern.
[ ] Every color I will use comes from useColors() — no hardcoded hex.
[ ] Every font uses fontFamily: "Inter_XXX" — no bare fontWeight.
[ ] My spacing values come from the established scale (6, 8, 10, 12, 14, 16).
[ ] My radius comes from the established scale (12, 16, 18, 20) or colors.radius.
[ ] Icons come from @expo/vector-icons (+ expo-symbols on iOS).
[ ] State lives in AppContext or PlannerContext, not in component-level useState for shared data.
[ ] Haptics added on destructive or confirming actions.
[ ] Platform branches (iOS / Android / web) handled where applicable.
[ ] tsc --noEmit passes.
```

If any box is unchecked → **stop and fix before continuing**.

---

## 12. Archive — the old project

The previous Next.js-based TravelBook web app is preserved at [`~/Desktop/TravelBook/travelbook-old/`](~/Desktop/TravelBook/travelbook-old/). It has uncommitted Supabase-integration work from the previous session. Do not reference it in new code — it is a historical artifact only. GitHub remote: `rumedsodimana-stack/travelbook` (master branch).

---

*Established 2026-04-15. This file overrides any default behavior. When in doubt, re-read this file.*
