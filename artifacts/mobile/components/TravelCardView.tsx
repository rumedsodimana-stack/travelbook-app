import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useNow, cardLifecycle, formatDuration } from "@/hooks/useNow";
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
  flight:    { icon: "airplane",         iconSet: "ion",     label: "Flight",     color: "#1B3A5C" },
  hotel:     { icon: "bed",              iconSet: "ion",     label: "Hotel",      color: "#0E7C7B" },
  activity:  { icon: "map",              iconSet: "feather", label: "Activity",   color: "#E76F51" },
  insurance: { icon: "shield-checkmark", iconSet: "ion",     label: "Insurance",  color: "#2EC4B6" },
  visa:      { icon: "passport",         iconSet: "mci",     label: "Visa",       color: "#6B4EFF" },
  dining:    { icon: "restaurant",       iconSet: "ion",     label: "Dining",     color: "#FF6B6B" },
  transport: { icon: "train",            iconSet: "ion",     label: "Transport",  color: "#45B7D1" },
  event:     { icon: "ticket",           iconSet: "mci",     label: "Event",      color: "#DDA0DD" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function CardIcon({
  type,
  size = 22,
  color = "#fff",
}: {
  type: TravelCard["type"];
  size?: number;
  color?: string;
}) {
  const cfg = CARD_CONFIGS[type];
  if (cfg.iconSet === "ion") return <Ionicons name={cfg.icon as any} size={size} color={color} />;
  if (cfg.iconSet === "mci") return <MaterialCommunityIcons name={cfg.icon as any} size={size} color={color} />;
  return <Feather name={cfg.icon as any} size={size} color={color} />;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
/** Horizontal drag distance required to commit to an alternative. */
const COMMIT_THRESHOLD = SCREEN_WIDTH * 0.22;

export function TravelCardView({ card, onRemove, onSelectAlternative, compact }: Props) {
  const colors = useColors();
  const now = useNow();

  // Deck = current card + its alternatives. The user swipes through this list.
  const deck = useMemo(
    () => [card, ...(card.alternatives ?? [])],
    [card],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const displayed = deck[currentIndex] ?? card;
  const displayedCfg = CARD_CONFIGS[displayed.type];

  // Lifecycle drives visual state — past cards dim, active cards get a LIVE pulse,
  // soon cards show a countdown. Refreshes via useNow.
  const lifecycle = cardLifecycle(displayed.startTime, displayed.endTime, now);
  const msUntilStart = new Date(displayed.startTime).getTime() - now.getTime();

  // Gesture state — persisted across renders via Reanimated shared values.
  const translateX = useSharedValue(0);

  // When the card prop changes (e.g. parent reflowed it), reset to index 0.
  useEffect(() => {
    setCurrentIndex(0);
    translateX.value = 0;
  }, [card.id, translateX]);

  const commitIndex = (next: number) => {
    setCurrentIndex(next);
    Haptics.selectionAsync();
    if (onSelectAlternative && deck[next]) {
      onSelectAlternative(deck[next]);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove?.();
  };

  // Compact mode: no swipe, just a summary row.
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

  const hasDeck = deck.length > 1;

  // Pan gesture: drag horizontally, snap to next/prev on commit, snap back otherwise.
  const pan = Gesture.Pan()
    .enabled(hasDeck)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const dx = e.translationX;
      if (dx < -COMMIT_THRESHOLD && currentIndex < deck.length - 1) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 180 }, () => {
          translateX.value = 0;
          runOnJS(commitIndex)(currentIndex + 1);
        });
      } else if (dx > COMMIT_THRESHOLD && currentIndex > 0) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 180 }, () => {
          translateX.value = 0;
          runOnJS(commitIndex)(currentIndex - 1);
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 160 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: displayedCfg.color, opacity: lifecycle === "past" ? 0.5 : 1 },
            animatedStyle,
          ]}
        >
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.typeRow}>
              <View style={[styles.iconBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <CardIcon type={displayed.type} />
              </View>
              <Text style={styles.typeLabel}>{displayedCfg.label.toUpperCase()}</Text>
              {hasDeck && (
                <Text style={styles.counter}>
                  {currentIndex + 1}/{deck.length}
                </Text>
              )}
              {lifecycle === "active" && (
                <View style={styles.liveBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
              {lifecycle === "past" && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                  <Text style={styles.liveBadgeText}>DONE</Text>
                </View>
              )}
              {lifecycle === "soon" && msUntilStart > 0 && (
                <View style={styles.soonBadge}>
                  <Ionicons name="time-outline" size={10} color="#fff" />
                  <Text style={styles.liveBadgeText}>IN {formatDuration(msUntilStart).toUpperCase()}</Text>
                </View>
              )}
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
                {displayed.type === "flight"
                  ? "DEPARTURE"
                  : displayed.type === "hotel"
                  ? "CHECK-IN"
                  : "START"}
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
        </Animated.View>
      </GestureDetector>

      {/* Dot indicator — one dot per alternative */}
      {hasDeck && (
        <View style={styles.dotsRow}>
          {deck.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? displayedCfg.color : colors.border,
                  width: i === currentIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* One-time hint shown on the first alternative of the deck */}
      {hasDeck && currentIndex === 0 && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Swipe to compare {deck.length - 1} {deck.length - 1 === 1 ? "alternative" : "alternatives"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
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
  counter: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  soonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 4,
    backgroundColor: "#F4A261",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
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
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  hint: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
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
