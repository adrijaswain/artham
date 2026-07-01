import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./components/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Intake from "./pages/Intake";
import MedicalInput from "./pages/MedicalInput";
import Dashboard from "./pages/Dashboard";
import CostBreakdown from "./pages/CostBreakdown";
import ActionPlan from "./pages/ActionPlan";
import Schemes from "./pages/Schemes";
import PreventivePlans from "./pages/PreventivePlans";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authReady } = useAuth();

  // Hold rendering until the initial auth state resolves so pages never flash
  // guest/empty data before a returning user's profile is restored.
  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-on-surface-variant">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        <p className="text-sm font-medium tracking-wide">Loading your workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthGate>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
              <Route path="/intake" element={<Intake />} />
              <Route path="/medical-input" element={<MedicalInput />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cost-breakdown" element={<CostBreakdown />} />
              <Route path="/action-plan" element={<ActionPlan />} />
              <Route path="/support-plan" element={<Navigate to="/action-plan" replace />} />
              <Route path="/schemes" element={<Schemes key="schemes" />} />
              <Route path="/insurances" element={<Schemes key="insurances" />} />
              <Route path="/preventive-plans" element={<PreventivePlans />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
