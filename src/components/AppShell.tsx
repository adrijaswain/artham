import type { ReactNode } from "react";
import { useState } from "react";
import TopAppBar from "./TopAppBar";
import SideNav from "./SideNav";
import OnboardingTour from "./OnboardingTour";
import { needsTour } from "../context/AuthContext";

type Props = {
  children: ReactNode;
  /** Hide the SideNav (used on onboarding / welcome page). */
  bare?: boolean;
  /** Override the page background (Tailwind class), e.g. white dashboard or lavender landing. */
  bg?: string;
};

export default function AppShell({ children, bare = false, bg = "bg-background" }: Props) {
  // One-time guided tour for brand-new sign-ups, highlighting the SideNav.
  // Only relevant when the SideNav is actually on screen.
  const [showTour, setShowTour] = useState(() => !bare && needsTour());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col ${bg} text-on-background`}>
      <TopAppBar onMenuClick={bare ? undefined : () => setMobileNavOpen(true)} />
      {!bare && <SideNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
      <main className={`flex-1 pt-16 ${bare ? "" : "md:ml-64"}`}>
        {children}
      </main>
      {showTour && <OnboardingTour onFinish={() => setShowTour(false)} />}
    </div>
  );
}
