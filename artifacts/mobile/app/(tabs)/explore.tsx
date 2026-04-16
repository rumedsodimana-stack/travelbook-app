import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
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
  const [detail, setDetail] = useState<ExploreItem | null>(null);
  const [seeAll, setSeeAll] = useState<{ title: string; items: ExploreItem[] } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  // Live search + category filter — applied to all sections.
  const allItems = useMemo(() => [...TRENDING, ...CURATED_PACKAGES, ...DESTINATIONS], []);

  const matchesQuery = (item: ExploreItem) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  };

  const matchesCategory = (item: ExploreItem) =>
    activeCategory === "All" || item.category === activeCategory;

  const filteredTrending = TRENDING.filter((i) => matchesQuery(i) && matchesCategory(i));
  const filteredPackages = CURATED_PACKAGES.filter((i) => matchesQuery(i) && matchesCategory(i));
  const filteredDestinations = DESTINATIONS.filter((i) => matchesQuery(i) && matchesCategory(i));
  const allFiltered = allItems.filter(matchesQuery);

  const handleCardPress = (item: ExploreItem) => {
    Haptics.selectionAsync();
    setDetail(item);
  };

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

      {query.trim() && allFiltered.length === 0 && (
        <Text style={[styles.emptyResults, { color: colors.mutedForeground }]}>
          No results for "{query}"
        </Text>
      )}

      {filteredTrending.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending Experiences</Text>
            <TouchableOpacity onPress={() => setSeeAll({ title: "Trending Experiences", items: TRENDING })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {filteredTrending.map((item) => (
              <ExploreCard key={item.id} item={item} onPress={() => handleCardPress(item)} />
            ))}
          </ScrollView>
        </>
      )}

      {filteredPackages.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Curated Packages</Text>
            <TouchableOpacity onPress={() => setSeeAll({ title: "Curated Packages", items: CURATED_PACKAGES })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {filteredPackages.map((item) => (
              <ExploreCard key={item.id} item={item} onPress={() => handleCardPress(item)} />
            ))}
          </ScrollView>
        </>
      )}

      {filteredDestinations.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Destinations</Text>
            <TouchableOpacity onPress={() => setSeeAll({ title: "Top Destinations", items: DESTINATIONS })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.destinationsGrid}>
            {filteredDestinations.map((item) => (
              <View key={item.id} style={styles.destWrapper}>
                <ExploreCard item={item} onPress={() => handleCardPress(item)} size="small" />
              </View>
            ))}
          </View>
        </>
      )}

      <ExploreDetailModal item={detail} onClose={() => setDetail(null)} colors={colors} />

      <SeeAllModal data={seeAll} onClose={() => setSeeAll(null)} colors={colors} onItemPress={handleCardPress} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail modal
// ─────────────────────────────────────────────────────────────

function ExploreDetailModal({
  item,
  onClose,
  colors,
}: {
  item: ExploreItem | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (!item) return null;
  return (
    <Modal visible={!!item} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailHero, { backgroundColor: item.gradientColors[0] }]}>
            <View style={styles.detailHeroOverlay}>
              <View style={styles.detailHeroBadge}>
                <Text style={styles.detailHeroBadgeText}>{item.category}</Text>
              </View>
              <Text style={styles.detailHeroTitle}>{item.title}</Text>
              <Text style={styles.detailHeroSubtitle}>{item.subtitle}</Text>
              <View style={styles.detailHeroMeta}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.detailHeroRating}>
                  {item.rating.toFixed(1)} · {item.reviewCount.toLocaleString()} reviews
                </Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 20, gap: 16 }}>
            <View style={[styles.detailPriceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.detailPriceLabel, { color: colors.mutedForeground }]}>FROM</Text>
                <Text style={[styles.detailPriceValue, { color: colors.primary }]}>
                  {item.price === 0 ? "Free" : `$${item.price.toLocaleString()}`}
                  {item.price !== 0 && (
                    <Text style={[styles.detailPriceCurrency, { color: colors.mutedForeground }]}> {item.currency}</Text>
                  )}
                </Text>
              </View>
              {item.duration && (
                <View>
                  <Text style={[styles.detailPriceLabel, { color: colors.mutedForeground }]}>DURATION</Text>
                  <Text style={[styles.detailDurationValue, { color: colors.foreground }]}>{item.duration}</Text>
                </View>
              )}
              <View>
                <Text style={[styles.detailPriceLabel, { color: colors.mutedForeground }]}>TYPE</Text>
                <Text style={[styles.detailDurationValue, { color: colors.foreground }]}>
                  {item.providerType ?? item.category}
                </Text>
              </View>
            </View>

            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.detailBody, { color: colors.mutedForeground }]}>
              {item.subtitle}. A handpicked experience from TravelBook's curated catalogue. Real bookings,
              instant confirmation, and full cancellation support up to 24 hours before.
            </Text>

            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>What's included</Text>
            <View style={{ gap: 8 }}>
              {[
                "Local guide and transportation",
                "All entrance fees and permits",
                "TravelBook 24/7 support",
                "Free cancellation up to 24h",
              ].map((line) => (
                <View key={line} style={styles.detailIncludesRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.detailIncludesText, { color: colors.foreground }]}>{line}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.detailSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="bookmark" size={16} color={colors.foreground} />
                <Text style={[styles.detailSecondaryText, { color: colors.foreground }]}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailPrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onClose();
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.detailPrimaryText}>Add to Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// See-all modal
// ─────────────────────────────────────────────────────────────

function SeeAllModal({
  data,
  onClose,
  colors,
  onItemPress,
}: {
  data: { title: string; items: ExploreItem[] } | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  onItemPress: (item: ExploreItem) => void;
}) {
  if (!data) return null;
  return (
    <Modal visible={!!data} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{data.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={styles.seeAllGrid}>
            {data.items.map((item) => (
              <View key={item.id} style={styles.seeAllItem}>
                <ExploreCard
                  item={item}
                  size="small"
                  onPress={() => {
                    onItemPress(item);
                    onClose();
                  }}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  emptyResults: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 40,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  detailHero: {
    height: 240,
    justifyContent: "flex-end",
  },
  detailHeroOverlay: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingTop: 60,
  },
  detailHeroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  detailHeroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  detailHeroTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  detailHeroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  detailHeroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailHeroRating: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  detailPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailPriceLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailPriceValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  detailPriceCurrency: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  detailDurationValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  detailBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  detailIncludesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailIncludesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailSecondaryBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailSecondaryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  detailPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  detailPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  seeAllGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  seeAllItem: {
    width: "47%",
  },
});
