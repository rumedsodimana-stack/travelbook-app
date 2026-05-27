import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvatarDot } from "@/components/primitives/AvatarDot";
import { BookmarkIcon } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { Placeholder } from "@/components/primitives/Placeholder";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

const CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: "Culture", icon: "🏛" },
  { name: "Food", icon: "🍣" },
  { name: "Adventure", icon: "🧗" },
  { name: "Wellness", icon: "🧘" },
  { name: "City", icon: "🌆" },
  { name: "Nature", icon: "🌲" },
];

const EDITORS_PICK = {
  title: "Cherry blossom is peaking — your window closes in 9 days.",
  body: "Tokyo + Kyoto are at 87% bloom this week. Three of your buddies are looking at Japan dates. Worth seeing if you can leave by next Thursday.",
  emoji: "🌸",
  promptHint: "Cherry blossom week in Japan, partner, mid-budget, slow",
};

const TRENDING = [
  { city: "Tokyo", blurb: "Sakura · 87% peak this week", promptHint: "Cherry blossom week in Japan", emoji: "🌸" },
  { city: "Bali", blurb: "Surf swell · 6ft and clean", promptHint: "Bali surf trip · Canggu base", emoji: "🌊" },
  { city: "Lisbon", blurb: "Shoulder season prices", promptHint: "Long weekend in Lisbon, ocean walks", emoji: "🌅" },
  { city: "Reykjavik", blurb: "Aurora forecast K6 tonight", promptHint: "Iceland ring road, midnight sun", emoji: "✨" },
];

const TRIBE_PICKS = [
  { handle: "@lila.h", city: "Tokyo", note: "going in 9 days", tone: "terra" as const },
  { handle: "@mei.k", city: "Tokyo", note: "saved this trip", tone: "paper" as const },
  { handle: "@ravi.s", city: "Bali", note: "left 4 days ago", tone: "dark" as const },
];

const PACKAGES = [
  {
    title: "Tokyo + Kyoto · 7 nights",
    provider: "Sora Tours",
    place: "Japan",
    days: 7,
    priceUSD: 3480,
    rating: 4.8,
    verified: true,
    promptHint: "Cherry blossom week in Japan, partner, mid-budget, slow",
  },
  {
    title: "Wellness Week",
    provider: "Soori Bali",
    place: "Bali",
    days: 8,
    priceUSD: 2890,
    rating: 4.9,
    verified: true,
    promptHint: "Bali — surf mornings, yoga, no nightlife",
  },
  {
    title: "Tagus Slow",
    provider: "Belém Hosts",
    place: "Lisbon",
    days: 5,
    priceUSD: 1490,
    rating: 4.6,
    verified: false,
    promptHint: "Long weekend in Lisbon, pescatarian, ocean walks",
  },
  {
    title: "Ring Road · Self-drive",
    provider: "Reykjavik Routes",
    place: "Iceland",
    days: 7,
    priceUSD: 3120,
    rating: 4.7,
    verified: true,
    promptHint: "Iceland ring road, midnight sun, slow drive",
  },
];

export default function ExploreScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function searchToPlanner() {
    const q = query.trim();
    if (!q) return;
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: "/(tabs)/planner", params: { prompt: q } });
  }

  function packageToPlanner(promptHint: string) {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: "/(tabs)/planner", params: { prompt: promptHint } });
  }

  function toggleSave(key: string) {
    Haptics.selectionAsync().catch(() => {});
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: t.appBg, paddingTop: insets.top }]}>
      <PaperTexture />
      <ScreenHeader overline="DISCOVER" title="Explore" />

      {/* Personalization line */}
      <View style={[styles.personalize, { borderBottomColor: t.inkHair }]}>
        <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
          FOR <Text style={{ color: t.terra }}>@DEV</Text> · CULTURE · SLOW PACE · PESCATARIAN
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Search */}
        <View style={[styles.search, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchToPlanner}
            placeholder="Search or describe a trip…"
            placeholderTextColor={t.inkMute}
            style={[TYPE.body, { color: t.ink, flex: 1 }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={searchToPlanner}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>PLAN →</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Categories with icons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((c, i) => (
            <Pressable
              key={c.name}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setActiveCat(i); }}
              style={[
                styles.catChip,
                {
                  borderColor: activeCat === i ? t.ink : t.inkHair,
                  backgroundColor: activeCat === i ? t.ink : "transparent",
                },
              ]}
            >
              <Text style={{ fontSize: 14 }}>{c.icon}</Text>
              <Text style={[TYPE.bodyS, { color: activeCat === i ? "#fff" : t.ink, fontWeight: "500" }]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Editor's pick — hero */}
        <Pressable
          onPress={() => packageToPlanner(EDITORS_PICK.promptHint)}
          style={[styles.editorsPick, { backgroundColor: t.ink }]}
        >
          <View pointerEvents="none" style={styles.editorsInner} />
          <View style={styles.editorsHeader}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              ✦ EDITOR'S PICK · THIS WEEK
            </Text>
            <Stamp label="LIMITED" kind="rect" />
          </View>
          <Text style={{ fontSize: 38, marginVertical: 8 }}>{EDITORS_PICK.emoji}</Text>
          <Text style={[TYPE.displayL, { color: "#fff" }]}>{EDITORS_PICK.title}</Text>
          <Text style={[TYPE.bodyS, { color: "rgba(255,255,255,0.7)", marginTop: 10 }]}>
            {EDITORS_PICK.body}
          </Text>
          <View style={styles.editorsCta}>
            <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
              PLAN THIS TRIP →
            </Text>
          </View>
        </Pressable>

        {/* Trending */}
        <Section title="Trending">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendRow}
          >
            {TRENDING.map((trip) => {
              const key = `trend-${trip.city}`;
              const isSaved = saved.has(key);
              return (
                <Pressable
                  key={trip.city}
                  onPress={() => packageToPlanner(trip.promptHint)}
                  style={[styles.trendCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}
                >
                  <View style={styles.trendImg}>
                    <Placeholder caption={trip.city.toLowerCase()} height={100} />
                    <View style={styles.trendEmoji}>
                      <Text style={{ fontSize: 22 }}>{trip.emoji}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => { e.stopPropagation?.(); toggleSave(key); }}
                      style={[styles.saveCorner, { backgroundColor: t.surface }]}
                      hitSlop={6}
                    >
                      <BookmarkIcon color={isSaved ? t.terra : t.ink} size={16} filled={isSaved} />
                    </Pressable>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{trip.city}</Text>
                    <Text style={[TYPE.monoXS, { color: t.terra, marginTop: 4 }]}>
                      {trip.blurb.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Section>

        {/* Trending with your tribe */}
        <Section title="Trending with your tribe">
          <View style={styles.tribeList}>
            {TRIBE_PICKS.map((p, i) => (
              <Pressable
                key={p.handle}
                onPress={() => packageToPlanner(`Trip to ${p.city}`)}
                style={({ pressed }) => [
                  styles.tribeRow,
                  {
                    borderBottomColor: t.inkHair,
                    borderBottomWidth: i === TRIBE_PICKS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <AvatarDot size={36} tone={p.tone} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.body, { color: t.ink }]}>
                    <Text style={{ fontWeight: "600" }}>{p.handle}</Text>{" "}
                    <Text style={{ color: t.inkMute }}>{p.note} ·</Text>{" "}
                    <Text style={{ fontWeight: "600" }}>{p.city}</Text>
                  </Text>
                </View>
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>VIEW →</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Curated packages */}
        <Section title="Curated · by tour providers">
          {PACKAGES.map((p) => {
            const key = `pkg-${p.title}`;
            const isSaved = saved.has(key);
            return (
              <Pressable
                key={p.title}
                onPress={() => packageToPlanner(p.promptHint)}
                style={({ pressed }) => [
                  styles.pkg,
                  {
                    borderColor: t.inkHair,
                    backgroundColor: t.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.pkgImg}>
                  <Placeholder
                    caption={`${p.place.toLowerCase()} — ${p.provider.toLowerCase()}`}
                    height={140}
                  />
                  <Pressable
                    onPress={(e) => { e.stopPropagation?.(); toggleSave(key); }}
                    style={[styles.saveCorner, { backgroundColor: t.surface, top: 10, right: 10 }]}
                    hitSlop={6}
                  >
                    <BookmarkIcon color={isSaved ? t.terra : t.ink} size={16} filled={isSaved} />
                  </Pressable>
                  <View style={styles.ratingChip}>
                    <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
                      ★ {p.rating}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 12 }}>
                  <View style={styles.pkgProvider}>
                    <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                      {p.provider.toUpperCase()} · {p.days} DAYS
                    </Text>
                    {p.verified ? (
                      <Text style={[TYPE.monoXS, { color: t.terra }]}>✓ VERIFIED</Text>
                    ) : null}
                  </View>
                  <Text style={[TYPE.displayM, { color: t.ink, marginTop: 4 }]}>{p.title}</Text>
                  <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{p.place}</Text>
                  <View style={styles.pkgFooter}>
                    <View>
                      <Text style={[TYPE.monoXS, { color: t.inkMute }]}>FROM</Text>
                      <Text style={[TYPE.displayM, { color: t.ink, fontSize: 18 }]}>
                        ${p.priceUSD.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.pkgCta, { backgroundColor: t.ink }]}>
                      <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
                        ADD TO PLAN →
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Section>

        {/* Build your own */}
        <Section title="">
          <Pressable
            onPress={() => router.push("/(tabs)/planner")}
            style={[styles.buildOwn, { borderColor: t.terra }]}
          >
            <Text style={{ fontSize: 28, marginBottom: 6 }}>✦</Text>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>BUILD YOUR OWN</Text>
            <Text style={[TYPE.displayM, { color: t.ink, marginTop: 6, textAlign: "center" }]}>
              Have something else in mind?
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2, textAlign: "center" }]}>
              The AI will assemble flights, stays, activities into one Pass.
            </Text>
          </Pressable>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      {title ? (
        <Text style={[TYPE.monoXS, { color: t.inkMute, paddingHorizontal: 22, marginBottom: 10 }]}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  personalize: {
    paddingHorizontal: 22,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 22,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  catRow: { gap: 8, paddingHorizontal: 22, paddingVertical: 14, paddingRight: 32 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editorsPick: {
    marginHorizontal: 22,
    marginTop: 8,
    borderRadius: 14,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  editorsInner: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.15)",
  },
  editorsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editorsCta: {
    marginTop: 14,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.4)",
  },
  trendRow: { gap: 10, paddingHorizontal: 22, paddingRight: 32 },
  trendCard: {
    width: 180,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  trendImg: { position: "relative" },
  trendEmoji: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveCorner: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tribeList: {
    marginHorizontal: 22,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  tribeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  pkg: {
    marginHorizontal: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  pkgImg: { position: "relative" },
  ratingChip: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(10,37,64,0.85)",
  },
  pkgProvider: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pkgFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  pkgCta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buildOwn: {
    marginHorizontal: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
  },
});
