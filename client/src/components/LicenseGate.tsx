// ============================================================
// SubscriptionGate — Prime Fit Subscription Paywall
// Replaces the old license-key system.
// Access is granted by the admin assigning an active subscription
// to the user's account via the Admin Panel → Users tab.
// ============================================================
import { AppIcons } from './AppIcons';
import React from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
import { PrimeFitLogoSVG } from './InlineSVGIcons';

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const { data: currentUser } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const subscriptionStatus = trpc.subscription.getStatus.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Admin users always bypass the subscription gate
  if ((currentUser as any)?.role === 'admin') {
    return <>{children}</>;
  }

  // Show loading while checking subscription
  if (subscriptionStatus.isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(123,184,212,0.3)',
          borderTop: `4px solid ${SKY}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: SKY_LIGHT, fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
          جاري التحقق من الاشتراك...
        </div>
      </div>
    );
  }

  // Active subscription — show the app
  if (subscriptionStatus.data?.status === 'active' || subscriptionStatus.data?.status === 'trialing') {
    return <>{children}</>;
  }

  // No subscription row at all — redirect to pricing (not just show blocked screen)
  if (subscriptionStatus.data?.status === 'none') {
    // Clear any stale session storage and send to pricing
    sessionStorage.removeItem('primefit_selected_plan');
    sessionStorage.removeItem('primefit_selected_period');
    window.location.replace('/pricing');
    return null;
  }

  // No active subscription — show a clean "contact admin" screen
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
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <PrimeFitLogoSVG size={100} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: '0 0 8px' }}>
          Prime Fit
        </h1>
        <p style={{ color: '#7A9BB5', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          برنامج التدريب الشامل
        </p>

        {/* Lock icon */}
        <div style={{
          padding: '20px',
          background: `${SKY}15`,
          borderRadius: 16,
          border: `1.5px solid ${SKY_LIGHT}`,
          marginBottom: 24,
        }}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><AppIcons.Lock size={40} /></div>
          <p style={{ margin: '0 0 8px', color: NAVY, fontWeight: 700, fontSize: 15 }}>
            الاشتراك غير مفعّل
          </p>
          <p style={{ margin: 0, color: '#7A9BB5', fontSize: 13, lineHeight: 1.7 }}>
            حسابك لا يملك اشتراكاً نشطاً حالياً.
            <br />
            يرجى التواصل مع المسؤول لتفعيل اشتراكك.
          </p>
        </div>

        {/* Subscription status badge */}
        {subscriptionStatus.data?.status && subscriptionStatus.data.status !== 'active' && (
          <div style={{
            display: 'inline-block',
            background: subscriptionStatus.data.status === 'expired' ? '#FEE2E2' : '#FEF9C3',
            color: subscriptionStatus.data.status === 'expired' ? '#DC2626' : '#92400E',
            borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700,
            marginBottom: 20,
          }}>
            {subscriptionStatus.data.status === 'expired' ? 'انتهى الاشتراك' :
             subscriptionStatus.data.status === 'cancelled' ? 'تم إلغاء الاشتراك' :
             subscriptionStatus.data.status === 'pending' ? 'الاشتراك معلق' :
             subscriptionStatus.data.status}
          </div>
        )}

        {/* Contact admin button */}
        <a
          href="https://wa.me/96555555555"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            boxSizing: 'border-box',
            background: '#25D366',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 14,
            padding: '14px',
            fontSize: 15,
            fontWeight: 900,
            fontFamily: 'Cairo, sans-serif',
            marginBottom: 12,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          تواصل مع المسؤول عبر واتساب
        </a>

        {/* Refresh button */}
        <button
          onClick={() => subscriptionStatus.refetch()}
          style={{
            width: '100%',
            background: 'transparent',
            color: SKY,
            border: `2px solid ${SKY_LIGHT}`,
            borderRadius: 12,
            padding: '12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            marginBottom: 16,
          }}
        >
          تحديث حالة الاشتراك
        </button>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: '#B0C4D8' }}>
            Made by <strong>Prime Printing Co.</strong> © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
