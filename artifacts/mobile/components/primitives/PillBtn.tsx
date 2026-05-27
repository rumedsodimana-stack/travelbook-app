import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

type Tone = "ink" | "terra" | "ghost" | "cream";

interface Props {
  label: string;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  style?: ViewStyle;
}

export function PillBtn({
  label,
  onPress,
  tone = "ink",
  disabled = false,
  fullWidth = false,
  leading,
  style,
}: Props) {
  const { t } = useTheme();

  const tones: Record<Tone, { bg: string; fg: string; border?: string }> = {
    ink: { bg: t.ink, fg: "#ffffff" },
    terra: { bg: t.terra, fg: "#ffffff" },
    ghost: { bg: "transparent", fg: t.ink, border: t.inkSoft },
    cream: { bg: t.paperLight, fg: t.ink, border: t.inkHair },
  };
  const c = tones[tone];

  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: c.bg,
          borderColor: c.border ?? "transparent",
          borderWidth: c.border ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <Text style={[TYPE.body, { color: c.fg, fontWeight: "500" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    minHeight: 44,
  },
  leading: {
    marginRight: 8,
  },
});
