import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

type Tone = "ink" | "terra" | "mute";

export function TimeChip({ label, tone = "ink" }: { label: string; tone?: Tone }) {
  const { t } = useTheme();
  const color = tone === "terra" ? t.terra : tone === "mute" ? t.inkMute : t.ink;
  const border = tone === "terra" ? t.terra : t.inkHair;
  return (
    <View style={[styles.chip, { borderColor: border }]}>
      <Text style={[TYPE.monoS, { color, letterSpacing: 0.08 * 11 }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
});
