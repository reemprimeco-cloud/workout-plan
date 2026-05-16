// ============================================================
// LicenseGate — WooCommerce License Key Paywall
// Wraps the entire app. Users must enter a valid order key
// purchased from primeprint.com.kw to access Prime Fit.
//
// Supports auto-verification via URL: ?key=PRIME-XXXX-XXXX
// ============================================================
import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_49f796b1.PNG';
const STORAGE_KEY = 'primefit_license';
const PRODUCT_URL = 'https://primeprint.com.kw/product/prime-fit-%d8%a8%d8%b1%d9%86%d8%a7%d9%85%d8%ac-%d8%a7%d9%84%d8%aa%d8%af%d8%b1%d9%8a%d8%a8-%d8%a7%d9%84%d8%b4%d8%a7%d9%85%d9%84-8-%d8%a3%d8%b3%d8%a7%d8%a8%d9%8a%d8%b9/';

interface StoredLicense {
  key: string;
  customerName: string;
  customerEmail: string;
  verifiedAt: string;
  plan: string;
  expiresAt: string | null;
}

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const [licenseKey, setLicenseKey]   = useState('');
  const [isVerified, setIsVerified]   = useState(false);
  const [storedLicense, setStoredLicense] = useState<StoredLicense | null>(null);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState<boolean>(false);
  const verifyMutation = trpc.license.verify.useMutation();

  const doVerify = async (key: string): Promise<boolean> => {
    try {
      const result = await verifyMutation.mutateAsync({ licenseKey: key.trim() });
      if (result.success) {
        const license: StoredLicense = {
          key: key.trim(),
          customerName:  result.customerName  || '',
          customerEmail: result.customerEmail || '',
          verifiedAt:    new Date().toISOString(),
          plan:          result.plan ?? 'lifetime',
          expiresAt:     result.expiresAt ? (result.expiresAt instanceof Date ? result.expiresAt.toISOString() : String(result.expiresAt)) : null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
        setStoredLicense(license);
        setIsVerified(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('key');
        window.history.replaceState({}, '', url.toString());
        return true;
      } else {
        setError(result.message || 'مفتاح الترخيص غير صالح');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ. يرجى المحاولة مرة أخرى.';
      setError(message);
      return false;
    }
  };

  // On mount: check stored license OR auto-verify from URL ?key=
  useEffect(() => {
    const init = async () => {
      // 1. Check if already verified locally
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredLicense = JSON.parse(stored);
          if (parsed.key && parsed.verifiedAt) {
            // Check if expired locally
            if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
              localStorage.removeItem(STORAGE_KEY);
            } else {
              setStoredLicense(parsed);
              setIsVerified(true);
              // Initialize popup dismissed state from localStorage
              try {
                const popupKey = `primefit_trial_popup_${parsed.key}`;
                setPopupDismissed(localStorage.getItem(popupKey) === 'dismissed');
              } catch {}
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }

      // 2. Check URL for ?key= param (auto-verify from email link)
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key');
      if (urlKey) {
        setAutoVerifying(true);
        setLicenseKey(urlKey);
        await doVerify(urlKey);
        setAutoVerifying(false);
      }

      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setError('الرجاء إدخال مفتاح الترخيص');
      return;
    }
    setError('');
    await doVerify(licenseKey);
  };

  // Loading / auto-verifying state
  if (loading || autoVerifying) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <div style={{ color: SKY_LIGHT, fontSize: 16, fontFamily: 'Cairo, sans-serif' }}>
          {autoVerifying ? 'جاري تفعيل برنامجك...' : 'جاري التحقق...'}
        </div>
      </div>
    );
  }

  // Already verified — show the app with trial popup + renewal banner
  if (isVerified) {
    const expiresAt  = storedLicense?.expiresAt ? new Date(storedLicense.expiresAt) : null;
    const daysLeft   = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000) : null;
    const isTrial    = daysLeft !== null && daysLeft <= 7;
    const POPUP_KEY  = `primefit_trial_popup_${storedLicense?.key ?? 'x'}`;
    const dismissPopup = () => {
      try { localStorage.setItem(POPUP_KEY, 'dismissed'); } catch {}
      setPopupDismissed(true);
    };
    const showPopup = isTrial && !popupDismissed && expiresAt !== null;

    return (
      <>
        {/* Trial awareness popup — shown once */}
        {showPopup && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
          }}>
            <div dir="rtl" style={{
              background: '#111827', borderRadius: 24, padding: '28px 24px',
              maxWidth: 360, width: '100%',
              border: '1.5px solid rgba(255,215,0,0.3)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,215,0,0.1)',
                border: '2px solid rgba(255,215,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 16px',
              }}>⏳</div>

              <h2 style={{ color: '#FFD700', fontSize: 18, fontWeight: 900, margin: '0 0 10px' }}>
                تجربتك المجانية نشطة!
              </h2>
              <p style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>
                لديك{' '}
                <span style={{ color: '#00E5FF', fontSize: 22 }}>{daysLeft}</span>
                {' '}{daysLeft === 1 ? 'يوم' : 'أيام'} مجانية
              </p>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 4px', lineHeight: 1.6 }}>
                تنتهي تجربتك في{' '}
                <strong style={{ color: '#F9FAFB' }}>
                  {expiresAt?.toLocaleDateString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </strong>
              </p>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 20px', lineHeight: 1.6 }}>
                بعد انتهاء التجربة ستحتاج إلى الاشتراك للمتابعة.
                استمتعي بجميع الميزات خلال هذه الفترة! 💪
              </p>

              <div style={{
                background: '#1F2937', borderRadius: 14, padding: '12px 16px',
                marginBottom: 20, textAlign: 'right',
              }}>
                {['🤖 مدرب AI شخصي', '📊 تحليلات متقدمة', '🏆 تحديات أسبوعية', '👥 مجتمع مميز'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ color: '#22C55E', fontSize: 13, flexShrink: 0 }}>✓</span>
                    <span style={{ color: '#F9FAFB', fontSize: 12 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={dismissPopup}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#0D1B2A', border: 'none', borderRadius: 14,
                  padding: '14px', fontSize: 15, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                  marginBottom: 10,
                }}
              >
                🚀 فهمت، لنبدأ!
              </button>
              <p style={{ color: '#4B5563', fontSize: 10, margin: 0 }}>
                سيظهر هذا الإشعار مرة واحدة فقط
              </p>
            </div>
          </div>
        )}

        {children}
      </>
    );
  }

    // License entry screen
  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
      fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '36px 28px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <img
              src={LOGO_URL}
              alt="Prime Fit"
              style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 20 }}
            />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: '0 0 6px' }}>
            Prime Fit
          </h1>
          <p style={{ color: '#7A9BB5', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            برنامج التدريب الشامل — 8 أسابيع
          </p>
        </div>

        {/* Lock icon */}
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
          padding: '16px',
          background: `${SKY}15`,
          borderRadius: 16,
          border: `1.5px solid ${SKY_LIGHT}`,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <p style={{ margin: 0, color: NAVY, fontWeight: 700, fontSize: 14 }}>
            هذا التطبيق مخصص للمشتركين فقط
          </p>
          <p style={{ margin: '6px 0 0', color: '#7A9BB5', fontSize: 12, lineHeight: 1.6 }}>
            أدخل كود الوصول الذي أرسلناه لك بعد الشراء
          </p>
        </div>

        {/* License key input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 700,
            color: NAVY, marginBottom: 8,
          }}>
            🔑 مفتاح الترخيص
          </label>
          <input
            type="text"
            placeholder="PRIME-XXXX-XXXX"
            value={licenseKey}
            onChange={e => { setLicenseKey(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `2px solid ${error ? '#EF4444' : SKY_LIGHT}`,
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: 'monospace',
              color: NAVY,
              outline: 'none',
              direction: 'ltr',
              textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
          />
          {error && (
            <p style={{ color: '#EF4444', fontSize: 12, margin: '6px 0 0', fontWeight: 600 }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
          style={{
            width: '100%',
            background: verifyMutation.isPending
              ? '#94A3B8'
              : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontSize: 15,
            fontWeight: 900,
            cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'Cairo, sans-serif',
            transition: 'all 0.2s',
            boxShadow: verifyMutation.isPending ? 'none' : `0 4px 16px ${NAVY}44`,
          }}
        >
          {verifyMutation.isPending ? '⏳ جاري التحقق...' : '🚀 تفعيل البرنامج'}
        </button>

        {/* Purchase link — now links to /pricing for MyFatoorah checkout */}
        <div style={{
          marginTop: 20,
          padding: '14px',
          background: '#F8FBFF',
          borderRadius: 12,
          border: `1px solid ${SKY_LIGHT}55`,
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 8px', color: '#7A9BB5', fontSize: 12 }}>
            لا تملك مفتاح ترخيص؟
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${SKY}, #5BA8C8)`,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            🛒 اشترِ Prime Fit الآن
          </a>
          <p style={{ margin: '8px 0 0', color: '#B0C4D8', fontSize: 10 }}>
            دفع آمن عبر MyFatoorah · تستلم الكود فوراً
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 10, color: '#B0C4D8' }}>
            Made by <strong>Prime Printing Co.</strong> © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
