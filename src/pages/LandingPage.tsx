import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

type Feature = {
  icon: string;
  title: string;
  body: string;
  tone: "primary" | "secondary" | "tertiary";
  to: string;
};

const features: Feature[] = [
  {
    icon: "mic",
    title: "Voice & Conversational Intake",
    body: "Describe your diagnosis in your own words. Our clinical AI extracts conditions, procedures, and treatment plans in real time.",
    tone: "primary",
    to: "/medical-input",
  },
  {
    icon: "edit_note",
    title: "Smart Guided Questionnaire",
    body: "A short 4-step intake captures demographics, hospital type, insurance, and income — only what's needed to model your costs.",
    tone: "secondary",
    to: "/intake",
  },
  {
    icon: "upload_file",
    title: "Evidence Vault",
    body: "Upload prescriptions, scans and bills. Documents are encrypted and parsed to verify estimates against real billing records.",
    tone: "tertiary",
    to: "/medical-input",
  },
  {
    icon: "monitoring",
    title: "Financial Dashboard",
    body: "See your treatment cost range, confidence score, scenario comparison, and insurance vs. out-of-pocket split at a glance.",
    tone: "primary",
    to: "/dashboard",
  },
  {
    icon: "receipt_long",
    title: "Itemized Cost Breakdown",
    body: "Every line — diagnostics, surgery, chemo, hospitalization, medication — with estimate, insurance share, and OOP.",
    tone: "secondary",
    to: "/cost-breakdown",
  },
  {
    icon: "lightbulb",
    title: "Step-by-Step Action Plan",
    body: "A day-by-day plan, document readiness tracker, key contacts and a pro-tip card so nothing falls through the cracks.",
    tone: "tertiary",
    to: "/action-plan",
  },
  {
    icon: "volunteer_activism",
    title: "Personalized Support Plan",
    body: "Eligible government schemes, NGO grants, and trust programs matched to your profile with progress tracking.",
    tone: "primary",
    to: "/support-plan",
  },
  {
    icon: "library_books",
    title: "Schemes & Insurance Catalogue",
    body: "Search every public scheme, private trust, and insurance program in India with verified reliability scores.",
    tone: "secondary",
    to: "/schemes",
  },
];

const stats = [
  { value: "₹2.4 L", label: "Average savings identified per patient" },
  { value: "92%", label: "Estimate accuracy vs. final hospital bill" },
  { value: "27,000+", label: "Empanelled hospitals tracked" },
  { value: "150+", label: "Schemes & programs catalogued" },
];

const journey = [
  {
    n: 1,
    title: "Share your context",
    body: "Speak, type, or upload. We work with whatever you have — a discharge summary, a prescription, or just a conversation.",
    icon: "record_voice_over",
  },
  {
    n: 2,
    title: "We model the journey",
    body: "Our engine combines verified provider rates, your insurance policy, and regional billing data to project realistic costs.",
    icon: "insights",
  },
  {
    n: 3,
    title: "Get a clear roadmap",
    body: "Receive a cost breakdown, action plan, and matched financial-aid schemes — everything in one personalized workspace.",
    icon: "map",
  },
];

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <AppShell bare>
      <div className="relative">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] bg-primary-fixed-dim rounded-full blur-[120px] opacity-30" />
            <div className="absolute top-[100px] left-[-200px] w-[500px] h-[500px] bg-secondary-fixed rounded-full blur-[120px] opacity-30" />
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md pt-lg md:pt-xl pb-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high text-primary rounded-full font-label-sm text-label-sm mb-md">
                  <span className="material-symbols-outlined text-[16px] fill-icon">verified</span>
                  Built with Empathetic Clarity — for patients & caregivers
                </div>
                <h1 className="font-headline-lg text-headline-lg md:text-[56px] md:leading-[1.05] md:tracking-[-0.02em] text-primary mb-md">
                  From hospital bills to a
                  <span className="text-secondary"> clear plan</span> — without the anxiety.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[640px] mb-lg">
                  Financial Treatment Navigator turns complex medical billing into one
                  trustworthy view: realistic cost estimates, insurance coverage, government
                  schemes you qualify for, and a step-by-step action plan personalized to your
                  treatment.
                </p>
                <div className="flex flex-col sm:flex-row gap-sm">
                  <button
                    onClick={() => nav("/intake")}
                    className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-sm"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Start Your Plan — It's Free
                  </button>
                  <button
                    onClick={() => nav("/medical-input")}
                    className="border-2 border-primary text-primary px-lg py-md rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all flex items-center justify-center gap-sm"
                  >
                    <span className="material-symbols-outlined">mic</span>
                    Try Voice Intake
                  </button>
                </div>
                <div className="mt-lg flex flex-wrap items-center gap-md text-on-surface-variant">
                  {[
                    ["lock", "End-to-end encrypted"],
                    ["schedule", "Plan ready in 5 min"],
                    ["payments", "No card required"],
                  ].map(([i, t]) => (
                    <div key={t} className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">{i}</span>
                      <span className="font-label-md text-label-md">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Visual: stylized dashboard preview */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="bg-primary text-on-primary p-md md:p-lg rounded-xl shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-md">
                      <span className="font-label-sm text-on-primary-container bg-primary-container px-sm py-xs rounded-full">
                        Estimated Total
                      </span>
                      <span className="flex items-center gap-xs font-label-sm">
                        <span className="material-symbols-outlined fill-icon text-secondary-fixed text-[18px]">
                          verified
                        </span>
                        92% confidence
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg mb-xs">₹2,50,000 – ₹4,00,000</h3>
                    <p className="font-body-sm opacity-80 mb-md">
                      Laparoscopic Myomectomy • 3-day stay • Bengaluru
                    </p>
                    <div className="space-y-sm mb-md">
                      <div className="flex justify-between text-sm">
                        <span>Insurance covers</span>
                        <span className="font-bold">₹1,80,000</span>
                      </div>
                      <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden flex">
                        <div className="bg-secondary-fixed" style={{ width: "60%" }} />
                        <div className="bg-tertiary-fixed" style={{ width: "40%" }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Your out-of-pocket</span>
                        <span className="font-bold">₹1,30,000</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-sm rounded-lg flex items-center gap-sm">
                      <span className="material-symbols-outlined fill-icon text-tertiary-fixed-dim">
                        lightbulb
                      </span>
                      <p className="text-sm">
                        You may qualify for{" "}
                        <strong>Ayushman Bharat (PM-JAY)</strong> — up to ₹5L coverage.
                      </p>
                    </div>
                  </div>
                  {/* Float chip */}
                  <div className="absolute -top-4 -right-4 md:-right-6 bg-white tonal-card-shadow rounded-xl p-sm flex items-center gap-sm border border-outline-variant">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined fill-icon">savings</span>
                    </div>
                    <div>
                      <p className="font-label-sm text-on-surface-variant">Identified savings</p>
                      <p className="font-bold text-secondary">₹2,400</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-white tonal-card-shadow rounded-xl p-sm flex items-center gap-sm border border-outline-variant">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                      <span className="material-symbols-outlined fill-icon">task_alt</span>
                    </div>
                    <div>
                      <p className="font-label-sm text-on-surface-variant">Action plan</p>
                      <p className="font-bold text-primary">5 steps ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="bg-surface-container">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md py-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              {stats.map((s) => (
                <div key={s.label} className="text-center md:text-left">
                  <p className="font-headline-lg text-headline-lg text-primary">{s.value}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
          <div className="text-center mb-lg max-w-2xl mx-auto">
            <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">How it works</p>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">
              Three calm steps from confusion to clarity
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              No spreadsheets. No insurance jargon. Just a guided experience that respects your
              time and your situation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative">
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary via-secondary to-tertiary opacity-30 -z-10" />
            {journey.map((j) => (
              <div
                key={j.n}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg tonal-card-shadow text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary text-on-primary mx-auto flex items-center justify-center mb-md shadow-md">
                  <span className="material-symbols-outlined text-[36px]">{j.icon}</span>
                </div>
                <div className="font-label-sm text-secondary mb-xs">STEP {j.n}</div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{j.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{j.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE GRID (Bento) */}
        <section className="bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md mb-lg">
              <div className="max-w-2xl">
                <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">
                  Everything in one place
                </p>
                <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">
                  A complete financial workspace for your treatment journey
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Each module is designed to lower stress and surface what matters — verified
                  rates, your coverage, available aid, and the next concrete action.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="flex-shrink-0 text-primary font-label-md text-label-md flex items-center gap-xs hover:underline"
              >
                Preview the dashboard
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
            <div>
              <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">
                Why Treatment Navigator
              </p>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-md">
                Built around the people, not the paperwork
              </h2>
              <div className="space-y-md">
                {[
                  {
                    i: "psychology",
                    t: "Designed for stress, not productivity",
                    b: "Generous whitespace, calm typography, and a Quiet UI philosophy — we move you from anxiety to informed confidence.",
                  },
                  {
                    i: "fact_check",
                    t: "Verified against real billing records",
                    b: "Estimates are benchmarked against 4,200+ local billing records and refreshed against provider rate cards monthly.",
                  },
                  {
                    i: "shield_lock",
                    t: "Your data stays yours",
                    b: "Everything is encrypted in transit and at rest. We use your information only to compute your plan — never for ads or resale.",
                  },
                  {
                    i: "diversity_3",
                    t: "Multilingual & accessible",
                    b: "English, Hindi, Marathi, Kannada, and Bengali — with voice input for users uncomfortable with forms.",
                  },
                ].map((row) => (
                  <div key={row.t} className="flex gap-md">
                    <div className="w-12 h-12 rounded-xl bg-secondary-container text-secondary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined">{row.i}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{row.t}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">{row.b}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Testimonial-like card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-lg text-on-primary shadow-2xl">
                <span className="material-symbols-outlined text-[48px] opacity-30 mb-sm">format_quote</span>
                <p className="font-body-lg text-body-lg mb-md leading-relaxed">
                  "We had been quoted three wildly different prices for the same surgery. Treatment
                  Navigator showed us exactly which scheme covered my mother and saved us close to
                  ₹70,000 — and the action plan told us exactly which office to visit on which day."
                </p>
                <div className="flex items-center gap-md pt-md border-t border-on-primary/20">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold">
                    PD
                  </div>
                  <div>
                    <p className="font-label-md">Priya D.</p>
                    <p className="font-label-sm opacity-70">Caregiver • Pune</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-sm rounded-xl tonal-card-shadow border border-outline-variant flex items-center gap-sm">
                <span className="material-symbols-outlined fill-icon text-tertiary-container">
                  star
                </span>
                <div>
                  <p className="font-bold text-primary text-sm">4.9 / 5</p>
                  <p className="text-[10px] text-on-surface-variant">from 1,200+ users</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md pb-xl">
          <div className="bg-surface-container-highest rounded-xl p-lg md:p-xl text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-secondary/15 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">
                Ready to see your treatment costs clearly?
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
                Get a personalized cost estimate, an action plan, and matched financial-aid options
                in under five minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-sm justify-center">
                <button
                  onClick={() => nav("/intake")}
                  className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-sm"
                >
                  Start with the questionnaire
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button
                  onClick={() => nav("/schemes")}
                  className="bg-white border border-outline-variant text-primary px-lg py-md rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all flex items-center justify-center gap-sm"
                >
                  Browse schemes first
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function FeatureCard({ icon, title, body, tone, to }: Feature) {
  const tones = {
    primary: { iconBg: "bg-primary-fixed", iconText: "text-primary" },
    secondary: { iconBg: "bg-secondary-fixed", iconText: "text-secondary" },
    tertiary: { iconBg: "bg-tertiary-fixed", iconText: "text-tertiary" },
  }[tone];
  return (
    <Link
      to={to}
      className="group bg-surface-container-lowest rounded-xl p-md border border-outline-variant tonal-card-shadow hover:border-primary hover:-translate-y-1 transition-all flex flex-col"
    >
      <div
        className={`w-12 h-12 rounded-xl ${tones.iconBg} ${tones.iconText} flex items-center justify-center mb-md group-hover:scale-110 transition-transform`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{body}</p>
      <div className="mt-md flex items-center text-primary font-label-md text-label-md gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Open
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </Link>
  );
}
