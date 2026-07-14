import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useLanguage } from "../components/LanguageContext";

type Tone = "primary" | "secondary" | "tertiary";
type FeatureDefinition = {
  icon: string;
  titleKey: string;
  bodyKey: string;
  tone: Tone;
  to: string;
};

type Feature = {
  icon: string;
  title: string;
  body: string;
  tone: Tone;
  to: string;
};

type Stat = { value: string; labelKey: string };

type JourneyStep = { n: number; icon: string; titleKey: string; bodyKey: string };

const featureDefinitions: FeatureDefinition[] = [
  { icon: "mic", titleKey: "lp_feat_voice_title", bodyKey: "lp_feat_voice_desc", tone: "primary", to: "/medical-input" },
  { icon: "edit_note", titleKey: "lp_feat_quest_title", bodyKey: "lp_feat_quest_desc", tone: "secondary", to: "/intake" },
  { icon: "upload_file", titleKey: "lp_feat_vault_title", bodyKey: "lp_feat_vault_desc", tone: "tertiary", to: "/medical-input" },
  { icon: "monitoring", titleKey: "lp_feat_db_title", bodyKey: "lp_feat_db_desc", tone: "primary", to: "/dashboard" },
  { icon: "receipt_long", titleKey: "lp_feat_breakdown_title", bodyKey: "lp_feat_breakdown_desc", tone: "secondary", to: "/cost-breakdown" },
  { icon: "lightbulb", titleKey: "lp_feat_action_title", bodyKey: "lp_feat_action_desc", tone: "tertiary", to: "/action-plan" },
  { icon: "library_books", titleKey: "lp_feat_schemes_title", bodyKey: "lp_feat_schemes_desc", tone: "secondary", to: "/schemes" },
];

const statsDefinitions: Stat[] = [
  { value: "₹2.4 L", labelKey: "lp_stat1" },
  { value: "92%", labelKey: "lp_stat2" },
  { value: "27,000+", labelKey: "lp_stat3" },
  { value: "150+", labelKey: "lp_stat4" },
];

const journeySteps: JourneyStep[] = [
  { n: 1, icon: "record_voice_over", titleKey: "lp_journey_step1_title", bodyKey: "lp_journey_step1_desc" },
  { n: 2, icon: "insights", titleKey: "lp_journey_step2_title", bodyKey: "lp_journey_step2_desc" },
  { n: 3, icon: "map", titleKey: "lp_journey_step3_title", bodyKey: "lp_journey_step3_desc" },
];

const toneStyles: Record<Tone, { iconBg: string; iconText: string }> = {
  primary: { iconBg: "bg-primary-fixed", iconText: "text-primary" },
  secondary: { iconBg: "bg-secondary-fixed", iconText: "text-secondary" },
  tertiary: { iconBg: "bg-tertiary-fixed", iconText: "text-tertiary" },
};

export default function LandingPage() {
  const { t } = useLanguage();
  const nav = useNavigate();

  const features: Feature[] = useMemo(
    () =>
      featureDefinitions.map((f) => ({
        ...f,
        title: t(f.titleKey),
        body: t(f.bodyKey),
      })),
    [t]
  );

  const stats = useMemo(
    () => statsDefinitions.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [t]
  );

  const journey = useMemo(
    () =>
      journeySteps.map((j) => ({
        ...j,
        title: t(j.titleKey),
        body: t(j.bodyKey),
      })),
    [t]
  );

  return (
    <AppShell bare bg="bg-[#f5f2fa]">
      <div className="relative">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] bg-primary-fixed-dim rounded-full blur-[120px] opacity-20" />
            <div className="absolute top-[100px] left-[-200px] w-[500px] h-[500px] bg-secondary-fixed rounded-full blur-[120px] opacity-15" />
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md pt-lg md:pt-xl pb-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface border border-outline-variant text-on-surface-variant rounded-full font-label-sm text-label-sm mb-md">
                  <span className="material-symbols-outlined text-[16px] fill-icon text-secondary">verified</span>
                  {t("lp_built_empathy")}
                </div>
                <h1 className="font-headline-lg text-headline-lg md:text-[56px] md:leading-[1.05] md:tracking-[-0.02em] text-on-surface font-bold mb-md">
                  {t("lp_hero_title")}
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[640px] mb-lg">
                  {t("lp_hero_sub")}
                </p>
                <div className="flex flex-col sm:flex-row gap-sm">
                  <button
                    onClick={() => nav("/intake")}
                    className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-sm focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    {t("lp_btn_start")}
                  </button>
                  <button
                    onClick={() => nav("/preventive-plans")}
                    className="border-2 border-primary text-primary px-lg py-md rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t("lp_btn_preventive")}
                  </button>
                </div>
                <div className="mt-lg flex flex-wrap items-center gap-md text-on-surface-variant">
                  {[
                    ["lock", t("lp_lock")],
                    ["schedule", t("lp_ready")],
                    ["payments", t("lp_no_card")],
                  ].map(([i, textVal]) => (
                    <div key={textVal} className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">{i}</span>
                      <span className="font-label-md text-label-md">{textVal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Visual: clean product preview (mirrors the dashboard) */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
                    {/* Faux window bar */}
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                      <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                      <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                      <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                      <span className="ml-3 text-[11px] text-on-surface-variant font-medium">Artham · Cost estimate</span>
                    </div>
                    {/* Estimate summary */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">{t("lp_est_total")}</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[13px] fill-icon">verified</span>
                          92% {t("lp_confidence")}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-on-surface tracking-tight mb-0.5">₹4,50,000 – ₹7,50,000</h3>
                      <p className="text-xs text-on-surface-variant mb-5">{t("lp_lumpectomy_chemo")}</p>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-sm text-on-surface">
                          <span className="text-on-surface-variant">{t("lp_insurance_covers")}</span>
                          <span className="font-semibold">₹4,35,000</span>
                        </div>
                        <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden flex">
                          <div className="bg-primary" style={{ width: "75%" }} />
                          <div className="bg-tertiary" style={{ width: "25%" }} />
                        </div>
                        <div className="flex justify-between text-sm text-on-surface">
                          <span className="text-on-surface-variant">{t("lp_oop")}</span>
                          <span className="font-semibold">₹1,45,000</span>
                        </div>
                      </div>

                      <div className="bg-primary-container/60 border border-primary/15 p-3 rounded-lg flex items-center gap-2.5">
                        <span className="material-symbols-outlined fill-icon text-primary text-[20px]">lightbulb</span>
                        <p className="text-xs text-on-surface leading-relaxed">{t("lp_qualify_pmjay")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Float chip: savings */}
                  <div className="absolute -top-4 -right-4 md:-right-6 bg-surface tonal-card-shadow rounded-xl p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                      <span className="material-symbols-outlined fill-icon text-[18px]">savings</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{t("lp_id_savings")}</p>
                      <p className="font-bold text-primary text-sm">₹2,400</p>
                    </div>
                  </div>
                  {/* Float chip: action plan */}
                  <div className="absolute -bottom-4 -left-4 bg-surface tonal-card-shadow rounded-xl p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined fill-icon text-[18px]">task_alt</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{t("nav_action")}</p>
                      <p className="font-bold text-on-surface text-sm">{t("lp_action_plan_ready")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="bg-[#f0ecf7]">
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
            <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">{t("lp_how_works")}</p>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">
              {t("lp_three_steps")}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {t("lp_no_spreadsheets")}
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
                <div className="font-label-sm text-secondary mb-xs">{t("lp_step")} {j.n}</div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{j.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{j.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE BREAKDOWN */}
        <section className="bg-[#f9f7fc]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md py-md">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
              <div className="max-w-xl">
                <p className="font-label-sm text-secondary uppercase tracking-wider mb-1">
                  {t("lp_all_place")}
                </p>
                <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
                  {t("lp_workspace_title")}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t("lp_workspace_sub")}
                </p>
              </div>
              <Link
                to="/dashboard"
                className="flex-shrink-0 text-primary font-label-sm text-label-sm flex items-center gap-2 hover:underline"
              >
                {t("lp_preview_db")}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              {features.map((f) => (
                <Link
                  key={f.title}
                  to={f.to}
                  className="group flex flex-col gap-3 rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneStyles[f.tone].iconBg} ${toneStyles[f.tone].iconText}`}>
                      <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                    </div>
                    <h3 className="font-headline-sm text-sm text-on-surface font-semibold leading-snug">
                      {f.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                    {f.body}
                  </p>
                  <div className="mt-auto flex items-center gap-1 text-primary font-label-sm">
                    <span>{t("lp_open")}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
            <div>
              <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">
                {t("lp_why_title")}
              </p>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-md">
                {t("lp_people_not_paper")}
              </h2>
              <div className="space-y-md">
                {[
                  {
                    i: "psychology",
                    t: t("lp_design_stress"),
                    b: t("lp_design_stress_desc"),
                  },
                  {
                    i: "fact_check",
                    t: t("lp_verified_bills"),
                    b: t("lp_verified_bills_desc"),
                  },
                  {
                    i: "shield_lock",
                    t: t("lp_data_yours"),
                    b: t("lp_data_yours_desc"),
                  },
                  {
                    i: "diversity_3",
                    t: t("lp_multilingual"),
                    b: t("lp_multilingual_desc"),
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
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-lg text-on-primary shadow-lg">
                <span className="material-symbols-outlined text-[48px] opacity-30 mb-sm">format_quote</span>
                <p className="font-body-lg text-body-lg mb-md leading-relaxed">
                  {t("lp_quote_priya")}
                </p>
                <div className="flex items-center gap-md pt-md border-t border-on-primary/20">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold">
                    PD
                  </div>
                  <div>
                    <p className="font-label-md">Priya D.</p>
                    <p className="font-label-sm opacity-70">{t("lp_priya_role")}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-sm rounded-xl tonal-card-shadow border border-outline-variant flex items-center gap-sm">
                <span className="material-symbols-outlined fill-icon text-tertiary-container">
                  star
                </span>
                <div>
                  <p className="font-bold text-primary text-sm">4.9 / 5</p>
                  <p className="text-[10px] text-on-surface-variant">{t("lp_rating")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md pb-xl">
          <div className="bg-[#e8e2f1] rounded-xl p-lg md:p-xl text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-secondary/15 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">
                {t("lp_cta_ready")}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
                {t("lp_cta_sub")}
              </p>
              <div className="flex flex-col sm:flex-row gap-sm justify-center">
                <button
                  onClick={() => nav("/intake")}
                  className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-sm"
                >
                  {t("lp_cta_btn_quest")}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button
                  onClick={() => nav("/schemes")}
                  className="bg-white border border-outline-variant text-primary px-lg py-md rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all flex items-center justify-center gap-sm"
                >
                  {t("lp_cta_btn_schemes")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

