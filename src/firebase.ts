import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// Read client configuration from Vite environment variables (VITE_)
// with fallback mock credentials to prevent application crashes
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKey-Placeholder-For-Artham",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artham-navigator.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artham-navigator",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artham-navigator.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:mockappid123"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Ensure the auth session survives page reloads / browser restarts.
// (browserLocalPersistence is the default, but we set it explicitly so a
// returning user is silently re-authenticated instead of appearing logged out.)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not set Firebase auth persistence:", err);
});

// ===========================================================================
// Central Firestore <-> Auth sync layer
// ---------------------------------------------------------------------------
// LocalStorage is the app's synchronous working store (every page reads it
// directly, and guests who never sign in still get a working app). Firestore
// is the authoritative cloud copy for a signed-in user, mirrored to LocalStorage
// in real time and keyed to their Auth uid at `users/{uid}`.
//
// Rather than have every page manually push its slice of state to Firestore
// (the old, fragile approach), this module is the ONE place sync happens:
//
//   * We intercept writes to any user-scoped LocalStorage key and debounce a
//     full-profile push to Firestore. Pages just write LocalStorage as usual.
//   * `startRealtimeSync(uid)` opens an onSnapshot listener that streams the
//     cloud profile back into LocalStorage (cross-device / returning login) and
//     fires an `auth-change` event so pages re-read their data.
// ===========================================================================

/** Intake / onboarding form fields — stored inside the `intake` map. */
export const INTAKE_KEYS = [
  "artham_intake_state",
  "artham_intake_age",
  "artham_intake_stage",
  "artham_intake_hormone_status",
  "artham_intake_surgery",
  "artham_intake_chemo",
  "artham_intake_radiation",
  "artham_intake_hospital_type",
  "artham_intake_has_insurance",
  "artham_intake_income_bracket",
  "artham_intake_insurance_provider",
  "artham_intake_step"
] as const;

/**
 * Every LocalStorage key that belongs to the signed-in user's profile and must
 * be synced to Firestore. Writing any of these (from anywhere in the app)
 * schedules a cloud push. Device-level keys (language, api key, session flags)
 * are intentionally excluded.
 */
const USER_SCOPED_KEYS = [
  ...INTAKE_KEYS,
  "artham_vault_files",
  "artham_chat_messages",
  "artham_dashboard_chat_messages",
  "artham_chatbot_diagnosis_details",
  "artham_chatbot_next_steps",
  "artham_custom_breakdown"
];
const USER_SCOPED_SET = new Set<string>(USER_SCOPED_KEYS);

const nowIso = () => new Date().toISOString();

// Original, un-patched storage methods — used internally so mirroring cloud
// data into LocalStorage never loops back into another cloud push.
const rawSetItem = localStorage.setItem.bind(localStorage);
const rawRemoveItem = localStorage.removeItem.bind(localStorage);

/** Safely JSON.parse a LocalStorage value, returning `fallback` on error. */
function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Could not parse LocalStorage key "${key}":`, e);
    return fallback;
  }
}

/**
 * Remove every user-scoped key from LocalStorage. Called on sign-out and
 * before hydrating a different account so one user's data never bleeds into
 * another's session on a shared browser.
 */
export function clearLocalUserData() {
  USER_SCOPED_KEYS.forEach((key) => rawRemoveItem(key));
}

/** Read the complete user profile from LocalStorage into the `users/{uid}` shape. */
function collectLocalUserData() {
  const intake: Record<string, string> = {};
  INTAKE_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) intake[key] = val;
  });

  return {
    intake,
    vaultFiles: readJson<unknown[]>("artham_vault_files", []),
    messages: readJson<unknown[]>("artham_chat_messages", []),
    dashboardMessages: readJson<unknown[]>("artham_dashboard_chat_messages", []),
    diagnosisDetails: localStorage.getItem("artham_chatbot_diagnosis_details") || "",
    nextSteps: localStorage.getItem("artham_chatbot_next_steps") || "",
    customBreakdown: readJson<Record<string, unknown> | null>("artham_custom_breakdown", null)
  };
}

/**
 * Write a `users/{uid}` document into LocalStorage. Runs with `applyingRemote`
 * set so the storage interception below does NOT echo this back to Firestore.
 */
function applyProfileToLocal(data: Record<string, unknown>) {
  applyingRemote = true;
  try {
    clearLocalUserData();

    const intake = data.intake;
    if (intake && typeof intake === "object") {
      Object.entries(intake as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) rawSetItem(key, String(value));
      });
    }
    if (Array.isArray(data.vaultFiles)) {
      rawSetItem("artham_vault_files", JSON.stringify(data.vaultFiles));
    }
    if (Array.isArray(data.messages)) {
      rawSetItem("artham_chat_messages", JSON.stringify(data.messages));
    }
    if (Array.isArray(data.dashboardMessages)) {
      rawSetItem("artham_dashboard_chat_messages", JSON.stringify(data.dashboardMessages));
    }
    if (typeof data.diagnosisDetails === "string" && data.diagnosisDetails) {
      rawSetItem("artham_chatbot_diagnosis_details", data.diagnosisDetails);
    }
    if (typeof data.nextSteps === "string" && data.nextSteps) {
      rawSetItem("artham_chatbot_next_steps", data.nextSteps);
    }
    if (data.customBreakdown) {
      rawSetItem("artham_custom_breakdown", JSON.stringify(data.customBreakdown));
    }
  } finally {
    applyingRemote = false;
  }
}

/**
 * Push the profile currently in LocalStorage up to `users/{uid}`, merged with
 * the account's profile fields (name / email).
 */
export async function pushLocalToFirestore(uid: string) {
  try {
    const user = auth.currentUser;
    const email = user?.email || localStorage.getItem("artham_user_email") || "";
    const name = user?.displayName || localStorage.getItem("artham_user_name") || "User";

    await setDoc(
      doc(db, "users", uid),
      { uid, email, name, updatedAt: nowIso(), ...collectLocalUserData() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error pushing data to Firestore:", error);
  }
}

// ---------------------------------------------------------------------------
// Storage interception: any user-scoped LocalStorage write schedules a push.
// ---------------------------------------------------------------------------

/** True while we are mirroring cloud data into LocalStorage (suppresses pushes). */
let applyingRemote = false;
/** True once the initial cloud snapshot has been applied for the current user. */
let hydrated = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync() {
  const user = auth.currentUser;
  // Only sync a signed-in user, and never before the initial hydrate — pushing
  // early would clobber the cloud copy with half-loaded local defaults.
  if (!user || !hydrated) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushLocalToFirestore(user.uid);
  }, 800);
}

localStorage.setItem = function (key: string, value: string) {
  rawSetItem(key, value);
  if (!applyingRemote && USER_SCOPED_SET.has(key)) scheduleSync();
};
localStorage.removeItem = function (key: string) {
  rawRemoveItem(key);
  if (!applyingRemote && USER_SCOPED_SET.has(key)) scheduleSync();
};

// ---------------------------------------------------------------------------
// Real-time sync lifecycle (driven by AuthContext on sign-in / sign-out).
// ---------------------------------------------------------------------------

let unsubscribeSnapshot: (() => void) | null = null;
let syncedUid: string | null = null;

/**
 * Begin streaming `users/{uid}` into LocalStorage.
 *
 * @param uid          The signed-in user's uid.
 * @param onFirstSync  Called once the first snapshot resolves (whether the
 *                     profile existed, was freshly seeded, or the listener
 *                     errored) so the UI can drop its loading gate.
 */
export function startRealtimeSync(uid: string, onFirstSync?: () => void) {
  if (syncedUid === uid && unsubscribeSnapshot) {
    onFirstSync?.();
    return;
  }
  stopRealtimeSync();

  syncedUid = uid;
  hydrated = false;
  let firstResolved = false;
  const resolveFirst = () => {
    if (firstResolved) return;
    firstResolved = true;
    hydrated = true;
    onFirstSync?.();
  };

  unsubscribeSnapshot = onSnapshot(
    doc(db, "users", uid),
    async (snap) => {
      // Ignore snapshots that only reflect our own un-acknowledged writes;
      // wait for the server-confirmed version to avoid needless re-hydration.
      if (snap.metadata.hasPendingWrites) return;

      if (!snap.exists()) {
        // Brand-new account: seed the cloud with any local/guest progress.
        if (!firstResolved) {
          hydrated = true; // allow the seeding push through
          await pushLocalToFirestore(uid);
        }
      } else {
        applyProfileToLocal(snap.data() as Record<string, unknown>);
        window.dispatchEvent(new CustomEvent("auth-change"));
      }
      resolveFirst();
    },
    (error) => {
      console.error("Firestore realtime sync error:", error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            msg: "Cloud sync is unavailable — your data is saved on this device only.",
            type: "error"
          }
        })
      );
      resolveFirst();
    }
  );
}

/** Tear down the active listener and pending push (sign-out / account switch). */
export function stopRealtimeSync() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  syncedUid = null;
  hydrated = false;
}
