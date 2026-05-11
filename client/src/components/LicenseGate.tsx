// ============================================================
// LicenseGate — WooCommerce License Key Paywall
// Wraps the entire app. Users must enter a valid order key
// purchased from primeprint.com.kw to access Prime Fit.
// ============================================================
import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/ac92d03d-28a4-4634-83f6-c2b0ec05fc4a_833a088c.jpg';
const STORAGE_KEY = 'primefit_license';

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
  const [storedLicense, setStoredLicense] = useState<StoredLicense | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const verifyMutation = trpc.license.verify.useMutation();

  // On mount, check if a valid license is already stored locally
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredLicense = JSON.parse(stored);
        if (parsed.key && parsed.verifiedAt) {
          setStoredLicense(parsed);
          setIsVerified(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setError('الرجاء إدخال مفتاح الترخيص');
      return;
    }
    setError('');

    try {
      const result = await verifyMutation.mutateAsync({ licenseKey: licenseKey.trim() });

      if (result.success) {
        const license: StoredLicense = {
          key: licenseKey.trim(),
          customerName: result.customerName || '',
          customerEmail: result.customerEmail || '',
          verifiedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
        setStoredLicense(license);
        setIsVerified(true);
      } else {
        setError(result.message || 'مفتاح الترخيص غير صالح');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ. يرجى المحاولة مرة أخرى.';
      setError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVerified(false);
    setStoredLicense(null);
    setLicenseKey('');
    setError('');
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: SKY_LIGHT, fontSize: 16 }}>جاري التحقق...</div>
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
          <div style={{
            display: 'inline-flex',
            background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            borderRadius: 16,
            padding: '10px 16px',
            marginBottom: 16,
            boxShadow: `0 6px 20px ${NAVY}44`,
          }}>
            <img
              src={LOGO_URL}
              alt="Prime Fit"
              style={{ height: 44, objectFit: 'contain' }}
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
            أدخل مفتاح الترخيص الخاص بك للوصول إلى البرنامج
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
            placeholder="wc_order_xxxxxxxxxxxxxxxx"
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
          marginTop: 24,
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
            href="https://primeprint.com.kw"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${SKY}, #5BA8C8)`,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            🛒 اشترِ الآن من primeprint.com.kw
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
