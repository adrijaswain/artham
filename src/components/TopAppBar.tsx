import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, syncUserFirestoreData } from "../firebase";
import AuthModal from "./AuthModal";

export default function TopAppBar() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const nameVal = localStorage.getItem("artham_user_name") || user.displayName || user.email?.split("@")[0] || "User";
        setUserName(nameVal);
        // Maintain local storage alignment
        localStorage.setItem("artham_is_logged_in", "true");
        localStorage.setItem("artham_user_name", nameVal);
        localStorage.setItem("artham_user_email", user.email || "");
        
        // Auto-dismiss auth modal on login
        setShowAuthModal(false);

        // Retrieve and restore user's saved data from Firestore
        await syncUserFirestoreData(user.uid);
      } else {
        setIsLoggedIn(false);
        setUserName("");
        localStorage.removeItem("artham_is_logged_in");
        localStorage.removeItem("artham_user_name");
        localStorage.removeItem("artham_user_email");

        // Clear user intake data
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
          "artham_intake_insurance_provider",
          "artham_intake_income_bracket",
          "artham_intake_step"
        ];
        INTAKE_KEYS.forEach(key => localStorage.removeItem(key));
        
        // Clear vault, chat logs & custom breakdown overrides
        localStorage.removeItem("artham_vault_files");
        localStorage.removeItem("artham_chat_messages");
        localStorage.removeItem("artham_custom_breakdown");
      }
      // Notify other views (banners)
      window.dispatchEvent(new CustomEvent("auth-change"));
    });

    const checkAuthLocal = () => {
      const loggedIn = localStorage.getItem("artham_is_logged_in") === "true";
      const name = localStorage.getItem("artham_user_name") || "";
      setIsLoggedIn(loggedIn);
      setUserName(name);
    };

    const handleOpenAuth = () => setShowAuthModal(true);
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showToast(customEvent.detail.msg, customEvent.detail.type || "success");
      }
    };

    window.addEventListener("open-auth", handleOpenAuth);
    window.addEventListener("auth-change", checkAuthLocal);
    window.addEventListener("show-toast", handleShowToast);

    return () => {
      unsubscribe();
      window.removeEventListener("open-auth", handleOpenAuth);
      window.removeEventListener("auth-change", checkAuthLocal);
      window.removeEventListener("show-toast", handleShowToast);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("artham_is_logged_in");
      localStorage.removeItem("artham_user_name");
      localStorage.removeItem("artham_user_email");
      
      // Clear all user profile and onboarding data on sign out
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
        "artham_intake_insurance_provider",
        "artham_intake_income_bracket",
        "artham_intake_step",
        "artham_chat_messages",
        "artham_vault_files"
      ];
      INTAKE_KEYS.forEach(key => localStorage.removeItem(key));

      showToast("Signed out successfully.", "success");
      window.dispatchEvent(new CustomEvent("auth-change"));
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
  };

  return (
    <header className="flex justify-between items-center px-md py-sm w-full fixed top-0 z-50 bg-surface border-b border-outline-variant shadow-sm h-16">
      <Link to="/" className="flex items-center gap-sm">
        <span className="font-headline-md text-headline-md font-bold text-primary">
          Artham
        </span>
      </Link>
      <div className="flex items-center gap-md">
        <div className="relative flex items-center">
          <select className="appearance-none bg-transparent border-none pr-8 pl-2 py-1 text-label-md font-label-md text-on-surface-variant hover:text-primary cursor-pointer outline-none transition-colors">
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="bn">বাঙালি (Bengali)</option>
          </select>
          <span className="material-symbols-outlined absolute right-1 pointer-events-none text-on-surface-variant text-[20px]">
            language
          </span>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </button>
        
        {isLoggedIn ? (
          <div className="flex items-center gap-xs sm:gap-sm">
            <div className="flex items-center gap-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] uppercase">
                {userName ? userName.charAt(0) : "U"}
              </span>
              <span className="hidden sm:inline truncate max-w-[120px]">{userName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-error-container/10 text-outline hover:text-error transition-all active:scale-95"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-xs px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-low text-xs font-bold text-primary hover:bg-surface-container-highest transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">account_circle</span>
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Global Auth Modal Popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] flex items-center gap-sm p-md rounded-2xl border backdrop-blur-md shadow-lg animate-fade-in text-xs font-bold leading-relaxed max-w-sm ${
          toast.type === "success"
            ? "bg-[#F9CBDB]/95 border-[#F9CBDB] text-primary"
            : "bg-error/10 border-error/30 text-error"
        }`}>
          <span className="material-symbols-outlined shrink-0 text-[18px] text-primary font-bold">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-outline hover:text-on-surface transition-all flex items-center justify-center"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}
    </header>
  );
}
