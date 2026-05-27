export type ThemeName = "stamped" | "wallet" | "ticket";

export interface ThemeTokens {
  ink: string;
  ink2: string;
  ink3: string;
  inkMute: string;
  inkSoft: string;
  inkHair: string;

  paper: string;
  paper2: string;
  paperLight: string;

  terra: string;
  terraDeep: string;
  stampRed: string;

  appBg: string;
  surface: string;
  surfaceDim: string;
  hair: string;
  hairStrong: string;
  bodyText: string;
  mutedText: string;
  cardBorder: string;
}

const palette = {
  ink: "#0a2540",
  ink2: "#1a3a5c",
  ink3: "#2c4e72",
  inkMute: "rgba(10, 37, 64, 0.55)",
  inkSoft: "rgba(10, 37, 64, 0.18)",
  inkHair: "rgba(10, 37, 64, 0.10)",
  paper: "#f4ede4",
  paper2: "#ece3d6",
  paperLight: "#fcfaf6",
  terra: "#e8744a",
  terraDeep: "#c45a36",
  stampRed: "#a8412c",
  surface: "#ffffff",
  surfaceDim: "#fbf7f1",
  hair: "rgba(10, 37, 64, 0.08)",
  hairStrong: "rgba(10, 37, 64, 0.18)",
  white: "#ffffff",
  whiteMute: "rgba(255, 255, 255, 0.55)",
  whiteSoft: "rgba(255, 255, 255, 0.12)",
} as const;

const stamped: ThemeTokens = {
  ...palette,
  appBg: palette.paper,
  surface: palette.paperLight,
  surfaceDim: palette.surfaceDim,
  bodyText: palette.ink,
  mutedText: palette.inkMute,
  cardBorder: palette.inkHair,
};

// v2: populate Wallet (deep navy app bg, white-on-ink surfaces, barcode strips, gradient cards)
const wallet: ThemeTokens = {
  ...palette,
  appBg: palette.ink,
  surface: palette.whiteSoft,
  surfaceDim: "rgba(255, 255, 255, 0.04)",
  bodyText: palette.white,
  mutedText: palette.whiteMute,
  cardBorder: palette.whiteSoft,
};

// v2: populate Ticket (paper-light app bg, white surfaces, dashed perforations, terra stub on cards)
const ticket: ThemeTokens = {
  ...palette,
  appBg: palette.paperLight,
  surface: palette.white,
  surfaceDim: palette.surfaceDim,
  bodyText: palette.ink,
  mutedText: palette.inkMute,
  cardBorder: palette.inkHair,
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  stamped,
  wallet,
  ticket,
};

export const DEFAULT_THEME: ThemeName = "stamped";

export const RADII = {
  card: 14,
  small: 8,
  pill: 999,
} as const;

export const SPACING = [4, 8, 14, 22, 36] as const;
