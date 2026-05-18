/**
 * Pricing — Prime Fit subscription plans
 * Arabic RTL + English · MyFatoorah checkout · 7-day free trial
 *
 * Free plan  → generates PRIME-XXXX-XXXX key immediately (no payment)
 * Plus / Pro → shows customer info form (name, email, phone) → redirects to MyFatoorah
 * Renewal    → same key extended automatically via Webhook
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, Zap, Star, Copy, CheckCheck, X, User, Mail, Phone } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

// ── Design tokens ──────────────────────────────────────────────────────────
const NAVY      = "#1B2E5E";
const NAVY_DARK = "#0F1E3D";
const SKY       = "#7BB8D4";
const SKY_LIGHT = "#A8D4E8";
const GREEN     = "#22C55E";
const GOLD      = "#F59E0B";

type Lang   = "en" | "ar";
type Period  = "monthly" | "yearly";

// ── Translations ─────────────────────────────────────────────────────────────
const T = {
  title:          { en: "Choose Your Plan",                          ar: "اختر خطتك" },
  subtitle:       { en: "Unlock the full Prime Fit experience",      ar: "افتح تجربة Prime Fit الكاملة" },
  monthly:        { en: "Monthly",                                   ar: "شهري" },
  yearly:         { en: "Yearly",                                    ar: "سنوي" },
  save:           { en: "Save 17%",                                  ar: "وفر 17%" },
  current:        { en: "Current Plan",                              ar: "خطتك الحالية" },
  upgrade:        { en: "Upgrade Now",                               ar: "ترقية الآن" },
  loginFirst:     { en: "Login to Subscribe",                        ar: "سجل دخول للاشتراك" },
  perMonth:       { en: "/mo",                                       ar: "/شهر" },
  perYear:        { en: "/yr",                                       ar: "/سنة" },
  free:           { en: "Free",                                      ar: "مجاني" },
  backToApp:      { en: "← Back to App",                             ar: "← العودة للتطبيق" },
  processing:     { en: "Processing...",                             ar: "جاري المعالجة..." },
  billingNote:    { en: "Prices in Kuwaiti Dinar (KWD). Secure payment via MyFatoorah.", ar: "الأسعار بالدينار الكويتي. دفع آمن عبر MyFatoorah." },
  startTrial:     { en: "Start Free Trial",                          ar: "ابدأ التجربة المجانية" },
  trialDays:      { en: "7 days free",                               ar: "7 أيام مجاناً" },
  trialNote:      { en: "No credit card required",                   ar: "لا حاجة لبطاقة ائتمان" },
  yourKey:        { en: "Your License Key",                          ar: "مفتاح الترخيص الخاص بك" },
  keyNote:        { en: "Copy this key and paste it in the app to activate your 7-day trial.", ar: "انسخ هذا المفتاح والصقه في التطبيق لتفعيل تجربتك المجانية لمدة 7 أيام." },
  copyKey:        { en: "Copy Key",                                  ar: "نسخ المفتاح" },
  copied:         { en: "Copied!",                                   ar: "تم النسخ!" },
  goToApp:        { en: "Go to App & Activate",                      ar: "اذهب للتطبيق وفعّل" },
  renewNote:      { en: "Renewing? Pay again with the same email to extend your existing key automatically.", ar: "تجديد؟ ادفع مرة أخرى بنفس البريد الإلكتروني لتمديد مفتاحك الحالي تلقائياً." },
  // Customer info modal
  orderDetails:   { en: "Complete Your Order",                       ar: "أكمل طلبك" },
  trialDetails:   { en: "Start Your Free Trial",                    ar: "ابدأ تجربتك المجانية" },
  trialSubtitle:  { en: "Enter your details to get your free 7-day key", ar: "أدخل بياناتك للحصول على مفتاحك المجاني لمدة ٧ أيام" },
  orderSubtitle:  { en: "Please fill in your details before proceeding to payment", ar: "يرجى إدخال بياناتك قبل الانتقال للدفع" },
  getMyKey:       { en: "Get My Free Key",                        ar: "احصل على مفتاحي المجاني" },
  keyReady:       { en: "Your Key is Ready!",                        ar: "مفتاحك جاهز!" },
  keyReadyNote:   { en: "Copy this key and paste it in the app to activate your 7-day trial.", ar: "انسخ هذا المفتاح والصقه في التطبيق لتفعيل تجربتك المجانية لمدة 7 أيام." },
  okThanks:       { en: "OK, Thanks!",                               ar: "حسناً، شكراً!" },
  fullName:       { en: "Full Name",                                 ar: "الاسم الكامل" },
  emailAddr:      { en: "Email Address",                             ar: "البريد الإلكتروني" },
  phoneNum:       { en: "Phone Number",                              ar: "رقم الهاتف" },
  namePlaceholder:{ en: "Your full name",                            ar: "اسمك الكامل" },
  emailPlaceholder:{ en: "your@email.com",                           ar: "بريدك@الإلكتروني.com" },
  phonePlaceholder:{ en: "+965 XXXX XXXX",                           ar: "+965 XXXX XXXX" },
  proceedPayment: { en: "Proceed to Payment",                        ar: "المتابعة للدفع" },
  cancel:         { en: "Cancel",                                    ar: "إلغاء" },
  nameRequired:   { en: "Name is required",                          ar: "الاسم مطلوب" },
  emailRequired:  { en: "Valid email is required",                   ar: "البريد الإلكتروني مطلوب" },
  phoneRequired:  { en: "Phone number is required",                  ar: "رقم الهاتف مطلوب" },
  orderSummary:   { en: "Order Summary",                             ar: "ملخص الطلب" },
};

// ── Plans data ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free" as const,
    icon: Star,
    nameEn: "Free Trial",
    nameAr: "تجربة مجانية",
    descEn: "7 days full access — no payment needed",
    descAr: "7 أيام وصول كامل — بدون دفع",
    monthly: 0,
    yearly: 0,
    color: "#64748b",
    features: [
      { en: "Workout tracking",          ar: "تتبع التمارين" },
      { en: "Exercise library",          ar: "مكتبة التمارين" },
      { en: "Workout guide",             ar: "دليل التمارين" },
      { en: "Session history",           ar: "سجل الجلسات" },
      { en: "7 days full access",        ar: "7 أيام وصول كامل" },
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
      { en: "Everything in Free",        ar: "كل شيء في المجاني" },
      { en: "AI personal coach",         ar: "مدرب شخصي بالذكاء الاصطناعي" },
      { en: "Community access",          ar: "الوصول للمجتمع" },
      { en: "Advanced stats",            ar: "إحصائيات متقدمة" },
      { en: "Daily check-ins",           ar: "تسجيل يومي" },
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
    color: GOLD,
    features: [
      { en: "Everything in Plus",        ar: "كل شيء في بلس" },
      { en: "Priority support",          ar: "دعم أولوية" },
      { en: "Custom programs",           ar: "برامج مخصصة" },
      { en: "Early access to features",  ar: "وصول مبكر للميزات الجديدة" },
    ],
  },
];

// ── Input field component ─────────────────────────────────────────────────────
function InfoField({
  icon: Icon, label, placeholder, value, onChange, type = "text", error, isRTL,
}: {
  icon: React.ElementType; label: string; placeholder: string;
  value: string; onChange: (v: string) => void; type?: string;
  error?: string; isRTL: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
        {label} <span style={{ color: "#EF4444" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          [isRTL ? "right" : "left"]: 12, color: "#94a3b8", pointerEvents: "none",
        }}>
          <Icon size={16} />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1.5px solid ${error ? "#EF4444" : "#CBD5E1"}`,
            borderRadius: 10, padding: isRTL ? "11px 40px 11px 12px" : "11px 12px 11px 40px",
            fontSize: 14, fontFamily: "inherit", color: NAVY, outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = NAVY; }}
          onBlur={e => { e.target.style.borderColor = error ? "#EF4444" : "#CBD5E1"; }}
        />
      </div>
      {error && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0", fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

export default function Pricing() {
  const [lang, setLang] = useState<Lang>("ar");
  const [period, setPeriod] = useState<Period>("monthly");
  const [copied, setCopied] = useState(false);

  // Free trial form state
  const [trialName, setTrialName]         = useState("");
  const [trialEmail, setTrialEmail]       = useState("");
  const [trialKey, setTrialKey]           = useState<string | null>(null);
  const [trialExpiry, setTrialExpiry]     = useState<Date | null>(null);
  const [trialError, setTrialError]       = useState("");
  const [showTrialForm, setShowTrialForm] = useState(false);

  // Customer info modal state (for paid plans)
  const [showInfoModal, setShowInfoModal]   = useState(false);
  const [showKeyPopup, setShowKeyPopup]       = useState(false);
  const [selectedPlan, setSelectedPlan]     = useState<"prime_plus" | "prime_pro" | "free" | null>(null);
  const [custName, setCustName]             = useState("");
  const [custEmail, setCustEmail]           = useState("");
  const [custPhone, setCustPhone]           = useState("");
  const [custNameErr, setCustNameErr]       = useState("");
  const [custEmailErr, setCustEmailErr]     = useState("");
  const [custPhoneErr, setCustPhoneErr]     = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { plan: currentPlan } = useSubscription();

  const t = (key: keyof typeof T) => T[key][lang];
  const isRTL = lang === "ar";

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { window.location.href = data.invoiceUrl; },
    onError: (err) => {
      alert(err.message);
      setCheckoutLoading(false);
    },
  });

  const startFreeTrial = trpc.subscription.startFreeTrial.useMutation();

  // Open the customer info modal — used for both free trial and paid plans
  const handleUpgradeClick = (planId: "prime_plus" | "prime_pro" | "free") => {
    setSelectedPlan(planId as any);
    // Pre-fill with user data if available
    setCustName(user?.name ?? "");
    setCustEmail(user?.email ?? "");
    setCustPhone("");
    setCustNameErr(""); setCustEmailErr(""); setCustPhoneErr("");
    setShowInfoModal(true);
  };

  // Validate and submit the customer info form (free trial or paid plan)
  const handleProceedToPayment = async () => {
    let valid = true;
    if (!custName.trim()) { setCustNameErr(t("nameRequired")); valid = false; } else setCustNameErr("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!custEmail.trim() || !emailRegex.test(custEmail.trim())) { setCustEmailErr(t("emailRequired")); valid = false; } else setCustEmailErr("");
    if (!custPhone.trim()) { setCustPhoneErr(t("phoneRequired")); valid = false; } else setCustPhoneErr("");
    if (!valid || !selectedPlan) return;

    setCheckoutLoading(true);
    if ((selectedPlan as string) === "free") {
      // Free trial — generate key immediately
      try {
        const result = await startFreeTrial.mutateAsync({
          customerName: custName.trim(),
          customerEmail: custEmail.trim(),
          customerPhone: custPhone.trim(),
        });
        setTrialKey(result.licenseKey);
        setTrialExpiry(result.expiresAt);
        setShowInfoModal(false);
        setShowKeyPopup(true);
      } catch (err: any) {
        setTrialError(err?.message ?? "حدث خطأ. يرجى المحاولة مرة أخرى.");
      } finally {
        setCheckoutLoading(false);
      }
    } else {
      createCheckout.mutate({
        plan: selectedPlan! as "prime_plus" | "prime_pro",
        period,
        origin: window.location.origin,
        customerName: custName.trim(),
        customerEmail: custEmail.trim(),
        customerPhone: custPhone.trim(),
      });
    }
  };

  const handleStartTrial = async () => {
    setTrialError("");
    try {
      const result = await startFreeTrial.mutateAsync({
        customerName:  trialName.trim() || "Prime Fit User",
        customerEmail: trialEmail.trim() || "trial@primefit.app",
      });
      setTrialKey(result.licenseKey);
      setTrialExpiry(result.expiresAt);
    } catch (err: any) {
      setTrialError(err?.message ?? "حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleCopy = () => {
    if (!trialKey) return;
    navigator.clipboard.writeText(trialKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get plan display name
  const getPlanName = (planId: "prime_plus" | "prime_pro" | "free" | null) => {
    const plan = PLANS.find(p => p.id === planId);
    return lang === "ar" ? plan?.nameAr : plan?.nameEn;
  };
  const getPlanPrice = (planId: "prime_plus" | "prime_pro" | "free" | null) => {
    const plan = PLANS.find(p => p.id === planId);
    return plan ? (period === "monthly" ? plan.monthly : plan.yearly) : 0;
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
      {/* ── Key Ready Popup (after free trial generation) ─────────────────── */}
      {showKeyPopup && trialKey && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "white", borderRadius: 24, padding: "32px 28px",
            width: "100%", maxWidth: 420, textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            animation: "slideUp 0.25s ease",
          }}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: NAVY }}>
              {t("keyReady")}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              {t("keyReadyNote")}
            </p>

            {/* Key display */}
            <div style={{
              background: `${NAVY}08`, border: `2px solid ${SKY_LIGHT}`,
              borderRadius: 14, padding: "16px 20px", marginBottom: 8,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <span style={{
                fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: NAVY,
                letterSpacing: "0.08em", flex: 1, textAlign: "center",
              }}>
                {trialKey}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? GREEN : NAVY, color: "white", border: "none",
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700,
                  transition: "background 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                {copied ? t("copied") : t("copyKey")}
              </button>
            </div>

            {trialExpiry && (
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 12 }}>
                {lang === "ar" ? "تاريخ الانتهاء:" : "Expires:"} <strong>{new Date(trialExpiry).toLocaleDateString()}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowKeyPopup(false)}
                style={{
                  flex: 1, background: NAVY, color: "white", border: "none",
                  borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("okThanks")}
              </button>
              <Link href="/">
                <span style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  background: SKY, color: "white", borderRadius: 12, padding: "12px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textDecoration: "none",
                }}>
                  {t("goToApp")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Info Modal ───────────────────────────────────────────── */}
      {showInfoModal && selectedPlan && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "white", borderRadius: 24, padding: "32px 28px",
            width: "100%", maxWidth: 440, position: "relative",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            animation: "slideUp 0.25s ease",
          }}>
            {/* Close button */}
            <button
              onClick={() => { setShowInfoModal(false); setCheckoutLoading(false); }}
              style={{
                position: "absolute", top: 16, [isRTL ? "left" : "right"]: 16,
                background: "#F1F5F9", border: "none", borderRadius: 8,
                width: 32, height: 32, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} color="#64748b" />
            </button>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: NAVY }}>
                {(selectedPlan as string) === "free" ? t("trialDetails") : t("orderDetails")}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {(selectedPlan as string) === "free" ? t("trialSubtitle") : t("orderSubtitle")}
              </p>
            </div>

            {/* Order summary */}
            <div style={{
              background: `${NAVY}08`, border: `1.5px solid ${SKY_LIGHT}`,
              borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {t("orderSummary")}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>
                  Prime Fit {getPlanName(selectedPlan)}
                </span>
                <span style={{ fontWeight: 900, color: NAVY, fontSize: 16 }}>
                  {(selectedPlan as string) === "free"
                    ? (lang === "ar" ? "مجاناً — ٧ أيام" : "Free — 7 days")
                    : `${getPlanPrice(selectedPlan).toFixed(2)} KWD`}
                  {(selectedPlan as string) !== "free" && (
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                      {period === "monthly" ? t("perMonth") : t("perYear")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Form fields */}
            <InfoField
              icon={User} label={t("fullName")} placeholder={t("namePlaceholder")}
              value={custName} onChange={setCustName} error={custNameErr} isRTL={isRTL}
            />
            <InfoField
              icon={Mail} label={t("emailAddr")} placeholder={t("emailPlaceholder")}
              value={custEmail} onChange={setCustEmail} type="email" error={custEmailErr} isRTL={isRTL}
            />
            <InfoField
              icon={Phone} label={t("phoneNum")} placeholder={t("phonePlaceholder")}
              value={custPhone} onChange={setCustPhone} type="tel" error={custPhoneErr} isRTL={isRTL}
            />

            {/* Error message for free trial */}
            {trialError && (selectedPlan as string) === "free" && (
              <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>{trialError}</p>
            )}

            {/* Submit */}
            <Button
              onClick={handleProceedToPayment}
              disabled={checkoutLoading}
              style={{
                width: "100%",
                background: (selectedPlan as string) === "free" ? GREEN : NAVY,
                color: "white",
                fontWeight: 700, borderRadius: 12, padding: "13px",
                fontSize: 15, fontFamily: "inherit", marginTop: 4,
              }}
            >
              {checkoutLoading
                ? <><Loader2 className="animate-spin mr-2" size={16} />{t("processing")}</>
                : (selectedPlan as string) === "free"
                  ? t("getMyKey")
                  : t("proceedPayment")}
            </Button>

            <button
              onClick={() => { setShowInfoModal(false); setCheckoutLoading(false); }}
              style={{
                width: "100%", background: "none", border: "none",
                color: "#94a3b8", fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", marginTop: 10, padding: "6px",
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Link href="/">
            <span style={{ color: SKY_LIGHT, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>{t("backToApp")}</span>
          </Link>
          <button
            onClick={() => setLang(l => l === "ar" ? "en" : "ar")}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", color: "white", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
          >
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ color: "white", fontSize: 30, fontWeight: 900, margin: "0 0 8px" }}>{t("title")}</h1>
          <p style={{ color: SKY_LIGHT, fontSize: 15, margin: 0 }}>{t("subtitle")}</p>
        </div>

        {/* Period toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, display: "flex", gap: 4 }}>
            {(["monthly", "yearly"] as Period[]).map(p => (
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
            const Icon    = plan.icon;
            const price   = period === "monthly" ? plan.monthly : plan.yearly;
            const isCurrent = currentPlan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                style={{
                  background: "white",
                  borderRadius: 20,
                  padding: "28px 24px",
                  boxShadow: isPopular ? `0 12px 40px rgba(27,46,94,0.35)` : "0 4px 16px rgba(0,0,0,0.12)",
                  border: isPopular ? `2.5px solid ${NAVY}` : "2px solid transparent",
                  position: "relative",
                  transition: "transform 0.2s",
                }}
              >
                {isPopular && (
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

                {/* ── CTA: Current plan ── */}
                {isCurrent ? (
                  /* For free plan: show clickable button to generate key; for paid: show static badge */
                  plan.id === "free" ? (
                    trialKey ? (
                      /* Already generated — show static badge */
                      <div style={{ textAlign: "center", padding: "10px", background: "#f0fdf4", borderRadius: 10, color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                        t("current")
                      </div>
                    ) : (
                      /* Not yet generated — show clickable button */
                      <div>
                        {trialError && (
                          <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>{trialError}</p>
                        )}
                        <Button
                          onClick={() => handleUpgradeClick("free")}
                          style={{ width: "100%", background: GREEN, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px", fontFamily: "inherit" }}
                        >
                          {t("startTrial")}
                        </Button>
                        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, margin: "8px 0 0" }}>
                          {t("trialNote")}
                        </p>
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px", background: "#f0fdf4", borderRadius: 10, color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                      t("current")
                    </div>
                  )

                /* ── CTA: Free plan (not current) ── */
                ) : plan.id === "free" ? (
                  <>
                    {trialKey ? (
                      /* Key display after successful trial generation */
                      <div style={{ background: "#F0FDF4", borderRadius: 14, padding: 16, border: `1.5px solid ${GREEN}44` }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#166534", fontSize: 13 }}>
                          {t("yourKey")}
                        </p>
                        <div style={{
                          background: "white", borderRadius: 10, padding: "10px 14px",
                          fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: NAVY,
                          letterSpacing: "0.08em", textAlign: "center", marginBottom: 10,
                          border: `1.5px solid ${SKY_LIGHT}`,
                        }}>
                          {trialKey}
                        </div>
                        <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                          {t("keyNote")}
                          {trialExpiry && (
                            <> · {lang === "ar" ? "ينتهي في" : "Expires"}: <strong>{new Date(trialExpiry).toLocaleDateString()}</strong></>
                          )}
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={handleCopy}
                            style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              background: copied ? GREEN : NAVY, color: "white", border: "none",
                              borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s",
                            }}
                          >
                            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                            {copied ? t("copied") : t("copyKey")}
                          </button>
                          <Link href="/">
                            <span style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                              background: SKY, color: "white", textDecoration: "none",
                              borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700,
                              fontFamily: "inherit", cursor: "pointer",
                            }}>
                              {t("goToApp")}
                            </span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Start trial button — opens same info modal as paid plans */
                      <div>
                        {trialError && (
                          <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>{trialError}</p>
                        )}
                        <Button
                          onClick={() => handleUpgradeClick("free")}
                          style={{ width: "100%", background: GREEN, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px", fontFamily: "inherit" }}
                        >
                          {t("startTrial")}
                        </Button>
                        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, margin: "8px 0 0" }}>
                          {t("trialNote")}
                        </p>
                      </div>
                    )}
                  </>

                /* ── CTA: Paid plans ── */
                ) : (
                  <Button
                    onClick={() => handleUpgradeClick(plan.id as "prime_plus" | "prime_pro")}
                    style={{ width: "100%", background: plan.color, color: "white", fontWeight: 700, borderRadius: 12, padding: "12px", fontFamily: "inherit" }}
                  >
                    {isAuthenticated ? t("upgrade") : t("loginFirst")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Renewal note */}
        <div style={{ marginTop: 28, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 20px", textAlign: "center" }}>
          <p style={{ color: SKY_LIGHT, fontSize: 13, margin: 0 }}>
            {t("renewNote")}
          </p>
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
