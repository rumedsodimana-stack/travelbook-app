import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { buildPlan } from "@/lib/planner-api";

type TravelersType = "solo" | "partner" | "family" | "group";
type BudgetTier = "lean" | "mid" | "splurge";

const TRAVELERS_OPTS: Array<{ key: TravelersType; label: string }> = [
  { key: "solo", label: "Solo" },
  { key: "partner", label: "Partner" },
  { key: "family", label: "Family" },
  { key: "group", label: "Group" },
];

const BUDGET_OPTS: Array<{ key: BudgetTier; label: string; sub: string }> = [
  { key: "lean", label: "Lean", sub: "< $2k" },
  { key: "mid", label: "Mid", sub: "$2–6k" },
  { key: "splurge", label: "Splurge", sub: "$6k+" },
];

const QUICKSTARTS = [
  {
    tag: "CULTURE · 7D",
    title: "Cherry blossom Japan",
    sub: "partner · mid-budget · slow",
    prompt: "Cherry blossom week in Japan, partner, mid-budget, slow",
    emoji: "🌸",
  },
  {
    tag: "WELLNESS · 8D",
    title: "Bali surf + yoga",
    sub: "solo · mornings · no nightlife",
    prompt: "Bali — surf mornings, yoga, no nightlife",
    emoji: "🏄",
  },
  {
    tag: "CITY · 5D",
    title: "Lisbon long weekend",
    sub: "pescatarian · ocean walks",
    prompt: "Long weekend in Lisbon, pescatarian, ocean walks",
    emoji: "🌊",
  },
  {
    tag: "ROAD · 7D",
    title: "Iceland ring road",
    sub: "self-drive · midnight sun",
    prompt: "Iceland ring road, midnight sun, slow drive",
    emoji: "🚙",
  },
];

const CAPABILITIES = [
  { icon: "✈", label: "Flights" },
  { icon: "🏨", label: "Stays" },
  { icon: "🎟", label: "Activities" },
  { icon: "🚆", label: "Transit" },
  { icon: "🍣", label: "Dining" },
  { icon: "🪪", label: "Visa" },
  { icon: "🛡", label: "Insurance" },
];

const MANUAL: Array<{ kind: string; count: string; icon: string }> = [
  { kind: "Flights", count: "240", icon: "✈" },
  { kind: "Stays", count: "1,820", icon: "🏨" },
  { kind: "Activities", count: "92", icon: "🎟" },
  { kind: "Transit", count: "64", icon: "🚆" },
  { kind: "Visas", count: "3", icon: "🪪" },
  { kind: "Insurance", count: "5", icon: "🛡" },
];

export default function PlannerScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [prompt, setPrompt] = useState(params.prompt ?? "");
  const [travelers, setTravelers] = useState<TravelersType>("partner");
  const [budget, setBudget] = useState<BudgetTier>("mid");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.prompt) setPrompt(params.prompt);
  }, [params.prompt]);

  async function planIt(seed?: string) {
    const text = (seed ?? prompt).trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    try {
      const { passId } = await buildPlan({
        prompt: text,
        travelers: travelers === "solo" ? 1 : travelers === "partner" ? 2 : travelers === "family" ? 4 : 6,
        preferences: { budget },
      });
      router.push({ pathname: "/planner/[passId]/building", params: { passId } });
    } catch (err) {
      Alert.alert(
        "Couldn't reach planner",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.appBg, paddingTop: insets.top }]}>
      <PaperTexture />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader overline="NEW TRIP · AI PLANNER" title="Where to next?" />

        {/* Hero composer */}
        <View style={[styles.promptBox, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <View style={styles.promptHead}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              ✦ DICTATE YOUR TRIP
            </Text>
            <Stamp label="AI" kind="rect" />
          </View>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={'e.g. "Cherry blossom week in Japan with my partner, slow pace, mid-budget"'}
            placeholderTextColor={t.inkMute}
            multiline
            style={[
              TYPE.body,
              { color: t.ink, minHeight: 96, textAlignVertical: "top" },
            ]}
          />

          {/* Trip type segmented */}
          <View style={styles.fieldGroup}>
            <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 6 }]}>WHO</Text>
            <View style={styles.segRow}>
              {TRAVELERS_OPTS.map((o) => {
                const on = travelers === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setTravelers(o.key); }}
                    style={[
                      styles.segChip,
                      {
                        backgroundColor: on ? t.ink : "transparent",
                        borderColor: on ? t.ink : t.inkHair,
                      },
                    ]}
                  >
                    <Text style={[TYPE.bodyS, { color: on ? "#fff" : t.ink, fontWeight: "500" }]}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Budget tier */}
          <View style={styles.fieldGroup}>
            <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 6 }]}>BUDGET</Text>
            <View style={styles.segRow}>
              {BUDGET_OPTS.map((o) => {
                const on = budget === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setBudget(o.key); }}
                    style={[
                      styles.segChip,
                      {
                        backgroundColor: on ? t.ink : "transparent",
                        borderColor: on ? t.ink : t.inkHair,
                        flex: 1,
                      },
                    ]}
                  >
                    <Text style={[TYPE.bodyS, { color: on ? "#fff" : t.ink, fontWeight: "500" }]}>
                      {o.label}
                    </Text>
                    <Text
                      style={[
                        TYPE.monoXS,
                        { color: on ? "rgba(255,255,255,0.6)" : t.inkMute, marginTop: 1 },
                      ]}
                    >
                      {o.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Dates placeholder chip — proper picker in v1.5 */}
          <Pressable
            onPress={() => Haptics.selectionAsync().catch(() => {})}
            style={[styles.dateChip, { borderColor: t.inkHair, backgroundColor: t.paper }]}
          >
            <Text style={[TYPE.monoXS, { color: t.inkMute }]}>📅 DATES</Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute }]}>Flexible · AI picks the best window</Text>
          </Pressable>

          <PillBtn
            label={busy ? "Planning…" : "✦ Plan with AI"}
            tone="terra"
            fullWidth
            disabled={busy || !prompt.trim()}
            onPress={() => planIt()}
          />
        </View>

        {/* AI capabilities showcase */}
        <View style={styles.capStrip}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, paddingHorizontal: 22, marginBottom: 8 }]}>
            AI WILL HANDLE
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.capRow}
          >
            {CAPABILITIES.map((c) => (
              <View
                key={c.label}
                style={[styles.capChip, { borderColor: t.inkHair, backgroundColor: t.surface }]}
              >
                <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                <Text style={[TYPE.bodyS, { color: t.ink, fontWeight: "500" }]}>{c.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quickstarts */}
        <Section title="Quickstarts">
          <View style={styles.quickGrid}>
            {QUICKSTARTS.map((q) => (
              <Pressable
                key={q.tag}
                onPress={() => planIt(q.prompt)}
                style={({ pressed }) => [
                  styles.quickCard,
                  {
                    borderColor: t.inkHair,
                    backgroundColor: t.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={styles.quickHead}>
                  <Text style={{ fontSize: 26 }}>{q.emoji}</Text>
                  <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                    {q.tag}
                  </Text>
                </View>
                <Text style={[TYPE.body, { color: t.ink, marginTop: 8, fontWeight: "500" }]}>
                  {q.title}
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{q.sub}</Text>
                <Text style={[TYPE.monoXS, { color: t.terra, marginTop: 10, fontWeight: "600" }]}>
                  USE →
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Manual booking with icons */}
        <Section title="Or · book one piece at a time">
          <View style={styles.manualGrid}>
            {MANUAL.map((m) => (
              <Pressable
                key={m.kind}
                onPress={() => Haptics.selectionAsync().catch(() => {})}
                style={({ pressed }) => [
                  styles.manualCell,
                  {
                    borderColor: t.inkHair,
                    backgroundColor: t.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{m.icon}</Text>
                <Text style={[TYPE.body, { color: t.ink, marginTop: 6, fontWeight: "500" }]}>
                  {m.kind}
                </Text>
                <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>
                  {m.count} options
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Footer signature */}
        <Text style={[TYPE.monoXS, { color: t.inkMute, textAlign: "center", marginTop: 24 }]}>
          POWERED BY CLAUDE · NO ADS · NO RESELLER MARKUP
        </Text>
      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  promptBox: {
    marginHorizontal: 22,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  promptHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldGroup: {},
  segRow: { flexDirection: "row", gap: 6 },
  segChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  dateChip: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  capStrip: { marginTop: 18 },
  capRow: { gap: 8, paddingHorizontal: 22, paddingRight: 32 },
  capChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 22,
  },
  quickCard: {
    width: "47.5%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  quickHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 22,
  },
  manualCell: {
    width: "31.5%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
});
