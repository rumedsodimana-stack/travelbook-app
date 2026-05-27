import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PillBtn } from "@/components/primitives/PillBtn";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import {
  defaultBookingRouter,
  type BookableItem,
} from "@/lib/booking";

interface PassItemLike {
  id: string;
  kind: BookableItem["kind"];
  title: string;
  subtitle: string;
  sortAt: string;
  cost: string | null;
  data?: Record<string, unknown>;
}

interface BookAllSheetProps {
  visible: boolean;
  passId: string;
  items: PassItemLike[];
  totalCost: number;
  market?: { currency?: string; locale?: string };
  onClose: () => void;
  onComplete: () => void;
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

export function BookAllSheet({
  visible,
  passId,
  items,
  totalCost,
  market,
  onClose,
  onComplete,
}: BookAllSheetProps) {
  const { t } = useTheme();
  const [idx, setIdx] = useState(0);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const router = useMemo(
    () => defaultBookingRouter({ passId, market }),
    [passId, market],
  );

  // Filter bookable items (skip visa/insurance for the walkthrough)
  const bookable = useMemo(
    () => items.filter((it) => it.kind !== "visa" && it.kind !== "insurance"),
    [items],
  );

  const total = bookable.length;
  const current = bookable[idx];
  const handoff = useMemo(() => {
    if (!current) return null;
    try {
      return router.handoff({
        id: current.id,
        kind: current.kind,
        data: current.data ?? {},
      });
    } catch {
      return null;
    }
  }, [current, router]);

  const allDone = opened.size + skipped.size >= total;

  function openProvider() {
    if (!handoff?.url) return;
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(handoff.url).catch(() => {});
    setOpened((prev) => new Set(prev).add(current!.id));
  }

  function skip() {
    Haptics.selectionAsync().catch(() => {});
    setSkipped((prev) => new Set(prev).add(current!.id));
    next();
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1);
    }
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete();
  }

  function close() {
    setIdx(0);
    setOpened(new Set());
    setSkipped(new Set());
    onClose();
  }

  const meta = current ? KIND_META[current.kind] ?? { icon: "·", label: current.kind } : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]} edges={["top"]}>
        {/* Header */}
        <View style={[styles.head, { borderBottomColor: t.inkHair }]}>
          <Pressable onPress={close} hitSlop={16}>
            <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>CLOSE</Text>
          </Pressable>
          <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "700" }]}>
            BOOK ALL · {Math.min(idx + 1, total)} OF {total}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {bookable.map((it, i) => {
            const isOpened = opened.has(it.id);
            const isSkipped = skipped.has(it.id);
            const isCurrent = i === idx;
            return (
              <View
                key={it.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isOpened
                      ? t.terra
                      : isSkipped
                      ? t.inkHair
                      : isCurrent
                      ? t.ink
                      : t.inkHair,
                    width: isCurrent ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {allDone ? (
          <ScrollView contentContainerStyle={{ padding: 22 }}>
            <View style={[styles.doneCard, { borderColor: t.terra, backgroundColor: t.surface }]}>
              <Stamp label="ALMOST" kind="circle" rotate={-4} />
              <Text style={[TYPE.displayM, { color: t.ink, marginTop: 14 }]}>
                {opened.size} opened · {skipped.size} skipped.
              </Text>
              <Text style={[TYPE.body, { color: t.inkMute, marginTop: 8 }]}>
                Confirm each provider's booking page on your phone. We'll auto-detect confirmations
                forwarded to <Text style={{ color: t.ink, fontWeight: "600" }}>bookings@travelbook.app</Text> and stamp the Pass as items confirm.
              </Text>

              <View
                style={[
                  styles.tipBox,
                  { borderColor: t.inkHair, backgroundColor: t.appBg },
                ]}
              >
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                  ✉ FORWARDING TIP
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
                  Set a Gmail filter for *@booking.com → auto-forward to bookings@travelbook.app.
                  Your Pass updates the moment confirmations land.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 18, gap: 10 }}>
              <PillBtn label="✦ Mint Pass" tone="terra" fullWidth onPress={finish} />
              <PillBtn label="Back to draft" tone="cream" fullWidth onPress={close} />
            </View>

            <Text
              style={[
                TYPE.monoXS,
                { color: t.inkMute, textAlign: "center", marginTop: 18 },
              ]}
            >
              ${Math.round(totalCost)} TOTAL ACROSS {total} ITEMS · NO TRAVELBOOK CHARGES YET
            </Text>
          </ScrollView>
        ) : current && meta ? (
          <ScrollView contentContainerStyle={{ padding: 22 }}>
            <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
              <View style={styles.cardHead}>
                <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
                <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
                  {meta.label.toUpperCase()}
                </Text>
              </View>
              <Text style={[TYPE.displayM, { color: t.ink, marginTop: 10 }]}>
                {current.title}
              </Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 4 }]}>
                {current.subtitle}
              </Text>
              {current.cost ? (
                <Text style={[TYPE.monoS, { color: t.ink, marginTop: 12, fontWeight: "700" }]}>
                  ${Math.round(Number(current.cost))}
                </Text>
              ) : null}
            </View>

            {handoff?.url ? (
              <View
                style={[
                  styles.handoffCard,
                  { borderColor: t.terra, backgroundColor: t.surface },
                ]}
              >
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                  PRE-FILLED ON {handoff.providerName.toUpperCase()}
                </Text>
                <View style={{ marginTop: 10, gap: 6 }}>
                  {handoff.prefilled.map((p) => (
                    <View key={p} style={styles.prefRow}>
                      <Text
                        style={[
                          TYPE.monoXS,
                          { color: t.terra, fontWeight: "700", width: 18 },
                        ]}
                      >
                        ✓
                      </Text>
                      <Text style={[TYPE.bodyS, { color: t.ink }]}>{p}</Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={[TYPE.bodyS, { color: t.inkMute, marginTop: 12 }]}
                >
                  Opens {handoff.providerName} with these fields filled. You review and confirm
                  there. We don't store your payment.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.handoffCard,
                  { borderColor: t.inkHair, backgroundColor: t.surface },
                ]}
              >
                <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
                  NO PROVIDER YET
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 8 }]}>
                  This item kind doesn't have a booking provider in v1. Skip for now and we'll
                  remind you closer to the date.
                </Text>
              </View>
            )}

            <View style={{ marginTop: 22, gap: 10 }}>
              {handoff?.url ? (
                <PillBtn
                  label={
                    opened.has(current.id)
                      ? `✓ Opened ${handoff.providerName} · Next`
                      : `Open ${handoff.providerName}`
                  }
                  tone="terra"
                  fullWidth
                  onPress={opened.has(current.id) ? next : openProvider}
                />
              ) : null}

              {opened.has(current.id) && handoff?.url ? (
                <Pressable
                  onPress={openProvider}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.reopenRow,
                    { borderColor: t.inkHair, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                    ↻ REOPEN {handoff.providerName.toUpperCase()}
                  </Text>
                </Pressable>
              ) : null}

              <PillBtn label="Skip · book later" tone="cream" fullWidth onPress={skip} />

              {idx > 0 ? (
                <Pressable
                  onPress={back}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.backRow,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
                    ← PREVIOUS ITEM
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  handoffCard: {
    marginTop: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
  },
  prefRow: { flexDirection: "row", alignItems: "center" },
  doneCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 18,
    alignItems: "flex-start",
  },
  tipBox: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignSelf: "stretch",
  },
  reopenRow: {
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  backRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
});
