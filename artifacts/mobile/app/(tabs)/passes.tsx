import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePlanner, TravelPass } from "@/context/PlannerContext";
import { PassCard } from "@/components/PassCard";
import { TravelCardView } from "@/components/TravelCardView";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "long", day: "numeric" });
}

export default function PassesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { passes, sharePass, archivePass, requestJoinTrip } = usePlanner();
  const [selectedPass, setSelectedPass] = useState<TravelPass | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const upcoming = passes.filter((p) => p.status === "upcoming");
  const active = passes.filter((p) => p.status === "active");
  const archived = passes.filter((p) => p.status === "archived");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 10, paddingBottom: botPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="passport" size={28} color={colors.primary} />
          <Text style={[styles.heading, { color: colors.foreground }]}>Travel Passes</Text>
        </View>

        {active.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Active Now</Text>
            {active.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onPress={() => setSelectedPass(pass)}
                onShare={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  sharePass(pass.id);
                }}
              />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Upcoming Trips</Text>
            {upcoming.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onPress={() => setSelectedPass(pass)}
                onShare={() => sharePass(pass.id)}
              />
            ))}
          </>
        )}

        {upcoming.length === 0 && active.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="passport" size={60} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No trips yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Use the Planner tab to build your first Travel Pass
            </Text>
          </View>
        )}

        {archived.length > 0 && (
          <>
            <View style={[styles.archivedHeader, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Past Trips</Text>
            </View>
            {archived.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onPress={() => setSelectedPass(pass)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedPass}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPass(null)}
      >
        {selectedPass && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedPass(null)}>
                <Ionicons name="chevron-down" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <View style={styles.modalTitleBlock}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {selectedPass.title}
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  {selectedPass.destination}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  sharePass(selectedPass.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="share-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.passSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Dates</Text>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                      {formatDate(selectedPass.startDate)}
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                      to {formatDate(selectedPass.endDate)}
                    </Text>
                  </View>
                  <View style={styles.totalBlock}>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Paid</Text>
                    <Text style={[styles.totalAmt, { color: colors.primary }]}>
                      ${selectedPass.totalCost.toLocaleString()}
                    </Text>
                  </View>
                </View>
                {selectedPass.travelBuddyRequests > 0 && (
                  <TouchableOpacity
                    style={[styles.buddyBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <Ionicons name="people" size={16} color={colors.primary} />
                    <Text style={[styles.buddyBtnText, { color: colors.primary }]}>
                      {selectedPass.travelBuddyRequests} people want to join your trip
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.itineraryLabel, { color: colors.foreground }]}>Itinerary</Text>
              {selectedPass.cards.length === 0 ? (
                <View style={styles.emptyCards}>
                  <Text style={[styles.emptyCardsText, { color: colors.mutedForeground }]}>
                    No items in this pass
                  </Text>
                </View>
              ) : (
                selectedPass.cards.map((card) => (
                  <TravelCardView key={card.id} card={card} compact={false} />
                ))
              )}
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  archivedHeader: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  empty: {
    alignItems: "center",
    padding: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  modalTitleBlock: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  modalSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  passSummary: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  totalBlock: {
    alignItems: "flex-end",
  },
  totalAmt: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  buddyBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  buddyBtnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  itineraryLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyCards: {
    padding: 40,
    alignItems: "center",
  },
  emptyCardsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
