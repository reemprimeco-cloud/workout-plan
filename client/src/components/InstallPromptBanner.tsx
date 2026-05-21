// ============================================================
// InstallPromptBanner — PWA "Add to Home Screen" popup
// - Android/Chrome: uses native beforeinstallprompt event
// - iOS Safari: shows manual guide (Share → Add to Home Screen)
// - Shows once on first visit (localStorage flag)
// - Bilingual: Arabic + English
// ============================================================
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'primefit_install_dismissed';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

interface Props {
  lang?: 'ar' | 'en';
}

export default function InstallPromptBanner({ lang = 'ar' }: Props) {
  const isRTL = lang === 'ar';
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (isInStandaloneMode()) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      // iOS Safari — show manual guide after 2 seconds
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Android/Chrome — listen for native install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShow(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        dismiss();
      }
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  const NAVY = '#1B2E5E';
  const NAVY_DARK = '#0F1E3D';
  const SKY = '#7BB8D4';
  const SKY_LIGHT = '#A8D4E8';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15, 30, 61, 0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Popup card — slides up from bottom */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 36px',
          boxShadow: '0 -8px 40px rgba(27,46,94,0.25)',
          fontFamily: lang === 'ar' ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
          animation: 'slideUpInstall 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: '#D0DFF0',
          margin: '0 auto 20px',
        }} />

        {/* App icon + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {/* App icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 14,
            background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 16px ${NAVY}44`,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z"
                fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: NAVY, lineHeight: 1.2 }}>
              Prime Fit
            </div>
            <div style={{ fontSize: 12, color: '#7A9BB5', marginTop: 3 }}>
              {isRTL ? 'تطبيق اللياقة الشخصية' : 'Personal Fitness App'}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: NAVY }}>
          {isRTL ? 'أضف التطبيق إلى شاشتك الرئيسية' : 'Add to Your Home Screen'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5A7A99', lineHeight: 1.6 }}>
          {isRTL
            ? 'احصل على تجربة أفضل وأسرع — افتح التطبيق مباشرةً من شاشتك الرئيسية مثل أي تطبيق عادي.'
            : 'Get a faster, full-screen experience — open Prime Fit directly from your home screen like a native app.'}
        </p>

        {/* iOS guide steps */}
        {isIOSDevice && (
          <div style={{
            background: '#F0F4F8',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
              {isRTL ? 'كيفية الإضافة:' : 'How to add:'}
            </div>
            {[
              {
                num: '1',
                text: isRTL
                  ? 'اضغط على زر المشاركة في شريط Safari'
                  : 'Tap the Share button in Safari',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v13M8 6l4-4 4 4M5 12v8a1 1 0 001 1h12a1 1 0 001-1v-8"
                      stroke={SKY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                num: '2',
                text: isRTL
                  ? 'اختر "إضافة إلى الشاشة الرئيسية"'
                  : 'Select "Add to Home Screen"',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke={SKY} strokeWidth="2"/>
                    <path d="M12 8v8M8 12h8" stroke={SKY} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                num: '3',
                text: isRTL ? 'اضغط "إضافة" للتأكيد' : 'Tap "Add" to confirm',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke={SKY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: NAVY, color: 'white',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div style={{ flexShrink: 0 }}>{step.icon}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>{step.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!isIOSDevice && (
            <button
              onClick={handleInstall}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${NAVY}44`,
              }}
            >
              {isRTL ? 'تثبيت التطبيق' : 'Install App'}
            </button>
          )}
          <button
            onClick={dismiss}
            style={{
              flex: isIOSDevice ? 1 : 0,
              background: isIOSDevice
                ? `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`
                : 'transparent',
              color: isIOSDevice ? 'white' : '#7A9BB5',
              border: isIOSDevice ? 'none' : `1.5px solid #D0DFF0`,
              borderRadius: 12,
              padding: isIOSDevice ? '14px' : '14px 20px',
              fontSize: 14,
              fontWeight: isIOSDevice ? 800 : 600,
              cursor: 'pointer',
              minWidth: isIOSDevice ? 'auto' : 80,
            }}
          >
            {isIOSDevice
              ? (isRTL ? 'حسناً، شكراً!' : 'Got it!')
              : (isRTL ? 'لاحقاً' : 'Later')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpInstall {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
