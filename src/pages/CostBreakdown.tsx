import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

type Item = { title: string; body: string; estimate: string; insurance: string; oop: string };

const sections: { icon: string; title: string; items: Item[] }[] = [
  {
    icon: "biotech",
    title: "Pre-treatment Diagnostics",
    items: [
      { title: "Biopsy & Pathology", body: "Comprehensive tissue analysis and grading.", estimate: "$2,400", insurance: "$1,920", oop: "$480" },
      { title: "PET Scan & MRI", body: "Staging and whole-body imaging for localization.", estimate: "$4,800", insurance: "$4,000", oop: "$800" },
    ],
  },
  {
    icon: "healing",
    title: "Primary Treatment",
    items: [
      { title: "Lumpectomy / Mastectomy", body: "Surgical intervention including anesthesia and recovery.", estimate: "$22,000", insurance: "$18,500", oop: "$3,500" },
      { title: "Chemotherapy (6 Cycles)", body: "Systemic treatment plan including infusion and monitoring.", estimate: "$28,000", insurance: "$24,000", oop: "$4,000" },
      { title: "Radiation Therapy", body: "Targeted localized radiation treatment course.", estimate: "$12,000", insurance: "$9,800", oop: "$2,200" },
    ],
  },
  {
    icon: "medication",
    title: "Medication",
    items: [
      { title: "Long-term Hormonal Therapy", body: "Annual supply of maintenance oral medication.", estimate: "$3,000", insurance: "$2,200", oop: "$800" },
    ],
  },
  {
    icon: "domain",
    title: "Hospitalization",
    items: [
      { title: "Room, ICU & Nursing", body: "5-day inpatient stay including intensive care monitoring.", estimate: "$12,000", insurance: "$8,080", oop: "$3,920" },
    ],
  },
];

export default function CostBreakdown() {
  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pb-xl pt-md max-w-container-max mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">
              Estimated Treatment Journey
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Comprehensive financial forecast for your treatment cycle.
            </p>
          </div>
          <div className="bg-surface-container p-sm rounded-xl border border-outline-variant flex items-center gap-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Reliability Score</p>
              <p className="font-headline-sm text-headline-sm text-primary">High (92%)</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          <SummaryCard label="Total Estimate" value="$84,200.00" tone="primary" />
          <SummaryCard label="Insurance Coverage" value="$68,500.00" tone="secondary" pct={81} />
          <SummaryCard label="Out-of-Pocket" value="$15,700.00" tone="tertiary" pct={19} />
        </div>

        {/* Timeline */}
        <div className="space-y-lg relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-outline-variant hidden md:block" />
          {sections.map((s) => (
            <section className="relative" key={s.title}>
              <div className="flex items-center gap-md mb-md">
                <div className="z-10 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md shrink-0">
                  <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{s.title}</h3>
              </div>
              <div className="md:ml-20 space-y-sm">
                {s.items.map((it) => (
                  <LineItem key={it.title} {...it} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Insight */}
        <div className="mt-xl bg-primary-container text-on-primary-container p-lg rounded-xl flex flex-col md:flex-row gap-lg items-center overflow-hidden relative">
          <div className="flex-1 z-10">
            <h2 className="font-headline-md text-headline-md mb-sm">Financial Resilience Insight</h2>
            <p className="font-body-lg text-body-lg opacity-90">
              Based on your specific insurance plan and provider network, we've identified $2,400 in
              potential savings by opting for a verified specialized oncology center. Our estimates
              are verified against 4,200 local billing records.
            </p>
            <Link
              to="/action-plan"
              className="mt-md inline-flex items-center gap-xs bg-secondary px-md py-sm rounded-lg font-label-md text-on-secondary shadow-lg hover:brightness-110 transition-all"
            >
              Review Savings Options
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="w-full md:w-64 flex flex-col items-center gap-base z-10">
            <div className="relative w-48 h-24 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path className="opacity-20 text-on-primary-container" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" />
                <path className="text-secondary-container" d="M 10 50 A 40 40 0 0 1 80 15" fill="none" stroke="currentColor" strokeWidth="12" />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="font-headline-sm text-headline-sm text-on-primary-container">Excellent</p>
              </div>
            </div>
            <p className="font-label-sm text-label-sm text-center uppercase tracking-wider opacity-80">
              Network Alignment
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  pct = 100,
}: {
  label: string;
  value: string;
  tone: "primary" | "secondary" | "tertiary";
  pct?: number;
}) {
  const text = { primary: "text-primary", secondary: "text-secondary", tertiary: "text-tertiary" }[tone];
  const bar = { primary: "bg-primary", secondary: "bg-secondary", tertiary: "bg-tertiary" }[tone];
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl tonal-card-shadow border border-outline-variant">
      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">{label}</p>
      <p className={`font-headline-md text-headline-md ${text}`}>{value}</p>
      <div className="w-full h-1 bg-surface-container mt-md rounded-full overflow-hidden">
        <div className={`${bar} h-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LineItem({ title, body, estimate, insurance, oop }: Item) {
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
        <div className="flex-1">
          <h4 className="font-label-md text-label-md text-primary">{title}</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{body}</p>
        </div>
        <div className="grid grid-cols-3 gap-md w-full md:w-auto">
          <Cell label="Estimate" value={estimate} bold />
          <Cell label="Insurance" value={insurance} tone="text-secondary" />
          <Cell label="OOP" value={oop} tone="text-tertiary" bold />
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-outline">{label}</p>
      <p className={`font-body-md text-body-md ${bold ? "font-bold" : ""} ${tone ?? "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}
