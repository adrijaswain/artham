import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  // True once this listener has actually observed a signed-in user, so the
  // `else` branch below can tell a real sign-out (user -> null) apart from a
  // guest's very first resolution (no session -> null). Only the former
  // should wipe LocalStorage - otherwise a guest filling out the intake form
  // loses all of it the moment onAuthStateChanged resolves (or on any
  // refresh), since "not logged in" was being treated as "just logged out".
  const hasSeenUserRef = useRef(false);

  useEffect(() => {
    let isReady = false;
    const markReady = () => {
      if (!isReady) {
        isReady = true;
        setAuthReady(true);
      }
    };

    // Safety net: never trap the user behind the loading gate if Firebase auth
    // or Firestore sync is slow/unreachable. Unblock the UI within 1000ms.
    const readyFallback = setTimeout(markReady, 1000);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        hasSeenUserRef.current = true;
        // Clear the NEW_SIGNUP flag if set - real-time sync seeds new accounts
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
          markReady();
        });
      } else {
        stopRealtimeSync();
        setUser(null);
        setDisplayName("");
        setSyncing(false);
        localStorage.removeItem("artham_is_logged_in");
        localStorage.removeItem("artham_user_name");
        localStorage.removeItem("artham_user_email");
        // Only wipe user-scoped data on an actual sign-out transition. If we
        // never saw a signed-in user in this session, this is a guest whose
        // in-progress intake/dashboard data must survive reloads.
        if (hasSeenUserRef.current) {
          clearLocalUserData();
          hasSeenUserRef.current = false;
        }
        window.dispatchEvent(new CustomEvent("auth-change"));
        markReady();
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
