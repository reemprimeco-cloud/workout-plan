// ============================================================
// PricingSelector — Pre-Auth Plan Selection
// Reuses the same design as Pricing.tsx but instead of
// triggering checkout directly, it calls onPlanSelected()
// so the caller can proceed to login/signup first.
// ============================================================
import { useState } from "react";
import { Check, Crown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedPlan, SelectedPeriod } from "./PricingBeforeAuth";

const NAVY      = "#1B2E5E";
const NAVY_DARK = "#0F1E3D";
const SKY       = "#7BB8D4";
const SKY_LIGHT = "#A8D4E8";
const GREEN     = "#22C55E";
const GOLD      = "#F59E0B";
const LOGO_URL  = '/api/img/primefit_logo_11f9ef29.PNG';

type Lang = "en" | "ar";

const T = {
  title:       { en: "Choose Your Plan",                     ar: "اختر خطتك" },
  subtitle:    { en: "Start your Prime Fit journey",         ar: "ابدأ رحلتك مع Prime Fit" },
  monthly:     { en: "Monthly",                              ar: "شهري" },
  yearly:      { en: "Yearly",                               ar: "سنوي" },
  save:        { en: "Save 17%",                             ar: "وفر 17%" },
  free:        { en: "Free",                                 ar: "مجاني" },
  trialDays:   { en: "7 days free",                          ar: "7 أيام مجاناً" },
  trialNote:   { en: "No credit card required",              ar: "لا حاجة لبطاقة ائتمان" },
  selectPlan:  { en: "Select & Continue",                    ar: "اختر وتابع" },
  selectFree:  { en: "Start Free Trial",                     ar: "ابدأ التجربة المجانية" },
  perMonth:    { en: "/mo",                                  ar: "/شهر" },
  perYear:     { en: "/yr",                                  ar: "/سنة" },
  loginLink:   { en: "Already have an account? Login",       ar: "لديك حساب؟ سجل دخول" },
  billingNote: { en: "Prices in Kuwaiti Dinar (KWD). Secure payment via MyFatoorah.", ar: "الأسعار بالدينار الكويتي. دفع آمن عبر MyFatoorah." },
};

const PLANS = [
  {
    id: "free" as SelectedPlan,
    icon: Star,
    nameEn: "Free Trial",
    nameAr: "تجربة مجانية",
    descEn: "7 days full access — no payment needed",
    descAr: "7 أيام وصول كامل — بدون دفع",
    monthly: 0,
    yearly: 0,
    color: "#64748b",
    features: [
      { en: "Workout tracking",    ar: "تتبع التمارين" },
      { en: "Exercise library",    ar: "مكتبة التمارين" },
      { en: "Workout guide",       ar: "دليل التمارين" },
      { en: "Session history",     ar: "سجل الجلسات" },
      { en: "7 days full access",  ar: "7 أيام وصول كامل" },
    ],
  },
  {
    id: "prime_plus" as SelectedPlan,
    icon: Zap,
    nameEn: "Prime Plus",
    nameAr: "برايم بلس",
    descEn: "Full access with AI coaching",
    descAr: "وصول كامل مع المدرب الذكي",
    monthly: 2.626,
    yearly: 25.354,
    color: NAVY,
    popular: true,
    features: [
      { en: "Everything in Free",       ar: "كل شيء في المجاني" },
      { en: "AI personal coach",        ar: "مدرب شخصي بالذكاء الاصطناعي" },
      { en: "Community access",         ar: "الوصول للمجتمع" },
      { en: "Advanced stats",           ar: "إحصائيات متقدمة" },
      { en: "Daily check-ins",          ar: "تسجيل يومي" },
    ],
  },
  {
    id: "prime_pro" as SelectedPlan,
    icon: Crown,
    nameEn: "Prime Pro",
    nameAr: "برايم برو",
    descEn: "Everything + priority support",
    descAr: "كل شيء + دعم أولوية",
    monthly: 4.646,
    yearly: 45.556,
    color: GOLD,
    features: [
      { en: "Everything in Plus",           ar: "كل شيء في بلس" },
      { en: "Priority support",             ar: "دعم أولوية" },
      { en: "Custom programs",              ar: "برامج مخصصة" },
      { en: "Early access to features",     ar: "وصول مبكر للميزات الجديدة" },
    ],
  },
];

interface PricingSelectorProps {
  onPlanSelected: (plan: SelectedPlan, period: SelectedPeriod) => void;
}

export default function PricingSelector({ onPlanSelected }: PricingSelectorProps) {
  const [lang, setLang] = useState<Lang>("ar");
  const [period, setPeriod] = useState<SelectedPeriod>("monthly");
  const [highlighted, setHighlighted] = useState<SelectedPlan | null>(null);

  const t = (key: keyof typeof T) => T[key][lang];
  const isRTL = lang === "ar";

  const handleSelect = (planId: SelectedPlan) => {
    onPlanSelected(planId, period);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        fontFamily: isRTL ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_URL} alt="Prime Fit" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: "white", padding: 4 }} />
            <span style={{ color: "white", fontWeight: 900, fontSize: 18 }}>Prime Fit</span>
          </div>
          <button
            onClick={() => setLang(l => l === "ar" ? "en" : "ar")}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", color: "white", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
          >
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 900, margin: "0 0 8px" }}>{t("title")}</h1>
          <p style={{ color: SKY_LIGHT, fontSize: 15, margin: 0 }}>{t("subtitle")}</p>
        </div>

        {/* Period toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, display: "flex", gap: 4 }}>
            {(["monthly", "yearly"] as SelectedPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  border: "none", borderRadius: 10, padding: "8px 20px", cursor: "pointer",
                  background: period === p ? "white" : "transparent",
                  color: period === p ? NAVY : "white",
                  fontWeight: 700, fontSize: 14, transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                {t(p)}
                {p === "yearly" && (
                  <span style={{ marginInlineStart: 6, background: GREEN, color: "white", borderRadius: 6, padding: "2px 6px", fontSize: 10 }}>
                    {t("save")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => {
            const Icon  = plan.icon;
            const price = period === "monthly" ? plan.monthly : plan.yearly;
            const isSelected = highlighted === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setHighlighted(plan.id)}
                style={{
                  background: "white",
                  borderRadius: 20,
                  padding: "28px 24px",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${plan.color}, 0 12px 40px rgba(27,46,94,0.35)`
                    : plan.popular
                      ? `0 12px 40px rgba(27,46,94,0.35)`
                      : "0 4px 16px rgba(0,0,0,0.12)",
                  border: plan.popular ? `2.5px solid ${NAVY}` : "2px solid transparent",
                  position: "relative",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, transform 0.15s",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: NAVY, color: "white", borderRadius: 20, padding: "4px 18px",
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{lang === "ar" ? "الأكثر شيوعاً" : "Most Popular"}</span>
                  </div>
                )}

                {/* Plan header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${plan.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={plan.color} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: NAVY }}>
                      {lang === "en" ? plan.nameEn : plan.nameAr}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      {lang === "en" ? plan.descEn : plan.descAr}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20 }}>
                  {price === 0 ? (
                    <div>
                      <span style={{ fontSize: 30, fontWeight: 900, color: NAVY }}>{t("free")}</span>
                      <span style={{ marginInlineStart: 8, background: `${GREEN}18`, color: "#16a34a", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                        {t("trialDays")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 30, fontWeight: 900, color: NAVY }}>{price.toFixed(2)}</span>
                      <span style={{ fontSize: 14, color: "#64748b", marginInlineStart: 4 }}>
                        KWD{period === "monthly" ? t("perMonth") : t("perYear")}
                      </span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151" }}>
                      <Check size={16} color={GREEN} strokeWidth={3} />
                      {lang === "en" ? f.en : f.ar}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={(e) => { e.stopPropagation(); handleSelect(plan.id); }}
                  style={{
                    width: "100%",
                    background: plan.id === "free" ? GREEN : plan.color,
                    color: "white",
                    fontWeight: 700, borderRadius: 12, padding: "12px",
                    fontSize: 15, fontFamily: "inherit",
                    border: "none", cursor: "pointer",
                  }}
                >
                  {plan.id === "free" ? t("selectFree") : t("selectPlan")}
                </Button>

                {plan.id === "free" && (
                  <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, margin: "8px 0 0" }}>
                    {t("trialNote")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Already have account */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={() => onPlanSelected("free", period)}
            style={{
              background: "none", border: "none", color: SKY_LIGHT,
              fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              textDecoration: "underline", fontWeight: 600,
            }}
          >
            {t("loginLink")}
          </button>
        </div>

        {/* Billing note */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 20 }}>
          {t("billingNote")}
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
