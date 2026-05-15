/**
 * Pricing — Prime Fit subscription plans
 * Arabic RTL + English · MyFatoorah checkout · 7-day free trial
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../contexts/SubscriptionContext";

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY    = "#0D1B2A";
const NAVY2   = "#1B2E5E";
const CYAN    = "#00E5FF";
const ORANGE  = "#FF6B35";
const GOLD    = "#FFD700";
const GREEN   = "#22C55E";
const CARD    = "#111827";
const CARD2   = "#1F2937";
const TEXT    = "#F9FAFB";
const MUTED   = "#9CA3AF";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  title:        { ar: "اختر خطتك", en: "Choose Your Plan" },
  subtitle:     { ar: "انضم إلى آلاف المتدربين في Prime Fit", en: "Join thousands of athletes on Prime Fit" },
  monthly:      { ar: "شهري", en: "Monthly" },
  yearly:       { ar: "سنوي", en: "Yearly" },
  save:         { ar: "وفّر 30%", en: "Save 30%" },
  perMonth:     { ar: "/شهر", en: "/mo" },
  perYear:      { ar: "/سنة", en: "/yr" },
  free:         { ar: "مجاناً", en: "Free" },
  trialBanner:  { ar: "🔥 جرّب Prime Pro مجاناً 7 أيام — بدون بطاقة ائتمان", en: "🔥 Try Prime Pro free for 7 days — No credit card needed" },
  startTrial:   { ar: "ابدأ التجربة المجانية", en: "Start Free Trial" },
  subscribe:    { ar: "اشترك الآن", en: "Subscribe Now" },
  current:      { ar: "خطتك الحالية", en: "Current Plan" },
  upgrade:      { ar: "ترقية", en: "Upgrade" },
  popular:      { ar: "الأكثر شيوعاً", en: "Most Popular" },
  bestValue:    { ar: "أفضل قيمة", en: "Best Value" },
  cancelAnytime:{ ar: "إلغاء في أي وقت", en: "Cancel anytime" },
  billingHistory:{ ar: "سجل الفواتير", en: "Billing History" },
  noBilling:    { ar: "لا توجد فواتير بعد", en: "No billing records yet" },
  activeTrial:  { ar: "تجربة مجانية نشطة", en: "Active Free Trial" },
  trialEnds:    { ar: "تنتهي في", en: "Ends" },
  activeUntil:  { ar: "نشط حتى", en: "Active until" },
  features: {
    workoutTracking:   { ar: "تتبع التمارين", en: "Workout Tracking" },
    basicStats:        { ar: "إحصائيات أساسية", en: "Basic Stats" },
    exerciseLibrary:   { ar: "مكتبة التمارين", en: "Exercise Library" },
    advancedAnalytics: { ar: "تحليلات متقدمة", en: "Advanced Analytics" },
    challenges:        { ar: "التحديات", en: "Challenges" },
    premiumCommunity:  { ar: "مجتمع مميز", en: "Premium Community" },
    aiCoach:           { ar: "مدرب AI شخصي", en: "Personal AI Coach" },
  },
};

const t = (key: keyof typeof T, lang: string) =>
  (T[key] as Record<string, string>)[lang] ?? (T[key] as Record<string, string>)["en"];

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({ feature, lang, included }: { feature: string; lang: string; included: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      <span style={{ fontSize: 16, flexShrink: 0, color: included ? GREEN : MUTED }}>
        {included ? "✓" : "✗"}
      </span>
      <span style={{ fontSize: 13, color: included ? TEXT : MUTED }}>
        {t(`features.${feature}` as any, lang) ?? feature}
      </span>
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan, lang, period, currentPlan, onSubscribe, onTrial, isLoading,
}: {
  plan: any; lang: string; period: "monthly" | "yearly";
  currentPlan: string; onSubscribe: (plan: string) => void;
  onTrial: () => void; isLoading: boolean;
}) {
  const isCurrent  = currentPlan === plan.id;
  const isPro      = plan.id === "prime_pro";
  const isPlus     = plan.id === "prime_plus";
  const isFree     = plan.id === "free";
  const price      = period === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const nameAr     = plan.nameAr;
  const nameEn     = plan.nameEn;
  const name       = lang === "ar" ? nameAr : nameEn;

  const accentColor = isPro ? GOLD : isPlus ? CYAN : MUTED;

  return (
    <div style={{
      background: isPro ? `linear-gradient(135deg, ${NAVY2}, #2A1F5E)` : CARD,
      border: `2px solid ${isCurrent ? GREEN : isPro ? GOLD : accentColor + "44"}`,
      borderRadius: 20,
      padding: "24px 20px",
      position: "relative",
      flex: "1 1 280px",
      maxWidth: 320,
      display: "flex",
      flexDirection: "column",
      boxShadow: isPro ? `0 8px 32px ${GOLD}22` : "none",
      transition: "transform 0.2s",
    }}>
      {/* Badge */}
      {isPro && !isCurrent && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${GOLD}, #FFA500)`,
          color: NAVY, borderRadius: 20, padding: "4px 14px",
          fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
        }}>
          {period === "yearly" ? t("bestValue", lang) : t("popular", lang)}
        </div>
      )}
      {isCurrent && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: GREEN, color: "white", borderRadius: 20, padding: "4px 14px",
          fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
        }}>✓ {t("current", lang)}</div>
      )}

      {/* Plan name */}
      <h3 style={{ margin: "0 0 4px", color: accentColor, fontSize: 20, fontWeight: 900 }}>
        {name}
      </h3>

      {/* Price */}
      <div style={{ margin: "12px 0 20px", display: "flex", alignItems: "baseline", gap: 4 }}>
        {isFree ? (
          <span style={{ fontSize: 32, fontWeight: 900, color: TEXT }}>{t("free", lang)}</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: MUTED, alignSelf: "flex-start", marginTop: 6 }}>
              {plan.currency}
            </span>
            <span style={{ fontSize: 36, fontWeight: 900, color: TEXT }}>{price}</span>
            <span style={{ fontSize: 12, color: MUTED }}>
              {period === "yearly" ? t("perYear", lang) : t("perMonth", lang)}
            </span>
          </>
        )}
      </div>

      {/* Features */}
      <div style={{ flex: 1, marginBottom: 20 }}>
        {Object.entries(plan.features).map(([key, val]) => (
          <FeatureRow key={key} feature={key} lang={lang} included={val as boolean} />
        ))}
      </div>

      {/* CTA */}
      {isCurrent ? (
        <div style={{ textAlign: "center", color: GREEN, fontSize: 13, fontWeight: 700, padding: "10px 0" }}>
          ✓ {t("current", lang)}
        </div>
      ) : isFree ? (
        <button
          onClick={onTrial}
          disabled={isLoading}
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${GOLD}, #FFA500)`,
            color: NAVY, border: "none", borderRadius: 12,
            padding: "12px", fontSize: 13, fontWeight: 900,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          🎁 {t("startTrial", lang)}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isPro && currentPlan === "free" && (
            <button
              onClick={onTrial}
              disabled={isLoading}
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #FFA500)`,
                color: NAVY, border: "none", borderRadius: 12,
                padding: "12px", fontSize: 13, fontWeight: 900, cursor: "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              🎁 {t("startTrial", lang)}
            </button>
          )}
          <button
            onClick={() => onSubscribe(plan.id)}
            disabled={isLoading}
            style={{
              background: isPro
                ? `linear-gradient(135deg, ${GOLD}CC, #FFA500CC)`
                : `linear-gradient(135deg, ${CYAN}CC, #00B8CCCC)`,
              color: NAVY, border: "none", borderRadius: 12,
              padding: "12px", fontSize: 14, fontWeight: 900,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {t("subscribe", lang)} →
          </button>
          <p style={{ textAlign: "center", color: MUTED, fontSize: 10, margin: 0 }}>
            {t("cancelAnytime", lang)}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Billing History ───────────────────────────────────────────────────────────
function BillingHistory({ lang }: { lang: string }) {
  const { data: history } = trpc.subscription.getBillingHistory.useQuery();
  if (!history?.length) return (
    <p style={{ color: MUTED, textAlign: "center", fontSize: 13 }}>{t("billingHistory", lang)}: {t("noBilling", lang)}</p>
  );
  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: TEXT, fontWeight: 800, margin: "0 0 12px" }}>🧾 {t("billingHistory", lang)}</h3>
      {history.map((r: any) => (
        <div key={r.id} style={{
          background: CARD2, borderRadius: 12, padding: "12px 16px",
          marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>
              {r.plan === "prime_pro" ? (lang === "ar" ? "برايم برو" : "Prime Pro") : (lang === "ar" ? "برايم بلس" : "Prime Plus")}
              {" · "}{r.period === "yearly" ? t("yearly", lang) : t("monthly", lang)}
            </p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
              {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-US")}
            </p>
          </div>
          <div style={{ textAlign: "end" }}>
            <p style={{ color: r.status === "paid" ? GREEN : ORANGE, fontWeight: 800, fontSize: 14, margin: "0 0 2px" }}>
              {r.currency} {r.amount}
            </p>
            <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>
              {r.status === "paid" ? "✓" : "✗"} {r.invoice_id}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Pricing Page ─────────────────────────────────────────────────────────
export default function Pricing() {
  const { lang, isRTL } = useLanguage();
  const sub             = useSubscription();
  const utils           = trpc.useUtils();

  const [period, setPeriod]   = useState<"monthly" | "yearly">("monthly");
  const [statusMsg, setStatus] = useState("");
  const [errorMsg, setError]   = useState("");

  const [trialKey, setTrialKey]       = useState<string | null>(null);

  const { data: plans }     = trpc.subscription.getPlans.useQuery();
  const startFreeTrial      = trpc.subscription.startFreeTrial.useMutation({
    onSuccess: (d) => {
      setTrialKey(d.licenseKey);
      setStatus(lang === "ar"
        ? `🎉 تجربتك المجانية جاهزة! استخدم الكود أدناه للدخول`
        : `🎉 Your free trial is ready! Use the code below to enter`);
    },
    onError: (e) => setError(e.message),
  });
  const createCheckout      = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { window.location.href = data.paymentUrl; },
    onError: (e) => setError(e.message),
  });

  const isLoading = startFreeTrial.isPending || createCheckout.isPending;

  const handleSubscribe = (planId: string) => {
    setError(""); setTrialKey(null);
    createCheckout.mutate({ plan: planId as any, period, lang: lang as "ar" | "en" });
  };

  const handleTrial = () => {
    setError(""); setTrialKey(null);
    startFreeTrial.mutate();
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      background: NAVY, minHeight: "100vh",
      fontFamily: "Cairo, Tajawal, system-ui, sans-serif",
      padding: "24px 16px 80px",
    }}>

      {/* Trial banner */}
      {sub.plan === "free" && !sub.isTrial && (
        <div style={{
          background: `linear-gradient(135deg, ${GOLD}33, ${ORANGE}22)`,
          border: `1px solid ${GOLD}44`,
          borderRadius: 16, padding: "14px 16px",
          textAlign: "center", marginBottom: 24,
        }}>
          <p style={{ color: GOLD, fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
            {t("trialBanner", lang)}
          </p>
          <button onClick={handleTrial} disabled={isLoading} style={{
            background: `linear-gradient(135deg, ${GOLD}, #FFA500)`,
            color: NAVY, border: "none", borderRadius: 10,
            padding: "10px 24px", fontSize: 13, fontWeight: 900, cursor: "pointer",
          }}>
            🚀 {t("startTrial", lang)}
          </button>
        </div>
      )}

      {/* Active subscription status */}
      {sub.plan !== "free" && (
        <div style={{
          background: CARD2, border: `1px solid ${sub.isTrial ? GOLD : GREEN}44`,
          borderRadius: 16, padding: "14px 16px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ color: sub.isTrial ? GOLD : GREEN, fontWeight: 800, fontSize: 14, margin: "0 0 2px" }}>
              {sub.isTrial ? `⏳ ${t("activeTrial", lang)}` : `✅ ${lang === "ar" ? "اشتراك نشط" : "Active Subscription"}`}
            </p>
            {sub.expiresAt && (
              <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
                {sub.isTrial ? t("trialEnds", lang) : t("activeUntil", lang)}: {new Date(sub.expiresAt).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-US")}
                {sub.daysLeft !== null && sub.daysLeft <= 7 && (
                  <span style={{ color: ORANGE, fontWeight: 700, marginRight: 6 }}>
                    {" "}({sub.daysLeft} {lang === "ar" ? "أيام" : "days left"})
                  </span>
                )}
              </p>
            )}
          </div>
          <span style={{
            background: sub.plan === "prime_pro" ? `${GOLD}22` : `${CYAN}22`,
            color: sub.plan === "prime_pro" ? GOLD : CYAN,
            borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 800,
          }}>
            {sub.plan === "prime_pro" ? (lang === "ar" ? "برايم برو" : "Prime Pro") : (lang === "ar" ? "برايم بلس" : "Prime Plus")}
          </span>
        </div>
      )}

      {/* Header */}
      <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 900, textAlign: "center", margin: "0 0 6px" }}>
        {t("title", lang)}
      </h1>
      <p style={{ color: MUTED, textAlign: "center", fontSize: 13, margin: "0 0 24px" }}>
        {t("subtitle", lang)}
      </p>

      {/* Period toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 28 }}>
        {(["monthly", "yearly"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: "10px 24px", border: "none",
            background: period === p ? CYAN : CARD2,
            color: period === p ? NAVY : MUTED,
            fontWeight: 800, fontSize: 13, cursor: "pointer",
            borderRadius: p === "monthly" ? (isRTL ? "0 12px 12px 0" : "12px 0 0 12px") : (isRTL ? "12px 0 0 12px" : "0 12px 12px 0"),
            fontFamily: "Cairo, sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t(p, lang)}
            {p === "yearly" && (
              <span style={{ background: ORANGE, color: "white", borderRadius: 8, padding: "2px 6px", fontSize: 10, fontWeight: 900 }}>
                {t("save", lang)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div style={{
        display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
        marginBottom: 32,
      }}>
        {(plans ?? []).map((plan: any) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            lang={lang}
            period={period}
            currentPlan={sub.plan}
            onSubscribe={handleSubscribe}
            onTrial={handleTrial}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Trial key display */}
      {trialKey && (
        <div style={{
          background: `${GOLD}22`, border: `2px dashed ${GOLD}`,
          borderRadius: 16, padding: "16px", marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
            {lang === "ar" ? "🔑 كود التفعيل الخاص بك" : "🔑 Your Activation Code"}
          </p>
          <div style={{
            background: NAVY, borderRadius: 10, padding: "10px 16px",
            marginBottom: 8, display: "inline-block",
          }}>
            <span style={{ color: CYAN, fontSize: 20, fontWeight: 900, letterSpacing: 3, fontFamily: "monospace" }}>
              {trialKey}
            </span>
          </div>
          <p style={{ color: MUTED, fontSize: 11, margin: "0 0 10px" }}>
            {lang === "ar"
              ? "ارجع إلى شاشة الدخول وأدخل هذا الكود للبدء"
              : "Go back to the entry screen and enter this code to start"}
          </p>
          <button
            onClick={() => { navigator.clipboard?.writeText(trialKey); }}
            style={{
              background: `${CYAN}22`, border: `1px solid ${CYAN}44`, color: CYAN,
              borderRadius: 8, padding: "6px 16px", fontSize: 12,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📋 {lang === "ar" ? "نسخ الكود" : "Copy Code"}
          </button>
        </div>
      )}

      {/* Status / error */}
      {statusMsg && (
        <div style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}`, borderRadius: 12, padding: "12px 16px", textAlign: "center", color: GREEN, fontWeight: 700, marginBottom: 16 }}>
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 12, padding: "12px 16px", textAlign: "center", color: "#EF4444", fontWeight: 700, marginBottom: 16 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Billing history */}
      <BillingHistory lang={lang} />

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');`}</style>
    </div>
  );
}
