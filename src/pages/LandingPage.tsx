import { useMemo } from "react";
import type { ReactNode } from "react";
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

        {/* WHY EARLY DETECTION MATTERS */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
          <div className="text-center mb-lg max-w-2xl mx-auto">
            <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">{t("lp_ed_tag")}</p>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">{t("lp_ed_title")}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{t("lp_ed_sub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              { icon: "favorite", tone: "primary" as Tone, stat: t("lp_ed_1_stat"), label: t("lp_ed_1_label") },
              { icon: "savings", tone: "secondary" as Tone, stat: t("lp_ed_2_stat"), label: t("lp_ed_2_label") },
              { icon: "healing", tone: "tertiary" as Tone, stat: t("lp_ed_3_stat"), label: t("lp_ed_3_label") },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg tonal-card-shadow flex flex-col gap-sm"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toneStyles[c.tone].iconBg} ${toneStyles[c.tone].iconText}`}>
                  <span className="material-symbols-outlined fill-icon">{c.icon}</span>
                </div>
                <p className={`font-headline-lg text-headline-lg font-bold ${toneStyles[c.tone].iconText}`}>{c.stat}</p>
                <p className="font-body-md text-body-md text-on-surface-variant leading-snug">{c.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-body-sm text-on-surface-variant/70 mt-md max-w-2xl mx-auto italic">{t("lp_ed_note")}</p>
        </section>

        {/* THE COST OF WAITING — DELAYED-TREATMENT STATISTICS */}
        <section className="bg-[#f0ecf7]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
              <div className="lg:col-span-5">
                <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">{t("lp_delay_tag")}</p>
                <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">{t("lp_delay_title")}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">{t("lp_delay_sub")}</p>
                <button
                  onClick={() => nav("/intake")}
                  className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md text-label-md hover:brightness-110 transition-all shadow-lg inline-flex items-center gap-sm focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t("lp_delay_cta")}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  {[
                    { icon: "warning", stat: t("lp_delay_1_stat"), label: t("lp_delay_1_label") },
                    { icon: "payments", stat: t("lp_delay_2_stat"), label: t("lp_delay_2_label") },
                    { icon: "savings", stat: t("lp_delay_3_stat"), label: t("lp_delay_3_label") },
                    { icon: "bolt", stat: t("lp_delay_4_stat"), label: t("lp_delay_4_label") },
                  ].map((s) => (
                    <div key={s.label} className="bg-surface rounded-3xl border border-outline-variant p-lg tonal-card-shadow">
                      <span className="material-symbols-outlined text-secondary mb-sm">{s.icon}</span>
                      <p className="font-headline-md text-headline-md text-primary font-bold mb-xs">{s.stat}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* FEATURE SHOWCASE — alternating text + product mockups */}
        <section className="bg-[#f9f7fc]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-md py-xl">
            <div className="text-center max-w-2xl mx-auto mb-xl">
              <p className="font-label-md text-secondary uppercase tracking-wider mb-xs">{t("lp_all_place")}</p>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-sm">{t("lp_workspace_title")}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">{t("lp_workspace_sub")}</p>
            </div>

            <div className="space-y-xl">
              <ShowcaseRow
                reverse={false}
                icon="edit_note"
                eyebrow={t("nav_intake")}
                title={t("lp_feat_quest_title")}
                body={t("lp_feat_quest_desc")}
                to="/intake"
                cta={t("lp_open")}
              >
                <IntakeMockup t={t} />
              </ShowcaseRow>

              <ShowcaseRow
                reverse
                icon="receipt_long"
                eyebrow={t("nav_breakdown")}
                title={t("lp_feat_breakdown_title")}
                body={t("lp_feat_breakdown_desc")}
                to="/cost-breakdown"
                cta={t("lp_open")}
              >
                <CostMockup t={t} />
              </ShowcaseRow>

              <ShowcaseRow
                reverse={false}
                icon="monitoring"
                eyebrow={t("nav_dashboard")}
                title={t("lp_feat_db_title")}
                body={t("lp_feat_db_desc")}
                to="/dashboard"
                cta={t("lp_open")}
              >
                <DashboardMockup t={t} />
              </ShowcaseRow>

              <ShowcaseRow
                reverse
                icon="forum"
                eyebrow={t("nav_medical")}
                title={t("lp_feat_voice_title")}
                body={t("lp_feat_voice_desc")}
                to="/medical-input"
                cta={t("lp_open")}
              >
                <ChatMockup t={t} />
              </ShowcaseRow>
            </div>

            {/* Compact index of everything else */}
            <div className="mt-xl pt-lg border-t border-outline-variant/50">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((f) => (
                  <Link
                    key={f.title}
                    to={f.to}
                    className="group flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${toneStyles[f.tone].iconBg} ${toneStyles[f.tone].iconText}`}>
                      <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                    </div>
                    <h3 className="font-headline-sm text-sm text-on-surface font-semibold leading-snug">{f.title}</h3>
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary ml-auto">arrow_forward</span>
                  </Link>
                ))}
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

/* ------------------------------------------------------------------ */
/* Feature showcase: alternating text + product mockup ("screenshot") */
/* ------------------------------------------------------------------ */

type TFn = (key: string) => string;

function ShowcaseRow({
  reverse,
  icon,
  eyebrow,
  title,
  body,
  to,
  cta,
  children,
}: {
  reverse: boolean;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface border border-outline-variant rounded-full font-label-sm text-label-sm text-on-surface-variant mb-sm">
          <span className="material-symbols-outlined text-[16px] text-secondary">{icon}</span>
          {eyebrow}
        </div>
        <h3 className="font-headline-lg text-[26px] leading-tight text-primary font-bold mb-sm">{title}</h3>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-md">{body}</p>
        <Link to={to} className="inline-flex items-center gap-xs text-primary font-label-md hover:underline">
          {cta}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>{children}</div>
    </div>
  );
}

function MockWindow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="ml-3 text-[11px] text-on-surface-variant font-medium truncate">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function IntakeMockup({ t }: { t: TFn }) {
  const steps = [t("it_step_demographics"), t("it_step_diagnosis"), t("it_step_treatments"), t("it_step_finance")];
  return (
    <MockWindow label="Artham · Intake">
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-col items-center flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? "bg-primary text-on-primary" : i < 1 ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-outline"}`}>
              {i + 1}
            </div>
            <span className="text-[8px] font-semibold text-on-surface-variant mt-1 truncate max-w-[60px] text-center">{s}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold text-on-surface-variant mb-1">{t("it_age")}</p>
          <div className="h-8 rounded-lg border border-outline-variant bg-surface-container-lowest flex items-center px-3 text-xs text-on-surface">45</div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-on-surface-variant mb-1">{t("it_state")}</p>
          <div className="h-8 rounded-lg border border-primary bg-surface-container-lowest flex items-center px-3 text-xs text-on-surface">Maharashtra</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[t("it_surgery"), t("it_chemo"), t("it_radiation")].map((c) => (
            <div key={c} className="rounded-lg bg-secondary-container/50 border border-secondary/20 px-2 py-1.5 text-center">
              <p className="text-[8px] font-bold text-on-secondary-container uppercase truncate">{c}</p>
              <p className="text-[10px] font-bold text-on-surface">{t("it_yes")}</p>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

function CostMockup({ t }: { t: TFn }) {
  return (
    <MockWindow label="Artham · Cost estimate">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">{t("lp_est_total")}</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full">
          <span className="material-symbols-outlined text-[13px] fill-icon">verified</span>
          92%
        </span>
      </div>
      <h3 className="text-2xl font-bold text-on-surface tracking-tight mb-4">₹4,50,000 – ₹7,50,000</h3>
      <div className="space-y-1.5">
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
      <div className="mt-4 space-y-1.5">
        {["Diagnostics", "Surgery", "Chemotherapy"].map((row, i) => (
          <div key={row} className="flex items-center justify-between text-[11px] py-1.5 border-b border-outline-variant/50 last:border-0">
            <span className="text-on-surface-variant">{row}</span>
            <span className="font-semibold text-on-surface">{["₹41,000", "₹2,60,000", "₹3,20,000"][i]}</span>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function DashboardMockup({ t }: { t: TFn }) {
  return (
    <MockWindow label="Artham · Dashboard">
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="rounded-xl border border-secondary/30 bg-secondary-container/40 p-3">
          <p className="text-[9px] uppercase font-bold text-on-secondary-container tracking-wider">{t("db_best")}</p>
          <p className="text-lg font-bold text-on-surface mt-0.5">₹72,500</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary-container/40 p-3">
          <p className="text-[9px] uppercase font-bold text-on-primary-container tracking-wider">{t("db_expected")}</p>
          <p className="text-lg font-bold text-on-surface mt-0.5">₹5,80,000</p>
        </div>
      </div>
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Coverage</span>
          <span className="text-[10px] font-bold text-secondary">75%</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: "75%" }} />
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="material-symbols-outlined text-[16px] fill-icon text-secondary">verified</span>
          <span className="text-[11px] text-on-surface-variant">PM-JAY eligible · high confidence</span>
        </div>
      </div>
    </MockWindow>
  );
}

function ChatMockup({ t }: { t: TFn }) {
  return (
    <MockWindow label="Artham · Clinical Navigator">
      <div className="space-y-2.5">
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-primary text-on-primary rounded-2xl rounded-br-sm px-3 py-2 text-[11px]">
            What will my chemotherapy cost, and does insurance cover it?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-surface-container-high text-on-surface rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] space-y-1">
            <p className="font-bold text-primary">Chemotherapy (TC × 4)</p>
            <p>Est. <b>₹2,00,000–₹3,20,000</b> at a private hospital. With your insurance, ~75% is cashless.</p>
            <p className="text-on-surface-variant">You also qualify for PM-JAY — I can add it to your Action Plan.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-8 rounded-full border border-outline-variant bg-surface-container-lowest flex items-center px-3 text-[11px] text-outline">
            {t("mi_placeholder_chat")}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">send</span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

