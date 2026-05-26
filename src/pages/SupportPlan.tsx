import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function SupportPlan() {
  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pb-xl max-w-container-max mx-auto">
        <div className="py-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Your Action Plan</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Based on your clinical and financial profile, we've identified the best paths forward.
            Follow these clear steps to secure your healthcare financing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left: Profile */}
          <div className="lg:col-span-4 space-y-gutter lg:sticky lg:top-[100px]">
            <div className="bg-surface-container-lowest p-md rounded-xl tonal-card-shadow border border-outline-variant/30">
              <div className="flex items-center gap-md mb-md pb-sm border-b border-outline-variant">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                  <span className="material-symbols-outlined fill-icon">person</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Rajesh Kumar</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Profile: Chronic Care Support</p>
                </div>
              </div>
              <div className="space-y-sm">
                {[
                  ["Clinical Condition", "Type 2 Diabetes"],
                  ["Annual Income", "₹ 4,50,000"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-label-md">{k}</span>
                    <span className="font-label-md text-on-surface">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-label-md">Aadhar Status</span>
                  <span className="text-secondary font-label-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Verified
                  </span>
                </div>
              </div>

              <div className="mt-lg pt-md border-t border-outline-variant">
                <h4 className="font-label-md text-label-md text-on-surface-variant mb-md">Estimate Reliability</h4>
                <div className="relative flex justify-center h-24 overflow-hidden">
                  <div className="w-40 h-40 border-[16px] border-surface-container rounded-full border-b-transparent rotate-[-45deg] absolute" />
                  <div className="w-40 h-40 border-[16px] border-secondary-container rounded-full border-b-transparent rotate-[15deg] absolute" />
                  <div className="absolute bottom-0 text-center">
                    <span className="font-headline-md text-headline-md text-secondary">85%</span>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">Very High</p>
                  </div>
                </div>
                <p className="mt-sm text-body-sm text-on-surface-variant text-center">
                  Based on verified state provider rates and your documented income.
                </p>
              </div>
            </div>

            <div className="bg-secondary-container/30 p-md rounded-xl border border-secondary/20">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary">support_agent</span>
                <div>
                  <h4 className="font-label-md text-label-md text-secondary font-bold">Need assistance?</h4>
                  <p className="text-body-sm text-on-surface-variant mt-xs">
                    A dedicated counselor is available to help you navigate these schemes today.
                  </p>
                  <button className="mt-sm text-secondary font-label-md hover:underline">
                    Schedule a Free Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Schemes */}
          <div className="lg:col-span-8 space-y-gutter">
            <div className="flex items-center gap-sm">
              <div className="h-10 w-1 bg-secondary rounded-full" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Eligible Schemes & Programs</h2>
              <span className="ml-auto bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full text-label-sm font-label-sm">
                3 Identified
              </span>
            </div>

            <SchemeCard
              tag="State Government"
              tagTone="primary"
              title="Ayushman Bharat - PMJAY"
              subtitle="Annual coverage up to ₹5 Lakhs for tertiary care."
              eligibility="High Eligibility"
              match="92% Match Score"
              steps={[
                ["Gather Original Aadhar Card", "Ensure name matches exactly with your medical records."],
                ["Get Income Certificate (Tehsildar Office)", "Required for EWS classification within the scheme."],
                ["Visit Hospital Nodal Office", "Ask for the 'Arogya Mitra' at City General Hospital."],
              ]}
              progress={33}
            />

            <SchemeCard
              tag="Private Trust"
              tagTone="secondary"
              title="TATA Trusts Financial Aid"
              subtitle="Grant-based assistance for specific medicine costs."
              eligibility="Moderate Match"
              match="74% Match Score"
              steps={[
                ["Download Form 'T-202'"],
                ["Medical Discharge Summary (Copy)"],
              ]}
              progress={50}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="p-md bg-tertiary-container/10 border border-tertiary-container/30 rounded-xl">
                <h4 className="font-label-md text-label-md text-tertiary flex items-center gap-xs mb-sm">
                  <span className="material-symbols-outlined text-[20px]">lightbulb</span> Recommendation
                </h4>
                <p className="text-body-sm text-on-surface">
                  Based on your prescription history, consider the{" "}
                  <strong>Generic Medicine Subsidy</strong> at PMBJP outlets to save 40% on monthly costs.
                </p>
              </div>
              <div className="p-md bg-surface-container-high rounded-xl flex items-center justify-between border border-outline-variant/20">
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Crowdfunding Potential</h4>
                  <p className="text-body-sm text-on-surface-variant">High community support score.</p>
                </div>
                <span className="material-symbols-outlined text-primary text-[32px]">groups</span>
              </div>
            </div>

            <Link
              to="/schemes"
              className="block bg-primary text-on-primary py-4 rounded-xl font-headline-sm text-headline-sm hover:brightness-110 transition-all text-center"
            >
              Explore All Schemes →
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SchemeCard({
  tag,
  tagTone,
  title,
  subtitle,
  eligibility,
  match,
  steps,
  progress,
}: {
  tag: string;
  tagTone: "primary" | "secondary";
  title: string;
  subtitle: string;
  eligibility: string;
  match: string;
  steps: string[][];
  progress: number;
}) {
  const tagCls = tagTone === "primary"
    ? "bg-primary-container text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const titleCls = tagTone === "primary" ? "text-primary" : "text-secondary";
  const progressBar = tagTone === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <div className="bg-surface-container-lowest rounded-xl tonal-card-shadow border border-outline-variant/30 overflow-hidden transition-transform hover:translate-y-[-2px]">
      <div className={`p-md bg-gradient-to-r ${tagTone === "primary" ? "from-primary-container/10" : "from-secondary-container/10"} to-transparent flex justify-between items-start`}>
        <div>
          <span className={`${tagCls} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-xs inline-block`}>
            {tag}
          </span>
          <h3 className={`font-headline-sm text-headline-sm ${titleCls}`}>{title}</h3>
          <p className="text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-xs text-secondary font-label-md">
            <span className="material-symbols-outlined text-[18px] fill-icon">verified</span>
            <span>{eligibility}</span>
          </div>
          <span className="text-label-sm text-on-surface-variant mt-xs">{match}</span>
        </div>
      </div>
      <div className="p-md space-y-md">
        <div>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-sm">
            Next Steps
          </h4>
          <div className="space-y-base">
            {steps.map(([head, sub]) => (
              <label
                key={head}
                className="flex items-start gap-md p-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              >
                <input type="checkbox" className="w-5 h-5 mt-xs rounded text-primary focus:ring-primary" />
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{head}</p>
                  {sub && <p className="text-body-sm text-on-surface-variant">{sub}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-md border-t border-outline-variant/30">
          <div className="flex items-center gap-base">
            <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className={`${progressBar} h-full rounded-full`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              Progress: {progress}%
            </span>
          </div>
          <button className={`flex items-center gap-xs font-label-md ${titleCls}`}>
            View Full Details <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
