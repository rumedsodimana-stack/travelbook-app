import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

export interface ActionSheetItem {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface Props {
  visible: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

/**
 * Cross-platform bottom action sheet. React Native's Alert.alert renders as a
 * single-button browser dialog on react-native-web; this primitive gives us the
 * native-feeling list of options on every runtime.
 */
export function ActionSheet({ visible, title, items, onClose }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: t.surface,
              paddingBottom: insets.bottom + 8,
              borderColor: t.inkHair,
            },
          ]}
          onPress={(e) => e.stopPropagation?.()}
        >
          {/* drag handle */}
          <View style={[styles.handle, { backgroundColor: t.inkHair }]} />

          {title ? (
            <Text style={[TYPE.monoXS, styles.title, { color: t.inkMute }]}>
              {title.toUpperCase()}
            </Text>
          ) : null}

          {items.map((item, i) => (
            <Pressable
              key={`${item.label}-${i}`}
              onPress={() => {
                if (item.disabled) return;
                onClose();
                requestAnimationFrame(() => {
                  item.onPress?.();
                });
              }}
              disabled={item.disabled}
              style={({ pressed }) => [
                styles.row,
                {
                  borderTopColor: t.inkHair,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  opacity: item.disabled ? 0.4 : pressed ? 0.55 : 1,
                },
              ]}
            >
              <Text
                style={[
                  TYPE.body,
                  {
                    color: item.destructive ? t.stampRed : t.ink,
                    fontWeight: "500",
                    textAlign: "center",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              { backgroundColor: t.paper, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "600", textAlign: "center" }]}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10,37,64,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  cancel: {
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
});
