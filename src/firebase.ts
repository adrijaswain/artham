import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

// Helper keys for local storage syncing
const INTAKE_KEYS = [
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
];

/**
 * Sync Firestore user data into LocalStorage on login.
 */
export async function syncUserFirestoreData(uid: string) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      
      // Load intake data
      if (data.intake) {
        Object.entries(data.intake).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            localStorage.setItem(key, String(value));
          }
        });
      }

      // Load vault files
      if (data.vaultFiles) {
        localStorage.setItem("artham_vault_files", JSON.stringify(data.vaultFiles));
      }

      // Load messages chat history
      if (data.messages) {
        localStorage.setItem("artham_chat_messages", JSON.stringify(data.messages));
      }

      // Load custom breakdown personalization
      if (data.customBreakdown) {
        localStorage.setItem("artham_custom_breakdown", JSON.stringify(data.customBreakdown));
      } else {
        localStorage.removeItem("artham_custom_breakdown");
      }

      // Dispatch event to refresh active page views
      window.dispatchEvent(new CustomEvent("auth-change"));
    } else {
      // If user document is new, push current guest progress to Firestore
      await syncLocalDataToFirestore(uid);
    }
  } catch (error) {
    console.error("Error synchronizing Firestore data to LocalStorage:", error);
  }
}

/**
 * Push current local guest progress (intake, vault, chat) to Firestore.
 */
export async function syncLocalDataToFirestore(uid: string) {
  try {
    const userDocRef = doc(db, "users", uid);

    // Get current authenticated user details
    const user = auth.currentUser;
    const email = user?.email || localStorage.getItem("artham_user_email") || "";
    const name = user?.displayName || localStorage.getItem("artham_user_name") || "Guest User";

    // Extract intake details
    const intake: Record<string, string> = {};
    INTAKE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val !== null) intake[key] = val;
    });

    // Extract vault files
    let vaultFiles = [];
    const savedFiles = localStorage.getItem("artham_vault_files");
    if (savedFiles) {
      try {
        vaultFiles = JSON.parse(savedFiles);
      } catch (e) {
        console.error("Error parsing vault files on upload sync", e);
      }
    }

    // Extract chat history
    let messages = [];
    const savedMessages = localStorage.getItem("artham_chat_messages");
    if (savedMessages) {
      try {
        messages = JSON.parse(savedMessages);
      } catch (e) {
        console.error("Error parsing chat logs on upload sync", e);
      }
    }

    // Extract custom breakdown configuration
    let customBreakdown = null;
    const savedBreakdown = localStorage.getItem("artham_custom_breakdown");
    if (savedBreakdown) {
      try {
        customBreakdown = JSON.parse(savedBreakdown);
      } catch (e) {
        console.error("Error parsing custom breakdown on upload sync", e);
      }
    }

    // Write complete package
    await setDoc(userDocRef, {
      uid,
      email,
      name,
      updatedAt: new Date().toISOString(),
      intake,
      vaultFiles,
      messages,
      customBreakdown
    }, { merge: true });
  } catch (error) {
    console.error("Error synchronizing local data to Firestore:", error);
  }
}

/**
 * Save intake settings changes directly to Firestore.
 */
export async function saveUserIntakeToFirestore(uid: string, intakeData: Record<string, string>) {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      intake: intakeData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating intake in Firestore:", error);
  }
}

/**
 * Save Evidence Vault file list directly to Firestore.
 */
export async function saveUserVaultToFirestore(uid: string, vaultFiles: VaultFile[]) {
  try {
    const userDocRef = doc(db, "users", uid);
    // Sanitize files to ensure base64 strings or undefined values don't break firestore
    const sanitizedFiles = vaultFiles.map(file => ({
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

    await setDoc(userDocRef, {
      vaultFiles: sanitizedFiles,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating Evidence Vault in Firestore:", error);
  }
}

/**
 * Save chatbot messages history directly to Firestore.
 */
export async function saveUserMessagesToFirestore(uid: string, messages: Msg[]) {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      messages,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating chat history in Firestore:", error);
  }
}

/**
 * Save custom breakdown personalized sorting/N/A settings directly to Firestore.
 */
export async function saveUserCustomBreakdownToFirestore(uid: string, customBreakdown: Record<string, unknown> | null) {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      customBreakdown,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating custom breakdown in Firestore:", error);
  }
}
