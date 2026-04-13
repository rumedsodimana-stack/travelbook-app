import { Ionicons, Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { usePlanner } from "@/context/PlannerContext";
import { StoryBubble } from "@/components/StoryBubble";
import { PostCard } from "@/components/PostCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, posts, stories, toggleLike, markStorySeen } = useApp();
  const { requestJoinTrip } = usePlanner();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const userStory = {
    id: "my_story",
    authorId: user?.id ?? "",
    authorName: user?.name ?? "You",
    authorUsername: user?.username ?? "",
    image: "",
    seen: false,
    createdAt: new Date().toISOString(),
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.appHeader, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>TravelBook</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Feather name="search" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        <StoryBubble
          story={userStory}
          isUser
          onPress={() => {}}
        />
        {stories.map((story) => (
          <StoryBubble
            key={story.id}
            story={story}
            onPress={() => markStorySeen(story.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Feed</Text>
        <TouchableOpacity style={[styles.newPostBtn, { backgroundColor: colors.primary }]}>
          <Feather name="edit-2" size={14} color="#fff" />
          <Text style={styles.newPostText}>New Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={() => toggleLike(item.id)}
            onPassPress={item.travelPassId ? () => requestJoinTrip(item.travelPassId!) : undefined}
          />
        )}
        contentContainerStyle={{ paddingBottom: botPad + 90 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  headerBtn: {
    padding: 6,
  },
  storiesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  newPostText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
