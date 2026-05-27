import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Barcode } from "@/components/primitives/Barcode";
import { LiveDot } from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

const STEPS = [
  { n: "01", label: "Sign in", sub: "Apple, Google, or email" },
  { n: "02", label: "Tell us how you travel", sub: "Pace, budget, mornings, diet" },
  { n: "03", label: "Plan your first Pass", sub: "AI assembles flights, stays, activities" },
];

const VALUE_PILLS = [
  { icon: "✦", label: "AI Planner" },
  { icon: "🪪", label: "One Pass" },
  { icon: "🤝", label: "Buddies" },
  { icon: "📖", label: "Memory Book" },
];

export default function WelcomeScreen() {
  const { t } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}>
        <View style={styles.brandRow}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
            TRAVELBOOK · EST 2026
          </Text>
          <Stamp label="V1" kind="rect" />
        </View>

        {/* Hero passport-card */}
        <View style={[styles.passport, { backgroundColor: t.ink }]}>
          <View pointerEvents="none" style={styles.passportInner} />
          <View style={styles.passportTop}>
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
              SAMPLE PASS
            </Text>
            <View style={styles.liveBadge}>
              <LiveDot color={t.terra} size={6} />
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                YOURS IN 3 STEPS
              </Text>
            </View>
          </View>
          <Text style={[TYPE.displayXL, { color: "#fff", marginTop: 14, fontSize: 34 }]}>
            Every trip is a pass.
          </Text>
          <Text style={[TYPE.body, { color: "rgba(244,237,228,0.7)", marginTop: 10 }]}>
            One time-aware document for every flight, stay, activity and visa. Share it to find travel buddies.
          </Text>
          <View style={{ marginTop: 18 }}>
            <Barcode seed="TB-WELCOME" height={22} dark />
          </View>
        </View>

        {/* Value pills strip */}
        <View style={styles.valueRow}>
          {VALUE_PILLS.map((v) => (
            <View key={v.label} style={[styles.valuePill, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
              <Text style={{ fontSize: 14 }}>{v.icon}</Text>
              <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "600" }]}>
                {v.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.stepsBlock}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 10, fontWeight: "600" }]}>
            HOW IT WORKS
          </Text>
          {STEPS.map((s, i) => (
            <View key={s.n} style={[styles.stepRow, { borderBottomColor: t.inkHair, borderBottomWidth: i === STEPS.length - 1 ? 0 : StyleSheet.hairlineWidth }]}>
              <Text style={[TYPE.displayM, { color: t.terra, width: 36, fontWeight: "600" }]}>
                {s.n}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{s.label}</Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{s.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Privacy reassurance */}
        <View style={[styles.privacy, { borderColor: t.inkHair }]}>
          <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
            ✓ ENCRYPTED · NEVER SOLD · NO ADS
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
            Passports and bookings are encrypted at rest. We don't sell data and we don't run ads.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PillBtn
          label="Begin"
          tone="ink"
          fullWidth
          onPress={() => router.push("/(onboarding)/signup")}
        />
        <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 10, textAlign: "center" }]}>
          BY CONTINUING YOU AGREE TO THE TERMS · POWERED BY CLAUDE
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 14,
  },
  passport: {
    borderRadius: 14,
    padding: 22,
    position: "relative",
    overflow: "hidden",
  },
  passportInner: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  passportTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  valueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  valuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepsBlock: { marginTop: 22 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  privacy: {
    marginTop: 22,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  footer: { paddingHorizontal: 22, paddingBottom: 14 },
});
