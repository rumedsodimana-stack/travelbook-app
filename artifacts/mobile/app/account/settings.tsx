import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { AvatarDot } from "@/components/primitives/AvatarDot";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { ScreenHeader } from "@/components/primitives/ScreenHeader";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(false);
  const [shareOn, setShareOn] = useState(false);

  const signOutItems: ActionSheetItem[] = [
    {
      label: "Sign out",
      destructive: true,
      onPress: () => signOut(),
    },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.appBg }]}>
      <PaperTexture />

      <View style={styles.headRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>← BACK</Text>
        </Pressable>
      </View>

      <ScreenHeader overline="ACCOUNT · SETTINGS" title="Tune the dials." />

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60 }}>
        {/* Profile mini-card */}
        <View style={[styles.profileCard, { borderColor: t.inkHair, backgroundColor: t.surface }]}>
          <AvatarDot size={44} ring tone="terra" />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
              {user?.name ?? "Dev User"}
            </Text>
            <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}>
              @{user?.handle ?? "dev"} · {user?.email ?? "dev@travelbook.local"}
            </Text>
          </View>
          <Stamp label="EDIT" kind="rect" />
        </View>

        <Group title="Region">
          <Item label="Currency" value="USD" onPress={() => {}} />
          <Item label="Language" value="English" onPress={() => {}} />
          <Item label="Timezone" value="System default" onPress={() => {}} />
        </Group>

        <Group title="Notifications">
          <Toggle
            label="Push notifications"
            sub="Time-nudges, reshuffle, buddy requests"
            value={pushOn}
            onChange={setPushOn}
          />
          <Toggle
            label="Email digest"
            sub="Weekly summary, never marketing"
            value={emailOn}
            onChange={setEmailOn}
          />
        </Group>

        <Group title="Privacy">
          <Item label="Profile visibility" value="Friends" onPress={() => {}} />
          <Toggle
            label="Share trip stats"
            sub="Show country count + buddies on your profile"
            value={shareOn}
            onChange={setShareOn}
          />
          <Item
            label="Document encryption"
            value="STUB · v1.5 KMS"
            badge="V1.5"
          />
        </Group>

        <Group title="Subscription">
          <Item
            label="Plan"
            value="Free"
            cta="Upgrade"
            onPress={() => {}}
          />
        </Group>

        <Group title="Support">
          <Item label="Help center" cta="Open" onPress={() => {}} />
          <Item label="Send feedback" cta="Open" onPress={() => {}} />
          <Item label="Terms & privacy" cta="Open" onPress={() => {}} />
        </Group>

        <Group title="Account" muted>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setSignOutOpen(true);
            }}
            style={({ pressed }) => [
              styles.itemRow,
              { borderBottomColor: t.inkHair, borderBottomWidth: 0, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.body, { color: t.stampRed }]}>Sign out</Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>
                Clear local state on this device
              </Text>
            </View>
            <Text style={[TYPE.monoXS, { color: t.stampRed, fontWeight: "700" }]}>SIGN OUT →</Text>
          </Pressable>
        </Group>

        <Text style={[TYPE.monoXS, { color: t.inkMute, textAlign: "center", marginTop: 16 }]}>
          TRAVELBOOK · V1.0.0 · BUILT WITH CLAUDE
        </Text>
      </ScrollView>

      <ActionSheet
        visible={signOutOpen}
        title="Sign out of TravelBook?"
        items={signOutItems}
        onClose={() => setSignOutOpen(false)}
      />
    </SafeAreaView>
  );
}

function Group({ title, children, muted }: { title: string; children: React.ReactNode; muted?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={[TYPE.monoXS, { color: t.inkMute, marginBottom: 8, fontWeight: "600" }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.box,
          {
            borderColor: muted ? t.stampRed : t.inkHair,
            backgroundColor: t.surface,
            opacity: muted ? 0.9 : 1,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Item({
  label,
  value,
  cta,
  badge,
  onPress,
}: {
  label: string;
  value?: string;
  cta?: string;
  badge?: string;
  onPress?: () => void;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.itemRow,
        { borderBottomColor: t.inkHair, opacity: pressed && onPress ? 0.6 : 1 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.body, { color: t.ink }]}>{label}</Text>
      </View>
      {badge ? <Stamp label={badge} kind="rect" /> : null}
      {value ? (
        <Text style={[TYPE.bodyS, { color: t.inkMute, marginRight: cta ? 8 : 0 }]}>
          {value}
        </Text>
      ) : null}
      {cta ? (
        <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
          {cta.toUpperCase()} →
        </Text>
      ) : onPress ? (
        <Text style={[TYPE.monoXS, { color: t.inkMute }]}>›</Text>
      ) : null}
    </Pressable>
  );
}

function Toggle({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useTheme();
  return (
    <View style={[styles.itemRow, { borderBottomColor: t.inkHair }]}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[TYPE.body, { color: t.ink }]}>{label}</Text>
        {sub ? (
          <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 2 }]}>{sub}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync().catch(() => {});
          onChange(v);
        }}
        trackColor={{ false: t.inkHair, true: t.terra }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRow: { paddingTop: 8, paddingHorizontal: 22 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },
  box: { borderWidth: 1, borderRadius: 14 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
