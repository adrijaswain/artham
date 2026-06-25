import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth, saveUserIntakeToFirestore } from "../firebase";

const stepLabels = ["Demographics", "Diagnosis", "Treatments", "Finance"];

export default function Intake() {
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem("artham_intake_step");
    return saved ? Number(saved) : 1;
  });
  const nav = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("artham_is_logged_in") === "true");

  // State hooks for 10 form parameters - pre-populate from localStorage
  const [patientState, setPatientState] = useState<string>(() => localStorage.getItem("artham_intake_state") || "");
  const [age, setAge] = useState<string>(() => localStorage.getItem("artham_intake_age") || "");
  const [stage, setStage] = useState<string>(() => localStorage.getItem("artham_intake_stage") || "");
  const [hormoneStatus, setHormoneStatus] = useState<string>(() => localStorage.getItem("artham_intake_hormone_status") || "");
  const [surgery, setSurgery] = useState<string>(() => localStorage.getItem("artham_intake_surgery") || "Yes");
  const [chemo, setChemo] = useState<string>(() => localStorage.getItem("artham_intake_chemo") || "Yes");
  const [radiation, setRadiation] = useState<string>(() => localStorage.getItem("artham_intake_radiation") || "Yes");
  const [hospitalType, setHospitalType] = useState<string>(() => localStorage.getItem("artham_intake_hospital_type") || "Government / Public Hospital");
  const [hasInsurance, setHasInsurance] = useState<boolean>(() => localStorage.getItem("artham_intake_has_insurance") !== "false");
  const [insuranceProvider, setInsuranceProvider] = useState<string>(() => localStorage.getItem("artham_intake_insurance_provider") || "");
  const [incomeBracket, setIncomeBracket] = useState<string>(() => localStorage.getItem("artham_intake_income_bracket") || "");

  // Profile Summary transition screen state
  const [showSummaryScreen, setShowSummaryScreen] = useState<boolean>(() => {
    const savedState = localStorage.getItem("artham_intake_state");
    const savedAge = localStorage.getItem("artham_intake_age");
    const savedStage = localStorage.getItem("artham_intake_stage");
    return !!savedState && !!savedAge && !!savedStage;
  });

  // Summary Edit mode toggle
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthAndSync = () => {
      setIsLoggedIn(localStorage.getItem("artham_is_logged_in") === "true");
      setPatientState(localStorage.getItem("artham_intake_state") || "");
      setAge(localStorage.getItem("artham_intake_age") || "");
      setStage(localStorage.getItem("artham_intake_stage") || "");
      setHormoneStatus(localStorage.getItem("artham_intake_hormone_status") || "");
      setSurgery(localStorage.getItem("artham_intake_surgery") || "Yes");
      setChemo(localStorage.getItem("artham_intake_chemo") || "Yes");
      setRadiation(localStorage.getItem("artham_intake_radiation") || "Yes");
      setHospitalType(localStorage.getItem("artham_intake_hospital_type") || "Government / Public Hospital");
      setHasInsurance(localStorage.getItem("artham_intake_has_insurance") !== "false");
      setInsuranceProvider(localStorage.getItem("artham_intake_insurance_provider") || "");
      setIncomeBracket(localStorage.getItem("artham_intake_income_bracket") || "");
      
      const savedStep = localStorage.getItem("artham_intake_step");
      if (savedStep) {
        setStep(Number(savedStep));
      }
    };

    window.addEventListener("auth-change", checkAuthAndSync);
    return () => window.removeEventListener("auth-change", checkAuthAndSync);
  }, []);

  // Debounced auto-save to localStorage and Firestore when filling intake data
  useEffect(() => {
    const isEmpty = !patientState && !age && !stage && !hormoneStatus && hospitalType === "Government / Public Hospital" && hasInsurance && !insuranceProvider && !incomeBracket;
    if (isEmpty) return;

    const timer = setTimeout(() => {
      localStorage.setItem("artham_intake_state", patientState);
      localStorage.setItem("artham_intake_age", age);
      localStorage.setItem("artham_intake_stage", stage);
      localStorage.setItem("artham_intake_hormone_status", hormoneStatus);
      localStorage.setItem("artham_intake_surgery", surgery);
      localStorage.setItem("artham_intake_chemo", chemo);
      localStorage.setItem("artham_intake_radiation", radiation);
      localStorage.setItem("artham_intake_hospital_type", hospitalType);
      localStorage.setItem("artham_intake_has_insurance", String(hasInsurance));
      localStorage.setItem("artham_intake_insurance_provider", insuranceProvider);
      localStorage.setItem("artham_intake_income_bracket", incomeBracket);
      localStorage.setItem("artham_intake_step", String(step));

      if (auth.currentUser) {
        saveUserIntakeToFirestore(auth.currentUser.uid, {
          artham_intake_state: patientState,
          artham_intake_age: age,
          artham_intake_stage: stage,
          artham_intake_hormone_status: hormoneStatus,
          artham_intake_surgery: surgery,
          artham_intake_chemo: chemo,
          artham_intake_radiation: radiation,
          artham_intake_hospital_type: hospitalType,
          artham_intake_has_insurance: String(hasInsurance),
          artham_intake_insurance_provider: insuranceProvider,
          artham_intake_income_bracket: incomeBracket,
          artham_intake_step: String(step)
        });
      }

      window.dispatchEvent(new CustomEvent("auth-change"));
    }, 1000);

    return () => clearTimeout(timer);
  }, [patientState, age, stage, hormoneStatus, surgery, chemo, radiation, hospitalType, hasInsurance, insuranceProvider, incomeBracket, step]);

  const handleResetProfile = () => {
    if (window.confirm("Are you sure you want to clear your intake profile data? This will restart onboarding.")) {
      setPatientState("");
      setAge("");
      setStage("");
      setHormoneStatus("");
      setSurgery("Yes");
      setChemo("Yes");
      setRadiation("Yes");
      setHospitalType("Government / Public Hospital");
      setHasInsurance(true);
      setInsuranceProvider("");
      setIncomeBracket("");
      setStep(1);
      setShowSummaryScreen(false);
      setIsEditingSummary(false);

      // Clear from localStorage immediately
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
        "artham_chatbot_diagnosis_details",
        "artham_chatbot_next_steps"
      ];
      INTAKE_KEYS.forEach(key => localStorage.removeItem(key));

      if (auth.currentUser) {
        saveUserIntakeToFirestore(auth.currentUser.uid, {
          artham_intake_state: "",
          artham_intake_age: "",
          artham_intake_stage: "",
          artham_intake_hormone_status: "",
          artham_intake_surgery: "Yes",
          artham_intake_chemo: "Yes",
          artham_intake_radiation: "Yes",
          artham_intake_hospital_type: "Government / Public Hospital",
          artham_intake_has_insurance: "true",
          artham_intake_insurance_provider: "",
          artham_intake_income_bracket: "",
          artham_intake_step: "1"
        });
      }

      window.dispatchEvent(new CustomEvent("auth-change"));
    }
  };

  const handleSummaryFieldChange = (key: string, val: string | boolean) => {
    // 1. Update React hook state
    if (key === "state") setPatientState(val as string);
    else if (key === "age") setAge(val as string);
    else if (key === "stage") setStage(val as string);
    else if (key === "hormone_status") setHormoneStatus(val as string);
    else if (key === "surgery") setSurgery(val as string);
    else if (key === "chemo") setChemo(val as string);
    else if (key === "radiation") setRadiation(val as string);
    else if (key === "hospital_type") setHospitalType(val as string);
    else if (key === "has_insurance") setHasInsurance(val === "true" || val === true);
    else if (key === "insurance_provider") setInsuranceProvider(val as string);
    else if (key === "income_bracket") setIncomeBracket(val as string);

    // 2. Save directly to LocalStorage
    localStorage.setItem(`artham_intake_${key}`, String(val));

    // 3. Save to firestore if logged in
    if (auth.currentUser) {
      saveUserIntakeToFirestore(auth.currentUser.uid, {
        artham_intake_state: key === "state" ? (val as string) : patientState,
        artham_intake_age: key === "age" ? (val as string) : age,
        artham_intake_stage: key === "stage" ? (val as string) : stage,
        artham_intake_hormone_status: key === "hormone_status" ? (val as string) : hormoneStatus,
        artham_intake_surgery: key === "surgery" ? (val as string) : surgery,
        artham_intake_chemo: key === "chemo" ? (val as string) : chemo,
        artham_intake_radiation: key === "radiation" ? (val as string) : radiation,
        artham_intake_hospital_type: key === "hospital_type" ? (val as string) : hospitalType,
        artham_intake_has_insurance: key === "has_insurance" ? String(val) : String(hasInsurance),
        artham_intake_insurance_provider: key === "insurance_provider" ? (val as string) : insuranceProvider,
        artham_intake_income_bracket: key === "income_bracket" ? (val as string) : incomeBracket,
        artham_intake_step: String(step)
      });
    }

    // 4. Notify other views reactively
    window.dispatchEvent(new CustomEvent("auth-change"));
  };

  const goNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete intake: save immediately
      localStorage.setItem("artham_intake_state", patientState);
      localStorage.setItem("artham_intake_age", age);
      localStorage.setItem("artham_intake_stage", stage);
      localStorage.setItem("artham_intake_hormone_status", hormoneStatus);
      localStorage.setItem("artham_intake_surgery", surgery);
      localStorage.setItem("artham_intake_chemo", chemo);
      localStorage.setItem("artham_intake_radiation", radiation);
      localStorage.setItem("artham_intake_hospital_type", hospitalType);
      localStorage.setItem("artham_intake_has_insurance", String(hasInsurance));
      localStorage.setItem("artham_intake_insurance_provider", insuranceProvider);
      localStorage.setItem("artham_intake_income_bracket", incomeBracket);
      localStorage.setItem("artham_intake_step", "4");

      if (auth.currentUser) {
        saveUserIntakeToFirestore(auth.currentUser.uid, {
          artham_intake_state: patientState,
          artham_intake_age: age,
          artham_intake_stage: stage,
          artham_intake_hormone_status: hormoneStatus,
          artham_intake_surgery: surgery,
          artham_intake_chemo: chemo,
          artham_intake_radiation: radiation,
          artham_intake_hospital_type: hospitalType,
          artham_intake_has_insurance: String(hasInsurance),
          artham_intake_insurance_provider: insuranceProvider,
          artham_intake_income_bracket: incomeBracket,
          artham_intake_step: "4"
        });
      }

      window.dispatchEvent(new CustomEvent("auth-change"));
      setShowSummaryScreen(true); // Show live profile summary on completion
      setIsEditingSummary(false); // Default to locked view
    }
  };

  const goPrev = () => {
    const prevStep = Math.max(1, step - 1);
    setStep(prevStep);
  };

  // Full Screen Profile Summary View
  if (showSummaryScreen) {
    return (
      <AppShell>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-md pb-xl space-y-md animate-fade-in">
          
          {/* Header */}
          <header className="mb-md border-b border-outline-variant/40 pb-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                  Your Intake Profile Summary
                </h1>
                <p className="font-body-md text-on-surface-variant text-xs font-normal">
                  Onboarding complete! Your details are saved. Click **Edit Profile** to toggle edit mode for minor adjustments.
                </p>
              </div>
              <span className="px-sm py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wider border border-secondary-container">
                Onboarding Saved
              </span>
            </div>
          </header>

          {/* Grid of editable cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            
            {/* Age Card */}
            <SummaryCard icon="calendar_month" label="Patient Age" value={age || "Not specified"} isEditing={isEditingSummary}>
              <input
                type="number"
                value={age}
                onChange={(e) => handleSummaryFieldChange("age", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface"
              />
            </SummaryCard>

            {/* State Card */}
            <SummaryCard icon="map" label="Indian State" value={patientState || "Not specified"} isEditing={isEditingSummary}>
              <select
                value={patientState}
                onChange={(e) => handleSummaryFieldChange("state", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">Select State</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Kerala">Kerala</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Odisha">Odisha</option>
                <option value="Other">Other State</option>
              </select>
            </SummaryCard>

            {/* Cancer Stage Card */}
            <SummaryCard icon="biotech" label="Cancer Stage" value={stage || "Not specified"} isEditing={isEditingSummary}>
              <select
                value={stage}
                onChange={(e) => handleSummaryFieldChange("stage", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">Select Stage</option>
                <option value="Stage I">Stage I (Early local)</option>
                <option value="Stage II">Stage II (Invasive local)</option>
                <option value="Stage III">Stage III (Locally advanced)</option>
                <option value="Stage IV">Stage IV (Metastatic)</option>
                <option value="Unsure">Unsure / Stage pending</option>
              </select>
            </SummaryCard>

            {/* Hormone Status Card */}
            <SummaryCard icon="clinical_notes" label="Receptor / Hormone Status" value={hormoneStatus || "Not specified"} isEditing={isEditingSummary}>
              <select
                value={hormoneStatus}
                onChange={(e) => handleSummaryFieldChange("hormone_status", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">Select receptor status</option>
                <option value="HER2 Positive">HER2 Positive (requires targeted therapy)</option>
                <option value="Triple Negative">Triple Negative (highly chemo-responsive)</option>
                <option value="ER+/PR+ Positive">ER+/PR+ Positive (hormone responsive)</option>
                <option value="Unsure">Unsure / Receptor pending</option>
              </select>
            </SummaryCard>

            {/* Surgery Card */}
            <SummaryCard icon="medical_services" label="Surgery Indicated" value={surgery} isEditing={isEditingSummary}>
              <select
                value={surgery}
                onChange={(e) => handleSummaryFieldChange("surgery", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unsure">Unsure</option>
              </select>
            </SummaryCard>

            {/* Chemo Card */}
            <SummaryCard icon="medication" label="Chemo Indicated" value={chemo} isEditing={isEditingSummary}>
              <select
                value={chemo}
                onChange={(e) => handleSummaryFieldChange("chemo", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unsure">Unsure</option>
              </select>
            </SummaryCard>

            {/* Radiation Card */}
            <SummaryCard icon="bolt" label="Radiation Indicated" value={radiation} isEditing={isEditingSummary}>
              <select
                value={radiation}
                onChange={(e) => handleSummaryFieldChange("radiation", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unsure">Unsure</option>
              </select>
            </SummaryCard>

            {/* Hospital Preference Card */}
            <SummaryCard icon="home_health" label="Hospital Preference" value={hospitalType} isEditing={isEditingSummary}>
              <select
                value={hospitalType}
                onChange={(e) => handleSummaryFieldChange("hospital_type", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Government / Public Hospital">Government / Public Hospital</option>
                <option value="Private Medical Center">Private Medical Center</option>
                <option value="Premium Corporate Hospital">Premium Corporate Hospital</option>
                <option value="I'm Unsure">I'm Unsure</option>
              </select>
            </SummaryCard>

            {/* Insurance Card */}
            <SummaryCard icon="shield" label="Insurance Status" value={hasInsurance ? "Insured" : "Not Insured"} isEditing={isEditingSummary}>
              <select
                value={hasInsurance ? "Insured" : "Not Insured"}
                onChange={(e) => handleSummaryFieldChange("has_insurance", e.target.value === "Insured")}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Insured">Insured</option>
                <option value="Not Insured">Not Insured</option>
              </select>
            </SummaryCard>

            {/* Insurance Provider Card (conditional) */}
            {hasInsurance && (
              <SummaryCard icon="verified_user" label="Insurance Provider" value={insuranceProvider || "Not specified"} isEditing={isEditingSummary}>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={(e) => handleSummaryFieldChange("insurance_provider", e.target.value)}
                  className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface"
                  placeholder="e.g. Star Health"
                />
              </SummaryCard>
            )}

            {/* Household Income Card */}
            <SummaryCard icon="payments" label="Household Annual Income" value={incomeBracket || "Not specified"} isEditing={isEditingSummary}>
              <select
                value={incomeBracket}
                onChange={(e) => handleSummaryFieldChange("income_bracket", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">Select income bracket</option>
                <option value="Below ₹2,50,000">Below ₹2,50,000</option>
                <option value="₹2,50,000 – ₹5,00,000">₹2,50,000 – ₹5,00,000</option>
                <option value="₹5,00,000 – ₹10,00,000">₹5,00,000 – ₹10,00,000</option>
                <option value="Above ₹10,00,000">Above ₹10,00,000</option>
              </select>
            </SummaryCard>

          </div>

          {/* Action Bar */}
          <div className="pt-md border-t border-outline-variant/60 flex flex-col sm:flex-row justify-between items-center gap-sm">
            <div className="flex gap-sm">
              {isEditingSummary ? (
                <button
                  onClick={() => setIsEditingSummary(false)}
                  className="px-md py-sm bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs shadow-md animate-fade-in"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="px-md py-sm bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs shadow-md animate-fade-in"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Profile Summary
                </button>
              )}
              <button
                onClick={handleResetProfile}
                className="px-md py-sm border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-outline hover:text-error transition-all active:scale-95 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Clear Profile & Restart
              </button>
            </div>

            <div className="flex gap-sm w-full sm:w-auto">
              <button
                onClick={() => nav("/dashboard")}
                className="flex-1 sm:flex-none px-lg py-sm border border-primary text-primary rounded-xl text-xs font-bold hover:bg-primary/5 active:scale-95 transition-all flex justify-center items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                Financial Dashboard
              </button>
              <button
                onClick={() => nav("/medical-input")}
                className="flex-1 sm:flex-none px-lg py-sm bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-xs shadow-md"
              >
                <span>Proceed to Medical Input Chatbot</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-md pb-xl space-y-md animate-fade-in">
        
        {/* Header Block */}
        <header className="mb-md border-b border-outline-variant/40 pb-sm">
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Patient Financial Intake
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs font-normal">
            Complete the form to unlock personalized government schemes, insurance coverage estimates, and treatment pricing worksheets.
          </p>
        </header>

        {!isLoggedIn && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm shadow-sm animate-fade-in">
            <div className="flex gap-sm items-start">
              <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">security</span>
              <div>
                <p className="font-bold text-xs text-primary uppercase tracking-wider">Save Your Medical Profile (Optional)</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  You are currently filling the intake as a Guest. Log in or create a free account to back up this data securely and retrieve it later.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
              className="px-4 py-2 bg-primary text-on-primary hover:brightness-110 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shrink-0"
            >
              Sign Up / Log In
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
          
          {/* Left Panel: Form & Stepper */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-md">
            
            {/* Stepper progress bar */}
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-md shadow-sm">
              <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant/50 -z-10 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-[2px] bg-primary -z-10 -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const done = n < step;
                  const active = n === step;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => n <= step && setStep(n)}
                      className="flex flex-col items-center group focus:outline-none"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                          done
                            ? "bg-secondary text-on-secondary"
                            : active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-outline"
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-sm">check</span> : n}
                      </div>
                      <span
                        className={`font-label-sm text-[10px] font-bold mt-2 ${
                          done ? "text-secondary" : active ? "text-on-surface" : "text-outline"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Step Component Panel */}
            <div className="flex-1">
              {step === 1 && (
                <Section
                  title="Tell us about yourself"
                  subtitle="Basic demographics help determine age-specific coverage and state welfare subsidies."
                  icon="person"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <Field label="Age" hint="Age impacts screening frequencies and welfare criteria.">
                      <input
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs"
                        placeholder="e.g. 45"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </Field>
                    <Field label="Indian State" hint="Determines matching state-level healthcare packages.">
                      <select
                        value={patientState}
                        onChange={(e) => setPatientState(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">Select State</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Assam">Assam</option>
                        <option value="Other">Other State</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onNext={goNext} nextLabel="Save & Continue" />
                </Section>
              )}

              {step === 2 && (
                <Section
                  title="Clinical & Diagnostics Profile"
                  subtitle="Specify staging details to estimate medical complexity and pathway costs."
                  icon="biotech"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <Field label="Cancer Stage" hint="Helps establish the primary clinical treatment workflow.">
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">Select Stage</option>
                        <option value="Stage I">Stage I (Early local)</option>
                        <option value="Stage II">Stage II (Invasive local)</option>
                        <option value="Stage III">Stage III (Locally advanced)</option>
                        <option value="Stage IV">Stage IV (Metastatic)</option>
                        <option value="Unsure">Unsure / Stage pending</option>
                      </select>
                    </Field>
                    <Field label="HER2 / Triple Negative / ER-PR Status" hint="Hormone receptors govern specialized drug regimens.">
                      <select
                        value={hormoneStatus}
                        onChange={(e) => setHormoneStatus(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">Select receptor status</option>
                        <option value="HER2 Positive">HER2 Positive (requires targeted therapy)</option>
                        <option value="Triple Negative">Triple Negative (highly chemo-responsive)</option>
                        <option value="ER+/PR+ Positive">ER+/PR+ Positive (hormone responsive)</option>
                        <option value="Unsure">Unsure / Receptor pending</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Save & Continue" />
                </Section>
              )}

              {step === 3 && (
                <Section
                  title="Treatment Pathway Recommendations"
                  subtitle="Select the primary oncology phases recommended by your clinical team."
                  icon="clinical_notes"
                >
                  <div className="space-y-md">
                    <Field label="Surgery Recommended?">
                      <select
                        value={surgery}
                        onChange={(e) => setSurgery(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">Yes (Lumpectomy or Mastectomy planned)</option>
                        <option value="No">No / Not recommended</option>
                        <option value="Unsure">Unsure / To be decided</option>
                      </select>
                    </Field>
                    <Field label="Chemotherapy Recommended?">
                      <select
                        value={chemo}
                        onChange={(e) => setChemo(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">Yes (Systemic infusion rounds prescribed)</option>
                        <option value="No">No / Not recommended</option>
                        <option value="Unsure">Unsure / To be decided</option>
                      </select>
                    </Field>
                    <Field label="Radiation Recommended?">
                      <select
                        value={radiation}
                        onChange={(e) => setRadiation(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">Yes (Post-surgical radiation indicated)</option>
                        <option value="No">No / Not recommended</option>
                        <option value="Unsure">Unsure / To be decided</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Save & Continue" />
                </Section>
              )}

              {step === 4 && (
                <Section
                  title="Hospital Preference & Insurance"
                  subtitle="Verify financial brackets to identify subsidies, room caps, and cash-free programs."
                  icon="payments"
                >
                  <div className="space-y-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      <Field label="Hospital classification">
                        <select
                          value={hospitalType}
                          onChange={(e) => setHospitalType(e.target.value)}
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                        >
                          <option value="Government / Public Hospital">Government / Public Hospital (subsidized)</option>
                          <option value="Private Medical Center">Private Medical Center (moderate corporate network)</option>
                          <option value="Premium Corporate Hospital">Premium Corporate Hospital (high-end multi-specialty)</option>
                          <option value="I'm Unsure">I'm Unsure (uses private averages)</option>
                        </select>
                      </Field>
                      <Field label="Insurance status">
                        <select
                          value={hasInsurance ? "Insured" : "Not Insured"}
                          onChange={(e) => setHasInsurance(e.target.value === "Insured")}
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                        >
                          <option value="Insured">Insured (policy details active)</option>
                          <option value="Not Insured">Not Insured (self-paying / cash only)</option>
                        </select>
                      </Field>
                    </div>

                    {hasInsurance && (
                      <Field label="Insurance Provider & Plan Name" hint="Helps cap room limits and co-pays (e.g. Star Health, Niva Bupa).">
                        <input
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs"
                          placeholder="e.g. Star Health Assure Plan"
                          type="text"
                          value={insuranceProvider}
                          onChange={(e) => setInsuranceProvider(e.target.value)}
                        />
                      </Field>
                    )}

                    <Field label="Approximate Household Annual Income" hint="Welfare programs like PM-JAY and RAN prioritize lower-income brackets.">
                      <select
                        value={incomeBracket}
                        onChange={(e) => setIncomeBracket(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">Select income bracket</option>
                        <option value="Below ₹2,50,000">Below ₹2,50,000</option>
                        <option value="₹2,50,000 – ₹5,00,000">₹2,50,000 – ₹5,00,000</option>
                        <option value="₹5,00,000 – ₹10,00,000">₹5,00,000 – ₹10,00,000</option>
                        <option value="Above ₹10,00,000">Above ₹10,00,000</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Complete Onboarding" />
                </Section>
              )}
            </div>

          </div>

          {/* Right Panel: Live summary profile & dynamic reliability meter */}
          <div className="lg:col-span-4 space-y-md flex flex-col">
            
            {/* Live Reliability Meter */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm text-center space-y-sm">
              <h4 className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Intake Accuracy Index
              </h4>
              
              {(() => {
                let stepAccuracy = 0;
                if (patientState) stepAccuracy += 10;
                if (age) stepAccuracy += 10;
                if (stage) stepAccuracy += 15;
                if (hormoneStatus) stepAccuracy += 15;
                
                if (step >= 3) {
                  if (surgery) stepAccuracy += 10;
                  if (chemo) stepAccuracy += 10;
                  if (radiation) stepAccuracy += 10;
                }
                
                if (step >= 4) {
                  if (hospitalType) stepAccuracy += 10;
                  if (incomeBracket) stepAccuracy += 10;
                }
                
                stepAccuracy = Math.min(100, stepAccuracy);

                return (
                  <div className="relative w-40 h-20 mx-auto">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path
                        d="M 10 45 A 40 40 0 0 1 90 45"
                        fill="none"
                        stroke="#dce9ff"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10 45 A 40 40 0 0 1 90 45"
                        fill="none"
                        stroke="#006a68"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="125.66"
                        strokeDashoffset={125.66 - (125.66 * stepAccuracy) / 100}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center justify-end">
                      <span className="font-headline-md text-md text-primary font-bold leading-none">{stepAccuracy}%</span>
                      <p className="text-[9px] text-outline font-semibold uppercase tracking-wider mt-1">Reliability Score</p>
                    </div>
                  </div>
                );
              })()}
              
              <p className="font-body-sm text-[10px] text-on-surface-variant leading-relaxed px-sm pt-xs">
                Accuracy increases as you fill in key parameters. Completed profiles average a 92% reliability rate.
              </p>
            </div>

            {/* Live Profile Summary */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm flex-1 space-y-sm flex flex-col justify-between min-h-[300px]">
              <div className="space-y-sm">
                <h4 className="font-label-md text-xs font-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">assignment_ind</span>
                  Live Profile summary
                </h4>
                
                <div className="divide-y divide-outline-variant/20">
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">State</span>
                    <span className="font-bold text-on-surface">{patientState || "Not specified"}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Age</span>
                    <span className="font-bold text-on-surface">{age || "Not specified"}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Cancer Stage</span>
                    <span className="font-bold text-on-surface">{stage || "Not specified"}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Receptor Status</span>
                    <span className="font-bold text-on-surface truncate max-w-[150px]" title={hormoneStatus}>{hormoneStatus || "Not specified"}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Surgery Indicated</span>
                    <span className="font-bold text-on-surface">{surgery}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Chemo Indicated</span>
                    <span className="font-bold text-on-surface">{chemo}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Radiation Indicated</span>
                    <span className="font-bold text-on-surface">{radiation}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Hospital preference</span>
                    <span className="font-bold text-on-surface truncate max-w-[150px]" title={hospitalType}>{hospitalType}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Insurance status</span>
                    <span className="font-bold text-on-surface truncate max-w-[150px]">
                      {hasInsurance ? (insuranceProvider || "Provider pending") : "No Health Insurance"}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant font-medium">Household Income</span>
                    <span className="font-bold text-on-surface">{incomeBracket || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-sm pt-sm border-t border-outline-variant/30">
                <div className="flex gap-sm">
                  <button
                    onClick={() => {
                      setShowSummaryScreen(true);
                      setIsEditingSummary(true);
                    }}
                    className="flex-1 py-1.5 border border-outline-variant hover:bg-surface-container-high rounded-xl text-[10px] font-bold text-primary active:scale-95 transition-all flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Edit Details
                  </button>
                  <button
                    onClick={handleResetProfile}
                    className="flex-1 py-1.5 border border-error/30 hover:bg-error/5 text-error rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    Reset Profile
                  </button>
                </div>

                <div className="text-[9px] text-outline font-bold uppercase tracking-wider flex items-center gap-xs pt-xs">
                  <span className={`h-2 w-2 rounded-full ${step === 4 ? "bg-secondary" : "bg-primary animate-pulse"}`} />
                  {step === 4 ? "Profile Ready for Analysis" : `Filling Section ${step} of 4`}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest p-lg rounded-xl tonal-card-shadow border border-outline-variant/30">
      <div className="flex justify-between items-start mb-md">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary mb-1">{title}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="material-symbols-outlined fill-icon text-secondary text-3xl">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-xs">
      <label className="font-label-md text-label-md text-on-surface">{label}</label>
      {children}
      {hint && <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}

function FooterBar({
  onPrev,
  onNext,
  nextLabel,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="mt-lg pt-md border-t border-outline-variant flex justify-between items-center">
      {onPrev ? (
        <button onClick={onPrev} className="text-on-surface-variant font-label-md text-label-md hover:underline">
          Back
        </button>
      ) : (
        <button className="text-secondary font-label-md text-label-md hover:underline">I don't know</button>
      )}
      <button
        onClick={onNext}
        className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        {nextLabel}
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  isEditing,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  isEditing: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-md rounded-2xl border border-outline-variant/60 shadow-xs hover:shadow transition-shadow flex items-start gap-sm">
      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div className="flex-grow space-y-1">
        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{label}</span>
        {isEditing ? (
          <div>{children}</div>
        ) : (
          <div className="text-xs font-bold text-on-surface py-[5px]">{value}</div>
        )}
      </div>
    </div>
  );
}
