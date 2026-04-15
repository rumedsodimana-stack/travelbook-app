# TravelBook

A social-first travel platform. Post trips, share Travel Passes, book end-to-end with an AI trip builder. Mobile-first (iOS, Android, Web).

> **For product scope & vision:** [`PROJECT.md`](PROJECT.md)
> **For contributor working rules:** [`CLAUDE.md`](CLAUDE.md)
> **For design system:** [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md) and [`docs/UI_COMPONENT_LIBRARY.md`](docs/UI_COMPONENT_LIBRARY.md)

---

## Table of contents

- [Quick start](#quick-start)
- [Repository layout](#repository-layout)
- [Stack](#stack)
- [Commands](#commands)
- [App tour (the 5 tabs)](#app-tour-the-5-tabs)
- [Architecture highlights](#architecture-highlights)
- [Environment](#environment)
- [Contributing](#contributing)

---

## Quick start

```bash
# 1. Install pnpm if you don't have it
npm i -g pnpm

# 2. Install all workspace dependencies
pnpm install

# 3. Run the mobile app (Expo)
pnpm --filter @workspace/mobile run dev
```

The Expo dev server opens with a QR code. Scan it with the Expo Go app on iOS / Android, press `w` for web, or `i` / `a` for the installed iOS / Android simulators.

---

## Repository layout

This is a **pnpm workspace monorepo**. Each artifact is its own package.

```
travelbook/
├── artifacts/
│   ├── mobile/              Expo / React Native consumer app (THE product)
│   ├── api-server/          Express 5 + TypeScript backend
│   └── mockup-sandbox/      Vite web surface for design mockups
├── lib/
│   ├── api-client-react/    Generated React Query hooks (from api-spec)
│   ├── api-spec/            OpenAPI spec — source of truth for API contracts
│   ├── api-zod/             Generated Zod schemas
│   └── db/                  Drizzle ORM + PostgreSQL schema
├── scripts/                 Repo-wide scripts
├── docs/                    Design system + component library docs
├── CLAUDE.md                Working rules for Claude
├── PROJECT.md               Product scope & vision
├── README.md                This file
├── package.json             Workspace root
├── pnpm-workspace.yaml      Packages + catalog (shared versions)
└── tsconfig.base.json       Base TS config
```

---

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces (Node 24, TS 5.9) |
| Mobile | Expo SDK 54 · React Native 0.81 · React 19.1 · Expo Router · Reanimated 4 · TanStack Query · Zod |
| Fonts | Inter 400 / 500 / 600 / 700 (via `@expo-google-fonts/inter`) |
| Icons | `@expo/vector-icons` (Ionicons, Feather, MaterialCommunityIcons) + `expo-symbols` on iOS |
| Native UX | `expo-haptics`, `expo-blur`, `expo-glass-effect`, `expo-linear-gradient` |
| API | Express 5 + esbuild CJS bundle |
| DB | PostgreSQL + Drizzle ORM |
| Validation | Zod (`zod/v4`) + `drizzle-zod` |
| API codegen | Orval (OpenAPI → hooks + Zod) |

**Exact versions are pinned in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) under the `catalog:` section.** Consumers reference them with `"<pkg>": "catalog:"`.

**Security note:** `minimumReleaseAge: 1440` is set in `pnpm-workspace.yaml` — a new npm package must be at least 24 hours old before it installs. This is a supply-chain defense; do not disable it.

---

## Commands

### Workspace-wide

```bash
pnpm install                      # install everything
pnpm run typecheck                # typecheck all packages
pnpm run build                    # typecheck + build all
```

### Mobile (`artifacts/mobile`)

```bash
pnpm --filter @workspace/mobile run dev          # start Expo dev server
pnpm --filter @workspace/mobile run typecheck    # TS check
pnpm --filter @workspace/mobile run build        # production bundle
pnpm --filter @workspace/mobile run serve        # serve built bundle
```

### API server (`artifacts/api-server`)

```bash
pnpm --filter @workspace/api-server run dev      # run API locally
```

### Database (`lib/db`)

```bash
pnpm --filter @workspace/db run push             # push Drizzle schema (dev only)
```

### API spec regeneration

```bash
pnpm --filter @workspace/api-spec run codegen    # regenerate hooks + Zod from OpenAPI
```

---

## App tour (the 5 tabs)

### 1. Home — `app/(tabs)/index.tsx`

Social feed. Top row is Stories (60px circular avatars — unseen ring in primary color, seen ring muted). Below is the post feed — author, content, optional embedded Travel Pass, tags, actions (like, comment, join, share).

Tap a post's Travel Pass tile → triggers `requestJoinTrip(passId)`.

### 2. Explore — `app/(tabs)/explore.tsx`

Discovery. Top: search bar. Below: category chip row (All, Beach, Adventure, Culture, Food, Wellness, City, Nature). Three horizontally-scrolling sections:

- **Trending Experiences** — hero cards (220×280), tag badges ("Trending", "Popular", "Limited").
- **Curated Packages** — multi-component bundles.
- **Top Destinations** — 2-column grid of smaller cards (160×200).

### 3. Planner — `app/(tabs)/planner.tsx`

Two routes:

- **AI Trip Builder** — form asks destination / dates / budget / travelers / travel style (Budget / Comfort / Luxury) / interests. Generates a full itinerary (pass) with alternatives for each slot.
- **Manual** — 6-card grid (Flights, Hotels, Activities, Dining, Insurance, Visa) for booking one component at a time.

### 4. Passes — `app/(tabs)/passes.tsx`

The user's Travel Pass library. Sections: Active Now → Upcoming Trips → Past Trips. Each pass shown as a colored card (deterministic color from pass ID) with status badge, destination, dates, total, item count, buddy requests.

Tap a pass → full-screen modal (`presentationStyle="pageSheet"`) with summary card, buddy-request CTA, and the full itinerary rendered via `TravelCardView`.

### 5. Account — `app/(tabs)/account.tsx`

Profile, stats, secure travel documents (passport / ID / visa vault), payment methods, settings.

---

## Architecture highlights

### State

Two React Context providers cover everything:

- **`AppContext`** ([context/AppContext.tsx](artifacts/mobile/context/AppContext.tsx)) — current user, posts, stories, saved documents. Exposes `toggleLike`, `markStorySeen`.
- **`PlannerContext`** ([context/PlannerContext.tsx](artifacts/mobile/context/PlannerContext.tsx)) — passes, active AI plan, card CRUD, `sharePass`, `archivePass`, `requestJoinTrip`, `bookAll`, `discardPlan`.

Server state lives in React Query (via `@workspace/api-client-react` generated hooks), not in context.

### Routing

File-based via **Expo Router**. The `(tabs)/` group is the tab shell. Routes outside `(tabs)` push as stack screens above the tabs.

The tab bar itself switches between `NativeTabs` (iOS liquid-glass) and classic `Tabs` with a `BlurView` — see [app/(tabs)/_layout.tsx](artifacts/mobile/app/(tabs)/_layout.tsx).

### Design tokens

All colors flow from [constants/colors.ts](artifacts/mobile/constants/colors.ts), accessed through the [`useColors()`](artifacts/mobile/hooks/useColors.ts) hook. Light + dark palettes are built in; it follows the system appearance automatically.

**Never hardcode a hex in a screen or component.** See [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md) for the full rule set.

### Icons

- Default: `@expo/vector-icons` — Ionicons / Feather / MaterialCommunityIcons.
- iOS: `expo-symbols` (`SymbolView`) when available for SF Symbols rendering.

### Haptics

Every intent-carrying action has a haptic cue — `Haptics.ImpactFeedbackStyle.Light` for taps, `Medium` for destructive, `selectionAsync()` for switching alternatives, `NotificationFeedbackType.Success` for booking confirmation. See [`docs/UI_COMPONENT_LIBRARY.md § Haptics`](docs/UI_COMPONENT_LIBRARY.md#haptics).

### Platforms

Targets **iOS, Android, and Web** via React Native Web. Each tab screen includes platform branches for safe-area padding and tab bar rendering — copy those branches when adding new screens.

---

## Environment

Required environment variables (used by the Expo dev script):

| Var | Purpose |
|-----|---------|
| `PORT` | Expo dev server port |
| `REPLIT_EXPO_DEV_DOMAIN` | (Replit only) Expo packager proxy URL |
| `REPLIT_DEV_DOMAIN` | (Replit only) React Native packager hostname |
| `REPL_ID` | (Replit only) Replit workspace ID |

Outside Replit, none of these are required — `pnpm --filter @workspace/mobile run dev` will start Expo in local mode.

Database connection strings and API keys live in per-artifact `.env` files (not committed). Check each artifact's `package.json` for the dev script to see which vars it reads.

---

## Contributing

Before touching code, read:

1. [`CLAUDE.md`](CLAUDE.md) — working rules, reuse checklist, definition of done.
2. [`PROJECT.md`](PROJECT.md) — product scope & what TravelBook is NOT.
3. [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md) — design tokens, typography, spacing, motion.
4. [`docs/UI_COMPONENT_LIBRARY.md`](docs/UI_COMPONENT_LIBRARY.md) — component inventory.

Pre-flight before writing UI code:

- [ ] I searched `artifacts/mobile/components/` for an existing component that fits.
- [ ] Every color I'll use comes from `useColors()`.
- [ ] Every font uses `fontFamily: "Inter_XXX"`.
- [ ] Spacing values come from `6, 8, 10, 12, 14, 16, 20, 24`.
- [ ] Radius comes from `12, 16, 18, 20` (or `colors.radius`).
- [ ] Icons are from `@expo/vector-icons` or `expo-symbols`.
- [ ] Shared state lives in `AppContext` or `PlannerContext`.
- [ ] Haptics added on confirming / destructive / selection actions.
- [ ] iOS, Android, and Web branches handled.
- [ ] `pnpm run typecheck` passes.

---

*README updated 2026-04-15. If any user-visible setup step changes, update this file in the same commit.*
