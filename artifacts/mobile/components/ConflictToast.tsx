import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Conflict } from "@/context/plannerEngine";

interface Props {
  conflicts: Conflict[];
  /** Optional override — by default the toast auto-hides after dismissalMs (12s). */
  dismissalMs?: number;
}

/**
 * Renders the highest-severity conflict from PlannerContext.conflicts as a
 * floating banner near the top of the screen. Auto-dismisses after a few
 * seconds; can be manually dismissed with the close button.
 *
 * The toast rotates whenever the conflict set changes — a fresh conflict will
 * re-show even after a dismiss.
 */
export function ConflictToast({ conflicts, dismissalMs = 12_000 }: Props) {
  const colors = useColors();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  // Pick the most-severe conflict to show first. Errors > warnings.
  const ranked = [...conflicts].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
  );
  const top = ranked[0] ?? null;
  const conflictKey = top ? `${top.cardId}:${top.message}` : null;

  // Auto-dismiss timer.
  useEffect(() => {
    if (!conflictKey) return;
    const id = setTimeout(() => setDismissedKey(conflictKey), dismissalMs);
    return () => clearTimeout(id);
  }, [conflictKey, dismissalMs]);

  // Reset dismissed flag when the conflict set changes.
  useEffect(() => {
    setDismissedKey(null);
  }, [conflictKey]);

  if (!top || dismissedKey === conflictKey) return null;

  const isError = top.severity === "error";
  const accent = isError ? colors.destructive : "#F4A261";

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.card, borderColor: accent + "60", shadowColor: accent },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + "20" }]}>
        <Ionicons name={isError ? "alert-circle" : "warning"} size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {top.cardTitle}
        </Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>
          {top.message}
        </Text>
      </View>
      <TouchableOpacity onPress={() => setDismissedKey(conflictKey)} hitSlop={10}>
        <Ionicons name="close" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 100,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  message: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 17,
  },
});
