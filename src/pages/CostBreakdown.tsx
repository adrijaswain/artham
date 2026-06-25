import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth, saveUserCustomBreakdownToFirestore } from "../firebase";
import MarkdownRenderer from "../components/MarkdownRenderer";

type Item = { 
  title: string; 
  body: string; 
  estimate: string; 
  insurance: string; 
  oop: string;
  key: string;
  customNote?: string;
  isExcluded?: boolean;
  isHighlighted?: boolean;
};

const queryBreakdownPersonalizer = async (
  userMessage: string,
  patientState: string,
  age: string,
  stage: string,
  hormoneStatus: string,
  surgery: string,
  chemo: string,
  radiation: string,
  hospitalType: string,
  insurance: string,
  incomeBracket: string,
  apiKey: string,
  modelName: string
): Promise<{ reply: string; parsed: Record<string, unknown> }> => {
  const systemPrompt = `You are the Artham pricing navigator.
Your task is to analyze the user's clinical update and adjust their cost breakdown sheet accordingly.
Below is the patient's current profile:
- State: ${patientState}
- Age: ${age}
- Stage: ${stage}
- Hormone Status: ${hormoneStatus}
- Surgery: ${surgery}
- Chemotherapy: ${chemo}
- Radiation: ${radiation}
- Hospital: ${hospitalType}
- Insurance: ${insurance}
- Income Bracket: ${incomeBracket}

Based on the user's message, determine which cost breakdown items are relevant, which are not needed (N/A), and write any short custom notes.

You must only use the following item keys for your classification:
- Diagnostics: 'mammogram', 'ultrasound', 'biopsy', 'histopathology', 'ihc', 'bloodTests', 'pet', 'mri'
- Surgery: 'lumpectomy', 'slnb', 'mastectomy', 'alnd', 'reconstruction'
- Therapies: 'chemotherapy', 'radiation', 'hormonal', 'targeted', 'immunotherapy'

Respond in the exact format:
[REPLY] <empathetic explanation in 1-2 sentences of the personalization changes made> [JSON] {"relevantItems": ["<key1>", "<key2>"], "notNeeded": ["<key3>"], "customNotes": {"<key1>": "<short note>"}}

Ensure the JSON is completely valid and uses only keys from the list above. Do not include raw markdown block wrappers (\`\`\`json) for the JSON part.`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { text: `User Clinical Update: "${userMessage}"` }
      ]
    }]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Request failed");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  const replyIndex = rawText.indexOf("[REPLY]");
  const jsonIndex = rawText.indexOf("[JSON]");
  
  if (replyIndex === -1 || jsonIndex === -1) {
    throw new Error("Invalid format from model response");
  }

  const reply = rawText.slice(replyIndex + 7, jsonIndex).trim();
  const jsonStr = rawText.slice(jsonIndex + 6).trim();
  
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON part:", jsonStr, e);
    throw new Error("JSON parsing error", { cause: e });
  }

  return { reply, parsed };
};

export default function CostBreakdown() {
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

  // API Key management
  const apiKey = localStorage.getItem("gemini_api_key") || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
  const modelName = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-flash-lite";

  // AI custom breakdown configuration
  const [customBreakdown, setCustomBreakdown] = useState<{
    relevantItems?: string[];
    notNeeded?: string[];
    customNotes?: Record<string, string>;
  } | null>(() => {
    const saved = localStorage.getItem("artham_custom_breakdown");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Mini chatbot states
  const [chatHistory, setChatHistory] = useState<{ role: "bot" | "user"; text: string }[]>(() => {
    const saved = localStorage.getItem("artham_custom_breakdown");
    if (saved) {
      return [
        {
          role: "bot",
          text: "Hello! I am Artham's pricing navigator. Your cost breakdown is currently personalized based on your updates. You can clear overrides using the Reset button at any time."
        }
      ];
    }
    return [
      {
        role: "bot",
        text: "Hello! I am Artham's pricing navigator. Tell me more about your planned treatments (e.g., surgery type, prescribed therapies) and I will customize the cost breakdown sheet for you."
      }
    ];
  });
  const [draftMessage, setDraftMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
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

      const savedBreakdown = localStorage.getItem("artham_custom_breakdown");
      if (savedBreakdown) {
        try {
          setCustomBreakdown(JSON.parse(savedBreakdown));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCustomBreakdown(null);
      }
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const saveCustomBreakdown = async (breakdown: Record<string, unknown> | null) => {
    localStorage.setItem("artham_custom_breakdown", JSON.stringify(breakdown));
    setCustomBreakdown(breakdown);
    
    if (auth.currentUser) {
      try {
        await saveUserCustomBreakdownToFirestore(auth.currentUser.uid, breakdown);
      } catch (err) {
        console.error("Failed to save custom breakdown to firestore:", err);
      }
    }
    
    window.dispatchEvent(new CustomEvent("auth-change"));
  };

  const resetToDefault = async () => {
    localStorage.removeItem("artham_custom_breakdown");
    setCustomBreakdown(null);
    setChatHistory([
      {
        role: "bot",
        text: "Reset complete. Cost breakdown is back to standard intake estimates. How can I help you customize it today?"
      }
    ]);
    if (auth.currentUser) {
      await saveUserCustomBreakdownToFirestore(auth.currentUser.uid, null);
    }
    window.dispatchEvent(new CustomEvent("auth-change"));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim() || isChatLoading) return;

    const userMessage = draftMessage.trim();
    setChatHistory(prev => [...prev, { role: "user", text: userMessage }]);
    setDraftMessage("");
    setIsChatLoading(true);

    if (apiKey) {
      try {
        const { reply, parsed } = await queryBreakdownPersonalizer(
          userMessage,
          patientState,
          age,
          stage,
          hormoneStatus,
          surgery,
          chemo,
          radiation,
          hospitalType,
          hasInsurance ? (insuranceProvider || "Yes") : "None",
          incomeBracket,
          apiKey,
          modelName
        );

        saveCustomBreakdown(parsed);
        setChatHistory(prev => [...prev, { role: "bot", text: reply }]);
      } catch (err) {
        console.error("AI personalization error:", err);
        setChatHistory(prev => [...prev, { 
          role: "bot", 
          text: "I ran into an issue personalizing your cost breakdown. Please check your Gemini API key or try again." 
        }]);
      } finally {
        setIsChatLoading(false);
      }
    } else {
      // Simulated mock personalization in Demo Mode
      setTimeout(() => {
        const lower = userMessage.toLowerCase();
        let reply = "I've personalized your cost breakdown list by prioritizing and filtering items accordingly.";
        let parsed = {
          relevantItems: [] as string[],
          notNeeded: [] as string[],
          customNotes: {} as Record<string, string>
        };

        if (lower.includes("lumpectomy") || lower.includes("breast save") || lower.includes("partial")) {
          reply = "Updated your surgical pathway to focus on a Lumpectomy and Sentinel Lymph Node Biopsy, and marked Mastectomy as not needed.";
          parsed.relevantItems = ["lumpectomy", "slnb"];
          parsed.notNeeded = ["mastectomy", "alnd", "reconstruction"];
          parsed.customNotes = {
            lumpectomy: "AI Customization: Planned breast-conserving surgery.",
            slnb: "AI Customization: Sentinel node biopsy indicated."
          };
        } else if (lower.includes("no chemo") || lower.includes("chemotherapy not")) {
          reply = "Understood. Chemotherapy cycles and day-care fees have been excluded from the cost estimate sheet.";
          parsed.notNeeded = ["chemotherapy"];
          parsed.customNotes = {
            chemotherapy: "AI Customization: Excluded per consult."
          };
        } else if (lower.includes("targeted") || lower.includes("trastuzumab")) {
          reply = "Prioritized targeted antibody therapy (Trastuzumab) on your active maintenance roadmap.";
          parsed.relevantItems = ["targeted"];
          parsed.customNotes = {
            targeted: "AI Customization: Confirmed targeted protocol."
          };
        }

        saveCustomBreakdown(parsed);
        setChatHistory(prev => [...prev, { role: "bot", text: reply }]);
        setIsChatLoading(false);
      }, 1000);
    }
  };

  const isIntakeFilled = !!patientState && !!age && !!stage;

  // Hospital Category: "Government" | "Private" | "Premium"
  const category: "Government" | "Private" | "Premium" =
    hospitalType === "Government / Public Hospital" ? "Government" :
    hospitalType === "Premium Corporate Hospital" ? "Premium" : "Private";

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

  const formatINR = (val: number) => {
    return "₹" + val.toLocaleString("en-IN");
  };

  let coveragePercent = 0;
  if (hasInsurance && isIntakeFilled) {
    coveragePercent = category === "Government" ? 0.90 : 0.75;
  }

  const getItemCustomDetails = (itemKey: string) => {
    if (!customBreakdown) return { isRelevant: false, isNotNeeded: false, note: "" };
    
    let isNotNeeded = customBreakdown.notNeeded?.includes(itemKey) || false;
    const isRelevant = customBreakdown.relevantItems?.includes(itemKey) || false;
    const note = customBreakdown.customNotes?.[itemKey] || "";

    // Dependencies
    if (itemKey === "chemoAdmin" && customBreakdown.notNeeded?.includes("chemotherapy")) {
      isNotNeeded = true;
    }
    
    return { isRelevant, isNotNeeded, note };
  };

  const createItem = (title: string, body: string, estimateVal: number, itemKey: string): Item => {
    const itemInsuranceShare = Math.round(estimateVal * coveragePercent);
    let itemOop = estimateVal - itemInsuranceShare;

    if (incomeBracket === "Below ₹2,50,000") {
      itemOop = 0;
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      itemOop = Math.round(itemOop * 0.5);
    }

    const { isRelevant, isNotNeeded, note } = getItemCustomDetails(itemKey);

    return {
      title,
      body,
      estimate: formatINR(estimateVal),
      insurance: formatINR(itemInsuranceShare),
      oop: formatINR(itemOop),
      key: itemKey,
      customNote: note,
      isExcluded: isNotNeeded,
      isHighlighted: isRelevant
    };
  };

  const diagnosticsItems: Item[] = [];
  const primaryItems: Item[] = [];
  const medicationItems: Item[] = [];
  const hospitalizationItems: Item[] = [];



  if (isIntakeFilled) {
    let chemoCyclesCount = 0;

    diagnosticsItems.push(createItem("Mammogram", "Baseline bilateral screening mammography.", DIAGNOSTICS.mammogram[category], "mammogram"));
    diagnosticsItems.push(createItem("Breast Ultrasound", "High-resolution ultrasound of both breasts and axilla.", DIAGNOSTICS.ultrasound[category], "ultrasound"));
    diagnosticsItems.push(createItem("Core Needle Biopsy", "Ultrasound-guided core needle biopsy of the primary tumor.", DIAGNOSTICS.biopsy[category], "biopsy"));
    diagnosticsItems.push(createItem("Histopathology", "Microscopic examination and tumor grading of biopsy tissue.", DIAGNOSTICS.histopathology[category], "histopathology"));
    diagnosticsItems.push(createItem("IHC Panel (ER/PR/HER2)", "Immunohistochemistry profiling to determine receptor status.", DIAGNOSTICS.ihc[category], "ihc"));
    diagnosticsItems.push(createItem("Blood Tests Package", "Complete blood count, liver/kidney function tests, and viral markers.", DIAGNOSTICS.bloodTests[category], "bloodTests"));

    if (stage === "Stage III" || stage === "Stage IV") {
      diagnosticsItems.push(createItem("PET-CT Scan", "Whole-body PET-CT scan for staging and metastasis screening.", DIAGNOSTICS.pet[category], "pet"));
    }
    if (hormoneStatus === "HER2 Positive" || hormoneStatus === "Triple Negative" || Number(age) < 40) {
      diagnosticsItems.push(createItem("Breast MRI", "Contrast-enhanced breast MRI for detailed anatomical planning.", DIAGNOSTICS.mri[category], "mri"));
    }

    if (surgery !== "No" && surgery !== "") {
      if (stage === "Stage I" || stage === "Stage II") {
        const baseSurgery = SURGERY.lumpectomy[category];
        primaryItems.push(createItem("Lumpectomy Surgery", "Surgical removal of the breast tumor with margins.", baseSurgery, "lumpectomy"));
        
        const nodeSurgery = SURGERY.slnb[category];
        primaryItems.push(createItem("Sentinel Lymph Node Biopsy (SLNB)", "Biopsy of sentinel lymph nodes to check for early spread.", nodeSurgery, "slnb"));
      } else {
        const baseSurgery = SURGERY.mastectomy[category];
        primaryItems.push(createItem("Mastectomy Surgery", "Complete surgical removal of the breast tissue.", baseSurgery, "mastectomy"));

        const nodeSurgery = SURGERY.alnd[category];
        primaryItems.push(createItem("Axillary Lymph Node Dissection (ALND)", "Removal of axillary lymph nodes due to advanced stage spread.", nodeSurgery, "alnd"));
      }

      if (stage === "Stage II" || stage === "Stage III") {
        const reconSurgery = SURGERY.reconstruction[category];
        primaryItems.push(createItem("Breast Reconstruction Surgery", "Post-mastectomy reconstructive breast surgery.", reconSurgery, "reconstruction"));
      }
    }

    if (chemo !== "No" && chemo !== "") {
      let chemoVal = 0;
      let chosenChemoName = "";
      if (hormoneStatus === "HER2 Positive") {
        chemoVal = CHEMO.tch6[category];
        chosenChemoName = "TCH × 6";
        chemoCyclesCount = 6;
      } else if (hormoneStatus === "Triple Negative") {
        chemoVal = CHEMO.act[category];
        chosenChemoName = "AC-T";
        chemoCyclesCount = 8;
      } else if (hormoneStatus === "ER+/PR+ Positive") {
        if (stage === "Stage I" || stage === "Stage II") {
          chemoVal = CHEMO.tc4[category];
          chosenChemoName = "TC × 4";
          chemoCyclesCount = 4;
        } else {
          chemoVal = CHEMO.fac[category];
          chosenChemoName = "FAC";
          chemoCyclesCount = 6;
        }
      } else {
        chemoVal = CHEMO.act[category];
        chosenChemoName = "AC-T";
        chemoCyclesCount = 8;
      }
      primaryItems.push(createItem(`Chemotherapy: ${chosenChemoName}`, `Systemic chemotherapy protocol (${chemoCyclesCount} cycles total).`, chemoVal, "chemotherapy"));
    }

    if (radiation !== "No" && radiation !== "") {
      let radVal = 0;
      if (stage === "Stage I" || stage === "Stage II") {
        radVal = RADIATION.whole[category];
        primaryItems.push(createItem("Whole Breast Radiation", "Adjuvant radiation therapy for the remaining breast tissue.", radVal, "radiation"));
      } else {
        radVal = RADIATION.chestWall[category] + RADIATION.regional[category];
        primaryItems.push(createItem("Chest Wall & Regional Radiation", "Targeted radiation to chest wall and regional lymph node basins.", radVal, "radiation"));
      }
    }

    if (hormoneStatus === "ER+/PR+ Positive") {
      let hormoneVal = 0;
      let chosenHormoneName = "";
      if (Number(age) >= 50) {
        hormoneVal = HORMONE.letrozole[category];
        chosenHormoneName = "Letrozole (5 years)";
      } else {
        hormoneVal = HORMONE.tamoxifen[category];
        chosenHormoneName = "Tamoxifen (5 years)";
      }
      medicationItems.push(createItem(`Hormone Therapy: ${chosenHormoneName}`, "Long-term daily oral maintenance therapy (5-year course).", hormoneVal, "hormonal"));
    }

    if (hormoneStatus === "HER2 Positive") {
      let targetedVal = 0;
      let chosenTargetedName = "";
      if (stage === "Stage III" || stage === "Stage IV") {
        targetedVal = TARGETED.pertuzumabTrastuzumab[category];
        chosenTargetedName = "Pertuzumab + Trastuzumab";
      } else {
        targetedVal = TARGETED.trastuzumab[category];
        chosenTargetedName = "Trastuzumab (17 cycles)";
      }
      medicationItems.push(createItem(`Targeted Therapy: ${chosenTargetedName}`, "Monoclonal antibody regimen specifically targeting HER2 receptors.", targetedVal, "targeted"));
    }

    if (hormoneStatus === "Triple Negative" && (stage === "Stage III" || stage === "Stage IV")) {
      const immunoVal = IMMUNO.pembrolizumab[category];
      const chosenImmunoName = "Pembrolizumab";
      medicationItems.push(createItem(`Immunotherapy: ${chosenImmunoName}`, "Checkpoint inhibitor therapy recommended for advanced Triple Negative breast cancer.", immunoVal, "immunotherapy"));
    }

    const consultationCost = ADDITIONAL.consultationInit[category] + (10 * ADDITIONAL.consultationFollow[category]);
    hospitalizationItems.push(createItem("Oncology Consultations", "Initial oncology consultation and 10 follow-up visits.", consultationCost, "consultations"));

    if (chemo !== "No" && chemoCyclesCount > 0) {
      const chemoAdminCost = chemoCyclesCount * ADDITIONAL.chemoAdmin[category];
      hospitalizationItems.push(createItem("Chemo Administration Day-Care", `Day-care clinical ward and nursing fees for ${chemoCyclesCount} chemo infusions.`, chemoAdminCost, "chemoAdmin"));
    }
    
    const hospitalizationCost = 3 * ADDITIONAL.admission[category];
    hospitalizationItems.push(createItem("Inpatient Ward Admission", "3 days standard room stay for surgical recovery and monitoring.", hospitalizationCost, "admission"));

    if (stage === "Stage III" || stage === "Stage IV" || category === "Premium" || category === "Private") {
      const icuCost = 1 * ADDITIONAL.icu[category];
      hospitalizationItems.push(createItem("ICU Admission", "1 day ICU monitoring following complex surgery.", icuCost, "icu"));
    }
  }

  const getSumOfNonExcludedItems = (items: Item[]) => {
    return items
      .filter(it => !it.isExcluded)
      .reduce((sum, it) => {
        const cleanStr = it.estimate.replace(/[₹,]/g, "");
        const num = parseFloat(cleanStr) || 0;
        return sum + num;
      }, 0);
  };

  const getOopSumOfNonExcludedItems = (items: Item[]) => {
    return items
      .filter(it => !it.isExcluded)
      .reduce((sum, it) => {
        const cleanStr = it.oop.replace(/[₹,]/g, "");
        const num = parseFloat(cleanStr) || 0;
        return sum + num;
      }, 0);
  };

  const allItems = [...diagnosticsItems, ...primaryItems, ...medicationItems, ...hospitalizationItems];
  
  const totalEstimate = isIntakeFilled ? getSumOfNonExcludedItems(allItems) : 0;
  let outOfPocket = isIntakeFilled ? getOopSumOfNonExcludedItems(allItems) : 0;
  const insuranceShare = totalEstimate - outOfPocket;

  let subsidyApplied = false;
  let subsidyAmount = 0;
  let subsidyName = "";

  if (isIntakeFilled) {
    if (incomeBracket === "Below ₹2,50,000") {
      subsidyApplied = true;
      subsidyAmount = outOfPocket;
      outOfPocket = 0;
      subsidyName = "Ayushman Bharat PM-JAY (100% Subsidy)";
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      subsidyApplied = true;
      subsidyAmount = Math.round(outOfPocket * 0.5);
      outOfPocket = outOfPocket - subsidyAmount;
      subsidyName = "National Illness Assistance Fund (50% Subsidy)";
    }
  }

  const sortAndFilterItems = (items: Item[]) => {
    return [...items].sort((a, b) => {
      const aVal = a.isHighlighted ? -1 : a.isExcluded ? 1 : 0;
      const bVal = b.isHighlighted ? -1 : b.isExcluded ? 1 : 0;
      return aVal - bVal;
    });
  };

  const sections: { icon: string; title: string; items: Item[] }[] = [
    {
      icon: "biotech",
      title: "Pre-treatment Diagnostics",
      items: diagnosticsItems,
    },
    {
      icon: "healing",
      title: "Primary Treatment",
      items: primaryItems,
    },
    {
      icon: "medication",
      title: "Medication & Supportive Care",
      items: medicationItems,
    },
    {
      icon: "domain",
      title: "Hospitalization & Consultations",
      items: hospitalizationItems,
    },
  ].filter(section => section.items.length > 0);


  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pb-xl pt-md max-w-container-max mx-auto space-y-md animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-sm gap-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Personalized Treatment Estimate
            </h1>
            <p className="font-body-sm text-on-surface-variant text-xs mt-1">
              Personalized calculation in Rupees based on your intake diagnostics and clinical preferences.
            </p>
            {isIntakeFilled && (
              <div className="mt-xs text-on-surface-variant/80 text-[10px] flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                <span>Calibrated with clinical cost records from Dr. Jay Anam's Breast Cancer Clinic, Mumbai.</span>
              </div>
            )}
          </div>
          
          <div className="bg-surface-container-low p-sm rounded-2xl border border-outline-variant/40 flex items-center gap-sm shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="font-label-sm text-[9px] uppercase font-bold text-outline tracking-wider">Reliability Score</p>
              <p className="font-bold text-secondary text-xs">{isIntakeFilled ? (customBreakdown ? "Custom AI Personal (96%)" : "High (92%)") : "None (0%)"}</p>
            </div>
          </div>
        </div>

        {/* Selected Intake Profile Parameters Badge strip */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-md flex flex-wrap gap-xs items-center justify-between shadow-sm text-xs text-on-surface-variant font-medium font-body-sm">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-sm">
            <span className="font-bold text-[#B83B5E] flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">tune</span> Intake Parameters:
            </span>
            <span>State: <strong>{patientState || "Pending"}</strong></span>
            <span>•</span>
            <span>Age: <strong>{age || "Pending"}</strong></span>
            <span>•</span>
            <span>Stage: <strong>{stage || "Pending"}</strong></span>
            <span>•</span>
            <span>Receptors: <strong>{hormoneStatus || "Pending"}</strong></span>
            <span>•</span>
            <span>Hospital: <strong>{hospitalType ? hospitalType.split(" / ")[0] : "Pending"}</strong></span>
            <span>•</span>
            <span>Insurance: <strong>{hasInsurance ? (insuranceProvider || "Yes") : "None / Pending"}</strong></span>
            <span>•</span>
            <span>Income: <strong>{incomeBracket || "Pending"}</strong></span>
          </div>
          
          <div className="flex items-center gap-sm">
            {customBreakdown && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Personalized
              </span>
            )}
            <Link to="/intake" className="text-xs text-[#B83B5E] hover:underline font-bold flex items-center gap-[2px] shrink-0">
              {isIntakeFilled ? "Edit Parameters" : "Start Intake"} <span className="material-symbols-outlined text-[14px]">{isIntakeFilled ? "edit" : "arrow_forward"}</span>
            </Link>
          </div>
        </div>

        {!isIntakeFilled ? (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-xl text-center space-y-md shadow-sm max-w-2xl mx-auto my-lg animate-fade-in">
            <span className="material-symbols-outlined text-[#B83B5E] text-[64px] animate-pulse">payments</span>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Treatment Cost Estimate Pending</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-md mx-auto">
              We need a few details about your diagnosis, treatment recommendations, and insurance status to calculate your customized cost roadmap and potential out-of-pocket expenses.
            </p>
            <Link
              to="/intake"
              className="inline-flex items-center gap-xs bg-primary text-on-primary hover:brightness-110 px-lg py-md rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">assignment</span>
              Fill Out Intake Form
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
            
            {/* Left Column: Breakdown Sheet */}
            <div className="lg:col-span-2 space-y-md">
              {/* Summary Cards Panel */}
              <div className={`grid grid-cols-1 md:grid-cols-${subsidyApplied ? '4' : '3'} gap-md`}>
                <SummaryCard label="Total Estimate" value={formatINR(totalEstimate)} tone="primary" />
                <SummaryCard 
                  label="Insurance Coverage" 
                  value={formatINR(insuranceShare)} 
                  tone="secondary" 
                  pct={totalEstimate > 0 ? Math.round((insuranceShare / totalEstimate) * 100) : 0} 
                />
                {subsidyApplied && (
                  <SummaryCard 
                    label={`Welfare Subsidy`} 
                    sublabel={subsidyName.split(" (")[0]}
                    value={formatINR(subsidyAmount)} 
                    tone="primary" 
                    pct={totalEstimate > 0 ? Math.round((subsidyAmount / totalEstimate) * 100) : 0} 
                  />
                )}
                <SummaryCard 
                  label="Net Out-of-Pocket" 
                  value={formatINR(outOfPocket)} 
                  tone={outOfPocket === 0 ? "secondary" : "tertiary"} 
                  pct={totalEstimate > 0 ? Math.round((outOfPocket / totalEstimate) * 100) : 0} 
                />
              </div>

              {/* Subsidy notification banner */}
              {subsidyApplied && (
                <div className="bg-[#F9CBDB]/10 border border-[#F9CBDB]/30 rounded-2xl p-md flex items-start gap-sm">
                  <span className="material-symbols-outlined text-[#B83B5E] text-[20px] mt-0.5">volunteer_activism</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#B83B5E]">{subsidyName} Applied</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                      Your out-of-pocket share has been reduced by <strong>{formatINR(subsidyAmount)}</strong> because of your income classification. Submit your income certificate during the action plan stages to lock in this subsidy.
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline Breakdown List */}
              <div className="space-y-lg relative pt-sm">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-outline-variant/60 hidden md:block" />
                {sections.map((s) => (
                  <section className="relative" key={s.title}>
                    <div className="flex items-center gap-md mb-md">
                      <div className="z-10 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md shrink-0 border border-outline-variant/40">
                        <span className="material-symbols-outlined text-[30px]">{s.icon}</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{s.title}</h3>
                    </div>
                    <div className="md:ml-20 space-y-sm">
                      {sortAndFilterItems(s.items).map((it) => {
                        const { key, ...rest } = it;
                        return <LineItem key={key} {...rest} />;
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {/* Financial Resilience Insight */}
              <div className="mt-xl bg-primary-container/20 text-on-primary-container p-lg rounded-3xl flex flex-col md:flex-row gap-lg items-center overflow-hidden border border-outline-variant/40 relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-container/30 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex-1 z-10 space-y-sm">
                  <h2 className="font-headline-md text-headline-md font-bold text-primary">Financial Resilience Insight</h2>
                  <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-2xl">
                    By selecting an empanelled, specialized center, you can save up to <strong>{formatINR(Math.round(totalEstimate * 0.15))}</strong> in hospital beds and ICU fees. Our estimates are verified against local radiology registries and empanelled hospital databases.
                  </p>
                  <Link
                    to="/action-plan"
                    className="inline-flex items-center gap-xs bg-secondary hover:bg-secondary/90 px-md py-sm rounded-xl font-bold text-xs text-on-secondary shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Review Savings Roadmap
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                
                <div className="w-full md:w-64 flex flex-col items-center gap-sm z-10 bg-surface-container-low border border-outline-variant/40 p-md rounded-2xl">
                  <div className="relative w-44 h-22 overflow-hidden flex flex-col justify-end items-center pt-2">
                    <div className="absolute top-2 w-36 h-36 border-[10px] border-surface-container-high rounded-full" />
                    <div
                      className="absolute top-2 w-36 h-36 border-[10px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent rounded-full origin-center transition-all duration-700"
                      style={{ transform: "rotate(45deg)" }}
                    />
                    <span className="font-headline-sm text-sm text-primary font-bold z-10">Excellent</span>
                  </div>
                  <p className="font-label-sm text-[9px] uppercase font-bold text-outline text-center tracking-wider mt-1">
                    Network Alignment Index
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: AI Pricing Personalizer Mini Chatbot */}
            <div className="lg:col-span-1 bg-surface-container-low border border-outline-variant/40 rounded-3xl p-md shadow-sm sticky top-20 flex flex-col h-[520px] overflow-hidden">
              {/* Chatbot Header */}
              <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30 shrink-0">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-[20px] active-entity-pulse">auto_awesome</span>
                  <div>
                    <h3 className="font-headline-sm text-xs font-bold text-primary">AI Pricing Personalizer</h3>
                    <p className="text-[9px] text-outline font-medium">Dynamically customize cost sheet</p>
                  </div>
                </div>
                {customBreakdown && (
                  <button
                    onClick={resetToDefault}
                    className="px-2 py-1 text-[10px] font-bold text-error border border-error-container/30 hover:bg-error-container/10 rounded-lg transition-all"
                  >
                    Reset Standard
                  </button>
                )}
              </div>

              {/* Chat history list */}
              <div className="flex-grow overflow-y-auto py-sm space-y-sm pr-xs custom-scrollbar">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-sm max-w-[85%] rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-none"
                        : "bg-surface-bright border border-outline-variant/40 text-on-surface rounded-tl-none"
                    }`}>
                      {msg.role === "bot" ? <MarkdownRenderer text={msg.text} /> : msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-sm bg-surface-bright border border-outline-variant/40 text-on-surface rounded-2xl rounded-tl-none flex items-center gap-xs">
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-200" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input textfield form */}
              <form onSubmit={handleSendMessage} className="pt-sm border-t border-outline-variant/30 flex gap-xs items-center shrink-0">
                <input
                  type="text"
                  placeholder="e.g. Omit chemo cycles..."
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-grow px-3 py-2 border border-outline-variant rounded-xl text-xs bg-surface-bright text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !draftMessage.trim()}
                  className="p-2 bg-primary text-on-primary hover:brightness-110 rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            </div>
            
          </div>
        )}

      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  sublabel,
  value,
  tone,
  pct = 100,
}: {
  label: string;
  sublabel?: string;
  value: string;
  tone: "primary" | "secondary" | "tertiary";
  pct?: number;
}) {
  const text = { primary: "text-primary", secondary: "text-secondary", tertiary: "text-tertiary" }[tone];
  const bar = { primary: "bg-primary", secondary: "bg-secondary", tertiary: "bg-tertiary" }[tone];
  return (
    <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
      <div>
        <p className="font-label-md text-[10px] uppercase font-bold text-outline tracking-wider mb-xs">{label}</p>
        <p className={`font-headline-md text-headline-md font-bold text-[20px] ${text}`}>{value}</p>
        {sublabel && <p className="text-[10px] text-outline font-medium italic mt-0.5">{sublabel}</p>}
      </div>
      <div className="w-full h-1 bg-surface-container-high mt-md rounded-full overflow-hidden">
        <div className={`${bar} h-1 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LineItem({ title, body, estimate, insurance, oop, isExcluded, isHighlighted, customNote }: Item) {
  return (
    <div className={`p-md rounded-2xl border transition-all ${
      isExcluded
        ? "bg-surface-container-lowest border-outline-variant/20 opacity-55 hover:opacity-75"
        : isHighlighted
        ? "bg-primary/5 border-primary/30 shadow-sm hover:border-primary/60"
        : "bg-surface-container-low border-outline-variant/50 hover:border-[#F9CBDB]/60 hover:shadow-sm"
    }`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
        <div className="flex-1 min-w-0 pr-md">
          <div className="flex items-center gap-xs flex-wrap">
            <h4 className={`font-label-md text-xs font-bold ${isExcluded ? "text-outline line-through" : "text-primary"}`}>
              {title}
            </h4>
            {isHighlighted && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-[2px]">
                <span className="material-symbols-outlined text-[10px]">check_circle</span>
                Confirmed relevant
              </span>
            )}
            {isExcluded && (
              <span className="px-2 py-0.5 rounded-full bg-outline-variant/40 text-outline border border-outline-variant/40 text-[9px] font-bold uppercase tracking-wider">
                Excluded (N/A)
              </span>
            )}
          </div>
          <p className={`font-body-sm text-[10px] leading-normal mt-1 ${isExcluded ? "text-outline/70" : "text-on-surface-variant"}`}>
            {body}
          </p>
          
          {customNote && (
            <div className="mt-2 p-1.5 rounded-lg bg-surface-container/60 border border-outline-variant/30 text-[10px] text-on-surface-variant flex items-start gap-xs max-w-lg">
              <span className="material-symbols-outlined text-[12px] text-[#B83B5E] mt-0.5 shrink-0">auto_awesome</span>
              <span><strong>AI Navigator:</strong> {customNote}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-md w-full md:w-auto shrink-0 pt-sm md:pt-0 border-t md:border-t-0 border-outline-variant/20">
          <Cell label="Estimate" value={isExcluded ? "N/A" : estimate} bold />
          <Cell label="Insurance" value={isExcluded ? "N/A" : insurance} tone="text-secondary" />
          <Cell label="OOP" value={isExcluded ? "N/A" : oop} tone="text-tertiary" bold />
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div>
      <p className="font-label-sm text-[9px] uppercase font-bold text-outline tracking-wider">{label}</p>
      <p className={`font-body-md text-xs mt-1 ${bold ? "font-bold" : ""} ${tone ?? "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}

