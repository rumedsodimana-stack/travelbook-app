import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchPlan } from "@/lib/planner-api";

interface Item {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  sortAt: string;
}

const POLL_MS = 600;
const EXPECTED_MIN = 8;

const THINKING_VERBS = [
  "Reading your prompt…",
  "Sourcing flights…",
  "Picking your stays…",
  "Threading activities…",
  "Checking visa requirements…",
  "Adding dining anchors…",
  "Sequencing the timeline…",
  "Cross-checking with your buddies…",
  "Stamping the pass…",
];

const KIND_EMOJI: Record<string, string> = {
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

export default function BuildingScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ passId: string }>();
  const passId = params.passId!;
  const [items, setItems] = useState<Item[]>([]);
  const [done, setDone] = useState(false);
  const [verbIdx, setVerbIdx] = useState(0);
  const [dots, setDots] = useState(0);
  const stableTicks = useRef(0);
  const lastItemCountRef = useRef(0);

  // Animated progress bar
  const progress = useRef(new Animated.Value(0)).current;

  // Polling loop
  useEffect(() => {
    let cancelled = false;
    let lastCount = 0;

    async function tick() {
      if (cancelled) return;
      try {
        const data = await fetchPlan(passId);
        if (cancelled) return;
        if (data.items.length > lastItemCountRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          lastItemCountRef.current = data.items.length;
        }
        setItems(data.items as Item[]);
        const built = data.pass.aiBuiltAt != null;
        const stableEnough = data.items.length >= EXPECTED_MIN;
        if (data.items.length === lastCount) {
          stableTicks.current += 1;
        } else {
          stableTicks.current = 0;
        }
        lastCount = data.items.length;
        if (built || (stableEnough && stableTicks.current >= 3)) {
          setDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setTimeout(() => {
            if (!cancelled) {
              router.replace({ pathname: "/planner/[passId]", params: { passId } });
            }
          }, 900);
          return;
        }
      } catch {
        // swallow — retry on next tick
      }
      setTimeout(tick, POLL_MS);
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, [passId, router]);

  // Animate the progress bar
  const percent = Math.min(95, Math.round((items.length / EXPECTED_MIN) * 100));
  useEffect(() => {
    Animated.timing(progress, {
      toValue: done ? 1 : percent / 100,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, done, progress]);

  // Cycle thinking verbs
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setVerbIdx((v) => (v + 1) % THINKING_VERBS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [done]);

  // Animated dots
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 400);
    return () => clearInterval(id);
  }, [done]);

  const step = done ? 3 : items.length >= EXPECTED_MIN - 1 ? 3 : items.length > 0 ? 2 : 1;
  const stepLabel = ["Reading", "Sourcing", "Threading"][step - 1] ?? "Sourcing";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="CANCEL" fallback="/(tabs)/planner" />

      <ScreenHeader overline="AI PLANNER · BUILDING" title="Threading your trip…" />

      {/* Progress hero — dark card */}
      <View style={[styles.card, { backgroundColor: t.ink }]}>
        <View pointerEvents="none" style={styles.cardInnerBorder} />

        <View style={styles.stepRow}>
          <View style={styles.stepDots}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      s < step ? t.terra : s === step ? "#fff" : "rgba(255,255,255,0.2)",
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
            ✦ STEP {step} OF 3 · {stepLabel.toUpperCase()}
          </Text>
        </View>

        <View style={styles.verbRow}>
          <Text style={[TYPE.displayM, { color: "#fff", flexShrink: 1 }]} numberOfLines={2}>
            {done ? "Done — opening your timeline" : THINKING_VERBS[verbIdx]}
            {!done ? ".".repeat(dots) : ""}
          </Text>
        </View>

        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: t.terra,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.barCaption}>
          <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.55)" }]}>
            {done ? "100%" : `${percent}%`}
          </Text>
          <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.55)" }]}>
            {items.length} OF ~{EXPECTED_MIN}+ ITEMS
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 10 }]}>
          SETTLING
        </Text>

        {items.length === 0 ? (
          <View style={[styles.dashedCard, { borderColor: t.inkHair }]}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>✦</Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
              Sit tight — the AI is reading your prompt and looking through ~5,000 options.
            </Text>
          </View>
        ) : (
          items.map((it, i) => (
            <SettlingCard
              key={it.id}
              item={it}
              isLatest={i === items.length - 1 && !done}
            />
          ))
        )}

        {!done && items.length > 0 ? (
          <View style={[styles.pendingCard, { borderColor: t.inkSoft }]}>
            <Text style={[TYPE.bodyS, { color: t.inkMute }]}>
              Working on the next slot{".".repeat(dots)}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PillBtn
          label="Cancel"
          tone="cream"
          fullWidth
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

function SettlingCard({ item, isLatest }: { item: Item; isLatest: boolean }) {
  const { t } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const time = new Date(item.sortAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      style={[
        styles.itemRow,
        {
          borderColor: isLatest ? t.terra : t.inkHair,
          borderWidth: isLatest ? 1.5 : 1,
          backgroundColor: t.surface,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={styles.itemHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>{KIND_EMOJI[item.kind] ?? "✦"}</Text>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
            {item.kind.toUpperCase()}
          </Text>
        </View>
        <TimeChip label={time} />
      </View>
      <Text style={[TYPE.body, { color: t.ink }]}>{item.title}</Text>
      <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{item.subtitle}</Text>
      <View style={{ position: "absolute", top: 8, right: 8 }}>
        <Stamp label="OK" kind="rect" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
  },
  cardInnerBorder: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  stepDots: { flexDirection: "row", gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  verbRow: { minHeight: 56, justifyContent: "center" },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    marginTop: 18,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 999 },
  barCaption: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  scroll: { gap: 10, paddingBottom: 22 },
  dashedCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
  },
  pendingCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    opacity: 0.7,
  },
  itemRow: {
    borderRadius: 14,
    padding: 14,
    gap: 2,
    position: "relative",
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  footer: { paddingBottom: 14 },
});
