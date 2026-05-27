import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackBar } from "@/components/primitives/BackBar";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { PillBtn } from "@/components/primitives/PillBtn";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { DEV_USER_ID, useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

const HOLDS = [
  { icon: "🪪", label: "Passport + ID scans", sub: "Encrypted at rest · KMS-wrapped keys" },
  { icon: "✈", label: "Trip details", sub: "Flights, stays, activities, dining" },
  { icon: "💳", label: "Payment methods", sub: "Tokenized via your bank · never raw" },
  { icon: "🤝", label: "Friends + buddies", sub: "Profile is friends-only by default" },
];

export default function SignupScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("dev@travelbook.local");
  const [busy, setBusy] = useState<"apple" | "google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function continueAs(method: "apple" | "google" | "email") {
    if (method === "email" && !email.includes("@")) {
      setError("Enter a valid email.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setBusy(method);
    setError(null);
    Haptics.selectionAsync().catch(() => {});
    // v1 mock — instant sign-in
    await signIn({ id: DEV_USER_ID, email, handle: "dev", name: "Dev User" });
    if (method === "email") {
      setEmailSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => router.push("/(onboarding)/prefs"), 800);
    } else {
      router.push("/(onboarding)/prefs");
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />
      <BackBar label="WELCOME" fallback="/(onboarding)/welcome" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}>
        <ScreenHeader overline="STEP 02 OF 06" title="Sign in." />

        {/* OAuth row */}
        <View style={styles.methods}>
          <Pressable
            onPress={() => continueAs("apple")}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.oauthBtn,
              {
                backgroundColor: t.ink,
                opacity: busy === "apple" ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}></Text>
            <Text style={[TYPE.body, { color: "#fff", fontWeight: "600" }]}>
              {busy === "apple" ? "Signing in…" : "Continue with Apple"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => continueAs("google")}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.oauthBtn,
              {
                backgroundColor: t.surface,
                borderColor: t.inkHair,
                borderWidth: 1,
                opacity: busy === "google" ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>G</Text>
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
              {busy === "google" ? "Signing in…" : "Continue with Google"}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: t.inkHair }]} />
            <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>OR EMAIL</Text>
            <View style={[styles.line, { backgroundColor: t.inkHair }]} />
          </View>

          <View style={[styles.inputWrap, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>✉</Text>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
                setEmailSent(false);
              }}
              placeholder="you@email.com"
              placeholderTextColor={t.inkMute}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[TYPE.body, { color: t.ink, flex: 1 }]}
              editable={!busy}
            />
          </View>

          {error ? (
            <Text style={[TYPE.bodyS, { color: t.stampRed }]}>{error}</Text>
          ) : null}

          {emailSent ? (
            <View style={[styles.successBanner, { borderColor: t.terra }]}>
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
                ✓ MAGIC LINK SENT
              </Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 4 }]}>
                Check your inbox · expires in 10 minutes.
              </Text>
            </View>
          ) : (
            <PillBtn
              label={busy === "email" ? "Sending…" : "Send magic link"}
              tone="terra"
              fullWidth
              disabled={!!busy || !email.includes("@")}
              onPress={() => continueAs("email")}
            />
          )}
        </View>

        {/* What we'll hold — load-bearing trust */}
        <View style={[styles.holdsCard, { borderColor: t.terra }]}>
          <View style={styles.holdsHead}>
            <Stamp label="ENCRYPTED" kind="rect" />
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "700" }]}>
              WHAT WE'LL HOLD
            </Text>
          </View>
          {HOLDS.map((h) => (
            <View key={h.label} style={[styles.holdRow, { borderBottomColor: t.inkHair }]}>
              <Text style={{ fontSize: 22 }}>{h.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.body, { color: t.ink, fontWeight: "500" }]}>{h.label}</Text>
                <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{h.sub}</Text>
              </View>
            </View>
          ))}
          <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 12 }]}>
            NO ADS · NEVER SOLD · PROFILE IS FRIENDS-ONLY BY DEFAULT
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  methods: { gap: 12, marginTop: 6 },
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    paddingVertical: 14,
    minHeight: 44,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  line: { flex: 1, height: 1 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  successBanner: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  holdsCard: {
    marginTop: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  holdsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  holdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
