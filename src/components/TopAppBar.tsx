import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import { useAuth } from "../context/AuthContext";
import type { Language } from "../utils/translations";

const logoSrc = new URL("../assets/artham_logo_transparent.png", import.meta.url).href;

export default function TopAppBar() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const { isLoggedIn, displayName: userName, logout } = useAuth();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Any "open-auth" request now routes to the dedicated sign-in page.
    const handleOpenAuth = () => navigate("/login");
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showToast(customEvent.detail.msg, customEvent.detail.type || "success");
      }
    };

    window.addEventListener("open-auth", handleOpenAuth);
    window.addEventListener("show-toast", handleShowToast);

    return () => {
      window.removeEventListener("open-auth", handleOpenAuth);
      window.removeEventListener("show-toast", handleShowToast);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Signed out successfully.", "success");
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
  };

  const { language, setLanguage } = useLanguage();

  return (
    <header className="flex justify-between items-center px-md py-sm w-full fixed top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant h-16">
      <Link to="/" className="flex items-center gap-sm group">
        <img src={logoSrc} alt="Artham logo" className="w-10 h-10 rounded-2xl shadow-sm object-cover group-hover:scale-105 transition-transform" />
        <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
          Artham
        </span>
      </Link>
      <div className="flex items-center gap-md">
        <div className="relative flex items-center">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none bg-transparent border-none pr-8 pl-2 py-1 text-label-md font-label-md text-on-surface-variant hover:text-primary cursor-pointer outline-none transition-colors"
          >
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
        <button className="p-2 rounded-full hover:bg-surface-container transition-all text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        
        {isLoggedIn ? (
          <div className="flex items-center gap-xs sm:gap-sm">
            <div className="flex items-center gap-xs bg-surface-container border border-outline-variant text-on-surface px-2 py-1.5 rounded-full text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] uppercase font-bold">
                {userName ? userName.charAt(0) : "U"}
              </span>
              <span className="hidden sm:inline truncate max-w-[120px]">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-xs px-3 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error/5 transition-all active:scale-95 text-xs font-semibold"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-xs">
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-xs px-3 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-xs px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:brightness-110 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span>Get started</span>
            </Link>
          </div>
        )}
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] flex items-center gap-sm px-4 py-3 rounded-xl border shadow-lg animate-fade-in text-xs font-semibold leading-relaxed max-w-sm ${
          toast.type === "success"
            ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
            : "bg-error-container border-error/30 text-on-error-container"
        }`}>
          <span className="material-symbols-outlined shrink-0 text-[18px]">
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
