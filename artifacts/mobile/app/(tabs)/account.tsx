import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, TravelDocument, PaymentMethod } from "@/context/AppContext";

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

type ModalKey =
  | "profile"
  | "payment"
  | "notifications"
  | "language"
  | "appearance"
  | "privacy"
  | "help"
  | "contact"
  | "rate"
  | "doc"
  | null;

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "AED", "INR"];
const LANGUAGES = ["English", "Spanish", "French", "Japanese", "Mandarin", "Arabic", "Hindi"];

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, addDocument, removeDocument, logout } = useApp();
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [docForm, setDocForm] = useState({ type: "passport" as TravelDocument["type"], name: "", number: "", expiryDate: "", country: "" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  if (!user) return null;

  const avatarColor = getAvatarColor(user.name);
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleAddDoc = async () => {
    if (!docForm.name || !docForm.number) return;
    await addDocument(docForm);
    setOpenModal(null);
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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  const MENU_SECTIONS: Array<{
    title: string;
    items: { icon: string; label: string; desc: string; modal: ModalKey }[];
  }> = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", label: "Edit Profile", desc: "Name, bio, preferences", modal: "profile" },
        { icon: "card-outline", label: "Payment Methods", desc: `${user.paymentMethods.length} card${user.paymentMethods.length === 1 ? "" : "s"} on file`, modal: "payment" },
        { icon: "notifications-outline", label: "Notifications", desc: "Alerts & updates", modal: "notifications" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "globe-outline", label: "Language & Currency", desc: `${user.language} · ${user.currency}`, modal: "language" },
        { icon: "moon-outline", label: "Appearance", desc: "Light · Dark · System", modal: "appearance" },
        { icon: "lock-closed-outline", label: "Privacy & Security", desc: "Password, 2FA", modal: "privacy" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle-outline", label: "Help Center", desc: "FAQs & guides", modal: "help" },
        { icon: "chatbubble-outline", label: "Contact Support", desc: "Live chat & email", modal: "contact" },
        { icon: "star-outline", label: "Rate TravelBook", desc: "Leave a review", modal: "rate" },
      ],
    },
  ];

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
              onPress={() => setOpenModal("doc")}
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
              onPress={() => setOpenModal("doc")}
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
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setOpenModal(item.modal);
                    }}
                  >
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
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Document modal */}
      <Modal visible={openModal === "doc"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpenModal(null)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <ModalHeader title="Add Document" onClose={() => setOpenModal(null)} onSave={handleAddDoc} colors={colors} />
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

      {/* Profile modal */}
      <ProfileModal visible={openModal === "profile"} onClose={() => setOpenModal(null)} colors={colors} user={user} updateProfile={updateProfile} />

      {/* Payment modal */}
      <PaymentModal visible={openModal === "payment"} onClose={() => setOpenModal(null)} colors={colors} paymentMethods={user.paymentMethods} />

      {/* Notifications modal */}
      <NotificationsModal visible={openModal === "notifications"} onClose={() => setOpenModal(null)} colors={colors} />

      {/* Language & Currency modal */}
      <LanguageCurrencyModal visible={openModal === "language"} onClose={() => setOpenModal(null)} colors={colors} user={user} updateProfile={updateProfile} />

      {/* Appearance modal */}
      <AppearanceModal visible={openModal === "appearance"} onClose={() => setOpenModal(null)} colors={colors} />

      {/* Privacy modal */}
      <PlaceholderModal visible={openModal === "privacy"} onClose={() => setOpenModal(null)} colors={colors} title="Privacy & Security" desc="Password, 2FA, session management — coming soon" icon="lock-closed" />

      {/* Help modal */}
      <PlaceholderModal visible={openModal === "help"} onClose={() => setOpenModal(null)} colors={colors} title="Help Center" desc="FAQs and guides will appear here" icon="help-circle" />

      {/* Contact modal */}
      <PlaceholderModal visible={openModal === "contact"} onClose={() => setOpenModal(null)} colors={colors} title="Contact Support" desc="Live chat and email at support@travelbook.app" icon="chatbubble" />

      {/* Rate modal */}
      <PlaceholderModal visible={openModal === "rate"} onClose={() => setOpenModal(null)} colors={colors} title="Rate TravelBook" desc="Thanks for using TravelBook! Your store rating link goes here." icon="star" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function ModalHeader({
  title,
  onClose,
  onSave,
  colors,
  saveLabel = "Save",
}: {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  colors: ReturnType<typeof useColors>;
  saveLabel?: string;
}) {
  return (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
      {onSave ? (
        <TouchableOpacity onPress={onSave}>
          <Text style={[styles.modalSave, { color: colors.primary }]}>{saveLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
}

function ProfileModal({
  visible,
  onClose,
  colors,
  user,
  updateProfile,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  user: ReturnType<typeof useApp>["user"];
  updateProfile: ReturnType<typeof useApp>["updateProfile"];
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const handleSave = () => {
    updateProfile({ name, username, bio, email });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="Edit Profile" onClose={onClose} onSave={handleSave} colors={colors} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {[
            { key: "name", label: "NAME", value: name, set: setName, placeholder: "Your name" },
            { key: "username", label: "USERNAME", value: username, set: setUsername, placeholder: "username" },
            { key: "email", label: "EMAIL", value: email, set: setEmail, placeholder: "you@email.com" },
            { key: "bio", label: "BIO", value: bio, set: setBio, placeholder: "Tell people about you" },
          ].map((f) => (
            <View key={f.key}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, ...(f.key === "bio" ? { minHeight: 60 } : {}) }]}
                  multiline={f.key === "bio"}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function PaymentModal({
  visible,
  onClose,
  colors,
  paymentMethods,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  paymentMethods: PaymentMethod[];
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="Payment Methods" onClose={onClose} colors={colors} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {paymentMethods.length === 0 ? (
            <Text style={[styles.placeholderDesc, { color: colors.mutedForeground }]}>
              No payment methods yet — add one to book trips faster.
            </Text>
          ) : (
            paymentMethods.map((pm) => (
              <View key={pm.id} style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paymentIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons
                    name={pm.type === "card" ? "card" : pm.type === "paypal" ? "logo-paypal" : "logo-apple"}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentLabel, { color: colors.foreground }]}>
                    {pm.brand ?? "Card"} •••• {pm.last4 ?? "0000"}
                  </Text>
                  {pm.isDefault && (
                    <Text style={[styles.paymentDefault, { color: colors.primary }]}>Default</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            ))
          )}
          <TouchableOpacity style={[styles.addPaymentBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function NotificationsModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [settings, setSettings] = useState({
    push: true,
    email: true,
    buddyRequests: true,
    flightAlerts: true,
    promotions: false,
    weeklyDigest: true,
  });

  const labels: Record<keyof typeof settings, { title: string; desc: string }> = {
    push: { title: "Push Notifications", desc: "Get alerts on this device" },
    email: { title: "Email Notifications", desc: "Important updates via email" },
    buddyRequests: { title: "Travel Buddy Requests", desc: "When someone wants to join your trip" },
    flightAlerts: { title: "Flight & Booking Alerts", desc: "Delays, gate changes, check-in reminders" },
    promotions: { title: "Promotions", desc: "Deals and special offers" },
    weeklyDigest: { title: "Weekly Digest", desc: "Travel inspiration every Sunday" },
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="Notifications" onClose={onClose} colors={colors} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {(Object.keys(settings) as (keyof typeof settings)[]).map((k) => (
            <View
              key={k}
              style={[styles.notifRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{labels[k].title}</Text>
                <Text style={[styles.notifDesc, { color: colors.mutedForeground }]}>{labels[k].desc}</Text>
              </View>
              <Switch
                value={settings[k]}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setSettings((prev) => ({ ...prev, [k]: v }));
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LanguageCurrencyModal({
  visible,
  onClose,
  colors,
  user,
  updateProfile,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  user: ReturnType<typeof useApp>["user"];
  updateProfile: ReturnType<typeof useApp>["updateProfile"];
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="Language & Currency" onClose={onClose} colors={colors} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LANGUAGE</Text>
          <View style={styles.pillRow}>
            {LANGUAGES.map((lang) => {
              const selected = user?.language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateProfile({ language: lang });
                  }}
                >
                  <Text style={[styles.typeBtnText, { color: selected ? "#fff" : colors.foreground }]}>{lang}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CURRENCY</Text>
          <View style={styles.pillRow}>
            {CURRENCIES.map((cur) => {
              const selected = user?.currency === cur;
              return (
                <TouchableOpacity
                  key={cur}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateProfile({ currency: cur });
                  }}
                >
                  <Text style={[styles.typeBtnText, { color: selected ? "#fff" : colors.foreground }]}>{cur}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function AppearanceModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [mode, setMode] = useState<"light" | "dark" | "system">("system");
  const options = [
    { key: "light" as const, label: "Light", icon: "sunny-outline", desc: "Always bright" },
    { key: "dark" as const, label: "Dark", icon: "moon-outline", desc: "Always dark" },
    { key: "system" as const, label: "System", icon: "phone-portrait-outline", desc: "Follow device" },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="Appearance" onClose={onClose} colors={colors} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {options.map((opt) => {
            const selected = mode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode(opt.key);
                }}
              >
                <View style={[styles.modeIconBg, { backgroundColor: selected ? colors.primary : colors.muted }]}>
                  <Ionicons name={opt.icon as any} size={20} color={selected ? "#fff" : colors.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>
            Note: System mode auto-switches with your device. Light/Dark choice persists in a future update.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PlaceholderModal({
  visible,
  onClose,
  colors,
  title,
  desc,
  icon,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title={title} onClose={onClose} colors={colors} />
        <View style={styles.placeholderBody}>
          <Ionicons name={icon as any} size={56} color={colors.border} />
          <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.placeholderDesc, { color: colors.mutedForeground }]}>{desc}</Text>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

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
  statItem: { flex: 1, alignItems: "center" },
  statNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statDivider: { width: 1, height: "100%" },
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
  pillRow: {
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
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  paymentDefault: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  addPaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  addPaymentText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notifDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  modeIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modeDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  placeholderBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  placeholderDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  placeholderHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});
