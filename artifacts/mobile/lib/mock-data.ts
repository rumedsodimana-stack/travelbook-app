/**
 * Mock data for offline / demo mode.
 *
 * The *-api.ts helpers fall back to these when:
 *   - the api-server fetch fails (no DATABASE_URL, server not running, etc.)
 *   - EXPO_PUBLIC_USE_MOCK=true is set
 *
 * Keeps the mobile UX populated end-to-end without needing Postgres.
 */

import type { FeedPost } from "./social-api";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function iso(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

// ────────────────────────────────────────────────────── Passes

export const MOCK_PASSES = {
  live: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      passNo: 2,
      code: "JP-04210925",
      title: "Japan · Cherry Blossom",
      startsOn: iso(-2 * DAY).slice(0, 10),
      endsOn: iso(5 * DAY).slice(0, 10),
      state: "live",
      totalCost: "4820.00",
    },
  ],
  upcoming: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      passNo: 3,
      code: "PT-08611231",
      title: "Lisbon Long Weekend",
      startsOn: iso(28 * DAY).slice(0, 10),
      endsOn: iso(32 * DAY).slice(0, 10),
      state: "upcoming",
      totalCost: "1490.00",
    },
  ],
  drafts: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      passNo: 4,
      code: "IS-22774410",
      title: "Iceland ring road",
      startsOn: iso(60 * DAY).slice(0, 10),
      endsOn: iso(67 * DAY).slice(0, 10),
      state: "draft",
      totalCost: "3120.00",
    },
  ],
  archived: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      passNo: 1,
      code: "ID-01340822",
      title: "Bali Wellness",
      startsOn: iso(-90 * DAY).slice(0, 10),
      endsOn: iso(-82 * DAY).slice(0, 10),
      state: "archived",
      totalCost: "2890.00",
    },
  ],
};

// ────────────────────────────────────────────────────── Pass detail (live Japan trip)

export const MOCK_PASS_DETAIL: Record<
  string,
  { pass: Record<string, unknown>; items: Array<Record<string, unknown>>; members: Array<Record<string, unknown>> }
> = {
  "11111111-1111-4111-8111-111111111111": {
    pass: { ...MOCK_PASSES.live[0]!, aiBuiltAt: iso(-2 * DAY) },
    items: [
      {
        id: "i-jp-flight-out",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "flight",
        state: "confirmed",
        title: "JFK → HND",
        subtitle: "JAL 005 · economy · seat 14A",
        code: "JL005",
        cost: "1180",
        sortAt: iso(-2 * DAY - 5 * HOUR),
        data: {
          carrier: "JAL",
          flightNo: "005",
          depAirport: "JFK",
          arrAirport: "HND",
          depTime: iso(-2 * DAY - 5 * HOUR),
          arrTime: iso(-2 * DAY + 8 * HOUR),
          seat: "14A",
          fare: "economy",
        },
      },
      {
        id: "i-jp-stay",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "stay",
        state: "confirmed",
        title: "Aman Tokyo",
        subtitle: "1-5-6 Otemachi, Chiyoda, Tokyo · Park view",
        code: "411",
        cost: "1850",
        sortAt: iso(-2 * DAY + 9 * HOUR),
        data: {
          name: "Aman Tokyo",
          address: "1-5-6 Otemachi, Chiyoda, Tokyo",
          checkIn: iso(-2 * DAY + 9 * HOUR),
          checkOut: iso(5 * DAY - 4 * HOUR),
          guests: 2,
          view: "Park",
        },
      },
      {
        id: "i-jp-act-1",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "activity",
        state: "confirmed",
        title: "teamLab Planets",
        subtitle: "Toyosu, Tokyo",
        code: "CULTURE",
        cost: "56",
        sortAt: iso(2 * HOUR),
        data: {
          name: "teamLab Planets",
          venue: "Toyosu, Tokyo",
          starts: iso(2 * HOUR),
          ends: iso(4 * HOUR),
          tickets: 2,
        },
      },
      {
        id: "i-jp-dining",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "dining",
        state: "confirmed",
        title: "Den",
        subtitle: "Modern Kaiseki · Jingumae, Tokyo",
        cost: "520",
        sortAt: iso(8 * HOUR),
        data: {
          name: "Den",
          venue: "Jingumae, Tokyo",
          starts: iso(8 * HOUR),
          ends: iso(10.5 * HOUR),
          tickets: 2,
        },
      },
      {
        id: "i-jp-transit",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "transit",
        state: "draft",
        title: "Shinkansen · Tokyo → Kyoto",
        subtitle: "Nozomi 17 · car 7 · seat 12D",
        code: "Nozomi 17",
        cost: "190",
        sortAt: iso(2 * DAY),
        data: {
          carrier: "Shinkansen",
          service: "Nozomi 17",
          depStation: "Tokyo",
          arrStation: "Kyoto",
          depTime: iso(2 * DAY),
          arrTime: iso(2 * DAY + 2 * HOUR + 14 * 60 * 1000),
          seat: "12D",
        },
      },
      {
        id: "i-jp-flight-ret",
        passId: "11111111-1111-4111-8111-111111111111",
        kind: "flight",
        state: "draft",
        title: "HND → JFK",
        subtitle: "JAL 006 · economy · seat 22C",
        code: "JL006",
        cost: "1180",
        sortAt: iso(5 * DAY - 3 * HOUR),
        data: {
          carrier: "JAL",
          flightNo: "006",
          depAirport: "HND",
          arrAirport: "JFK",
          depTime: iso(5 * DAY - 3 * HOUR),
          arrTime: iso(5 * DAY + 10 * HOUR),
          seat: "22C",
          fare: "economy",
        },
      },
    ],
    members: [
      { userId: "00000000-0000-4000-8000-00000000abcd", role: "owner", handle: "dev", name: "Dev User" },
      { userId: "00000000-0000-4000-8000-deadbeef0001", role: "holder", handle: "theo", name: "Theo H." },
    ],
  },
};

// ────────────────────────────────────────────────────── Alternates

export const MOCK_ALTERNATES: Record<string, Array<Record<string, unknown>>> = {
  "i-jp-flight-out": [
    {
      id: "alt-1",
      itemId: "i-jp-flight-out",
      rank: 2,
      data: { carrier: "ANA", flightNo: "109", depAirport: "JFK", arrAirport: "HND" },
      tags: ["CHEAPER", "EARLIER", "DIRECT"],
      deltaCost: "-80",
      deltaMinutes: -210,
      score: 0.88,
    },
    {
      id: "alt-2",
      itemId: "i-jp-flight-out",
      rank: 3,
      data: { carrier: "United", flightNo: "79", depAirport: "JFK", arrAirport: "NRT" },
      tags: ["CHEAPER"],
      deltaCost: "-400",
      deltaMinutes: 35,
      score: 0.74,
    },
    {
      id: "alt-3",
      itemId: "i-jp-flight-out",
      rank: 4,
      data: { carrier: "JAL", flightNo: "007", depAirport: "JFK", arrAirport: "HND" },
      tags: ["RED-EYE", "CHEAPER", "SAME AIRLINE"],
      deltaCost: "-200",
      deltaMinutes: 540,
      score: 0.66,
    },
  ],
};

// ────────────────────────────────────────────────────── Feed

export const MOCK_FEED: FeedPost[] = [
  {
    id: "p-1",
    author: {
      id: "00000000-0000-4000-8000-deadbeef0002",
      handle: "lila.h",
      name: "Lila H.",
      avatarUrl: null,
    },
    kind: "pass_share",
    caption: "Sakura with Theo. Opening 2 seats for week three if anyone's keen.",
    photoUrls: [],
    pass: {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Japan · Cherry Blossom",
      startsOn: iso(-2 * DAY).slice(0, 10),
      endsOn: iso(5 * DAY).slice(0, 10),
      openSeats: 2,
      code: "JP-04210925",
    },
    visibility: "friends",
    createdAt: iso(-2 * HOUR),
    likesCount: 24,
    repostsCount: 3,
    commentsCount: 5,
    likedByMe: false,
    storyViewed: false,
    sampleComments: [
      { id: "c-6", handle: "mei.k", text: "i can do week 3! 🌸" },
      { id: "c-7", handle: "ana.b", text: "saving for next year" },
    ],
  },
  {
    id: "p-2",
    author: {
      id: "00000000-0000-4000-8000-deadbeef0003",
      handle: "mei.k",
      name: "Mei K.",
      avatarUrl: null,
    },
    kind: "photo",
    caption: "Toyosu at 11am — water everywhere, no edges.",
    photoUrls: ["mock://teamlab.jpg"],
    pass: null,
    visibility: "public",
    createdAt: iso(-6 * HOUR),
    likesCount: 41,
    repostsCount: 7,
    commentsCount: 12,
    likedByMe: true,
    savedByMe: false,
    storyViewed: true,
    geo: { name: "Tokyo · Toyosu" },
    sampleComments: [
      { id: "c-1", handle: "lila.h", text: "stop. this is so good." },
      { id: "c-2", handle: "ravi.s", text: "the reflections!! 🙌" },
      { id: "c-3", handle: "theo", text: "added to my list" },
    ],
  },
  {
    id: "p-3",
    author: {
      id: "00000000-0000-4000-8000-deadbeef0004",
      handle: "sora.tours",
      name: "Sora Tours",
      avatarUrl: null,
    },
    kind: "provider_offer",
    caption: "Spring drop: 9-day cherry blossom trail, $3,480",
    photoUrls: [],
    pass: null,
    visibility: "public",
    createdAt: iso(-1 * DAY),
    likesCount: 8,
    repostsCount: 1,
    commentsCount: 2,
    authorVerified: true,
    storyViewed: true,
    sampleComments: [
      { id: "c-4", handle: "mei.k", text: "is the april date confirmed?" },
      { id: "c-5", handle: "ana.b", text: "love sora's itineraries" },
    ],
  },
];

// ────────────────────────────────────────────────────── Inbox

export const MOCK_INBOX = {
  notifications: [
    {
      id: "n-1",
      userId: "00000000-0000-4000-8000-00000000abcd",
      kind: "time_nudge",
      title: "Time to head to teamLab Planets",
      body: "Leave-by in 38 min · 12 min taxi from Aman Tokyo.",
      deepLink: "/pass/11111111-1111-4111-8111-111111111111",
      sentAt: iso(-12 * 60 * 1000),
      readAt: null,
    },
    {
      id: "n-2",
      userId: "00000000-0000-4000-8000-00000000abcd",
      kind: "buddy_request",
      title: "Mei wants to join your Japan pass",
      body: "Fit: 3/4 match. Tap to review.",
      deepLink: "/pass/11111111-1111-4111-8111-111111111111",
      sentAt: iso(-4 * HOUR),
      readAt: null,
    },
    {
      id: "n-3",
      userId: "00000000-0000-4000-8000-00000000abcd",
      kind: "reshuffle",
      title: "AI swapped your hotel",
      body: "Aman fully booked → Park Hyatt, same dates, $40 less.",
      deepLink: "/pass/11111111-1111-4111-8111-111111111111",
      sentAt: iso(-1 * DAY),
      readAt: iso(-12 * HOUR),
    },
  ],
  unreadCount: 2,
};

// ────────────────────────────────────────────────────── Buddy preview

export const MOCK_BUDDY_PREVIEW = {
  pass: {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Japan · Cherry Blossom",
    startsOn: iso(-2 * DAY).slice(0, 10),
    endsOn: iso(5 * DAY).slice(0, 10),
    openSeats: 2,
    totalCost: "4820.00",
  },
  items: MOCK_PASS_DETAIL["11111111-1111-4111-8111-111111111111"]!.items.map((it) => ({
    id: it.id as string,
    kind: it.kind as string,
    title: it.title as string,
    cost: it.cost as string,
  })),
  members: MOCK_PASS_DETAIL["11111111-1111-4111-8111-111111111111"]!.members,
  fitCheck: {
    score: 0.75,
    breakdown: {
      pace: "match" as const,
      budget: "match" as const,
      mornings: "soft" as const,
      diet: "match" as const,
    },
  },
};

// ────────────────────────────────────────────────────── Flag

export const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK === "true" ||
  process.env.EXPO_PUBLIC_USE_MOCK === "1";
