import { useState } from "react";
import AppShell from "../components/AppShell";

type Doc = { name: string; sub: string; status: "ready" | "warning" | "pending" };
const docsInitial: Doc[] = [
  { name: "Aadhar Card", sub: "Identity Proof (Verified)", status: "ready" },
  { name: "Medical Reports", sub: "Last 3 months (Ready)", status: "ready" },
  { name: "Income Certificate", sub: "Issued by Tehsildar", status: "warning" },
  { name: "Ration Card", sub: "BPL/Priority Category", status: "pending" },
];

export default function ActionPlan() {
  const [docs, setDocs] = useState(docsInitial);
  const ready = docs.filter((d) => d.status === "ready").length;

  const toggle = (i: number) => {
    setDocs((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, status: d.status === "ready" ? "pending" : "ready" } : d,
      ),
    );
  };

  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pt-md pb-xl max-w-container-max mx-auto">
        <header className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">
            Personalized Action Plan
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            We've broken down your next steps into manageable daily tasks to reduce your stress.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          <div className="lg:col-span-8 space-y-md">
            {/* Timeline */}
            <section className="tonal-card-shadow bg-surface-container-lowest rounded-xl p-md border border-outline-variant">
              <div className="flex justify-between items-center mb-md">
                <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">event_available</span>
                  Timeline of Actions
                </h2>
                <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full font-label-sm">
                  Active Phase
                </span>
              </div>
              <div className="space-y-lg relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-surface-container-highest rounded-full" />
                <TimelineStep n={1} title="Day 1: Collect Medical Reports" body="Gather all recent blood work, biopsy reports, and MRI scans from the hospital records office." />
                <TimelineStep
                  n={2}
                  title="Day 2: Visit Nodal Office"
                  body="Meet the Government Health Liaison at the District Nodal Office for scheme verification."
                  hint="Bring 2 passport photos and original Aadhar."
                />
                <TimelineStep
                  n={5}
                  title="Day 5: Submit Final Application"
                  body="Upload all verified documents to the Treatment Portal or submit at Counter 12."
                  disabled
                />
              </div>
            </section>

            {/* Documents */}
            <section className="tonal-card-shadow bg-surface-container-lowest rounded-xl p-md border border-outline-variant">
              <div className="flex justify-between items-center mb-md">
                <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">fact_check</span>
                  Document Readiness
                </h2>
                <div className="flex items-center gap-xs">
                  <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${(ready / docs.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-label-sm text-secondary">
                    {ready}/{docs.length} Done
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {docs.map((d, i) => (
                  <label
                    key={d.name}
                    className={`flex items-center gap-md p-md border rounded-xl cursor-pointer transition-colors ${
                      d.status === "warning"
                        ? "border-2 border-secondary bg-secondary-container/10"
                        : "border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={d.status === "ready"}
                      onChange={() => toggle(i)}
                      className="w-6 h-6 rounded text-secondary focus:ring-secondary"
                    />
                    <div className="flex-1">
                      <span className="block font-label-md text-label-md text-on-surface">{d.name}</span>
                      <span className="text-body-sm text-on-surface-variant">{d.sub}</span>
                    </div>
                    <span
                      className={`material-symbols-outlined ${
                        d.status === "ready"
                          ? "fill-icon text-secondary"
                          : d.status === "warning"
                          ? "text-primary-container"
                          : "text-outline-variant"
                      }`}
                    >
                      {d.status === "ready" ? "check_circle" : d.status === "warning" ? "warning" : "pending"}
                    </span>
                  </label>
                ))}
              </div>
              <button className="w-full mt-md border-2 border-dashed border-outline-variant py-md rounded-xl text-on-surface-variant font-label-md flex items-center justify-center gap-sm hover:border-primary hover:text-primary transition-all">
                <span className="material-symbols-outlined">add_circle</span>
                Add Custom Document
              </button>
            </section>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-md">
            <section className="tonal-card-shadow bg-white rounded-xl p-md border border-outline-variant">
              <h2 className="font-label-md text-label-md text-primary mb-md">Application Readiness</h2>
              <div className="relative w-full h-32 flex flex-col items-center justify-end overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-32 border-[16px] border-surface-container rounded-t-full" />
                <div
                  className="absolute inset-x-0 top-0 h-32 border-[16px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent rounded-t-full origin-bottom"
                  style={{ transform: "rotate(60deg)" }}
                />
                <div className="text-center pb-2 z-10">
                  <span className="font-headline-lg text-headline-lg text-primary">High</span>
                  <p className="font-label-sm text-on-surface-variant">Reliability Score</p>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm text-center">
                Your preparation is excellent. Following Day 2 steps will increase this to "Maximum".
              </p>
            </section>

            <section className="tonal-card-shadow bg-surface-container rounded-xl p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined">contact_support</span>
                Key Contacts
              </h2>
              <div className="space-y-md">
                <div className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-sm mb-xs">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface">Mrs. Ananya Sharma</h3>
                      <p className="text-label-sm text-on-surface-variant">Hospital Social Worker</p>
                    </div>
                  </div>
                  <div className="flex gap-xs">
                    <a className="flex-1 bg-secondary text-on-secondary py-2 rounded-lg flex items-center justify-center gap-xs font-label-sm" href="tel:1234567890">
                      <span className="material-symbols-outlined text-[18px]">call</span> Call
                    </a>
                    <a className="flex-1 border border-secondary text-secondary py-2 rounded-lg flex items-center justify-center gap-xs font-label-sm" href="#">
                      <span className="material-symbols-outlined text-[18px]">chat</span> Chat
                    </a>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant">
                  <h3 className="font-label-md text-label-md text-primary mb-xs">Government Helpline</h3>
                  <p className="text-body-sm text-on-surface-variant mb-sm">
                    Available 24/7 for insurance and scheme queries.
                  </p>
                  <a className="w-full bg-primary text-on-primary py-2 rounded-lg flex items-center justify-center gap-xs font-label-md" href="tel:104">
                    <span className="material-symbols-outlined">support_agent</span> Dial 104
                  </a>
                </div>
              </div>
            </section>

            <div className="p-md rounded-xl bg-gradient-to-br from-primary-container to-primary text-white">
              <span className="material-symbols-outlined text-[40px] mb-sm">description</span>
              <h3 className="font-headline-sm text-headline-sm mb-xs">Pro-Tip</h3>
              <p className="font-body-sm opacity-90 mb-md">
                Keep all original documents in a waterproof folder. Photocopy each document 3 times
                before your Nodal Office visit.
              </p>
              <button className="w-full py-sm bg-white/20 hover:bg-white/30 rounded-lg font-label-md transition-colors">
                View Document Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TimelineStep({
  n,
  title,
  body,
  hint,
  disabled,
}: {
  n: number;
  title: string;
  body: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex gap-md items-start">
      <div
        className={`z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
          disabled
            ? "bg-surface-container-highest border-2 border-outline-variant text-on-surface-variant"
            : "bg-primary text-white"
        }`}
      >
        {n}
      </div>
      <div className="flex-1">
        <h3 className={`font-label-md text-label-md ${disabled ? "text-on-surface-variant" : "text-primary"}`}>
          {title}
        </h3>
        <p className={`font-body-sm text-body-sm text-on-surface-variant mt-1 ${disabled ? "opacity-60" : ""}`}>
          {body}
        </p>
        {hint && (
          <div className="mt-sm p-sm bg-surface-container-low rounded-lg border border-surface-variant">
            <p className="font-label-sm text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              {hint}
            </p>
          </div>
        )}
        {disabled && (
          <button disabled className="mt-sm bg-surface-variant text-on-surface-variant px-md py-2 rounded-lg font-label-sm opacity-50 cursor-not-allowed">
            Waiting for prior step
          </button>
        )}
      </div>
    </div>
  );
}
