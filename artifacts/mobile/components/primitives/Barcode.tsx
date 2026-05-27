import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  seed?: string;
  height?: number;
  dark?: boolean;
}

// Deterministic pseudo-random bar widths so the same seed reproduces the same barcode.
function makeBars(seed: string, count = 38): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) | 0;
    bars.push(((h >>> 0) % 3) + 1);
  }
  return bars;
}

export function Barcode({ seed = "TB", height = 32, dark = false }: Props) {
  const { t } = useTheme();
  const bars = useMemo(() => makeBars(seed), [seed]);
  const color = dark ? "#ffffff" : t.ink;

  return (
    <View style={[styles.row, { height }]}>
      {bars.map((w, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: "100%",
            marginRight: 1,
            backgroundColor: color,
            opacity: i % 4 === 0 ? 0.9 : 0.75,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
});
