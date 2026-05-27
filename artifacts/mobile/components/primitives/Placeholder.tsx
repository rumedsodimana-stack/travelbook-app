import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

type Tone = "paper" | "dark" | "terra";

interface Props {
  caption?: string;
  tone?: Tone;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

/**
 * Spec's <Ph> — striped placeholder image with a mono-caps caption.
 * Diagonal stripes drawn as individual <Line> elements so they render reliably
 * on react-native-web (Pattern fill is unreliable in that runtime).
 */
export function Placeholder({
  caption,
  tone = "paper",
  width,
  height = 120,
  style,
}: Props) {
  const { t } = useTheme();

  const bg = tone === "dark" ? "rgba(10,37,64,0.85)" : tone === "terra" ? t.terra : t.paper2;
  const stripe =
    tone === "dark"
      ? "rgba(255,255,255,0.08)"
      : tone === "terra"
      ? "rgba(255,255,255,0.18)"
      : "rgba(10,37,64,0.08)";
  const captionColor =
    tone === "dark" ? "rgba(244,237,228,0.7)" : tone === "terra" ? "rgba(255,255,255,0.85)" : t.inkMute;

  const [box, setBox] = React.useState({ w: typeof width === "number" ? width : 0, h: height });

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  if (box.w > 0 && box.h > 0) {
    const step = 9;
    const maxDim = box.w + box.h;
    for (let d = -box.h; d <= maxDim; d += step) {
      lines.push({ x1: d, y1: 0, x2: d - box.h, y2: box.h });
    }
  }

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: bg, width, height, alignSelf: width == null ? "stretch" : undefined },
        style,
      ]}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (Math.abs(w - box.w) > 1 || Math.abs(h - box.h) > 1) {
          setBox({ w, h });
        }
      }}
    >
      {box.w > 0 ? (
        <Svg
          width={box.w}
          height={box.h}
          style={StyleSheet.absoluteFill}
        >
          <Rect x={0} y={0} width={box.w} height={box.h} fill={bg} />
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
      ) : null}
      {caption ? (
        <Text style={[TYPE.monoXS, styles.caption, { color: captionColor }]}>
          {caption.toLowerCase()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  caption: {
    position: "absolute",
    left: 8,
    bottom: 8,
    textTransform: "lowercase",
  },
});
