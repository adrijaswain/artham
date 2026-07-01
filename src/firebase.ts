import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { Msg, VaultFile } from "./pages/MedicalInput";

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

// ---------------------------------------------------------------------------
// Canonical list of per-user data keys stored in LocalStorage.
// These are the ONLY keys tied to a specific user account; everything else
// (language, session flags) is device-level and never synced to Firestore.
// ---------------------------------------------------------------------------

/** Intake / onboarding form fields (12). */
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

/** Every LocalStorage key that belongs to the signed-in user's profile. */
const USER_SCOPED_KEYS = [
  ...INTAKE_KEYS,
  "artham_vault_files",
  "artham_chat_messages",
  "artham_dashboard_chat_messages",
  "artham_chatbot_diagnosis_details",
  "artham_chatbot_next_steps",
  "artham_custom_breakdown"
];

const nowIso = () => new Date().toISOString();

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
  USER_SCOPED_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * Read the complete user profile currently held in LocalStorage into the
 * shape stored under `users/{uid}` in Firestore.
 */
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
 * Fetch the Firestore profile for `uid` and write it into LocalStorage so the
 * rest of the app (which reads from LocalStorage) has the user's saved context.
 *
 * Returns `true` if a stored profile existed, `false` for a first-time account.
 * When a profile exists, LocalStorage is cleared first so no stale/guest data
 * from a previous session survives.
 */
export async function hydrateLocalFromFirestore(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return false;

  const data = snapshot.data();

  // Replace any existing local profile with this account's authoritative data.
  clearLocalUserData();

  if (data.intake && typeof data.intake === "object") {
    Object.entries(data.intake as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        localStorage.setItem(key, String(value));
      }
    });
  }

  if (Array.isArray(data.vaultFiles)) {
    localStorage.setItem("artham_vault_files", JSON.stringify(data.vaultFiles));
  }
  if (Array.isArray(data.messages)) {
    localStorage.setItem("artham_chat_messages", JSON.stringify(data.messages));
  }
  if (Array.isArray(data.dashboardMessages)) {
    localStorage.setItem("artham_dashboard_chat_messages", JSON.stringify(data.dashboardMessages));
  }
  if (typeof data.diagnosisDetails === "string" && data.diagnosisDetails) {
    localStorage.setItem("artham_chatbot_diagnosis_details", data.diagnosisDetails);
  }
  if (typeof data.nextSteps === "string" && data.nextSteps) {
    localStorage.setItem("artham_chatbot_next_steps", data.nextSteps);
  }
  if (data.customBreakdown) {
    localStorage.setItem("artham_custom_breakdown", JSON.stringify(data.customBreakdown));
  }

  return true;
}

/**
 * Push the profile currently in LocalStorage up to `users/{uid}`. Used to seed
 * a brand-new account with any progress the user made while in guest mode.
 */
export async function pushLocalToFirestore(uid: string) {
  try {
    const user = auth.currentUser;
    const email = user?.email || localStorage.getItem("artham_user_email") || "";
    const name = user?.displayName || localStorage.getItem("artham_user_name") || "Guest User";

    await setDoc(
      doc(db, "users", uid),
      { uid, email, name, updatedAt: nowIso(), ...collectLocalUserData() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error pushing local data to Firestore:", error);
  }
}

// ---------------------------------------------------------------------------
// Granular, field-level writers used by individual pages as the user edits.
// Each merges into the single `users/{uid}` document.
// ---------------------------------------------------------------------------

async function mergeUserDoc(uid: string, patch: Record<string, unknown>, label: string) {
  try {
    await setDoc(doc(db, "users", uid), { ...patch, updatedAt: nowIso() }, { merge: true });
  } catch (error) {
    console.error(`Error updating ${label} in Firestore:`, error);
  }
}

/** Save intake settings changes directly to Firestore. */
export function saveUserIntakeToFirestore(uid: string, intakeData: Record<string, string>) {
  return mergeUserDoc(uid, { intake: intakeData }, "intake");
}

/** Save Evidence Vault file list directly to Firestore. */
export function saveUserVaultToFirestore(uid: string, vaultFiles: VaultFile[]) {
  // Sanitize files so undefined values don't break Firestore.
  const sanitizedFiles = vaultFiles.map((file) => ({
    id: file.id,
    name: file.name,
    category: file.category,
    date: file.date,
    size: file.size,
    amount: file.amount || "",
    notes: file.notes || "",
    aiAnalysis: file.aiAnalysis || "",
    base64Data: file.base64Data || "",
    mimeType: file.mimeType || ""
  }));
  return mergeUserDoc(uid, { vaultFiles: sanitizedFiles }, "Evidence Vault");
}

/** Save the MedicalInput chatbot message history directly to Firestore. */
export function saveUserMessagesToFirestore(uid: string, messages: Msg[]) {
  return mergeUserDoc(uid, { messages }, "chat history");
}

/** Save the Dashboard chatbot message history + extracted context to Firestore. */
export function saveUserDashboardContextToFirestore(
  uid: string,
  context: { dashboardMessages?: unknown[]; diagnosisDetails?: string; nextSteps?: string }
) {
  return mergeUserDoc(uid, context, "dashboard context");
}

/** Save custom breakdown personalization directly to Firestore. */
export function saveUserCustomBreakdownToFirestore(uid: string, customBreakdown: Record<string, unknown> | null) {
  return mergeUserDoc(uid, { customBreakdown }, "custom breakdown");
}
