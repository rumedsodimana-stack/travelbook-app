import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Post } from "@/context/AppContext";

interface Props {
  post: Post;
  onLike: () => void;
  onPassPress?: () => void;
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

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function PostCard({ post, onLike, onPassPress }: Props) {
  const colors = useColors();
  const avatarColor = getAvatarColor(post.authorName);
  const initials = post.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>
              {post.authorName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                @{post.authorUsername}
              </Text>
              {post.location && (
                <>
                  <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
                  <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {" "}{post.location}
                  </Text>
                </>
              )}
            </View>
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(post.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

      {post.travelPassId && (
        <TouchableOpacity
          style={[styles.passCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
          onPress={onPassPress}
          activeOpacity={0.8}
        >
          <View style={[styles.passIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="passport" size={16} color="#fff" />
          </View>
          <View style={styles.passInfo}>
            <Text style={[styles.passLabel, { color: colors.primary }]}>Travel Pass Shared</Text>
            <Text style={[styles.passHint, { color: colors.mutedForeground }]}>Tap to view itinerary & join</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={post.isLiked ? colors.accent : colors.mutedForeground}
          />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {post.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Feather name="message-circle" size={19} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {post.comments}
          </Text>
        </TouchableOpacity>
        {post.travelPassId && (
          <TouchableOpacity style={styles.action} onPress={onPassPress}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionCount, { color: colors.primary }]}>Join</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.action}>
          <Feather name="send" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    padding: 14,
    paddingBottom: 0,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initials: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  passIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  passInfo: {
    flex: 1,
  },
  passLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  passHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 20,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
