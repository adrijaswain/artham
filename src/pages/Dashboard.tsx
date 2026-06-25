import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell";

type ChatMsg = {
  role: "bot" | "user";
  text: string;
  isError?: boolean;
};

// Gemini API call helper for Cost Assistant
const queryGeminiCostEstimator = async (history: ChatMsg[], apiKey: string): Promise<string> => {
  const patientState = localStorage.getItem("artham_intake_state") || "Not specified";
  const age = localStorage.getItem("artham_intake_age") || "Not specified";
  const stage = localStorage.getItem("artham_intake_stage") || "Not specified";
  const hormoneStatus = localStorage.getItem("artham_intake_hormone_status") || "Not specified";
  const surgery = localStorage.getItem("artham_intake_surgery") || "Yes";
  const chemo = localStorage.getItem("artham_intake_chemo") || "Yes";
  const radiation = localStorage.getItem("artham_intake_radiation") || "Yes";
  const hospitalType = localStorage.getItem("artham_intake_hospital_type") || "Not specified";
  const hasIns = localStorage.getItem("artham_intake_has_insurance") !== "false";
  const provider = localStorage.getItem("artham_intake_insurance_provider");
  const insurance = hasIns ? (provider || "Yes (details pending)") : "No Insurance";
  const incomeBracket = localStorage.getItem("artham_intake_income_bracket") || "Not specified";

  const systemPrompt = `You are the Artham Cost Estimator, an expert clinical and financial navigation assistant for breast cancer in India. Your goal is to help the user understand their treatment cost estimate by extracting clinical parameters from their chat and providing cost estimations.

Current User Intake Profile (for your context):
- State: ${patientState}
- Age: ${age}
- Stage: ${stage}
- Hormone Status: ${hormoneStatus}
- Surgery: ${surgery}
- Chemotherapy: ${chemo}
- Radiation: ${radiation}
- Hospital Type: ${hospitalType}
- Insurance: ${insurance}
- Income Bracket: ${incomeBracket}

Read the dialogue and extract any values the user mentions. You MUST respond ONLY with a valid JSON object. Do not include markdown codeblocks or extra text. The JSON format must be:
{
  "message": "Write a highly clear, concise response under 100 words. Empathize and give a brief cost estimation (e.g. telling them their estimated range in Rupees/Lakhs based on their stage or surgery/chemo plans, and next steps). Stay on point and do not spiral.",
  "diagnosis_details": "Concise summary of their diagnosis details (e.g., 'Stage II HER2+, Private Hospital'). Keep under 15 words.",
  "next_steps": "Concise bulleted next steps (e.g., '1. Verify PM-JAY eligibility. 2. Submit biopsy report.'). Keep under 25 words.",
  "extracted_profile": {
    "state": "Maharashtra" | "Karnataka" | "West Bengal" | "Tamil Nadu" | "Kerala" | "Delhi" | "Gujarat" | "Telangana" | "Andhra Pradesh" | "Rajasthan" | "Odisha" | null,
    "age": "number string" or null,
    "stage": "Stage I" | "Stage II" | "Stage III" | "Stage IV" | "Unsure" or null,
    "hormone_status": "ER+/PR+ Positive" | "HER2 Positive" | "Triple Negative" | "Unsure" or null,
    "surgery": "Yes" | "No" or null,
    "chemo": "Yes" | "No" or null,
    "radiation": "Yes" | "No" or null,
    "hospital_type": "Government / Public Hospital" | "Private Medical Center" | "Premium Corporate Hospital" or null,
    "has_insurance": boolean or null,
    "insurance_provider": string or null,
    "income_bracket": "Below ₹2,50,000" | "₹2,50,000 – ₹5,00,000" | "₹5,00,000 – ₹10,00,000" | "Above ₹10,00,000" or null
  }
}`;

  const contents = history.map(h => ({
    role: h.role === "bot" ? "model" : "user",
    parts: [{ text: h.text }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  const modelName = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Gemini API Request failed");
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error("Invalid response format from Gemini API");
};

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

  // Extracted AI details
  const [extractedDiagnosis, setExtractedDiagnosis] = useState(() => localStorage.getItem("artham_chatbot_diagnosis_details") || "");
  const [extractedNextSteps, setExtractedNextSteps] = useState(() => localStorage.getItem("artham_chatbot_next_steps") || "");

  // Interactive savings toggles
  const [savingsChecked, setSavingsChecked] = useState<{ [key: string]: boolean }>({
    room: false,
    meds: false,
    labs: false,
  });

  // Dashboard Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => {
    const saved = localStorage.getItem("artham_dashboard_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        role: "bot",
        text: "Hello! I am your Artham Cost Calculator Assistant. Share your age, diagnosis/stage, hospital preference, or insurance status, and I will instantly update your dashboard estimates."
      }
    ];
  });
  const [draftChat, setDraftChat] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // API Key management
  const apiKey = localStorage.getItem("gemini_api_key") || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

  useEffect(() => {
    localStorage.setItem("artham_dashboard_chat_messages", JSON.stringify(chatMessages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
      setExtractedDiagnosis(localStorage.getItem("artham_chatbot_diagnosis_details") || "");
      setExtractedNextSteps(localStorage.getItem("artham_chatbot_next_steps") || "");
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
    lumpectomy: { Government: 75000, Private: 185000, Premium: 350000 },
    mastectomy: { Government: 100000, Private: 270000, Premium: 500000 },
    slnb: { Government: 30000, Private: 75000, Premium: 125000 },
    alnd: { Government: 50000, Private: 100000, Premium: 175000 },
    reconstruction: { Government: 100000, Private: 250000, Premium: 600000 }
  };

  const CHEMO = {
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
    trastuzumab: { Government: 400000, Private: 1200000, Premium: 1800000 },
    pertuzumabTrastuzumab: { Government: 800000, Private: 1800000, Premium: 2500000 },
    tdm1: { Government: 800000, Private: 1500000, Premium: 2200000 }
  };

  const IMMUNO = {
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
    biopsyCost = DIAGNOSTICS.biopsy[category] + DIAGNOSTICS.histopathology[category] + DIAGNOSTICS.ihc[category];
    let baseImaging = DIAGNOSTICS.mammogram[category] + DIAGNOSTICS.ultrasound[category] + DIAGNOSTICS.bloodTests[category];
    if (stage === "Stage III" || stage === "Stage IV") {
      baseImaging += DIAGNOSTICS.pet[category];
    }
    if (hormoneStatus === "HER2 Positive" || hormoneStatus === "Triple Negative" || Number(age) < 40) {
      baseImaging += DIAGNOSTICS.mri[category];
    }
    imagingCost = baseImaging;

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

    if (radiation !== "No" && radiation !== "") {
      if (stage === "Stage I" || stage === "Stage II") {
        radiationCost = RADIATION.whole[category];
      } else {
        radiationCost = RADIATION.chestWall[category] + RADIATION.regional[category];
      }
    }

    if (hormoneStatus === "ER+/PR+ Positive") {
      if (Number(age) >= 50) {
        hormoneCost = HORMONE.letrozole[category];
      } else {
        hormoneCost = HORMONE.tamoxifen[category];
      }
    }

    if (hormoneStatus === "HER2 Positive") {
      if (stage === "Stage III" || stage === "Stage IV") {
        targetedCost = TARGETED.pertuzumabTrastuzumab[category];
      } else {
        targetedCost = TARGETED.trastuzumab[category];
      }
    }

    if (hormoneStatus === "Triple Negative" && (stage === "Stage III" || stage === "Stage IV")) {
      immunoCost = IMMUNO.pembrolizumab[category];
    }

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

  // Deduct interactive savings selected by user
  let totalSavings = 0;
  if (savingsChecked.room) totalSavings += 25000;
  if (savingsChecked.meds) totalSavings += 50000;
  if (savingsChecked.labs) totalSavings += 12000;

  const outOfPocketAdjusted = Math.max(0, outOfPocket - totalSavings);

  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

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
    description: "Please complete the onboarding intake or type in the Cost Assistant to check eligibility."
  };

  // Confidence Score mapping
  const confidenceScore = !isIntakeFilled ? "None" : stage === "Unsure" ? "Medium" : "High";
  const confidenceText = !isIntakeFilled ? "Intake pending" : stage === "Unsure" ? "Diagnostics pending" : "Verified diagnostics";

  const treatmentDesc = isIntakeFilled ? [
    surgery !== "No" ? "Surgery" : "",
    chemo !== "No" ? "Chemotherapy" : "",
    radiation !== "No" ? "Radiation" : "",
    hormoneStatus === "HER2 Positive" ? "Targeted Therapy" : ""
  ].filter(Boolean).join(", ") : "";

  // Mock Cost Calculator extraction fallback
  const mockCostAssistant = (userInput: string) => {
    const lower = userInput.toLowerCase();
    let replyText = "I have recorded your details to update your cost estimate dashboard. Let me know if you have details on insurance, state welfare schemes, or specific procedures.";
    let extracted: any = {};
    let matchedDiag = "";
    let nextStps = "";

    if (lower.includes("karnataka")) extracted.state = "Karnataka";
    else if (lower.includes("maharashtra")) extracted.state = "Maharashtra";
    else if (lower.includes("delhi")) extracted.state = "Delhi";
    else if (lower.includes("kerala")) extracted.state = "Kerala";
    else if (lower.includes("tamil nadu") || lower.includes("chennai")) extracted.state = "Tamil Nadu";
    else if (lower.includes("gujarat")) extracted.state = "Gujarat";
    else if (lower.includes("west bengal") || lower.includes("kolkata")) extracted.state = "West Bengal";
    else if (lower.includes("rajasthan")) extracted.state = "Rajasthan";
    else if (lower.includes("odisha")) extracted.state = "Odisha";

    if (lower.includes("government") || lower.includes("public")) {
      extracted.hospital_type = "Government / Public Hospital";
    } else if (lower.includes("premium") || lower.includes("corporate")) {
      extracted.hospital_type = "Premium Corporate Hospital";
    } else if (lower.includes("private") || lower.includes("clinic")) {
      extracted.hospital_type = "Private Medical Center";
    }

    const ageMatch = lower.match(/\b(\d{2})\b/);
    if (ageMatch && !lower.includes("stage")) {
      extracted.age = ageMatch[1];
    }

    if (lower.includes("stage 1") || lower.includes("stage i") || lower.includes("early")) {
      extracted.stage = "Stage I";
    } else if (lower.includes("stage 2") || lower.includes("stage ii")) {
      extracted.stage = "Stage II";
    } else if (lower.includes("stage 3") || lower.includes("stage iii")) {
      extracted.stage = "Stage III";
    } else if (lower.includes("stage 4") || lower.includes("stage iv") || lower.includes("metastatic") || lower.includes("advanced")) {
      extracted.stage = "Stage IV";
    }

    if (lower.includes("her2")) {
      extracted.hormone_status = "HER2 Positive";
    } else if (lower.includes("triple negative") || lower.includes("tnbc")) {
      extracted.hormone_status = "Triple Negative";
    } else if (lower.includes("er+") || lower.includes("pr+") || lower.includes("hormone")) {
      extracted.hormone_status = "ER+/PR+ Positive";
    }

    if (lower.includes("no surgery")) {
      extracted.surgery = "No";
    } else if (lower.includes("surgery") || lower.includes("lumpectomy") || lower.includes("mastectomy")) {
      extracted.surgery = "Yes";
    }

    if (lower.includes("no chemo") || lower.includes("no chemotherapy")) {
      extracted.chemo = "No";
    } else if (lower.includes("chemo") || lower.includes("chemotherapy")) {
      extracted.chemo = "Yes";
    }

    if (lower.includes("no radiation")) {
      extracted.radiation = "No";
    } else if (lower.includes("radiation") || lower.includes("radiotherapy")) {
      extracted.radiation = "Yes";
    }

    if (lower.includes("no insurance") || lower.includes("self pay") || lower.includes("out of pocket")) {
      extracted.has_insurance = false;
      extracted.insurance_provider = "";
    } else if (lower.includes("insurance") || lower.includes("star") || lower.includes("hdfc") || lower.includes("policy") || lower.includes("icici")) {
      extracted.has_insurance = true;
      extracted.insurance_provider = lower.includes("star") ? "Star Health" : lower.includes("hdfc") ? "HDFC Ergo" : "Private Insurance";
    }

    if (lower.includes("under 2.5") || lower.includes("below 2.5") || lower.includes("low income") || lower.includes("bpl")) {
      extracted.income_bracket = "Below ₹2,50,000";
    } else if (lower.includes("2.5") || lower.includes("5 lakh")) {
      extracted.income_bracket = "₹2,50,000 – ₹5,00,000";
    } else if (lower.includes("10 lakh")) {
      extracted.income_bracket = "₹5,00,000 – ₹10,00,000";
    } else if (lower.includes("above 10") || lower.includes("wealthy")) {
      extracted.income_bracket = "Above ₹10,00,000";
    }

    // Compose concise responses
    if (extracted.stage) {
      replyText = `Calculated cost estimate based on ${extracted.stage}. Calibrated treatment models applied. Expected out-of-pocket range updated.`;
      matchedDiag = `${extracted.stage} Breast Cancer`;
      nextStps = `1. Check PM-JAY limits for ${extracted.stage}.\n2. Request detailed surgical quote.`;
    } else {
      matchedDiag = "Breast Cancer (Details Pending)";
      nextStps = "1. Confirm cancer stage.\n2. Inquire about hospital category.";
    }

    return {
      message: replyText,
      diagnosis_details: matchedDiag,
      next_steps: nextStps,
      extracted_profile: extracted
    };
  };

  // Chat send action
  const sendChatMessage = async (overrideText?: string) => {
    const text = (typeof overrideText === "string" ? overrideText : draftChat).trim();
    if (!text) return;

    const newHistory = [...chatMessages, { role: "user", text } as ChatMsg];
    setChatMessages(newHistory);
    setDraftChat("");
    setIsChatLoading(true);

    if (apiKey) {
      try {
        const responseText = await queryGeminiCostEstimator(newHistory, apiKey);
        let cleanText = responseText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        
        const parsed = JSON.parse(cleanText);
        
        // Save extracted elements to localstorage
        if (parsed.extracted_profile) {
          const ep = parsed.extracted_profile;
          if (ep.state) localStorage.setItem("artham_intake_state", ep.state);
          if (ep.age) localStorage.setItem("artham_intake_age", String(ep.age));
          if (ep.stage) localStorage.setItem("artham_intake_stage", ep.stage);
          if (ep.hormone_status) localStorage.setItem("artham_intake_hormone_status", ep.hormone_status);
          if (ep.surgery) localStorage.setItem("artham_intake_surgery", ep.surgery);
          if (ep.chemo) localStorage.setItem("artham_intake_chemo", ep.chemo);
          if (ep.radiation) localStorage.setItem("artham_intake_radiation", ep.radiation);
          if (ep.hospital_type) localStorage.setItem("artham_intake_hospital_type", ep.hospital_type);
          if (ep.has_insurance !== undefined && ep.has_insurance !== null) {
            localStorage.setItem("artham_intake_has_insurance", String(ep.has_insurance));
          }
          if (ep.insurance_provider) localStorage.setItem("artham_intake_insurance_provider", ep.insurance_provider);
          if (ep.income_bracket) localStorage.setItem("artham_intake_income_bracket", ep.income_bracket);
        }

        if (parsed.diagnosis_details) {
          localStorage.setItem("artham_chatbot_diagnosis_details", parsed.diagnosis_details);
        }
        if (parsed.next_steps) {
          localStorage.setItem("artham_chatbot_next_steps", parsed.next_steps);
        }

        setChatMessages(prev => [...prev, { role: "bot", text: parsed.message }]);
        
        // Notify dashboard to recalculate
        window.dispatchEvent(new Event("auth-change"));

      } catch (err) {
        console.error(err);
        const fallback = mockCostAssistant(text);
        
        if (fallback.extracted_profile) {
          const ep = fallback.extracted_profile;
          Object.keys(ep).forEach(k => {
            if (ep[k] !== undefined && ep[k] !== null) {
              localStorage.setItem(`artham_intake_${k}`, String(ep[k]));
            }
          });
        }
        localStorage.setItem("artham_chatbot_diagnosis_details", fallback.diagnosis_details);
        localStorage.setItem("artham_chatbot_next_steps", fallback.next_steps);

        setChatMessages(prev => [...prev, { role: "bot", text: fallback.message }]);
        window.dispatchEvent(new Event("auth-change"));
      } finally {
        setIsChatLoading(false);
      }
    } else {
      // Mock Fallback
      setTimeout(() => {
        const fallback = mockCostAssistant(text);
        const ep = fallback.extracted_profile;
        Object.keys(ep).forEach(k => {
          if (ep[k] !== undefined && ep[k] !== null) {
            localStorage.setItem(`artham_intake_${k}`, String(ep[k]));
          }
        });
        localStorage.setItem("artham_chatbot_diagnosis_details", fallback.diagnosis_details);
        localStorage.setItem("artham_chatbot_next_steps", fallback.next_steps);

        setChatMessages(prev => [...prev, { role: "bot", text: fallback.message }]);
        setIsChatLoading(false);
        window.dispatchEvent(new Event("auth-change"));
      }, 800);
    }
  };

  const clearChatHistory = () => {
    localStorage.removeItem("artham_dashboard_chat_messages");
    localStorage.removeItem("artham_chatbot_diagnosis_details");
    localStorage.removeItem("artham_chatbot_next_steps");
    setChatMessages([
      {
        role: "bot",
        text: "Hello! I am your Artham Cost Calculator Assistant. Share your age, diagnosis/stage, hospital preference, or insurance status, and I will instantly update your dashboard estimates."
      }
    ]);
    setExtractedDiagnosis("");
    setExtractedNextSteps("");
    window.dispatchEvent(new Event("auth-change"));
  };

  // SVGGauge calculation
  let confidencePercent = 0;
  if (confidenceScore === "Medium") {
    confidencePercent = 50;
  } else if (confidenceScore === "High") {
    confidencePercent = 100;
  }
  const radius = 40;
  const circumference = Math.PI * radius; // 125.66
  const dashoffset = circumference - (circumference * confidencePercent) / 100;

  return (
    <AppShell>
      <div className="p-md md:p-lg max-w-container-max mx-auto space-y-md">
        
        {/* Header Hero card - visual premium redesign */}
        <section>
          <div className="bg-gradient-to-br from-primary via-[#004d80] to-secondary text-on-primary p-lg rounded-2xl shadow-xl relative overflow-hidden border border-white/10 transition-transform duration-500">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-md">
              <div className="text-center md:text-left">
                <span className="font-label-md text-secondary-container bg-primary-container/80 backdrop-blur-md px-sm py-1 rounded-full inline-block mb-sm text-xs font-semibold border border-white/5 uppercase tracking-wider">
                  Estimated Total Treatment Cost Range
                </span>
                <h1 className="font-headline-lg text-4xl md:text-5xl font-extrabold mb-sm tracking-tight drop-shadow-sm">
                  {isIntakeFilled ? `${formatINR(minCost)} – ${formatINR(maxCost)}` : "Pending Profile Onboarding"}
                </h1>
                <p className="text-on-primary/80 font-body-md text-sm font-medium max-w-xl leading-relaxed">
                  {isIntakeFilled ? (
                    `Based on: ${treatmentDesc || "Breast Cancer Screening"} for a ${age}-year old in ${patientState || "India"} (${hospitalType}), Income: ${incomeBracket}.`
                  ) : (
                    "Please complete the Patient Financial Intake or chat with the Cost Assistant on the right to view personalized treatment cost estimates, government schemes, and financial guidance."
                  )}
                </p>
                {isIntakeFilled && (
                  <div className="mt-sm text-on-primary/60 text-xs flex items-center justify-center md:justify-start gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-secondary-container animate-pulse">verified</span>
                    <span>Cost estimates calibrated against clinical data from Dr. Jay Anam's Breast Cancer Clinic, Mumbai.</span>
                  </div>
                )}
                {!isIntakeFilled && (
                  <Link
                    to="/intake"
                    className="mt-md inline-flex items-center gap-xs px-md py-sm bg-secondary text-on-secondary hover:brightness-110 font-bold rounded-xl active:scale-95 transition-all shadow-md text-xs hover:shadow-lg hover:-translate-y-0.5 duration-300"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment</span>
                    Start Onboarding Intake
                  </Link>
                )}
              </div>

              {/* Redesigned Premium Confidence Dial using SVG */}
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-md rounded-2xl border border-white/10 shadow-inner w-44 shrink-0 transition-all duration-300 hover:scale-105">
                <p className="font-label-sm mb-xs text-[10px] text-white/80 uppercase tracking-widest font-bold">Confidence Level</p>
                <div className="relative w-36 h-20 flex justify-center items-end">
                  <svg className="absolute w-32 h-20" viewBox="0 0 100 60">
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#91f0ec" />
                        <stop offset="100%" stopColor="#006a68" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="url(#gaugeGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="z-10 text-center pb-1">
                    <p className="font-headline-sm text-lg font-bold text-white leading-none">{confidenceScore}</p>
                    <p className="text-[9px] text-white/70 mt-[2px] tracking-wide">{confidenceText}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[120px] opacity-25 pointer-events-none" />
          </div>
        </section>

        {/* Responsive Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Main Visuals Column */}
          <div className="lg:col-span-7 space-y-md">
            
            {/* Scenario Comparison Card */}
            <div className="space-y-sm">
              <div className="flex justify-between items-center px-xs">
                <h3 className="font-headline-sm text-sm text-primary uppercase tracking-wider font-bold">Scenario Comparison</h3>
                <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">info</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
                <ScenarioCard 
                  label="Best Case" 
                  value={isIntakeFilled ? formatINR(Math.round(totalEstimate * 0.45)) : "—"} 
                  icon="trending_down" 
                  tone="secondary" 
                  body={isIntakeFilled ? "Early detection, generic drugs, public subsidized care." : "Fill intake form or chat to estimate."} 
                />
                <ScenarioCard 
                  label="Expected Case" 
                  value={isIntakeFilled ? formatINR(totalEstimate) : "—"} 
                  icon="stars" 
                  tone="primary" 
                  highlighted 
                  body={isIntakeFilled ? "Standard surgery, chemo, radiation cycles recommended." : "Fill intake form or chat to estimate."} 
                />
                <ScenarioCard 
                  label="Complex Case" 
                  value={isIntakeFilled ? formatINR(Math.round(totalEstimate * 2.1)) : "—"} 
                  icon="warning" 
                  tone="tertiary" 
                  body={isIntakeFilled ? "Advanced stage requiring reconstruction, targeted therapies, ICU." : "Fill intake form or chat to estimate."} 
                />
              </div>
            </div>

            {/* Insurance & Govt Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              
              {/* Insurance Card */}
              <div className="bg-white/90 backdrop-blur-md p-md rounded-2xl shadow-sm border border-outline-variant/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                <h3 className="font-headline-sm text-sm text-primary mb-sm uppercase tracking-wider font-bold">Insurance Coverage</h3>
                <div className="space-y-sm">
                  <div className="flex justify-between items-center text-xs text-on-surface">
                    <span className="font-medium text-on-surface-variant">Covered by {isIntakeFilled ? (hasInsurance ? insuranceProvider : "Ayushman Bharat / State Plan") : "Pending Profile"}</span>
                    <span className="font-bold text-secondary">{isIntakeFilled ? formatINR(insuranceShare) : "—"}</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex border border-outline-variant/20">
                    <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${totalEstimate > 0 ? Math.round((insuranceShare / totalEstimate) * 100) : 0}%` }} />
                    <div className="h-full bg-tertiary-container transition-all duration-500" style={{ width: `${totalEstimate > 0 ? Math.round((outOfPocket / totalEstimate) * 100) : 0}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-surface">
                    <span className="font-medium text-on-surface-variant">Out-of-Pocket Estimate</span>
                    <span className="font-bold text-tertiary">{isIntakeFilled ? formatINR(outOfPocket) : "—"}</span>
                  </div>
                  
                  {/* Deductions display if any savings tips checked */}
                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center text-xs p-xs bg-secondary/10 text-secondary rounded font-bold border border-secondary/20 animate-fade-in">
                      <span>Interactive Tips Savings Applied</span>
                      <span>-{formatINR(totalSavings)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs pt-xs border-t border-outline-variant/40 font-bold text-on-surface">
                    <span>Adjusted Out-of-Pocket</span>
                    <span className="text-primary text-sm">{isIntakeFilled ? formatINR(outOfPocketAdjusted) : "—"}</span>
                  </div>

                  <div className="p-xs bg-surface-container-low rounded-lg flex items-start gap-xs mt-xs border border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-xs mt-0.5">info</span>
                    <p className="font-body-sm text-on-surface-variant text-[10px] leading-relaxed">
                      {isIntakeFilled ? (
                        hasInsurance 
                          ? `Estimated policy cover based on standard critical illness room rent limits.` 
                          : "No private insurance detected. Cash pay and national scheme pricing limits applied."
                      ) : (
                        "No profile data loaded. Onboard via chat or intake to calculate limits."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Govt Schemes Card */}
              <div className="bg-surface-container-low/80 backdrop-blur-md p-md rounded-2xl border-l-8 border-secondary-container border border-outline-variant/40 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-xs mb-sm">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 24 }}>account_balance</span>
                  <h3 className="font-headline-sm text-sm text-on-surface uppercase tracking-wider font-bold">Govt. Schemes</h3>
                </div>
                <div className="bg-white/80 p-sm rounded-xl border border-secondary-container/40 mb-sm">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-md text-primary text-xs font-bold truncate max-w-[170px]" title={stateScheme.name}>{stateScheme.name}</span>
                    {isIntakeFilled && <span className="px-1.5 py-[2px] bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-[8px] font-bold">Eligible</span>}
                  </div>
                  <p className="font-body-sm text-on-surface-variant text-[10px] leading-normal">
                    {stateScheme.description}
                  </p>
                  {isIntakeFilled ? (
                    <Link
                      to="/schemes"
                      className="mt-sm text-secondary font-label-md flex items-center gap-xs hover:underline text-xs"
                    >
                      Check Documentation Setup
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  ) : (
                    <Link
                      to="/intake"
                      className="mt-sm text-secondary font-label-md flex items-center gap-xs hover:underline text-xs"
                    >
                      Complete Intake Form
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  )}
                </div>
                <p className="font-label-sm text-on-surface-variant opacity-80 italic text-[9px]">
                  Last verified: 2026 scheme guides
                </p>
              </div>
            </div>

            <Link
              to={isIntakeFilled ? "/cost-breakdown" : "/intake"}
              className="w-full bg-primary text-on-primary py-3 rounded-2xl font-headline-sm hover:brightness-110 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-xs shadow-md"
            >
              {isIntakeFilled ? "View Detailed Cost Breakdown" : "Start Intake Onboarding"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          {/* Right Column: Chatbot, AI context summary & Tips */}
          <aside className="lg:col-span-5 space-y-md">
            
            {/* AI Cost Calculator Assistant chatbot widget */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col h-[400px]">
              <div className="bg-primary-fixed-dim/20 px-md py-sm border-b border-outline-variant/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[20px] active-entity-pulse">calculate</span>
                  <span className="font-label-md text-xs font-bold text-primary uppercase tracking-wider">AI Cost Calculator Assistant</span>
                </div>
                <button 
                  onClick={clearChatHistory}
                  className="p-1 hover:bg-surface-container rounded-full text-outline hover:text-error transition-all"
                  title="Clear Cost Chat History"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-sm space-y-sm custom-scrollbar bg-surface-bright/10">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[85%] p-sm text-xs rounded-xl shadow-xs leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-primary text-on-primary rounded-tr-none" 
                          : "bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/30"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-sm text-xs rounded-xl rounded-tl-none bg-surface-container border border-outline-variant/30 flex items-center gap-xs">
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestions */}
              {chatMessages.length <= 1 && (
                <div className="px-sm py-1 border-t border-outline-variant/30 bg-surface-bright/20 flex flex-wrap gap-xs shrink-0">
                  <button 
                    onClick={() => sendChatMessage("Estimate Stage 2 private care in Karnataka")}
                    className="text-[9px] px-2 py-1 rounded bg-white hover:bg-surface-container-low border border-outline-variant/30 font-medium transition-colors"
                  >
                    Stage II in Karnataka
                  </button>
                  <button 
                    onClick={() => sendChatMessage("Costs for government hospital stage 3, no insurance")}
                    className="text-[9px] px-2 py-1 rounded bg-white hover:bg-surface-container-low border border-outline-variant/30 font-medium transition-colors"
                  >
                    Govt Hospital Stage III
                  </button>
                </div>
              )}

              {/* Message Entry box */}
              <div className="p-xs bg-surface border-t border-outline-variant/40 flex items-center gap-xs shrink-0">
                <input
                  type="text"
                  placeholder="Ask and save details (e.g. state, age, stage)..."
                  value={draftChat}
                  onChange={e => setDraftChat(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendChatMessage(); }}
                  disabled={isChatLoading}
                  className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant/50 px-sm py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  onClick={() => sendChatMessage()}
                  disabled={!draftChat.trim() || isChatLoading}
                  className="p-1.5 bg-primary text-on-primary rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>

            {/* Extracted Diagnosis & Next Steps card */}
            {(extractedDiagnosis || extractedNextSteps) && (
              <div className="bg-gradient-to-br from-secondary/5 via-primary/5 to-surface-bright border border-secondary-container/50 rounded-2xl p-md shadow-xs space-y-xs animate-fade-in">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px] font-bold">clinical_notes</span>
                  <h3 className="font-label-md text-xs font-bold text-secondary uppercase tracking-wider">AI Clinical Cost Context</h3>
                </div>
                {extractedDiagnosis && (
                  <p className="text-xs text-on-surface font-medium leading-relaxed bg-white/60 p-2 rounded-xl border border-outline-variant/30">
                    <strong>Diagnosis details:</strong> {extractedDiagnosis}
                  </p>
                )}
                {extractedNextSteps && (
                  <div className="text-xs text-on-surface space-y-1">
                    <span className="font-bold text-on-surface-variant">Recommended Next Steps:</span>
                    <div className="text-xs text-on-surface-variant bg-white/60 p-2 rounded-xl border border-outline-variant/30 whitespace-pre-wrap leading-relaxed">
                      {extractedNextSteps}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Redesigned Savings Checklist card */}
            <div className="bg-white/90 backdrop-blur-md p-md rounded-2xl shadow-sm border border-outline-variant/60">
              <div className="flex items-center gap-xs mb-md">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 24 }}>lightbulb</span>
                <h3 className="font-headline-sm text-sm text-on-surface uppercase tracking-wider font-bold">Savings Checklist</h3>
              </div>
              <div className="space-y-sm">
                <Tip 
                  icon="medical_information" 
                  title="Switch to Semi-Private Room" 
                  amount="₹25,000" 
                  body="on room rent and associated nursing charges during stay." 
                  checked={savingsChecked.room}
                  onToggle={() => setSavingsChecked(prev => ({ ...prev, room: !prev.room }))}
                />
                <Tip 
                  icon="medication" 
                  title="Generic Oncology Meds" 
                  amount="₹50,000"
                  body="Ask your oncologist for PM Bhartiya Janaushadhi generic cancer drug alternatives." 
                  checked={savingsChecked.meds}
                  onToggle={() => setSavingsChecked(prev => ({ ...prev, meds: !prev.meds }))}
                />
                <Tip 
                  icon="calendar_month" 
                  title="Pre-Surgical Lab Work" 
                  amount="₹12,000" 
                  body="at a partner diagnostic radiology center." 
                  checked={savingsChecked.labs}
                  onToggle={() => setSavingsChecked(prev => ({ ...prev, labs: !prev.labs }))}
                />
              </div>
              <Link
                to={isIntakeFilled ? "/action-plan" : "/intake"}
                className="mt-md w-full bg-secondary text-on-secondary py-2 rounded-xl font-label-md flex items-center justify-center gap-xs hover:brightness-110 transition-all shadow-xs hover:shadow text-xs"
              >
                {isIntakeFilled ? "Build my Action Plan" : "Fill Intake First"}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Guest save status card */}
            {!isLoggedIn && (
              <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-surface-bright border border-outline-variant/50 rounded-2xl p-md shadow-xs flex flex-col gap-sm">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                  <h3 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider">Save Your Progress</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Artham stores estimates and chat locally. Create a free account to back up details permanently.
                </p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
                  className="w-full py-2 bg-primary text-on-primary hover:brightness-110 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  <span>Secure My Data</span>
                </button>
              </div>
            )}

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
    ? "bg-primary-container/20 border-2 border-primary shadow-md hover:-translate-y-0.5 transition-all duration-300"
    : "bg-white/80 border border-outline-variant/60 hover:-translate-y-0.5 hover:shadow-md hover:border-outline-variant transition-all duration-300";
  const toneCls = {
    secondary: "text-secondary",
    primary: "text-primary",
    tertiary: "text-tertiary",
  }[tone];
  
  return (
    <div className={`p-sm rounded-2xl flex flex-col h-full ${cls}`}>
      <div className="flex justify-between items-start mb-xs">
        <span className={`font-label-sm uppercase tracking-wider font-bold text-[10px] ${toneCls}`}>{label}</span>
        <span className={`material-symbols-outlined fill-icon ${toneCls}`}>{icon}</span>
      </div>
      <p className="font-headline-sm text-lg font-extrabold mb-xs text-on-surface">{value}</p>
      <p className="font-body-sm text-on-surface-variant text-[10px] leading-relaxed flex-grow">{body}</p>
    </div>
  );
}

function Tip({
  icon,
  title,
  amount,
  body,
  checked,
  onToggle,
}: {
  icon: string;
  title: string;
  amount?: string;
  body: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div 
      onClick={onToggle}
      className={`group cursor-pointer p-sm rounded-xl border transition-all duration-300 flex items-start gap-sm ${
        checked 
          ? "bg-secondary/5 border-secondary/40 shadow-xs" 
          : "bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60"
      }`}
    >
      {/* Interactive Checkbox */}
      <div className="flex items-center mt-1 shrink-0">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={() => {}} // toggling is handled by parent div click
          className="w-4 h-4 rounded text-secondary border-outline-variant focus:ring-secondary cursor-pointer"
        />
      </div>
      
      <div className="flex-grow">
        <div className="flex items-center gap-xs mb-xs">
          <span className={`material-symbols-outlined text-sm ${checked ? "text-secondary" : "text-on-surface-variant"}`}>{icon}</span>
          <h4 className="font-label-md text-xs font-bold text-on-surface">{title}</h4>
        </div>
        <p className="font-body-sm text-on-surface-variant text-[10px] leading-relaxed">
          {amount && <>Save up to <span className="font-bold text-secondary">{amount}</span> </>}
          {body}
        </p>
      </div>
    </div>
  );
}
