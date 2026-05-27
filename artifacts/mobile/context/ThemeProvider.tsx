import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_THEME,
  RADII,
  SPACING,
  THEMES,
  type ThemeName,
  type ThemeTokens,
} from "@/constants/tokens";

const STORAGE_KEY = "tb.theme";

interface ThemeContextValue {
  name: ThemeName;
  t: ThemeTokens;
  radii: typeof RADII;
  spacing: typeof SPACING;
  setTheme: (name: ThemeName) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "stamped" || stored === "wallet" || stored === "ticket") {
          setName(stored);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      name,
      t: THEMES[name],
      radii: RADII,
      spacing: SPACING,
      setTheme,
      ready,
    }),
    [name, setTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside <ThemeProvider>");
  }
  return ctx;
}
