import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchAlternates, fetchPlan, swapItem } from "@/lib/planner-api";

interface Alt {
  id: string;
  rank: number;
  data: Record<string, unknown>;
  tags: string[];
  deltaCost: string | null;
  deltaMinutes: number | null;
  score: number | null;
}

interface CurrentItem {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
  cost: string | null;
}

const { width } = Dimensions.get("window");
const CARD_W = width - 44;
const CARD_GAP = 12;

export default function AlternatesScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ passId: string; itemId: string }>();
  const passId = params.passId!;
  const itemId = params.itemId!;
  const [alts, setAlts] = useState<Alt[]>([]);
  const [current, setCurrent] = useState<CurrentItem | null>(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAlternates(itemId).then((arr) => setAlts(arr as Alt[])),
      fetchPlan(passId).then((doc) => {
        const found = doc.items.find((i) => i.id === itemId);
        if (found) setCurrent(found as CurrentItem);
      }),
    ])
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load."))
      .finally(() => setLoaded(true));
  }, [itemId, passId]);

  async function onSwap() {
    const pick = alts[idx];
    if (!pick) return;
    setBusy(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await swapItem(passId, itemId, pick.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setToast("Swapped · reshuffling downstream…");
      setTimeout(() => router.back(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't swap — try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← TIMELINE</Text>
        </Pressable>
        <ScreenHeader overline="LOADING" title="Finding options…" />
        <View style={{ padding: 22, gap: 10 }}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { borderColor: t.inkHair, backgroundColor: t.surface }]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (alts.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← TIMELINE</Text>
        </Pressable>
        <ScreenHeader overline="NO ALTERNATES" title="This is your best fit." />
        <View style={[styles.empty, { borderColor: t.inkHair }]}>
          <Text style={{ fontSize: 38, marginBottom: 10 }}>✦</Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
            The AI scored this slot as the best match for your preferences. No other options worth swapping for.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pick = alts[idx];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← TIMELINE</Text>
      </Pressable>

      <ScreenHeader
        overline={`ALTERNATES · ${current?.kind?.toUpperCase() ?? ""}`}
        title={`${alts.length} other option${alts.length > 1 ? "s" : ""}`}
      />

      {/* Currently picked */}
      {current ? (
        <View style={[styles.currentCard, { borderColor: t.inkHair, backgroundColor: t.paperLight }]}>
          <View style={styles.currentHead}>
            <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
              CURRENT
            </Text>
            <Stamp label="PICKED" kind="rect" />
          </View>
          <Text style={[TYPE.body, { color: t.ink, fontWeight: "500", marginTop: 4 }]}>
            {current.title}
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{current.subtitle}</Text>
          {current.cost ? (
            <Text style={[TYPE.monoXS, { color: t.ink, marginTop: 6, fontWeight: "600" }]}>
              ${Math.round(Number(current.cost)).toLocaleString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Carousel */}
      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={CARD_W + CARD_GAP}
        snapToAlignment="start"
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP));
          const clamped = Math.max(0, Math.min(alts.length - 1, i));
          if (clamped !== idx) {
            Haptics.selectionAsync().catch(() => {});
            setIdx(clamped);
          }
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {alts.map((a, i) => (
          <View
            key={a.id}
            style={[
              styles.card,
              {
                width: CARD_W,
                borderColor: i === idx ? t.terra : t.inkHair,
                borderWidth: i === idx ? 1.5 : 1,
                backgroundColor: t.surface,
              },
            ]}
          >
            <View style={styles.cardHead}>
              <View style={styles.cardRank}>
                <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                  ALT #{a.rank}
                </Text>
                <Text style={[TYPE.monoXS, { color: t.terra, marginLeft: 6, fontWeight: "600" }]}>
                  {Math.round((a.score ?? 0) * 100)}%
                </Text>
              </View>
              <DeltaBadge deltaCost={a.deltaCost} />
            </View>

            <Text style={[TYPE.displayM, { color: t.ink, marginTop: 4 }]}>
              {altTitle(a.data)}
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
              {altSubtitle(a.data)}
            </Text>

            {/* Tags row */}
            <View style={styles.tags}>
              {a.tags.slice(0, 4).map((tag) => (
                <TimeChip key={tag} label={tag} tone={tag === "CHEAPER" || tag === "EARLIER" ? "terra" : "mute"} />
              ))}
            </View>

            {/* Comparison vs current */}
            {current ? (
              <View style={[styles.compareRow, { borderTopColor: t.inkHair }]}>
                <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 6, fontWeight: "600" }]}>
                  VS. CURRENT
                </Text>
                <CompareLine
                  label="Cost"
                  delta={a.deltaCost ? `${Number(a.deltaCost) < 0 ? "−" : "+"}$${Math.abs(Number(a.deltaCost)).toFixed(0)}` : "Same"}
                  better={a.deltaCost != null && Number(a.deltaCost) < 0}
                />
                <CompareLine
                  label="Time"
                  delta={
                    a.deltaMinutes != null
                      ? a.deltaMinutes === 0
                        ? "Same"
                        : `${a.deltaMinutes > 0 ? "+" : "−"}${Math.abs(a.deltaMinutes)} min`
                      : "Same"
                  }
                  better={a.deltaMinutes != null && a.deltaMinutes < 0}
                />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {alts.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === idx ? t.terra : t.inkHair,
                width: i === idx ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Error inline */}
      {error ? (
        <View style={[styles.errorPill, { borderColor: t.stampRed }]}>
          <Text style={[TYPE.bodyS, { color: t.stampRed }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <PillBtn
          label={busy ? "Swapping…" : `Swap to alt #${pick?.rank ?? "—"}`}
          tone="terra"
          fullWidth
          disabled={!pick || busy}
          onPress={onSwap}
        />
        <Text style={[TYPE.monoXS, { color: t.inkMute, textAlign: "center", marginTop: 8 }]}>
          DOWNSTREAM ITEMS WILL RESHUFFLE
        </Text>
      </View>

      {toast ? (
        <View style={[styles.toast, { backgroundColor: t.ink }]} pointerEvents="none">
          <Text style={[TYPE.bodyS, { color: "#fff", fontWeight: "500" }]}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function CompareLine({
  label,
  delta,
  better,
}: {
  label: string;
  delta: string;
  better: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={styles.compareLine}>
      <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{label}</Text>
      <Text style={[TYPE.monoS, { color: better ? t.terra : t.ink, fontWeight: "600" }]}>
        {delta}
      </Text>
    </View>
  );
}

function DeltaBadge({ deltaCost }: { deltaCost: string | null }) {
  const { t } = useTheme();
  if (deltaCost == null) return null;
  const n = Number(deltaCost);
  const sign = n >= 0 ? "+" : "−";
  const color = n < 0 ? t.terra : t.inkMute;
  return (
    <View
      style={[
        styles.deltaBadge,
        {
          borderColor: n < 0 ? t.terra : t.inkHair,
          backgroundColor: n < 0 ? `${t.terra}20` : "transparent",
        },
      ]}
    >
      <Text style={[TYPE.monoXS, { color, fontWeight: "700" }]}>
        {sign}${Math.abs(n).toFixed(0)}
      </Text>
    </View>
  );
}

function altTitle(data: Record<string, unknown>): string {
  if (typeof data.name === "string") return data.name;
  if (typeof data.depAirport === "string" && typeof data.arrAirport === "string") {
    return `${data.depAirport} → ${data.arrAirport}`;
  }
  return "Option";
}
function altSubtitle(data: Record<string, unknown>): string {
  if (typeof data.carrier === "string" && typeof data.flightNo === "string") {
    return `${data.carrier} ${data.flightNo}`;
  }
  if (typeof data.address === "string") return data.address;
  if (typeof data.venue === "string") return data.venue;
  return "";
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  back: { paddingTop: 8 },
  skeleton: { height: 160, borderWidth: 1, borderRadius: 14, opacity: 0.4 },
  empty: {
    flex: 1,
    marginVertical: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  currentCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  currentHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scrollContainer: { paddingVertical: 14, gap: CARD_GAP, paddingRight: 22 },
  card: {
    borderRadius: 14,
    padding: 16,
    minHeight: 240,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardRank: { flexDirection: "row", alignItems: "baseline" },
  deltaBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  compareRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  compareLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
  },
  dot: { height: 6, borderRadius: 3 },
  errorPill: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  footer: { paddingBottom: 14 },
  toast: {
    position: "absolute",
    bottom: 84,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
