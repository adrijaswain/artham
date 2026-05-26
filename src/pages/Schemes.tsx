import AppShell from "../components/AppShell";

type Scheme = {
  title: string;
  tag: string;
  tagTone: "tertiary-container" | "surface-variant";
  icon: string;
  body: string;
  bullets: string[];
  reliability: number;
};

const schemes: Scheme[] = [
  {
    title: "Mahatma Jyotirao Phule Jan Arogya Yojana",
    tag: "Maharashtra",
    tagTone: "tertiary-container",
    icon: "location_on",
    body: "Cashless treatment for identified specialty services in network hospitals for BPL/APL families.",
    bullets: ["Covers Breast Surgery & Chemo", "Eligibility: Yellow/Orange Ration Card"],
    reliability: 85,
  },
  {
    title: "Women's Cancer Initiative - Tata Memorial",
    tag: "NGO Support",
    tagTone: "surface-variant",
    icon: "volunteer_activism",
    body: "Financial aid for diagnosis, medicine, and reconstructive surgery for underprivileged women.",
    bullets: ["Income under ₹3 Lakh / yr", "Discharge summary required"],
    reliability: 78,
  },
  {
    title: "Karnataka Arogya Sanjeevini",
    tag: "Karnataka",
    tagTone: "tertiary-container",
    icon: "location_on",
    body: "State-funded cashless care for government employees and pensioners.",
    bullets: ["Up to ₹3 Lakh coverage", "Empanelled hospitals only"],
    reliability: 81,
  },
  {
    title: "HCG Foundation Cancer Aid",
    tag: "Private Trust",
    tagTone: "surface-variant",
    icon: "favorite",
    body: "Discounted care packages for cancer treatment at participating HCG centers.",
    bullets: ["Up to 50% off chemo cycles", "Means-tested"],
    reliability: 72,
  },
  {
    title: "CMRF — Chief Minister's Relief Fund",
    tag: "All India",
    tagTone: "tertiary-container",
    icon: "account_balance",
    body: "State-specific medical financial assistance based on hospital recommendation.",
    bullets: ["Application via hospital", "1-3 Lakh typical grant"],
    reliability: 76,
  },
  {
    title: "Indian Cancer Society Grants",
    tag: "NGO Support",
    tagTone: "surface-variant",
    icon: "volunteer_activism",
    body: "Grant program for diagnostics and select treatment expenses for low-income patients.",
    bullets: ["Income ceiling applies", "Doctor referral needed"],
    reliability: 80,
  },
];

export default function Schemes() {
  return (
    <AppShell>
      <div className="p-md md:p-lg max-w-container-max mx-auto">
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
            Government Schemes & Insurance
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Comprehensive financial support resources for treatment in India. We help you navigate
            public and private aid with clarity and dignity.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-gutter mb-lg items-center">
          <div className="relative w-full md:flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full pl-12 pr-14 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-container-lowest outline-none transition-all font-body-md"
              placeholder="Search by scheme name, state, or benefit..."
              type="text"
            />
            <button
              aria-label="Voice search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:bg-surface-container-high p-1.5 rounded-full transition-all"
            >
              <span className="material-symbols-outlined">mic</span>
            </button>
          </div>
          <div className="flex gap-sm w-full md:w-auto">
            <select className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-label-md text-label-md outline-none min-w-[140px]">
              <option>All India</option>
              <option>Maharashtra</option>
              <option>Karnataka</option>
              <option>Delhi</option>
            </select>
            <button className="flex items-center gap-xs px-md py-3 rounded-xl border border-secondary text-secondary font-label-md text-label-md hover:bg-secondary-container transition-colors">
              <span className="material-symbols-outlined">filter_list</span> Filters
            </button>
          </div>
        </div>

        {/* Featured Hero */}
        <section className="mb-lg">
          <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-lg flex flex-col md:flex-row items-center gap-lg shadow-xl">
            <div className="flex-grow z-10">
              <div className="inline-flex items-center gap-xs px-3 py-1 bg-on-primary/20 rounded-full font-label-sm text-label-sm mb-sm">
                <span className="material-symbols-outlined fill-icon text-[16px]">star</span>
                National Priority
              </div>
              <h2 className="font-headline-lg text-headline-lg mb-sm">Ayushman Bharat (PM-JAY)</h2>
              <p className="font-body-lg text-body-lg mb-md max-w-2xl text-on-primary/90">
                The world's largest health assurance scheme providing a cover of ₹5 Lakh per family
                per year for secondary and tertiary care hospitalization.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-md">
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider opacity-70">Coverage Amount</p>
                  <p className="font-headline-sm text-headline-sm">₹5,00,000 /yr</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider opacity-70">Cancer Specifics</p>
                  <p className="font-headline-sm text-headline-sm">Full Treatment</p>
                </div>
                <div className="hidden md:block">
                  <p className="font-label-sm text-label-sm uppercase tracking-wider opacity-70">Hospitals</p>
                  <p className="font-headline-sm text-headline-sm">27,000+ Pan India</p>
                </div>
              </div>
              <div className="flex gap-md flex-wrap">
                <button className="px-lg py-3 bg-white text-primary rounded-lg font-label-md text-label-md font-bold hover:bg-surface-container-low transition-all">
                  Check Eligibility
                </button>
                <button className="px-lg py-3 border border-white text-on-primary rounded-lg font-label-md text-label-md hover:bg-on-primary/10 transition-all">
                  View Coverage List
                </button>
              </div>
            </div>
            <div className="hidden lg:flex w-72 h-72 rounded-xl bg-gradient-to-br from-primary-container to-primary-fixed-dim items-center justify-center flex-shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-[150px] text-on-primary opacity-60">local_hospital</span>
            </div>
          </div>
        </section>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {schemes.map((s) => (
            <SchemeTile key={s.title} {...s} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function SchemeTile({ title, tag, tagTone, icon, body, bullets, reliability }: Scheme) {
  const tagCls = tagTone === "tertiary-container"
    ? "bg-tertiary-container text-on-tertiary-container"
    : "bg-surface-variant text-on-surface-variant";
  return (
    <div className="bg-surface-container-lowest tonal-card-shadow border border-outline-variant rounded-xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform">
      <div className="p-md border-b border-outline-variant bg-surface-container-low flex justify-between items-start">
        <div className="bg-secondary/10 p-3 rounded-lg">
          <span className="material-symbols-outlined text-secondary">{icon}</span>
        </div>
        <span className={`px-3 py-1 ${tagCls} rounded-full font-label-sm text-label-sm`}>{tag}</span>
      </div>
      <div className="p-md flex-grow">
        <h3 className="font-headline-sm text-headline-sm text-primary mb-xs">{title}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">{body}</p>
        <div className="space-y-sm mb-md">
          {bullets.map((b) => (
            <div key={b} className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
              <span className="font-body-sm text-body-sm">{b}</span>
            </div>
          ))}
        </div>
        <div className="bg-surface-container p-sm rounded-lg flex items-center gap-md">
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-outline-variant"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="100, 100"
                strokeWidth="3"
              />
              <path
                className="text-secondary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${reliability}, 100`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-secondary">{reliability}%</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface">Reliability Score</p>
            <p className="text-[11px] text-on-surface-variant">Verified by community</p>
          </div>
        </div>
      </div>
      <div className="p-md pt-0">
        <button className="w-full py-2 border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary/5 transition-all">
          View Details
        </button>
      </div>
    </div>
  );
}
