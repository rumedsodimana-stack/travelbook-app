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
| | `@expo-google-fonts/source-serif-4` | Source Serif 4: 400 / 500 / 600 |
| | `@expo-google-fonts/geist` | Geist: 400 / 500 / 600 |
| | `@expo-google-fonts/geist-mono` | Geist Mono: 400 / 500 |
| | `@expo/vector-icons` | Ionicons, Feather, MaterialCommunityIcons |
| | `expo-symbols` | SF Symbols on iOS |
| | `expo-blur`, `expo-glass-effect`, `expo-haptics`, `expo-linear-gradient` | iOS-native feel |
| **API** | Express | ^5 |
| | esbuild | 0.27.3 (CJS bundle) |
| **DB** | PostgreSQL + Drizzle ORM | ^0.45.1 |
| **Validation** | Zod | `zod/v4` + `drizzle-zod` |
| **Codegen** | Orval (OpenAPI → hooks + Zod) | |

- **Never upgrade React or React Native.** Expo 54 pins them.
- **Stroke SVG icons via `react-native-svg`** are the default (see `components/primitives/TabIcon.tsx`). `@expo/vector-icons` and `expo-symbols` remain available for infrastructure (error states, conflict toasts) but new product icons should be hand-crafted stroke SVGs from the spec.
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

## 5. Design system — the new direction (as of 2026-05-26)

The visual language is documented in the design handoff at **`~/Downloads/design_handoff_travelbook/`** — read `SPEC.md` (1,609 lines, full spec) and `tokens.css` (color + type + spacing tokens) before writing any UI. The 24 screen JSX files in `screens/` are visual references — lift values, not code.

- **Three pickable themes.** TravelBook ships with **Stamped** (default — cream paper + ink navy + terra accent, reads like a passport), **Wallet** (deep navy + barcode strips, Apple Wallet feel), and **Ticket** (paper-light + dashed perforations + terra stub). All themes consume the same data; v1 only populates Stamped — Wallet/Ticket are scaffolded but inert.
- **All design tokens live in [`artifacts/mobile/constants/tokens.ts`](artifacts/mobile/constants/tokens.ts)** as a `THEMES: Record<ThemeName, ThemeTokens>` map. Access the active theme's tokens via the [`useTheme()`](artifacts/mobile/hooks/useTheme.ts) hook, which reads from [`context/ThemeProvider.tsx`](artifacts/mobile/context/ThemeProvider.tsx). Never hardcode a hex value — every color resolves through `t.ink`, `t.terra`, `t.paper`, etc.
- **Typography is three families.** `Source Serif 4` (display — headlines, trip names), `Geist` (body — labels, copy, buttons), `Geist Mono` (codes, timestamps, machine output — **always uppercase + tracked `letterSpacing: 0.06em` minimum**). Loaded in [`app/_layout.tsx`](artifacts/mobile/app/_layout.tsx) via `@expo-google-fonts/source-serif-4`, `@expo-google-fonts/geist`, `@expo-google-fonts/geist-mono`. Use the type ramp from [`constants/typography.ts`](artifacts/mobile/constants/typography.ts) (`TYPE.displayXL`, `TYPE.displayL`, `TYPE.body`, `TYPE.monoXS`, etc.) — never set `fontWeight` directly.
- **Radii**: `RADII.card = 14`, `RADII.small = 8`, `RADII.pill = 999`. Spacing scale: 4 / 8 / 14 / 22 / 36.
- **Reusable primitives** live in [`artifacts/mobile/components/primitives/`](artifacts/mobile/components/primitives/): `TabBar`, `TabIcon`, `ScreenHeader`, `PillBtn`, `TimeChip`, `Stamp`, `RouteLine`, `Barcode`, `AvatarDot`, `Placeholder` (the striped `<Ph>` from the spec). Compose every screen out of these — don't reach for raw `<View>` + inline styles.
- **Voice rules (load-bearing)** — mono labels uppercase + tracked, body sentence-case, **no exclamation marks**, no blame, error sentence-1 = one fact, sentence-2 = consequence + verb. Reference `SPEC.md §7.21 StatesCatalogue` and `screens/utility.jsx`.
- **Stamp red** (`t.stampRed`) is only for stamps. **Never** for body text or destructive CTAs.

Old `Inter` font, `useColors()` hook, single-theme `colors.ts`, and prototype components (`PostCard`, `PassCard`, `ExploreCard`, `StoryBubble`, `TravelCardView`) are **removed** as of the Phase A reset. Do not re-introduce them.

---

## 6. Reuse before you build

Before you create any new file in `artifacts/mobile/`, check if it already exists:

1. **Primitives** → [`artifacts/mobile/components/primitives/`](artifacts/mobile/components/primitives/) — `TabBar`, `TabIcon`, `ScreenHeader`, `PillBtn`, `TimeChip`, `Stamp`, `RouteLine`, `Barcode`, `AvatarDot`, `Placeholder`. Every screen composes from these.
2. **Infrastructure components** → [`artifacts/mobile/components/`](artifacts/mobile/components/) — `ConflictToast`, `ErrorBoundary`, `ErrorFallback`, `KeyboardAwareScrollViewCompat`.
3. **State** → [`artifacts/mobile/context/`](artifacts/mobile/context/) — `ThemeProvider` (active theme + tokens), `AppContext` (user, posts, stories, documents — being rewritten in Phase B/C/D against the new spec data models), `PlannerContext` (passes, plan generation, card CRUD, conflicts — same).
4. **Engine** → [`artifacts/mobile/context/plannerEngine.ts`](artifacts/mobile/context/plannerEngine.ts) — pure TS timeline logic. `reflowCards`, `removeCardAndReflow`, `detectConflicts`, `totalCost`. No RN deps — unit-testable. Reshuffle algorithm in `SPEC.md §5.3`.
5. **Hooks** → [`artifacts/mobile/hooks/`](artifacts/mobile/hooks/) — `useTheme`, `useNow`. Add new hooks here, never inline in a screen.
6. **Lib** → [`artifacts/mobile/lib/`](artifacts/mobile/lib/) — `aiPlanner.ts` (client adapter for AI Planner endpoint). Add new client adapters here.
7. **Constants** → [`artifacts/mobile/constants/`](artifacts/mobile/constants/) — `tokens.ts` (theme tokens, radii, spacing), `typography.ts` (font families + type ramp). Add new tokens here, never inline.
8. **Routes** → [`artifacts/mobile/app/`](artifacts/mobile/app/) — one file per route. `(tabs)/` is the tab group (index/explore/planner/pass/account). Modals and detail screens go at the root of `app/` as separate routes.

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

- [ ] The design handoff (`~/Downloads/design_handoff_travelbook/`) is respected — no new visual language invented inline.
- [ ] No duplication of existing primitives, hooks, context methods, or utilities.
- [ ] Every color flows through `useTheme()` → `t.<token>`. No hardcoded hex in new code (excepting `#ffffff` on dark surfaces where appropriate).
- [ ] Every text node uses the `TYPE.*` ramp from `constants/typography.ts`. No raw `fontWeight`. Mono variants are uppercase + tracked.
- [ ] Voice rules followed: no `!`, no blame, error = one fact + one consequence.
- [ ] `pnpm run typecheck` passes clean.
- [ ] iOS, Android, and web branches all handled where relevant.
- [ ] `README.md` is updated if user-visible behavior or setup changed.
- [ ] Haptic feedback added on every destructive / confirming / selection action (use `expo-haptics` — `PillBtn` already does this).

---

## 11. Pre-flight checklist (before writing UI code)

```
[ ] I opened ~/Downloads/design_handoff_travelbook/SPEC.md for the screen I'm building.
[ ] I opened the matching screens/*.jsx for visual reference.
[ ] I searched artifacts/mobile/components/primitives/ for an existing primitive that does this.
[ ] I searched artifacts/mobile/app/(tabs)/ for a similar screen pattern.
[ ] Every color I will use comes from useTheme() → t.<token> — no hardcoded hex.
[ ] Every text node uses the TYPE.* ramp — no bare fontWeight or hardcoded fontFamily.
[ ] Spacing values come from the established scale (4, 8, 14, 22, 36).
[ ] Radii come from RADII (card=14, small=8, pill=999).
[ ] Icons are stroke SVGs via react-native-svg (see TabIcon). No SF Symbols / @expo/vector-icons unless infrastructure (Ionicons in ErrorFallback/ConflictToast).
[ ] State lives in a context (Theme/App/Planner), not in component-level useState for shared data.
[ ] Server data flows through TanStack Query hooks from @workspace/api-client-react.
[ ] Haptics added on destructive or confirming actions (PillBtn handles this).
[ ] Platform branches (iOS / Android / web) handled where applicable.
[ ] tsc --noEmit passes.
[ ] Voice swept — no `!`, no blame, error = fact + consequence.
```

If any box is unchecked → **stop and fix before continuing**.

---

## 12. Archive — the old project

The previous Next.js-based TravelBook web app is preserved at [`~/Desktop/TravelBook/travelbook-old/`](~/Desktop/TravelBook/travelbook-old/). It has uncommitted Supabase-integration work from the previous session. Do not reference it in new code — it is a historical artifact only. GitHub remote: `rumedsodimana-stack/travelbook` (master branch).

---

*Established 2026-04-15. This file overrides any default behavior. When in doubt, re-read this file.*
