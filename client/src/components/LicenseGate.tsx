// ============================================================
// LicenseGate — WooCommerce License Key Paywall
// Wraps the entire app. Users must enter a valid order key
// purchased from primeprint.com.kw to access Prime Fit.
//
// Supports auto-verification via URL: ?key=PRIME-XXXX-XXXX
// ============================================================
import { useState, useEffect } from 'react';
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
}

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoVerifying, setAutoVerifying] = useState(false);

  const verifyMutation = trpc.license.verify.useMutation();

  const doVerify = async (key: string): Promise<boolean> => {
    try {
      const result = await verifyMutation.mutateAsync({ licenseKey: key.trim() });
      if (result.success) {
        const license: StoredLicense = {
          key: key.trim(),
          customerName: result.customerName || '',
          customerEmail: result.customerEmail || '',
          verifiedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
        setIsVerified(true);
        // Clean the key from the URL without reloading
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

  // Already verified — show the app
  if (isVerified) {
    return <>{children}</>;
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

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 10, color: '#B0C4D8' }}>
            Made by <strong>Prime Printing Co.</strong> © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
