import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "@/components/primitives/ActionSheet";
import { AvatarDot } from "@/components/primitives/AvatarDot";
import {
  BookmarkIcon,
  CommentIcon,
  ComposeIcon,
  HeartIcon,
  LiveDot,
  ShareIcon,
  VerifiedTick,
} from "@/components/primitives/Icon";
import { PaperTexture } from "@/components/primitives/PaperTexture";
import { Placeholder } from "@/components/primitives/Placeholder";
import { PillBtn } from "@/components/primitives/PillBtn";
import { Stamp } from "@/components/primitives/Stamp";
import { TYPE } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { fetchFeed, likePost, type FeedPost } from "@/lib/social-api";

const STORY_TONES: Array<"terra" | "paper" | "dark"> = [
  "terra",
  "paper",
  "dark",
  "paper",
  "terra",
  "dark",
];

const QUICK_EMOJI = ["😍", "🔥", "✨", "🥲", "👏", "🙌"];

interface StoryTarget {
  post: FeedPost;
  tone: "terra" | "paper" | "dark";
}

export default function HomeScreen() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryTarget | null>(null);
  const [scrolledPast, setScrolledPast] = useState(false);
  const stickyOpacity = useMemo(() => new Animated.Value(0), []);

  const reload = useCallback(async () => {
    try {
      const data = await fetchFeed();
      setPosts(data.posts);
    } catch {
      setPosts([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const todayStr = new Date()
    .toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  const groupedPosts = useMemo(() => groupByDay(posts), [posts]);

  function onScroll(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const y = e.nativeEvent.contentOffset.y;
    const past = y > 220;
    if (past !== scrolledPast) {
      setScrolledPast(past);
      Animated.timing(stickyOpacity, {
        toValue: past ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.appBg, paddingTop: insets.top }]}>
      <PaperTexture />

      {/* Masthead */}
      <View style={[styles.masthead, { borderBottomColor: t.inkHair }]}>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.monoXS, { color: t.inkMute }]}>TRAVELBOOK · {todayStr}</Text>
          <Text style={[TYPE.displayXL, { color: t.ink, marginTop: 4, fontSize: 30 }]}>
            The Journal
          </Text>
        </View>
        <Pressable
          style={[styles.composeBtn, { borderColor: t.ink }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/(tabs)/planner");
          }}
          accessibilityLabel="Compose"
        >
          <ComposeIcon color={t.ink} size={16} />
        </Pressable>
      </View>

      {/* Personalization */}
      <View style={[styles.personalize, { borderBottomColor: t.inkHair }]}>
        <Text style={[TYPE.monoXS, { color: t.inkMute }]}>
          FOR <Text style={{ color: t.terra }}>@DEV</Text> · CULTURE · SLOW PACE · PESCATARIAN
        </Text>
      </View>

      {/* Sticky scroll-up date chip */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyChip,
          { backgroundColor: t.ink, opacity: stickyOpacity, top: insets.top + 12 },
        ]}
      >
        <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>TODAY</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={32}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              Haptics.selectionAsync().catch(() => {});
              await reload();
              setRefreshing(false);
            }}
            tintColor={t.terra}
            title="REFRESHING…"
            titleColor={t.inkMute}
            colors={[t.terra]}
          />
        }
      >
        {/* Stories rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
        >
          <View style={styles.storyCell}>
            <View style={[styles.storyPlus, { borderColor: t.inkSoft }]}>
              <Text style={{ fontSize: 22, color: t.inkMute, lineHeight: 22 }}>+</Text>
            </View>
            <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}>YOU</Text>
          </View>
          {posts.slice(0, 6).map((p, i) => {
            const tone = STORY_TONES[i % STORY_TONES.length];
            const isLive = p.kind === "pass_share" && !!p.pass;
            const viewed = p.storyViewed === true;
            const ringColor = viewed ? t.inkHair : t.terra;
            return (
              <Pressable
                key={`s-${p.id}`}
                style={styles.storyCell}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveStory({ post: p, tone });
                }}
              >
                <View>
                  <AvatarDot size={50} ring ringColor={ringColor} tone={tone} />
                  {isLive ? (
                    <View style={[styles.storyLive, { borderColor: t.appBg }]}>
                      <LiveDot color={t.terra} size={8} />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[TYPE.monoXS, { color: t.inkMute, marginTop: 4 }]}
                  numberOfLines={1}
                >
                  {p.author?.handle?.split(".")[0]?.toUpperCase() ?? "GUEST"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Feed with day dividers */}
        <View style={styles.feed}>
          {groupedPosts.length === 0 ? (
            <View style={[styles.empty, { borderColor: t.inkHair }]}>
              <Text style={[TYPE.displayM, { color: t.ink }]}>No posts yet.</Text>
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginTop: 6 }]}>
                Share a Pass from your Pass tab — it'll appear here.
              </Text>
            </View>
          ) : (
            groupedPosts.map((group, gi) => (
              <React.Fragment key={group.key}>
                <View style={styles.dayDivider}>
                  <View style={[styles.dividerLine, { backgroundColor: t.inkHair }]} />
                  <Text style={[TYPE.monoXS, { color: t.inkMute, fontWeight: "600" }]}>
                    {group.label}
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: t.inkHair }]} />
                </View>
                {group.posts.map((p, i) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    authorTone={STORY_TONES[(gi * 3 + i) % STORY_TONES.length]}
                  />
                ))}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
    </View>
  );
}

// ─────────────────────────────────────────────────── PostCard

function PostCard({
  post,
  authorTone,
}: {
  post: FeedPost;
  authorTone: "terra" | "paper" | "dark";
}) {
  const { t } = useTheme();
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [saved, setSaved] = useState(!!post.savedByMe);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function toggleLike() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLiked((v) => !v);
    likePost(post.id).catch(() => {});
  }

  function chooseEmoji(e: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEmoji(e);
    setEmojiPickerOpen(false);
    setLiked(true);
  }

  function toggleSave() {
    Haptics.selectionAsync().catch(() => {});
    setSaved((v) => !v);
  }

  function openMenu() {
    Haptics.selectionAsync().catch(() => {});
    setMenuOpen(true);
  }

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  const handle = post.author?.handle ?? "this user";
  const menuItems: ActionSheetItem[] = [
    {
      label: saved ? "Unsave post" : "Save post",
      onPress: () => {
        toggleSave();
        flashToast(saved ? "Removed from saved" : "Saved to your collection");
      },
    },
    {
      label: `Mute @${handle}`,
      onPress: () => flashToast(`Muted @${handle}`),
    },
    {
      label: "Hide this post",
      onPress: () => flashToast("Post hidden"),
    },
    {
      label: "Copy link",
      onPress: () => flashToast("Link copied"),
    },
    {
      label: "Report",
      destructive: true,
      onPress: () => flashToast("Reported — thanks"),
    },
  ];

  function submitComment() {
    if (!draftComment.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDraftComment("");
  }

  return (
    <View style={[styles.post, { borderColor: t.inkHair, backgroundColor: t.paperLight }]}>
      {/* Author row — bigger avatar */}
      <View style={styles.postHead}>
        <AvatarDot size={40} tone={authorTone} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
              @{post.author?.handle ?? "guest"}
            </Text>
            {post.authorVerified ? <VerifiedTick color={t.terra} size={13} /> : null}
            {post.kind === "pass_share" ? (
              <Text style={[TYPE.bodyS, { color: t.inkMute, marginLeft: 2 }]}>
                shared a pass
              </Text>
            ) : null}
          </View>
          <Text
            style={[TYPE.monoXS, { color: t.inkMute, marginTop: 2 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {post.kind === "pass_share" && post.pass?.openSeats
              ? `OPEN FOR ${post.pass.openSeats} BUDDIES · ${timeAgo(post.createdAt)}`
              : post.geo
              ? `${post.geo.name.toUpperCase()} · ${timeAgo(post.createdAt)}`
              : `${subtitleFor(post)} · ${timeAgo(post.createdAt)}`}
          </Text>
        </View>
        {post.kind === "pass_share" ? (
          <Stamp label="PASS" kind="rect" rotate={-4} />
        ) : (
          <Pressable
            onPress={openMenu}
            hitSlop={12}
            style={styles.menuBtn}
            accessibilityLabel="Post options"
          >
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "700", fontSize: 22, lineHeight: 22 }]}>
              ···
            </Text>
          </Pressable>
        )}
      </View>

      {post.caption && post.kind !== "pass_share" ? (
        <Text style={[TYPE.body, { color: t.ink, marginTop: 10 }]}>{post.caption}</Text>
      ) : null}

      {post.kind === "pass_share" && post.pass ? <PassSharePreview post={post} /> : null}

      {(post.kind === "photo" || post.kind === "story") && post.photoUrls.length > 0 ? (
        <View style={styles.photoBleed}>
          <Placeholder
            caption={`${(post.author?.handle ?? "travel").toLowerCase()} — travelbook`}
            height={240}
            tone="paper"
          />
        </View>
      ) : null}

      {post.kind === "provider_offer" ? (
        <View style={[styles.providerOffer, { borderColor: t.inkSoft }]}>
          <Text style={[TYPE.monoXS, { color: t.terra }]}>PROVIDER OFFER</Text>
          <Text style={[TYPE.body, { color: t.ink, marginTop: 4 }]}>{post.caption}</Text>
        </View>
      ) : null}

      {/* Reactions row — bigger icons */}
      {post.kind !== "pass_share" ? (
        <View style={[styles.reactions, { borderTopColor: t.inkHair }]}>
          <Pressable
            onPress={toggleLike}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setEmojiPickerOpen(true);
            }}
            delayLongPress={250}
            hitSlop={10}
            style={styles.reactCell}
          >
            {emoji ? (
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            ) : (
              <HeartIcon color={liked ? t.terra : t.ink} size={24} filled={liked} />
            )}
            <Text style={[TYPE.body, { color: liked ? t.terra : t.ink, fontWeight: "600" }]}>
              {(post.likesCount ?? 0) + (liked && !post.likedByMe ? 1 : 0)}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowComments((v) => !v);
            }}
            hitSlop={10}
            style={styles.reactCell}
          >
            <CommentIcon color={showComments ? t.terra : t.ink} size={24} />
            <Text style={[TYPE.body, { color: showComments ? t.terra : t.ink, fontWeight: "600" }]}>
              {post.commentsCount ?? 0}
            </Text>
          </Pressable>
          <Pressable hitSlop={10} style={styles.reactCell}>
            <ShareIcon color={t.ink} size={24} />
            <Text style={[TYPE.body, { color: t.ink, fontWeight: "600" }]}>
              {post.repostsCount ?? 0}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={toggleSave} hitSlop={10} style={styles.reactCell}>
            <BookmarkIcon color={saved ? t.terra : t.ink} size={24} filled={saved} />
          </Pressable>
        </View>
      ) : null}

      {/* Inline comments */}
      {showComments && post.kind !== "pass_share" ? (
        <View style={[styles.comments, { borderTopColor: t.inkHair }]}>
          {(post.sampleComments ?? []).slice(0, 3).map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <AvatarDot size={22} tone="paper" />
              <Text style={[TYPE.bodyS, { color: t.ink, flex: 1 }]}>
                <Text style={{ fontWeight: "600" }}>@{c.handle}</Text>
                {"  "}
                {c.text}
              </Text>
            </View>
          ))}
          <View style={styles.commentComposer}>
            <AvatarDot size={26} tone="terra" />
            <TextInput
              value={draftComment}
              onChangeText={setDraftComment}
              placeholder="Reply…"
              placeholderTextColor={t.inkMute}
              style={[
                TYPE.bodyS,
                styles.commentInput,
                { color: t.ink, borderColor: t.inkHair, backgroundColor: "#fff" },
              ]}
              onSubmitEditing={submitComment}
              returnKeyType="send"
            />
            <Pressable onPress={submitComment} disabled={!draftComment.trim()} hitSlop={8}>
              <Text
                style={[
                  TYPE.monoXS,
                  { color: draftComment.trim() ? t.terra : t.inkMute, fontWeight: "700" },
                ]}
              >
                REPLY
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <EmojiPicker
        visible={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onPick={chooseEmoji}
      />

      <ActionSheet
        visible={menuOpen}
        title={`@${handle}`}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      {toast ? (
        <View style={[styles.toast, { backgroundColor: t.ink }]} pointerEvents="none">
          <Text style={[TYPE.bodyS, { color: "#fff", fontWeight: "500" }]}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────── PassSharePreview

function PassSharePreview({ post }: { post: FeedPost }) {
  const { t } = useTheme();
  const router = useRouter();
  const pass = post.pass!;

  const now = Date.now();
  const startMs = Date.parse(pass.startsOn);
  const endMs = Date.parse(pass.endsOn);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endMs - startMs) / dayMs));

  let stateBadge: { label: string; tone: "live" | "soon" | "later" } = { label: "", tone: "later" };
  if (now >= startMs && now <= endMs) {
    const dayN = Math.max(1, Math.round((now - startMs) / dayMs) + 1);
    stateBadge = { label: `LIVE · DAY ${dayN} OF ${totalDays}`, tone: "live" };
  } else if (startMs > now) {
    const daysOut = Math.round((startMs - now) / dayMs);
    if (daysOut === 0) stateBadge = { label: "STARTS TODAY", tone: "soon" };
    else if (daysOut === 1) stateBadge = { label: "STARTS TOMORROW", tone: "soon" };
    else stateBadge = { label: `STARTS IN ${daysOut} DAYS`, tone: daysOut < 14 ? "soon" : "later" };
  } else {
    const daysSince = Math.round((now - endMs) / dayMs);
    stateBadge = { label: `WRAPPED ${daysSince}D AGO`, tone: "later" };
  }

  return (
    <View>
      <Pressable
        onPress={() => router.push({ pathname: "/pass/[id]/join", params: { id: pass.id } })}
        style={[styles.passPreview, { backgroundColor: t.ink }]}
      >
        <View pointerEvents="none" style={styles.passInnerBorder} />
        <View style={styles.passHeader}>
          <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.55)" }]}>
            PASS · {pass.code}
          </Text>
          {stateBadge.tone === "live" ? (
            <View style={styles.liveBadge}>
              <LiveDot color={t.terra} size={6} />
              <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
                {stateBadge.label}
              </Text>
            </View>
          ) : (
            <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)", fontWeight: "600" }]}>
              {stateBadge.label}
            </Text>
          )}
        </View>
        <Text style={[TYPE.displayM, { color: "#fff", marginTop: 6, fontSize: 18 }]}>
          {pass.title}
        </Text>
        <View style={styles.passMeta}>
          <Text style={[TYPE.monoXS, { color: "rgba(244,237,228,0.7)" }]}>
            {datePill(pass.startsOn)} — {datePill(pass.endsOn)}
          </Text>
          <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
            {totalDays} DAYS
          </Text>
        </View>
        <View style={styles.itineraryChips}>
          <Chip dark>✈ JFK→HND</Chip>
          <Chip dark>🏨 AMAN TOKYO</Chip>
          <Chip dark>6 ACTIVITIES</Chip>
        </View>
      </Pressable>

      <Text style={[TYPE.monoXS, { color: t.inkMute, marginTop: 10 }]}>
        FROM JFK · WITH @THEO
      </Text>

      {pass.openSeats > 0 ? (
        <View style={styles.seatsRow}>
          <View style={[styles.seatsChip, { borderColor: t.terra }]}>
            <Text style={[TYPE.monoXS, { color: t.terra, fontWeight: "600" }]}>
              {pass.openSeats} SEATS OPEN
            </Text>
          </View>
          <View style={[styles.seatsChip, { borderColor: t.inkHair }]}>
            <Text style={[TYPE.monoXS, { color: t.ink }]}>YOUR FIT · 3/4</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.passCtas}>
        <PillBtn
          label="Join as buddy"
          tone="terra"
          fullWidth
          onPress={() => router.push({ pathname: "/pass/[id]/join", params: { id: pass.id } })}
        />
        <PillBtn label="Save" tone="ghost" onPress={() => {}} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────── EmojiPicker

function EmojiPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (e: string) => void;
}) {
  const { t } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={[styles.emojiPicker, { backgroundColor: t.surface, borderColor: t.inkHair }]}>
          {QUICK_EMOJI.map((e) => (
            <Pressable
              key={e}
              onPress={() => onPick(e)}
              style={({ pressed }) => [styles.emojiBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ fontSize: 28 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────── StoryViewer

function StoryViewer({ story, onClose }: { story: StoryTarget | null; onClose: () => void }) {
  const { t } = useTheme();
  if (!story) return null;
  const { post, tone } = story;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.storyBackdrop}>
        <View style={styles.storyTopBar}>
          <View style={[styles.storyProgress, { backgroundColor: t.terra }]} />
        </View>
        <View style={styles.storyHeader}>
          <AvatarDot size={32} ring tone={tone} />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.body, { color: "#fff", fontWeight: "600" }]}>
              @{post.author?.handle ?? "guest"}
            </Text>
            <Text style={[TYPE.monoXS, { color: "rgba(255,255,255,0.6)" }]}>
              {timeAgo(post.createdAt)}
              {post.geo ? ` · ${post.geo.name.toUpperCase()}` : ""}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[TYPE.body, { color: "#fff", fontSize: 24 }]}>×</Text>
          </Pressable>
        </View>
        <View style={styles.storyBody}>
          {post.photoUrls.length > 0 ? (
            <Placeholder caption={`${post.author?.handle ?? "story"} — travelbook`} height={520} tone="paper" />
          ) : (
            <View style={styles.storyText}>
              <Text style={[TYPE.displayL, { color: "#fff" }]}>{post.caption}</Text>
            </View>
          )}
          {post.geo ? (
            <View style={styles.storyGeoChip}>
              <Text style={[TYPE.monoXS, { color: "#fff", fontWeight: "600" }]}>
                📍 {post.geo.name.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.storyFooter}>
          <View style={[styles.storyReply, { borderColor: "rgba(255,255,255,0.3)" }]}>
            <Text style={[TYPE.bodyS, { color: "rgba(255,255,255,0.6)" }]}>
              Send @{post.author?.handle ?? "user"} a note…
            </Text>
          </View>
          <HeartIcon color="#fff" size={26} />
          <ShareIcon color="#fff" size={26} />
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────── helpers

function Chip({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: dark ? "rgba(244,237,228,0.18)" : t.inkHair,
          backgroundColor: dark ? "rgba(244,237,228,0.06)" : "transparent",
        },
      ]}
    >
      <Text
        style={[
          TYPE.monoXS,
          { color: dark ? "rgba(244,237,228,0.9)" : t.ink, fontWeight: "600" },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function subtitleFor(post: FeedPost): string {
  if (post.caption) return post.caption.slice(0, 28).toUpperCase();
  return "TRAVELBOOK";
}
function datePill(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}
function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m}M AGO`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}H AGO`;
  return `${Math.round(h / 24)}D AGO`;
}

function groupByDay(posts: FeedPost[]): Array<{ key: string; label: string; posts: FeedPost[] }> {
  if (posts.length === 0) return [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  function bucketLabel(iso: string): string {
    const d = new Date(iso);
    if (sameDay(d, today)) return "TODAY";
    if (sameDay(d, yesterday)) return "YESTERDAY";
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  }
  const groups: Record<string, FeedPost[]> = {};
  for (const p of posts) {
    const k = bucketLabel(p.createdAt);
    if (!groups[k]) groups[k] = [];
    groups[k]!.push(p);
  }
  return Object.entries(groups).map(([label, posts]) => ({ key: label, label, posts }));
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─────────────────────────────────────────────────── styles

const styles = StyleSheet.create({
  root: { flex: 1 },
  masthead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  personalize: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyChip: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  storiesRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  storyCell: { alignItems: "center", width: 60 },
  storyPlus: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  storyLive: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  feed: { paddingHorizontal: 16, gap: 14 },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 22,
    alignItems: "flex-start",
  },
  dayDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 1 },
  post: { borderWidth: 1, borderRadius: 8, padding: 14 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { paddingHorizontal: 6 },
  photoBleed: { marginTop: 10, marginHorizontal: -14, marginBottom: -2 },
  passPreview: {
    marginTop: 10,
    borderRadius: 6,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  passInnerBorder: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(244,237,228,0.18)",
  },
  passHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  passMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  itineraryChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  seatsRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  seatsChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  passCtas: { flexDirection: "row", gap: 8, marginTop: 12 },
  providerOffer: {
    marginTop: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 12,
  },
  reactions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reactCell: { flexDirection: "row", alignItems: "center", gap: 6 },
  comments: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(10,37,64,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPicker: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  emojiBtn: { padding: 6 },
  storyBackdrop: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 56,
  },
  storyTopBar: { flexDirection: "row", gap: 4 },
  storyProgress: { height: 2, flex: 1, borderRadius: 1 },
  storyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  storyBody: { flex: 1, justifyContent: "center" },
  storyText: { paddingVertical: 60 },
  storyGeoChip: {
    position: "absolute",
    bottom: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  storyFooter: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12 },
  storyReply: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toast: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
