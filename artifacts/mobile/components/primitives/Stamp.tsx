import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  kind?: "circle" | "rect";
  rotate?: number;
}

export function Stamp({ label, kind = "circle", rotate = 0 }: Props) {
  const { t } = useTheme();
  const color = t.stampRed;
  const baseStyle = kind === "circle" ? styles.circle : styles.rect;
  return (
    <View
      style={[
        baseStyle,
        {
          borderColor: color,
          transform: [{ rotate: `${rotate}deg` }],
          opacity: 0.85,
        },
      ]}
    >
      <Text
        style={[
          TYPE.monoXS,
          {
            color,
            fontWeight: "600",
            letterSpacing: 0.06 * 9,
            fontSize: kind === "circle" ? 9 : 9,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 36,
    minHeight: 36,
    aspectRatio: 1,
  },
  rect: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
