import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

type Choice = {
  title: string;
  caption: string;
  cta: string;
  icon: string;
  bg: string;
  fg: string;
  bgHover: string;
  fgHover: string;
  to: string;
};

const choices: Choice[] = [
  {
    title: "Voice Input",
    caption: "Speak naturally to provide details",
    cta: "Start speaking",
    icon: "mic",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    bgHover: "group-hover:bg-primary",
    fgHover: "group-hover:text-on-primary",
    to: "/medical-input",
  },
  {
    title: "Text Input",
    caption: "Answer guided questions",
    cta: "Begin questionnaire",
    icon: "edit_note",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    bgHover: "group-hover:bg-secondary",
    fgHover: "group-hover:text-on-secondary",
    to: "/intake",
  },
  {
    title: "Document Upload",
    caption: "Upload prescriptions, bills, or insurance papers",
    cta: "Select files",
    icon: "upload_file",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    bgHover: "group-hover:bg-tertiary",
    fgHover: "group-hover:text-on-tertiary",
    to: "/medical-input",
  },
];

export default function Onboarding() {
  const nav = useNavigate();
  return (
    <AppShell bare>
      <div className="pt-lg pb-xl max-w-container-max mx-auto px-margin-mobile md:px-md">
        <section className="text-center mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">
            Welcome to Financial Treatment Navigator
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[720px] mx-auto">
            We help you navigate the financial journey of your medical treatment with clarity and
            empathy. Choose how you'd like to share your information to get started.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
          {choices.map((c) => (
            <button
              key={c.title}
              onClick={() => nav(c.to)}
              className="group relative flex flex-col items-center text-center p-lg bg-surface-container-lowest rounded-xl tonal-card-shadow border border-transparent hover:border-primary transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                className={`w-16 h-16 rounded-full ${c.bg} flex items-center justify-center mb-md ${c.bgHover} transition-colors duration-300`}
              >
                <span
                  className={`material-symbols-outlined text-[32px] ${c.fg} ${c.fgHover}`}
                >
                  {c.icon}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                {c.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                "{c.caption}"
              </p>
              <div
                className={`mt-md flex items-center ${c.fg} font-label-md text-label-md opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                {c.cta}
                <span className="material-symbols-outlined ml-xs">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>

        <section className="bg-surface-container rounded-xl p-lg md:p-xl mb-lg">
          <div className="flex flex-col md:flex-row items-center gap-lg">
            <div className="w-full md:w-1/2">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">How it works</h2>
              <div className="space-y-md">
                {[
                  {
                    n: 1,
                    title: "Data Collection",
                    body: "Securely share your treatment plan and insurance details.",
                  },
                  {
                    n: 2,
                    title: "Analysis & Projection",
                    body: "Our engine calculates out-of-pocket costs and identifies financial aid.",
                  },
                  {
                    n: 3,
                    title: "Clarity & Confidence",
                    body: "Receive a personalized roadmap for managing your treatment costs.",
                  },
                ].map((s) => (
                  <div key={s.n} className="flex gap-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                      {s.n}
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface">{s.title}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-md aspect-[16/10] bg-gradient-to-br from-primary-container to-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[120px] text-on-primary opacity-60">
                analytics
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
