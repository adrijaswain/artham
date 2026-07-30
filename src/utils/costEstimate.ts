// Shared breast-cancer treatment cost model. Used by the Dashboard cost
// summary and by the downloadable care report so both show the same numbers.

export type HospitalCategory = "Government" | "Private" | "Premium";

export type IntakeProfile = {
  state: string;
  age: string;
  stage: string;
  hormoneStatus: string;
  surgery: string;
  chemo: string;
  radiation: string;
  hospitalType: string;
  hasInsurance: boolean;
  incomeBracket: string;
};

export type CostBreakdownLine = { label: string; amount: number };

export type CostEstimate = {
  isIntakeFilled: boolean;
  category: HospitalCategory;
  totalEstimate: number;
  minCost: number;
  maxCost: number;
  insuranceShare: number;
  outOfPocket: number;
  treatmentDesc: string;
  confidenceScore: "None" | "Medium" | "High";
  confidenceText: string;
  breakdown: CostBreakdownLine[];
};

// Pricing maps calibrated against Dr. Jay Anam's clinical records.
const DIAGNOSTICS = {
  mammogram: { Government: 1000, Private: 3000, Premium: 5000 },
  ultrasound: { Government: 1500, Private: 4000, Premium: 6000 },
  biopsy: { Government: 5000, Private: 20000, Premium: 35000 },
  histopathology: { Government: 3000, Private: 10000, Premium: 15000 },
  ihc: { Government: 5000, Private: 15000, Premium: 25000 },
  pet: { Government: 10000, Private: 30000, Premium: 45000 },
  mri: { Government: 8000, Private: 25000, Premium: 40000 },
  bloodTests: { Government: 2000, Private: 8000, Premium: 12000 },
};

const SURGERY = {
  lumpectomy: { Government: 75000, Private: 185000, Premium: 350000 },
  mastectomy: { Government: 100000, Private: 270000, Premium: 500000 },
  slnb: { Government: 30000, Private: 75000, Premium: 125000 },
  alnd: { Government: 50000, Private: 100000, Premium: 175000 },
  reconstruction: { Government: 100000, Private: 250000, Premium: 600000 },
};

const CHEMO = {
  tc4: { Government: 100000, Private: 200000, Premium: 350000 },
  fac: { Government: 90000, Private: 180000, Premium: 300000 },
  act: { Government: 150000, Private: 320000, Premium: 600000 },
  tch6: { Government: 300000, Private: 500000, Premium: 800000 },
};

const RADIATION = {
  whole: { Government: 75000, Private: 200000, Premium: 350000 },
  chestWall: { Government: 75000, Private: 200000, Premium: 350000 },
  regional: { Government: 100000, Private: 250000, Premium: 400000 },
};

// Per-year list price; multiplied by a representative 5-year course length
// below (the guideline-minimum duration - many higher-risk patients take it
// for 10, but 5 is the conservative standard-of-care baseline).
const HORMONE_ANNUAL = {
  tamoxifen: { Government: 10000, Private: 50000, Premium: 75000 },
  letrozole: { Government: 25000, Private: 100000, Premium: 150000 },
};
const HORMONE_THERAPY_YEARS = 5;

// Trastuzumab pricing reflects the biosimilars (Hertraz, Ogivri, Canmab, etc.)
// that most Indian patients are actually prescribed today, not the originator
// Herceptin brand - biosimilars run 40-70% cheaper for a full ~17-18 dose
// course. Pertuzumab has no Indian biosimilar yet, so that combo stays
// priced closer to originator rates.
const TARGETED = {
  trastuzumab: { Government: 180000, Private: 450000, Premium: 750000 },
  pertuzumabTrastuzumab: { Government: 500000, Private: 1200000, Premium: 1800000 },
};

const IMMUNO = {
  pembrolizumab: { Government: 1000000, Private: 1500000, Premium: 2500000 },
};

const ADDITIONAL = {
  consultationInit: { Government: 500, Private: 2000, Premium: 4000 },
  consultationFollow: { Government: 500, Private: 1500, Premium: 3000 },
  chemoAdmin: { Government: 2000, Private: 10000, Premium: 20000 },
  admission: { Government: 2000, Private: 10000, Premium: 25000 },
  icu: { Government: 10000, Private: 40000, Premium: 75000 },
};

// Roughly what Ayushman Bharat PM-JAY (and similar state schemes) actually
// caps at per family per year - the low-income out-of-pocket break below is
// bounded by this instead of assuming welfare schemes cover an unlimited bill.
const GOVERNMENT_SCHEME_CAP = 500000;

// State-level cost-of-living adjustment: metro states carry meaningfully
// higher private/premium hospital pricing than smaller states, while
// government-rate care is far more nationally standardized. Government/
// Private/Premium base tables above are calibrated to a mid-tier baseline,
// so this scales the deviation from that baseline per hospital category.
const HIGH_COST_STATES = new Set([
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Chandigarh", "Puducherry",
]);
const LOW_COST_STATES = new Set([
  "Odisha", "Bihar", "Jharkhand", "Chhattisgarh", "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Sikkim", "Tripura", "Andaman and Nicobar Islands", "Lakshadweep",
  "Dadra and Nagar Haveli and Daman and Diu",
]);

function getStateCostMultiplier(state: string): number {
  if (HIGH_COST_STATES.has(state)) return 1.12;
  if (LOW_COST_STATES.has(state)) return 0.85;
  return 1.0;
}

const CATEGORY_STATE_SENSITIVITY: Record<HospitalCategory, number> = {
  Government: 0.3,
  Private: 1.0,
  Premium: 1.15,
};

export function computeCostEstimate(intake: IntakeProfile): CostEstimate {
  const { state, age, stage, hormoneStatus, surgery, chemo, radiation, hospitalType, hasInsurance, incomeBracket } = intake;
  const isIntakeFilled = !!state && !!age && !!stage;

  let category: HospitalCategory = "Private";
  if (hospitalType === "Government / Public Hospital") category = "Government";
  else if (hospitalType === "Premium Corporate Hospital") category = "Premium";

  // How much this patient's state pulls hospital pricing away from the
  // calibrated baseline, damped per category (government rates barely move).
  const stateMultiplier = getStateCostMultiplier(state);
  const effectiveMultiplier = 1 + (stateMultiplier - 1) * CATEGORY_STATE_SENSITIVITY[category];

  const breakdown: CostBreakdownLine[] = [];
  let totalEstimate = 0;

  if (isIntakeFilled) {
    const biopsyCost = DIAGNOSTICS.biopsy[category] + DIAGNOSTICS.histopathology[category] + DIAGNOSTICS.ihc[category];
    let imagingCost = DIAGNOSTICS.mammogram[category] + DIAGNOSTICS.ultrasound[category] + DIAGNOSTICS.bloodTests[category];
    if (stage === "Stage III" || stage === "Stage IV") imagingCost += DIAGNOSTICS.pet[category];
    if (hormoneStatus === "HER2 Positive" || hormoneStatus === "Triple Negative" || Number(age) < 40) {
      imagingCost += DIAGNOSTICS.mri[category];
    }
    const diagnosticsCost = Math.round((biopsyCost + imagingCost) * effectiveMultiplier);

    let surgeryCost = 0;
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
      if (stage === "Stage II" || stage === "Stage III") reconSurgery = SURGERY.reconstruction[category];
      surgeryCost = Math.round((baseSurgery + nodeSurgery + reconSurgery) * effectiveMultiplier);
    }

    let chemoCost = 0;
    let chemoCyclesCount = 0;
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
      chemoCost = Math.round(chemoCost * effectiveMultiplier);
    }

    let radiationCost = 0;
    if (radiation !== "No" && radiation !== "") {
      radiationCost = stage === "Stage I" || stage === "Stage II"
        ? RADIATION.whole[category]
        : RADIATION.chestWall[category] + RADIATION.regional[category];
      radiationCost = Math.round(radiationCost * effectiveMultiplier);
    }

    let hormoneCost = 0;
    if (hormoneStatus === "ER+/PR+ Positive") {
      const annualHormoneCost = Number(age) >= 50 ? HORMONE_ANNUAL.letrozole[category] : HORMONE_ANNUAL.tamoxifen[category];
      hormoneCost = Math.round(annualHormoneCost * HORMONE_THERAPY_YEARS * effectiveMultiplier);
    }

    let targetedCost = 0;
    if (hormoneStatus === "HER2 Positive") {
      targetedCost = stage === "Stage III" || stage === "Stage IV"
        ? TARGETED.pertuzumabTrastuzumab[category]
        : TARGETED.trastuzumab[category];
      targetedCost = Math.round(targetedCost * effectiveMultiplier);
    }

    let immunoCost = 0;
    if (hormoneStatus === "Triple Negative" && (stage === "Stage III" || stage === "Stage IV")) {
      immunoCost = Math.round(IMMUNO.pembrolizumab[category] * effectiveMultiplier);
    }

    const consultationCost = ADDITIONAL.consultationInit[category] + 10 * ADDITIONAL.consultationFollow[category];
    const chemoAdminCost = chemo !== "No" && chemoCyclesCount > 0 ? chemoCyclesCount * ADDITIONAL.chemoAdmin[category] : 0;
    const hospitalizationCost = 3 * ADDITIONAL.admission[category];
    const icuCost = stage === "Stage III" || stage === "Stage IV" || category === "Premium" || category === "Private"
      ? 1 * ADDITIONAL.icu[category]
      : 0;
    const careLogisticsCost = Math.round((consultationCost + chemoAdminCost + hospitalizationCost + icuCost) * effectiveMultiplier);

    totalEstimate =
      diagnosticsCost + surgeryCost + chemoCost + radiationCost + hormoneCost + targetedCost + immunoCost + careLogisticsCost;

    breakdown.push({ label: "Diagnostics & imaging", amount: diagnosticsCost });
    if (surgeryCost) breakdown.push({ label: "Surgery", amount: surgeryCost });
    if (chemoCost) breakdown.push({ label: "Chemotherapy", amount: chemoCost });
    if (radiationCost) breakdown.push({ label: "Radiation", amount: radiationCost });
    if (hormoneCost) breakdown.push({ label: "Hormone therapy", amount: hormoneCost });
    if (targetedCost) breakdown.push({ label: "Targeted therapy", amount: targetedCost });
    if (immunoCost) breakdown.push({ label: "Immunotherapy", amount: immunoCost });
    breakdown.push({ label: "Consultations, admission & ICU", amount: careLogisticsCost });
  }

  const minCost = Math.round(totalEstimate * 0.9);
  const maxCost = Math.round(totalEstimate * 1.1);

  let coveragePercent = 0;
  if (hasInsurance && isIntakeFilled) coveragePercent = category === "Government" ? 0.9 : 0.75;
  const insuranceShare = Math.round(totalEstimate * coveragePercent);
  let outOfPocket = totalEstimate - insuranceShare;

  if (isIntakeFilled) {
    if (incomeBracket === "Below ₹2,50,000") {
      // Public hospitals routinely waive cost entirely for BPL patients under
      // state welfare schemes - but at a private/premium hospital, welfare
      // schemes (e.g. Ayushman Bharat PM-JAY) only offset up to their own
      // package cap, not the patient's full bill.
      outOfPocket = category === "Government" ? 0 : Math.max(0, outOfPocket - GOVERNMENT_SCHEME_CAP);
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      const partialSubsidy = Math.min(outOfPocket * 0.5, GOVERNMENT_SCHEME_CAP);
      outOfPocket = Math.round(outOfPocket - partialSubsidy);
    }
  }

  const hasUnsureAnswer = [stage, hormoneStatus, surgery, chemo, radiation].includes("Unsure");
  const confidenceScore = !isIntakeFilled ? "None" : hasUnsureAnswer ? "Medium" : "High";
  const confidenceText = !isIntakeFilled ? "Intake pending" : hasUnsureAnswer ? "Diagnostics pending" : "Verified diagnostics";

  const treatmentDesc = isIntakeFilled
    ? [
        surgery !== "No" ? "Surgery" : "",
        chemo !== "No" ? "Chemotherapy" : "",
        radiation !== "No" ? "Radiation" : "",
        hormoneStatus === "HER2 Positive" ? "Targeted Therapy" : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return {
    isIntakeFilled,
    category,
    totalEstimate,
    minCost,
    maxCost,
    insuranceShare,
    outOfPocket,
    treatmentDesc,
    confidenceScore,
    confidenceText,
    breakdown,
  };
}

export function readIntakeProfileFromStorage(): IntakeProfile {
  return {
    state: localStorage.getItem("artham_intake_state") || "",
    age: localStorage.getItem("artham_intake_age") || "",
    stage: localStorage.getItem("artham_intake_stage") || "",
    hormoneStatus: localStorage.getItem("artham_intake_hormone_status") || "",
    surgery: localStorage.getItem("artham_intake_surgery") || "",
    chemo: localStorage.getItem("artham_intake_chemo") || "",
    radiation: localStorage.getItem("artham_intake_radiation") || "",
    hospitalType: localStorage.getItem("artham_intake_hospital_type") || "",
    hasInsurance: localStorage.getItem("artham_intake_has_insurance") === "true",
    incomeBracket: localStorage.getItem("artham_intake_income_bracket") || "",
  };
}
