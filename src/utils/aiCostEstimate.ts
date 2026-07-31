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

import type { CostBreakdownLine, IntakeProfile } from "./costEstimate";

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

/** Returns the cached AI estimate only if it matches the current intake profile exactly. */
export function readCachedAiOverride(intake: IntakeProfile): AiCostOverride | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedAiEstimate;
    if (parsed.fingerprint !== fingerprintIntake(intake)) return null;
    return parsed.override;
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
function sanitizeOverride(raw: unknown): AiCostOverride | null {
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

  const totalEstimate = Math.round(rawTotal);
  const breakdownSum = breakdown.reduce((s, l) => s + l.amount, 0);
  // If the AI's own itemized breakdown disagrees with its total by more than
  // 15%, the response is internally inconsistent - don't trust it.
  if (Math.abs(breakdownSum - totalEstimate) > totalEstimate * 0.15) return null;

  return { totalEstimate, breakdown };
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  kn: "Kannada",
  bn: "Bengali",
};

function buildPrompt(intake: IntakeProfile, language: string): string {
  const langName = LANGUAGE_NAMES[language] || "English";
  return `You are a clinical-finance cost estimator for breast cancer treatment in India. Based on the patient profile below, return a realistic INR cost estimate grounded in real, current Indian hospital pricing. Use biosimilar drug pricing for trastuzumab (Hertraz, Ogivri, Canmab, etc.) where applicable, not originator Herceptin brand pricing - most Indian patients are prescribed biosimilars.

Patient profile:
- State: ${intake.state || "Not specified"}
- Age: ${intake.age || "Not specified"}
- Cancer stage: ${intake.stage || "Not specified"}
- Hormone/HER2 status: ${intake.hormoneStatus || "Not specified"}
- Surgery planned: ${intake.surgery || "Not specified"}
- Chemotherapy planned: ${intake.chemo || "Not specified"}
- Radiation planned: ${intake.radiation || "Not specified"}
- Hospital type: ${intake.hospitalType || "Not specified"}
- Has insurance: ${intake.hasInsurance ? "Yes" : "No"}

Respond with ONLY a valid JSON object (no markdown code fences, no extra text) in this exact shape:
{
  "totalEstimate": <number - total realistic INR cost for the full treatment course>,
  "breakdown": [
    { "label": "<category name in ${langName}>", "amount": <number> }
  ]
}
Only include categories that actually apply given the profile (diagnostics, surgery, chemotherapy, radiation, hormone/targeted therapy, consultations/hospitalization). The breakdown amounts must sum to approximately totalEstimate.`;
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
    const modelName = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(intake, language) }] }],
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
    const override = sanitizeOverride(parsed);
    if (!override) return null;

    saveCachedAiOverride(intake, override);
    return override;
  } catch {
    return null;
  }
}
