import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export interface ExploreItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration?: string;
  tag?: string;
  gradientColors: [string, string];
  providerType?: string;
}

interface Props {
  item: ExploreItem;
  onPress: () => void;
  size?: "large" | "small";
}

export function ExploreCard({ item, onPress, size = "large" }: Props) {
  const colors = useColors();
  const isLarge = size === "large";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isLarge ? styles.large : styles.small,
        { backgroundColor: item.gradientColors[0] },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {item.tag && (
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={[styles.title, isLarge ? styles.titleLarge : styles.titleSmall]} numberOfLines={2}>
          {item.title}
        </Text>
        {isLarge && (
          <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({item.reviewCount})</Text>
          </View>
          <Text style={styles.price}>
            {item.price === 0 ? "Free" : `From $${item.price}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  large: {
    width: 220,
    height: 280,
    marginRight: 12,
  },
  small: {
    width: 160,
    height: 200,
    marginRight: 10,
  },
  tagBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingTop: 30,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 6,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  title: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  titleLarge: { fontSize: 16 },
  titleSmall: { fontSize: 14 },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  reviews: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  price: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
