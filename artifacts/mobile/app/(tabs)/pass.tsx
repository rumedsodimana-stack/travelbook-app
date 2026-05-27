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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Barcode } from "@/components/primitives/Barcode";
import { LiveDot } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchPasses } from "@/lib/planner-api";

interface Pass {
  id: string;
  passNo: number;
  code: string;
  title: string;
  startsOn: string;
  endsOn: string;
  state: string;
  totalCost: string;
}

interface PassGroups {
  live: Pass[];
  upcoming: Pass[];
  drafts: Pass[];
  archived: Pass[];
}

type Filter = "all" | "live" | "upcoming" | "drafts" | "archived";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "drafts", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export default function PassListScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<PassGroups | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const reload = useCallback(async () => {
    try {
      setGroups((await fetchPasses()) as PassGroups);
    } catch {
      setGroups({ live: [], upcoming: [], drafts: [], archived: [] });
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const totalCount =
    (groups?.live.length ?? 0) +
    (groups?.upcoming.length ?? 0) +
    (groups?.drafts.length ?? 0) +
    (groups?.archived.length ?? 0);

  const totalSpend = useMemo(() => {
    if (!groups) return 0;
    return [...groups.live, ...groups.upcoming, ...groups.archived].reduce(
      (acc, p) => acc + Number(p.totalCost ?? 0),
      0,
    );
  }, [groups]);

  return (
    <View style={[styles.root, { backgroundColor: t.appBg, paddingTop: insets.top }]}>
      <PaperTexture />
      <ScreenHeader
        overline={`PASSES · ${totalCount} ON FILE`}
        title="Your passes"
        action={
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push("/(tabs)/planner");
            }}
            style={[styles.newBtn, { borderColor: t.terra }]}
          >
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>+ NEW</Text>
          </Pressable>
        }
      />

      {/* Memory stats strip */}
      {groups && totalCount > 0 ? (
        <View style={[styles.statsStrip, { borderColor: t.inkHair }]}>
          <MiniStat n={String(groups.archived.length)} label="DONE" />
          <MiniDivider />
          <MiniStat n={String(groups.upcoming.length + groups.live.length)} label="ACTIVE" />
          <MiniDivider />
          <MiniStat n="3" label="COUNTRIES" />
          <MiniDivider />
          <MiniStat n={`$${(totalSpend / 1000).toFixed(1)}k`} label="SPEND" />
        </View>
      ) : null}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? totalCount
              : groups?.[f.key as Exclude<Filter, "all">]?.length ?? 0;
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFilter(f.key);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: on ? t.ink : "transparent",
                  borderColor: on ? t.ink : t.inkHair,
                },
              ]}
            >
              <Text
                style={[
                  TYPE.bodyS,
                  { color: on ? "#fff" : t.ink, fontWeight: "500" },
                ]}
              >
                {f.label}
              </Text>
              <Text
                style={[
                  TYPE.monoXS,
                  {
                    color: on ? "rgba(255,255,255,0.6)" : t.inkMute,
                    fontWeight: "600",
                  },
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
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
        {!groups ? (
          <Text style={[TYPE.bodyS, { color: t.inkMute, paddingHorizontal: 22 }]}>
            Loading…
          </Text>
        ) : totalCount === 0 ? (
          <View style={[styles.empty, { borderColor: t.inkHair, marginHorizontal: 22 }]}>
            <Text style={{ fontSize: 38, marginBottom: 8 }}>✦</Text>
            <Text style={[TYPE.displayM, { color: t.ink, marginBottom: 6 }]}>
              No passes yet.
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginBottom: 14, textAlign: "center" }]}>
              Start a trip in Plan — every confirmed itinerary becomes a Pass.
            </Text>
            <PillBtn
              label="Plan a trip"
              tone="terra"
              onPress={() => router.push("/(tabs)/planner")}
            />
          </View>
        ) : (
          <>
            {(filter === "all" || filter === "live") && groups.live.length > 0 ? (
              <Group title="Live now">
                {groups.live.map((p) => <LivePassCard key={p.id} pass={p} />)}
              </Group>
            ) : null}
            {(filter === "all" || filter === "upcoming") && groups.upcoming.length > 0 ? (
              <Group title="Upcoming">
                {groups.upcoming.map((p) => <PassCard key={p.id} pass={p} />)}
              </Group>
            ) : null}
            {(filter === "all" || filter === "drafts") && groups.drafts.length > 0 ? (
              <Group title="Drafts">
                {groups.drafts.map((p) => <PassCard key={p.id} pass={p} draft />)}
              </Group>
            ) : null}
            {(filter === "all" || filter === "archived") && groups.archived.length > 0 ? (
              <Group title="Archived">
                {groups.archived.map((p) => <PassCard key={p.id} pass={p} muted />)}
              </Group>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[TYPE.monoXS, { color: t.inkMute, paddingHorizontal: 22, marginBottom: 10, fontWeight: "600" }]}>
        {title.toUpperCase()}
      </Text>
      <View style={{ gap: 10, paddingHorizontal: 22 }}>{children}</View>
    </View>
  );
}

function LivePassCard({ pass }: { pass: Pass }) {
  const { t } = useTheme();
  const router = useRouter();
  const now = Date.now();
  const startMs = Date.parse(pass.startsOn);
  const endMs = Date.parse(pass.endsOn);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endMs - startMs) / dayMs));
  const dayN = Math.max(1, Math.round((now - startMs) / dayMs) + 1);
  const daysLeft = Math.max(0, Math.round((endMs - now) / dayMs));

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/pass/[id]", params: { id: pass.id } })}
      style={[styles.liveCard, { backgroundColor: t.ink }]}
    >
      <View pointerEvents="none" style={styles.liveInner} />
      <View style={styles.liveHeader}>
        <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.55)" }]}>
          PASS №{String(pass.passNo).padStart(3, "0")} · {pass.code}
        </Text>
        <View style={styles.liveBadge}>
          <LiveDot color={t.terra} size={6} />
          <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
            LIVE · DAY {dayN} OF {totalDays}
          </Text>
        </View>
      </View>
      <Text style={[TYPE.displayXL, { color: "#fff", marginVertical: 8, fontSize: 28 }]}>
        {pass.title}
      </Text>
      <View style={styles.liveMeta}>
        <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.7)" }]}>
          {datePill(pass.startsOn)} → {datePill(pass.endsOn)}
        </Text>
        <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
          {daysLeft}D LEFT
        </Text>
      </View>
      <View style={{ marginTop: 14 }}>
        <Barcode seed={pass.code} height={20} dark />
      </View>
    </Pressable>
  );
}

function PassCard({
  pass,
  draft = false,
  muted = false,
}: {
  pass: Pass;
  draft?: boolean;
  muted?: boolean;
}) {
  const { t } = useTheme();
  const router = useRouter();
  const now = Date.now();
  const startMs = Date.parse(pass.startsOn);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((startMs - now) / dayMs);

  let stateChip = "";
  if (draft) {
    // DRAFT stamp shown separately
  } else if (muted) {
    const daysSince = Math.round((now - Date.parse(pass.endsOn)) / dayMs);
    stateChip = `${daysSince}D AGO`;
  } else if (dayDiff > 0) {
    stateChip = dayDiff === 1 ? "TOMORROW" : `IN ${dayDiff}D`;
  }

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/pass/[id]", params: { id: pass.id } })}
      style={({ pressed }) => [
        styles.passCard,
        {
          borderColor: t.inkHair,
          backgroundColor: t.surface,
          opacity: muted ? 0.65 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Mini barcode strip on left edge */}
      <View style={styles.passCardStrip}>
        <Barcode seed={pass.code} height={48} />
      </View>
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={styles.passHead}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]} numberOfLines={1}>
            PASS №{String(pass.passNo).padStart(3, "0")}
          </Text>
          {stateChip ? (
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              {stateChip}
            </Text>
          ) : null}
        </View>
        <Text style={[TYPE.monoXS, { color: t.inkMute }]} numberOfLines={1}>
          {pass.code}
        </Text>
        <Text style={[TYPE.body, { color: t.ink, marginTop: 4, fontWeight: "500" }]}>
          {pass.title}
        </Text>
        <View style={styles.passFooter}>
          <Text style={[TYPE.bodyS, { color: t.inkMute }]}>
            {datePill(pass.startsOn)} → {datePill(pass.endsOn)}
          </Text>
          {pass.totalCost ? (
            <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
              ${Math.round(Number(pass.totalCost)).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </View>
      {draft ? <Stamp label="DRAFT" kind="rect" /> : null}
    </Pressable>
  );
}

// ─── helpers

function MiniStat({ n, label }: { n: string; label: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>{n}</Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function MiniDivider() {
  const { t } = useTheme();
  return <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.inkHair, marginVertical: 4 }} />;
}

function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  newBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 22,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    paddingRight: 32,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 4,
    marginTop: 22,
  },
  liveCard: {
    borderRadius: 14,
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  liveInner: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  liveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  passCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  passCardStrip: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(10,37,64,0.1)",
    paddingRight: 12,
  },
  passHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
});
