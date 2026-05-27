import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Barcode } from "@/components/primitives/Barcode";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { RouteLine } from "@/components/primitives/RouteLine";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { THEMES, type ThemeName } from "@/constants/tokens";
import { useTheme } from "@/hooks/useTheme";

// v1: Stamped only. Wallet + Ticket reappear in v2.
const VISIBLE: ThemeName[] = ["stamped"];

const INFO: Record<
  ThemeName,
  { name: string; tag: string; sub: string; v2?: boolean }
> = {
  stamped: { name: "Stamped", tag: "PAPER · INK", sub: "Cream paper. Default look." },
  wallet: {
    name: "Wallet",
    tag: "NAVY · BARCODE",
    sub: "Deep navy. Coming in v2.",
    v2: true,
  },
  ticket: {
    name: "Ticket",
    tag: "BOARDING PASS",
    sub: "Perforated cards. Coming in v2.",
    v2: true,
  },
};

export default function AppearanceScreen() {
  const { t, name, setTheme } = useTheme();
  const router = useRouter();

  function pick(theme: ThemeName) {
    Haptics.selectionAsync().catch(() => {});
    setTheme(theme);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← BACK</Text>
        </Pressable>
      </View>

      <ScreenHeader overline="ACCOUNT · APPEARANCE" title="Theme." />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}>
        <View style={styles.subheader}>
          <Stamp label="ACTIVE" kind="rect" rotate={-2} />
          <Text style={[TYPE.bodyS, { color: t.inkMute, flex: 1 }]}>
            Right now you're on{" "}
            <Text style={{ color: t.ink, fontWeight: "600" }}>{INFO[name].name}</Text>. Switch any
            time — your data is unchanged.
          </Text>
        </View>

        {VISIBLE.map((key) => {
          const info = INFO[key];
          const tokens = THEMES[key];
          const on = name === key;
          return (
            <Pressable
              key={key}
              onPress={() => !info.v2 && pick(key)}
              disabled={info.v2}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: on ? tokens.terra : t.inkHair,
                  borderWidth: on ? 2 : 1,
                  backgroundColor: t.surface,
                  opacity: info.v2 ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemePreview tokens={tokens} themeName={key} />
              <View style={styles.cardFoot}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[TYPE.displayM, { color: t.ink }]}>{info.name}</Text>
                    {info.v2 ? (
                      <Stamp label="V2" kind="rect" />
                    ) : on ? (
                      <Stamp label="ACTIVE" kind="rect" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      TYPE.monoXS,
                      { color: tokens.terra, marginTop: 2, fontWeight: "700" },
                    ]}
                  >
                    {info.tag}
                  </Text>
                  <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>{info.sub}</Text>
                </View>
              </View>
              <View style={styles.swatches}>
                {[tokens.appBg, tokens.ink, tokens.terra, tokens.stampRed].map((c, i) => (
                  <View
                    key={i}
                    style={[styles.swatch, { backgroundColor: c, borderColor: "rgba(10,37,64,0.1)" }]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}

        <View style={[styles.note, { borderColor: t.inkHair }]}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
            COMING IN V2
          </Text>
          <Text style={[TYPE.body, { color: t.ink, marginTop: 6, fontWeight: "500" }]}>
            Wallet · Ticket
          </Text>
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
            Themes only change typography, color, and card decoration. Trips, passes, buddies, and
            documents stay identical across all three.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.appBg }]}>
        <PillBtn label="Done" tone="ink" fullWidth onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function ThemePreview({ tokens, themeName }: { tokens: typeof THEMES[ThemeName]; themeName: ThemeName }) {
  return (
    <View style={[styles.preview, { backgroundColor: tokens.ink }]}>
      <View
        pointerEvents="none"
        style={[styles.previewInner, { borderColor: "rgba(244,237,228,0.18)" }]}
      />
      <View style={styles.previewTop}>
        <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>SAMPLE PASS</Text>
        <View style={[styles.dot, { backgroundColor: tokens.terra }]} />
      </View>
      <Text style={[TYPE.displayM, { color: "#fff", marginTop: 8, fontSize: 22 }]}>
        Cherry blossom Japan
      </Text>
      <View style={{ marginTop: 8, marginBottom: 8 }}>
        <RouteLine from="JFK" to="HND" dark muted />
      </View>
      <Barcode seed={`appearance-${themeName}`} height={16} dark />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: { paddingTop: 8, paddingHorizontal: 22 },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
    paddingBottom: 14,
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
  cardFoot: {
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
  swatches: { flexDirection: "row", gap: 8, marginTop: 14 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
  },
  note: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
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
