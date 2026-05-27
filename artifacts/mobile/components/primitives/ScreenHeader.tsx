import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  overline?: string;
  title: string;
  action?: React.ReactNode;
  dark?: boolean;
}

export function ScreenHeader({ overline, title, action, dark = false }: Props) {
  const { t } = useTheme();
  const titleColor = dark ? "#ffffff" : t.ink;
  const overlineColor = dark ? "rgba(255,255,255,0.55)" : t.inkMute;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {overline ? (
          <Text style={[TYPE.monoXS, { color: overlineColor, marginBottom: 4 }]}>
            {overline}
          </Text>
        ) : null}
        <Text style={[TYPE.displayL, { color: titleColor }]}>{title}</Text>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 14,
  },
  text: {
    flex: 1,
  },
});
