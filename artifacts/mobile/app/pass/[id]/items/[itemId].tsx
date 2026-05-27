import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { Barcode } from "@/components/primitives/Barcode";
import { LiveDot } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { cancelItem, fetchPlan } from "@/lib/planner-api";

interface Item {
  id: string;
  kind: string;
  state: string;
  title: string;
  subtitle: string;
  code: string | null;
  cost: string | null;
  sortAt: string;
  data: Record<string, unknown>;
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

export default function ItemDetail() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; itemId: string }>();
  const passId = params.id!;
  const itemId = params.itemId!;
  const [item, setItem] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchPlan(passId)
      .then((doc) => {
        const found = doc.items.find((i) => i.id === itemId);
        if (found) setItem(found as Item);
        else setError("Item not found.");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load."))
      .finally(() => setLoaded(true));
  }, [passId, itemId]);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  function doCancel() {
    setMenuOpen(false);
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    cancelItem(passId, itemId)
      .then(() => {
        flashToast("Item cancelled · reshuffling…");
        setTimeout(() => router.back(), 700);
      })
      .catch(() => flashToast("Couldn't cancel — try again"))
      .finally(() => setBusy(false));
  }

  const menuItems: ActionSheetItem[] = [
    { label: "Swap for alternate", onPress: () => router.push({ pathname: "/planner/[passId]/items/[itemId]/alternates", params: { passId, itemId } }) },
    { label: "Add to calendar", onPress: () => flashToast("Added to your calendar") },
    { label: "Share item", onPress: () => flashToast("Item link copied") },
    {
      label: item?.state === "cancelled" ? "Already cancelled" : "Cancel this item",
      destructive: true,
      disabled: item?.state === "cancelled",
      onPress: doCancel,
    },
  ];

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← PASS</Text>
          </Pressable>
        </View>
        <ScreenHeader overline="LOADING" title=" " />
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

  if (error || !item) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← PASS</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
            Couldn't load this item.
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
            {error ?? "Item not found in this pass."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPast = Date.parse(item.sortAt) < Date.now();
  const isCancelled = item.state === "cancelled";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← PASS</Text>
        </Pressable>
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setMenuOpen(true); }}
          hitSlop={12}
        >
          <Text style={[TYPE.body, { color: t.ink, fontWeight: "700", fontSize: 22 }]}>···</Text>
        </Pressable>
      </View>

      <ScreenHeader
        overline={`${item.kind.toUpperCase()} · ${item.code ?? `№${item.id.slice(0, 4).toUpperCase()}`}`}
        title={item.title}
      />

      <ScrollView contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 60 }}>
        {/* Kind-specific hero */}
        {item.kind === "flight" ? (
          <FlightHero item={item} />
        ) : item.kind === "stay" ? (
          <StayHero item={item} />
        ) : item.kind === "transit" ? (
          <TransitHero item={item} />
        ) : (
          <DefaultHero item={item} />
        )}

        {/* Status banner if cancelled */}
        {isCancelled ? (
          <View style={[styles.cancelBanner, { borderColor: t.stampRed }]}>
            <Stamp label="CANCELLED" kind="rect" />
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 8 }]}>
              The AI shifted downstream items to keep your timeline whole.
            </Text>
          </View>
        ) : null}

        {/* Quick actions — kind-specific */}
        {!isPast && !isCancelled ? <QuickActions kind={item.kind} onToast={flashToast} /> : null}

        {/* Booking details */}
        <View style={[styles.dataCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 10 }]}>BOOKING DETAILS</Text>
          {Object.entries(item.data)
            .filter(([k]) => !["depTime", "arrTime", "checkIn", "checkOut", "starts", "ends"].includes(k))
            .map(([k, v]) => (
              <View key={k} style={[styles.kvRow, { borderBottomColor: t.inkHair }]}>
                <Text style={[TYPE.monoXS, { color: t.inkMute, width: 110, fontWeight: "600" }]}>
                  {k.toUpperCase()}
                </Text>
                <Text style={[TYPE.bodyS, { color: t.ink, flex: 1 }]} numberOfLines={2}>
                  {typeof v === "string"
                    ? v
                    : typeof v === "boolean"
                    ? v ? "Yes" : "No"
                    : JSON.stringify(v)}
                </Text>
              </View>
            ))}
        </View>

        {/* Policy block */}
        <View style={[styles.policyCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>POLICY</Text>
          <Text style={[TYPE.bodyS, { color: t.ink }]}>
            {item.kind === "flight"
              ? "Free cancel up to 24h before departure. Changes from $80."
              : item.kind === "stay"
              ? "Free cancellation until 18:00 day-of arrival."
              : "Reschedule once free of charge."}
          </Text>
        </View>

        {/* Receipt link */}
        <Pressable
          onPress={() => flashToast("Receipt opened")}
          style={[styles.receiptRow, { borderColor: t.inkHair }]}
        >
          <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>Receipt</Text>
          <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>OPEN PDF →</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={menuOpen}
        title={item.title}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      {toast ? (
        <View style={[styles.toast, { backgroundColor: t.ink }]} pointerEvents="none">
          <Text style={[TYPE.bodyS, { color: "#fff", fontWeight: "500" }]}>{toast}</Text>
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <Text style={[TYPE.bodyS, { color: t.ink }]}>Working…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Kind-specific heroes

function FlightHero({ item }: { item: Item }) {
  const { t } = useTheme();
  const d = item.data as Record<string, string>;
  return (
    <View style={[styles.boardingPass, { backgroundColor: t.ink }]}>
      <View pointerEvents="none" style={styles.boardingInner} />

      <View style={styles.boardingHead}>
        <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
          BOARDING PASS
        </Text>
        <View style={styles.liveBadge}>
          <Text style={{ fontSize: 16 }}>✈</Text>
          <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "700" }]}>
            {String(d.carrier ?? "").toUpperCase()} {d.flightNo}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={{ alignItems: "flex-start" }}>
          <Text style={[TYPE.displayXL, { color: "#fff", fontSize: 38 }]}>
            {d.depAirport}
          </Text>
          <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)", marginTop: 2 }]}>
            {timePill(d.depTime)}
          </Text>
        </View>
        <View style={styles.routeMiddle}>
          <Svg width={80} height={20} viewBox="0 0 80 20">
            <Path d="M 4 10 L 76 10" stroke="rgba(244,237,228,0.4)" strokeWidth={1} strokeDasharray="3 3" />
            <Circle cx={4} cy={10} r={3} fill="rgba(244,237,228,0.6)" />
            <Circle cx={76} cy={10} r={3} fill="rgba(244,237,228,0.6)" />
          </Svg>
          <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)", marginTop: 4 }]}>
            DIRECT
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[TYPE.displayXL, { color: "#fff", fontSize: 38 }]}>
            {d.arrAirport}
          </Text>
          <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)", marginTop: 2 }]}>
            {timePill(d.arrTime)}
          </Text>
        </View>
      </View>

      <View style={styles.boardingPerf} />

      <View style={styles.boardingFooter}>
        <BoardingDetail label="SEAT" value={String(d.seat ?? "—")} />
        <BoardingDetail label="CLASS" value={String(d.fare ?? "—").toUpperCase()} />
        <BoardingDetail label="DATE" value={datePill(d.depTime)} />
      </View>

      <View style={{ marginTop: 14 }}>
        <Barcode seed={`${d.carrier}${d.flightNo}`} height={28} dark />
      </View>
    </View>
  );
}

function StayHero({ item }: { item: Item }) {
  const { t } = useTheme();
  const d = item.data as Record<string, string | number>;
  return (
    <View style={[styles.keyCard, { borderColor: t.inkHair, backgroundColor: t.paperLight }]}>
      <View style={styles.keyHead}>
        <Text style={{ fontSize: 36 }}>🏨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>KEY CARD</Text>
          <Text style={[TYPE.displayL, { color: t.ink, marginTop: 2 }]}>{d.name}</Text>
        </View>
        {d.room ? <Stamp label={`ROOM ${d.room}`} kind="rect" /> : null}
      </View>
      <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 10 }]}>
        {d.address}
      </Text>
      <View style={[styles.keyDetails, { borderTopColor: t.inkHair }]}>
        <BoardingDetail label="CHECK-IN" value={timePill(String(d.checkIn))} tone="ink" />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair }} />
        <BoardingDetail label="CHECK-OUT" value={timePill(String(d.checkOut))} tone="ink" />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair }} />
        <BoardingDetail label="GUESTS" value={String(d.guests ?? 1)} tone="ink" />
      </View>
    </View>
  );
}

function TransitHero({ item }: { item: Item }) {
  const { t } = useTheme();
  const d = item.data as Record<string, string>;
  return (
    <View style={[styles.ticketCard, { borderColor: t.inkHair, backgroundColor: t.paperLight }]}>
      <View style={styles.keyHead}>
        <Text style={{ fontSize: 36 }}>🚆</Text>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>TICKET</Text>
          <Text style={[TYPE.displayL, { color: t.ink, marginTop: 2 }]}>{d.service}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 12 }}>
        <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{d.depStation}</Text>
        <Text style={[TYPE.monoXS, { color: t.inkMute }]}>—</Text>
        <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{d.arrStation}</Text>
      </View>
      <View style={[styles.keyDetails, { borderTopColor: t.inkHair }]}>
        <BoardingDetail label="DEP" value={timePill(d.depTime)} tone="ink" />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair }} />
        <BoardingDetail label="ARR" value={timePill(d.arrTime)} tone="ink" />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair }} />
        <BoardingDetail label="SEAT" value={String(d.seat ?? "—")} tone="ink" />
      </View>
    </View>
  );
}

function DefaultHero({ item }: { item: Item }) {
  const { t } = useTheme();
  return (
    <View style={[styles.hero, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
      <View style={styles.heroHead}>
        <Text style={{ fontSize: 28 }}>{KIND_GLYPH[item.kind] ?? "✦"}</Text>
        <TimeChip
          label={item.state.toUpperCase()}
          tone={item.state === "confirmed" ? "terra" : "mute"}
        />
      </View>
      <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 4 }]}>
        {datePill(item.sortAt)} · {timePill(item.sortAt)}
      </Text>
      <Text style={[TYPE.body, { color: t.ink, marginTop: 12 }]}>{item.subtitle}</Text>
      {item.cost ? (
        <Text style={[TYPE.monoS, { color: t.ink, marginTop: 10, fontWeight: "600" }]}>
          ${Math.round(Number(item.cost)).toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}

function BoardingDetail({
  label,
  value,
  tone = "dark",
}: {
  label: string;
  value: string;
  tone?: "dark" | "ink";
}) {
  const { t } = useTheme();
  const textColor = tone === "dark" ? "#fff" : t.ink;
  const labelColor = tone === "dark" ? "rgba(244,237,228,0.55)" : t.inkMute;
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[TYPE.monoXS, { color: labelColor, fontWeight: "600" }]}>{label}</Text>
      <Text style={[TYPE.body, { color: textColor, fontWeight: "600", marginTop: 4 }]}>
        {value}
      </Text>
    </View>
  );
}

function QuickActions({ kind, onToast }: { kind: string; onToast: (msg: string) => void }) {
  const { t } = useTheme();
  const actions = ACTIONS_BY_KIND[kind] ?? ACTIONS_BY_KIND.default;
  return (
    <View style={styles.quickActions}>
      {actions.map((a) => (
        <Pressable
          key={a}
          onPress={() => onToast(`${a} — coming in v1.5`)}
          style={[styles.qaBtn, { borderColor: t.inkHair, backgroundColor: t.surface }]}
        >
          <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "600" }]}>{a.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const ACTIONS_BY_KIND: Record<string, string[]> = {
  flight: ["Check in", "Seat map", "Add bag"],
  stay: ["Directions", "Wifi info", "Concierge"],
  activity: ["Tickets", "Directions"],
  dining: ["Reserve", "Menu"],
  transit: ["Track", "Directions"],
  default: ["Add to cal", "Share"],
};

function timePill(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
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
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22 },
  skeleton: { height: 100, borderWidth: 1, borderRadius: 14, opacity: 0.4 },
  hero: { borderWidth: 1, borderRadius: 14, padding: 16 },
  heroHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  // Boarding pass (flight)
  boardingPass: {
    borderRadius: 14,
    padding: 22,
    position: "relative",
    overflow: "hidden",
  },
  boardingInner: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  boardingHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  routeMiddle: { alignItems: "center" },
  boardingPerf: {
    height: 1,
    backgroundColor: "rgba(244,237,228,0.18)",
    marginVertical: 16,
    borderStyle: "dashed",
    borderTopWidth: 1,
    borderTopColor: "rgba(244,237,228,0.18)",
  },
  boardingFooter: { flexDirection: "row", justifyContent: "space-between" },
  // Stay key card
  keyCard: { borderWidth: 1, borderRadius: 14, padding: 18 },
  keyHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  keyDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ticketCard: { borderWidth: 1, borderRadius: 14, padding: 18 },
  cancelBanner: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    alignItems: "flex-start",
  },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qaBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dataCard: { borderWidth: 1, borderRadius: 14, padding: 16 },
  kvRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  policyCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  busyOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(244,237,228,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
