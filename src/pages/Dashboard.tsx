import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function Dashboard() {
  return (
    <AppShell>
      <div className="p-md md:p-lg max-w-container-max mx-auto">
        {/* Hero */}
        <section className="mb-lg">
          <div className="bg-primary text-on-primary p-lg rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-md">
              <div>
                <span className="font-label-md text-on-primary-container bg-primary-container px-sm py-xs rounded-full inline-block mb-sm">
                  Estimated Total Treatment Cost Range
                </span>
                <h1 className="font-headline-lg text-headline-lg mb-xs">₹2,50,000 – ₹4,00,000</h1>
                <p className="text-on-primary opacity-80 font-body-md max-w-xl">
                  Based on your clinical input for Laparoscopic Myomectomy with a 3-day recovery
                  period in Bengaluru.
                </p>
              </div>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-md rounded-lg">
                <p className="font-label-sm mb-sm uppercase tracking-wider">Confidence Level</p>
                <div className="relative w-40 h-20 overflow-hidden">
                  <div className="absolute inset-0 rounded-t-full border-[12px] border-on-primary/20" />
                  <div
                    className="absolute inset-0 rounded-t-full border-[12px] border-t-secondary-fixed border-r-secondary-fixed border-l-transparent border-b-transparent origin-bottom"
                    style={{ transform: "rotate(135deg)" }}
                  />
                </div>
                <p className="font-headline-sm text-headline-sm">High</p>
                <p className="font-body-sm text-center mt-xs opacity-90">Verified provider rates</p>
              </div>
            </div>
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[100px] opacity-20" />
          </div>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-lg">
            {/* Scenario Comparison */}
            <div>
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-headline-sm text-headline-sm text-primary">Scenario Comparison</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">info</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <ScenarioCard label="Best Case" value="₹2,35,000" icon="trending_down" tone="secondary" body="No complications, minimal stay, and generic medication used." />
                <ScenarioCard label="Expected Case" value="₹3,10,000" icon="stars" tone="primary" highlighted body="Standard recovery path with average specialist billing." />
                <ScenarioCard label="Complex Case" value="₹4,45,000" icon="warning" tone="tertiary" body="Extended ICU monitoring or specialized surgical consumables." />
              </div>
            </div>

            {/* Insurance & Govt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-md">Insurance Coverage</h3>
                <div className="space-y-md">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md">Covered by Star Health</span>
                    <span className="font-bold text-secondary">₹1,80,000</span>
                  </div>
                  <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden flex">
                    <div className="h-full bg-secondary" style={{ width: "60%" }} />
                    <div className="h-full bg-tertiary-container" style={{ width: "40%" }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-md">Out-of-Pocket Estimate</span>
                    <span className="font-bold text-tertiary">₹1,30,000</span>
                  </div>
                  <div className="p-sm bg-surface-container-low rounded-lg flex items-start gap-sm mt-sm">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <p className="font-body-sm text-on-surface-variant">
                      Your policy has a 10% co-payment clause for non-network hospitals.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-lg rounded-xl border-l-8 border-secondary-container">
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 32 }}>account_balance</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Govt. Schemes</h3>
                </div>
                <div className="bg-white p-md rounded-lg border border-secondary-container mb-md">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-md text-primary">Ayushman Bharat (PM-JAY)</span>
                    <span className="px-xs py-[2px] bg-secondary-container text-on-secondary-container rounded font-label-sm">Eligible</span>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    You may be eligible for coverage up to ₹5 Lakhs for this procedure.
                  </p>
                  <Link
                    to="/schemes"
                    className="mt-sm text-secondary font-label-md flex items-center gap-xs hover:underline"
                  >
                    Check documentation
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <p className="font-label-sm text-on-surface-variant opacity-80 italic">
                  Last verified: 24 Oct 2024
                </p>
              </div>
            </div>

            <Link
              to="/cost-breakdown"
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-sm text-headline-sm hover:brightness-110 transition-all flex justify-center items-center gap-md shadow-lg"
            >
              View Detailed Cost Breakdown
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          {/* Sidebar: Savings */}
          <aside className="lg:col-span-4">
            <div className="sticky top-md">
              <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant">
                <div className="flex items-center gap-sm mb-lg">
                  <span
                    className="material-symbols-outlined fill-icon text-tertiary-container"
                    style={{ fontSize: 28 }}
                  >
                    lightbulb
                  </span>
                  <h3 className="font-headline-sm text-headline-sm">Savings for You</h3>
                </div>
                <div className="space-y-lg">
                  <Tip icon="medical_information" title="Switch to Semi-Private Room" amount="₹18,000" body="on room rent and associated nursing charges." />
                  <Tip icon="medication" title="Generic Post-Op Meds" body="Ask your surgeon for Pradhan Mantri Bhartiya Janaushadhi alternatives." />
                  <Tip icon="calendar_month" title="Pre-Surgical Lab Work" amount="₹4,500" body="at a partner diagnostic center." />
                </div>
                <Link
                  to="/action-plan"
                  className="mt-lg w-full bg-secondary text-on-secondary py-sm rounded-lg font-label-md flex items-center justify-center gap-xs hover:brightness-110 transition-all"
                >
                  Build my Action Plan
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ScenarioCard({
  label,
  value,
  icon,
  tone,
  body,
  highlighted,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "secondary" | "primary" | "tertiary";
  body: string;
  highlighted?: boolean;
}) {
  const cls = highlighted
    ? "bg-surface-container-highest border-2 border-primary shadow-sm"
    : "bg-surface-container-lowest border border-outline-variant hover:shadow-md transition-shadow";
  const toneCls = {
    secondary: "text-secondary",
    primary: "text-primary",
    tertiary: "text-tertiary",
  }[tone];
  return (
    <div className={`p-md rounded-xl ${cls}`}>
      <div className="flex justify-between items-start mb-sm">
        <span className={`font-label-md ${toneCls}`}>{label}</span>
        <span className={`material-symbols-outlined fill-icon ${toneCls}`}>{icon}</span>
      </div>
      <p className="font-headline-sm text-headline-sm mb-xs">{value}</p>
      <p className="font-body-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

function Tip({
  icon,
  title,
  amount,
  body,
}: {
  icon: string;
  title: string;
  amount?: string;
  body: string;
}) {
  return (
    <div className="group cursor-pointer">
      <div className="flex gap-md">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-label-md mb-xs">{title}</h4>
          <p className="font-body-sm text-on-surface-variant">
            {amount && <>Save up to <span className="font-bold text-secondary">{amount}</span> </>}
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
