> **⚠ STALE as of 2026-05-26 — being rewritten.**
> The visual direction has changed to the three-theme system (Stamped / Wallet / Ticket), Source Serif 4 + Geist + Geist Mono, cream/ink/terra palette. See `~/Downloads/design_handoff_travelbook/SPEC.md` (1,609 lines) and `tokens.css` for the new source of truth. Tokens live in `artifacts/mobile/constants/tokens.ts` accessed via `useTheme()`. Primitives are in `artifacts/mobile/components/primitives/`. The Inter / teal / coral references below no longer apply.

# TravelBook UI Guidelines

The design system for the TravelBook mobile app. Every token, spacing value, font, and pattern here is extracted from the prototype at `artifacts/mobile/`.

> **The prototype is canonical.** When these docs and the code disagree, the code in `artifacts/mobile/` wins — and this doc gets updated in the same commit.

---

## 0. The vibe

TravelBook feels like a **warm, social travel diary** — not a cold booking kiosk. The aesthetic:

- **Confident teal** as the primary — trustworthy, calm, ocean-adjacent.
- **Coral / warm red** as the accent — friendly, human, alive.
- **Sand-tinted neutrals** for surfaces — cream, not clinical gray.
- **Deep navy text** — high contrast but never harsh black.
- **Rounded, generous corners** — 12/16/18/20 radius, never square.
- **iOS-first polish** — blur, SF symbols, haptics, dashed dividers on passes (like real passport tickets).
- **Inter, all weights** — the only typeface.

Every new surface should pass this sniff test: *does it feel like a keepsake, or does it feel like an invoice?*

---

## 1. Color tokens — the only source of truth

Defined in [`artifacts/mobile/constants/colors.ts`](../artifacts/mobile/constants/colors.ts). Always consume via `useColors()` — never import the module directly inside a component.

### Light palette

| Token | Hex | Where it's used |
|---|---|---|
| `text` | `#0D1B2A` | Legacy text token (use `foreground` in new code) |
| `tint` | `#0E7C7B` | Tab bar active tint |
| `background` | `#FAFAF8` | App background (cream, not white) |
| `foreground` | `#0D1B2A` | Primary text on backgrounds |
| `card` | `#FFFFFF` | Card surface |
| `cardForeground` | `#0D1B2A` | Text on cards |
| `primary` | `#0E7C7B` | Brand primary — teal. Buttons, active states, links, tab bar active |
| `primaryForeground` | `#FFFFFF` | Text on primary |
| `secondary` | `#F0EDE8` | Secondary surfaces (deprecated — prefer `muted`) |
| `secondaryForeground` | `#0D1B2A` | Text on secondary |
| `muted` | `#F0EDE8` | Muted surface — unselected chips, tag backgrounds |
| `mutedForeground` | `#8A8580` | Muted text — metadata, captions, inactive tab icons, placeholder |
| `accent` | `#FF6B6B` | Accent — coral. Liked heart, the app's "pop" color |
| `accentForeground` | `#FFFFFF` | Text on accent |
| `destructive` | `#E63946` | Destructive actions |
| `destructiveForeground` | `#FFFFFF` | Text on destructive |
| `border` | `#E4E0D9` | Hairlines, card borders, seen-story ring |
| `input` | `#E4E0D9` | Input borders |
| `sand` | `#F5E6D3` | Warm-sand highlight |
| `sandForeground` | `#7A5C3E` | Text on sand |
| `navy` | `#1B3A5C` | Deep navy for flight cards, accent surfaces |
| `navyForeground` | `#FFFFFF` | Text on navy |
| `gold` | `#F4A261` | Gold — upcoming pass status, "limited" badges |

### Dark palette

| Token | Hex | Notes |
|---|---|---|
| `text` | `#F5F0EB` | |
| `tint` | `#4ECDC4` | Brighter teal in dark mode |
| `background` | `#0D1B2A` | Navy base |
| `foreground` | `#F5F0EB` | |
| `card` | `#162636` | |
| `primary` | `#4ECDC4` | Brighter teal |
| `secondary` / `muted` | `#1E3448` | |
| `mutedForeground` | `#8A9BB0` | |
| `accent` | `#FF6B6B` | Same coral |
| `destructive` | `#E63946` | Same |
| `border` / `input` | `#243C52` | |
| `sand` | `#2A3D52` | |
| `sandForeground` | `#C4A882` | |
| `navy` | `#4ECDC4` | Navy swaps to teal in dark |
| `gold` | `#F4A261` | Same |

### Scheme-independent

| Token | Value |
|---|---|
| `radius` | `12` (default — larger surfaces override to 16/18/20 inline) |

### Rules

- **Never hardcode a hex in a screen or component.** Use `const colors = useColors();` and read `colors.primary`, `colors.foreground`, etc.
- **Inline hex is allowed only inside card palettes that are intentionally outside the theme** — the 10-color avatar palette, the 6-color pass palette, and the per-type `CARD_CONFIGS` in `TravelCardView.tsx`. These are documented in [`UI_COMPONENT_LIBRARY.md`](UI_COMPONENT_LIBRARY.md) and reused via the helper functions — do not duplicate them.
- **Tinted states use opacity suffix** — e.g. `colors.primary + "15"` for a faint teal fill, `colors.primary + "30"` for its border (see `PostCard` pass-embed and `passes.tsx` buddy button). Keep this pattern — don't invent RGB overrides.

---

## 2. Typography — Inter only

Loaded once in [`app/_layout.tsx`](../artifacts/mobile/app/_layout.tsx):

```ts
Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold
```

**Never use `fontWeight`.** Always `fontFamily: "Inter_XXX"`. The font weight is baked into the family name.

### Type scale (observed in the prototype)

| Role | Size | Family | Example |
|---|---|---|---|
| Hero heading (screens) | 28 | `Inter_700Bold` | Explore heading |
| Page title | 26 | `Inter_700Bold` | Passes "Travel Passes" |
| Pass card title | 24 | `Inter_700Bold` | Pass title in `PassCard` |
| Totals (`totalAmt`) | 24 | `Inter_700Bold` | Pass detail total paid |
| Travel card title | 21 | `Inter_700Bold` | Flight / Hotel title |
| Price (TravelCard) | 20 | `Inter_700Bold` | Price tag |
| Empty-state title | 20 | `Inter_700Bold` | "No trips yet" |
| Section title | 18 | `Inter_700Bold` | "Trending Experiences", "Itinerary" |
| Modal title | 18 | `Inter_700Bold` | Pass detail header |
| Header logo | 24 | `Inter_700Bold`, letterSpacing -0.5 | "TravelBook" wordmark |
| Section label (list) | 16 | `Inter_700Bold` | "Upcoming Trips", "Book Manually" |
| Section label (inline) | 16 | `Inter_600SemiBold` | Home "Feed" |
| Explore large title | 16 | `Inter_700Bold` | Explore card title (large) |
| Input / search text | 15 | `Inter_400Regular` | Search bar |
| Body content | 14 | `Inter_400Regular`, lineHeight 21 | Post content |
| Button / link / card label | 14 | `Inter_500Medium` or `Inter_600SemiBold` | Action text, see-all, summary value |
| Author name | 14 | `Inter_600SemiBold` | PostCard author |
| Explore small title | 14 | `Inter_700Bold` | Explore card title (small) |
| Chip / badge label | 13 | `Inter_600SemiBold` or `Inter_500Medium` | "New Post", pass label |
| Travel subtitle | 13 | `Inter_400Regular` | Subtitle on travel card |
| Action count | 13 | `Inter_500Medium` | Likes/comments count |
| Compact card price | 13 | `Inter_700Bold` | Compact TravelCard price |
| Compact card title | 13 | `Inter_600SemiBold` | Compact TravelCard title |
| Metadata | 12 | `Inter_400Regular` | `@username`, timestamps |
| Tag chip | 12 | `Inter_400Regular` | `#hashtag` pill |
| Card type text | 12 | `Inter_400Regular` | "Flight · Hotel · ..." |
| Destination subtitle | 12 | `Inter_400Regular` | PassCard destination, ExploreCard subtitle |
| Pass meta | 12 | `Inter_500Medium` | "Xd away", footer values |
| Caption | 11 | `Inter_400Regular` / `Inter_500Medium` | Summary label, provider |
| Compact subtitle | 11 | `Inter_400Regular` | Date + provider row |
| Price tag currency | 11 | `Inter_400Regular` | "USD" under big price |
| Reviews count | 11 | `Inter_400Regular` | `(2847)` after rating |
| Uppercase eyebrow | 10 | `Inter_600SemiBold`, tracked | Type labels, "TRAVEL DATES", "TRAVELBOOK" wordmark, tag text |
| Detail key (TravelCard) | 9 | `Inter_400Regular`, capitalize | Small detail chip key |

### Letter spacing rules

- Uppercase eyebrow labels use tracked letter-spacing: `0.5` for short badges, `0.6`–`1.0` for medium, `1.4`–`2.0` for brand-mark rows (e.g. "TRAVELBOOK" @ 2).
- The wordmark uses negative tracking: `letterSpacing: -0.5`.

---

## 3. Spacing scale

Observed values from the prototype — these are the **only** spacing values you should use:

| Context | Value |
|---|---|
| Micro gap (icon+text inline) | `3`, `4`, `5` |
| Small gap | `6`, `8` |
| Default gap | `10`, `12` |
| Medium gap | `14` |
| Standard spacing unit | **`16`** (screen horizontal padding, card horizontal margin) |
| Section gap | `20`, `24` |

Common rules:

- **Screen horizontal padding: `paddingHorizontal: 16`** — universal. Do not drift from this.
- **Card horizontal margin: `marginHorizontal: 16`** — for full-width cards (PostCard, PassCard, TravelCardView default).
- **Card vertical spacing: `marginBottom: 12`–`14`** between stacked cards.
- **Card internal padding: `padding: 14` / `18`** — 14 for smaller cards (PostCard), 18 for hero cards (PassCard, TravelCardView).
- **Tab bar bottom extra padding: `paddingBottom: insets.bottom` on mobile, `+ 84` on web**. Always use `useSafeAreaInsets()` on mobile.
- **FlatList bottom padding: `paddingBottom: botPad + 90`** so content clears the floating tab bar.

Never introduce magic values (`paddingTop: 27`, etc.). Round to the scale.

---

## 4. Radius scale

| Value | Used on |
|---|---|
| `8` | Detail chips inside `TravelCardView` |
| `9` | Compact `TravelCardView` icon tile |
| `10` | Icon tile inside travel card header |
| `12` | **Default (`colors.radius`)**. Buttons, compact cards, input boxes, alt chips |
| `16` | Mid-size cards (PostCard, search bar, pass summary card) |
| `18` | Explore cards |
| `20` | Hero surfaces — PassCard, TravelCardView (non-compact), pill chips |
| `19`, `25`, `30` | Circle avatars (half of diameter — 38/50/60) |

**Never invent a new radius.** If you need 14 or 24, stop — reach for 12/16/18/20.

---

## 5. Icons

Three icon sets, one rule: **use them via `@expo/vector-icons`**, plus `expo-symbols` for iOS-native rendering.

| Set | Import | When |
|---|---|---|
| `Ionicons` | `@expo/vector-icons` | Default — filled + outline duals (e.g. `heart-outline` / `heart`, `location-outline` / `location`) |
| `Feather` | `@expo/vector-icons` | Line-style icons (message-circle, send, edit-2, search) |
| `MaterialCommunityIcons` | `@expo/vector-icons` | When Ionicons and Feather don't have it (passport, robot-excited) |
| `SymbolView` | `expo-symbols` | **iOS only** — SF Symbols in tab bar and headers for native feel |

Rules:

- **Icon size scale:** `11`, `12`, `14`, `16`, `18`, `20`, `22`, `24`, `28`, `32`, `60` (empty-state). Stay on this scale.
- **Color the icon with `colors.X`** — `colors.foreground` for neutral, `colors.primary` for interactive/active, `colors.mutedForeground` for inactive, `colors.accent` for liked-heart.
- **iOS-native tab bar uses `expo-router/unstable-native-tabs`** when `isLiquidGlassAvailable()` returns true. Fall back to classic `Tabs` with `BlurView` tab bar otherwise. Copy the pattern from [`app/(tabs)/_layout.tsx`](../artifacts/mobile/app/(tabs)/_layout.tsx).
- **Do not import an SVG, Lottie file, or a third icon library.** One of the three above must cover the case.

---

## 6. Buttons, chips, inputs

### Primary button (e.g. "New Post")

```tsx
<TouchableOpacity style={{
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  gap: 5,
  backgroundColor: colors.primary,
}}>
  <Feather name="edit-2" size={14} color="#fff" />
  <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>New Post</Text>
</TouchableOpacity>
```

### Category chip (selectable)

```tsx
<TouchableOpacity style={{
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: active ? colors.primary : colors.muted,
}}>
  <Text style={{
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: active ? "#fff" : colors.mutedForeground,
  }}>{label}</Text>
</TouchableOpacity>
```

### Input box (with leading icon)

```tsx
<View style={{
  flexDirection: "row", alignItems: "center", gap: 10,
  padding: 12, borderRadius: 16,
  backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
}}>
  <Feather name="search" size={18} color={colors.mutedForeground} />
  <TextInput
    placeholder="…" placeholderTextColor={colors.mutedForeground}
    style={{ flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}
  />
</View>
```

### Uppercase field label (in forms)

```tsx
<Text style={{
  fontSize: 11, fontFamily: "Inter_500Medium",
  letterSpacing: 0.5, color: colors.mutedForeground, marginBottom: 4,
}}>DESTINATION</Text>
```

See [`planner.tsx`](../artifacts/mobile/app/(tabs)/planner.tsx) for the full form pattern.

---

## 7. Layout

### Tab bar

- iOS liquid-glass: `NativeTabs` from `expo-router/unstable-native-tabs`.
- iOS classic / Android: `Tabs` with transparent bg + `BlurView` overlay on iOS, solid `colors.background` on Android, solid bg + 1px top border on web.
- Active tint: `colors.primary`. Inactive tint: `colors.mutedForeground`.

### Screen shell

Two established shell patterns:

**Header + scrollable list (Home)** — `FlatList` with a `ListHeaderComponent` that contains the app header, stories strip, and the feed section title.

**Header + scrollable sections (Explore, Planner, Passes)** — plain `ScrollView` with the heading at the top and section blocks below.

Both honor safe area:

```ts
const insets = useSafeAreaInsets();
const topPad = Platform.OS === "web" ? 67 : insets.top;
const botPad = Platform.OS === "web" ? 34 : 0;
```

Apply `topPad + 10` to the first element's `paddingTop`, and `botPad + 90` to the scroll container's `paddingBottom`.

### Section headers

Between list sections:

```tsx
<View style={{
  flexDirection: "row", justifyContent: "space-between",
  alignItems: "center", paddingHorizontal: 16,
  marginTop: 4, marginBottom: 12,
}}>
  <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground }}>
    {title}
  </Text>
  <TouchableOpacity>
    <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.primary }}>
      See all
    </Text>
  </TouchableOpacity>
</View>
```

### Dashed divider (travel-ticket aesthetic)

Used inside `PassCard` and `TravelCardView` to evoke a real travel ticket:

```ts
{
  borderTopWidth: 1,
  borderTopColor: "rgba(255,255,255,0.2)",
  borderStyle: "dashed",
  marginVertical: 12,
}
```

Use this **only** inside colored cards (pass/travel cards). For neutral surfaces, use a solid `colors.border` hairline.

---

## 8. Motion & feedback

### Touch feedback

- **`activeOpacity: 0.8` or `0.88`** on every `TouchableOpacity` that represents a tappable surface (cards, chips). Bare buttons use the default.
- Every interactive element must visibly respond. No "dead" taps.

### Haptics

See [`UI_COMPONENT_LIBRARY.md § Haptics`](UI_COMPONENT_LIBRARY.md#haptics) for the full map. In short:

| Action | Haptic |
|---|---|
| Like / share / small confirm | `Haptics.ImpactFeedbackStyle.Light` |
| Remove / destructive | `Haptics.ImpactFeedbackStyle.Medium` |
| Switch selection | `Haptics.selectionAsync()` |
| Success (book, generate) | `Haptics.NotificationFeedbackType.Success` |

### Animation library

- **`react-native-reanimated`** on the mobile app. Use it for list animations, gesture-driven transitions, shared elements.
- **Modals use the built-in `Modal` from `react-native`** with `animationType="slide"` and `presentationStyle="pageSheet"`. Do not roll your own modal.
- **`framer-motion` is catalog-included but is for the web `artifacts/mockup-sandbox` only.** Never import it inside `artifacts/mobile/`.

---

## 9. States — status palette

Status badges and pills across the app use these mappings. Reuse them — **don't invent a new color for "scheduled" or "paid"**; add the status to one of these buckets:

| Meaning | Color | Token or hex |
|---|---|---|
| Active / confirmed / success | Teal | `colors.primary` (`#0E7C7B`) |
| Upcoming / limited | Gold | `#F4A261` (`gold` token) |
| Archived / past / neutral | Muted grey | `#8A8580` (= `colors.mutedForeground`) |
| Liked / highlight | Coral | `colors.accent` (`#FF6B6B`) |
| Destructive | Red | `colors.destructive` (`#E63946`) |
| Informational wash | Tinted primary | `colors.primary + "15"` bg with `colors.primary + "30"` border |

---

## 10. Platform differences

| Concern | iOS | Android | Web |
|---|---|---|---|
| Tab bar bg | Transparent + `BlurView intensity={100}` | Solid `colors.background` | Solid `colors.background` + 1px top border |
| Tab icons | `SymbolView` (SF Symbols) | `@expo/vector-icons` | same as Android |
| Liquid-glass native tabs | Check `isLiquidGlassAvailable()` first | n/a | n/a |
| Top padding | `insets.top` | `insets.top` | `67` fixed |
| Bottom clearance | `insets.bottom` | `insets.bottom` | `34` fixed + `84` tab bar height |
| Haptics | Full | Full (less expressive on some devices) | No-op |

When adding a new screen, **copy the platform-branch scaffolding from an existing tab screen**. Do not reinvent.

---

## 11. Adding a new screen

```
1. Read this doc in full and docs/UI_COMPONENT_LIBRARY.md.
2. Check artifacts/mobile/app/(tabs)/ for a screen that solves a similar problem.
3. Create the file — inside app/(tabs)/ if it's a tab, or at app/ root if it's a pushed screen.
4. Import useColors and useSafeAreaInsets first.
5. Set up topPad/botPad with the Platform branch.
6. Build the header (heading or title row).
7. Reuse existing cards/chips/inputs. Do not create parallel primitives.
8. Tie data through useApp() / usePlanner() — do not fetch from inside the screen.
9. Add haptics on intent-carrying actions.
10. Handle empty state with the 60px icon + headline + helper pattern.
11. Test on iOS, Android, and web.
12. Run pnpm --filter @workspace/mobile run typecheck. Fix any errors.
13. Update this doc if you introduced anything new.
```

---

## 12. Anti-patterns — do not do these

- ❌ Hardcoding a hex inside a screen or component (exceptions: avatar palette, pass palette, `CARD_CONFIGS`).
- ❌ Using `fontWeight: "bold"` — use `fontFamily: "Inter_700Bold"`.
- ❌ Inventing a new radius value (e.g. `borderRadius: 14`).
- ❌ Adding a second icon library.
- ❌ Rendering server state from component state (use React Query via the generated hooks).
- ❌ Writing a new context for a feature that fits in `AppContext` or `PlannerContext`.
- ❌ Copying the avatar palette array into a new file. Reuse `getAvatarColor`.
- ❌ Using `framer-motion` inside `artifacts/mobile/`.
- ❌ Skipping haptics on a confirming/destructive action when neighboring code has them.
- ❌ Creating a new tab. The 5 tabs are fixed.
- ❌ Forking `TravelCardView` when you could add a new `type` to `CARD_CONFIGS`.

---

*Updated 2026-04-15 from prototype scan. Keep this file in lockstep with `artifacts/mobile/`.*
