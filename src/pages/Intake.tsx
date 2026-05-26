import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

const stepLabels = ["Demographics", "Hospital", "Insurance", "Income"];

export default function Intake() {
  const [step, setStep] = useState(1);
  const nav = useNavigate();

  const goNext = () => {
    if (step < 4) setStep(step + 1);
    else nav("/medical-input");
  };
  const goPrev = () => setStep(Math.max(1, step - 1));

  return (
    <AppShell>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-md pb-xl">
        {/* Stepper */}
        <div className="w-full max-w-3xl mx-auto mb-lg pt-sm">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -z-10 -translate-y-1/2" />
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
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${
                      done
                        ? "bg-secondary text-on-secondary"
                        : active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-outline"
                    }`}
                  >
                    {done ? <span className="material-symbols-outlined">check</span> : n}
                  </div>
                  <span
                    className={`font-label-sm text-label-sm mt-2 ${
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

        {/* Form Card */}
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <Section
              title="Tell us about yourself"
              subtitle="Basic information helps us narrow down local rates and age-specific coverage."
              icon="person"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Field label="Age" hint="Age impacts Medicare/Medicaid eligibility.">
                  <input
                    className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    placeholder="e.g. 45"
                    type="number"
                  />
                </Field>
                <Field label="Location (Zip Code)">
                  <input
                    className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    placeholder="560001"
                    type="text"
                  />
                </Field>
              </div>
              <FooterBar onNext={goNext} nextLabel="Save & Continue" />
            </Section>
          )}

          {step === 2 && (
            <Section
              title="Hospital Preferences"
              subtitle="Different hospital types have vastly different billing structures."
              icon="domain"
            >
              <label className="font-label-md text-label-md text-on-surface block mb-2">
                What type of hospital are you considering?
              </label>
              <div className="space-y-sm">
                {[
                  ["Government / Public Hospital", "Often lower cost, but might have longer wait times."],
                  ["Private Medical Center", "Typically higher costs, often more amenities."],
                  ["I'm Unsure", "We'll show you averages for both."],
                ].map(([t, d]) => (
                  <label
                    key={t}
                    className="flex items-center gap-md p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    <input className="w-5 h-5 text-primary border-outline focus:ring-primary" name="hospital_type" type="radio" />
                    <div>
                      <span className="font-body-md text-body-md font-bold block">{t}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{d}</span>
                    </div>
                  </label>
                ))}
              </div>
              <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Save & Continue" />
            </Section>
          )}

          {step === 3 && (
            <Section
              title="Insurance Coverage"
              subtitle="Your coverage determines your final out-of-pocket estimates."
              icon="shield"
            >
              <div className="space-y-lg">
                <div className="flex items-center justify-between p-md bg-surface-container rounded-lg">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface block">
                      Do you currently have insurance?
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Includes Medicare, Medicaid, or Private plans.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-14 h-7 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                  </label>
                </div>
                <Field label="Insurance Provider & Plan Name">
                  <input
                    className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    placeholder="e.g. Star Health Family Floater"
                    type="text"
                  />
                </Field>
              </div>
              <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Save & Continue" />
            </Section>
          )}

          {step === 4 && (
            <Section
              title="Financial Assistance"
              subtitle="You may be eligible for charity care or government subsidies."
              icon="payments"
            >
              <div className="space-y-md">
                <Field label="Approximate Household Annual Income">
                  <select className="w-full px-md py-sm border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md bg-white">
                    <option value="">Select an income bracket</option>
                    <option>Below ₹2,50,000</option>
                    <option>₹2,50,000 – ₹5,00,000</option>
                    <option>₹5,00,000 – ₹10,00,000</option>
                    <option>Above ₹10,00,000</option>
                  </select>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Your data is encrypted and only used for subsidy calculation.
                  </p>
                </Field>
                <div className="bg-surface-container-high p-md rounded-lg flex gap-md items-start border border-primary/10">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Based on your state, families earning under ₹3L may qualify for 100% financial
                    assistance at nonprofit hospitals.
                  </p>
                </div>
              </div>
              <FooterBar onPrev={goPrev} onNext={goNext} nextLabel="Complete Intake" />
            </Section>
          )}
        </div>

        {/* Reliability Gauge */}
        <div className="max-w-2xl mx-auto mt-lg p-lg bg-white rounded-xl border border-outline-variant flex flex-col items-center text-center">
          <h4 className="font-headline-sm text-headline-sm text-on-surface-variant mb-md">
            Estimate Reliability
          </h4>
          <div className="relative w-48 h-24 mb-sm overflow-hidden">
            <div className="absolute inset-0 rounded-t-full border-[12px] border-surface-container-high" />
            <div
              className="absolute inset-0 rounded-t-full border-[12px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent origin-bottom transition-transform duration-700"
              style={{ transform: `rotate(${45 + step * 30}deg)` }}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full" />
          </div>
          <p className="font-label-md text-label-md text-primary">High Reliability Score</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            Based on verified provider rates and your specific insurance policy data. Accuracy: ~92%.
          </p>
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
