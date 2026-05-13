import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Zap, Star } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

const NAVY = "#1B2E5E";
const SKY = "#7BB8D4";

type Lang = "en" | "ar";

const T = {
  title:        { en: "Choose Your Plan", ar: "اختر خطتك" },
  subtitle:     { en: "Unlock the full Prime Fit experience", ar: "افتح تجربة Prime Fit الكاملة" },
  monthly:      { en: "Monthly", ar: "شهري" },
  yearly:       { en: "Yearly", ar: "سنوي" },
  save:         { en: "Save 17%", ar: "وفر 17%" },
  current:      { en: "Current Plan", ar: "خطتك الحالية" },
  upgrade:      { en: "Upgrade Now", ar: "ترقية الآن" },
  loginFirst:   { en: "Login to Subscribe", ar: "سجل دخول للاشتراك" },
  perMonth:     { en: "/mo", ar: "/شهر" },
  perYear:      { en: "/yr", ar: "/سنة" },
  free:         { en: "Free", ar: "مجاني" },
  backToApp:    { en: "← Back to App", ar: "← العودة للتطبيق" },
  processing:   { en: "Processing...", ar: "جاري المعالجة..." },
  billingNote:  { en: "Prices in Kuwaiti Dinar (KWD). Secure payment via MyFatoorah.", ar: "الأسعار بالدينار الكويتي. دفع آمن عبر MyFatoorah." },
};

const PLANS = [
  {
    id: "free" as const,
    icon: Star,
    nameEn: "Free",
    nameAr: "مجاني",
    descEn: "Get started with basic fitness tracking",
    descAr: "ابدأ بتتبع اللياقة الأساسية",
    monthly: 0,
    yearly: 0,
    color: "#64748b",
    features: [
      { en: "Workout tracking", ar: "تتبع التمارين" },
      { en: "Exercise library", ar: "مكتبة التمارين" },
      { en: "Workout guide", ar: "دليل التمارين" },
      { en: "Session history", ar: "سجل الجلسات" },
    ],
  },
  {
    id: "prime_plus" as const,
    icon: Zap,
    nameEn: "Prime Plus",
    nameAr: "برايم بلس",
    descEn: "Full access with AI coaching",
    descAr: "وصول كامل مع المدرب الذكي",
    monthly: 2.5,
    yearly: 25,
    color: NAVY,
    popular: true,
    features: [
      { en: "Everything in Free", ar: "كل شيء في المجاني" },
      { en: "AI personal coach", ar: "مدرب شخصي بالذكاء الاصطناعي" },
      { en: "Community access", ar: "الوصول للمجتمع" },
      { en: "Advanced stats", ar: "إحصائيات متقدمة" },
      { en: "Daily check-ins", ar: "تسجيل يومي" },
    ],
  },
  {
    id: "prime_pro" as const,
    icon: Crown,
    nameEn: "Prime Pro",
    nameAr: "برايم برو",
    descEn: "Everything + priority support",
    descAr: "كل شيء + دعم أولوية",
    monthly: 4.5,
    yearly: 45,
    color: "#B8860B",
    features: [
      { en: "Everything in Plus", ar: "كل شيء في بلس" },
      { en: "Priority support", ar: "دعم أولوية" },
      { en: "Custom programs", ar: "برامج مخصصة" },
      { en: "Early access to new features", ar: "وصول مبكر للميزات الجديدة" },
    ],
  },
];

export default function Pricing() {
  const [lang, setLang] = useState<Lang>("en");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { plan: currentPlan } = useSubscription();

  const t = (key: keyof typeof T) => T[key][lang];

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.invoiceUrl;
    },
    onError: (err) => {
      alert(err.message);
      setLoadingPlan(null);
    },
  });

  const handleUpgrade = async (planId: "prime_plus" | "prime_pro") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoadingPlan(planId);
    createCheckout.mutate({
      plan: planId,
      period,
      origin: window.location.origin,
    });
  };

  const isRTL = lang === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: isRTL ? "Cairo, sans-serif" : "Inter, sans-serif" }}
    >
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, #0F1E3D 0%, ${NAVY} 100%)`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/">
          <span style={{ color: SKY, fontSize: 14, cursor: "pointer" }}>{t("backToApp")}</span>
        </Link>
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", color: "white", cursor: "pointer", fontSize: 13 }}
        >
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: NAVY, margin: 0 }}>{t("title")}</h1>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 16 }}>{t("subtitle")}</p>

          {/* Period toggle */}
          <div style={{ display: "inline-flex", background: "white", borderRadius: 12, padding: 4, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: period === p ? NAVY : "transparent",
                  color: period === p ? "white" : "#64748b",
                  fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                }}
              >
                {t(p)}
                {p === "yearly" && (
                  <span style={{ marginLeft: 6, background: "#22c55e", color: "white", borderRadius: 6, padding: "2px 6px", fontSize: 11 }}>
                    {t("save")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = period === "monthly" ? plan.monthly : plan.yearly;
            const isCurrent = currentPlan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                style={{
                  background: "white",
                  borderRadius: 20,
                  padding: "28px 24px",
                  boxShadow: isPopular ? `0 8px 32px ${NAVY}22` : "0 2px 12px rgba(0,0,0,0.06)",
                  border: isPopular ? `2px solid ${NAVY}` : "2px solid transparent",
                  position: "relative",
                  transition: "transform 0.2s",
                }}
              >
                {isPopular && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: NAVY, color: "white", borderRadius: 20, padding: "4px 16px", fontSize: 12, fontWeight: 700,
                  }}>
                    ⭐ Most Popular
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${plan.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                    <span style={{ fontSize: 32, fontWeight: 900, color: NAVY }}>{t("free")}</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 900, color: NAVY }}>{price.toFixed(2)}</span>
                      <span style={{ fontSize: 14, color: "#64748b", marginLeft: 4 }}>KWD{period === "monthly" ? t("perMonth") : t("perYear")}</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151" }}>
                      <Check size={16} color="#22c55e" strokeWidth={3} />
                      {lang === "en" ? f.en : f.ar}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{ textAlign: "center", padding: "10px", background: "#f0fdf4", borderRadius: 10, color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                    ✓ {t("current")}
                  </div>
                ) : plan.id === "free" ? null : (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loadingPlan === plan.id}
                    style={{ width: "100%", background: plan.color, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px" }}
                  >
                    {loadingPlan === plan.id ? (
                      <><Loader2 className="animate-spin mr-2" size={16} />{t("processing")}</>
                    ) : (
                      isAuthenticated ? t("upgrade") : t("loginFirst")
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Billing note */}
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 32 }}>
          {t("billingNote")}
        </p>
      </main>
    </div>
  );
}
