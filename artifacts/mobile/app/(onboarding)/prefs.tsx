import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

type Pace = "slow" | "steady" | "packed";
type Budget = "lean" | "mid" | "splurge";
type Mornings = "sleep_in" | "coffee" | "early";
type Diet = "any" | "pescatarian" | "vegetarian" | "vegan";

const PACE: { value: Pace; label: string; sub: string; icon: string }[] = [
  { value: "slow", label: "Slow", sub: "Two anchors a day", icon: "🪷" },
  { value: "steady", label: "Steady", sub: "Three to four", icon: "🚶" },
  { value: "packed", label: "Packed", sub: "Five plus, no nap", icon: "⚡" },
];
const BUDGET: { value: Budget; label: string; sub: string; icon: string }[] = [
  { value: "lean", label: "Lean", sub: "$60–120 / day", icon: "🪙" },
  { value: "mid", label: "Mid", sub: "$120–280 / day", icon: "💳" },
  { value: "splurge", label: "Splurge", sub: "$280+ / day", icon: "✨" },
];
const MORNINGS: { value: Mornings; label: string; sub: string; icon: string }[] = [
  { value: "sleep_in", label: "Sleep in", sub: "Nothing before 10", icon: "🌙" },
  { value: "coffee", label: "Coffee first", sub: "Out by 9:30", icon: "☕" },
  { value: "early", label: "Early bird", sub: "Sunrise hikes", icon: "🌅" },
];
const DIET: { value: Diet; label: string; icon: string }[] = [
  { value: "any", label: "Any", icon: "🍽" },
  { value: "pescatarian", label: "Pescatarian", icon: "🐟" },
  { value: "vegetarian", label: "Vegetarian", icon: "🥗" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
];
const INTERESTS = [
  { id: "surf", icon: "🏄" },
  { id: "culture", icon: "🏛" },
  { id: "food", icon: "🍜" },
  { id: "wellness", icon: "🧘" },
  { id: "slow_living", icon: "🌿" },
  { id: "adventure", icon: "🥾" },
  { id: "art", icon: "🎨" },
  { id: "nightlife", icon: "🪩" },
  { id: "ocean", icon: "🌊" },
];

export default function PrefsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [pace, setPace] = useState<Pace>("steady");
  const [budget, setBudget] = useState<Budget>("mid");
  const [mornings, setMornings] = useState<Mornings>("coffee");
  const [diet, setDiet] = useState<Diet>("any");
  const [interests, setInterests] = useState<string[]>(["culture", "food"]);

  function pick<T>(setter: (v: T) => void, v: T) {
    setter(v);
    Haptics.selectionAsync().catch(() => {});
  }

  function toggleInterest(i: string) {
    Haptics.selectionAsync().catch(() => {});
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  }

  const preview = useMemo(() => {
    const interestStr = interests.length
      ? interests.slice(0, 3).map((i) => i.replace("_", " ")).join(" · ")
      : "open to anything";
    return `${pace} pace · ${budget}-budget · ${mornings.replace("_", " ")} · ${interestStr}`;
  }, [pace, budget, mornings, interests]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="SIGN IN" fallback="/(onboarding)/signup" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 140 }}>
        <ScreenHeader overline="STEP 03 OF 06" title="How do you travel?" />

        <View style={styles.subheader}>
          <Stamp label="2 MIN" kind="rect" rotate={-2} />
          <Text style={[TYPE.bodyS, { color: t.inkMute, flex: 1 }]}>
            Hi {user?.name?.split(" ")[0] ?? "there"} — the AI uses these to keep every plan in your voice.
          </Text>
        </View>

        {/* Live preview chip */}
        <View style={[styles.previewCard, { borderColor: t.terra, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700", marginBottom: 6 }]}>
            ✦ YOUR DEFAULTS
          </Text>
          <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{preview}</Text>
        </View>

        <Section label="PACE" hint="How full a day feels right">
          {PACE.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              sub={opt.sub}
              active={pace === opt.value}
              onPress={() => pick(setPace, opt.value)}
            />
          ))}
        </Section>

        <Section label="BUDGET" hint="Per person, per day (we'll respect it)">
          {BUDGET.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              sub={opt.sub}
              active={budget === opt.value}
              onPress={() => pick(setBudget, opt.value)}
            />
          ))}
        </Section>

        <Section label="MORNINGS" hint="When the day starts">
          {MORNINGS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              sub={opt.sub}
              active={mornings === opt.value}
              onPress={() => pick(setMornings, opt.value)}
            />
          ))}
        </Section>

        <Section label="DIET">
          <View style={styles.chipRow}>
            {DIET.map((opt) => {
              const on = diet === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => pick(setDiet, opt.value)}
                  style={({ pressed }) => [
                    styles.dietChip,
                    {
                      borderColor: on ? t.ink : t.inkHair,
                      backgroundColor: on ? t.ink : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                  <Text
                    style={[
                      TYPE.bodyS,
                      { color: on ? "#fff" : t.ink, fontWeight: on ? "600" : "500" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section
          label={`INTERESTS · ${interests.length} PICKED`}
          hint="Tap to toggle — pick as many as you like"
        >
          <View style={styles.chipRow}>
            {INTERESTS.map((i) => {
              const on = interests.includes(i.id);
              return (
                <Pressable
                  key={i.id}
                  onPress={() => toggleInterest(i.id)}
                  style={({ pressed }) => [
                    styles.interestChip,
                    {
                      borderColor: on ? t.terra : t.inkHair,
                      backgroundColor: on ? t.terra : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{i.icon}</Text>
                  <Text
                    style={[
                      TYPE.bodyS,
                      {
                        color: on ? "#fff" : t.ink,
                        fontWeight: on ? "600" : "500",
                        textTransform: "capitalize",
                      },
                    ]}
                  >
                    {i.id.replace("_", " ")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Text style={[TYPE.monoXS, { color: t.inkMute, textAlign: "center", marginTop: 8 }]}>
          YOU CAN TUNE ANY OF THIS LATER · ACCOUNT → PREFERENCES
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <PillBtn
          label="Continue"
          tone="terra"
          fullWidth
          onPress={() => router.push("/(onboarding)/docs")}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>{label}</Text>
      {hint ? (
        <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2, marginBottom: 10 }]}>
          {hint}
        </Text>
      ) : (
        <View style={{ height: 10 }} />
      )}
      {children}
    </View>
  );
}

function OptionCard({
  icon,
  label,
  sub,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        {
          borderColor: active ? t.terra : t.inkHair,
          backgroundColor: active ? t.surface : "transparent",
          borderWidth: active ? 1.5 : 1,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.body, { color: t.ink, fontWeight: active ? "600" : "500" }]}>
          {label}
        </Text>
        <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 1 }]}>{sub}</Text>
      </View>
      {active ? (
        <View style={[styles.activeDot, { backgroundColor: t.terra }]}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✓</Text>
        </View>
      ) : (
        <View style={[styles.activeDot, { borderColor: t.inkHair, borderWidth: 1 }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  previewCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    minHeight: 44,
  },
  activeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dietChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 12,
  },
});
