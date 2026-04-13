import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { TravelCard } from "@/context/PlannerContext";

interface Props {
  card: TravelCard;
  onRemove?: () => void;
  compact?: boolean;
}

const CARD_CONFIGS: Record<TravelCard["type"], {
  icon: string;
  iconSet: "ion" | "mci" | "feather";
  label: string;
  gradient: [string, string];
}> = {
  flight: { icon: "airplane", iconSet: "ion", label: "Flight", gradient: ["#1B3A5C", "#2D6A8C"] },
  hotel: { icon: "bed", iconSet: "ion", label: "Hotel", gradient: ["#0E7C7B", "#1AA8A7"] },
  activity: { icon: "map", iconSet: "feather", label: "Activity", gradient: ["#F4A261", "#E76F51"] },
  insurance: { icon: "shield-checkmark", iconSet: "ion", label: "Insurance", gradient: ["#2EC4B6", "#3DC9BE"] },
  visa: { icon: "passport", iconSet: "mci", label: "Visa", gradient: ["#6B4EFF", "#9B85FF"] },
  dining: { icon: "restaurant", iconSet: "ion", label: "Dining", gradient: ["#FF6B6B", "#FF8E8E"] },
  transport: { icon: "train", iconSet: "ion", label: "Transport", gradient: ["#45B7D1", "#68CBE0"] },
  event: { icon: "ticket", iconSet: "mci", label: "Event", gradient: ["#DDA0DD", "#C77DBB"] },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CardIcon({ config }: { config: typeof CARD_CONFIGS[keyof typeof CARD_CONFIGS] }) {
  if (config.iconSet === "ion")
    return <Ionicons name={config.icon as any} size={22} color="#fff" />;
  if (config.iconSet === "mci")
    return <MaterialCommunityIcons name={config.icon as any} size={22} color="#fff" />;
  return <Feather name={config.icon as any} size={22} color="#fff" />;
}

export function TravelCardView({ card, onRemove, compact }: Props) {
  const colors = useColors();
  const cfg = CARD_CONFIGS[card.type];

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.();
  };

  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.compactIconBg, { backgroundColor: cfg.gradient[0] }]}>
          <CardIcon config={cfg} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactTitle, { color: colors.foreground }]} numberOfLines={1}>
            {card.title}
          </Text>
          <Text style={[styles.compactSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {formatDate(card.startTime)} · {card.provider}
          </Text>
        </View>
        <Text style={[styles.compactPrice, { color: colors.primary }]}>
          ${card.price}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cfg.gradient[0] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <View style={[styles.iconBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <CardIcon config={cfg} />
          </View>
          <Text style={styles.typeLabel}>{cfg.label.toUpperCase()}</Text>
        </View>
        {onRemove && (
          <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>
            {card.type === "flight" ? "Departure" : "Start"}
          </Text>
          <Text style={styles.footerValue}>
            {formatDate(card.startTime)} · {formatTime(card.startTime)}
          </Text>
        </View>
        {card.endTime && (
          <View style={styles.footerRight}>
            <Text style={styles.footerLabel}>
              {card.type === "hotel" ? "Check-out" : "End"}
            </Text>
            <Text style={styles.footerValue}>
              {formatDate(card.endTime)} · {formatTime(card.endTime)}
            </Text>
          </View>
        )}
        <View style={styles.priceTag}>
          <Text style={styles.priceValue}>${card.price}</Text>
          <Text style={styles.priceCurrency}>{card.currency}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        {Object.entries(card.details).slice(0, 3).map(([key, val]) => (
          <View key={key} style={styles.detail}>
            <Text style={styles.detailKey}>{key}</Text>
            <Text style={styles.detailVal}>{val}</Text>
          </View>
        ))}
      </View>

      <View style={styles.providerRow}>
        <Feather name="briefcase" size={12} color="rgba(255,255,255,0.6)" />
        <Text style={styles.providerText}>{card.provider}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    marginHorizontal: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  removeBtn: {
    padding: 2,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  cardDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
    borderStyle: "dashed",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  footerLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  footerValue: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  footerRight: {
    marginLeft: 24,
    flex: 1,
  },
  priceTag: {
    alignItems: "flex-end",
  },
  priceValue: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  priceCurrency: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  detail: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailKey: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  detailVal: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  providerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  compactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  compactSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  compactPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
