import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PaperTexture } from "@/components/primitives/PaperTexture";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchInbox, markRead, type Notification } from "@/lib/inbox-api";

const KIND_GLYPH: Record<string, string> = {
  time_nudge: "🕒",
  reshuffle: "🔄",
  buddy_request: "✋",
  buddy_joined: "🤝",
  visa_approved: "✓",
  flight_delay: "✈",
  provider_offer: "🏷",
  trip_ending: "📍",
  book_minted: "📖",
};

const KIND_LABEL: Record<string, string> = {
  time_nudge: "TIME",
  reshuffle: "RESHUFFLE",
  buddy_request: "BUDDY",
  buddy_joined: "BUDDY JOINED",
  visa_approved: "VISA",
  flight_delay: "FLIGHT",
  provider_offer: "OFFER",
  trip_ending: "TRIP ENDING",
  book_minted: "MEMORY BOOK",
};

export default function InboxScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handled, setHandled] = useState<Record<string, "accepted" | "declined">>({});

  const reload = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchInbox(filter);
      setItems(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load inbox.");
    } finally {
      setLoaded(true);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function onRowPress(n: Notification) {
    if (!n.readAt) {
      await markRead(n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
      );
    }
    if (n.deepLink) {
      router.push(n.deepLink as never);
    }
  }

  function handleBuddy(id: string, action: "accepted" | "declined") {
    Haptics.notificationAsync(
      action === "accepted"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    setHandled((h) => ({ ...h, [id]: action }));
  }

  function markAllRead() {
    Haptics.selectionAsync().catch(() => {});
    setItems((prev) =>
      prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })),
    );
  }

  const unreadCount = useMemo(() => items.filter((i) => !i.readAt).length, [items]);

  // Group by day
  const groups = useMemo(() => groupByDay(items), [items]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← BACK</Text>
        </Pressable>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              MARK ALL READ
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScreenHeader
        overline={`ACCOUNT · INBOX${unreadCount > 0 ? ` · ${unreadCount} UNREAD` : ""}`}
        title="What's new."
      />

      <View style={styles.filterRow}>
        {(["all", "unread"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setFilter(f); }}
            style={[
              styles.filter,
              {
                backgroundColor: filter === f ? t.ink : "transparent",
                borderColor: filter === f ? t.ink : t.inkHair,
              },
            ]}
          >
            <Text
              style={[
                TYPE.monoXS,
                {
                  color: filter === f ? "#fff" : t.inkMute,
                  textTransform: "uppercase",
                  fontWeight: "600",
                },
              ]}
            >
              {f}
            </Text>
            <Text
              style={[
                TYPE.monoXS,
                {
                  color: filter === f ? "rgba(255,255,255,0.6)" : t.inkMute,
                  fontWeight: "600",
                },
              ]}
            >
              {f === "all" ? items.length : unreadCount}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              Haptics.selectionAsync().catch(() => {});
              await reload();
              setRefreshing(false);
            }}
            tintColor={t.terra}
            title="REFRESHING…"
            titleColor={t.inkMute}
            colors={[t.terra]}
          />
        }
      >
        {!loaded ? (
          // Loading skeleton — matches row layout, not a centered spinner
          <View style={{ gap: 10, marginTop: 14 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonRow,
                  { borderColor: t.inkHair, backgroundColor: t.surface },
                ]}
              >
                <View style={[styles.skeletonCircle, { backgroundColor: t.inkHair }]} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={[styles.skeletonLine, { backgroundColor: t.inkHair, width: "30%" }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: t.inkHair, width: "80%" }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: t.inkHair, width: "55%" }]} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <View style={[styles.empty, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
              Couldn't load your inbox.
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center", marginBottom: 14 }]}>
              {error} Tap retry to try again.
            </Text>
            <Pressable
              onPress={() => { setLoaded(false); reload(); }}
              style={[styles.retryBtn, { backgroundColor: t.ink }]}
            >
              <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "700" }]}>RETRY</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.empty, { borderColor: t.inkHair }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>✦</Text>
            <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
              You're all caught up.
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
              Time-nudges, reshuffle alerts, and buddy requests will appear here.
            </Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.key} style={{ marginTop: 14 }}>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8, fontWeight: "600" }]}>
                {g.label}
              </Text>
              <View
                style={[
                  styles.groupBox,
                  { borderColor: t.inkHair, backgroundColor: t.surface },
                ]}
              >
                {g.items.map((n, i) => {
                  const isBuddyReq = n.kind === "buddy_request";
                  const handledState = handled[n.id];
                  return (
                    <View key={n.id}>
                      <Pressable
                        onPress={() => onRowPress(n)}
                        style={({ pressed }) => [
                          styles.row,
                          {
                            borderBottomColor: t.inkHair,
                            borderBottomWidth: i === g.items.length - 1 ? 0 : StyleSheet.hairlineWidth,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        {/* Kind icon circle */}
                        <View
                          style={[
                            styles.kindIcon,
                            {
                              backgroundColor: n.readAt ? t.paper : t.terra,
                              borderColor: n.readAt ? t.inkHair : t.terra,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 16 }}>{KIND_GLYPH[n.kind] ?? "•"}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.rowHead}>
                            <Text
                              style={[
                                TYPE.monoXS,
                                {
                                  color: n.readAt ? t.inkMute : t.terra,
                                  fontWeight: "600",
                                },
                              ]}
                            >
                              {KIND_LABEL[n.kind] ?? n.kind.toUpperCase()}
                            </Text>
                            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
                              {timeAgo(n.sentAt)}
                            </Text>
                          </View>
                          <Text
                            style={[
                              TYPE.body,
                              {
                                color: t.ink,
                                marginTop: 2,
                                fontWeight: n.readAt ? "400" : "500",
                              },
                            ]}
                          >
                            {n.title}
                          </Text>
                          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
                            {n.body}
                          </Text>

                          {/* Inline approve/decline for buddy_request */}
                          {isBuddyReq && !handledState ? (
                            <View style={styles.buddyActions}>
                              <Pressable
                                onPress={() => handleBuddy(n.id, "accepted")}
                                style={[styles.actionBtn, { backgroundColor: t.terra }]}
                              >
                                <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "700" }]}>
                                  APPROVE
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleBuddy(n.id, "declined")}
                                style={[styles.actionBtn, { borderColor: t.inkHair, borderWidth: 1 }]}
                              >
                                <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "700" }]}>
                                  DECLINE
                                </Text>
                              </Pressable>
                            </View>
                          ) : null}

                          {handledState ? (
                            <View
                              style={[
                                styles.handledPill,
                                {
                                  borderColor:
                                    handledState === "accepted" ? t.terra : t.inkHair,
                                  backgroundColor:
                                    handledState === "accepted" ? t.terra : "transparent",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  TYPE.monoXS,
                                  {
                                    color: handledState === "accepted" ? "#fff" : t.inkMute,
                                    fontWeight: "700",
                                  },
                                ]}
                              >
                                {handledState === "accepted" ? "✓ APPROVED" : "DECLINED"}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m}M AGO`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}H AGO`;
  return `${Math.round(h / 24)}D AGO`;
}

function groupByDay(items: Notification[]): Array<{ key: string; label: string; items: Notification[] }> {
  if (items.length === 0) return [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  function bucket(iso: string): string {
    const d = new Date(iso);
    if (sameDay(d, today)) return "TODAY";
    if (sameDay(d, yesterday)) return "YESTERDAY";
    return "EARLIER";
  }
  const groups: Record<string, Notification[]> = {};
  for (const n of items) {
    const k = bucket(n.sentAt);
    if (!groups[k]) groups[k] = [];
    groups[k]!.push(n);
  }
  return Object.entries(groups).map(([label, items]) => ({ key: label, label, items }));
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 22,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    marginTop: 22,
  },
  groupBox: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kindIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buddyActions: { flexDirection: "row", gap: 6, marginTop: 10 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  handledPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    opacity: 0.45,
  },
  skeletonCircle: { width: 32, height: 32, borderRadius: 16 },
  skeletonLine: { height: 10, borderRadius: 5 },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
