import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, Post } from "@/context/AppContext";
import { usePlanner } from "@/context/PlannerContext";
import { StoryBubble } from "@/components/StoryBubble";
import { PostCard } from "@/components/PostCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, posts, stories, toggleLike, markStorySeen, addPost } = useApp();
  const { requestJoinTrip, passes } = usePlanner();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userStory = {
    id: "my_story",
    authorId: user?.id ?? "",
    authorName: user?.name ?? "You",
    authorUsername: user?.username ?? "",
    image: "",
    seen: false,
    createdAt: new Date().toISOString(),
  };

  const handleSharePost = async (post: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${post.authorName} on TravelBook: ${post.content}${post.location ? ` — ${post.location}` : ""}`,
      });
    } catch {
      // user dismissed
    }
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.appHeader, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>TravelBook</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setSearchOpen(true)}>
            <Feather name="search" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setNotificationsOpen(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        <StoryBubble story={userStory} isUser onPress={() => Alert.alert("Story", "Tap + to add your story (placeholder)")} />
        {stories.map((story) => (
          <StoryBubble key={story.id} story={story} onPress={() => markStorySeen(story.id)} />
        ))}
      </ScrollView>

      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Feed</Text>
        <TouchableOpacity
          style={[styles.newPostBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.selectionAsync();
            setComposerOpen(true);
          }}
        >
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
            onComment={() => setCommentsPost(item)}
            onShare={() => handleSharePost(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: botPad + 90 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      />

      <PostComposerModal
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        colors={colors}
        user={user}
        passes={passes}
        addPost={addPost}
      />

      <CommentsModal
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        colors={colors}
      />

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} colors={colors} posts={posts} />

      <NotificationsCenterModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} colors={colors} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Post composer
// ─────────────────────────────────────────────────────────────

function PostComposerModal({
  visible,
  onClose,
  colors,
  user,
  passes,
  addPost,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  user: ReturnType<typeof useApp>["user"];
  passes: ReturnType<typeof usePlanner>["passes"];
  addPost: ReturnType<typeof useApp>["addPost"];
}) {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [selectedPassId, setSelectedPassId] = useState<string | undefined>(undefined);

  const handlePost = () => {
    if (!content.trim() || !user) return;
    const tags = tagsRaw
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    addPost({
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      content: content.trim(),
      images: [],
      location: location.trim() || undefined,
      tags,
      travelPassId: selectedPassId,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setContent("");
    setLocation("");
    setTagsRaw("");
    setSelectedPassId(undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Post</Text>
          <TouchableOpacity onPress={handlePost} disabled={!content.trim()}>
            <Text style={[styles.modalAction, { color: content.trim() ? colors.primary : colors.mutedForeground }]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.composerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your travel moment..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              style={[styles.composerText, { color: colors.foreground }]}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LOCATION</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Tokyo, Japan"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TAGS</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="hash" size={16} color={colors.mutedForeground} />
            <TextInput
              value={tagsRaw}
              onChangeText={setTagsRaw}
              placeholder="travel SpringTrip findbuddy"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>

          {passes.length > 0 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ATTACH TRAVEL PASS (optional)</Text>
              <View style={styles.passOptions}>
                <TouchableOpacity
                  style={[
                    styles.passOption,
                    {
                      backgroundColor: !selectedPassId ? colors.primary : colors.card,
                      borderColor: !selectedPassId ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPassId(undefined)}
                >
                  <Text style={{ color: !selectedPassId ? "#fff" : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                    None
                  </Text>
                </TouchableOpacity>
                {passes.slice(0, 6).map((p) => {
                  const selected = selectedPassId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.passOption,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedPassId(p.id)}
                    >
                      <Text
                        style={{ color: selected ? "#fff" : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}
                        numberOfLines={1}
                      >
                        {p.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────

const MOCK_COMMENTS: Record<string, { id: string; author: string; text: string; time: string }[]> = {
  default: [
    { id: "c1", author: "Mia Chen", text: "This is amazing! 🎉", time: "2h" },
    { id: "c2", author: "Luca Rossi", text: "Adding to my bucket list right now", time: "1h" },
    { id: "c3", author: "Zara Ahmed", text: "Wait — what was your favourite ramen spot?", time: "45m" },
  ],
};

function CommentsModal({
  post,
  onClose,
  colors,
}: {
  post: Post | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<typeof MOCK_COMMENTS["default"]>([]);

  React.useEffect(() => {
    if (post) {
      setComments(MOCK_COMMENTS.default.slice(0, post.comments));
      setDraft("");
    }
  }, [post]);

  if (!post) return null;

  const handlePost = () => {
    if (!draft.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), author: "You", text: draft.trim(), time: "now" },
    ]);
    setDraft("");
  };

  return (
    <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={[styles.commentPostHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.commentPostAuthor, { color: colors.foreground }]}>{post.authorName}</Text>
            <Text style={[styles.commentPostText, { color: colors.foreground }]}>{post.content}</Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Feather name="message-circle" size={32} color={colors.border} />
              <Text style={[styles.emptyCommentsText, { color: colors.mutedForeground }]}>
                No comments yet. Be the first.
              </Text>
            </View>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.commentAvatarText}>{c.author[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{c.author}</Text>
                    <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>{c.time}</Text>
                  </View>
                  <Text style={[styles.commentText, { color: colors.foreground }]}>{c.text}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.commentComposer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={[styles.commentInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.commentInput, { color: colors.foreground }]}
            />
          </View>
          <TouchableOpacity onPress={handlePost} disabled={!draft.trim()}>
            <Ionicons name="send" size={22} color={draft.trim() ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Header search & notifications
// ─────────────────────────────────────────────────────────────

function SearchModal({
  visible,
  onClose,
  colors,
  posts,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  posts: Post[];
}) {
  const [q, setQ] = useState("");
  const matches = q.trim()
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(q.toLowerCase()) ||
          p.authorName.toLowerCase().includes(q.toLowerCase()) ||
          (p.location ?? "").toLowerCase().includes(q.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
      )
    : [];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Search</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ padding: 16 }}>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder="Search posts, people, tags..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {q.trim() && matches.length === 0 && (
            <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>
              No results for "{q}"
            </Text>
          )}
          {matches.map((p) => (
            <View key={p.id} style={[styles.searchHit, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.searchHitAuthor, { color: colors.foreground }]}>
                {p.authorName} · @{p.authorUsername}
              </Text>
              <Text style={[styles.searchHitContent, { color: colors.mutedForeground }]} numberOfLines={2}>
                {p.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const MOCK_NOTIFICATIONS = [
  { id: "n1", icon: "people", title: "Mia Chen wants to join your trip", time: "5m", body: "Japan Spring Adventure" },
  { id: "n2", icon: "airplane", title: "Flight check-in opens", time: "2h", body: "United UA837 — JFK → NRT" },
  { id: "n3", icon: "heart", title: "Luca Rossi liked your post", time: "1h", body: "Santorini sunsets..." },
  { id: "n4", icon: "alert-circle", title: "Visa documentation reminder", time: "1d", body: "Upload your passport scan" },
];

function NotificationsCenterModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
          {MOCK_NOTIFICATIONS.map((n) => (
            <View key={n.id} style={[styles.notifCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.notifIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name={n.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifCardTitle, { color: colors.foreground }]}>{n.title}</Text>
                <Text style={[styles.notifCardBody, { color: colors.mutedForeground }]}>{n.body}</Text>
              </View>
              <Text style={[styles.notifCardTime, { color: colors.mutedForeground }]}>{n.time}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerBtn: { padding: 6 },
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

  // Modals
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
  modalAction: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
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
  composerBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 140,
  },
  composerText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    minHeight: 110,
  },
  passOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  passOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    maxWidth: 200,
  },

  // Comments
  commentPostHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  commentPostAuthor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  commentPostText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  emptyComments: {
    alignItems: "center",
    padding: 40,
    gap: 10,
  },
  emptyCommentsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  commentTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  commentText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  commentInputBox: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  commentInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  // Search
  searchHit: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchHitAuthor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  searchHitContent: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  placeholderHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 30,
  },

  // Notifications
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notifCardTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  notifCardBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  notifCardTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
