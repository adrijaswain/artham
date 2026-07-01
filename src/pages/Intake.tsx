import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth, saveUserIntakeToFirestore } from "../firebase";
import { useLanguage } from "../components/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function Intake() {
  const { t, language } = useLanguage();
  const { isLoggedIn, syncing } = useAuth();
  const stepLabels = [
    t("it_step_demographics"),
    t("it_step_diagnosis"),
    t("it_step_treatments"),
    t("it_step_finance")
  ];

  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem("artham_intake_step");
    return saved ? Number(saved) : 1;
  });
  const nav = useNavigate();

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
    // Re-read the profile from LocalStorage whenever auth state changes. This
    // fires after AuthProvider hydrates a returning user's data from Firestore,
    // so the form (and the completed-profile summary) reflect their saved context.
    const checkAuthAndSync = () => {
      const savedState = localStorage.getItem("artham_intake_state") || "";
      const savedAge = localStorage.getItem("artham_intake_age") || "";
      const savedStage = localStorage.getItem("artham_intake_stage") || "";

      setPatientState(savedState);
      setAge(savedAge);
      setStage(savedStage);
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

  // Once a logged-in user's profile has finished loading from Firestore, show
  // their saved-profile summary (rather than restarting the wizard) if their
  // intake is already complete. Runs on initial load and on login-in-place.
  useEffect(() => {
    if (!isLoggedIn || syncing || isEditingSummary) return;
    const complete =
      !!localStorage.getItem("artham_intake_state") &&
      !!localStorage.getItem("artham_intake_age") &&
      !!localStorage.getItem("artham_intake_stage");
    if (complete) setShowSummaryScreen(true);
  }, [isLoggedIn, syncing, isEditingSummary]);

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

      // Don't write while the profile is still loading from Firestore, or we
      // could clobber saved data with a partially-hydrated form.
      if (auth.currentUser && !syncing) {
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [patientState, age, stage, hormoneStatus, surgery, chemo, radiation, hospitalType, hasInsurance, insuranceProvider, incomeBracket, step, syncing]);

  const handleResetProfile = () => {
    if (window.confirm(t("it_reset_confirm"))) {
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

  const getLocalValue = (field: string, value: string) => {
    if (!value || value === "Not specified") return t("it_not_specified");
    if (field === "state") {
      const stateTranslations: Record<string, Record<string, string>> = {
        en: { Karnataka: "Karnataka", Maharashtra: "Maharashtra", Delhi: "Delhi", "Tamil Nadu": "Tamil Nadu", "West Bengal": "West Bengal", Kerala: "Kerala", Gujarat: "Gujarat", Telangana: "Telangana", "Andhra Pradesh": "Andhra Pradesh", "Uttar Pradesh": "Uttar Pradesh", Rajasthan: "Rajasthan", Odisha: "Odisha", Haryana: "Haryana", Punjab: "Punjab", Assam: "Assam", Other: "Other State" },
        hi: { Karnataka: "कर्नाटक", Maharashtra: "महाराष्ट्र", Delhi: "दिल्ली", "Tamil Nadu": "तमिलनाडु", "West Bengal": "पश्चिम बंगाल", Kerala: "केरल", Gujarat: "गुजरात", Telangana: "तेलंगाना", "Andhra Pradesh": "आंध्र प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश", Rajasthan: "राजस्थान", Odisha: "ओडिशा", Haryana: "हरियाणा", Punjab: "पंजाब", Assam: "असम", Other: "अन्य राज्य" },
        mr: { Karnataka: "कर्नाटक", Maharashtra: "महाराष्ट्र", Delhi: "दिल्ली", "Tamil Nadu": "तमिळनाडू", "West Bengal": "पश्चिम बंगाल", Kerala: "केरल", Gujarat: "गुजरात", Telangana: "तेलंगणा", "Andhra Pradesh": "आंध्र प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश", Rajasthan: "राजस्थान", Odisha: "ओडिशा", Haryana: "हरियाणा", Punjab: "पंजाब", Assam: "आसाम", Other: "इतर राज्य" },
        kn: { Karnataka: "ಕರ್ನಾಟಕ", Maharashtra: "ಮಹಾರಾಷ್ಟ್ರ", Delhi: "ದೆಹಲಿ", "Tamil Nadu": "ತಮಿಳುನಾಡು", "West Bengal": "ಪಶ್ಚಿಮ ಬಂಗಾಳ", Kerala: "ಕೇರಳ", Gujarat: "ಗುಜರಾತ್", Telangana: "ತೆಲಂಗಾಣ", "Andhra Pradesh": "ಆಂಧ್ರಪ್ರದೇಶ", "Uttar Pradesh": "ಉತ್ತರ ಪ್ರದೇಶ", Rajasthan: "ರಾಜಸ್ಥಾನ", Odisha: "ಒಡಿಸ್ಸಾ", Haryana: "ಹರಿಯಾಣ", Punjab: "ಪಂಜಾಬ್", Assam: "ಅಸ್ಸಾಂ", Other: "ಇತರ ರಾಜ್ಯ" },
        bn: { Karnataka: "কর্ণাটক", Maharashtra: "মহারাষ্ট্র", Delhi: "দিল্লি", "Tamil Nadu": "তামিলনাড়ু", "West Bengal": "পশ্চিমবঙ্গ", Kerala: "কেরালা", Gujarat: "গুজরাট", Telangana: "তেলেঙ্গানা", "Andhra Pradesh": "অন্ধ্রপ্রদেশ", "Uttar Pradesh": "উত্তরপ্রদেশ", Rajasthan: "রাজস্থান", Odisha: "ওড়িশা", Haryana: "হরিয়ানা", Punjab: "পাঞ্জাব", Assam: "আসাম", Other: "অন্যান্য রাজ্য" }
      };
      const langDict = stateTranslations[language] || stateTranslations["en"];
      return langDict[value] || value;
    }
    if (field === "stage") {
      if (value === "Stage I") return t("it_stage_i");
      if (value === "Stage II") return t("it_stage_ii");
      if (value === "Stage III") return t("it_stage_iii");
      if (value === "Stage IV") return t("it_stage_iv");
      if (value === "Unsure") return t("it_stage_unsure");
    }
    if (field === "receptor") {
      if (value === "HER2 Positive") return t("it_receptor_her2");
      if (value === "Triple Negative") return t("it_receptor_tn");
      if (value === "ER+/PR+ Positive") return t("it_receptor_erpr");
      if (value === "Unsure") return t("it_receptor_unsure");
    }
    if (field === "yesno") {
      if (value === "Yes") return t("it_yes");
      if (value === "No") return t("it_no");
      if (value === "Unsure") return t("it_unsure");
    }
    if (field === "hospital") {
      if (value === "Government / Public Hospital") return t("it_hospital_gov");
      if (value === "Private Medical Center") return t("it_hospital_priv");
      if (value === "Premium Corporate Hospital") return t("it_hospital_prem");
      if (value === "I'm Unsure") return t("it_hospital_unsure");
    }
    if (field === "insurance") {
      if (value === "Insured") return t("it_insured");
      if (value === "Not Insured") return t("it_not_insured");
    }
    if (field === "income") {
      if (value === "Below ₹2,50,000") return t("it_income_below_2_5");
      if (value === "₹2,50,000 – ₹5,00,000") return t("it_income_2_5_to_5");
      if (value === "₹5,00,000 – ₹10,00,000") return t("it_income_5_to_10");
      if (value === "Above ₹10,00,000") return t("it_income_above_10");
    }
    return value;
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
                  {t("it_summary_title")}
                </h1>
                <p className="font-body-md text-on-surface-variant text-xs font-normal">
                  {t("it_summary_subtitle")}
                </p>
              </div>
              <span className="px-sm py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wider border border-secondary-container">
                {t("it_onboarding_saved")}
              </span>
            </div>
          </header>

          {/* Grid of editable cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            
            {/* Age Card */}
            <SummaryCard icon="calendar_month" label={t("it_age")} value={age || t("it_not_specified")} isEditing={isEditingSummary}>
              <input
                type="number"
                value={age}
                onChange={(e) => handleSummaryFieldChange("age", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface"
              />
            </SummaryCard>

            {/* State Card */}
            <SummaryCard icon="map" label={t("it_state")} value={getLocalValue("state", patientState)} isEditing={isEditingSummary}>
              <select
                value={patientState}
                onChange={(e) => handleSummaryFieldChange("state", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">{t("it_select_state")}</option>
                <option value="Karnataka">{getLocalValue("state", "Karnataka")}</option>
                <option value="Maharashtra">{getLocalValue("state", "Maharashtra")}</option>
                <option value="Delhi">{getLocalValue("state", "Delhi")}</option>
                <option value="Tamil Nadu">{getLocalValue("state", "Tamil Nadu")}</option>
                <option value="West Bengal">{getLocalValue("state", "West Bengal")}</option>
                <option value="Kerala">{getLocalValue("state", "Kerala")}</option>
                <option value="Gujarat">{getLocalValue("state", "Gujarat")}</option>
                <option value="Telangana">{getLocalValue("state", "Telangana")}</option>
                <option value="Andhra Pradesh">{getLocalValue("state", "Andhra Pradesh")}</option>
                <option value="Uttar Pradesh">{getLocalValue("state", "Uttar Pradesh")}</option>
                <option value="Rajasthan">{getLocalValue("state", "Rajasthan")}</option>
                <option value="Odisha">{getLocalValue("state", "Odisha")}</option>
                <option value="Other">{getLocalValue("state", "Other")}</option>
              </select>
            </SummaryCard>

            {/* Cancer Stage Card */}
            <SummaryCard icon="biotech" label={t("it_stage")} value={getLocalValue("stage", stage)} isEditing={isEditingSummary}>
              <select
                value={stage}
                onChange={(e) => handleSummaryFieldChange("stage", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">{t("it_stage_select")}</option>
                <option value="Stage I">{getLocalValue("stage", "Stage I")}</option>
                <option value="Stage II">{getLocalValue("stage", "Stage II")}</option>
                <option value="Stage III">{getLocalValue("stage", "Stage III")}</option>
                <option value="Stage IV">{getLocalValue("stage", "Stage IV")}</option>
                <option value="Unsure">{getLocalValue("stage", "Unsure")}</option>
              </select>
            </SummaryCard>

            {/* Hormone Status Card */}
            <SummaryCard icon="clinical_notes" label={t("it_receptor")} value={getLocalValue("receptor", hormoneStatus)} isEditing={isEditingSummary}>
              <select
                value={hormoneStatus}
                onChange={(e) => handleSummaryFieldChange("hormone_status", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">{t("it_select_receptor")}</option>
                <option value="HER2 Positive">{getLocalValue("receptor", "HER2 Positive")}</option>
                <option value="Triple Negative">{getLocalValue("receptor", "Triple Negative")}</option>
                <option value="ER+/PR+ Positive">{getLocalValue("receptor", "ER+/PR+ Positive")}</option>
                <option value="Unsure">{getLocalValue("receptor", "Unsure")}</option>
              </select>
            </SummaryCard>

            {/* Surgery Card */}
            <SummaryCard icon="medical_services" label={t("it_surgery")} value={getLocalValue("yesno", surgery)} isEditing={isEditingSummary}>
              <select
                value={surgery}
                onChange={(e) => handleSummaryFieldChange("surgery", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">{t("it_yes")}</option>
                <option value="No">{t("it_no")}</option>
                <option value="Unsure">{t("it_unsure")}</option>
              </select>
            </SummaryCard>

            {/* Chemo Card */}
            <SummaryCard icon="medication" label={t("it_chemo")} value={getLocalValue("yesno", chemo)} isEditing={isEditingSummary}>
              <select
                value={chemo}
                onChange={(e) => handleSummaryFieldChange("chemo", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">{t("it_yes")}</option>
                <option value="No">{t("it_no")}</option>
                <option value="Unsure">{t("it_unsure")}</option>
              </select>
            </SummaryCard>

            {/* Radiation Card */}
            <SummaryCard icon="bolt" label={t("it_radiation")} value={getLocalValue("yesno", radiation)} isEditing={isEditingSummary}>
              <select
                value={radiation}
                onChange={(e) => handleSummaryFieldChange("radiation", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Yes">{t("it_yes")}</option>
                <option value="No">{t("it_no")}</option>
                <option value="Unsure">{t("it_unsure")}</option>
              </select>
            </SummaryCard>

            {/* Hospital Preference Card */}
            <SummaryCard icon="home_health" label={t("it_hospital")} value={getLocalValue("hospital", hospitalType)} isEditing={isEditingSummary}>
              <select
                value={hospitalType}
                onChange={(e) => handleSummaryFieldChange("hospital_type", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Government / Public Hospital">{getLocalValue("hospital", "Government / Public Hospital")}</option>
                <option value="Private Medical Center">{getLocalValue("hospital", "Private Medical Center")}</option>
                <option value="Premium Corporate Hospital">{getLocalValue("hospital", "Premium Corporate Hospital")}</option>
                <option value="I'm Unsure">{getLocalValue("hospital", "I'm Unsure")}</option>
              </select>
            </SummaryCard>

            {/* Insurance Card */}
            <SummaryCard icon="shield" label={t("it_insurance_status")} value={hasInsurance ? t("it_insured") : t("it_not_insured")} isEditing={isEditingSummary}>
              <select
                value={hasInsurance ? "Insured" : "Not Insured"}
                onChange={(e) => handleSummaryFieldChange("has_insurance", e.target.value === "Insured")}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="Insured">{t("it_insured")}</option>
                <option value="Not Insured">{t("it_not_insured")}</option>
              </select>
            </SummaryCard>

            {/* Insurance Provider Card (conditional) */}
            {hasInsurance && (
              <SummaryCard icon="verified_user" label={t("it_insurance_provider_q")} value={insuranceProvider || t("it_not_specified")} isEditing={isEditingSummary}>
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
            <SummaryCard icon="payments" label={t("it_income")} value={getLocalValue("income", incomeBracket)} isEditing={isEditingSummary}>
              <select
                value={incomeBracket}
                onChange={(e) => handleSummaryFieldChange("income_bracket", e.target.value)}
                className="w-full bg-transparent border-b border-outline-variant/60 focus:border-primary py-1 outline-none text-xs font-bold text-on-surface cursor-pointer"
              >
                <option value="">{t("it_income_select")}</option>
                <option value="Below ₹2,50,000">{getLocalValue("income", "Below ₹2,50,000")}</option>
                <option value="₹2,50,000 – ₹5,0,000">{getLocalValue("income", "₹2,50,000 – ₹5,00,000")}</option>
                <option value="₹5,0,000 – ₹10,0,000">{getLocalValue("income", "₹5,00,000 – ₹10,00,000")}</option>
                <option value="Above ₹10,0,000">{getLocalValue("income", "Above ₹10,00,000")}</option>
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
                  {t("it_save_changes")}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="px-md py-sm bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs shadow-md animate-fade-in"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  {t("it_edit_summary")}
                </button>
              )}
              <button
                onClick={handleResetProfile}
                className="px-md py-sm border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-outline hover:text-error transition-all active:scale-95 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                {t("it_reset")}
              </button>
            </div>

            <div className="flex gap-sm w-full sm:w-auto">
              <button
                onClick={() => nav("/dashboard")}
                className="flex-1 sm:flex-none px-lg py-sm border border-primary text-primary rounded-xl text-xs font-bold hover:bg-primary/5 active:scale-95 transition-all flex justify-center items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                {t("nav_dashboard")}
              </button>
              <button
                onClick={() => nav("/medical-input")}
                className="flex-1 sm:flex-none px-lg py-sm bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-xs shadow-md"
              >
                <span>{t("it_proceed")}</span>
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
            {t("it_title")}
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs font-normal">
            {t("it_subtitle")}
          </p>
        </header>

        {!isLoggedIn && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm shadow-sm animate-fade-in">
            <div className="flex gap-sm items-start">
              <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">security</span>
              <div>
                <p className="font-bold text-xs text-primary uppercase tracking-wider">{t("it_save_profile_opt")}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("it_guest_banner_desc")}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
              className="px-4 py-2 bg-primary text-on-primary hover:brightness-110 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shrink-0"
            >
              {t("it_signup_login")}
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
                  title={t("it_s1_title")}
                  subtitle={t("it_s1_subtitle")}
                  icon="person"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <Field label={t("it_age")} hint={t("it_age_hint")}>
                      <input
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs"
                        placeholder="e.g. 45"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </Field>
                    <Field label={t("it_state")} hint={t("it_state_hint")}>
                      <select
                        value={patientState}
                        onChange={(e) => setPatientState(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">{t("it_select_state")}</option>
                        <option value="Karnataka">{getLocalValue("state", "Karnataka")}</option>
                        <option value="Maharashtra">{getLocalValue("state", "Maharashtra")}</option>
                        <option value="Delhi">{getLocalValue("state", "Delhi")}</option>
                        <option value="Tamil Nadu">{getLocalValue("state", "Tamil Nadu")}</option>
                        <option value="West Bengal">{getLocalValue("state", "West Bengal")}</option>
                        <option value="Kerala">{getLocalValue("state", "Kerala")}</option>
                        <option value="Gujarat">{getLocalValue("state", "Gujarat")}</option>
                        <option value="Telangana">{getLocalValue("state", "Telangana")}</option>
                        <option value="Andhra Pradesh">{getLocalValue("state", "Andhra Pradesh")}</option>
                        <option value="Uttar Pradesh">{getLocalValue("state", "Uttar Pradesh")}</option>
                        <option value="Rajasthan">{getLocalValue("state", "Rajasthan")}</option>
                        <option value="Odisha">{getLocalValue("state", "Odisha")}</option>
                        <option value="Other">{getLocalValue("state", "Other")}</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onNext={goNext} nextLabel={t("it_save_continue")} backLabel={t("it_dont_know")} />
                </Section>
              )}

              {step === 2 && (
                <Section
                  title={t("it_s2_title")}
                  subtitle={t("it_s2_subtitle")}
                  icon="biotech"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <Field label={t("it_stage")} hint={t("it_stage_hint")}>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">{t("it_stage_select")}</option>
                        <option value="Stage I">{getLocalValue("stage", "Stage I")}</option>
                        <option value="Stage II">{getLocalValue("stage", "Stage II")}</option>
                        <option value="Stage III">{getLocalValue("stage", "Stage III")}</option>
                        <option value="Stage IV">{getLocalValue("stage", "Stage IV")}</option>
                        <option value="Unsure">{getLocalValue("stage", "Unsure")}</option>
                      </select>
                    </Field>
                    <Field label={t("it_receptor")} hint={t("it_receptor_hint")}>
                      <select
                        value={hormoneStatus}
                        onChange={(e) => setHormoneStatus(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">{t("it_select_receptor")}</option>
                        <option value="HER2 Positive">{getLocalValue("receptor", "HER2 Positive")}</option>
                        <option value="Triple Negative">{getLocalValue("receptor", "Triple Negative")}</option>
                        <option value="ER+/PR+ Positive">{getLocalValue("receptor", "ER+/PR+ Positive")}</option>
                        <option value="Unsure">{getLocalValue("receptor", "Unsure")}</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel={t("it_save_continue")} backText={t("it_back")} />
                </Section>
              )}

              {step === 3 && (
                <Section
                  title={t("it_s3_title")}
                  subtitle={t("it_s3_subtitle")}
                  icon="clinical_notes"
                >
                  <div className="space-y-md">
                    <Field label={t("it_surgery_q")}>
                      <select
                        value={surgery}
                        onChange={(e) => setSurgery(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">{getLocalValue("yesno", "Yes")}</option>
                        <option value="No">{getLocalValue("yesno", "No")}</option>
                        <option value="Unsure">{getLocalValue("yesno", "Unsure")}</option>
                      </select>
                    </Field>
                    <Field label={t("it_chemo_q")}>
                      <select
                        value={chemo}
                        onChange={(e) => setChemo(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">{getLocalValue("yesno", "Yes")}</option>
                        <option value="No">{getLocalValue("yesno", "No")}</option>
                        <option value="Unsure">{getLocalValue("yesno", "Unsure")}</option>
                      </select>
                    </Field>
                    <Field label={t("it_radiation_q")}>
                      <select
                        value={radiation}
                        onChange={(e) => setRadiation(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="Yes">{getLocalValue("yesno", "Yes")}</option>
                        <option value="No">{getLocalValue("yesno", "No")}</option>
                        <option value="Unsure">{getLocalValue("yesno", "Unsure")}</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel={t("it_save_continue")} backText={t("it_back")} />
                </Section>
              )}

              {step === 4 && (
                <Section
                  title={t("it_s4_title")}
                  subtitle={t("it_s4_subtitle")}
                  icon="payments"
                >
                  <div className="space-y-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      <Field label={t("it_hospital_class")}>
                        <select
                          value={hospitalType}
                          onChange={(e) => setHospitalType(e.target.value)}
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                        >
                          <option value="Government / Public Hospital">{getLocalValue("hospital", "Government / Public Hospital")}</option>
                          <option value="Private Medical Center">{getLocalValue("hospital", "Private Medical Center")}</option>
                          <option value="Premium Corporate Hospital">{getLocalValue("hospital", "Premium Corporate Hospital")}</option>
                          <option value="I'm Unsure">{getLocalValue("hospital", "I'm Unsure")}</option>
                        </select>
                      </Field>
                      <Field label={t("it_insurance_status")}>
                        <select
                          value={hasInsurance ? "Insured" : "Not Insured"}
                          onChange={(e) => setHasInsurance(e.target.value === "Insured")}
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                        >
                          <option value="Insured">{t("it_insured_active")}</option>
                          <option value="Not Insured">{t("it_not_insured_cash")}</option>
                        </select>
                      </Field>
                    </div>

                    {hasInsurance && (
                      <Field label={t("it_insurance_provider_q")} hint={t("it_insurance_provider_hint")}>
                        <input
                          className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs"
                          placeholder="e.g. Star Health Assure Plan"
                          type="text"
                          value={insuranceProvider}
                          onChange={(e) => setInsuranceProvider(e.target.value)}
                        />
                      </Field>
                    )}

                    <Field label={t("it_income_q")} hint={t("it_income_hint")}>
                      <select
                        value={incomeBracket}
                        onChange={(e) => setIncomeBracket(e.target.value)}
                        className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md text-xs bg-white"
                      >
                        <option value="">{t("it_income_select")}</option>
                        <option value="Below ₹2,50,000">{getLocalValue("income", "Below ₹2,50,000")}</option>
                        <option value="₹2,50,000 – ₹5,0,000">{getLocalValue("income", "₹2,50,000 – ₹5,00,000")}</option>
                        <option value="₹5,0,000 – ₹10,0,000">{getLocalValue("income", "₹5,00,000 – ₹10,00,000")}</option>
                        <option value="Above ₹10,0,000">{getLocalValue("income", "Above ₹10,00,000")}</option>
                      </select>
                    </Field>
                  </div>
                  <FooterBar onPrev={goPrev} onNext={goNext} nextLabel={t("it_complete_onboarding")} backText={t("it_back")} />
                </Section>
              )}
            </div>

          </div>

          {/* Right Panel: Live summary profile & dynamic reliability meter */}
          <div className="lg:col-span-4 space-y-md flex flex-col">
            
            {/* Live Reliability Meter */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm text-center space-y-sm">
              <h4 className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {t("it_accuracy")}
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
                      <p className="text-[9px] text-outline font-semibold uppercase tracking-wider mt-1">{t("it_reliability")}</p>
                    </div>
                  </div>
                );
              })()}
              
              <p className="font-body-sm text-[10px] text-on-surface-variant leading-relaxed px-sm pt-xs">
                {t("it_accuracy_desc")}
              </p>
            </div>

            {/* Live Profile Summary */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm flex-1 space-y-sm flex flex-col justify-between min-h-[300px]">
              <div className="space-y-sm">
                <h4 className="font-label-md text-xs font-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">assignment_ind</span>
                  {t("it_summary")}
                </h4>
                
                <div className="grid grid-cols-2 gap-2 mt-xs">
                  {[
                    { id: "state", icon: "map", label: t("it_state"), value: patientState ? getLocalValue("state", patientState) : null, color: "text-[#0284c7] bg-[#f0f9ff]" },
                    { id: "age", icon: "calendar_month", label: t("it_age"), value: age || null, color: "text-[#7c3aed] bg-[#f5f3ff]" },
                    { id: "stage", icon: "biotech", label: t("it_stage"), value: stage ? getLocalValue("stage", stage) : null, color: "text-[#0d9488] bg-[#f0fdfa]" },
                    { id: "receptor", icon: "science", label: t("it_receptor"), value: hormoneStatus ? getLocalValue("receptor", hormoneStatus) : null, color: "text-[#e11d48] bg-[#fff1f2]" },
                    { id: "surgery", icon: "medical_services", label: t("it_surgery"), value: surgery ? getLocalValue("yesno", surgery) : null, color: "text-[#d97706] bg-[#fffbeb]" },
                    { id: "chemo", icon: "medication", label: t("it_chemo"), value: chemo ? getLocalValue("yesno", chemo) : null, color: "text-[#4f46e5] bg-[#eef2ff]" },
                    { id: "radiation", icon: "bolt", label: t("it_radiation"), value: radiation ? getLocalValue("yesno", radiation) : null, color: "text-[#ea580c] bg-[#fff7ed]" },
                    { id: "hospital", icon: "home_health", label: t("it_hospital"), value: hospitalType ? getLocalValue("hospital", hospitalType) : null, color: "text-[#0891b2] bg-[#ecfeff]" },
                    { id: "insurance", icon: "shield", label: t("it_insurance_status"), value: hasInsurance !== undefined ? (hasInsurance ? (insuranceProvider || t("it_insured")) : t("it_not_insured")) : null, color: "text-[#16a34a] bg-[#f0fdf4]" },
                    { id: "income", icon: "payments", label: t("it_income"), value: incomeBracket ? getLocalValue("income", incomeBracket) : null, color: "text-[#65a30d] bg-[#f7fee7]" }
                  ].map((item) => {
                    const isPending = !item.value;
                    const pendingText = language === "en" ? "Pending" : language === "hi" ? "लंबित" : language === "mr" ? "प्रलंबित" : language === "kn" ? "ಬಾಕಿ ಇದೆ" : "বাকি আছে";
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`p-2 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                          isPending 
                            ? "bg-surface-container-lowest/20 border-dashed border-outline-variant/30 opacity-60" 
                            : "bg-surface-container-lowest border-outline-variant/60 hover:shadow-sm hover:border-primary/30 transform hover:-translate-y-[0.5px]"
                        }`}
                      >
                        <div className="flex items-center gap-[4px] mb-1">
                          <span className={`material-symbols-outlined text-[12px] p-0.5 rounded-md shrink-0 ${isPending ? "text-outline bg-surface-container" : item.color}`}>
                            {item.icon}
                          </span>
                          <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold truncate max-w-[65px]">
                            {item.label}
                          </span>
                        </div>
                        <div className={`text-[10px] font-bold truncate leading-tight ${isPending ? "text-outline/70 italic font-normal" : "text-on-surface"}`} title={item.value || pendingText}>
                          {item.value || pendingText}
                        </div>
                      </div>
                    );
                  })}
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
                    {t("it_edit_details")}
                  </button>
                  <button
                    onClick={handleResetProfile}
                    className="flex-1 py-1.5 border border-error/30 hover:bg-error/5 text-error rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    {t("it_reset")}
                  </button>
                </div>

                <div className="text-[9px] text-outline font-bold uppercase tracking-wider flex items-center gap-xs pt-xs">
                  <span className={`h-2 w-2 rounded-full ${step === 4 ? "bg-secondary" : "bg-primary animate-pulse"}`} />
                  {step === 4 ? t("it_ready_analysis") : `${t("it_filling_section")} ${step} ${t("it_section_of")}`}
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
  backLabel,
  backText,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel: string;
  backLabel?: string;
  backText?: string;
}) {
  return (
    <div className="mt-lg pt-md border-t border-outline-variant flex justify-between items-center">
      {onPrev ? (
        <button onClick={onPrev} className="text-on-surface-variant font-label-md text-label-md hover:underline">
          {backText || "Back"}
        </button>
      ) : (
        <button className="text-secondary font-label-md text-label-md hover:underline">{backLabel || "I don't know"}</button>
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
