import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ONBOARDED_KEY = "tb.onboarded";
const USER_ID_KEY = "tb.userId";

const SKIP_ONBOARDING =
  process.env.EXPO_PUBLIC_USE_MOCK === "true" ||
  process.env.EXPO_PUBLIC_USE_MOCK === "1" ||
  process.env.EXPO_PUBLIC_SKIP_ONBOARDING === "true";

interface MockUser {
  id: string;
  email: string;
  handle: string;
  name: string;
}

interface AuthContextValue {
  user: MockUser | null;
  onboarded: boolean;
  ready: boolean;
  signIn: (user: MockUser) => Promise<void>;
  signOut: () => Promise<void>;
  setOnboarded: (done: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEV_USER_ID = "00000000-0000-4000-8000-00000000abcd";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [onboarded, setOnboardedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (SKIP_ONBOARDING) {
      setUser({
        id: DEV_USER_ID,
        email: "dev@travelbook.local",
        handle: "dev",
        name: "Dev User",
      });
      setOnboardedState(true);
      setReady(true);
      return;
    }
    Promise.all([
      AsyncStorage.getItem(USER_ID_KEY),
      AsyncStorage.getItem(ONBOARDED_KEY),
    ])
      .then(([storedUserId, storedOnboarded]) => {
        if (storedUserId) {
          setUser({
            id: storedUserId,
            email: "dev@travelbook.local",
            handle: "dev",
            name: "Dev User",
          });
        }
        setOnboardedState(storedOnboarded === "true");
      })
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (u: MockUser) => {
    setUser(u);
    await AsyncStorage.setItem(USER_ID_KEY, u.id);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setOnboardedState(false);
    await Promise.all([
      AsyncStorage.removeItem(USER_ID_KEY),
      AsyncStorage.removeItem(ONBOARDED_KEY),
    ]);
  }, []);

  const setOnboarded = useCallback(async (done: boolean) => {
    setOnboardedState(done);
    await AsyncStorage.setItem(ONBOARDED_KEY, done ? "true" : "false");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, onboarded, ready, signIn, signOut, setOnboarded }),
    [user, onboarded, ready, signIn, signOut, setOnboarded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { DEV_USER_ID };
