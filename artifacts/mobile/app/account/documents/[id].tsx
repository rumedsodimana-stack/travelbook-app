import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { Barcode } from "@/components/primitives/Barcode";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

const DETAIL_ROWS = [
  { label: "TYPE", value: "Passport", mono: false },
  { label: "ISSUING COUNTRY", value: "United States 🇺🇸", mono: false },
  { label: "NUMBER", value: "•••••• 2987", mono: true, masked: true },
  { label: "FULL NAME", value: "Maya R. Sodimana", mono: false },
  { label: "DATE OF BIRTH", value: "1996-03-14", mono: true },
  { label: "ISSUED", value: "2019-08-14", mono: true },
  { label: "EXPIRES", value: "2029-08-14", mono: true, highlight: "3Y 2M LEFT" },
];

const USED_BY = [
  { trip: "Cherry blossom Japan", role: "Visa form pre-fill · entry card" },
  { trip: "Iceland · Northern Lights", role: "ESTA renewal reminder" },
];

export default function DocumentDetail() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const actions: ActionSheetItem[] = [
    {
      label: "Edit (coming v1.5)",
      onPress: () => {},
    },
    {
      label: "Remove document",
      destructive: true,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
            ← DOCUMENTS
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setSheetOpen(true);
          }}
        >
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>···</Text>
        </Pressable>
      </View>

      <ScreenHeader
        overline={`DOC · ${(params.id ?? "passport").slice(0, 12).toUpperCase()}`}
        title="Passport."
      />

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 80 }}>
        {/* Vault hero — passport card style */}
        <View style={[styles.vault, { backgroundColor: t.ink }]}>
          <View
            pointerEvents="none"
            style={[styles.vaultInner, { borderColor: "rgba(244,237,228,0.18)" }]}
          />
          <View style={styles.vaultTop}>
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
              TRAVELBOOK · VAULT
            </Text>
            <View style={styles.lockBadge}>
              <Text style={{ fontSize: 11 }}>🔒</Text>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                AES-256
              </Text>
            </View>
          </View>
          <Text style={[TYPE.displayM, { color: "#fff", marginTop: 14, fontSize: 26 }]}>
            Passport
          </Text>
          <Text style={[TYPE.body, { color: "rgba(244,237,228,0.7)", marginTop: 4 }]}>
            United States · expires 2029-08-14
          </Text>
          <View style={{ marginTop: 18 }}>
            <Barcode seed={`doc-${params.id ?? "x"}`} height={22} dark />
          </View>
        </View>

        {/* Detail rows */}
        <Text
          style={[
            TYPE.monoXS,
            { color: t.inkMute, marginTop: 22, marginBottom: 10, fontWeight: "700" },
          ]}
        >
          DETAILS · TAP NUMBER TO REVEAL
        </Text>
        <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          {DETAIL_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.row,
                {
                  borderBottomColor: t.inkHair,
                  borderBottomWidth: i === DETAIL_ROWS.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>
                {row.label}
              </Text>
              <View style={styles.rowVal}>
                <Text
                  style={[
                    row.mono ? TYPE.monoS : TYPE.body,
                    { color: t.ink, fontWeight: "500" },
                  ]}
                >
                  {row.value}
                </Text>
                {row.highlight ? (
                  <Text
                    style={[
                      TYPE.monoXS,
                      { color: t.terra, marginTop: 2, fontWeight: "700" },
                    ]}
                  >
                    {row.highlight}
                  </Text>
                ) : null}
                {row.masked ? (
                  <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>
                    TAP TO REVEAL
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Used by */}
        <Text
          style={[
            TYPE.monoXS,
            { color: t.inkMute, marginTop: 22, marginBottom: 10, fontWeight: "700" },
          ]}
        >
          USED BY
        </Text>
        <View style={[styles.card, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          {USED_BY.map((u, i) => (
            <View
              key={u.trip}
              style={[
                styles.usedRow,
                {
                  borderBottomColor: t.inkHair,
                  borderBottomWidth: i === USED_BY.length - 1 ? 0 : 1,
                },
              ]}
            >
              <View style={[styles.bullet, { backgroundColor: t.terra }]} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{u.trip}</Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{u.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Security trail */}
        <View style={[styles.trail, { borderColor: t.terra }]}>
          <View style={styles.trailHead}>
            <Stamp label="LOG" kind="rect" />
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
              SECURITY TRAIL
            </Text>
          </View>
          <TrailRow when="Today · 10:14" what="Viewed (this session)" />
          <TrailRow when="2026-04-12" what="Used for Japan visa form" />
          <TrailRow when="2026-02-03" what="Added to vault · encrypted" last />
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 10 }]}>
            NUMBERS NEVER LOGGED IN PLAIN · KEY ROTATIONS EVERY 90 DAYS
          </Text>
        </View>

        {/* Actions */}
        <View style={{ marginTop: 22, gap: 10 }}>
          <PillBtn label="Edit details" tone="cream" fullWidth disabled onPress={() => {}} />
          <PillBtn label="Remove from vault" tone="cream" fullWidth disabled onPress={() => {}} />
          <Text
            style={[
              TYPE.monoXS,
              { color: t.inkMute, textAlign: "center", marginTop: 4 },
            ]}
          >
            EDIT + REMOVE ARRIVE V1.5 · SOFT-DELETE WINDOW 7 DAYS
          </Text>
        </View>
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        title="Document actions"
        items={actions}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function TrailRow({ when, what, last }: { when: string; what: string; last?: boolean }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.trailRow,
        { borderBottomColor: t.inkHair, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Text style={[TYPE.monoXS, { color: t.inkMute, width: 110 }]}>{when}</Text>
      <Text style={[TYPE.bodyS, { color: t.ink, flex: 1 }]}>{what}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 22,
  },
  vault: {
    borderRadius: 14,
    padding: 22,
    position: "relative",
    overflow: "hidden",
  },
  vaultInner: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  vaultTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  card: { borderWidth: 1, borderRadius: 14 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 16,
  },
  rowVal: { alignItems: "flex-end", flex: 1 },
  usedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  trail: {
    marginTop: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  trailHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  trailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
});
