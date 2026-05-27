import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export default function OnboardingLayout() {
  const { t } = useTheme();
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.appBg },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
