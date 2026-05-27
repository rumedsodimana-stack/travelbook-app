import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  useFonts as useGeistFonts,
} from "@expo-google-fonts/geist";
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  useFonts as useGeistMonoFonts,
} from "@expo-google-fonts/geist-mono";
import {
  SourceSerif4_400Regular,
  SourceSerif4_500Medium,
  SourceSerif4_600SemiBold,
  useFonts as useSerifFonts,
} from "@expo-google-fonts/source-serif-4";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthProvider";
import { PlannerProvider } from "@/context/PlannerContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { configureApi } from "@/lib/api";

configureApi();

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [serifLoaded, serifError] = useSerifFonts({
    SourceSerif4_400Regular,
    SourceSerif4_500Medium,
    SourceSerif4_600SemiBold,
  });
  const [geistLoaded, geistError] = useGeistFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });
  const [monoLoaded, monoError] = useGeistMonoFonts({
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  const fontsReady = serifLoaded && geistLoaded && monoLoaded;
  const fontError = serifError || geistError || monoError;

  useEffect(() => {
    if (fontsReady || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, fontError]);

  if (!fontsReady && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AppProvider>
                <PlannerProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </PlannerProvider>
              </AppProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
