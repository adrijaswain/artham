import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Intake from "./pages/Intake";
import MedicalInput from "./pages/MedicalInput";
import Dashboard from "./pages/Dashboard";
import CostBreakdown from "./pages/CostBreakdown";
import ActionPlan from "./pages/ActionPlan";
import SupportPlan from "./pages/SupportPlan";
import Schemes from "./pages/Schemes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/intake" element={<Intake />} />
        <Route path="/medical-input" element={<MedicalInput />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cost-breakdown" element={<CostBreakdown />} />
        <Route path="/action-plan" element={<ActionPlan />} />
        <Route path="/support-plan" element={<SupportPlan />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
