import { useCallback, useEffect, useState } from "react";
import { clearNeedsTour } from "../context/AuthContext";

type Step = {
  tourId: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    tourId: "intake",
    title: "Start with Intake",
    body: "Answer a few quick questions about your diagnosis, treatment plan, and finances so everything below can be personalized to you.",
  },
  {
    tourId: "medical-input",
    title: "Add your medical info",
    body: "Upload prescriptions and bills, or just describe them by voice — we'll pull out the details automatically.",
  },
  {
    tourId: "dashboard",
    title: "Your Financial Dashboard",
    body: "See your treatment cost estimate, insurance coverage, and matched government schemes, all in one view.",
  },
  {
    tourId: "cost-breakdown",
    title: "Cost Breakdown",
    body: "A line-by-line view of every diagnostic, treatment, and hospitalization charge, split into what insurance covers and what you'll pay.",
  },
  {
    tourId: "action-plan",
    title: "Action Plan",
    body: "A day-by-day checklist of what to do next, plus the documents and hospital contacts you'll need to keep things moving.",
  },
  {
    tourId: "schemes",
    title: "Government Schemes",
    body: "Browse government and state welfare schemes you may qualify for, with eligibility details and how to apply.",
  },
  {
    tourId: "insurances",
    title: "General Insurances",
    body: "Compare private insurance plans and coverage options so you can decide what fits your treatment and budget.",
  },
];

export default function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${STEPS[step].tourId}"]`) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const finish = () => {
    clearNeedsTour();
    onFinish();
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const tooltipTop = rect ? Math.min(Math.max(16, rect.top - 8), window.innerHeight - 220) : undefined;

  return (
    <div className="fixed inset-0 z-[200]">
      {rect ? (
        <div
          className="absolute rounded-2xl border-2 border-primary transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(20, 10, 30, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div
        className="absolute bg-surface rounded-2xl shadow-2xl border border-outline-variant p-md w-[300px] animate-fade-in"
        style={
          rect
            ? { top: tooltipTop, left: rect.right + 16 }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <div className="flex items-center justify-between mb-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            Step {step + 1} of {STEPS.length}
          </span>
          <button
            onClick={finish}
            className="text-outline hover:text-on-surface text-xs font-semibold transition-colors"
          >
            Skip
          </button>
        </div>
        <h3 className="font-headline-sm text-sm font-bold text-primary mb-1">{current.title}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-md">{current.body}</p>
        <div className="flex items-center justify-between gap-sm">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.tourId}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-outline-variant"}`}
              />
            ))}
          </div>
          <button
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
          >
            {isLast ? "Finish" : "Next"}
            <span className="material-symbols-outlined text-[14px]">{isLast ? "check" : "arrow_forward"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
