import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  size?: number;
  ring?: boolean;
  /** Override ring color (defaults to terra) */
  ringColor?: string;
  tone?: "paper" | "terra" | "dark";
}

/**
 * Spec's AvatarDot — diagonal striped circle with optional terra ring.
 * Uses individual <Line> elements (not Pattern) for reliable rendering on
 * react-native-web.
 */
export function AvatarDot({ size = 36, ring = false, ringColor, tone = "paper" }: Props) {
  const { t } = useTheme();
  const resolvedRingColor = ringColor ?? t.terra;
  const bg = tone === "terra" ? t.terra : tone === "dark" ? t.ink : t.paper2;
  const stripe =
    tone === "terra"
      ? "rgba(255,255,255,0.22)"
      : tone === "dark"
      ? "rgba(255,255,255,0.10)"
      : "rgba(10,37,64,0.10)";

  const ringWidth = ring ? 1.5 : 0;
  const ringGap = ring ? 2 : 0;
  const inner = size - 2 * (ringWidth + ringGap);

  // Pre-compute diagonal lines (slope -1) that intersect the inner box.
  // Step every 5px → ~10 lines for a 50px avatar.
  const step = Math.max(4, Math.floor(inner / 9));
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let d = -inner; d <= 2 * inner; d += step) {
    lines.push({ x1: d, y1: 0, x2: d + inner, y2: inner });
  }

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: resolvedRingColor,
          padding: ringGap,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          { borderRadius: inner / 2, backgroundColor: bg, width: inner, height: inner },
        ]}
      >
        <Svg width={inner} height={inner}>
          <Rect x={0} y={0} width={inner} height={inner} fill={bg} />
          {lines.map((l, i) => (
            <Line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={stripe}
              strokeWidth={1}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    overflow: "hidden",
  },
});
