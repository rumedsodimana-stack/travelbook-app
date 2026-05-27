import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

interface BackBarProps {
  label?: string;
  fallback?: Href;
  right?: React.ReactNode;
}

export function BackBar({ label = "BACK", fallback, right }: BackBarProps) {
  const { t } = useTheme();
  const router = useRouter();

  function go() {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else if (fallback) {
      router.replace(fallback);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={go} hitSlop={16} style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.5 : 1 }]}>
        <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "700" }]}>← {label.toUpperCase()}</Text>
      </Pressable>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 22,
    paddingBottom: 4,
    minHeight: 36,
  },
  btn: {
    paddingVertical: 6,
    paddingRight: 12,
    minHeight: 32,
    justifyContent: "center",
  },
});
