import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

const DOC_TYPES = [
  { icon: "🪪", label: "Passport", sub: "Speeds visa forms · auto-fills entry cards" },
  { icon: "🆔", label: "ID card", sub: "Domestic flights · car rentals" },
  { icon: "💉", label: "Vaccination", sub: "Yellow fever · health declarations" },
  { icon: "🚗", label: "Driver license", sub: "Renting cars abroad" },
];

const TRUST = [
  { label: "ENCRYPTED AT REST", sub: "AES-256 with per-row data keys" },
  { label: "KMS-WRAPPED KEYS", sub: "Hardware-backed envelope encryption" },
  { label: "NEVER LOGGED IN PLAIN", sub: "Number masking in every log path" },
  { label: "DELETE = GONE", sub: "Soft-delete window 7 days then crypto-shred" },
];

export default function DocsScreen() {
  const { t } = useTheme();
  const router = useRouter();

  function next() {
    Haptics.selectionAsync().catch(() => {});
    router.push("/(onboarding)/theme");
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="PREFS" fallback="/(onboarding)/prefs" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 140 }}>
        <ScreenHeader overline="STEP 04 OF 06" title="Your documents." />

        {/* Hero pitch */}
        <View style={[styles.heroCard, { borderColor: t.terra, backgroundColor: t.surface }]}>
          <View style={styles.heroHead}>
            <Stamp label="VAULT" kind="circle" rotate={-4} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                ENCRYPTED · YOUR EYES ONLY
              </Text>
              <Text style={[TYPE.displayM, { color: t.ink, marginTop: 4 }]}>
                Visa forms that fill themselves.
              </Text>
            </View>
          </View>
          <Text style={[TYPE.body, { color: t.inkMute, marginTop: 10 }]}>
            We hold your travel docs the way a passport holder does — flat, dry, ready, never on display.
          </Text>
        </View>

        {/* What we can hold */}
        <Text
          style={[
            TYPE.monoXS,
            { color: t.inkMute, marginTop: 22, marginBottom: 10, fontWeight: "700" },
          ]}
        >
          DOCS WE CAN HOLD
        </Text>
        <View style={[styles.listCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          {DOC_TYPES.map((d, i) => (
            <View
              key={d.label}
              style={[
                styles.docRow,
                {
                  borderBottomColor: t.inkHair,
                  borderBottomWidth: i === DOC_TYPES.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{d.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{d.label}</Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{d.sub}</Text>
              </View>
              <Text style={[TYPE.monoXS, { color: t.inkMute }]}>LATER</Text>
            </View>
          ))}
        </View>

        {/* Trust card */}
        <Text
          style={[
            TYPE.monoXS,
            { color: t.inkMute, marginTop: 22, marginBottom: 10, fontWeight: "700" },
          ]}
        >
          HOW WE PROTECT THEM
        </Text>
        <View style={[styles.trustCard, { borderColor: t.terra }]}>
          {TRUST.map((row) => (
            <View key={row.label} style={styles.trustRow}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700", width: 22 }]}>
                ✓
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.monoXS, { color: t.ink, fontWeight: "700" }]}>
                  {row.label}
                </Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{row.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Manual entry note */}
        <Pressable
          onPress={next}
          style={({ pressed }) => [
            styles.linkRow,
            { borderColor: t.inkHair, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>
              Add manually (later)
            </Text>
            <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
              Scan + OCR ships v1.5. For now, type when you need to.
            </Text>
          </View>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>→</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.appBg }]}>
        <PillBtn label="Continue · add later" tone="terra" fullWidth onPress={next} />
        <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 8, textAlign: "center" }]}>
          ACCOUNT → DOCUMENTS · ANY TIME
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
  },
  heroHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  listCard: { borderWidth: 1, borderRadius: 14 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  trustCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  linkRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
  },
});
