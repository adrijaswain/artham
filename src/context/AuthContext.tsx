import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, clearLocalUserData, startRealtimeSync, stopRealtimeSync } from "../firebase";

type AuthContextType = {
  /** The raw Firebase user, or null when signed out. */
  user: User | null;
  /** True once the initial auth state has resolved (session restored or not). */
  authReady: boolean;
  /** True while the user's Firestore profile is being loaded into the app. */
  syncing: boolean;
  isLoggedIn: boolean;
  displayName: string;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** sessionStorage flag set by the sign-up page when a brand-new account is
 *  created, telling the auth listener to preserve guest progress instead of clearing it. */
const NEW_SIGNUP_FLAG = "artham_new_signup";

export function markNewSignup() {
  sessionStorage.setItem(NEW_SIGNUP_FLAG, "1");
}

/** localStorage flag set on first-time sign up, telling AppShell to run the
 *  one-time onboarding tour. Cleared once the tour is finished or skipped. */
const NEEDS_TOUR_FLAG = "artham_needs_tour";

export function markNeedsTour() {
  localStorage.setItem(NEEDS_TOUR_FLAG, "1");
}

export function needsTour() {
  return localStorage.getItem(NEEDS_TOUR_FLAG) === "1";
}

export function clearNeedsTour() {
  localStorage.removeItem(NEEDS_TOUR_FLAG);
}

/** sessionStorage flag set on successful sign up / sign in, telling the
 *  Dashboard to auto-open the AI chat assistant the moment the user lands. */
const CHAT_POPUP_FLAG = "artham_show_chat_popup";

export function markShowChatPopup() {
  sessionStorage.setItem(CHAT_POPUP_FLAG, "1");
}

/** Reads and clears the flag in one step so the popup only fires once per auth event. */
export function consumeShowChatPopup(): boolean {
  const shouldShow = sessionStorage.getItem(CHAT_POPUP_FLAG) === "1";
  sessionStorage.removeItem(CHAT_POPUP_FLAG);
  return shouldShow;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // Safety net: never trap the user behind the loading gate if Firebase auth
    // is slow to initialize or unreachable. Reveal the app after a short wait;
    // onAuthStateChanged still updates state (and hydrates data) when it lands.
    const readyFallback = setTimeout(() => setAuthReady(true), 2500);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      clearTimeout(readyFallback);
      if (nextUser) {
        // Clear the NEW_SIGNUP flag if set — real-time sync seeds new accounts
        // automatically (first snapshot for a doc-less uid), so it's no longer
        // consulted; we just tidy it up.
        sessionStorage.removeItem(NEW_SIGNUP_FLAG);

        const name =
          nextUser.displayName ||
          localStorage.getItem("artham_user_name") ||
          nextUser.email?.split("@")[0] ||
          "User";

        localStorage.setItem("artham_is_logged_in", "true");
        localStorage.setItem("artham_user_name", name);
        localStorage.setItem("artham_user_email", nextUser.email || "");
        setUser(nextUser);
        setDisplayName(name);

        // Open the real-time Firestore listener. It streams the account's saved
        // profile into LocalStorage (and keeps it live across devices); the
        // callback fires once the first snapshot resolves.
        setSyncing(true);
        startRealtimeSync(nextUser.uid, () => {
          setSyncing(false);
          // Let LocalStorage-backed pages re-read their now-current data.
          window.dispatchEvent(new CustomEvent("auth-change"));
          setAuthReady(true);
        });
      } else {
        stopRealtimeSync();
        setUser(null);
        setDisplayName("");
        setSyncing(false);
        localStorage.removeItem("artham_is_logged_in");
        localStorage.removeItem("artham_user_name");
        localStorage.removeItem("artham_user_email");
        clearLocalUserData();
        window.dispatchEvent(new CustomEvent("auth-change"));
        setAuthReady(true);
      }
    });

    return () => {
      clearTimeout(readyFallback);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged handles the LocalStorage cleanup + auth-change event.
  };

  return (
    <AuthContext.Provider
      value={{ user, authReady, syncing, isLoggedIn: !!user, displayName, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
