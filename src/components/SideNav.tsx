import { NavLink } from "react-router-dom";
import { useLanguage } from "./LanguageContext";

export default function SideNav() {
  const { t } = useLanguage();
  // Active item: warm coral pill across every page for a cohesive accent.
  const activeClass = "text-on-primary bg-primary font-semibold shadow-sm";

  const items = [
    { to: "/intake", label: t("nav_intake"), icon: "assignment", tourId: "intake" },
    { to: "/medical-input", label: t("nav_medical"), icon: "medical_services", tourId: "medical-input" },
    { to: "/dashboard", label: t("nav_dashboard"), icon: "dashboard", tourId: "dashboard" },
    { to: "/cost-breakdown", label: t("nav_breakdown"), icon: "payments", tourId: "cost-breakdown" },
    { to: "/action-plan", label: t("nav_action"), icon: "lightbulb", tourId: "action-plan" },
    { to: "/schemes", label: t("nav_schemes"), icon: "account_balance", tourId: "schemes" },
    { to: "/insurances", label: t("nav_insurances"), icon: "security", tourId: "insurances" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] py-lg w-64 fixed left-0 top-16 bg-surface border-r border-outline-variant z-40 overflow-y-auto custom-scrollbar">
      <div className="px-md mb-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{t("nav_planning") || "Financial Planning"}</h2>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{t("nav_clarity") || "Empathetic Clarity"}</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-tour={item.tourId}
            className={({ isActive }) =>
              `flex items-center gap-sm px-3 py-2.5 rounded-full font-label-md text-label-md transition-all duration-150 ${
                isActive
                  ? activeClass
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "fill-icon" : ""}`}>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-md mt-auto pt-md space-y-sm">
        <button className="w-full bg-primary text-on-primary py-2.5 rounded-full font-label-md text-label-md hover:brightness-110 transition-all flex items-center justify-center gap-xs shadow-sm">
          <span className="material-symbols-outlined text-[18px]">download</span>
          {t("nav_download")}
        </button>
        <div className="flex flex-col gap-1 border-t border-outline-variant pt-md">
          <a className="flex items-center gap-sm text-on-surface-variant font-label-md hover:text-primary py-1 transition-colors" href="#">
            <span className="material-symbols-outlined text-[18px]">help</span>{t("nav_support")}
          </a>
          <a className="flex items-center gap-sm text-on-surface-variant font-label-md hover:text-primary py-1 transition-colors" href="#">
            <span className="material-symbols-outlined text-[18px]">shield</span>{t("nav_privacy")}
          </a>
        </div>
      </div>
    </aside>
  );
}
