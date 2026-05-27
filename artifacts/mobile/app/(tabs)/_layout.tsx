import { Tabs } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";

import { TabBar } from "@/components/primitives/TabBar";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const { t, name } = useTheme();
  return (
    <>
      <StatusBar barStyle={name === "wallet" ? "light-content" : "dark-content"} />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: t.appBg },
        }}
        tabBar={() => <TabBar />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="planner" />
        <Tabs.Screen name="pass" />
        <Tabs.Screen name="account" />
      </Tabs>
    </>
  );
}
