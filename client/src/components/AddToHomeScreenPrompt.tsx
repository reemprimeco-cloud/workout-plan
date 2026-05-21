// AddToHomeScreenPrompt
// Shows once on first visit (localStorage key: "pwa_prompt_dismissed")
// - On Android/Chrome: triggers the native beforeinstallprompt
// - On iOS Safari: shows manual instructions (tap Share → Add to Home Screen)
// - Already installed (standalone mode): never shows

import { useEffect, useState } from 'react';

const LOGO_URL = '/manus-storage/primefit_logo_befced15.PNG';
const STORAGE_KEY = 'pwa_prompt_dismissed';

type Platform = 'android' | 'ios' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return null;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function AddToHomeScreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem(STORAGE_KEY) || isStandalone()) return;

    const plat = detectPlatform();
    if (!plat) return; // desktop — skip

    setPlatform(plat);

    if (plat === 'android') {
      // Listen for Chrome's install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler as EventListener);
      return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
    } else if (plat === 'ios') {
      // iOS: always show manual instructions (no native prompt available)
      // Delay slightly so the page loads first
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEY, '1');
      }
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet — anchored to bottom on iOS (pointing up), centered on Android */}
      <div
        style={{
          position: 'fixed',
          ...(platform === 'ios'
            ? { bottom: 0, left: 0, right: 0, borderRadius: '20px 20px 0 0' }
            : { bottom: '50%', left: '50%', transform: 'translate(-50%, 50%)', borderRadius: 20, width: 'min(360px, 92vw)' }),
          background: 'white',
          zIndex: 9999,
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
          padding: '28px 24px 32px',
          animation: 'slideUp 0.3s ease',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: '#9CA3AF', lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* App icon */}
        <img
          src={LOGO_URL}
          alt="Prime Fit"
          style={{
            width: 80, height: 80, borderRadius: 18,
            objectFit: 'contain',
            marginBottom: 14,
            boxShadow: '0 4px 16px rgba(27,46,94,0.18)',
          }}
        />

        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#1B2E5E' }}>
          Install PrimeFit
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
          Add this app to your home screen for easy access and a better experience.
        </p>

        {/* iOS instructions */}
        {platform === 'ios' && (
          <>
            <div style={{
              borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6',
              padding: '16px 0', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, color: '#374151' }}>
                <span>Tap</span>
                {/* iOS Share icon */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>then <strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
            {/* iOS bottom arrow hint */}
            <div style={{
              position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '14px solid white',
              filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.08))',
            }} />
          </>
        )}

        {/* Android install button */}
        {platform === 'android' && (
          <button
            onClick={handleInstall}
            style={{
              width: '100%', padding: '13px',
              background: '#1B2E5E', color: 'white',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            + Add to Home Screen
          </button>
        )}

        <button
          onClick={handleDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9CA3AF', fontSize: 13, marginTop: 4,
          }}
        >
          Maybe later
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  );
}
