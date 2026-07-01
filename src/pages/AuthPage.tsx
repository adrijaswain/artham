import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import { markNewSignup } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup" | "forgot";

const friendlyError = (err: unknown): string => {
  let msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("auth/email-already-in-use")) return "This email is already in use. Try signing in instead.";
  if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password"))
    return "Incorrect email or password. Please try again.";
  if (msg.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  if (msg.includes("auth/invalid-email")) return "Please enter a valid email address.";
  if (msg.includes("auth/operation-not-allowed")) return "Google Sign-In isn't enabled in the Firebase console yet.";
  if (msg.includes("auth/popup-blocked")) return "The Google popup was blocked. Please allow popups for this site.";
  if (msg.includes("auth/popup-closed-by-user")) return "The Google popup was closed before completion. Please try again.";
  return msg;
};

const highlights = [
  { icon: "receipt_long", title: "Clear cost estimates", body: "Turn complex hospital bills into one trustworthy number." },
  { icon: "verified_user", title: "Coverage & schemes", body: "See the insurance and government schemes you qualify for." },
  { icon: "lock", title: "Private & secure", body: "Your reports and profile are encrypted and only yours." }
];

export default function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // Already authenticated users don't need this page.
  if (isLoggedIn) {
    navigate("/dashboard", { replace: true });
  }

  const heading = mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password";
  const sub =
    mode === "signup"
      ? "Free forever. Back up your reports, worksheets and eligibility."
      : mode === "login"
      ? "Sign in to pick up right where you left off."
      : "Enter your email and we'll send you a reset link.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) return setError("Please enter your email address.");
    if (mode !== "forgot" && !password) return setError("Please enter your password.");
    if (mode === "signup" && !name) return setError("Please enter your name.");

    setBusy(true);
    try {
      if (mode === "signup") {
        markNewSignup();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch {
          /* non-fatal */
        }
        localStorage.setItem("artham_user_name", name);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { msg: "Account created successfully!", type: "success" } }));
        navigate("/dashboard");
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { msg: "Logged in successfully!", type: "success" } }));
        navigate("/dashboard");
      } else {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Password reset link sent — check your inbox.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { msg: "Logged in successfully!", type: "success" } }));
      navigate("/dashboard");
    } catch (err) {
      console.error("Google auth error:", err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="min-h-screen flex bg-background text-on-surface">
      {/* Left brand / marketing panel */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-primary text-on-primary p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/10 blur-3xl" />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <span className="w-9 h-9 rounded-lg bg-white text-primary flex items-center justify-center font-bold text-lg">A</span>
          <span className="text-xl font-bold tracking-tight">Artham</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight mb-3">From hospital bills to a clear plan — without the anxiety.</h2>
          <p className="text-on-primary/80 mb-10 leading-relaxed">
            Join thousands of patients and caregivers making sense of cancer-care costs in India.
          </p>
          <ul className="space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{h.icon}</span>
                </span>
                <div>
                  <p className="font-semibold text-sm">{h.title}</p>
                  <p className="text-on-primary/75 text-sm leading-relaxed">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-on-primary/60 text-xs">© 2026 Artham. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:px-12">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">A</span>
            <span className="font-bold text-on-surface">Artham</span>
          </Link>
          <Link
            to="/"
            className="ml-auto flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-1.5">{heading}</h1>
            <p className="text-on-surface-variant text-sm mb-7">{sub}</p>

            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/30 text-on-error-container rounded-lg text-xs flex items-start gap-2 font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-secondary-container border border-secondary/30 text-on-secondary-container rounded-lg text-xs flex items-start gap-2 font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Full name</label>
                  <input type="text" placeholder="e.g. Rajesh Patil" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Email address</label>
                <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>

              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-on-surface-variant">Password</label>
                    {mode === "login" && (
                      <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                {mode === "signup" ? "Create free account" : mode === "login" ? "Sign in" : "Send reset link"}
              </button>
            </form>

            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-outline-variant" />
                  <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">or</span>
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full py-2.5 border border-outline-variant hover:bg-surface-container rounded-lg font-semibold text-sm text-on-surface transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-1.15 2.8-2.44 3.66v3.04h3.94c2.31-2.13 3.64-5.27 3.64-8.53z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.94-3.04c-1.09.73-2.49 1.16-3.99 1.16-3.07 0-5.67-2.07-6.6-4.86H1.34v3.13A11.99 11.99 0 0012 24z" />
                    <path fill="#FBBC05" d="M5.4 14.35a7.19 7.19 0 010-4.7V6.52H1.34a12 12 0 000 10.96l4.06-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.34 6.52l4.06 3.13C6.33 6.82 8.93 4.75 12 4.75z" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            <p className="text-center text-sm text-on-surface-variant mt-7">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                </>
              ) : mode === "login" ? (
                <>
                  New to Artham?{" "}
                  <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
                </>
              ) : (
                <Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
