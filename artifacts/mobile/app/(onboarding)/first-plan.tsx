import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

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
    emoji: "🌅",
  },
];

export default function FirstPlanScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { setOnboarded } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function finishOnboarding(initialPrompt?: string) {
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await setOnboarded(true);
    if (initialPrompt) {
      router.replace({
        pathname: "/(tabs)/planner",
        params: { prompt: initialPrompt },
      });
    } else {
      router.replace("/(tabs)/planner");
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="THEME" fallback="/(onboarding)/theme" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}>
        <ScreenHeader overline="ONBOARDING · 06 OF 06" title="Your first trip." />

        <View style={styles.subheader}>
          <Stamp label="LAST STEP" kind="rect" rotate={-3} />
          <Text style={[TYPE.bodyS, { color: t.inkMute, flex: 1 }]}>
            Drop a sentence or pick a quickstart — the AI handles the rest.
          </Text>
        </View>

        {/* Prompt composer */}
        <View style={[styles.promptBox, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <Text style={[TYPE.monoXS, { color: t.terra, marginBottom: 8, fontWeight: "600" }]}>
            ✦ DICTATE YOUR TRIP
          </Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder='e.g. "Cherry blossom week in Japan, partner, slow pace, mid-budget"'
            placeholderTextColor={t.inkMute}
            multiline
            style={[
              TYPE.body,
              { color: t.ink, minHeight: 100, textAlignVertical: "top" },
            ]}
          />
        </View>

        <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 22, marginBottom: 10, fontWeight: "600" }]}>
          OR PICK A QUICKSTART
        </Text>

        <View style={styles.quickGrid}>
          {QUICKSTARTS.map((q) => (
            <Pressable
              key={q.tag}
              onPress={() => finishOnboarding(q.prompt)}
              disabled={busy}
              style={({ pressed }) => [
                styles.quickCard,
                {
                  borderColor: t.inkHair,
                  backgroundColor: t.surface,
                  opacity: busy ? 0.5 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.quickHead}>
                <Text style={{ fontSize: 28 }}>{q.emoji}</Text>
                <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                  {q.tag}
                </Text>
              </View>
              <Text style={[TYPE.body, { color: t.ink, marginTop: 10, fontWeight: "500" }]}>
                {q.title}
              </Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{q.sub}</Text>
              <Text style={[TYPE.monoXS, { color: t.terra, marginTop: 12, fontWeight: "600" }]}>
                USE →
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Skip option */}
        <Pressable
          onPress={() => finishOnboarding()}
          disabled={busy}
          style={styles.skipRow}
        >
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
            OR SKIP — EXPLORE FIRST
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <PillBtn
          label={busy ? "Setting up…" : prompt.trim() ? "✦ Plan it" : "Skip · explore"}
          tone={prompt.trim() ? "terra" : "cream"}
          fullWidth
          disabled={busy}
          onPress={() => finishOnboarding(prompt.trim() || undefined)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  promptBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  quickGrid: { gap: 10 },
  quickCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  quickHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipRow: {
    marginTop: 22,
    alignItems: "center",
    paddingVertical: 14,
  },
  footer: { paddingHorizontal: 22, paddingBottom: 14 },
});
