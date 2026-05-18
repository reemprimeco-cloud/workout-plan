import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, XCircle, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

const NAVY = "#1B2E5E";
const SKY = "#7BB8D4";

export function SubscriptionSuccess() {
  const [copied, setCopied] = useState(false);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "Cairo, sans-serif" : "Inter, system-ui, sans-serif";

  // MyFatoorah appends ?paymentId=xxx to the CallBackUrl automatically
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("paymentId") ?? undefined;
  const invoiceId = params.get("invoiceId") ?? undefined;

  // Poll for the license key — the Webhook may take a few seconds to fire
  const [pollEnabled, setPollEnabled] = useState(true);
  const { data, isLoading } = trpc.subscription.getKeyByInvoice.useQuery(
    { paymentId, invoiceId },
    {
      enabled: pollEnabled && !!(paymentId || invoiceId),
      refetchInterval: (query) => {
        if (query.state.data?.licenseKey) return false;
        return 3000;
      },
      retry: 10,
    }
  );

  const licenseKey = data?.licenseKey ?? null;

  // Stop polling after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPollEnabled(false), 30_000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "#F0F4F8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          padding: "48px 36px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <CheckCircle size={64} color="#22c55e" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>
          {isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          {isAr
            ? 'شكراً لاشتراكك في Prime Fit. كود التفعيل الخاص بك جاهز أدناه وقد أُرسل أيضاً إلى بريدك الإلكتروني.'
            : 'Thank you for subscribing to Prime Fit. Your activation code is ready below and has also been sent to your email.'}
        </p>

        {/* License Key Box */}
        {isLoading || (!licenseKey && pollEnabled && !!(paymentId || invoiceId)) ? (
          <div
            style={{
              background: "#F8FBFF",
              border: `2px dashed ${SKY}`,
              borderRadius: 16,
              padding: "28px 20px",
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2 size={28} color={SKY} className="animate-spin" />
            <p style={{ color: "#7A9BB5", fontSize: 13, margin: 0 }}>
              {isAr ? 'جاري تجهيز كود التفعيل...' : 'Preparing your activation code...'}
            </p>
          </div>
        ) : licenseKey ? (
          <div
            style={{
              background: `linear-gradient(135deg, ${NAVY}, #0F1E3D)`,
              border: `2px dashed ${SKY}`,
              borderRadius: 16,
              padding: "24px 20px",
              marginBottom: 24,
            }}
          >
            <p style={{ color: "#9CA3AF", fontSize: 11, margin: "0 0 8px", letterSpacing: "1px", textTransform: "uppercase" }}>
              {isAr ? 'كود التفعيل' : 'Activation Code'}
            </p>
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 10,
                padding: "14px 20px",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  color: "#00E5FF",
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: "3px",
                  fontFamily: "monospace",
                }}
              >
                {licenseKey}
              </span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "#22c55e" : SKY,
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s",
                fontFamily,
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy Code')}
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#FFF7ED",
              border: "1.5px solid #FED7AA",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}
          >
            <p style={{ color: "#92400E", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              {isAr ? (
                <>سيصلك كود التفعيل على بريدك الإلكتروني خلال دقائق. إذا لم يصلك، تواصل معنا على{" "}
                  <a href="https://wa.me/96565068000" style={{ color: "#D97706", fontWeight: 700 }}>واتساب</a>.</>
              ) : (
                <>Your activation code will be sent to your email within minutes. If you don't receive it, contact us on{" "}
                  <a href="https://wa.me/96565068000" style={{ color: "#D97706", fontWeight: 700 }}>WhatsApp</a>.</>
              )}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div
          style={{
            background: "#F0F9FF",
            borderRadius: 12,
            padding: "16px",
            marginBottom: 24,
            textAlign: isAr ? "right" : "left",
          }}
        >
          <p style={{ color: NAVY, fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>
            {isAr ? 'كيفية الاستخدام:' : 'How to use:'}
          </p>
          <ol style={{ color: "#64748b", fontSize: 12, lineHeight: 2, margin: 0, paddingRight: isAr ? 16 : 0, paddingLeft: isAr ? 0 : 16 }}>
            {isAr ? (
              <>
                <li>افتح تطبيق Prime Fit</li>
                <li>اضغط على "لدي كود تفعيل"</li>
                <li>أدخل الكود أعلاه وابدأ فوراً</li>
              </>
            ) : (
              <>
                <li>Open the Prime Fit app</li>
                <li>Tap "I have an activation code"</li>
                <li>Enter the code above and start immediately</li>
              </>
            )}
          </ol>
        </div>

        <Link href="/">
          <Button
            style={{
              background: NAVY,
              color: "white",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 32px",
              fontFamily,
              width: "100%",
            }}
          >
            {isAr ? 'الذهاب إلى التطبيق' : 'Go to App'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function SubscriptionError() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const fontFamily = isAr ? "Cairo, sans-serif" : "Inter, system-ui, sans-serif";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "#F0F4F8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          padding: "48px 36px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <XCircle size={64} color="#ef4444" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: "0 0 8px" }}>
          {isAr ? 'فشل الدفع' : 'Payment Failed'}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          {isAr
            ? <>حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو التواصل معنا على{" "}<strong>65068000</strong>.</>
            : <>An error occurred while processing your payment. Please try again or contact us at{" "}<strong>65068000</strong>.</>}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/pricing">
            <Button
              style={{
                background: NAVY,
                color: "white",
                fontWeight: 700,
                borderRadius: 12,
                padding: "12px 32px",
                fontFamily,
                width: "100%",
              }}
            >
              {isAr ? 'المحاولة مرة أخرى' : 'Try Again'}
            </Button>
          </Link>
          <a
            href="https://wa.me/96565068000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              background: "#25D366",
              color: "white",
              textDecoration: "none",
              borderRadius: 12,
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily,
            }}
          >
            {isAr ? 'تواصل معنا على واتساب' : 'Contact us on WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
}
