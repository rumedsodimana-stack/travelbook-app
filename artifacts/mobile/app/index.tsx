import { Redirect } from "expo-router";
import React from "react";

import { useAuth } from "@/context/AuthProvider";

export default function RootIndex() {
  const { ready, onboarded } = useAuth();
  if (!ready) return null;
  return <Redirect href={onboarded ? "/(tabs)" : "/(onboarding)/welcome"} />;
}
