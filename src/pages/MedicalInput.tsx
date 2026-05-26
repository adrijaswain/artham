import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

type Msg = { role: "bot" | "user"; text: string; meta?: string };

const initialMessages: Msg[] = [
  {
    role: "bot",
    text: "Hello. I'm here to help map out your medical journey. Please describe your diagnosis or the procedure you are planning.",
  },
  {
    role: "user",
    text: "I was diagnosed with severe osteoarthritis in my left knee and my surgeon recommended a Total Knee Replacement (TKR).",
  },
  {
    role: "bot",
    text: "Understood. I've noted the Osteoarthritis diagnosis and planned Knee Replacement. Do you have any secondary conditions or specific hospital preferences?",
    meta: "Extracted: Surgery — Knee Replacement",
  },
];

export default function MedicalInput() {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "Thanks. I've added this to your clinical context. We'll factor it into your cost estimate.",
        },
      ]);
    }, 600);
  };

  return (
    <AppShell>
      {/* Progress Stepper */}
      <div className="w-full px-lg py-md flex items-center justify-center bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-md max-w-2xl w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined fill-icon text-secondary">check_circle</span>
            <span className="font-label-md text-on-surface-variant">Profile</span>
          </div>
          <div className="flex-1 h-[2px] bg-secondary" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">2</span>
            <span className="font-label-md text-primary">Medical Details</span>
          </div>
          <div className="flex-1 h-[2px] bg-outline-variant" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm">3</span>
            <span className="font-label-md text-on-surface-variant">Review</span>
          </div>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex flex-col md:flex-row gap-gutter p-md lg:p-lg">
        {/* Left: Chat */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant overflow-hidden min-h-[520px]">
          <div className="p-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-primary">Clinical Context</h3>
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-xs rounded-full font-bold">
              LIVE ANALYSIS
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-md space-y-md custom-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-sm max-w-[85%] ${
                  m.role === "user" ? "self-end flex-row-reverse ml-auto" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-primary-container text-on-primary-container"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {m.role === "user" ? "person" : "neurology"}
                  </span>
                </div>
                <div
                  className={`p-md shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-on-primary rounded-l-xl rounded-br-xl"
                      : `bg-surface-container rounded-r-xl rounded-bl-xl ${
                          m.meta ? "border-l-4 border-secondary" : ""
                        }`
                  }`}
                >
                  <p className="font-body-md">{m.text}</p>
                  {m.meta && (
                    <div className="mt-sm pt-sm border-t border-outline-variant flex items-center gap-xs text-secondary font-bold text-xs">
                      <span className="material-symbols-outlined text-sm active-entity-pulse">auto_awesome</span>
                      {m.meta}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-md bg-surface-container-low border-t border-outline-variant">
            <div className="relative flex items-end gap-sm">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-md pr-14 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none font-body-md min-h-[60px]"
                placeholder="Describe your diagnosis or treatment..."
                rows={2}
              />
              <button
                onClick={send}
                className="absolute bottom-2 right-2 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Vault + Pathway */}
        <div className="flex-1 flex flex-col gap-gutter">
          <section className="bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-primary">Evidence Vault</h3>
              <button className="text-secondary font-label-md flex items-center gap-xs hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Add New
              </button>
            </div>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center gap-sm bg-surface-bright hover:bg-surface-container transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="font-label-md text-on-surface">
                  Upload or drag reports, prescriptions, and bills
                </p>
                <p className="text-[12px] text-outline mt-xs">PDF, JPG, PNG up to 20MB</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-sm bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">description</span>
                <div>
                  <p className="font-label-md text-on-surface">MRI_Knee_Scan.pdf</p>
                  <p className="text-[10px] text-outline">Verified • 1.2 MB</p>
                </div>
              </div>
              <span className="material-symbols-outlined fill-icon text-secondary">check_circle</span>
            </div>
          </section>

          <section className="flex-1 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-md flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md">
              Treatment Pathway Preview
            </h3>
            <div className="relative pl-8 py-2 flex-1">
              <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-outline-variant" />
              <PathwayStep
                color="secondary"
                title="Pre-operative Consultation"
                tag="Complete"
                body="Confirmed with Dr. Aris Thorne • City General Hospital"
              />
              <PathwayStep
                color="primary"
                title="Inpatient Hospitalization (TKR)"
                tag="Estimated Oct 14"
                body="3-Day stay projected. Includes anesthesia & hardware."
                active
              />
              <PathwayStep
                color="outline-variant"
                title="Post-operative Physical Therapy"
                tag="Weeks 2-12"
                body="Projected 12 sessions. Coverage pending verification."
                dim
              />
            </div>

            <div className="mt-md pt-md border-t border-outline-variant">
              <div className="flex items-center gap-md p-md bg-primary-container/10 rounded-xl mb-md">
                <div className="relative flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle className="text-outline-variant" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6" />
                    <circle className="text-secondary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="176" strokeDashoffset="44" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-primary text-sm">75%</div>
                </div>
                <div>
                  <p className="font-label-md text-primary">Data Confidence Score</p>
                  <p className="text-xs text-on-surface-variant">
                    Verified surgeon rates + regional averages. Upload a quote to increase accuracy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => nav("/dashboard")}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-sm text-headline-sm hover:brightness-110 transition-all flex justify-center items-center gap-md shadow-lg"
              >
                Analyze & Generate Estimate
                <span className="material-symbols-outlined">analytics</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function PathwayStep({
  color,
  title,
  tag,
  body,
  active,
  dim,
}: {
  color: "secondary" | "primary" | "outline-variant";
  title: string;
  tag: string;
  body: string;
  active?: boolean;
  dim?: boolean;
}) {
  const dotColor = {
    secondary: "bg-secondary",
    primary: "bg-primary",
    "outline-variant": "bg-outline-variant",
  }[color];
  const borderColor = {
    secondary: "border-secondary",
    primary: "border-primary",
    "outline-variant": "border-outline-variant",
  }[color];
  const bg = {
    secondary: "bg-surface-container-low",
    primary: "bg-surface-container-high",
    "outline-variant": "bg-surface-bright",
  }[color];
  const titleColor = color === "outline-variant" ? "text-outline" : "text-primary";
  const tagColor = color === "outline-variant" ? "text-outline" : `text-${color}`;

  return (
    <div className={`relative mb-8 ${dim ? "opacity-60" : ""}`}>
      <div
        className={`absolute -left-[26px] top-1 w-4 h-4 rounded-full ${dotColor} border-4 border-surface shadow-sm ${
          active ? "active-entity-pulse" : ""
        }`}
      />
      <div className={`${bg} p-sm rounded-lg border-l-4 ${borderColor}`}>
        <div className="flex justify-between items-start mb-1">
          <h4 className={`font-label-md ${titleColor}`}>{title}</h4>
          <span className={`text-[10px] font-bold ${tagColor} uppercase`}>{tag}</span>
        </div>
        <p className="text-xs text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}
