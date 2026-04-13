import { Ionicons, Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { ExploreCard, ExploreItem } from "@/components/ExploreCard";

const CATEGORIES = ["All", "Beach", "Adventure", "Culture", "Food", "Wellness", "City", "Nature"];

const TRENDING: ExploreItem[] = [
  {
    id: "e1",
    title: "Kyoto Temple Walk",
    subtitle: "Ancient temples & zen gardens",
    category: "Culture",
    rating: 4.9,
    reviewCount: 2847,
    price: 45,
    currency: "USD",
    duration: "4h",
    tag: "Trending",
    gradientColors: ["#264653", "#2A9D8F"],
    providerType: "tours",
  },
  {
    id: "e2",
    title: "Amalfi Coast Sailing",
    subtitle: "Private boat tour with lunch",
    category: "Adventure",
    rating: 4.8,
    reviewCount: 1203,
    price: 120,
    currency: "USD",
    duration: "8h",
    tag: "Popular",
    gradientColors: ["#1B3A5C", "#2D6A8C"],
    providerType: "activities",
  },
  {
    id: "e3",
    title: "Ubud Rice Terraces",
    subtitle: "Sunrise trekking experience",
    category: "Nature",
    rating: 4.7,
    reviewCount: 934,
    price: 35,
    currency: "USD",
    duration: "5h",
    gradientColors: ["#2D6A4F", "#52B788"],
    providerType: "activities",
  },
  {
    id: "e4",
    title: "Morocco Desert Camp",
    subtitle: "Sahara overnight experience",
    category: "Adventure",
    rating: 4.9,
    reviewCount: 756,
    price: 180,
    currency: "USD",
    duration: "2 days",
    tag: "Limited",
    gradientColors: ["#7A4E2D", "#C4832E"],
    providerType: "tours",
  },
];

const CURATED_PACKAGES: ExploreItem[] = [
  {
    id: "p1",
    title: "10-Day Japan Spring Package",
    subtitle: "Flights · Hotels · 8 Activities · Insurance",
    category: "Package",
    rating: 4.9,
    reviewCount: 412,
    price: 2850,
    currency: "USD",
    duration: "10 days",
    tag: "Best Value",
    gradientColors: ["#6B4EFF", "#9B85FF"],
    providerType: "tours",
  },
  {
    id: "p2",
    title: "Bali Wellness Retreat",
    subtitle: "Hotel · Spa · Yoga classes · Transfers",
    category: "Package",
    rating: 4.8,
    reviewCount: 289,
    price: 1680,
    currency: "USD",
    duration: "7 days",
    gradientColors: ["#2EC4B6", "#3DC9BE"],
    providerType: "tours",
  },
  {
    id: "p3",
    title: "European Cities Pass",
    subtitle: "Paris · Rome · Barcelona · Amsterdam",
    category: "Package",
    rating: 4.7,
    reviewCount: 831,
    price: 3200,
    currency: "USD",
    duration: "14 days",
    tag: "New",
    gradientColors: ["#E76F51", "#F4A261"],
    providerType: "tours",
  },
];

const DESTINATIONS: ExploreItem[] = [
  {
    id: "d1",
    title: "Maldives",
    subtitle: "Overwater villas & marine life",
    category: "Beach",
    rating: 4.9,
    reviewCount: 5621,
    price: 0,
    currency: "USD",
    gradientColors: ["#0E7C7B", "#4ECDC4"],
  },
  {
    id: "d2",
    title: "Patagonia",
    subtitle: "Wild landscapes & trekking",
    category: "Adventure",
    rating: 4.8,
    reviewCount: 2341,
    price: 0,
    currency: "USD",
    gradientColors: ["#1B3A5C", "#2D6A8C"],
  },
  {
    id: "d3",
    title: "Marrakech",
    subtitle: "Souks, riads & desert tours",
    category: "Culture",
    rating: 4.7,
    reviewCount: 3412,
    price: 0,
    currency: "USD",
    gradientColors: ["#7A4E2D", "#C4832E"],
  },
  {
    id: "d4",
    title: "Iceland",
    subtitle: "Northern lights & glaciers",
    category: "Nature",
    rating: 4.9,
    reviewCount: 4123,
    price: 0,
    currency: "USD",
    gradientColors: ["#264653", "#45B7D1"],
  },
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const filtered =
    activeCategory === "All"
      ? TRENDING
      : TRENDING.filter((e) => e.category === activeCategory);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topPad + 10, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Explore</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Destinations, activities, packages..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              {
                backgroundColor: activeCategory === cat ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: activeCategory === cat ? "#fff" : colors.mutedForeground },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending Experiences</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {filtered.map((item) => (
          <ExploreCard key={item.id} item={item} onPress={() => {}} />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Curated Packages</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {CURATED_PACKAGES.map((item) => (
          <ExploreCard key={item.id} item={item} onPress={() => {}} />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Destinations</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.destinationsGrid}>
        {DESTINATIONS.map((item, idx) => (
          <View key={item.id} style={styles.destWrapper}>
            <ExploreCard
              item={item}
              onPress={() => {}}
              size="small"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoriesRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 6,
    paddingBottom: 8,
  },
  destinationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  destWrapper: {
    width: "47%",
  },
});
