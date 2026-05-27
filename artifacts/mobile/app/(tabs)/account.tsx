import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvatarDot } from "@/components/primitives/AvatarDot";
import { Barcode } from "@/components/primitives/Barcode";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { fetchPasses } from "@/lib/planner-api";

interface PassRow {
  id: string;
  passNo: number;
  code: string;
  title: string;
  startsOn: string;
  endsOn: string;
  state: string;
  totalCost?: string;
}

const COUNTRY_STAMPS = [
  { code: "JP", label: "JAPAN", rotate: -3 },
  { code: "ID", label: "BALI", rotate: 4 },
  { code: "PT", label: "PORTUGAL", rotate: -2 },
];

const RECENT_BUDDIES = [
  { handle: "theo", tone: "paper" as const },
  { handle: "mei.k", tone: "terra" as const },
  { handle: "ravi.s", tone: "dark" as const },
];

export default function AccountScreen() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [passes, setPasses] = useState<{
    live: PassRow[];
    upcoming: PassRow[];
    drafts: PassRow[];
    archived: PassRow[];
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPasses()
        .then((g) => setPasses(g as never))
        .catch(() => setPasses(null));
    }, []),
  );

  const totalTrips =
    (passes?.live.length ?? 0) +
    (passes?.upcoming.length ?? 0) +
    (passes?.archived.length ?? 0);
  const stamps = passes?.archived.length ?? 0;
  const buddies = RECENT_BUDDIES.length;
  const livePass = passes?.live?.[0] ?? null;

  return (
    <View style={[styles.root, { backgroundColor: t.appBg, paddingTop: insets.top }]}>
      <PaperTexture />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Identity hero — passport-style */}
        <View style={[styles.identity, { backgroundColor: t.ink }]}>
          <View pointerEvents="none" style={styles.identityInner} />

          <View style={styles.identTop}>
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
              PASSPORT · TRAVELBOOK
            </Text>
            <Stamp label="VERIFIED" kind="rect" />
          </View>

          <View style={styles.identRow}>
            <AvatarDot size={72} ring ringColor={t.terra} tone="terra" />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.displayL, { color: "#fff" }]}>
                {user?.name ?? "Dev User"}
              </Text>
              <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)", marginTop: 2 }]}>
                @{user?.handle ?? "dev"} · MEMBER SINCE 2026
              </Text>
            </View>
          </View>

          {/* Stats inline */}
          <View style={styles.identCounters}>
            <DarkStat n={String(totalTrips)} label="TRIPS" />
            <DarkDivider />
            <DarkStat n={String(buddies)} label="BUDDIES" />
            <DarkDivider />
            <DarkStat n={String(stamps)} label="STAMPS" />
            <DarkDivider />
            <DarkStat n="3" label="COUNTRIES" />
          </View>

          {/* Quick actions */}
          <View style={styles.identActions}>
            <QuickAction label="Edit" onPress={() => {}} />
            <QuickAction label="Share" onPress={() => {}} />
            <QuickAction label="QR" onPress={() => {}} />
          </View>

          {/* Barcode at bottom */}
          <View style={{ marginTop: 16 }}>
            <Barcode seed={user?.id ?? "dev"} height={20} dark />
          </View>
        </View>

        {/* Currently traveling banner */}
        {livePass ? (
          <Pressable
            onPress={() => router.push({ pathname: "/pass/[id]", params: { id: livePass.id } })}
            style={[styles.liveBanner, { borderColor: t.terra, backgroundColor: t.surface }]}
          >
            <View style={styles.liveDot}>
              <View style={[styles.dotPulse, { backgroundColor: t.terra }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                CURRENTLY TRAVELING
              </Text>
              <Text style={[TYPE.body, { color: t.ink, marginTop: 2 }]}>{livePass.title}</Text>
            </View>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>OPEN →</Text>
          </Pressable>
        ) : null}

        {/* Passport stamps collection */}
        <Section title="Your stamps">
          <View style={[styles.stampsCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <View style={styles.stampsRow}>
              {COUNTRY_STAMPS.map((s) => (
                <View key={s.code} style={styles.stampWrap}>
                  <Stamp label={s.label} kind="circle" rotate={s.rotate} />
                  <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 6 }]}>
                    {s.code}
                  </Text>
                </View>
              ))}
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={`empty-${i}`} style={[styles.stampWrap, styles.stampEmpty]}>
                  <View style={[styles.stampPlaceholder, { borderColor: t.inkHair }]} />
                  <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 6 }]}>—</Text>
                </View>
              ))}
            </View>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 12 }]}>
              {stamps} of 50 stamps · Next: <Text style={{ color: t.terra, fontWeight: "600" }}>Iceland</Text>
            </Text>
          </View>
        </Section>

        {/* Recent buddies */}
        <Section title="Recent buddies">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buddiesRow}
          >
            {RECENT_BUDDIES.map((b) => (
              <Pressable
                key={b.handle}
                onPress={() => Haptics.selectionAsync().catch(() => {})}
                style={styles.buddyCell}
              >
                <AvatarDot size={48} ring tone={b.tone} />
                <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]} numberOfLines={1}>
                  @{b.handle.split(".")[0]}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.buddyCell} onPress={() => {}}>
              <View style={[styles.buddyAdd, { borderColor: t.inkSoft }]}>
                <Text style={{ fontSize: 22, color: t.inkMute }}>+</Text>
              </View>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}>FIND</Text>
            </Pressable>
          </ScrollView>
        </Section>

        {/* Passes */}
        <Section title={`Your passes${totalTrips > 0 ? ` · ${totalTrips}` : ""}`}>
          <View style={[styles.sectionInner, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            {passes && [...passes.live, ...passes.upcoming, ...passes.drafts].length === 0 ? (
              <Row
                title="No passes yet"
                sub="Start your first trip in Plan."
                onPress={() => router.push("/(tabs)/planner")}
                cta="Plan"
              />
            ) : (
              [...(passes?.live ?? []), ...(passes?.upcoming ?? []), ...(passes?.drafts ?? [])]
                .slice(0, 4)
                .map((p, i, arr) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push({ pathname: "/pass/[id]", params: { id: p.id } })}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        borderBottomColor: t.inkHair,
                        borderBottomWidth: i === arr.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
                        PASS №{String(p.passNo).padStart(3, "0")} · {p.code}
                      </Text>
                      <Text style={[TYPE.body, { color: t.ink, marginTop: 2 }]}>{p.title}</Text>
                      <Text style={[TYPE.bodyS, { color: t.inkMute }]}>
                        {datePill(p.startsOn)} → {datePill(p.endsOn)}
                      </Text>
                    </View>
                    {p.state === "live" ? <Stamp label="LIVE" kind="rect" /> : null}
                    {p.state === "draft" ? <Stamp label="DRAFT" kind="rect" /> : null}
                  </Pressable>
                ))
            )}
          </View>
        </Section>

        {/* Documents */}
        <Section title="Documents">
          <View style={[styles.sectionInner, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <Row
              title="No documents yet"
              sub="Passport, ID, visa — held encrypted, used to autofill"
              cta="Add"
              disabled
            />
          </View>
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <View style={[styles.sectionInner, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <Row title="No payment method" sub="Apple Pay + cards land in v1.5" disabled />
          </View>
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <View style={[styles.sectionInner, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <Row
              title="Appearance"
              sub="Stamped · cream paper"
              onPress={() => router.push("/account/appearance")}
              cta="Open"
            />
            <Row
              title="Inbox"
              sub="Notifications + nudges"
              onPress={() => router.push("/account/inbox")}
              cta="Open"
            />
            <Row
              title="Sign out"
              sub="Clear local state"
              onPress={signOut}
              cta="Sign out"
              destructive
            />
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

// ─── helpers

function DarkStat({ n, label }: { n: string; label: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[TYPE.displayM, { color: "#fff" }]}>{n}</Text>
      <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)", marginTop: 2 }]}>
        {label}
      </Text>
    </View>
  );
}

function DarkDivider() {
  return (
    <View style={{ width: 1, alignSelf: "stretch", backgroundColor: "rgba(244,237,228,0.15)" }} />
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qa,
        { borderColor: "rgba(244,237,228,0.3)", opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[TYPE.monoXS, { color: t.inkMute, paddingHorizontal: 22, marginBottom: 10 }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Row({
  title,
  sub,
  cta,
  onPress,
  disabled = false,
  destructive = false,
}: {
  title: string;
  sub?: string;
  cta?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={!disabled ? onPress : undefined}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: t.inkHair, opacity: disabled ? 0.5 : pressed ? 0.6 : 1 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.body, { color: destructive ? t.stampRed : t.ink }]}>{title}</Text>
        {sub ? (
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{sub}</Text>
        ) : null}
      </View>
      {cta ? (
        <Text style={[TYPE.monoXS, { color: destructive ? t.stampRed : t.terra, fontWeight: "600" }]}>
          {cta.toUpperCase()} →
        </Text>
      ) : null}
    </Pressable>
  );
}

function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  identity: {
    marginHorizontal: 22,
    marginTop: 14,
    borderRadius: 14,
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  identityInner: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  identTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  identRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  identCounters: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(244,237,228,0.15)",
    borderBottomColor: "rgba(244,237,228,0.15)",
  },
  identActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  qa: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  liveBanner: {
    marginHorizontal: 22,
    marginTop: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveDot: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulse: { width: 10, height: 10, borderRadius: 5 },
  stampsCard: {
    marginHorizontal: 22,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  stampsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    rowGap: 18,
  },
  stampWrap: { alignItems: "center", width: 60 },
  stampEmpty: { opacity: 0.4 },
  stampPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  buddiesRow: { gap: 14, paddingHorizontal: 22 },
  buddyCell: { alignItems: "center", width: 60 },
  buddyAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInner: {
    marginHorizontal: 22,
    borderWidth: 1,
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
});
