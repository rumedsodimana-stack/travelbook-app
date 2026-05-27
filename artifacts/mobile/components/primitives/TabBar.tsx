import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { TabIcon, type TabIconKind } from "./TabIcon";

interface TabDef {
  id: string;
  label: string;
  icon: TabIconKind;
  route: string;
}

const TABS: TabDef[] = [
  { id: "home", label: "Home", icon: "home", route: "/(tabs)" },
  { id: "explore", label: "Explore", icon: "compass", route: "/(tabs)/explore" },
  { id: "planner", label: "Plan", icon: "sparkle", route: "/(tabs)/planner" },
  { id: "pass", label: "Pass", icon: "pass", route: "/(tabs)/pass" },
  { id: "account", label: "You", icon: "user", route: "/(tabs)/account" },
];

function isActive(pathname: string, route: string) {
  if (route === "/(tabs)") {
    return pathname === "/" || pathname === "/(tabs)" || pathname === "/index";
  }
  const slug = route.replace("/(tabs)/", "/");
  return pathname === slug || pathname.startsWith(slug + "/");
}

export function TabBar() {
  const { t, name } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = name === "wallet";
  const isIOS = Platform.OS === "ios";

  const activeColor = isDark ? "#ffffff" : t.ink;
  const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : t.inkMute;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : t.hairStrong;
  const fallbackBg = isDark ? "rgba(10, 37, 64, 0.92)" : "rgba(252, 250, 246, 0.85)";

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + 8,
          borderTopColor: borderColor,
          backgroundColor: isIOS ? "transparent" : fallbackBg,
        },
      ]}
    >
      {isIOS && (
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.route);
        const color = active ? activeColor : inactiveColor;
        return (
          <Pressable
            key={tab.id}
            onPress={() => router.push(tab.route as never)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <TabIcon kind={tab.icon} color={color} active={active} />
            <Text
              style={[
                TYPE.monoXS,
                { color, marginTop: 3, fontSize: 9, letterSpacing: 0.08 * 9 },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minHeight: 44,
  },
});
