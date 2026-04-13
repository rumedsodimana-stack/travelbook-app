import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { TravelPass } from "@/context/PlannerContext";

interface Props {
  pass: TravelPass;
  onPress: () => void;
  onShare?: () => void;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString([], opts)} – ${e.toLocaleDateString([], opts)}, ${e.getFullYear()}`;
}

function getDaysLeft(startDate: string): number {
  const diff = new Date(startDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function getCardTypeCounts(cards: TravelPass["cards"]): string {
  const types = new Set(cards.map((c) => c.type));
  return Array.from(types)
    .slice(0, 4)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" · ");
}

const STATUS_CONFIG = {
  active: { label: "Active", color: "#0E7C7B" },
  upcoming: { label: "Upcoming", color: "#F4A261" },
  archived: { label: "Archived", color: "#8A8580" },
};

const BG_COLORS = ["#1B3A5C", "#0E7C7B", "#E76F51", "#264653", "#6B4EFF", "#2EC4B6"];

function getPassColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return BG_COLORS[hash % BG_COLORS.length];
}

export function PassCard({ pass, onPress, onShare }: Props) {
  const colors = useColors();
  const passColor = getPassColor(pass.id);
  const daysLeft = getDaysLeft(pass.startDate);
  const status = STATUS_CONFIG[pass.status];

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: passColor }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
          {pass.status === "upcoming" && daysLeft > 0 && (
            <Text style={styles.daysLeft}>{daysLeft}d away</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {pass.isPublic && (
            <View style={styles.publicBadge}>
              <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          {onShare && (
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Feather name="share-2" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.passIconRow}>
        <MaterialCommunityIcons name="passport" size={32} color="rgba(255,255,255,0.3)" />
        <Text style={styles.tbLabel}>TRAVELBOOK</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>{pass.title}</Text>
      <View style={styles.destinationRow}>
        <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
        <Text style={styles.destination}>{pass.destination}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>TRAVEL DATES</Text>
          <Text style={styles.footerValue}>{formatDateRange(pass.startDate, pass.endDate)}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerLabel}>TOTAL</Text>
          <Text style={styles.footerValue}>${pass.totalCost.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.cardTypes}>
        <Text style={styles.cardTypesText}>{getCardTypeCounts(pass.cards)}</Text>
        <Text style={styles.cardCount}>{pass.cards.length} items</Text>
      </View>

      {pass.travelBuddyRequests > 0 && (
        <View style={styles.buddyBadge}>
          <Ionicons name="people" size={12} color="#fff" />
          <Text style={styles.buddyText}>{pass.travelBuddyRequests} buddy requests</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  daysLeft: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publicBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareBtn: {
    padding: 4,
  },
  passIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tbLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 14,
  },
  destination: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  footerValue: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardTypes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTypesText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  cardCount: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  buddyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  buddyText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
