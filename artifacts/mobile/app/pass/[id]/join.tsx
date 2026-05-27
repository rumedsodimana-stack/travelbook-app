import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarDot } from "@/components/primitives/AvatarDot";
import { Barcode } from "@/components/primitives/Barcode";
import { LiveDot, VerifiedTick } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { createBuddyRequest, fetchBuddyPreview, type BuddyPreview } from "@/lib/social-api";

export default function JoinBuddyScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const passId = params.id!;
  const [data, setData] = useState<BuddyPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchBuddyPreview(passId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load pass."));
  }, [passId]);

  async function onRequest() {
    setBusy(true);
    setError(null);
    try {
      await createBuddyRequest(passId, intro);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send — try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← BACK</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
            Couldn't load this pass.
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, textAlign: "center" }]}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← BACK</Text>
          </Pressable>
        </View>
        <ScreenHeader overline="LOADING" title=" " />
        {/* Skeleton */}
        <View style={{ padding: 22, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { borderColor: t.inkHair, backgroundColor: t.surface }]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const itemizedCost = data.items.reduce((acc, it) => acc + Number(it.cost ?? 0), 0);
  const costByKind = data.items.reduce<Record<string, number>>((acc, it) => {
    acc[it.kind] = (acc[it.kind] ?? 0) + Number(it.cost ?? 0);
    return acc;
  }, {});

  const fit = data.fitCheck ?? {
    score: 0.75,
    breakdown: { pace: "match", budget: "match", mornings: "soft", diet: "match" } as const,
  };
  const fitPct = Math.round(fit.score * 100);

  // Owner from members (first one with role=owner)
  const owner = data.members.find((m) => m.role === "owner") ?? data.members[0];
  const ownerHandle = "lila.h"; // mock — real handle in v1.5

  const totalDays = Math.max(
    1,
    Math.round(
      (Date.parse(data.pass.endsOn) - Date.parse(data.pass.startsOn)) /
        (24 * 60 * 60 * 1000),
    ),
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← BACK</Text>
        </Pressable>
        <Stamp label={`${data.pass.openSeats} SEATS LEFT`} kind="rect" />
      </View>

      <ScreenHeader overline="PASS · SHARED" title={data.pass.title} />

      <ScrollView contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 100 }}>
        {/* Pass preview card */}
        <View style={[styles.passCard, { backgroundColor: t.ink }]}>
          <View pointerEvents="none" style={styles.passInner} />
          <View style={styles.passHead}>
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
              PASS · {data.pass.id.slice(0, 8).toUpperCase()}
            </Text>
            <View style={styles.liveBadge}>
              <LiveDot color={t.terra} size={6} />
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                LIVE
              </Text>
            </View>
          </View>
          <Text style={[TYPE.displayM, { color: "#fff", marginVertical: 6 }]}>
            {data.pass.title}
          </Text>
          <View style={styles.passMeta}>
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)" }]}>
              {datePill(data.pass.startsOn)} → {datePill(data.pass.endsOn)}
            </Text>
            <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
              {totalDays} DAYS
            </Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <Barcode seed={data.pass.id} height={18} dark />
          </View>
        </View>

        {/* Owner profile */}
        <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 10 }]}>HOSTED BY</Text>
          <View style={styles.ownerRow}>
            <AvatarDot size={52} ring tone="terra" />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
                  @{ownerHandle}
                </Text>
                <VerifiedTick color={t.terra} size={12} />
              </View>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>
                12 TRIPS · 4 BUDDIES · MEMBER SINCE 2025
              </Text>
            </View>
          </View>
          <View style={[styles.trustRow, { borderTopColor: t.inkHair }]}>
            <Trust label="2 mutual" sub="buddies" />
            <TrustDivider />
            <Trust label="4.9 ★" sub="trip rating" />
            <TrustDivider />
            <Trust label="98%" sub="show-up rate" />
          </View>
        </View>

        {/* Fit-check with score visualization */}
        <View style={[styles.card, { borderColor: t.terra, borderWidth: 1.5, backgroundColor: t.surface }]}>
          <View style={styles.fitHead}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              FIT CHECK
            </Text>
            <View style={styles.fitScore}>
              <Text style={[TYPE.displayL, { color: t.terra }]}>{fitPct}%</Text>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginLeft: 6 }]}>MATCH</Text>
            </View>
          </View>
          <View style={[styles.fitBar, { backgroundColor: t.inkHair }]}>
            <View
              style={[
                styles.fitBarFill,
                { backgroundColor: t.terra, width: `${fitPct}%` },
              ]}
            />
          </View>
          <View style={{ marginTop: 14, gap: 4 }}>
            <FitRow label="Pace" you="Slow" them="Slow" status={fit.breakdown.pace ?? "soft"} />
            <FitRow label="Budget" you="Mid" them="Mid" status={fit.breakdown.budget ?? "soft"} />
            <FitRow
              label="Mornings"
              you="Coffee"
              them="Early"
              status={fit.breakdown.mornings ?? "soft"}
            />
            <FitRow
              label="Diet"
              you="Pescatarian"
              them="Pescatarian"
              status={fit.breakdown.diet ?? "soft"}
            />
          </View>
        </View>

        {/* Members */}
        <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <View style={styles.cardHead}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>WHO'S IN</Text>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
              {data.members.length} OF {data.members.length + data.pass.openSeats}
            </Text>
          </View>
          <View style={[styles.avatarStack, { marginTop: 10 }]}>
            {data.members.slice(0, 4).map((m, i) => (
              <View key={m.userId} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                <AvatarDot
                  size={42}
                  ring
                  ringColor={m.role === "owner" ? t.terra : t.inkHair}
                  tone={i === 0 ? "terra" : i === 1 ? "paper" : "dark"}
                />
              </View>
            ))}
            {Array.from({ length: data.pass.openSeats }).map((_, i) => (
              <View key={`open-${i}`} style={{ marginLeft: -12 }}>
                <View style={[styles.openSeat, { borderColor: t.terra }]}>
                  <Text style={{ fontSize: 18, color: t.terra }}>+</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cost split */}
        <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 12 }]}>
            YOUR COST · IF YOU JOIN
          </Text>

          {/* Bar chart of cost breakdown */}
          <View style={styles.costBar}>
            {Object.entries(costByKind).map(([kind, cost], i) => {
              const w = (cost / itemizedCost) * 100;
              const colors = ["#e8744a", "#0a2540", "#a8412c", "#1a3a5c", "#c45a36"];
              return (
                <View
                  key={kind}
                  style={[
                    styles.costSegment,
                    {
                      width: `${w}%`,
                      backgroundColor: colors[i % colors.length],
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legendRow}>
            {Object.entries(costByKind).map(([kind, cost], i) => {
              const colors = ["#e8744a", "#0a2540", "#a8412c", "#1a3a5c", "#c45a36"];
              return (
                <View key={kind} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors[i % colors.length] }]} />
                  <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
                    {labelFor(kind).toUpperCase()} · ${Math.round(cost)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.totalRow, { borderTopColor: t.inkHair }]}>
            <View>
              <Text style={[TYPE.monoXS, { color: t.inkMute }]}>YOUR ESTIMATED TOTAL</Text>
              <Text style={[TYPE.displayL, { color: t.ink }]}>
                ${Math.round(itemizedCost).toLocaleString()}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[TYPE.monoXS, { color: t.inkMute }]}>SPLIT TYPE</Text>
              <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>
                Per-person
              </Text>
            </View>
          </View>
        </View>

        {/* Optional intro */}
        <View>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>
            ADD A NOTE · OPTIONAL
          </Text>
          <View style={[styles.box, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <TextInput
              value={intro}
              onChangeText={setIntro}
              maxLength={200}
              multiline
              placeholder="Why would you be a great buddy on this trip?"
              placeholderTextColor={t.inkMute}
              style={[TYPE.body, { color: t.ink, minHeight: 56, textAlignVertical: "top" }]}
            />
          </View>
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
            @{ownerHandle} sees this when reviewing your request.
          </Text>
        </View>

        {/* Error state */}
        {error && data ? (
          <View style={[styles.errorPill, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.bodyS, { color: t.stampRed }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {sent ? (
          <View style={[styles.sentBanner, { borderColor: t.terra, backgroundColor: t.terra }]}>
            <Text style={[TYPE.body, { color: "#fff", fontWeight: "600", textAlign: "center" }]}>
              ✓ Request sent — you'll hear back in their inbox
            </Text>
          </View>
        ) : (
          <>
            {/* Required safety acknowledgment */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAgreed((v) => !v);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.consentRow,
                {
                  borderColor: agreed ? t.terra : t.inkHair,
                  backgroundColor: t.surface,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreed ? t.terra : "transparent",
                    borderColor: agreed ? t.terra : t.inkHair,
                  },
                ]}
              >
                {agreed ? (
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
                ) : null}
              </View>
              <Text style={[TYPE.bodyS, { color: t.ink, flex: 1, lineHeight: 18 }]}>
                I understand I'm meeting a stranger from the internet. TravelBook does not vet
                members and is not responsible for what happens during the trip.
              </Text>
            </Pressable>

            <View style={{ height: 10 }} />

            <PillBtn
              label={busy ? "Sending…" : agreed ? "Request to join" : "Acknowledge to continue"}
              tone="terra"
              fullWidth
              disabled={busy || !agreed || data.pass.openSeats === 0}
              onPress={onRequest}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function FitRow({
  label,
  you,
  them,
  status,
}: {
  label: string;
  you: string;
  them: string;
  status: "match" | "soft" | "mismatch";
}) {
  const { t } = useTheme();
  const colorMap = {
    match: t.terra,
    soft: t.inkMute,
    mismatch: t.stampRed,
  } as const;
  const icon = { match: "✓", soft: "○", mismatch: "×" } as const;
  return (
    <View style={[styles.fitRow, { borderBottomColor: t.inkHair }]}>
      <Text style={[TYPE.body, { color: t.ink, flex: 1 }]}>{label}</Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, flex: 1, textAlign: "center" }]}>
        YOU {you.toUpperCase()}
      </Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, flex: 1, textAlign: "center" }]}>
        THEM {them.toUpperCase()}
      </Text>
      <Text style={[TYPE.monoXS, { color: colorMap[status], fontWeight: "700" }]}>
        {icon[status]}
      </Text>
    </View>
  );
}

function Trust({ label, sub }: { label: string; sub: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>{label}</Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>
        {sub.toUpperCase()}
      </Text>
    </View>
  );
}

function TrustDivider() {
  const { t } = useTheme();
  return <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair }} />;
}

function labelFor(kind: string): string {
  const m: Record<string, string> = {
    flight: "Flight",
    stay: "Stay",
    activity: "Activities",
    transit: "Transit",
    dining: "Dining",
    visa: "Visa",
    insurance: "Insurance",
  };
  return m[kind] ?? kind;
}

function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}

const styles = StyleSheet.create({
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  root: { flex: 1, paddingHorizontal: 22 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22 },
  skeleton: {
    height: 80,
    borderWidth: 1,
    borderRadius: 14,
    opacity: 0.45,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passCard: {
    borderRadius: 14,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  passInner: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  passHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 6,
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fitHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fitScore: { flexDirection: "row", alignItems: "baseline" },
  fitBar: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fitBarFill: { height: 6, borderRadius: 999 },
  fitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  avatarStack: { flexDirection: "row" },
  openSeat: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  costBar: {
    flexDirection: "row",
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
  },
  costSegment: { height: 18 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  box: { borderWidth: 1, borderRadius: 14, padding: 14 },
  errorPill: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  footer: { paddingBottom: 14 },
  sentBanner: {
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
  },
});
