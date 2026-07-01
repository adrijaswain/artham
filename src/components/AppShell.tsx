import type { ReactNode } from "react";
import TopAppBar from "./TopAppBar";
import SideNav from "./SideNav";
import Footer from "./Footer";

type Props = {
  children: ReactNode;
  /** Hide the SideNav (used on onboarding / welcome page). */
  bare?: boolean;
  /** Override the page background (Tailwind class), e.g. white dashboard or lavender landing. */
  bg?: string;
};

export default function AppShell({ children, bare = false, bg = "bg-background" }: Props) {
  return (
    <div className={`min-h-screen flex flex-col ${bg} text-on-background`}>
      <TopAppBar />
      {!bare && <SideNav />}
      <main className={`flex-1 pt-16 ${bare ? "" : "md:ml-64"}`}>
        {children}
      </main>
      <div className={bare ? "" : "md:ml-64"}>
        <Footer />
      </div>
    </div>
  );
}
