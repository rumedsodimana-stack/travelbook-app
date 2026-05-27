import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { Barcode } from "@/components/primitives/Barcode";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { RouteLine } from "@/components/primitives/RouteLine";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { THEMES, type ThemeName } from "@/constants/tokens";
import { useTheme } from "@/hooks/useTheme";

// v1: Stamped only. Wallet + Ticket return in v2 with full primitive sets.
const VISIBLE_THEMES: ThemeName[] = ["stamped"];

const THEME_INFO: Record<
  ThemeName,
  { name: string; tag: string; sub: string; comingSoon?: boolean }
> = {
  stamped: {
    name: "Stamped",
    tag: "PAPER · INK · STAMP",
    sub: "Cream paper, serif headlines, stamp marks. Reads like a passport.",
  },
  wallet: {
    name: "Wallet",
    tag: "NAVY · BARCODE · DENSE",
    sub: "Deep navy ground, barcode strips, dense info. Reads like a wallet card.",
    comingSoon: true,
  },
  ticket: {
    name: "Ticket",
    tag: "BOARDING PASS · PERFORATED",
    sub: "Boarding-pass cards with dashed perforations. Reads like a ticket stub.",
    comingSoon: true,
  },
};

export default function ThemePickerScreen() {
  const { t, name: active, setTheme } = useTheme();
  const router = useRouter();
  const [picked, setPicked] = useState<ThemeName>(active);

  function pick(name: ThemeName) {
    Haptics.selectionAsync().catch(() => {});
    setPicked(name);
  }

  function apply() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTheme(picked);
    router.push("/(onboarding)/first-plan");
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="DOCS" fallback="/(onboarding)/docs" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 140 }}>
        <ScreenHeader overline="STEP 05 OF 06" title="Pick your look." />

        <View style={styles.subheader}>
          <Stamp label="V1 LOOK" kind="rect" rotate={-2} />
          <Text style={[TYPE.bodyS, { color: t.inkMute, flex: 1 }]}>
            Stamped is the v1 aesthetic. Wallet + Ticket arrive with v2.
          </Text>
        </View>

        {VISIBLE_THEMES.map((key) => {
          const info = THEME_INFO[key];
          const on = picked === key;
          const tokens = THEMES[key];
          return (
            <Pressable
              key={key}
              onPress={() => !info.comingSoon && pick(key)}
              disabled={info.comingSoon}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: on ? tokens.terra : t.inkHair,
                  borderWidth: on ? 2 : 1,
                  backgroundColor: t.surface,
                  opacity: info.comingSoon ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {/* Mini-pass preview */}
              <ThemePreview tokens={tokens} themeName={key} />

              <View style={styles.cardMeta}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[TYPE.displayM, { color: t.ink }]}>{info.name}</Text>
                    {info.comingSoon ? (
                      <Stamp label="V2" kind="rect" />
                    ) : on ? (
                      <Stamp label="PICKED" kind="rect" />
                    ) : null}
                  </View>
                  <Text style={[TYPE.monoXS, { color: tokens.terra, marginTop: 2, fontWeight: "700" }]}>
                    {info.tag}
                  </Text>
                  <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
                    {info.sub}
                  </Text>
                </View>
              </View>

              {/* Swatch row */}
              <View style={styles.swatches}>
                <Swatch color={tokens.appBg} label="PAPER" inkColor={t.inkMute} />
                <Swatch color={tokens.ink} label="INK" inkColor={t.inkMute} />
                <Swatch color={tokens.terra} label="TERRA" inkColor={t.inkMute} />
                <Swatch color={tokens.stampRed} label="STAMP" inkColor={t.inkMute} />
              </View>
            </Pressable>
          );
        })}

        {/* v2 sneak peek — non-interactive */}
        <View style={[styles.peekCard, { borderColor: t.inkHair }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
            COMING IN V2
          </Text>
          <Text style={[TYPE.body, { color: t.ink, marginTop: 6, fontWeight: "500" }]}>
            Wallet · Ticket
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 4 }]}>
            Two more aesthetics — navy barcode and perforated boarding-pass. Switch any time from Account → Appearance once they land.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.appBg }]}>
        <PillBtn label={`Apply ${THEME_INFO[picked].name}`} tone="ink" fullWidth onPress={apply} />
      </View>
    </SafeAreaView>
  );
}

function ThemePreview({ tokens, themeName }: { tokens: typeof THEMES[ThemeName]; themeName: ThemeName }) {
  const isStamped = themeName === "stamped";
  return (
    <View
      style={[
        styles.preview,
        {
          backgroundColor: isStamped ? tokens.ink : tokens.ink,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.previewInner, { borderColor: "rgba(244,237,228,0.18)" }]}
      />
      <View style={styles.previewTop}>
        <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>SAMPLE PASS</Text>
        <View style={[styles.dot, { backgroundColor: tokens.terra }]} />
      </View>
      <Text
        style={[
          TYPE.displayM,
          { color: "#fff", marginTop: 8, fontSize: 22 },
        ]}
      >
        Cherry blossom Japan
      </Text>
      <View style={{ marginTop: 8, marginBottom: 8 }}>
        <RouteLine from="JFK" to="HND" dark muted />
      </View>
      <Barcode seed={`tb-${themeName}`} height={16} dark />
    </View>
  );
}

function Swatch({ color, label, inkColor }: { color: string; label: string; inkColor: string }) {
  return (
    <View style={styles.swatchCol}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color, borderColor: "rgba(10,37,64,0.1)" },
        ]}
      />
      <Text style={[TYPE.monoXS, { color: inkColor, marginTop: 4, fontSize: 9 }]}>{label}</Text>
    </View>
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
  card: { borderRadius: 14, padding: 14, marginBottom: 12 },
  preview: {
    borderRadius: 10,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  previewInner: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  previewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardMeta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatches: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  peekCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  swatchCol: { alignItems: "center" },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
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
