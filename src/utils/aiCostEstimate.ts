// AI-personalized treatment cost override: asks Gemini for a realistic total
// + category breakdown grounded in the patient's actual intake profile,
// instead of relying only on the static Government/Private/Premium pricing
// tables in costEstimate.ts. The result is cached in LocalStorage (and, for
// signed-in users, synced to Firestore by firebase.ts's central sync layer)
// keyed to a fingerprint of the intake fields that affect cost - so it's
// reused on every future visit until the user actually changes their intake.
//
// Deliberately narrow scope: the AI only estimates "what does this treatment
// cost", never the insurance/subsidy math (coverage %, income-bracket caps,
// min/max range, confidence). That logic stays in computeCostEstimate() so
// both the AI and fallback paths apply the exact same, already-audited
// business rules on top of whichever total they're given.

import { computeCostEstimate, type CostBreakdownLine, type HospitalCategory, type IntakeProfile } from "./costEstimate";

const CACHE_KEY = "artham_ai_cost_estimate";

export type AiCostOverride = {
  totalEstimate: number;
  breakdown: CostBreakdownLine[];
};

type CachedAiEstimate = {
  fingerprint: string;
  override: AiCostOverride;
  computedAt: string;
};

/** Only the intake fields that actually change treatment cost - matches computeCostEstimate's inputs. */
function fingerprintIntake(intake: IntakeProfile): string {
  return JSON.stringify([
    intake.state,
    intake.age,
    intake.stage,
    intake.hormoneStatus,
    intake.surgery,
    intake.chemo,
    intake.radiation,
    intake.hospitalType,
    intake.hasInsurance,
    intake.incomeBracket,
  ]);
}

/** Returns the cached AI estimate only if it matches the current intake profile exactly and passes reality checks. */
export function readCachedAiOverride(intake: IntakeProfile): AiCostOverride | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedAiEstimate;
    if (parsed.fingerprint !== fingerprintIntake(intake)) return null;

    // Validate cached value against the current clinical model baseline so stale/wild
    // cached estimates from before calibration don't linger in user storage.
    const baseline = computeCostEstimate(intake, undefined);
    const validated = sanitizeOverride(parsed.override, baseline.totalEstimate);
    if (!validated) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return validated;
  } catch {
    return null;
  }
}

export function clearCachedAiOverride() {
  localStorage.removeItem(CACHE_KEY);
}

function saveCachedAiOverride(intake: IntakeProfile, override: AiCostOverride) {
  const entry: CachedAiEstimate = {
    fingerprint: fingerprintIntake(intake),
    override,
    computedAt: new Date().toISOString(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/** Validates and normalizes the AI's raw JSON before it's ever trusted as a cost figure. */
function sanitizeOverride(raw: unknown, baselineTotal?: number): AiCostOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const rawTotal = obj.totalEstimate;
  if (typeof rawTotal !== "number" || !Number.isFinite(rawTotal) || rawTotal <= 0) return null;
  if (!Array.isArray(obj.breakdown)) return null;

  const breakdown: CostBreakdownLine[] = obj.breakdown
    .filter(
      (l): l is { label: string; amount: number } =>
        !!l &&
        typeof l === "object" &&
        typeof (l as Record<string, unknown>).label === "string" &&
        typeof (l as Record<string, unknown>).amount === "number" &&
        Number.isFinite((l as Record<string, unknown>).amount as number) &&
        ((l as Record<string, unknown>).amount as number) >= 0
    )
    .map((l) => ({ label: l.label.slice(0, 60), amount: Math.round(l.amount) }));
  if (!breakdown.length) return null;

  let totalEstimate = Math.round(rawTotal);

  // If a clinical baseline is available (> 0), apply strict sanity and reality guardrails:
  if (baselineTotal && baselineTotal > 0) {
    const minAllowed = baselineTotal * 0.55;
    const maxAllowed = baselineTotal * 1.60;

    // Discard completely hallucinated / unrealistic responses (e.g. Western pricing or single-session costs)
    // so computeCostEstimate safely falls back to the audited clinical baseline.
    if (totalEstimate < minAllowed || totalEstimate > maxAllowed) {
      console.warn(
        `[aiCostEstimate] Discarding AI estimate ₹${totalEstimate} outside reality threshold [₹${Math.round(minAllowed)} - ₹${Math.round(maxAllowed)}] for baseline ₹${baselineTotal}`
      );
      return null;
    }

    // Clamp moderately to prevent runaway overshoot while keeping AI personalizations intact
    const lowerClamp = Math.round(baselineTotal * 0.80);
    const upperClamp = Math.round(baselineTotal * 1.25);
    totalEstimate = Math.max(lowerClamp, Math.min(upperClamp, totalEstimate));
  }

  // Ensure breakdown line items sum up precisely to totalEstimate
  const currentSum = breakdown.reduce((s, l) => s + l.amount, 0);
  if (currentSum > 0 && currentSum !== totalEstimate) {
    let runningAllocated = 0;
    for (let i = 0; i < breakdown.length; i++) {
      if (i === breakdown.length - 1) {
        breakdown[i].amount = Math.max(0, totalEstimate - runningAllocated);
      } else {
        const itemAmount = Math.round((breakdown[i].amount / currentSum) * totalEstimate);
        breakdown[i].amount = itemAmount;
        runningAllocated += itemAmount;
      }
    }
  }

  return { totalEstimate, breakdown };
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  kn: "Kannada",
  bn: "Bengali",
};

function buildPrompt(intake: IntakeProfile, language: string, baselineTotal: number, category: HospitalCategory): string {
  const langName = LANGUAGE_NAMES[language] || "English";
  const minTarget = Math.round(baselineTotal * 0.88);
  const maxTarget = Math.round(baselineTotal * 1.12);

  return `You are an expert clinical-oncology cost estimator for breast cancer care across Indian hospitals.
Your task is to provide a realistic, consistent, and clinically accurate INR cost estimate for the COMPLETE treatment course in India.

PATIENT CLINICAL PROFILE:
- State / Region: ${intake.state || "National average"}
- Age: ${intake.age || "Not specified"}
- Cancer stage: ${intake.stage || "Not specified"}
- Hormone/HER2 status: ${intake.hormoneStatus || "Not specified"}
- Surgery planned: ${intake.surgery || "Not specified"}
- Chemotherapy planned: ${intake.chemo || "Not specified"}
- Radiation planned: ${intake.radiation || "Not specified"}
- Hospital type: ${intake.hospitalType || "Private Medical Center"} (${category} Tier)

CALIBRATED CLINICAL REFERENCE BENCHMARK:
- Audited Clinical Reference Baseline: ~₹${baselineTotal.toLocaleString("en-IN")}
  (This benchmark is derived from Indian oncological records for this exact stage, state, and hospital tier).
- Realistic Target Range for this profile: ₹${minTarget.toLocaleString("en-IN")} to ₹${maxTarget.toLocaleString("en-IN")}.

MANDATORY INDIAN PRICING RULES:
1. Consistency & Realism: Your estimate MUST reflect true hospital charges in India. Stay within close proximity (±10% to ±12%) of the reference benchmark (~₹${baselineTotal.toLocaleString("en-IN")}). Do NOT output Western/US cancer pricing (e.g. ₹30L–₹80L) and do NOT output single-cycle pricing (<₹50k).
2. Hospital Tier Realities:
   - Government/Public: ₹60,000 – ₹3,50,000 full course.
   - Private Medical Center: ₹3,50,000 – ₹10,50,000 full course (up to ₹14,00,000 for complex Stage III/IV dual-targeted).
   - Premium Corporate: ₹7,50,000 – ₹18,00,000 full course.
3. Targeted & Biosimilar Drugs: For HER2 positive, pricing must reflect Indian biosimilar Trastuzumab (Hertraz, Canmab, Vivitra at ~₹18,000–₹22,000 per vial, ~₹3.5L–₹4.5L total 17-cycle course), NEVER originator Herceptin brand rates.
4. Total Course: Must include the entire treatment duration (diagnostics, complete surgery, all chemotherapy cycles, radiation sessions, and initial/follow-up consultations).

Respond with ONLY a valid JSON object in this exact structure:
{
  "totalEstimate": <number - total realistic INR cost for full treatment course>,
  "breakdown": [
    { "label": "<category name in ${langName}>", "amount": <number> }
  ]
}
Include only applicable categories: Diagnostics & imaging, Surgery, Chemotherapy, Radiation, Hormone therapy, Targeted therapy, Immunotherapy, Consultations & hospitalization.
The item amounts in breakdown MUST sum up to exactly totalEstimate.`;
}

/**
 * Ask Gemini for a personalized cost estimate for this intake profile.
 * Returns null (never throws) on any failure so callers can silently fall
 * back to the deterministic calculator - this is a best-effort enhancement,
 * not a hard dependency.
 */
export async function queryAiTreatmentCost(
  intake: IntakeProfile,
  language: string,
  apiKey: string
): Promise<AiCostOverride | null> {
  try {
    const baseline = computeCostEstimate(intake, undefined);
    const baselineTotal = baseline.totalEstimate;
    const category = baseline.category;

    const modelName = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(intake, language, baselineTotal, category) }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") return null;

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleaned);
    const override = sanitizeOverride(parsed, baselineTotal);
    if (!override) return null;

    saveCachedAiOverride(intake, override);
    return override;
  } catch {
    return null;
  }
}
