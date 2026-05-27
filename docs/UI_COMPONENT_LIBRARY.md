> **⚠ STALE as of 2026-05-26 — being rewritten.**
> The component inventory below describes the legacy `PostCard / PassCard / ExploreCard / StoryBubble / TravelCardView` design — those have been deleted. The new primitives live in `artifacts/mobile/components/primitives/` (`TabBar`, `TabIcon`, `ScreenHeader`, `PillBtn`, `TimeChip`, `Stamp`, `RouteLine`, `Barcode`, `AvatarDot`, `Placeholder`). Feature components (PassCard, FeedPost, etc.) will be rebuilt in Phases D–E per the design handoff at `~/Downloads/design_handoff_travelbook/SPEC.md`.

# TravelBook UI Component Library

Extracted from the prototype at `artifacts/mobile/`. Every component listed here is the **only** implementation for its purpose — reuse first, extend second, never fork.

> When adding a new component, add it to this document in the same commit. A component that isn't documented here does not exist.

---

## Inventory

| Component | File | Used by | Purpose |
|---|---|---|---|
| `StoryBubble` | [components/StoryBubble.tsx](../artifacts/mobile/components/StoryBubble.tsx) | Home feed header | Circular avatar with "seen" ring state. Top of Home screen. |
| `PostCard` | [components/PostCard.tsx](../artifacts/mobile/components/PostCard.tsx) | Home feed | Social post — author, content, optional Travel Pass share, tags, actions (like/comment/join/share). |
| `ExploreCard` | [components/ExploreCard.tsx](../artifacts/mobile/components/ExploreCard.tsx) | Explore | Discovery card — gradient hero, category badge, rating, price. `size="large"` (220×280) or `size="small"` (160×200). |
| `PassCard` | [components/PassCard.tsx](../artifacts/mobile/components/PassCard.tsx) | Passes, Home (when shared) | Travel Pass summary — status, destination, dates, total, item count, buddy requests. |
| `TravelCardView` | [components/TravelCardView.tsx](../artifacts/mobile/components/TravelCardView.tsx) | Planner, Pass detail | Itinerary item — 8 card types. **Swipe-as-deck** for alternatives (planner only). Lifecycle badges: LIVE / DONE / IN Xh. Past cards dimmed. `compact` mode for lists. |
| `ConflictToast` | [components/ConflictToast.tsx](../artifacts/mobile/components/ConflictToast.tsx) | Planner result | Floating banner for timeline conflicts from `plannerEngine.detectConflicts()`. Auto-dismiss 12s + manual ×. Shows highest-severity conflict. |
| `ErrorBoundary` | [components/ErrorBoundary.tsx](../artifacts/mobile/components/ErrorBoundary.tsx) | App root | Top-level error catcher. Rendered in `_layout.tsx`. |
| `ErrorFallback` | [components/ErrorFallback.tsx](../artifacts/mobile/components/ErrorFallback.tsx) | ErrorBoundary | Rendered when the boundary catches. |
| `KeyboardAwareScrollViewCompat` | [components/KeyboardAwareScrollViewCompat.tsx](../artifacts/mobile/components/KeyboardAwareScrollViewCompat.tsx) | Forms | Keyboard-safe ScrollView shim. |

Hooks:

| Hook | File | Purpose |
|---|---|---|
| `useColors` | [hooks/useColors.ts](../artifacts/mobile/hooks/useColors.ts) | Returns the active color palette (light/dark) + `radius`. **Call this in every component that uses a color.** |
| `useNow` | [hooks/useNow.ts](../artifacts/mobile/hooks/useNow.ts) | Returns current time, refreshed every 60s (configurable). Also exports `formatDuration(ms)` (→ "2h 15m") and `cardLifecycle(start, end, now)` (→ "past" / "active" / "soon" / "future"). |

Lib (client adapters):

| Module | File | Purpose |
|---|---|---|
| `fetchAiSuggestions` | [lib/aiPlanner.ts](../artifacts/mobile/lib/aiPlanner.ts) | Client adapter for api-server `/v1/plan`. 8s timeout. Returns `{ source: "llm" | "fallback", suggestions }`. Failure-tolerant — never throws. |

Engine (pure TS, no React):

| Module | File | Purpose |
|---|---|---|
| `plannerEngine` | [context/plannerEngine.ts](../artifacts/mobile/context/plannerEngine.ts) | Timeline cascade logic. `reflowCards(cards, old, new)`, `removeCardAndReflow(cards, id)`, `detectConflicts(cards)`, `totalCost(cards)`. BFS over `dependsOn` graph. Unit-testable. |

Context providers (state layer):

| Context | File | Scope |
|---|---|---|
| `AppProvider` / `useApp` | [context/AppContext.tsx](../artifacts/mobile/context/AppContext.tsx) | Current user, posts, stories, saved travel documents. Exposes `toggleLike`, `markStorySeen`, etc. |
| `PlannerProvider` / `usePlanner` | [context/PlannerContext.tsx](../artifacts/mobile/context/PlannerContext.tsx) | Travel passes, active plan, AI itinerary generation, card CRUD, `sharePass`, `archivePass`, `requestJoinTrip`, `bookAll`, `discardPlan`. |

---

## 1. `StoryBubble`

**Shape:** 60×60 ring around a 50×50 avatar, username label below.

```tsx
<StoryBubble
  story={{
    id: "my_story",
    authorId: user.id,
    authorName: "You",
    authorUsername: "you",
    image: "",
    seen: false,
    createdAt: new Date().toISOString(),
  }}
  isUser         // shows a "+" instead of initials
  onPress={() => {}}
/>
```

Design notes:
- **Unseen:** ring uses `colors.primary`.
- **Seen:** ring uses `colors.border` (muted).
- Avatar background: deterministic color from `getAvatarColor(authorName)` — hashes the name to one of 10 palette colors.
- Initials: first letter of first two words, uppercase, max 2 chars.

Avatar palette (shared with `PostCard`):

```ts
["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
 "#DDA0DD", "#F4A261", "#2EC4B6", "#E76F51", "#264653"]
```

---

## 2. `PostCard`

**Shape:** `borderRadius: 16`, `borderWidth: 1`, 14px internal padding.

```tsx
<PostCard
  post={post}
  onLike={() => toggleLike(post.id)}
  onPassPress={post.travelPassId ? () => requestJoinTrip(post.travelPassId) : undefined}
/>
```

Structure (top → bottom):
1. **Author row** — 38px circular avatar (hashed color) · name (Inter_600SemiBold 14) · meta (`@username · 📍 location`, muted 12) · timeAgo on the right.
2. **Content** — Inter_400Regular 14, lineHeight 21.
3. **Embedded Travel Pass** (optional) — pill card with `backgroundColor: primary + "15"` tint, teal passport icon, "Travel Pass Shared" label. Tap → `onPassPress`.
4. **Tags row** (optional) — pill chips `backgroundColor: muted`, `borderRadius: 20`, `#tag` text.
5. **Actions row** — top border, 20px gap: heart (filled when liked, accent color), comment, join (if pass), send. Counts shown except send.

Interactions:
- Like → `Haptics.ImpactFeedbackStyle.Light` on tap.
- Liked state → heart icon uses `colors.accent` (coral).

---

## 3. `ExploreCard`

**Shape:** `borderRadius: 18`. Two sizes — `large` (220×280) or `small` (160×200). Background color comes from `item.gradientColors[0]` (the card is colored, not a gradient image).

```tsx
<ExploreCard
  item={{
    id, title, subtitle, category,
    rating, reviewCount, price, currency,
    duration, tag, gradientColors: ["#264653", "#2A9D8F"],
    providerType,
  }}
  onPress={() => {}}
  size="large" // or "small"
/>
```

Structure:
- **Tag badge** (optional, top-right) — coral `#FF6B6B` pill, e.g. "Trending", "Popular", "Limited", "New", "Best Value".
- **Bottom overlay** — `rgba(0,0,0,0.35)` gradient-less dark wash, pinned to bottom, contains:
  - Category pill — translucent white `rgba(255,255,255,0.2)`.
  - Title — `#fff`, Inter_700Bold, `16` (large) or `14` (small).
  - Subtitle (large only) — `rgba(255,255,255,0.8)` 12.
  - Footer row — ⭐ rating `#FFD700` + review count + price (or "Free" when 0).

Gradient color pairs used in the prototype (memorize these — don't invent new ones):

| Use case | `gradientColors` |
|---|---|
| Teal / Maldives / Beach | `["#0E7C7B", "#4ECDC4"]` |
| Navy / Patagonia / Amalfi | `["#1B3A5C", "#2D6A8C"]` |
| Forest / Ubud / Nature | `["#2D6A4F", "#52B788"]` |
| Ochre / Morocco / Culture | `["#7A4E2D", "#C4832E"]` |
| Purple / Japan package | `["#6B4EFF", "#9B85FF"]` |
| Mint / Bali wellness | `["#2EC4B6", "#3DC9BE"]` |
| Coral / European Cities | `["#E76F51", "#F4A261"]` |
| Deep / Kyoto | `["#264653", "#2A9D8F"]` |
| Ice / Iceland | `["#264653", "#45B7D1"]` |

---

## 4. `PassCard`

**Shape:** `borderRadius: 20`, 18px padding, solid colored background from deterministic hash of `pass.id`.

```tsx
<PassCard
  pass={pass}
  onPress={() => setSelectedPass(pass)}
  onShare={() => sharePass(pass.id)} // optional
/>
```

Background palette (hashed from `pass.id`):

```ts
["#1B3A5C", "#0E7C7B", "#E76F51", "#264653", "#6B4EFF", "#2EC4B6"]
```

Status badge colors (from `STATUS_CONFIG` inside the file):

| Status | Label | Color |
|---|---|---|
| `active` | Active | `#0E7C7B` (teal) |
| `upcoming` | Upcoming | `#F4A261` (gold) |
| `archived` | Archived | `#8A8580` (muted) |

Structure:
1. **Header row** — status badge + "Xd away" (upcoming only) on the left; public-globe badge + share button on the right.
2. **Passport + TRAVELBOOK label** — faint watermark row (passport icon @ 32 with `rgba(255,255,255,0.3)`, "TRAVELBOOK" tracked-out label @ 10).
3. **Title** — `#fff` Inter_700Bold 24.
4. **Destination** — location icon + place name, `rgba(255,255,255,0.8)` 14.
5. **Dashed divider** — 1px `rgba(255,255,255,0.2)` dashed top-border.
6. **Footer** — TRAVEL DATES (label 10, value 14 semibold) left, TOTAL right.
7. **Card types + count** — "Flight · Hotel · Activity · ..." muted 12, `N items` right-aligned.
8. **Buddy requests badge** (optional) — pill `rgba(255,255,255,0.18)`, people icon + count.

---

## 5. `TravelCardView`

The workhorse. Renders one itinerary item. 8 types, each with its own color + icon.

```tsx
<TravelCardView
  card={card}
  onRemove={() => planner.removeCard(card.id)}
  onSelectAlternative={(alt) => planner.updateCard(alt)}
  compact={false}
/>
```

### Type config (single source of truth — `CARD_CONFIGS`)

| Type | Icon | Icon set | Label | Color |
|---|---|---|---|---|
| `flight` | `airplane` | Ionicons | Flight | `#1B3A5C` (navy) |
| `hotel` | `bed` | Ionicons | Hotel | `#0E7C7B` (teal — brand primary) |
| `activity` | `map` | Feather | Activity | `#E76F51` (coral) |
| `insurance` | `shield-checkmark` | Ionicons | Insurance | `#2EC4B6` (mint) |
| `visa` | `passport` | MaterialCommunityIcons | Visa | `#6B4EFF` (indigo) |
| `dining` | `restaurant` | Ionicons | Dining | `#FF6B6B` (coral red) |
| `transport` | `train` | Ionicons | Transport | `#45B7D1` (sky) |
| `event` | `ticket` | MaterialCommunityIcons | Event | `#DDA0DD` (plum) |

**Do not add a new card type without adding it here and in `CARD_CONFIGS`.**

### Default (non-compact) mode

- `borderRadius: 20`, 18px padding, colored by type.
- Header: 36×36 icon tile (white @ 0.2 opacity bg) + uppercase tracked type label + optional close (×) button.
- Title (21 Inter_700Bold) + subtitle (13 Inter_400Regular, white @ 0.72 opacity).
- Dashed divider (`rgba(255,255,255,0.18)`).
- Footer row: DEPARTURE / CHECK-IN / START (left), END / CHECK-OUT (middle if endTime exists), price tag (right, 20 Inter_700Bold).
- Detail chips row: up to 3 entries from `card.details`, white @ 0.14 pill.
- Provider row: briefcase icon + provider name, muted white.

### Compact mode

- `borderRadius: 12`, 12px padding, `colors.card` bg, 1px border.
- 34×34 colored icon tile + title + `date · provider` + price on the right.
- Used in list contexts (pass detail summaries, batch lists).

### Alternatives — swipe-as-deck (SPEC — build this; current code has the old pattern)

> ⚠️ **Current code still uses a chip-row carousel below the card.** That pattern is **deprecated** per [`docs/AI_PLANNER_SPEC.md § 3`](AI_PLANNER_SPEC.md#3-ux--swipe-as-deck-not-alt-chip-carousel). The next refactor of `TravelCardView` must match the spec below.

When `card.alternatives.length > 0`, the **main card itself becomes the deck** — swiping it horizontally pages through alternatives in place.

- **One card, one slot.** No chip row, no secondary display. The card at its existing position *becomes* the next alternative when swiped.
- **Gesture:** horizontal pan (drag finger across the card). Use `react-native-reanimated` + `react-native-gesture-handler` `Gesture.Pan()`.
- **Commit threshold:** past a quarter of the card width OR past a velocity threshold → commit to the next alternative. Otherwise snap back.
- **Haptic:** `Haptics.selectionAsync()` fires exactly on commit (once per alternative change, not during the drag).
- **Edges:** block / elastic-bounce at first and last alternative.
- **Indicator:** dot row beneath the card (`•` current, `○` others) — one dot per alternative. Use the deck's type color for the filled dot.
- **Count:** `[card, ...card.alternatives]` — no hardcoded cap. AI returns however many best-similar options it has; UI handles all lengths (2, 3, 10+).
- **`onSelectAlternative(alt)`:** fires after commit, with the new card. The parent (planner screen) is responsible for calling `PlannerContext.updateCard` and triggering the timeline reflow cascade — see [`AI_PLANNER_SPEC.md § 4`](AI_PLANNER_SPEC.md#4-timeline-auto-reflow--the-cascade).
- **Remove (×) button:** still lives on the card top-right. It removes the **entire slot** (all alternatives), not just the current one.

---

## Shared patterns

### Avatar color (deterministic hash)

```ts
const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#DDA0DD", "#F4A261", "#2EC4B6", "#E76F51", "#264653",
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
```

Used in `StoryBubble` and `PostCard`. If you need an avatar somewhere new, import the same function — do **not** duplicate the palette.

### Pass color (deterministic hash)

```ts
const BG_COLORS = ["#1B3A5C", "#0E7C7B", "#E76F51", "#264653", "#6B4EFF", "#2EC4B6"];
function getPassColor(id: string): string { /* same hash pattern */ }
```

Lives in `PassCard`. Same rule — reuse, don't duplicate.

### Haptics

Every action that touches "intent" must have a haptic cue. Examples from the prototype:

- **Light impact** — like tap (`PostCard`), share (`PassCard`).
- **Medium impact** — remove (`TravelCardView.onRemove`), buddy request button.
- **Selection** — switching alternative chips (`TravelCardView.handleSelectAlt`).
- **Success notification** — confirming a destructive or committing action: `generateItinerary` start, `bookAll` success in [planner.tsx](../artifacts/mobile/app/(tabs)/planner.tsx).

Import: `import * as Haptics from "expo-haptics";`.

### Empty states

When a list is empty, render (see [passes.tsx](../artifacts/mobile/app/(tabs)/passes.tsx) lines 77-85):

```tsx
<View style={styles.empty}>
  <MaterialCommunityIcons name="passport" size={60} color={colors.border} />
  <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: "Inter_700Bold" }}>No trips yet</Text>
  <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
    Use the Planner tab to build your first Travel Pass
  </Text>
</View>
```

Pattern: giant muted icon (60px, `colors.border`) + bold headline + muted helper text. Centered, ~60px padding.

### Modal presentation (pass detail)

Full-screen modal, `presentationStyle="pageSheet"`, `animationType="slide"`. Header: chevron-down close · title block (title + subtitle) · share icon. See [passes.tsx](../artifacts/mobile/app/(tabs)/passes.tsx) lines 103-183.

---

## Adding a new component — checklist

Before creating a new file in `artifacts/mobile/components/`:

- [ ] I searched this document and the components directory — nothing like it exists.
- [ ] Its styling uses `useColors()` exclusively. No hardcoded hex.
- [ ] Its fonts use `Inter_XXX` family names, not raw `fontWeight`.
- [ ] Its layout uses established spacing (6/8/10/12/14/16) and radius (12/16/18/20) scales.
- [ ] Icons come from `@expo/vector-icons` or `expo-symbols` (iOS).
- [ ] If it represents a card type, it's reused from `TravelCardView` rather than forked.
- [ ] If it shows an avatar, it uses `getAvatarColor(name)` — I did not duplicate the palette.
- [ ] Haptic feedback added on intent-carrying interactions.
- [ ] Platform branches handled (iOS / Android / web) where relevant.
- [ ] Added to the **Inventory** table at the top of this document.

---

*Updated 2026-04-15 from prototype scan.*
