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
  const [licenseKey, setLicenseKey]         = useState('');
  const [isVerified, setIsVerified]         = useState(false);
  const [isExpired, setIsExpired]           = useState(false);
  const [storedLicense, setStoredLicense]   = useState<StoredLicense | null>(null);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(true);
  const [autoVerifying, setAutoVerifying]   = useState(false);
  // Trial popup — must be at top level (Rules of Hooks)
  const [popupDismissed, setPopupDismissed] = useState<boolean>(() => {
    try {
      const key = localStorage.getItem('primefit_license');
      if (!key) return false;
      const parsed = JSON.parse(key);
      return localStorage.getItem(`primefit_trial_popup_${parsed?.key ?? 'x'}`) === 'dismissed';
    } catch { return false; }
  });

  const verifyMutation = trpc.license.verify.useMutation();

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVerified(false);
    setIsExpired(false);
    setStoredLicense(null);
    setLicenseKey('');
  };

  const doVerify = async (key: string): Promise<boolean> => {
    try {
      const result = await verifyMutation.mutateAsync({ licenseKey: key.trim() });
      if (result.success) {
        const license: StoredLicense = {
          key:           key.trim(),
          customerName:  result.customerName  || '',
          customerEmail: result.customerEmail || '',
          verifiedAt:    new Date().toISOString(),
          plan:          result.plan ?? 'monthly',
          expiresAt:     result.expiresAt ? (result.expiresAt instanceof Date ? result.expiresAt.toISOString() : String(result.expiresAt)) : null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
        setStoredLicense(license);
        setIsVerified(true);
        setIsExpired(false);
        const url = new URL(window.location.href);
        url.searchParams.delete('key');
        window.history.replaceState({}, '', url.toString());
        return true;
      } else if ((result as any).expired) {
        // Key exists but subscription expired — show expired popup
        localStorage.removeItem(STORAGE_KEY);
        setIsExpired(true);
        return false;
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
            if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
              // Expired locally — show expired popup instead of app
              localStorage.removeItem(STORAGE_KEY);
              setIsExpired(true);
              setLoading(false);
              return;
            }
            setStoredLicense(parsed);
            setIsVerified(true);
            setLoading(false);
            return;
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
    const showBanner = isTrial && daysLeft !== null && daysLeft > 0;
    const planLabels: Record<string, string> = { monthly: 'شهري', quarterly: 'ربع سنوي', yearly: 'سنوي', lifetime: 'دائم' };
    const planLabel  = planLabels[storedLicense?.plan ?? 'lifetime'] ?? 'دائم';

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
                  {expiresAt?.toLocaleDateString('ar-KW', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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

        {/* Expiry banner — shown after popup dismissed */}
        {showBanner && popupDismissed && (
          <div dir="rtl" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: daysLeft !== null && daysLeft <= 2 ? '#EF4444' : '#F59E0B',
            color: 'white', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 700,
          }}>
            <span>⚠️ ينتهي اشتراكك خلال {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}</span>
            <a href={PRODUCT_URL} target="_blank" rel="noopener noreferrer" style={{
              background: 'white',
              color: daysLeft !== null && daysLeft <= 2 ? '#EF4444' : '#D97706',
              borderRadius: 8, padding: '5px 14px',
              fontSize: 12, fontWeight: 900, textDecoration: 'none',
            }}>🔄 جدد</a>
          </div>
        )}

        <div style={{ paddingTop: showBanner && popupDismissed ? 44 : 0 }}>
          {children}
        </div>

        {storedLicense && (
          <div style={{
            position: 'fixed', bottom: 80, left: 12, zIndex: 100,
            background: 'rgba(27,46,94,0.85)', backdropFilter: 'blur(6px)',
            borderRadius: 20, padding: '4px 10px',
            fontSize: 10, fontWeight: 700, color: '#A8D4E8',
            fontFamily: 'Cairo, sans-serif', direction: 'rtl', pointerEvents: 'none',
          }}>
            {planLabel} {expiresAt ? `· ${expiresAt.toLocaleDateString('ar-SA')}` : '· ∞'}
          </div>
        )}
      </>
    );
  }

    // Subscription expired — show blocking popup with logout or plans options
  if (isExpired) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
      }}>
        <div dir="rtl" style={{
          background: 'white', borderRadius: 24,
          width: '100%', maxWidth: 380,
          padding: '32px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔒</div>

          {/* Title */}
          <h2 style={{ color: '#DC2626', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>
            انتهت صلاحية اشتراكك
          </h2>
          <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, margin: '0 0 16px' }}>
            Your subscription has expired
          </p>

          {/* Body */}
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          }}>
            <p style={{ color: '#991B1B', fontSize: 13, margin: '0 0 6px', lineHeight: 1.6 }}>
              انتهت فترة تجربتك المجانية. لمواصلة استخدام Prime Fit وجميع ميزاته يجب الاشتراك في إحدى الخطط.
            </p>
            <p style={{ color: '#B91C1C', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
              Your free trial has ended. Subscribe to continue using all features.
            </p>
          </div>

          {/* Plans button */}
          <button
            onClick={() => {
              // Clear expired state, re-enter app pointing at pricing
              localStorage.setItem('primefit_goto_pricing', '1');
              setIsExpired(false);
              setIsVerified(false);
              // Redirect to pricing via URL
              window.location.href = '/?goto=pricing';
            }}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px', fontSize: 15, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
              boxShadow: `0 4px 16px rgba(27,46,94,0.4)`,
            }}
          >
            ⭐ عرض خطط الاشتراك
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#6B7280', border: '2px solid #E5E7EB', borderRadius: 14,
              padding: '13px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🚪 تسجيل الخروج
          </button>

          <p style={{ color: '#9CA3AF', fontSize: 10, margin: '12px 0 0', lineHeight: 1.5 }}>
            بالنقر على "تسجيل الخروج" لن تتمكن من الوصول إلى التطبيق حتى تشترك
          </p>
        </div>
      </div>
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

        {/* Purchase link */}
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
            href={PRODUCT_URL}
            target="_blank"
            rel="noopener noreferrer"
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
        </div>

        {/* WhatsApp order note */}
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          background: '#F0FFF4',
          borderRadius: 12,
          border: '1.5px solid #86EFAC',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', color: '#166534', fontWeight: 700, fontSize: 13 }}>
            📦 بعد إتمام الطلب
          </p>
          <p style={{ margin: '0 0 10px', color: '#15803D', fontSize: 12, lineHeight: 1.6 }}>
            تواصل معنا على واتساب لاستلام كود الوصول الخاص بك
          </p>
          <a
            href="https://wa.me/96565068000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#25D366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Cairo, sans-serif',
              boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            واتساب: 65068000
          </a>
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
