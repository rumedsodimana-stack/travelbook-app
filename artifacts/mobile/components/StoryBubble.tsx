import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Story } from "@/context/AppContext";

interface Props {
  story: Story;
  isUser?: boolean;
  onPress: () => void;
}

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#DDA0DD", "#F4A261", "#2EC4B6", "#E76F51", "#264653",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function StoryBubble({ story, isUser, onPress }: Props) {
  const colors = useColors();
  const avatarColor = getAvatarColor(story.authorName);
  const initials = story.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.ring,
          { borderColor: story.seen ? colors.border : colors.primary },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          {isUser ? (
            <Ionicons name="add" size={20} color="#fff" />
          ) : (
            <Text style={styles.initials}>{initials}</Text>
          )}
        </View>
      </View>
      <Text
        style={[styles.name, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {isUser ? "Your Story" : story.authorUsername}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 68,
    marginHorizontal: 4,
  },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
});
