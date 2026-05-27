import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  from: string;
  to: string;
  glyph?: string;
}

export function RouteLine({ from, to, glyph = "✈" }: Props) {
  const { t } = useTheme();
  const color = t.ink;
  const mute = t.inkMute;
  return (
    <View style={styles.row}>
      <Text style={[TYPE.monoS, { color, letterSpacing: 0.08 * 11 }]}>{from}</Text>
      <Text style={[TYPE.monoS, { color: mute, marginHorizontal: 6 }]}>· — —</Text>
      <Text style={[TYPE.body, { color }]}>{glyph}</Text>
      <Text style={[TYPE.monoS, { color: mute, marginHorizontal: 6 }]}>— — ·</Text>
      <Text style={[TYPE.monoS, { color, letterSpacing: 0.08 * 11 }]}>{to}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
