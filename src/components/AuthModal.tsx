import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { auth, syncLocalDataToFirestore, syncUserFirestoreData } from "../firebase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signup" | "login" | "forgot">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (tab !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }

    if (tab === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    try {
      if (tab === "signup") {
        // Register in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save display name in profile
        try {
          await updateProfile(user, { displayName: name });
        } catch (nameErr) {
          console.warn("Failed to set display name:", nameErr);
        }

        // Save local session state
        localStorage.setItem("artham_is_logged_in", "true");
        localStorage.setItem("artham_user_name", name);
        localStorage.setItem("artham_user_email", email);

        // Upload any existing local guest progress to Firestore
        try {
          await syncLocalDataToFirestore(user.uid);
        } catch (syncErr) {
          console.warn("Failed to sync local data to firestore:", syncErr);
        }

        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { msg: "Account created successfully!", type: "success" }
        }));
      } else if (tab === "login") {
        // Sign in via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const displayName = user.displayName || user.email?.split("@")[0] || "User";
        localStorage.setItem("artham_is_logged_in", "true");
        localStorage.setItem("artham_user_name", displayName);
        localStorage.setItem("artham_user_email", user.email || "");

        // Download saved progress from Firestore
        try {
          await syncUserFirestoreData(user.uid);
        } catch (syncErr) {
          console.warn("Failed to sync firestore data:", syncErr);
        }

        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { msg: "Logged in successfully!", type: "success" }
        }));
      } else if (tab === "forgot") {
        // Send password reset email
        await sendPasswordResetEmail(auth, email);
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { msg: "Password reset link sent to your email!", type: "success" }
        }));
        setSuccess("Password reset link sent to your email!");
        setTab("login");
        return; // don't close the modal immediately on password reset
      }

      // Notify TopAppBar and other listeners
      window.dispatchEvent(new CustomEvent("auth-change"));

      onClose();
      setName("");
      setEmail("");
      setPassword("");
      setSuccess("");
      if (window.location.pathname === "/") {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Firebase auth error:", err);
      // Clean up common firebase errors for friendly display
      let msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("auth/email-already-in-use")) {
        msg = "This email is already in use. Try signing in instead.";
      } else if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
        msg = "Incorrect email or password. Please try again.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const displayName = user.displayName || "Google User";
      localStorage.setItem("artham_is_logged_in", "true");
      localStorage.setItem("artham_user_name", displayName);
      localStorage.setItem("artham_user_email", user.email || "");

      // Sync data from Firestore
      try {
        await syncUserFirestoreData(user.uid);
      } catch (syncErr) {
        console.warn("Failed to sync firestore data:", syncErr);
      }

      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { msg: "Logged in successfully!", type: "success" }
      }));
      window.dispatchEvent(new CustomEvent("auth-change"));

      onClose();
      setSuccess("");
      if (window.location.pathname === "/") {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-bright border border-outline-variant/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in flex flex-col">
        
        {/* Modal Header */}
        <div className="p-md border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">lock</span>
            Secure Medical Portal
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center"
            aria-label="Close authentication modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-md md:p-lg space-y-md">
          {/* Tab Switcher */}
          {tab !== "forgot" && (
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
              <button
                onClick={() => {
                  setTab("signup");
                  setError("");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  tab === "signup"
                    ? "bg-surface-bright text-primary shadow-sm"
                    : "text-outline hover:text-on-surface-variant"
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  tab === "login"
                    ? "bg-surface-bright text-primary shadow-sm"
                    : "text-outline hover:text-on-surface-variant"
                }`}
              >
                Sign In
              </button>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {tab === "signup"
                ? "Sign up optionally to back up your clinical context scans, financial worksheets, and claims eligibility."
                : tab === "login"
                ? "Sign in to retrieve your saved clinical diagnostic files and cost navigator history."
                : "Enter your registered email address below, and we will send you a password reset link."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-sm">
            {error && (
              <div className="p-sm bg-error/10 border border-error/30 text-error rounded-xl text-xs flex items-center gap-xs font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="p-sm bg-secondary/10 border border-secondary/30 text-secondary rounded-xl text-xs flex items-center gap-xs font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {success}
              </div>
            )}

            {tab === "signup" && (
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                required
              />
            </div>

            {tab !== "forgot" && (
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  required
                />
              </div>
            )}

            {tab === "login" && (
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab("forgot");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {tab === "forgot" && (
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {tab === "signup" && (
              <label className="flex items-start gap-xs p-1 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary mt-0.5"
                />
                <span className="text-[11px] text-on-surface-variant leading-tight">
                  Agree to store my diagnostic reports, bills, and profile securely.
                </span>
              </label>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl font-label-md text-label-md shadow-md active:scale-95 transition-all flex items-center justify-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab === "signup" ? "person_add" : tab === "login" ? "login" : "mail"}
              </span>
              {tab === "signup" ? "Create Free Account" : tab === "login" ? "Sign In to Profile" : "Send Reset Link"}
            </button>
          </form>

          {/* Divider */}
          {tab !== "forgot" && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-outline-variant/30"></div>
                <span className="flex-shrink mx-4 text-outline text-[10px] uppercase font-bold tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-outline-variant/30"></div>
              </div>

              {/* Social login */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 border border-outline-variant hover:bg-surface-container rounded-xl font-label-md text-label-md active:scale-95 transition-all flex items-center justify-center gap-sm text-on-surface bg-surface-bright shadow-sm"
              >
                {/* Minimalist Google Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.85-1.54 2.8l3.18 2.47c1.86-1.72 2.9-4.25 2.9-7.1H23.745z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.18-2.47c-.88.6-2 .95-3.21.95-3.12 0-5.76-2.11-6.7-4.96L3.58 17.58A11.96 11.96 0 0012 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.61A7.16 7.16 0 014.9 12c0-.92.16-1.8.44-2.61L2.16 6.92A11.96 11.96 0 000 12c0 1.92.45 3.74 1.25 5.38l4.05-2.77z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.3 2.68 1.25 6.92l4.05 3.17c.94-2.85 3.58-4.96 6.7-4.96z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* persistence helper advice */}
          <div className="p-xs bg-primary/5 rounded-xl border border-primary/20 flex gap-2 items-start mt-2">
            <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">verified_user</span>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              <strong>Advisable choice:</strong> Registering is free & completely optional. Artham works fully in guest mode, but logging in prevents browser cache clear from deleting your uploaded reports.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
