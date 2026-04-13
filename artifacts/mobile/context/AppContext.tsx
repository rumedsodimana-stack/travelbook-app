import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserType = "consumer" | "provider";
export type ConsumerType = "solo" | "couple" | "family" | "group";
export type ProviderType =
  | "accommodation"
  | "transportation"
  | "flights"
  | "insurance"
  | "visa"
  | "entertainment"
  | "events"
  | "activities"
  | "dining"
  | "tours";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  userType: UserType;
  consumerType?: ConsumerType;
  providerType?: ProviderType;
  bio: string;
  followersCount: number;
  followingCount: number;
  currency: string;
  language: string;
  paymentMethods: PaymentMethod[];
  documents: TravelDocument[];
}

export interface PaymentMethod {
  id: string;
  type: "card" | "paypal" | "apple_pay";
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface TravelDocument {
  id: string;
  type: "passport" | "id" | "visa" | "insurance";
  name: string;
  number: string;
  expiryDate: string;
  country?: string;
  uploadedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  travelPassId?: string;
  location?: string;
  tags: string[];
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  image: string;
  seen: boolean;
  createdAt: string;
}

interface AppContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  posts: Post[];
  stories: Story[];
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addPost: (post: Omit<Post, "id" | "likes" | "comments" | "isLiked" | "createdAt">) => void;
  toggleLike: (postId: string) => void;
  markStorySeen: (storyId: string) => void;
  addDocument: (doc: Omit<TravelDocument, "id" | "uploadedAt">) => void;
  removeDocument: (docId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USER: UserProfile = {
  id: "user_1",
  name: "Alex Rivera",
  username: "alexrivera",
  email: "alex@travelbook.com",
  userType: "consumer",
  consumerType: "solo",
  bio: "Adventure seeker & travel storyteller. 47 countries and counting.",
  followersCount: 1240,
  followingCount: 380,
  currency: "USD",
  language: "English",
  paymentMethods: [
    { id: "pm_1", type: "card", last4: "4242", brand: "Visa", isDefault: true },
  ],
  documents: [],
};

const MOCK_STORIES: Story[] = [
  {
    id: "s1",
    authorId: "u2",
    authorName: "Mia Chen",
    authorUsername: "miachen",
    image: "",
    seen: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "s2",
    authorId: "u3",
    authorName: "Luca Rossi",
    authorUsername: "lucarossi",
    image: "",
    seen: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "s3",
    authorId: "u4",
    authorName: "Zara Ahmed",
    authorUsername: "zaraahmed",
    image: "",
    seen: true,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "s4",
    authorId: "u5",
    authorName: "James Park",
    authorUsername: "jamespark",
    image: "",
    seen: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "s5",
    authorId: "u6",
    authorName: "Sofia Lima",
    authorUsername: "sofialiima",
    image: "",
    seen: false,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "u2",
    authorName: "Mia Chen",
    authorUsername: "miachen",
    content: "Tokyo in spring is absolutely magical. Just shared my Japan trip pass — 12 days of cherry blossoms, ramen, and temples. Join me if you're heading there in April!",
    images: [],
    likes: 284,
    comments: 47,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    travelPassId: "pass_1",
    location: "Tokyo, Japan",
    tags: ["Japan", "SpringTravel", "FindBuddy"],
  },
  {
    id: "p2",
    authorId: "u3",
    authorName: "Luca Rossi",
    authorUsername: "lucarossi",
    content: "Santorini sunsets never disappoint. Solo travel pro tip: book the cliff-side spots at least 2 hours before sunset. Worth every minute of the wait.",
    images: [],
    likes: 412,
    comments: 63,
    isLiked: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    location: "Santorini, Greece",
    tags: ["Greece", "SoloTravel", "Sunsets"],
  },
  {
    id: "p3",
    authorId: "u4",
    authorName: "Zara Ahmed",
    authorUsername: "zaraahmed",
    content: "Bali retreat done right. 10 days, 3 wellness centers, and one life-changing cooking class. My Travel Pass is open — looking for a travel buddy for next month's Indonesia run!",
    images: [],
    likes: 198,
    comments: 29,
    isLiked: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    travelPassId: "pass_2",
    location: "Ubud, Bali",
    tags: ["Bali", "Wellness", "FindBuddy"],
  },
  {
    id: "p4",
    authorId: "u5",
    authorName: "James Park",
    authorUsername: "jamespark",
    content: "NYC to Lisbon in 7 hours. Planning a 3-week Portugal & Spain adventure. The AI planner nailed it — flights, hotels, day trips all synced perfectly.",
    images: [],
    likes: 156,
    comments: 22,
    isLiked: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    location: "Lisbon, Portugal",
    tags: ["Portugal", "Spain", "EuropeTrip"],
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("travelbook_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsLoggedIn(true);
        } else {
          setUser(DEFAULT_USER);
          setIsLoggedIn(true);
          await AsyncStorage.setItem("travelbook_user", JSON.stringify(DEFAULT_USER));
        }
      } catch {
        setUser(DEFAULT_USER);
        setIsLoggedIn(true);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (profile: UserProfile) => {
    setUser(profile);
    setIsLoggedIn(true);
    await AsyncStorage.setItem("travelbook_user", JSON.stringify(profile));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsLoggedIn(false);
    await AsyncStorage.removeItem("travelbook_user");
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("travelbook_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addPost = useCallback((postData: Omit<Post, "id" | "likes" | "comments" | "isLiked" | "createdAt">) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  const markStorySeen = useCallback((storyId: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, seen: true } : s))
    );
  }, []);

  const addDocument = useCallback(async (doc: Omit<TravelDocument, "id" | "uploadedAt">) => {
    const newDoc: TravelDocument = {
      ...doc,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      uploadedAt: new Date().toISOString(),
    };
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, documents: [...prev.documents, newDoc] };
      AsyncStorage.setItem("travelbook_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeDocument = useCallback(async (docId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, documents: prev.documents.filter((d) => d.id !== docId) };
      AsyncStorage.setItem("travelbook_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        posts,
        stories,
        login,
        logout,
        updateProfile,
        addPost,
        toggleLike,
        markStorySeen,
        addDocument,
        removeDocument,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
