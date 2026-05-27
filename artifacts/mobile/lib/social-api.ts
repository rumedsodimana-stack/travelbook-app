import { devHeaders, getApiBaseUrl } from "./api";
import { MOCK_BUDDY_PREVIEW, MOCK_FEED, USE_MOCK } from "./mock-data";

export interface FeedAuthor {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
}

export interface FeedPass {
  id: string;
  title: string;
  startsOn: string;
  endsOn: string;
  openSeats: number;
  code: string;
}

export interface FeedPost {
  id: string;
  author: FeedAuthor | null;
  pass: FeedPass | null;
  kind: "photo" | "pass_share" | "story" | "provider_offer" | "memory_book";
  caption: string;
  photoUrls: string[];
  visibility: string;
  createdAt: string;
  likesCount: number;
  repostsCount: number;
  commentsCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  /** Author is a verified provider / brand account */
  authorVerified?: boolean;
  /** For story rail: has the current user already viewed this user's latest story */
  storyViewed?: boolean;
  /** Geo location pin shown on photo posts ("Tokyo · Toyosu") */
  geo?: { name: string };
  /** Sample comments — used to render the inline composer with preview */
  sampleComments?: Array<{ id: string; handle: string; text: string }>;
}

export async function fetchFeed(): Promise<{ posts: FeedPost[] }> {
  if (USE_MOCK) return { posts: MOCK_FEED };
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/feed`, {
      headers: devHeaders(),
    });
    if (!res.ok) throw new Error(`fetchFeed failed (${res.status})`);
    const data = await res.json();
    if (!data.posts || data.posts.length === 0) {
      return { posts: MOCK_FEED };
    }
    return data;
  } catch {
    return { posts: MOCK_FEED };
  }
}

export async function likePost(id: string): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`${getApiBaseUrl()}/api/posts/${id}/like`, {
    method: "POST",
    headers: devHeaders(),
  });
}

export interface SharePassInput {
  caption?: string;
  visibility: "private" | "link" | "friends" | "public";
  openSeats?: number;
  seatsClosesAt?: string | null;
}

export async function sharePass(passId: string, input: SharePassInput): Promise<unknown> {
  if (USE_MOCK) return { id: "mock-post", passId, ...input };
  const res = await fetch(`${getApiBaseUrl()}/api/passes/${passId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...devHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`sharePass failed (${res.status})`);
  return await res.json();
}

export interface BuddyPreview {
  pass: {
    id: string;
    title: string;
    startsOn: string;
    endsOn: string;
    openSeats: number;
    totalCost: string;
  };
  items: Array<{ id: string; kind: string; title: string; cost: string | null }>;
  members: Array<{ userId: string; role: string }>;
  fitCheck?: {
    score: number;
    breakdown: {
      pace?: "match" | "soft" | "mismatch";
      budget?: "match" | "soft" | "mismatch";
      mornings?: "match" | "soft" | "mismatch";
      diet?: "match" | "soft" | "mismatch";
    };
  } | null;
}

export async function fetchBuddyPreview(passId: string): Promise<BuddyPreview> {
  if (USE_MOCK) return MOCK_BUDDY_PREVIEW as BuddyPreview;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/passes/${passId}`, {
      headers: devHeaders(),
    });
    if (!res.ok) throw new Error(`fetchBuddyPreview failed (${res.status})`);
    const data = await res.json();
    return {
      pass: data.pass,
      items: data.items,
      members: data.members,
      fitCheck: data.fitCheck ?? null,
    };
  } catch {
    return MOCK_BUDDY_PREVIEW as BuddyPreview;
  }
}

export async function createBuddyRequest(passId: string, message: string): Promise<unknown> {
  if (USE_MOCK) return { id: "mock-req", passId, message, state: "pending" };
  const res = await fetch(`${getApiBaseUrl()}/api/buddy-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...devHeaders() },
    body: JSON.stringify({ passId, message }),
  });
  if (!res.ok) throw new Error(`createBuddyRequest failed (${res.status})`);
  return await res.json();
}
