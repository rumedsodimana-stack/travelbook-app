import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LiveDot } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useNow } from "@/hooks/useNow";
import { useTheme } from "@/hooks/useTheme";
import { fetchPlan } from "@/lib/planner-api";

interface Item {
  id: string;
  kind: string;
  state: string;
  title: string;
  subtitle: string;
  sortAt: string;
}

const KIND_GLYPH: Record<string, string> = {
  flight: "✈",
  stay: "🏨",
  activity: "🎟",
  dining: "🍣",
  transit: "🚆",
  visa: "🪪",
  insurance: "🛡",
  event: "🎫",
  entertainment: "🎭",
};

const HEADS_UP = [
  { id: "hu-1", title: "Light rain at 16:00", body: "Pack the layer you stashed in the hotel.", icon: "☂" },
  { id: "hu-2", title: "Cherry blossom peak today", body: "Naka-Meguro river walk hits 90% bloom.", icon: "🌸" },
];

const PHRASE_OF_THE_DAY = {
  src: "ありがとう",
  pron: "arigatō",
  en: "thank you",
};

export default function DayOfScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const passId = params.id!;
  const now = useNow();
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlan(passId)
      .then((doc) => setItems(doc.items as Item[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load."))
      .finally(() => setLoaded(true));
  }, [passId]);

  const today = sameDay(now);
  const todayItems = items
    .filter((i) => sameDay(new Date(i.sortAt)) === today)
    .sort((a, b) => Date.parse(a.sortAt) - Date.parse(b.sortAt));

  const nextItem = todayItems.find((it) => Date.parse(it.sortAt) > now.getTime());
  const minsUntilNext = nextItem
    ? Math.max(0, Math.round((Date.parse(nextItem.sortAt) - now.getTime()) / 60_000))
    : null;

  const greeting = (() => {
    const h = now.getHours();
    if (h < 5) return "Late night.";
    if (h < 12) return "Good morning.";
    if (h < 17) return "Good afternoon.";
    if (h < 21) return "Good evening.";
    return "Late night.";
  })();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← PASS</Text>
        </Pressable>
        <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
          {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
        </Text>
      </View>

      <ScreenHeader overline="DAY OF · LIVE" title={greeting} />

      {/* Weather + rate + walk budget strip */}
      <View style={[styles.strip, { borderColor: t.inkHair }]}>
        <StripItem label="WEATHER" value="17° ☁" sub="rain 4pm" />
        <StripDivider />
        <StripItem label="JPY" value="¥152" sub="vs $1" />
        <StripDivider />
        <StripItem label="WALK $" value="$80" sub="per day" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 60 }}>
        {!loaded ? (
          <>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.skeleton, { borderColor: t.inkHair, backgroundColor: t.surface }]}
              />
            ))}
          </>
        ) : error ? (
          <View style={[styles.errorCard, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.body, { color: t.ink, marginBottom: 6 }]}>
              Couldn't load today.
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{error}</Text>
          </View>
        ) : todayItems.length === 0 ? (
          <View style={[styles.empty, { borderColor: t.inkHair }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>☕</Text>
            <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
              Nothing scheduled.
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
              Take the day. The AI can suggest something free in your neighborhood — tap below.
            </Text>
          </View>
        ) : (
          <>
            {/* Next-up hero */}
            {nextItem && minsUntilNext != null ? (
              <View
                style={[
                  styles.nextHero,
                  { borderColor: t.terra, backgroundColor: t.surface },
                ]}
              >
                <View style={styles.nextHead}>
                  <View style={styles.nextBadge}>
                    <LiveDot color={t.terra} size={6} />
                    <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                      NEXT UP · IN {minsUntilNext < 60 ? `${minsUntilNext} MIN` : `${Math.round(minsUntilNext / 60)}H`}
                    </Text>
                  </View>
                  {minsUntilNext <= 30 ? <Stamp label="LEAVE NOW" kind="rect" /> : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <Text style={{ fontSize: 28 }}>{KIND_GLYPH[nextItem.kind] ?? "✦"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.displayM, { color: t.ink }]}>{nextItem.title}</Text>
                    <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{nextItem.subtitle}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Heads-up cards */}
            {HEADS_UP.length > 0 ? (
              <View>
                <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>
                  HEADS UP
                </Text>
                {HEADS_UP.map((h) => (
                  <View
                    key={h.id}
                    style={[
                      styles.headsUp,
                      { borderColor: t.inkSoft, backgroundColor: t.paper },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{h.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{h.title}</Text>
                      <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{h.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Today's schedule */}
            <View>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>
                TODAY · {todayItems.length} ITEMS
              </Text>
              <View style={{ gap: 10 }}>
                {todayItems.map((it) => {
                  const ms = Date.parse(it.sortAt);
                  const isNow = ms <= now.getTime() && ms + 60 * 60_000 > now.getTime();
                  const isPast = ms < now.getTime() - 60 * 60_000;
                  return (
                    <Pressable
                      key={it.id}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        router.push({
                          pathname: "/pass/[id]/items/[itemId]",
                          params: { id: passId, itemId: it.id },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderColor: isNow ? t.terra : t.inkHair,
                          borderWidth: isNow ? 1.5 : 1,
                          backgroundColor: t.surface,
                          opacity: pressed ? 0.7 : isPast ? 0.5 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.kindIcon, { backgroundColor: isNow ? t.terra : t.paper }]}>
                        <Text style={{ fontSize: 14 }}>{KIND_GLYPH[it.kind] ?? "•"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            TYPE.monoXS,
                            { color: isNow ? t.terra : t.inkMute, fontWeight: "600" },
                          ]}
                        >
                          {it.kind.toUpperCase()}
                          {isNow ? " · NOW" : isPast ? " · DONE" : ""}
                        </Text>
                        <Text style={[TYPE.body, { color: t.ink }]}>{it.title}</Text>
                        <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{it.subtitle}</Text>
                      </View>
                      <TimeChip
                        label={new Date(it.sortAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        tone={isNow ? "terra" : "mute"}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Phrase of the day */}
            <View style={[styles.phraseCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
              <Text style={[TYPE.monoXS, { color: t.terra, marginBottom: 8, fontWeight: "600" }]}>
                ✦ PHRASE OF THE DAY
              </Text>
              <Text style={[TYPE.displayL, { color: t.ink }]}>{PHRASE_OF_THE_DAY.src}</Text>
              <Text style={[TYPE.body, { color: t.inkMute, marginTop: 4 }]}>
                {PHRASE_OF_THE_DAY.pron}
              </Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 8 }]}>
                "{PHRASE_OF_THE_DAY.en}"
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StripItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>{label}</Text>
      <Text style={[TYPE.body, { color: t.ink, marginTop: 2, fontWeight: "600" }]}>{value}</Text>
      {sub ? (
        <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

function StripDivider() {
  const { t } = useTheme();
  return <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair, marginVertical: 4 }} />;
}

function sameDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingVertical: 8,
  },
  strip: {
    flexDirection: "row",
    paddingVertical: 16,
    marginHorizontal: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeleton: { height: 80, borderWidth: 1, borderRadius: 14, opacity: 0.4 },
  errorCard: { borderWidth: 1, borderRadius: 14, padding: 16 },
  empty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
  },
  nextHero: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
  },
  nextHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  headsUp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  kindIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  phraseCard: { borderWidth: 1, borderRadius: 14, padding: 16 },
});
