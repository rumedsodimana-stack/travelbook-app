import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { useApp, TravelDocument } from "@/context/AppContext";

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#DDA0DD", "#F4A261", "#2EC4B6", "#E76F51", "#264653",
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const DOC_CONFIGS: Record<TravelDocument["type"], { icon: string; iconSet: "ion" | "mci"; color: string; label: string }> = {
  passport: { icon: "passport", iconSet: "mci", color: "#1B3A5C", label: "Passport" },
  id: { icon: "card", iconSet: "ion", color: "#0E7C7B", label: "National ID" },
  visa: { icon: "document-text", iconSet: "ion", color: "#6B4EFF", label: "Visa" },
  insurance: { icon: "shield-checkmark", iconSet: "ion", color: "#2EC4B6", label: "Insurance" },
};

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", label: "Edit Profile", desc: "Name, bio, preferences" },
      { icon: "card-outline", label: "Payment Methods", desc: "Cards & digital wallets" },
      { icon: "notifications-outline", label: "Notifications", desc: "Alerts & updates" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: "globe-outline", label: "Language & Currency", desc: "English · USD" },
      { icon: "moon-outline", label: "Appearance", desc: "Light mode" },
      { icon: "lock-closed-outline", label: "Privacy & Security", desc: "Password, 2FA" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle-outline", label: "Help Center", desc: "FAQs & guides" },
      { icon: "chatbubble-outline", label: "Contact Support", desc: "Live chat & email" },
      { icon: "star-outline", label: "Rate TravelBook", desc: "Leave a review" },
    ],
  },
];

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, addDocument, removeDocument } = useApp();
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ type: "passport" as TravelDocument["type"], name: "", number: "", expiryDate: "", country: "" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  if (!user) return null;

  const avatarColor = getAvatarColor(user.name);
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleAddDoc = async () => {
    if (!docForm.name || !docForm.number) return;
    await addDocument(docForm);
    setShowDocModal(false);
    setDocForm({ type: "passport", name: "", number: "", expiryDate: "", country: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveDoc = (docId: string) => {
    Alert.alert("Remove Document", "Are you sure you want to remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removeDocument(docId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 10, paddingBottom: botPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.profileUsername, { color: colors.mutedForeground }]}>@{user.username}</Text>
            <Text style={[styles.profileBio, { color: colors.mutedForeground }]} numberOfLines={2}>
              {user.bio}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{user.followersCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{user.followingCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text>
          </View>
        </View>

        <View style={styles.docsSection}>
          <View style={styles.docsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Travel Documents</Text>
            <TouchableOpacity
              style={[styles.addDocBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowDocModal(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.docsSectionDesc, { color: colors.mutedForeground }]}>
            Stored securely for auto-fill during visa & booking processes
          </Text>

          {user.documents.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyDocs, { borderColor: colors.border }]}
              onPress={() => setShowDocModal(true)}
            >
              <MaterialCommunityIcons name="passport" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyDocsText, { color: colors.mutedForeground }]}>
                Add passport, ID, or visa documents
              </Text>
            </TouchableOpacity>
          ) : (
            user.documents.map((doc) => {
              const cfg = DOC_CONFIGS[doc.type];
              return (
                <View
                  key={doc.id}
                  style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.docIcon, { backgroundColor: cfg.color + "20" }]}>
                    {cfg.iconSet === "ion" ? (
                      <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                    ) : (
                      <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
                    )}
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={[styles.docName, { color: colors.foreground }]}>{doc.name}</Text>
                    <Text style={[styles.docNumber, { color: colors.mutedForeground }]}>
                      {cfg.label} · {doc.number}
                    </Text>
                    {doc.expiryDate && (
                      <Text style={[styles.docExpiry, { color: colors.mutedForeground }]}>
                        Expires {doc.expiryDate}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveDoc(doc.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <View style={[styles.menuIconBg, { backgroundColor: colors.muted }]}>
                      <Ionicons name={item.icon as any} size={18} color={colors.foreground} />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[styles.menuItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                      <Text style={[styles.menuItemDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && (
                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.destructive + "40" }]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDocModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDocModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDocModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Document</Text>
            <TouchableOpacity onPress={handleAddDoc}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DOCUMENT TYPE</Text>
            <View style={styles.typeRow}>
              {(Object.keys(DOC_CONFIGS) as TravelDocument["type"][]).map((dt) => (
                <TouchableOpacity
                  key={dt}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: docForm.type === dt ? colors.primary : colors.card,
                      borderColor: docForm.type === dt ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDocForm((f) => ({ ...f, type: dt }))}
                >
                  <Text style={[styles.typeBtnText, { color: docForm.type === dt ? "#fff" : colors.foreground }]}>
                    {DOC_CONFIGS[dt].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { key: "name", label: "DOCUMENT NAME", placeholder: "e.g. US Passport" },
              { key: "number", label: "DOCUMENT NUMBER", placeholder: "e.g. A12345678" },
              { key: "expiryDate", label: "EXPIRY DATE", placeholder: "e.g. 2030-01-15" },
              { key: "country", label: "ISSUING COUNTRY", placeholder: "e.g. United States" },
            ].map((field) => (
              <View key={field.key}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    value={(docForm as any)[field.key]}
                    onChangeText={(v) => setDocForm((f) => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  profileBio: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  docsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  docsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  addDocBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  docsSectionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
    lineHeight: 18,
  },
  emptyDocs: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    gap: 10,
  },
  emptyDocsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  docNumber: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  docExpiry: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: { flex: 1 },
  menuItemLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  menuItemDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    marginLeft: 60,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
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
  },
  modalSave: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  typeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
