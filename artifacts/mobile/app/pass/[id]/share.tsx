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
import { LiveDot } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchPlan } from "@/lib/planner-api";
import { sharePass } from "@/lib/social-api";

type Visibility = "private" | "link" | "friends" | "public";

interface PassDoc {
  pass: { id: string; passNo?: number; code?: string; title: string; startsOn?: string; endsOn?: string };
  items: Array<{ id: string; kind: string; title: string; subtitle: string }>;
  members: Array<{ userId: string; role: string }>;
}

const VISIBILITY_DESC: Record<Visibility, { label: string; sub: string }> = {
  public: { label: "Public", sub: "Anyone on TravelBook can see this" },
  friends: { label: "Friends", sub: "Only people you follow each other with" },
  link: { label: "Link only", sub: "Just people you share the link with" },
  private: { label: "Private", sub: "Save without posting to your feed" },
};

const HASHTAG_SUGGESTIONS = ["#cherryblossom", "#tokyo", "#solo", "#slowtravel", "#foodie"];

export default function SharePassScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const passId = params.id!;
  const [doc, setDoc] = useState<PassDoc | null>(null);
  const [caption, setCaption] = useState("");
  const [openSeats, setOpenSeats] = useState<0 | 1 | 2 | 3>(0);
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlan(passId).then((d) => setDoc(d as unknown as PassDoc)).catch(() => {});
  }, [passId]);

  const buddiesOn = openSeats > 0;
  const charsLeft = 280 - caption.length;
  const charsLow = charsLeft < 30;

  async function onPost() {
    setBusy(true);
    setError(null);
    try {
      await sharePass(passId, { caption, visibility, openSeats });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post — try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  function insertHashtag(tag: string) {
    Haptics.selectionAsync().catch(() => {});
    setCaption((c) => (c.endsWith(" ") || c.length === 0 ? `${c}${tag} ` : `${c} ${tag} `));
  }

  // Derive itinerary chips from doc
  const itineraryChips = doc
    ? deriveItineraryChips(doc.items)
    : ["✈ FLIGHTS", "🏨 STAY", "ACTIVITIES"];

  const passNo = doc?.pass.passNo ?? 0;
  const passCode = doc?.pass.code ?? "TB";
  const passTitle = doc?.pass.title ?? "Your trip";
  const dateRange =
    doc?.pass.startsOn && doc?.pass.endsOn
      ? `${datePill(doc.pass.startsOn)} → ${datePill(doc.pass.endsOn)}`
      : "";
  const totalDays =
    doc?.pass.startsOn && doc?.pass.endsOn
      ? Math.max(
          1,
          Math.round(
            (Date.parse(doc.pass.endsOn) - Date.parse(doc.pass.startsOn)) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>CANCEL</Text>
        </Pressable>
        <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>Share Pass</Text>
        <Pressable disabled={busy} onPress={onPost}>
          <Text
            style={[
              TYPE.monoXS,
              { color: busy ? t.inkMute : t.terra, fontWeight: "700" },
            ]}
          >
            {busy ? "POSTING…" : "POST"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, gap: 18, paddingBottom: 60 }}>
        {/* Feed-post preview — what it'll look like in others' feeds */}
        <View>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>
            FEED PREVIEW
          </Text>
          <View
            style={[
              styles.feedPreview,
              { borderColor: t.inkHair, backgroundColor: t.paperLight },
            ]}
          >
            <View style={styles.feedHead}>
              <AvatarDot size={32} tone="terra" />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[TYPE.bodyS, { color: t.ink, fontWeight: "600" }]}>
                    @dev
                  </Text>
                  <Text style={[TYPE.bodyS, { color: t.inkMute }]}>shared a pass</Text>
                </View>
                <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
                  {buddiesOn ? `OPEN FOR ${openSeats} BUDDIES · NOW` : "JUST NOW"}
                </Text>
              </View>
              <Stamp label="PASS" kind="rect" rotate={-4} />
            </View>

            {/* Embedded dark pass card */}
            <View style={[styles.passCard, { backgroundColor: t.ink }]}>
              <View pointerEvents="none" style={styles.passCardInner} />
              <View style={styles.passCardHead}>
                <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
                  PASS · {passCode}
                </Text>
                <View style={styles.liveBadge}>
                  <LiveDot color={t.terra} size={6} />
                  <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                    LIVE · DAY 4 OF {totalDays || 7}
                  </Text>
                </View>
              </View>
              <Text style={[TYPE.displayM, { color: "#fff", marginTop: 6, fontSize: 18 }]}>
                {passTitle}
              </Text>
              <View style={styles.passMeta}>
                <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)" }]}>
                  {dateRange}
                </Text>
                <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
                  {totalDays || 7} DAYS
                </Text>
              </View>
              <View style={styles.passChips}>
                {itineraryChips.slice(0, 3).map((c) => (
                  <View key={c} style={styles.passChip}>
                    <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.9)", fontWeight: "600" }]}>
                      {c}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 10 }}>
                <Barcode seed={passCode} height={14} dark />
              </View>
            </View>

            {caption ? (
              <Text style={[TYPE.bodyS, { color: t.ink, marginTop: 10 }]}>{caption}</Text>
            ) : null}
          </View>
        </View>

        {/* Caption composer */}
        <View>
          <View style={styles.captionLabelRow}>
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>CAPTION</Text>
            <Text
              style={[
                TYPE.monoXS,
                { color: charsLow ? t.stampRed : t.inkMute, fontWeight: "600" },
              ]}
            >
              {charsLeft}
            </Text>
          </View>
          <View style={[styles.box, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              maxLength={280}
              multiline
              placeholder="Why is this trip worth sharing? Add why, who, what's special."
              placeholderTextColor={t.inkMute}
              style={[TYPE.body, { color: t.ink, minHeight: 84, textAlignVertical: "top" }]}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hashtagRow}
          >
            {HASHTAG_SUGGESTIONS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => insertHashtag(tag)}
                style={[styles.hashtagChip, { borderColor: t.inkHair }]}
              >
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>{tag}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Open for buddies */}
        <View style={[styles.box, { borderColor: t.inkHair, backgroundColor: t.surface, padding: 14 }]}>
          <View style={styles.openForRow}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>
                Open for travel buddies
              </Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
                Let people request to join your trip. You approve each one.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setOpenSeats(buddiesOn ? 0 : 2);
              }}
              style={[
                styles.toggle,
                { borderColor: t.ink, backgroundColor: buddiesOn ? t.ink : "transparent" },
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  {
                    backgroundColor: buddiesOn ? "#fff" : t.ink,
                    transform: [{ translateX: buddiesOn ? 18 : 0 }],
                  },
                ]}
              />
            </Pressable>
          </View>

          {buddiesOn ? (
            <View style={{ marginTop: 14, gap: 10 }}>
              <Text style={[TYPE.monoXS, { color: t.inkMute }]}>HOW MANY SEATS</Text>
              <View style={styles.chipRow}>
                {[1, 2, 3].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setOpenSeats(n as 1 | 2 | 3);
                    }}
                    style={[
                      styles.seatChip,
                      {
                        borderColor: openSeats === n ? t.terra : t.inkHair,
                        backgroundColor: openSeats === n ? t.terra : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        TYPE.body,
                        { color: openSeats === n ? "#fff" : t.ink, fontWeight: "600" },
                      ]}
                    >
                      +{n}
                    </Text>
                    <Text
                      style={[
                        TYPE.monoXS,
                        {
                          color:
                            openSeats === n ? "rgba(255,255,255,0.7)" : t.inkMute,
                        },
                      ]}
                    >
                      SEAT{n > 1 ? "S" : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[TYPE.bodyS, { color: t.inkMute }]}>
                Closes 7 days before your trip starts.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Visibility */}
        <View>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8 }]}>VISIBILITY</Text>
          <View style={{ gap: 8 }}>
            {(["public", "friends", "link", "private"] as const).map((v) => {
              const on = visibility === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setVisibility(v);
                  }}
                  style={[
                    styles.visibilityRow,
                    {
                      borderColor: on ? t.terra : t.inkHair,
                      backgroundColor: t.surface,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: on ? t.terra : t.inkSoft,
                        backgroundColor: on ? t.terra : "transparent",
                      },
                    ]}
                  >
                    {on ? (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>
                      {VISIBILITY_DESC[v].label}
                    </Text>
                    <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
                      {VISIBILITY_DESC[v].sub}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Error state */}
        {error ? (
          <View style={[styles.errorPill, { borderColor: t.stampRed }]}>
            <Text style={[TYPE.bodyS, { color: t.stampRed }]}>{error}</Text>
          </View>
        ) : null}

        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Stamp label="DRAFT" kind="rect" rotate={-3} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function deriveItineraryChips(items: Array<{ kind: string; title?: string }>): string[] {
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.kind] = (counts[it.kind] ?? 0) + 1;
  const out: string[] = [];
  if (counts.flight) out.push("✈ FLIGHT");
  if (counts.stay) {
    const s = items.find((i) => i.kind === "stay");
    out.push(s?.title ? `🏨 ${s.title.toUpperCase()}`.slice(0, 18) : "🏨 STAY");
  }
  if (counts.activity) out.push(`${counts.activity} ACTIVITIES`);
  if (counts.dining && out.length < 3) out.push(`${counts.dining} DINING`);
  return out;
}

function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,37,64,0.1)",
  },
  feedPreview: { borderWidth: 1, borderRadius: 14, padding: 14 },
  feedHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  passCard: {
    marginTop: 10,
    borderRadius: 8,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  passCardInner: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  passCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  passMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  passChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  passChip: {
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(244,237,228,0.06)",
  },
  captionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  box: { borderWidth: 1, borderRadius: 14, padding: 14 },
  hashtagRow: { gap: 6, marginTop: 8 },
  hashtagChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openForRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    padding: 1,
    justifyContent: "center",
  },
  toggleKnob: { width: 18, height: 18, borderRadius: 9 },
  chipRow: { flexDirection: "row", gap: 8 },
  seatChip: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  errorPill: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
});
