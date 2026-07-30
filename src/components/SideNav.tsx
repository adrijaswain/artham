import { NavLink } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { downloadReport } from "../utils/report";

type Props = {
  /** Whether the mobile slide-in drawer is open. Ignored on md+ (always visible there). */
  isOpen?: boolean;
  /** Called to close the mobile drawer (backdrop click, item tap, or close button). */
  onClose?: () => void;
};

export default function SideNav({ isOpen = false, onClose }: Props) {
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

  const navItems = (withTourId: boolean) => (
    <nav className="flex-1 space-y-0.5 px-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-tour={withTourId ? item.tourId : undefined}
          onClick={onClose}
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
  );

  const downloadButton = (
    <div className="px-md mt-auto pt-md">
      <button
        onClick={downloadReport}
        className="w-full bg-primary text-on-primary py-2.5 rounded-full font-label-md text-label-md hover:brightness-110 transition-all flex items-center justify-center gap-xs shadow-sm active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        {t("nav_download")}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] py-lg w-64 fixed left-0 top-16 bg-surface border-r border-outline-variant z-40 overflow-y-auto custom-scrollbar">
        <div className="px-md mb-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{t("nav_planning") || "Financial Planning"}</h2>
        </div>
        {navItems(true)}
        {downloadButton}
      </aside>

      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 top-16 z-40 bg-on-surface/40 transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile slide-in drawer */}
      <aside
        role="dialog"
        aria-label={t("nav_planning") || "Financial Planning"}
        aria-hidden={!isOpen}
        className={`md:hidden flex flex-col h-[calc(100vh-64px)] py-lg w-72 max-w-[80%] fixed left-0 top-16 bg-surface border-r border-outline-variant z-50 overflow-y-auto custom-scrollbar transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-md mb-md flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{t("nav_planning") || "Financial Planning"}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
            aria-label="Close navigation menu"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {navItems(false)}
        {downloadButton}
      </aside>
    </>
  );
}
