import { Platform, type TextStyle } from "react-native";

export const FONT_FAMILY = {
  display: Platform.select({
    ios: "SourceSerif4-Regular",
    android: "SourceSerif4_400Regular",
    default: "Source Serif 4, Georgia, serif",
  }) as string,
  displayMedium: Platform.select({
    ios: "SourceSerif4-Medium",
    android: "SourceSerif4_500Medium",
    default: "Source Serif 4, Georgia, serif",
  }) as string,
  body: Platform.select({
    ios: "Geist-Regular",
    android: "Geist_400Regular",
    default: "Geist, -apple-system, system-ui, sans-serif",
  }) as string,
  bodyMedium: Platform.select({
    ios: "Geist-Medium",
    android: "Geist_500Medium",
    default: "Geist, -apple-system, system-ui, sans-serif",
  }) as string,
  mono: Platform.select({
    ios: "GeistMono-Regular",
    android: "GeistMono_400Regular",
    default: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace",
  }) as string,
};

export const TYPE: Record<
  "displayXL" | "displayL" | "displayM" | "body" | "bodyS" | "monoXS" | "monoS",
  TextStyle
> = {
  displayXL: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: 32,
    lineHeight: 32 * 1.05,
    letterSpacing: -0.01 * 32,
  },
  displayL: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: 24,
    lineHeight: 24 * 1.1,
    letterSpacing: -0.005 * 24,
  },
  displayM: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: 18,
    lineHeight: 18 * 1.15,
  },
  body: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    lineHeight: 14 * 1.4,
  },
  bodyS: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 12,
    lineHeight: 12 * 1.4,
  },
  monoXS: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 9,
    letterSpacing: 0.08 * 9,
    textTransform: "uppercase",
  },
  monoS: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    letterSpacing: 0.05 * 11,
  },
};
