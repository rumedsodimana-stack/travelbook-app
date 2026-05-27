import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookAllSheet } from "@/components/booking/BookAllSheet";
import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { bookAll, fetchPlan } from "@/lib/planner-api";

interface PassDoc {
  pass: {
    id: string;
    title: string;
    state: string;
    totalCost: string;
    aiBuiltAt: string | null;
  };
  items: Array<{
    id: string;
    kind: string;
    state: string;
    title: string;
    subtitle: string;
    sortAt: string;
    cost: string | null;
  }>;
}

const KIND_META: Record<string, { icon: string; label: string }> = {
  flight: { icon: "✈", label: "Flight" },
  stay: { icon: "🏨", label: "Stay" },
  activity: { icon: "🎫", label: "Activity" },
  dining: { icon: "🍽", label: "Dining" },
  transit: { icon: "🚆", label: "Transit" },
  visa: { icon: "📄", label: "Visa" },
  insurance: { icon: "🛡", label: "Insurance" },
  event: { icon: "🎟", label: "Event" },
  entertainment: { icon: "🎭", label: "Show" },
};

export default function TimelineScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ passId: string }>();
  const passId = params.passId!;
  const [doc, setDoc] = useState<PassDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoc((await fetchPlan(passId)) as PassDoc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan could not load.");
    } finally {
      setLoading(false);
    }
  }, [passId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  function onBookAll() {
    Haptics.selectionAsync().catch(() => {});
    setBookSheetOpen(true);
  }

  async function onMintPass() {
    setBookSheetOpen(false);
    setBusy(true);
    try {
      await bookAll(passId);
      router.replace({ pathname: "/pass/[id]", params: { id: passId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mint Pass.");
    } finally {
      setBusy(false);
    }
  }

  const sorted = useMemo(
    () =>
      doc
        ? [...doc.items].sort((a, b) => Date.parse(a.sortAt) - Date.parse(b.sortAt))
        : [],
    [doc],
  );

  const dayGroups = useMemo(() => {
    const out: { dayKey: string; label: string; items: PassDoc["items"] }[] = [];
    sorted.forEach((it) => {
      const d = new Date(it.sortAt);
      const dayKey = d.toISOString().slice(0, 10);
      const existing = out.find((g) => g.dayKey === dayKey);
      const label = d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (existing) existing.items.push(it);
      else out.push({ dayKey, label, items: [it] });
    });
    return out;
  }, [sorted]);

  const totalCost = useMemo(() => {
    if (!doc) return 0;
    return (
      Number(doc.pass.totalCost) ||
      sorted.reduce((acc, it) => acc + Number(it.cost ?? 0), 0)
    );
  }, [doc, sorted]);

  const costByKind = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((it) => {
      const v = Number(it.cost ?? 0);
      map.set(it.kind, (map.get(it.kind) ?? 0) + v);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [sorted]);

  const cancelledCount = sorted.filter((s) => s.state === "cancelled").length;
  const builtAgo = doc?.pass.aiBuiltAt ? agoLabel(doc.pass.aiBuiltAt) : null;

  const actions: ActionSheetItem[] = [
    { label: "Rebuild from prompt", onPress: () => router.back() },
    { label: "Share draft", onPress: () => {} },
    { label: "Discard draft", destructive: true, onPress: () => {} },
  ];

  // Loading skeleton
  if (loading && !doc) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <BackBar label="BACK" fallback="/(tabs)/planner" />
        <ScreenHeader overline="ITINERARY · ASSEMBLING" title="Loading your draft…" />
        <View style={{ paddingHorizontal: 22, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.skel, { backgroundColor: t.surface, borderColor: t.inkHair }]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (error && !doc) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <BackBar label="BACK" fallback="/(tabs)/planner" />
        <ScreenHeader overline="ITINERARY · ERROR" title="Plan didn't load." />
        <View style={{ paddingHorizontal: 22 }}>
          <View style={[styles.errBox, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.monoXS, { color: t.stampRed, fontWeight: "700" }]}>
              ✕ {error.toUpperCase()}
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
              The draft is safe on the server. Try again.
            </Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <PillBtn label="Retry" tone="terra" fullWidth onPress={reload} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Empty
  if (doc && sorted.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <ScreenHeader overline="ITINERARY · EMPTY" title="Nothing assembled yet." />
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={[TYPE.body, { color: t.inkMute }]}>
            The AI hasn't placed any items. Rebuild the plan or edit the prompt.
          </Text>
          <View style={{ marginTop: 14, gap: 10 }}>
            <PillBtn label="Rebuild plan" tone="terra" fullWidth onPress={() => router.back()} />
            <PillBtn label="Discard draft" tone="cream" fullWidth onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← BACK</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActionsOpen(true);
          }}
        >
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>···</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 22 }}>
        <ScreenHeader
          overline={`DRAFT · ${sorted.length} ELEMENTS · ${dayGroups.length} DAYS`}
          title={doc!.pass.title}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 140 }}>
        {/* AI assembled banner */}
        <View style={[styles.aiBanner, { borderColor: t.terra }]}>
          <Stamp label="AI" kind="circle" rotate={-4} />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
              ✦ AI ASSEMBLED{builtAgo ? ` · ${builtAgo.toUpperCase()}` : ""}
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 4 }]}>
              Tap any card to see 3–5 alternates. Swap, and downstream items reshuffle.
            </Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <Stat n={String(dayGroups.length)} label="DAYS" />
          <Stat n={String(sorted.length)} label="ITEMS" />
          <Stat n={`$${Math.round(totalCost)}`} label="TOTAL" />
          <Stat
            n={
              cancelledCount > 0
                ? String(cancelledCount)
                : sorted.filter((s) => s.state === "confirmed").length.toString()
            }
            label={cancelledCount > 0 ? "TO RESHUFFLE" : "CONFIRMED"}
          />
        </View>

        {cancelledCount > 0 ? (
          <View style={[styles.reshuffleNudge, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.monoXS, { color: t.stampRed, fontWeight: "700" }]}>
              ⟳ {cancelledCount} ITEM{cancelledCount > 1 ? "S" : ""} CANCELLED · RESHUFFLE ON BOOK
            </Text>
          </View>
        ) : null}

        {/* Day groups */}
        {dayGroups.map((day, dayIdx) => (
          <View key={day.dayKey} style={{ marginTop: 22 }}>
            <View style={styles.dayHead}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                DAY {dayIdx + 1}
              </Text>
              <View style={[styles.dayDivider, { backgroundColor: t.inkHair }]} />
              <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                {day.label.toUpperCase()}
              </Text>
            </View>

            {day.items.map((item, idx) => {
              const meta = KIND_META[item.kind] ?? { icon: "·", label: item.kind };
              const isLast = idx === day.items.length - 1 && dayIdx === dayGroups.length - 1;
              const cancelled = item.state === "cancelled";
              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/planner/[passId]/items/[itemId]/alternates",
                      params: { passId, itemId: item.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.timelineRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: cancelled ? t.stampRed : t.terra },
                      ]}
                    />
                    {!isLast ? (
                      <View style={[styles.line, { backgroundColor: t.inkSoft }]} />
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.card,
                      {
                        borderColor: cancelled ? t.stampRed : t.inkHair,
                        backgroundColor: t.surface,
                        opacity: cancelled ? 0.6 : 1,
                      },
                    ]}
                  >
                    <View style={styles.cardHead}>
                      <View style={styles.kindChip}>
                        <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                        <Text
                          style={[
                            TYPE.monoXS,
                            { color: t.inkMute, fontWeight: "700" },
                          ]}
                        >
                          {meta.label.toUpperCase()}
                        </Text>
                      </View>
                      <TimeChip label={timePill(item.sortAt)} />
                    </View>

                    <View style={styles.itemBody}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}
                          numberOfLines={2}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                      {item.state === "confirmed" ? (
                        <Stamp label="OK" kind="circle" rotate={-3} />
                      ) : null}
                    </View>

                    <View style={[styles.cardFoot, { borderTopColor: t.inkHair }]}>
                      {cancelled ? (
                        <Text
                          style={[
                            TYPE.monoXS,
                            { color: t.stampRed, fontWeight: "700" },
                          ]}
                        >
                          ✕ CANCELLED · WILL RESHUFFLE
                        </Text>
                      ) : (
                        <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                          3–5 ALTERNATES · TAP TO SWAP
                        </Text>
                      )}
                      <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "700" }]}>
                        {item.cost ? `$${Math.round(Number(item.cost))}` : "—"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Cost breakdown */}
        <Text
          style={[
            TYPE.monoXS,
            { color: t.inkMute, marginTop: 28, marginBottom: 10, fontWeight: "700" },
          ]}
        >
          COST BREAKDOWN
        </Text>
        <View style={[styles.costCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          {costByKind.map(([kind, sum], i) => (
            <View
              key={kind}
              style={[
                styles.costRow,
                {
                  borderBottomColor: t.inkHair,
                  borderBottomWidth: i === costByKind.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{KIND_META[kind]?.icon ?? "·"}</Text>
              <Text style={[TYPE.body, { color: t.ink, flex: 1, textTransform: "capitalize" }]}>
                {KIND_META[kind]?.label ?? kind}
              </Text>
              <Text style={[TYPE.monoS, { color: t.ink, fontWeight: "600" }]}>
                ${Math.round(sum)}
              </Text>
            </View>
          ))}
          <View
            style={[
              styles.costRow,
              { borderTopColor: t.terra, borderTopWidth: 1.5, paddingTop: 14 },
            ]}
          >
            <Text style={{ fontSize: 16 }}>∑</Text>
            <Text style={[TYPE.body, { color: t.ink, flex: 1, fontWeight: "700" }]}>
              Total per person
            </Text>
            <Text style={[TYPE.displayM, { color: t.terra, fontSize: 20 }]}>
              ${Math.round(totalCost)}
            </Text>
          </View>
        </View>

        <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 18, textAlign: "center" }]}>
          BOOKING IS MOCK IN V1 · NO CARD CHARGED · PASS MINTS IN ~2S
        </Text>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.appBg, borderTopColor: t.inkHair }]}>
        <PillBtn
          label={busy ? "Minting Pass…" : `✦ Book all · $${Math.round(totalCost)}`}
          tone="terra"
          fullWidth
          disabled={busy || sorted.length === 0}
          onPress={onBookAll}
        />
      </View>

      <ActionSheet
        visible={actionsOpen}
        title="Plan actions"
        items={actions}
        onClose={() => setActionsOpen(false)}
      />

      <BookAllSheet
        visible={bookSheetOpen}
        passId={passId}
        items={sorted.map((s) => ({
          id: s.id,
          kind: s.kind as never,
          title: s.title,
          subtitle: s.subtitle,
          sortAt: s.sortAt,
          cost: s.cost,
        }))}
        totalCost={totalCost}
        onClose={() => setBookSheetOpen(false)}
        onComplete={onMintPass}
      />
    </SafeAreaView>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  const { t } = useTheme();
  return (
    <View style={[styles.stat, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
      <Text style={[TYPE.displayM, { color: t.ink, fontSize: 18 }]}>{n}</Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function timePill(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function agoLabel(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 22,
  },
  skel: {
    height: 86,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 4,
  },
  errBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  reshuffleNudge: {
    marginTop: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
  },
  dayHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dayDivider: { flex: 1, height: 1 },
  timelineRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  rail: { alignItems: "center", width: 16, paddingTop: 18 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 1, flex: 1, marginTop: 2 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 2,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardFoot: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costCard: { borderWidth: 1, borderRadius: 14 },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
});
