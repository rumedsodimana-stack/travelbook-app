import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type TabIconKind = "home" | "compass" | "sparkle" | "pass" | "user";

interface Props {
  kind: TabIconKind;
  color: string;
  active?: boolean;
  size?: number;
}

export function TabIcon({ kind, color, active = false, size = 20 }: Props) {
  const sw = active ? 2 : 1.5;
  switch (kind) {
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-3v-6H7v6H4a1 1 0 0 1-1-1V9z" />
        </Svg>
      );
    case "compass":
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={10} cy={10} r={8} />
          <Path d="M13 7l-1.5 4.5L7 13l1.5-4.5L13 7z" />
        </Svg>
      );
    case "sparkle":
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10 2v4M10 14v4M2 10h4M14 10h4M5 5l2.5 2.5M12.5 12.5L15 15M5 15l2.5-2.5M12.5 7.5L15 5" />
        </Svg>
      );
    case "pass":
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={2} y={5} width={16} height={11} rx={1.5} />
          <Path d="M2 9h16M6 13h3" />
        </Svg>
      );
    case "user":
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={10} cy={7} r={3.5} />
          <Path d="M3 18c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
        </Svg>
      );
  }
}
