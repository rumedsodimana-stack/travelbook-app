import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { usePlanner, PlannerPreferences, TripPurpose } from "@/context/PlannerContext";
import { TravelCardView } from "@/components/TravelCardView";

const INTERESTS = ["Beach", "Adventure", "Culture", "Food", "Wellness", "City", "Nature", "Sports", "Nightlife"];
const TRAVEL_STYLES = [
  { key: "budget" as const, label: "Budget", icon: "wallet-outline" as const, desc: "Hostels & local eats" },
  { key: "comfort" as const, label: "Comfort", icon: "bed-outline" as const, desc: "Mid-range hotels" },
  { key: "luxury" as const, label: "Luxury", icon: "diamond-outline" as const, desc: "5-star experience" },
];

const PURPOSES: { key: TripPurpose; label: string }[] = [
  { key: "leisure", label: "Leisure" },
  { key: "business", label: "Business" },
  { key: "honeymoon", label: "Honeymoon" },
  { key: "family", label: "Family" },
  { key: "wellness", label: "Wellness" },
  { key: "bachelor", label: "Bachelor(ette)" },
  { key: "adventure", label: "Adventure" },
  { key: "culture", label: "Culture" },
  { key: "celebration", label: "Celebration" },
  { key: "other", label: "Other" },
];

const CARD_CATEGORIES = [
  { type: "flight" as const, label: "Flights", icon: "airplane" },
  { type: "hotel" as const, label: "Hotels", icon: "bed" },
  { type: "activity" as const, label: "Activities", icon: "map" },
  { type: "dining" as const, label: "Dining", icon: "restaurant" },
  { type: "insurance" as const, label: "Insurance", icon: "shield-checkmark" },
  { type: "visa" as const, label: "Visa", icon: "document-text" },
];

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activePlan, isGenerating, generateItinerary, removeCard, updateCard, bookAll, discardPlan } = usePlanner();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [step, setStep] = useState<"start" | "prefs" | "generating" | "result">("start");
  const [prefs, setPrefs] = useState<Partial<PlannerPreferences>>({
    destination: "",
    startDate: "2026-06-01",
    endDate: "2026-06-10",
    budget: 3000,
    currency: "USD",
    travelers: 1,
    interests: [],
    travelStyle: "comfort",
    purpose: "leisure",
    description: "",
  });

  const handleGenerate = async () => {
    if (!prefs.destination) return;
    setStep("generating");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await generateItinerary(prefs as PlannerPreferences);
    setStep("result");
  };

  const handleBookAll = () => {
    if (!activePlan) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    bookAll(activePlan.id);
    setStep("start");
  };

  const toggleInterest = (interest: string) => {
    setPrefs((p) => ({
      ...p,
      interests: p.interests?.includes(interest)
        ? p.interests.filter((i) => i !== interest)
        : [...(p.interests ?? []), interest],
    }));
  };

  if (step === "start") {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad + 10, paddingBottom: botPad + 90 }}
      >
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Trip Planner</Text>
        </View>

        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: colors.primary }]}
          onPress={() => setStep("prefs")}
          activeOpacity={0.88}
        >
          <View style={styles.aiCardContent}>
            <View style={[styles.aiIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <MaterialCommunityIcons name="robot-excited" size={28} color="#fff" />
            </View>
            <View style={styles.aiText}>
              <Text style={styles.aiTitle}>AI Trip Builder</Text>
              <Text style={styles.aiDesc}>Generate a full itinerary with flights, hotels, activities & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Book Manually</Text>
        <View style={styles.categoryGrid}>
          {CARD_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.type}
              style={[styles.catBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.catIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (step === "prefs") {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad + 10, paddingBottom: botPad + 90 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("start")}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.foreground }]}>Plan Your Trip</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESTINATION</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
            <TextInput
              value={prefs.destination}
              onChangeText={(v) => setPrefs((p) => ({ ...p, destination: v }))}
              placeholder="Where to?"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>START DATE</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={prefs.startDate}
                  onChangeText={(v) => setPrefs((p) => ({ ...p, startDate: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>END DATE</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={prefs.endDate}
                  onChangeText={(v) => setPrefs((p) => ({ ...p, endDate: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BUDGET (USD)</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="cash-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={String(prefs.budget)}
                  onChangeText={(v) => setPrefs((p) => ({ ...p, budget: Number(v) || 0 }))}
                  keyboardType="numeric"
                  placeholder="3000"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TRAVELERS</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={String(prefs.travelers)}
                  onChangeText={(v) => setPrefs((p) => ({ ...p, travelers: Number(v) || 1 }))}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TRAVEL STYLE</Text>
          <View style={styles.travelStyleRow}>
            {TRAVEL_STYLES.map((ts) => (
              <TouchableOpacity
                key={ts.key}
                style={[
                  styles.styleBtn,
                  {
                    backgroundColor: prefs.travelStyle === ts.key ? colors.primary : colors.card,
                    borderColor: prefs.travelStyle === ts.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setPrefs((p) => ({ ...p, travelStyle: ts.key }))}
              >
                <Ionicons
                  name={ts.icon}
                  size={20}
                  color={prefs.travelStyle === ts.key ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.styleLabel,
                    { color: prefs.travelStyle === ts.key ? "#fff" : colors.foreground },
                  ]}
                >
                  {ts.label}
                </Text>
                <Text
                  style={[
                    styles.styleDesc,
                    { color: prefs.travelStyle === ts.key ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
                  ]}
                >
                  {ts.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TRIP PURPOSE</Text>
          <View style={styles.interestsGrid}>
            {PURPOSES.map((p) => {
              const selected = prefs.purpose === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.interestChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.muted,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPrefs((prev) => ({ ...prev, purpose: p.key }))}
                >
                  <Text
                    style={[
                      styles.interestText,
                      { color: selected ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>INTERESTS</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => {
              const selected = prefs.interests?.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.muted,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      { color: selected ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TELL ME ABOUT THIS TRIP</Text>
          <View style={[styles.textareaBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={prefs.description}
              onChangeText={(v) => setPrefs((p) => ({ ...p, description: v }))}
              placeholder={"e.g. 7-day anniversary trip, love seafood and quiet beaches, want one big splurge dinner"}
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              style={[styles.textarea, { color: colors.foreground }]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.generateBtn,
              { backgroundColor: prefs.destination ? colors.primary : colors.muted },
            ]}
            onPress={handleGenerate}
            disabled={!prefs.destination}
          >
            <MaterialCommunityIcons name="robot-excited" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate My Itinerary</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === "generating" || isGenerating) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.primary }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingTitle}>Building your itinerary...</Text>
          <Text style={styles.loadingDesc}>Finding the best flights, hotels & experiences</Text>
        </View>
      </View>
    );
  }

  if (activePlan && step === "result") {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad + 10, paddingBottom: botPad + 90 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { discardPlan(); setStep("start"); }}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.foreground }]}>{activePlan.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.planSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Destination</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{activePlan.destination}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Cost</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ${activePlan.totalCost.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Items</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{activePlan.cards.length}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 12, marginBottom: 8 }]}>
          Your Itinerary
        </Text>

        {activePlan.cards.map((card) => (
          <TravelCardView
            key={card.id}
            card={card}
            onRemove={() => removeCard(activePlan.id, card.id)}
            onSelectAlternative={(alt) =>
              updateCard(activePlan.id, card.id, {
                title: alt.title,
                subtitle: alt.subtitle,
                provider: alt.provider,
                price: alt.price,
                startTime: alt.startTime,
                endTime: alt.endTime ?? card.endTime,
                details: alt.details,
              })
            }
          />
        ))}

        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          onPress={handleBookAll}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.bookBtnText}>Confirm & Create Travel Pass</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
  },
  aiCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  aiText: { flex: 1 },
  aiTitle: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  aiDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  catBtn: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  form: {
    paddingHorizontal: 16,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  travelStyleRow: {
    flexDirection: "row",
    gap: 8,
  },
  styleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
  },
  styleLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  styleDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
    marginTop: 12,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  loadingCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  loadingDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  planSummary: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: { alignItems: "center" },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  textareaBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 96,
    marginBottom: 6,
  },
  textarea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 70,
    lineHeight: 22,
  },
});
