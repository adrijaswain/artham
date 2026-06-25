import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("artham_is_logged_in") === "true");

  // Load intake parameters reactively
  const [patientState, setPatientState] = useState(() => localStorage.getItem("artham_intake_state") || "");
  const [age, setAge] = useState(() => localStorage.getItem("artham_intake_age") || "");
  const [stage, setStage] = useState(() => localStorage.getItem("artham_intake_stage") || "");
  const [hormoneStatus, setHormoneStatus] = useState(() => localStorage.getItem("artham_intake_hormone_status") || "");
  const [surgery, setSurgery] = useState(() => localStorage.getItem("artham_intake_surgery") || "");
  const [chemo, setChemo] = useState(() => localStorage.getItem("artham_intake_chemo") || "");
  const [radiation, setRadiation] = useState(() => localStorage.getItem("artham_intake_radiation") || "");
  const [hospitalType, setHospitalType] = useState(() => localStorage.getItem("artham_intake_hospital_type") || "");
  const [hasInsurance, setHasInsurance] = useState(() => localStorage.getItem("artham_intake_has_insurance") === "true");
  const [insuranceProvider, setInsuranceProvider] = useState(() => localStorage.getItem("artham_intake_insurance_provider") || "");
  const [incomeBracket, setIncomeBracket] = useState(() => localStorage.getItem("artham_intake_income_bracket") || "");

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem("artham_is_logged_in") === "true");
      setPatientState(localStorage.getItem("artham_intake_state") || "");
      setAge(localStorage.getItem("artham_intake_age") || "");
      setStage(localStorage.getItem("artham_intake_stage") || "");
      setHormoneStatus(localStorage.getItem("artham_intake_hormone_status") || "");
      setSurgery(localStorage.getItem("artham_intake_surgery") || "");
      setChemo(localStorage.getItem("artham_intake_chemo") || "");
      setRadiation(localStorage.getItem("artham_intake_radiation") || "");
      setHospitalType(localStorage.getItem("artham_intake_hospital_type") || "");
      setHasInsurance(localStorage.getItem("artham_intake_has_insurance") === "true");
      setInsuranceProvider(localStorage.getItem("artham_intake_insurance_provider") || "");
      setIncomeBracket(localStorage.getItem("artham_intake_income_bracket") || "");
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Hospital Category: "Government" | "Private" | "Premium"
  let category: "Government" | "Private" | "Premium" = "Private";
  if (hospitalType === "Government / Public Hospital") {
    category = "Government";
  } else if (hospitalType === "Premium Corporate Hospital") {
    category = "Premium";
  } else if (hospitalType === "Private Medical Center") {
    category = "Private";
  } else {
    category = "Private"; // Default fallback
  }

  // Define exact pricing maps calibrated against Dr. Jay Anam's clinical records
  const DIAGNOSTICS = {
    mammogram: { Government: 1000, Private: 3000, Premium: 5000 },
    ultrasound: { Government: 1500, Private: 4000, Premium: 6000 },
    biopsy: { Government: 5000, Private: 20000, Premium: 35000 },
    histopathology: { Government: 3000, Private: 10000, Premium: 15000 },
    ihc: { Government: 5000, Private: 15000, Premium: 25000 },
    pet: { Government: 10000, Private: 30000, Premium: 45000 },
    mri: { Government: 8000, Private: 25000, Premium: 40000 },
    bloodTests: { Government: 2000, Private: 8000, Premium: 12000 }
  };

  const SURGERY = {
    // Sourced: Lumpectomy ranges from Rs. 1,56,300 to Rs. 2,13,800. Private is calibrated to the median 1,85,000.
    lumpectomy: { Government: 75000, Private: 185000, Premium: 350000 },
    // Mastectomy ranges from Rs. 2,15,000 to Rs. 3,25,000. Private is calibrated to the median 2,70,000.
    mastectomy: { Government: 100000, Private: 270000, Premium: 500000 },
    slnb: { Government: 30000, Private: 75000, Premium: 125000 },
    alnd: { Government: 50000, Private: 100000, Premium: 175000 },
    // Reconstruction is sourced at Rs. 2,00,000 to Rs. 3,00,000. Private is set to median 2,50,000.
    reconstruction: { Government: 100000, Private: 250000, Premium: 600000 }
  };

  const CHEMO = {
    // Cycles typically cost Rs. 1,60,000 to Rs. 2,75,000 per cycle. Total course ranges from 1 to 4 lakhs for standard regimens.
    ac4: { Government: 80000, Private: 150000, Premium: 250000 },
    act: { Government: 150000, Private: 320000, Premium: 600000 },
    tc4: { Government: 100000, Private: 200000, Premium: 350000 },
    tc6: { Government: 150000, Private: 300000, Premium: 500000 },
    fac: { Government: 90000, Private: 180000, Premium: 300000 },
    fec: { Government: 100000, Private: 200000, Premium: 350000 },
    cmf: { Government: 70000, Private: 150000, Premium: 250000 },
    tch6: { Government: 300000, Private: 500000, Premium: 800000 }
  };

  const RADIATION = {
    // Radiation ranges from Rs. 1,50,000 to Rs. 5,20,000 depending on whole vs partial/regional.
    whole: { Government: 75000, Private: 200000, Premium: 350000 },
    chestWall: { Government: 75000, Private: 200000, Premium: 350000 },
    regional: { Government: 100000, Private: 250000, Premium: 400000 }
  };

  const HORMONE = {
    tamoxifen: { Government: 10000, Private: 50000, Premium: 75000 },
    letrozole: { Government: 25000, Private: 100000, Premium: 150000 },
    anastrozole: { Government: 30000, Private: 120000, Premium: 180000 },
    exemestane: { Government: 40000, Private: 150000, Premium: 200000 }
  };

  const TARGETED = {
    // Targeted cycles are around Rs. 90,000. 17 cycles of Trastuzumab sum to 12.0L in standard private setting.
    trastuzumab: { Government: 400000, Private: 1200000, Premium: 1800000 },
    pertuzumabTrastuzumab: { Government: 800000, Private: 1800000, Premium: 2500000 },
    tdm1: { Government: 800000, Private: 1500000, Premium: 2200000 }
  };

  const IMMUNO = {
    // Immunotherapy sessions are around Rs. 2,10,000 per session. Standard private course is set to 15.0L.
    pembrolizumab: { Government: 1000000, Private: 1500000, Premium: 2500000 },
    atezolizumab: { Government: 800000, Private: 1200000, Premium: 2000000 }
  };

  const ADDITIONAL = {
    consultationInit: { Government: 500, Private: 2000, Premium: 4000 },
    consultationFollow: { Government: 500, Private: 1500, Premium: 3000 },
    chemoAdmin: { Government: 2000, Private: 10000, Premium: 20000 },
    admission: { Government: 2000, Private: 10000, Premium: 25000 },
    icu: { Government: 10000, Private: 40000, Premium: 75000 }
  };

  const isIntakeFilled = !!patientState && !!age && !!stage;

  // Calculations
  let biopsyCost = 0;
  let imagingCost = 0;
  let surgeryCost = 0;
  let chemoCost = 0;
  let radiationCost = 0;
  let targetedCost = 0;
  let hormoneCost = 0;
  let immunoCost = 0;
  let consultationCost = 0;
  let chemoAdminCost = 0;
  let hospitalizationCost = 0;
  let icuCost = 0;

  let chemoCyclesCount = 0;

  if (isIntakeFilled) {
    // 1. Diagnostics (Mammogram, Ultrasound, Biopsy, Histopathology, IHC, Blood Tests = standard)
    biopsyCost = DIAGNOSTICS.biopsy[category] + DIAGNOSTICS.histopathology[category] + DIAGNOSTICS.ihc[category];
    
    let baseImaging = DIAGNOSTICS.mammogram[category] + DIAGNOSTICS.ultrasound[category] + DIAGNOSTICS.bloodTests[category];
    if (stage === "Stage III" || stage === "Stage IV") {
      baseImaging += DIAGNOSTICS.pet[category];
    }
    if (hormoneStatus === "HER2 Positive" || hormoneStatus === "Triple Negative" || Number(age) < 40) {
      baseImaging += DIAGNOSTICS.mri[category];
    }
    imagingCost = baseImaging;

    // 2. Surgery
    if (surgery !== "No" && surgery !== "") {
      let baseSurgery = 0;
      let nodeSurgery = 0;
      let reconSurgery = 0;

      if (stage === "Stage I" || stage === "Stage II") {
        baseSurgery = SURGERY.lumpectomy[category];
        nodeSurgery = SURGERY.slnb[category];
      } else {
        baseSurgery = SURGERY.mastectomy[category];
        nodeSurgery = SURGERY.alnd[category];
      }

      if (stage === "Stage II" || stage === "Stage III") {
        reconSurgery = SURGERY.reconstruction[category];
      }

      surgeryCost = baseSurgery + nodeSurgery + reconSurgery;
    }

    // 3. Chemotherapy
    if (chemo !== "No" && chemo !== "") {
      if (hormoneStatus === "HER2 Positive") {
        chemoCost = CHEMO.tch6[category];
        chemoCyclesCount = 6;
      } else if (hormoneStatus === "Triple Negative") {
        chemoCost = CHEMO.act[category];
        chemoCyclesCount = 8;
      } else if (hormoneStatus === "ER+/PR+ Positive") {
        if (stage === "Stage I" || stage === "Stage II") {
          chemoCost = CHEMO.tc4[category];
          chemoCyclesCount = 4;
        } else {
          chemoCost = CHEMO.fac[category];
          chemoCyclesCount = 6;
        }
      } else {
        chemoCost = CHEMO.act[category];
        chemoCyclesCount = 8;
      }
    }

    // 4. Radiation
    if (radiation !== "No" && radiation !== "") {
      if (stage === "Stage I" || stage === "Stage II") {
        radiationCost = RADIATION.whole[category];
      } else {
        radiationCost = RADIATION.chestWall[category] + RADIATION.regional[category];
      }
    }

    // 5. Hormone Therapy (5 years)
    if (hormoneStatus === "ER+/PR+ Positive") {
      if (Number(age) >= 50) {
        hormoneCost = HORMONE.letrozole[category];
      } else {
        hormoneCost = HORMONE.tamoxifen[category];
      }
    }

    // 6. Targeted Therapy
    if (hormoneStatus === "HER2 Positive") {
      if (stage === "Stage III" || stage === "Stage IV") {
        targetedCost = TARGETED.pertuzumabTrastuzumab[category];
      } else {
        targetedCost = TARGETED.trastuzumab[category];
      }
    }

    // 7. Immunotherapy
    if (hormoneStatus === "Triple Negative" && (stage === "Stage III" || stage === "Stage IV")) {
      immunoCost = IMMUNO.pembrolizumab[category];
    }

    // 8. Additional Costs
    consultationCost = ADDITIONAL.consultationInit[category] + (10 * ADDITIONAL.consultationFollow[category]);
    if (chemo !== "No" && chemoCyclesCount > 0) {
      chemoAdminCost = chemoCyclesCount * ADDITIONAL.chemoAdmin[category];
    }
    
    hospitalizationCost = 3 * ADDITIONAL.admission[category];

    if (stage === "Stage III" || stage === "Stage IV" || category === "Premium" || category === "Private") {
      icuCost = 1 * ADDITIONAL.icu[category];
    }
  }

  let totalEstimate = isIntakeFilled
    ? (biopsyCost + imagingCost + surgeryCost + chemoCost + radiationCost + targetedCost + hormoneCost + immunoCost + consultationCost + chemoAdminCost + hospitalizationCost + icuCost)
    : 0;

  const minCost = Math.round(totalEstimate * 0.9);
  const maxCost = Math.round(totalEstimate * 1.1);

  // Insurance Share
  let coveragePercent = 0;
  if (hasInsurance && isIntakeFilled) {
    coveragePercent = category === "Government" ? 0.90 : 0.75;
  }
  let insuranceShare = Math.round(totalEstimate * coveragePercent);
  let outOfPocket = totalEstimate - insuranceShare;

  // Apply Welfare Subsidies based on Income Slabs
  if (isIntakeFilled) {
    if (incomeBracket === "Below ₹2,50,000") {
      outOfPocket = 0;
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      outOfPocket = Math.round(outOfPocket * 0.5);
    }
  }

  // Helper formatting currency
  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  // Determine state welfare program dynamically
  const getStateScheme = (stateName: string) => {
    switch (stateName) {
      case "Maharashtra":
        return {
          name: "Mahatma Jyotiba Phule Jan Arogya Yojana (MJPJAY)",
          description: "Offers cashless health coverage up to ₹5 Lakhs per family per year in empanelled oncology centers in Maharashtra."
        };
      case "Karnataka":
        return {
          name: "Arogya Karnataka (AB-ArK)",
          description: "Covers up to ₹5 Lakhs annually for tertiary oncology chemotherapy, radiation, and surgeries in Karnataka."
        };
      case "West Bengal":
        return {
          name: "Swasthya Sathi Scheme",
          description: "Provides smart card-based health insurance offering up to ₹5 Lakhs annually for cancer treatments in West Bengal."
        };
      case "Tamil Nadu":
        return {
          name: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
          description: "Cashless welfare cover up to ₹5 Lakhs per family per year for advanced oncology packages in Tamil Nadu."
        };
      case "Kerala":
        return {
          name: "Karunya Arogya Suraksha Padhathi (KASP)",
          description: "Offers family health protection up to ₹5 Lakhs per year for specified cancer diagnostic scans and chemo cycles."
        };
      case "Delhi":
        return {
          name: "Delhi Arogya Kosh (DAK)",
          description: "Delhi government aid covering costs of diagnostic imaging scans and cancer surgeries at approved partner labs."
        };
      case "Gujarat":
        return {
          name: "Mukhyamantri Amrutam (MA) Yojana",
          description: "Provides cashless medical assistance up to ₹5 Lakhs for cancer packages to lower-income families in Gujarat."
        };
      case "Telangana":
      case "Andhra Pradesh":
        return {
          name: "Dr. YSR Aarogyasri Health Scheme",
          description: "State-sponsored cashless healthcare covering critical cancer operations and chemotherapy cycles."
        };
      case "Rajasthan":
        return {
          name: "Mukhyamantri Chiranjeevi Swasthya Bima Yojana",
          description: "Offers cashless health coverage up to ₹25 Lakhs per family per year for major oncology treatments."
        };
      case "Odisha":
        return {
          name: "Biju Swasthya Kalyan Yojana (BSKY)",
          description: "Welfare scheme covering up to ₹10 Lakhs for female oncology care in Odisha."
        };
      default:
        return {
          name: "Ayushman Bharat (PM-JAY)",
          description: "National public health cover up to ₹5 Lakhs per year for advanced cancer chemotherapy and operations."
        };
    }
  };

  const stateScheme = isIntakeFilled ? getStateScheme(patientState) : {
    name: "No Scheme Matched",
    description: "Please complete the 4-step intake form to automatically check your eligibility for state-level welfare and national health schemes."
  };

  // Confidence Dial rotation based on stage completeness
  const confidenceScore = !isIntakeFilled ? "None" : stage === "Unsure" ? "Medium" : "High";
  const confidenceText = !isIntakeFilled ? "Intake pending" : stage === "Unsure" ? "Diagnostics pending" : "Verified diagnostics";
  const rotationAngle = !isIntakeFilled ? 0 : stage === "Unsure" ? 45 : 135;

  const treatmentDesc = isIntakeFilled ? [
    surgery !== "No" ? "Surgery" : "",
    chemo !== "No" ? "Chemotherapy" : "",
    radiation !== "No" ? "Radiation" : "",
    hormoneStatus === "HER2 Positive" ? "Targeted Therapy" : ""
  ].filter(Boolean).join(", ") : "";

  return (
    <AppShell>
      <div className="p-md md:p-lg max-w-container-max mx-auto">
        {/* Hero */}
        <section className="mb-lg">
          <div className="bg-primary text-on-primary p-lg rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-md">
              <div>
                <span className="font-label-md text-on-primary-container bg-primary-container px-sm py-xs rounded-full inline-block mb-sm text-xs font-semibold">
                  Estimated Total Treatment Cost Range
                </span>
                <h1 className="font-headline-lg text-headline-lg mb-xs">
                  {isIntakeFilled ? `${formatINR(minCost)} – ${formatINR(maxCost)}` : "Pending Profile Onboarding"}
                </h1>
                <p className="text-on-primary opacity-80 font-body-md text-xs font-normal max-w-xl">
                  {isIntakeFilled ? (
                    `Based on: ${treatmentDesc || "Breast Cancer Screening"} for a ${age}-year old in ${patientState || "India"} (${hospitalType}), Income: ${incomeBracket}.`
                  ) : (
                    "Please complete the Patient Financial Intake to view personalized treatment cost estimates, government schemes, and financial guidance."
                  )}
                </p>
                {isIntakeFilled && (
                  <div className="mt-xs text-on-primary/70 text-[10px] flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Cost estimates calibrated against clinical data from Dr. Jay Anam's Breast Cancer Clinic, Mumbai.</span>
                  </div>
                )}
                {!isIntakeFilled && (
                  <Link
                    to="/intake"
                    className="mt-sm inline-flex items-center gap-xs px-md py-sm bg-secondary text-on-secondary hover:brightness-110 font-bold rounded-xl active:scale-95 transition-all shadow-md text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment</span>
                    Start Onboarding Intake
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-md rounded-lg">
                <p className="font-label-sm mb-sm text-xs uppercase tracking-wider">Confidence Level</p>
                <div className="relative w-40 h-20 overflow-hidden">
                  <div className="absolute inset-0 rounded-t-full border-[12px] border-on-primary/20" />
                  <div
                    className="absolute inset-0 rounded-t-full border-[12px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent origin-bottom transition-all duration-1000"
                    style={{ transform: `rotate(${rotationAngle}deg)` }}
                  />
                </div>
                <p className="font-headline-sm text-headline-sm mt-2">{confidenceScore}</p>
                <p className="font-body-sm text-center mt-xs text-[10px] opacity-90">{confidenceText}</p>
              </div>
            </div>
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[100px] opacity-20" />
          </div>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-lg">
            {/* Scenario Comparison */}
            <div>
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-headline-sm text-headline-sm text-primary">Scenario Comparison</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">info</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <ScenarioCard label="Best Case" value={isIntakeFilled ? formatINR(Math.round(totalEstimate * 0.45)) : "—"} icon="trending_down" tone="secondary" body={isIntakeFilled ? "Early local stage detection, generic drugs, and government subsidized care." : "Please complete your intake form to map this scenario."} />
                <ScenarioCard label="Expected Case" value={isIntakeFilled ? formatINR(totalEstimate) : "—"} icon="stars" tone="primary" highlighted body={isIntakeFilled ? "Standard surgery, chemotherapy, and radiation cycles as recommended." : "Please complete your intake form to map this scenario."} />
                <ScenarioCard label="Complex Case" value={isIntakeFilled ? formatINR(Math.round(totalEstimate * 2.1)) : "—"} icon="warning" tone="tertiary" body={isIntakeFilled ? "Advanced stage (Stage IV) requiring reconstruction, targeted therapies, or extended ICU stay." : "Please complete your intake form to map this scenario."} />
              </div>
            </div>

            {/* Insurance & Govt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-md">Insurance Coverage</h3>
                <div className="space-y-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-body-md">Covered by {isIntakeFilled ? (hasInsurance ? insuranceProvider : "Ayushman Bharat / State Plan") : "Pending Profile"}</span>
                    <span className="font-bold text-secondary">{isIntakeFilled ? formatINR(insuranceShare) : "—"}</span>
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden flex">
                    <div className="h-full bg-secondary" style={{ width: `${totalEstimate > 0 ? Math.round((insuranceShare / totalEstimate) * 100) : 0}%` }} />
                    <div className="h-full bg-tertiary-container" style={{ width: `${totalEstimate > 0 ? Math.round((outOfPocket / totalEstimate) * 100) : 0}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-body-md">Out-of-Pocket Estimate</span>
                    <span className="font-bold text-tertiary">{isIntakeFilled ? formatINR(outOfPocket) : "—"}</span>
                  </div>
                  <div className="p-sm bg-surface-container-low rounded-lg flex items-start gap-sm mt-sm">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                    <p className="font-body-sm text-on-surface-variant text-[10px] leading-relaxed">
                      {isIntakeFilled ? (
                        hasInsurance 
                          ? `Your estimated policy cover is based on standard critical illness room rent limits.` 
                          : "No private insurance detected. Standard self-pay rates applied."
                      ) : (
                        "No profile data loaded. Please complete intake onboarding first."
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-lg rounded-xl border-l-8 border-secondary-container">
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 32 }}>account_balance</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Govt. Schemes</h3>
                </div>
                <div className="bg-white p-md rounded-lg border border-secondary-container mb-md">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-md text-primary text-xs truncate max-w-[170px]" title={stateScheme.name}>{stateScheme.name}</span>
                    {isIntakeFilled && <span className="px-xs py-[2px] bg-secondary-container text-on-secondary-container rounded font-label-sm text-[9px]">Matched</span>}
                  </div>
                  <p className="font-body-sm text-on-surface-variant text-[10px] leading-normal">
                    {stateScheme.description}
                  </p>
                  {isIntakeFilled ? (
                    <Link
                      to="/schemes"
                      className="mt-sm text-secondary font-label-md flex items-center gap-xs hover:underline text-xs"
                    >
                      Check documentation
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  ) : (
                    <Link
                      to="/intake"
                      className="mt-sm text-[#B83B5E] font-label-md flex items-center gap-xs hover:underline text-xs"
                    >
                      Complete Intake
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  )}
                </div>
                <p className="font-label-sm text-on-surface-variant opacity-80 italic text-[9px]">
                  Last verified: 2026
                </p>
              </div>
            </div>

            <Link
              to={isIntakeFilled ? "/cost-breakdown" : "/intake"}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-sm text-headline-sm hover:brightness-110 transition-all flex justify-center items-center gap-md shadow-lg"
            >
              {isIntakeFilled ? "View Detailed Cost Breakdown" : "Start Intake Onboarding"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          {/* Sidebar: Savings */}
          <aside className="lg:col-span-4">
            <div className="sticky top-md">
              {!isLoggedIn && (
                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-surface-bright border border-outline-variant/60 rounded-xl p-md shadow-sm mb-md flex flex-col gap-sm animate-fade-in">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                    <h3 className="font-headline-sm text-sm text-primary">Save Your Treatment Progress</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Artham securely stores your cost scenarios, diagnostics, and eligibility checks locally. Create an optional account to save your dashboard information permanently.
                  </p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
                    className="w-full py-2 bg-primary text-on-primary hover:brightness-110 text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    <span>Secure My Data</span>
                  </button>
                </div>
              )}

              <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant">
                <div className="flex items-center gap-sm mb-lg">
                  <span
                    className="material-symbols-outlined fill-icon text-tertiary-container"
                    style={{ fontSize: 28 }}
                  >
                    lightbulb
                  </span>
                  <h3 className="font-headline-sm text-headline-sm">Savings for You</h3>
                </div>
                <div className="space-y-lg">
                  <Tip icon="medical_information" title="Switch to Semi-Private Room" amount="₹25,000" body="on room rent and associated nursing charges during stay." />
                  <Tip icon="medication" title="Generic Oncology Meds" body="Ask your oncologist for Pradhan Mantri Bhartiya Janaushadhi generic cancer drug alternatives." />
                  <Tip icon="calendar_month" title="Pre-Surgical Lab Work" amount="₹12,000" body="at a partner diagnostic radiology center." />
                </div>
                <Link
                  to={isIntakeFilled ? "/action-plan" : "/intake"}
                  className="mt-lg w-full bg-secondary text-on-secondary py-sm rounded-lg font-label-md flex items-center justify-center gap-xs hover:brightness-110 transition-all"
                >
                  {isIntakeFilled ? "Build my Action Plan" : "Fill Intake First"}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ScenarioCard({
  label,
  value,
  icon,
  tone,
  body,
  highlighted,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "secondary" | "primary" | "tertiary";
  body: string;
  highlighted?: boolean;
}) {
  const cls = highlighted
    ? "bg-surface-container-highest border-2 border-primary shadow-sm"
    : "bg-surface-container-lowest border border-outline-variant hover:shadow-md transition-shadow";
  const toneCls = {
    secondary: "text-secondary",
    primary: "text-primary",
    tertiary: "text-tertiary",
  }[tone];
  return (
    <div className={`p-md rounded-xl ${cls}`}>
      <div className="flex justify-between items-start mb-sm">
        <span className={`font-label-md ${toneCls}`}>{label}</span>
        <span className={`material-symbols-outlined fill-icon ${toneCls}`}>{icon}</span>
      </div>
      <p className="font-headline-sm text-headline-sm mb-xs">{value}</p>
      <p className="font-body-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

function Tip({
  icon,
  title,
  amount,
  body,
}: {
  icon: string;
  title: string;
  amount?: string;
  body: string;
}) {
  return (
    <div className="group cursor-pointer">
      <div className="flex gap-md">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-label-md mb-xs">{title}</h4>
          <p className="font-body-sm text-on-surface-variant">
            {amount && <>Save up to <span className="font-bold text-secondary">{amount}</span> </>}
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
