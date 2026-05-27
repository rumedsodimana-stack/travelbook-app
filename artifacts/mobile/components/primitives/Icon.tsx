import React from "react";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

/**
 * Tiny set of stroke icons used by the feed reactions row and compose actions.
 * Each is 20x20 by default, stroke-width 1.6, matches the TabIcon style.
 */

type IconProps = {
  color: string;
  size?: number;
  filled?: boolean;
};

export function HeartIcon({ color, size = 18, filled = false }: IconProps) {
  const fill = filled ? color : "none";
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={fill} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 17s-6-3.5-6-8a3.5 3.5 0 0 1 6-2.45A3.5 3.5 0 0 1 16 9c0 4.5-6 8-6 8z" />
    </Svg>
  );
}

export function CommentIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 6.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6l-3.5 3v-3a2 2 0 0 1-1.5-1.95V6.5z" />
    </Svg>
  );
}

export function ShareIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 11v4.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V11" />
      <Polyline points="7,6 10,3 13,6" />
      <Path d="M10 3v10" />
    </Svg>
  );
}

export function BookmarkIcon({ color, size = 18, filled = false }: IconProps) {
  const fill = filled ? color : "none";
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={fill} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 3h10v14l-5-3-5 3V3z" />
    </Svg>
  );
}

export function ComposeIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 13.5V16h2.5l8-8L12 5.5l-8 8z" />
      <Path d="M11.5 6L14 8.5" />
    </Svg>
  );
}

export function VerifiedTick({ color, size = 12 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill={color} stroke="none">
      <Path d="M6 0.5L7 2L9 2L9 4L10.5 5L9 6L9 8L7 8L6 9.5L5 8L3 8L3 6L1.5 5L3 4L3 2L5 2z" />
      <Path d="M4.3 5.2L5.5 6.4L7.7 4.2" stroke="#ffffff" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LiveDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8">
      <Circle cx={4} cy={4} r={4} fill={color} />
    </Svg>
  );
}
