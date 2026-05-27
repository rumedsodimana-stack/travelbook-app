import { Stack } from "expo-router";
import React from "react";

import { useTheme } from "@/hooks/useTheme";

export default function PlannerStack() {
  const { t } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.appBg },
      }}
    />
  );
}
