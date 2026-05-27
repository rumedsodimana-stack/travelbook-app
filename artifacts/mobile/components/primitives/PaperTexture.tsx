import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

/**
 * Paper-texture overlay used on Stamped surfaces.
 *
 * Recreates `.paper-texture` from tokens.css — two layered radial-dot
 * patterns at 7px and 13px tile sizes, offset by 3px, at low opacity. The
 * effect should be subtle (50% opacity by default) — it's the warmth, not
 * the focal point.
 *
 * Drop this absolutely-positioned inside any container that uses
 * `t.appBg = paper`. It is pointer-events: none so it doesn't intercept taps.
 */
export function PaperTexture({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dotsA" x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
            <Circle cx="1" cy="1" r="1" fill="rgba(10,37,64,0.05)" />
          </Pattern>
          <Pattern id="dotsB" x="3" y="3" width="13" height="13" patternUnits="userSpaceOnUse">
            <Circle cx="1" cy="1" r="1" fill="rgba(10,37,64,0.03)" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotsA)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotsB)" />
      </Svg>
    </View>
  );
}
