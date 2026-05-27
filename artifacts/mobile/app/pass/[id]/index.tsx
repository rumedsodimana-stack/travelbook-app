import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { AvatarDot } from "@/components/primitives/AvatarDot";
import { Barcode } from "@/components/primitives/Barcode";
import {
  CommentIcon,
  HeartIcon,
  LiveDot,
  ShareIcon,
} from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { Stamp } from "@/components/primitives/Stamp";
import { TimeChip } from "@/components/primitives/TimeChip";
import { TYPE } from "@/constants/typography";
import { useNow } from "@/hooks/useNow";
import { useTheme } from "@/hooks/useTheme";
import { fetchPlan } from "@/lib/planner-api";

interface Member {
  userId: string;
  role: string;
  handle?: string;
  name?: string;
}

interface PassDoc {
  pass: {
    id: string;
    passNo?: number;
    code?: string;
    title: string;
    state: string;
    startsOn?: string;
    endsOn?: string;
    totalCost: string;
  };
  items: Array<{
    id: string;
    kind: string;
    state: string;
    title: string;
    subtitle: string;
    sortAt: string;
    cost?: string | null;
  }>;
  members: Member[];
}

const MEMBER_TONES: Array<"terra" | "paper" | "dark"> = ["terra", "paper", "dark"];

const ACTIVITY_FEED = [
  { id: "a-1", kind: "BUDDY", label: "Theo joined the pass.", ago: "2H AGO" },
  { id: "a-2", kind: "AI", label: "AI shifted Den dinner by 30 min.", ago: "1D AGO" },
  { id: "a-3", kind: "WEATHER", label: "Tokyo · 17°C · light rain Tue.", ago: "1D AGO" },
  { id: "a-4", kind: "BUDDY REQ", label: "@mei.k wants to join.", ago: "4H AGO" },
];

export default function PassDetailScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const passId = params.id!;
  const now = useNow();
  const [doc, setDoc] = useState<PassDoc | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"itinerary" | "activity" | "map" | "buddies">(
    "itinerary",
  );
  const dayRefs = useRef<Record<string, number>>({});
  const scrollRef = useRef<ScrollView | null>(null);

  const reload = useCallback(async () => {
    try {
      setDoc((await fetchPlan(passId)) as unknown as PassDoc);
    } catch {
      /* swallow */
    }
  }, [passId]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  function onScroll(_e: NativeSyntheticEvent<NativeScrollEvent>) {
    // reserved for future sticky behavior
  }

  // ─── Derived
  const sorted = useMemo(
    () =>
      doc
        ? [...doc.items].sort((a, b) => Date.parse(a.sortAt) - Date.parse(b.sortAt))
        : [],
    [doc],
  );
  const nextUp = sorted.find(
    (it) => it.state !== "cancelled" && Date.parse(it.sortAt) > now.getTime(),
  );
  const minsUntil = nextUp
    ? Math.max(0, Math.round((Date.parse(nextUp.sortAt) - now.getTime()) / 60_000))
    : null;

  // Day grouping for jump nav + headers
  const dayGroups = useMemo(() => {
    const out: Array<{ key: string; date: Date; items: typeof sorted }> = [];
    for (const it of sorted) {
      const d = new Date(it.sortAt);
      const k = d.toDateString();
      let g = out.find((x) => x.key === k);
      if (!g) {
        g = { key: k, date: d, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    return out;
  }, [sorted]);

  // Stats
  const totalCost = useMemo(
    () =>
      Number(doc?.pass.totalCost ?? 0) ||
      sorted.reduce((acc, it) => acc + Number(it.cost ?? 0), 0),
    [doc, sorted],
  );
  const tripLength =
    doc?.pass.startsOn && doc?.pass.endsOn
      ? Math.max(
          1,
          Math.round(
            (Date.parse(doc.pass.endsOn) - Date.parse(doc.pass.startsOn)) /
              (24 * 3600 * 1000),
          ),
        )
      : null;
  const cityCount = countUniqueCities(sorted);

  const passState = doc?.pass.state ?? "draft";
  const stateLine = computeStateLine(
    passState,
    doc?.pass.startsOn,
    doc?.pass.endsOn,
    now,
  );

  const menuItems: ActionSheetItem[] = [
    { label: "Share Pass", onPress: () => router.push({ pathname: "/pass/[id]/share", params: { id: passId } }) },
    { label: "Invite a buddy", onPress: () => flashToast("Buddy invite link copied") },
    { label: "Export as PDF", onPress: () => flashToast("Export queued"), disabled: true },
    { label: "Archive trip", onPress: () => flashToast("Pass archived") },
    { label: "Cancel trip", destructive: true, onPress: () => flashToast("Cancellation started") },
  ];

  if (!doc) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
        <PaperTexture />
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← PASSES</Text>
          </Pressable>
        </View>
        <View style={styles.loading}>
          <Text style={[TYPE.bodyS, { color: t.inkMute }]}>Loading pass…</Text>
        </View>
      </SafeAreaView>
    );
  }

  function scrollToDay(dayKey: string) {
    Haptics.selectionAsync().catch(() => {});
    const offset = dayRefs.current[dayKey];
    if (offset != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, offset - 90), animated: true });
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      {/* Top action row */}
      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute }]}>← PASSES</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/pass/[id]/today", params: { id: passId } })
            }
          >
            <Text style={[TYPE.monoXS, { color: t.terra }]}>TODAY →</Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setMenuOpen(true); }}>
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "700", lineHeight: 18 }]}>···</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {/* Pass cover */}
        <View style={[styles.cover, { backgroundColor: t.ink }]}>
          <View pointerEvents="none" style={styles.coverInnerBorder} />
          <View style={styles.coverHead}>
            <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.55)" }]}>
              PASS №{String(doc.pass.passNo ?? 1).padStart(3, "0")} · {doc.pass.code ?? "TB"}
            </Text>
            {passState === "live" ? (
              <View style={styles.liveBadge}>
                <LiveDot color={t.terra} size={6} />
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                  {stateLine}
                </Text>
              </View>
            ) : (
              <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.7)", fontWeight: "600" }]}>
                {stateLine}
              </Text>
            )}
          </View>
          <Text style={[TYPE.displayXL, { color: "#fff", marginVertical: 8 }]}>
            {doc.pass.title}
          </Text>
          <Text style={[TYPE.bodyS, { color: "rgba(255,255,255,0.6)" }]}>
            {doc.pass.startsOn ? datePill(doc.pass.startsOn) : ""} →{" "}
            {doc.pass.endsOn ? datePill(doc.pass.endsOn) : ""}
          </Text>
          <View style={{ marginTop: 14 }}>
            <Barcode seed={doc.pass.code ?? doc.pass.id.slice(0, 6)} height={24} dark />
          </View>
        </View>

        {/* Stats strip — at-a-glance numbers */}
        <View style={[styles.stats, { borderColor: t.inkHair }]}>
          <Stat n={String(tripLength ?? "—")} label="DAYS" />
          <StatDivider />
          <Stat n={String(sorted.length)} label="ITEMS" />
          <StatDivider />
          <Stat n={String(cityCount || 1)} label="CITIES" />
          <StatDivider />
          <Stat n={`$${Math.round(totalCost).toLocaleString()}`} label="TOTAL" small />
        </View>

        {/* Members rail */}
        <View style={styles.membersBlock}>
          <View style={styles.membersHead}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
              BUDDIES · {doc.members.length}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                flashToast("Buddy invite link copied");
              }}
            >
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                + INVITE
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersRow}
          >
            {doc.members.map((m, i) => (
              <View key={m.userId} style={styles.memberCell}>
                <AvatarDot
                  size={48}
                  ring={i === 0}
                  ringColor={m.role === "owner" ? t.terra : t.inkHair}
                  tone={MEMBER_TONES[i % MEMBER_TONES.length]}
                />
                <Text
                  style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}
                  numberOfLines={1}
                >
                  @{m.handle ?? m.userId.slice(0, 4)}
                </Text>
                {m.role === "owner" ? (
                  <Text style={[TYPE.monoXS, { color: t.terra, fontSize: 8, marginTop: 1 }]}>
                    OWNER
                  </Text>
                ) : null}
              </View>
            ))}
            {/* Open seats placeholder */}
            <Pressable
              style={styles.memberCell}
              onPress={() => flashToast("Buddy invite link copied")}
            >
              <View style={[styles.openSeat, { borderColor: t.terra }]}>
                <Text style={{ fontSize: 22, color: t.terra }}>+</Text>
              </View>
              <Text style={[TYPE.monoXS, { color: t.terra, marginTop: 4 }]}>SEAT</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Tab segmented control */}
        <View style={[styles.tabsRow, { borderColor: t.inkHair }]}>
          {(["itinerary", "activity", "map", "buddies"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab(tab);
              }}
              style={[
                styles.tab,
                {
                  borderBottomColor: activeTab === tab ? t.ink : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  TYPE.monoXS,
                  {
                    color: activeTab === tab ? t.ink : t.inkMute,
                    fontWeight: "600",
                  },
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ITINERARY tab */}
        {activeTab === "itinerary" ? (
          <>
            {/* Live Next-up countdown */}
            {nextUp && passState === "live" ? (
              <View style={[styles.nextCard, { borderColor: t.terra, backgroundColor: t.surface }]}>
                <View style={styles.nextHead}>
                  <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                    {minsUntil != null && minsUntil < 60
                      ? `NEXT UP · IN ${minsUntil} MIN`
                      : minsUntil != null
                      ? `NEXT UP · IN ${Math.round(minsUntil / 60)}H`
                      : "NEXT UP"}
                  </Text>
                  {minsUntil != null && minsUntil <= 30 ? (
                    <View style={styles.urgentChip}>
                      <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
                        TIME TO HEAD OUT
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[TYPE.displayM, { color: t.ink, marginTop: 6 }]}>
                  {nextUp.title}
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{nextUp.subtitle}</Text>
              </View>
            ) : null}

            {/* Day jump nav */}
            {dayGroups.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayNavRow}
              >
                {dayGroups.map((g, i) => (
                  <Pressable
                    key={g.key}
                    onPress={() => scrollToDay(g.key)}
                    style={[styles.dayChip, { borderColor: t.inkHair, backgroundColor: t.surface }]}
                  >
                    <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                      DAY {i + 1}
                    </Text>
                    <Text style={[TYPE.body, { color: t.ink, fontSize: 13 }]}>
                      {g.date.toLocaleDateString([], { month: "short", day: "numeric" })}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {/* Day-grouped timeline */}
            <View style={styles.timelineWrap}>
              {dayGroups.map((g, gi) => (
                <View
                  key={g.key}
                  onLayout={(e) => {
                    dayRefs.current[g.key] = e.nativeEvent.layout.y;
                  }}
                  style={{ marginTop: gi === 0 ? 0 : 18 }}
                >
                  <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8, fontWeight: "600" }]}>
                    DAY {gi + 1} · {g.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
                  </Text>
                  <View style={{ gap: 10 }}>
                    {g.items.map((it) => {
                      const isPast = Date.parse(it.sortAt) < now.getTime();
                      const isNext = nextUp?.id === it.id;
                      return (
                        <Pressable
                          key={it.id}
                          onPress={() =>
                            router.push({
                              pathname: "/pass/[id]/items/[itemId]",
                              params: { id: passId, itemId: it.id },
                            })
                          }
                          style={({ pressed }) => [
                            styles.itemRow,
                            {
                              borderColor: isNext ? t.terra : t.inkHair,
                              borderWidth: isNext ? 1.5 : 1,
                              backgroundColor: t.surface,
                              opacity: pressed ? 0.7 : isPast ? 0.55 : 1,
                            },
                          ]}
                        >
                          <View style={styles.itemRail}>
                            <View style={[styles.itemDot, { backgroundColor: isNext ? t.terra : t.inkSoft }]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[TYPE.monoXS, { color: isNext ? t.terra : t.inkMute }]}>
                              {it.kind.toUpperCase()} · {timePill(it.sortAt)}
                            </Text>
                            <Text style={[TYPE.body, { color: t.ink }]}>{it.title}</Text>
                            <Text style={[TYPE.bodyS, { color: t.inkMute }]}>{it.subtitle}</Text>
                            {it.cost ? (
                              <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}>
                                ${Math.round(Number(it.cost)).toLocaleString()}
                              </Text>
                            ) : null}
                          </View>
                          {it.state === "confirmed" && isPast ? (
                            <Stamp label="DONE" kind="rect" />
                          ) : it.state === "cancelled" ? (
                            <Stamp label="—" kind="rect" />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Cost summary */}
            <View style={[styles.costSummary, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>COSTS</Text>
              {Object.entries(costsByKind(sorted)).map(([k, v]) => (
                <View key={k} style={styles.costRow}>
                  <Text style={[TYPE.body, { color: t.ink }]}>{labelFor(k)}</Text>
                  <Text style={[TYPE.monoS, { color: t.inkMute, fontWeight: "600" }]}>
                    ${Math.round(v).toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[styles.costRow, styles.costTotal, { borderTopColor: t.inkHair }]}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>Total</Text>
                <Text style={[TYPE.displayM, { color: t.ink }]}>
                  ${Math.round(totalCost).toLocaleString()}
                </Text>
              </View>
              <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}>
                PER HEAD: ${Math.round(totalCost / Math.max(1, doc.members.length)).toLocaleString()}
              </Text>
            </View>
          </>
        ) : null}

        {/* ACTIVITY tab */}
        {activeTab === "activity" ? (
          <View style={styles.tabBody}>
            {ACTIVITY_FEED.map((a) => (
              <View key={a.id} style={[styles.activityRow, { borderBottomColor: t.inkHair }]}>
                <View style={[styles.activityDot, { backgroundColor: t.terra }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                    {a.kind}
                  </Text>
                  <Text style={[TYPE.body, { color: t.ink }]}>{a.label}</Text>
                </View>
                <Text style={[TYPE.monoXS, { color: t.inkMute }]}>{a.ago}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* MAP tab */}
        {activeTab === "map" ? (
          <View style={styles.tabBody}>
            <View style={[styles.mapCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
              <Svg width="100%" height="240" viewBox="0 0 360 240">
                {/* Stylised waypoint route */}
                <Path
                  d="M 40 200 Q 100 60, 180 120 T 320 60"
                  stroke={t.terra}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="none"
                />
                {[[40, 200], [180, 120], [320, 60]].map(([x, y], i) => (
                  <React.Fragment key={i}>
                    <Circle cx={x} cy={y} r={6} fill={t.terra} />
                    <Circle cx={x} cy={y} r={11} stroke={t.terra} strokeWidth={1} fill="none" />
                  </React.Fragment>
                ))}
              </Svg>
              <View style={{ padding: 14, gap: 4 }}>
                <Text style={[TYPE.monoXS, { color: t.inkMute }]}>ROUTE</Text>
                <Text style={[TYPE.body, { color: t.ink }]}>
                  Tokyo → Kyoto → Osaka
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute }]}>
                  3 cities · 1,240 km
                </Text>
              </View>
            </View>
            <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 10, textAlign: "center" }]}>
              FULL MAPBOX VIEW · COMING IN V1.5
            </Text>
          </View>
        ) : null}

        {/* BUDDIES tab */}
        {activeTab === "buddies" ? (
          <View style={styles.tabBody}>
            {doc.members.map((m, i) => (
              <View key={m.userId} style={[styles.buddyRow, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
                <AvatarDot size={40} ring={i === 0} ringColor={m.role === "owner" ? t.terra : t.inkHair} tone={MEMBER_TONES[i % MEMBER_TONES.length]} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
                    {m.name ?? `@${m.handle ?? m.userId.slice(0, 4)}`}
                  </Text>
                  <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
                    {m.role.toUpperCase()} · @{m.handle ?? m.userId.slice(0, 4)}
                  </Text>
                </View>
                {m.role === "owner" ? (
                  <Stamp label="OWNER" kind="rect" />
                ) : (
                  <Pressable
                    onPress={() => flashToast(`Messaging @${m.handle ?? "buddy"}…`)}
                    hitSlop={8}
                  >
                    <CommentIcon color={t.ink} size={22} />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable
              onPress={() => flashToast("Buddy invite link copied")}
              style={[styles.inviteRow, { borderColor: t.terra }]}
            >
              <Text style={[TYPE.body, { color: t.terra, fontWeight: "600" }]}>
                + Invite another buddy
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PillBtn
          label="Share Pass"
          tone="ink"
          fullWidth
          onPress={() =>
            router.push({ pathname: "/pass/[id]/share", params: { id: passId } })
          }
        />
      </View>

      <ActionSheet
        visible={menuOpen}
        title="Pass options"
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      {toast ? (
        <View style={[styles.toast, { backgroundColor: t.ink }]} pointerEvents="none">
          <Text style={[TYPE.bodyS, { color: "#fff", fontWeight: "500" }]}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── helpers ────────────────────────────────────────────────────

function Stat({ n, label, small }: { n: string; label: string; small?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[small ? TYPE.body : TYPE.displayL, { color: t.ink }]}>{n}</Text>
      <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  const { t } = useTheme();
  return <View style={[stylesLocal.statDivider, { backgroundColor: t.inkHair }]} />;
}

const stylesLocal = StyleSheet.create({
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 6 },
});

function timePill(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function countUniqueCities(items: Array<{ kind: string; subtitle: string; data?: unknown }>): number {
  // Crude: count unique stays
  const stays = items.filter((i) => i.kind === "stay");
  if (stays.length === 0) return 1;
  return new Set(stays.map((s) => s.subtitle.split(",")[0]?.trim())).size;
}

function costsByKind(items: Array<{ kind: string; cost?: string | null }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    if (it.cost == null) continue;
    out[it.kind] = (out[it.kind] ?? 0) + Number(it.cost);
  }
  return out;
}

function labelFor(kind: string): string {
  const m: Record<string, string> = {
    flight: "Flights",
    stay: "Stay",
    activity: "Activities",
    dining: "Dining",
    transit: "Transit",
    visa: "Visa",
    insurance: "Insurance",
    event: "Events",
    entertainment: "Entertainment",
  };
  return m[kind] ?? kind;
}

function computeStateLine(
  state: string,
  startsOn: string | undefined,
  endsOn: string | undefined,
  now: Date,
): string {
  if (!startsOn || !endsOn) return state.toUpperCase();
  const startMs = Date.parse(startsOn);
  const endMs = Date.parse(endsOn);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endMs - startMs) / dayMs));
  const t = now.getTime();
  if (t >= startMs && t <= endMs) {
    const dayN = Math.max(1, Math.round((t - startMs) / dayMs) + 1);
    return `LIVE · DAY ${dayN} OF ${totalDays}`;
  }
  if (startMs > t) {
    const out = Math.round((startMs - t) / dayMs);
    if (out === 0) return "STARTS TODAY";
    if (out === 1) return "STARTS TOMORROW";
    return `STARTS IN ${out} DAYS`;
  }
  const since = Math.round((t - endMs) / dayMs);
  return `WRAPPED ${since}D AGO`;
}

// ─── styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { borderRadius: 14, padding: 22, position: "relative", overflow: "hidden" },
  coverInnerBorder: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  coverHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  membersBlock: { marginTop: 18 },
  membersHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  membersRow: { gap: 12, paddingRight: 20 },
  memberCell: { alignItems: "center", width: 60 },
  openSeat: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  nextCard: {
    marginTop: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  nextHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  urgentChip: {
    backgroundColor: "#e8744a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dayNavRow: { gap: 8, paddingVertical: 14 },
  dayChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-start",
    minWidth: 70,
  },
  timelineWrap: { marginTop: 4 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  itemRail: { alignItems: "center" },
  itemDot: { width: 10, height: 10, borderRadius: 5 },
  costSummary: {
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  costTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingTop: 12,
  },
  tabBody: { marginTop: 14, gap: 10 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  mapCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  buddyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  inviteRow: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  footer: { paddingBottom: 14 },
  toast: {
    position: "absolute",
    bottom: 84,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
