import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { TravelCard } from "@/context/PlannerContext";

interface Props {
  card: TravelCard;
  onRemove?: () => void;
  onSelectAlternative?: (alt: TravelCard) => void;
  compact?: boolean;
}

const CARD_CONFIGS: Record<TravelCard["type"], {
  icon: string;
  iconSet: "ion" | "mci" | "feather";
  label: string;
  color: string;
}> = {
  flight:    { icon: "airplane",        iconSet: "ion",     label: "Flight",     color: "#1B3A5C" },
  hotel:     { icon: "bed",             iconSet: "ion",     label: "Hotel",      color: "#0E7C7B" },
  activity:  { icon: "map",             iconSet: "feather", label: "Activity",   color: "#E76F51" },
  insurance: { icon: "shield-checkmark",iconSet: "ion",     label: "Insurance",  color: "#2EC4B6" },
  visa:      { icon: "passport",        iconSet: "mci",     label: "Visa",       color: "#6B4EFF" },
  dining:    { icon: "restaurant",      iconSet: "ion",     label: "Dining",     color: "#FF6B6B" },
  transport: { icon: "train",           iconSet: "ion",     label: "Transport",  color: "#45B7D1" },
  event:     { icon: "ticket",          iconSet: "mci",     label: "Event",      color: "#DDA0DD" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function CardIcon({ type, size = 22, color = "#fff" }: { type: TravelCard["type"]; size?: number; color?: string }) {
  const cfg = CARD_CONFIGS[type];
  if (cfg.iconSet === "ion") return <Ionicons name={cfg.icon as any} size={size} color={color} />;
  if (cfg.iconSet === "mci") return <MaterialCommunityIcons name={cfg.icon as any} size={size} color={color} />;
  return <Feather name={cfg.icon as any} size={size} color={color} />;
}

function AlternativeChip({
  alt,
  isSelected,
  onPress,
}: {
  alt: TravelCard;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const cfg = CARD_CONFIGS[alt.type];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.altChip,
        {
          backgroundColor: isSelected ? cfg.color : colors.card,
          borderColor: isSelected ? cfg.color : colors.border,
          borderWidth: isSelected ? 0 : 1,
        },
      ]}
    >
      <View style={[styles.altChipIcon, { backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : cfg.color + "20" }]}>
        <CardIcon type={alt.type} size={14} color={isSelected ? "#fff" : cfg.color} />
      </View>
      <View style={styles.altChipText}>
        <Text
          style={[styles.altChipProvider, { color: isSelected ? "#fff" : colors.foreground }]}
          numberOfLines={1}
        >
          {alt.provider}
        </Text>
        <Text style={[styles.altChipPrice, { color: isSelected ? "rgba(255,255,255,0.85)" : colors.primary }]}>
          ${alt.price}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginLeft: 2 }} />
      )}
    </TouchableOpacity>
  );
}

export function TravelCardView({ card, onRemove, onSelectAlternative, compact }: Props) {
  const colors = useColors();
  const cfg = CARD_CONFIGS[card.type];
  const [selectedAltId, setSelectedAltId] = useState<string>(card.id);

  const allOptions: TravelCard[] = [card, ...(card.alternatives ?? [])];

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.();
  };

  const handleSelectAlt = (alt: TravelCard) => {
    if (alt.id === selectedAltId) return;
    Haptics.selectionAsync();
    setSelectedAltId(alt.id);
    onSelectAlternative?.(alt);
  };

  // Resolve the currently displayed card (main or chosen alt)
  const displayed = allOptions.find((o) => o.id === selectedAltId) ?? card;
  const displayedCfg = CARD_CONFIGS[displayed.type];

  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.compactIconBg, { backgroundColor: displayedCfg.color }]}>
          <CardIcon type={displayed.type} size={18} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactTitle, { color: colors.foreground }]} numberOfLines={1}>
            {displayed.title}
          </Text>
          <Text style={[styles.compactSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {formatDate(displayed.startTime)} · {displayed.provider}
          </Text>
        </View>
        <Text style={[styles.compactPrice, { color: colors.primary }]}>${displayed.price}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Main card */}
      <View style={[styles.card, { backgroundColor: displayedCfg.color }]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <CardIcon type={displayed.type} />
            </View>
            <Text style={styles.typeLabel}>{displayedCfg.label.toUpperCase()}</Text>
          </View>
          {onRemove && (
            <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.cardTitle}>{displayed.title}</Text>
        <Text style={styles.cardSubtitle}>{displayed.subtitle}</Text>

        <View style={styles.cardDivider} />

        {/* Times + price */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>
              {displayed.type === "flight" ? "DEPARTURE" : displayed.type === "hotel" ? "CHECK-IN" : "START"}
            </Text>
            <Text style={styles.footerValue}>
              {formatDate(displayed.startTime)} · {formatTime(displayed.startTime)}
            </Text>
          </View>
          {displayed.endTime && (
            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>
                {displayed.type === "hotel" ? "CHECK-OUT" : "END"}
              </Text>
              <Text style={styles.footerValue}>
                {formatDate(displayed.endTime)} · {formatTime(displayed.endTime)}
              </Text>
            </View>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.priceValue}>${displayed.price}</Text>
            <Text style={styles.priceCurrency}>{displayed.currency}</Text>
          </View>
        </View>

        {/* Detail chips */}
        <View style={styles.detailsRow}>
          {Object.entries(displayed.details).slice(0, 3).map(([key, val]) => (
            <View key={key} style={styles.detail}>
              <Text style={styles.detailKey}>{key}</Text>
              <Text style={styles.detailVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Provider */}
        <View style={styles.providerRow}>
          <Feather name="briefcase" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={styles.providerText}>{displayed.provider}</Text>
        </View>
      </View>

      {/* Alternatives carousel — only shown when alternatives exist */}
      {allOptions.length > 1 && (
        <View style={styles.altSection}>
          <View style={styles.altHeader}>
            <Text style={[styles.altTitle, { color: colors.mutedForeground }]}>
              {allOptions.length} OPTIONS
            </Text>
            <Text style={[styles.altHint, { color: colors.mutedForeground }]}>
              Swipe to compare
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.altList}
            scrollEventThrottle={16}
          >
            {allOptions.map((opt) => (
              <AlternativeChip
                key={opt.id}
                alt={opt}
                isSelected={opt.id === selectedAltId}
                onPress={() => handleSelectAlt(opt)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
  },
  removeBtn: { padding: 2 },
  cardTitle: {
    color: "#fff",
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    marginVertical: 12,
    borderStyle: "dashed",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  footerLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  footerValue: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  footerRight: { marginLeft: 20, flex: 1 },
  priceTag: { alignItems: "flex-end" },
  priceValue: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  priceCurrency: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10,
  },
  detail: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  detailKey: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  detailVal: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  providerText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  // Alternatives
  altSection: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  altHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
    paddingHorizontal: 2,
  },
  altTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.0,
  },
  altHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  altList: {
    gap: 8,
    paddingRight: 4,
  },
  altChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
    minWidth: 120,
    maxWidth: 180,
  },
  altChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  altChipText: { flex: 1 },
  altChipProvider: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 1,
  },
  altChipPrice: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },

  // Compact
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  compactIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  compactInfo: { flex: 1 },
  compactTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  compactSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  compactPrice: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
