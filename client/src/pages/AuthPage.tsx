// ============================================================
// AuthPage — Prime Fit Sign In / Sign Up / Forgot Password
// Design: Navy #1B2E5E + Sky Blue #7BB8D4 (matches app theme)
// Google Sign-In: redirect flow (mobile Safari safe, no popup)
// ============================================================
import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_11f9ef29.PNG';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

type Mode = 'login' | 'signup' | 'forgot' | 'reset-sent';

interface AuthPageProps {
  onSuccess?: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.standaloneAuth.login.useMutation();
  const signUpMutation = trpc.standaloneAuth.signUp.useMutation();
  const forgotMutation = trpc.standaloneAuth.forgotPassword.useMutation();
  const utils = trpc.useUtils();

  // Handle Google OAuth error returned via query param after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get('google_error');
    if (googleError) {
      const errorMessages: Record<string, string> = {
        cancelled: 'تم إلغاء تسجيل الدخول عبر Google',
        token_exchange_failed: 'فشل التحقق من حساب Google. يرجى المحاولة مرة أخرى.',
        userinfo_failed: 'تعذر الحصول على معلومات الحساب من Google.',
        invalid_user: 'بيانات حساب Google غير صالحة.',
        user_creation_failed: 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.',
        config_error: 'تسجيل الدخول عبر Google غير مفعّل حالياً.',
        db_unavailable: 'خدمة قاعدة البيانات غير متاحة. يرجى المحاولة لاحقاً.',
        unexpected_error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      };
      setError(errorMessages[googleError] || 'فشل تسجيل الدخول عبر Google');
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  /**
   * Google Sign-In via server-side redirect flow.
   * This is the ONLY reliable method on mobile Safari (ITP blocks popups/iframes).
   * Flow: click → redirect to /api/auth/google → Google consent → /api/auth/google/callback → /
   */
  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('تسجيل الدخول عبر Google غير مفعّل حالياً.');
      return;
    }
    // Redirect to server-side Google OAuth handler
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/api/auth/google?returnTo=${returnTo}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      try {
        await loginMutation.mutateAsync({ email, password });
        await utils.auth.me.invalidate();
        onSuccess?.();
        window.location.reload();
      } catch (err: any) {
        setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    } else if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        return;
      }
      if (password.length < 8) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
      }
      try {
        await signUpMutation.mutateAsync({ fullName, email, password });
        await utils.auth.me.invalidate();
        onSuccess?.();
        window.location.reload();
      } catch (err: any) {
        setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    } else if (mode === 'forgot') {
      try {
        await forgotMutation.mutateAsync({ email, origin: window.location.origin });
        setMode('reset-sent');
      } catch (err: any) {
        setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const isLoading = loginMutation.isPending || signUpMutation.isPending || forgotMutation.isPending;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${SKY_LIGHT}`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
    outline: 'none',
    color: NAVY,
    background: '#F8FAFC',
    boxSizing: 'border-box',
    direction: 'rtl',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 6,
    textAlign: 'right',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 900,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.2s',
  };

  // Reset sent screen
  if (mode === 'reset-sent') {
    return (
      <div dir="rtl" style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '40px 28px',
          width: '100%', maxWidth: 420, textAlign: 'center',
          boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: NAVY, fontSize: 20, fontWeight: 900, margin: '0 0 12px' }}>
            تحقق من بريدك الإلكتروني
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
            أرسلنا رابط إعادة تعيين كلمة المرور إلى<br />
            <strong style={{ color: NAVY }}>{email}</strong>
          </p>
          <button onClick={() => setMode('login')} style={{ ...primaryBtn, width: 'auto', padding: '12px 32px' }}>
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
      fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 28px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={LOGO_URL} alt="Prime Fit" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 18, marginBottom: 10 }} />
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: '0 0 4px' }}>Prime Fit</h1>
          <p style={{ color: '#7A9BB5', fontSize: 12, margin: 0 }}>
            {mode === 'login' ? 'مرحباً بعودتك 👋' : mode === 'signup' ? 'أنشئ حسابك الآن 💪' : 'إعادة تعيين كلمة المرور 🔑'}
          </p>
        </div>

        {/* Google Sign-In — redirect flow (works on all mobile browsers) */}
        {(mode === 'login' || mode === 'signup') && GOOGLE_CLIENT_ID && (
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px 16px',
                background: '#fff', border: `1.5px solid #E2E8F0`,
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                color: '#1F2937', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s, opacity 0.2s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {/* Google logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {mode === 'login' ? 'تسجيل الدخول عبر Google' : 'التسجيل عبر Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>أو</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13, textAlign: 'right',
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
            padding: '10px 14px', marginBottom: 16, color: '#16A34A', fontSize: 13, textAlign: 'right',
          }}>
            ✅ {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثال: ريم الفرج"
                required
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {mode !== 'forgot' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? '8 أحرف على الأقل' : 'كلمة المرور'}
                  required
                  style={{ ...inputStyle, paddingLeft: 44, direction: 'ltr', textAlign: 'left' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>تأكيد كلمة المرور</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                required
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); }}
                style={{
                  background: 'none', border: 'none', color: SKY, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
                  fontWeight: 600, padding: 0,
                }}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={primaryBtn}>
            {isLoading ? '⏳ جاري التحميل...' : mode === 'login' ? '🔐 تسجيل الدخول' : mode === 'signup' ? '🚀 إنشاء الحساب' : '📧 إرسال رابط الإعادة'}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {mode === 'login' && (
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              ليس لديك حساب؟{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                style={{ background: 'none', border: 'none', color: NAVY, fontWeight: 900, cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}
              >
                سجل الآن
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: NAVY, fontWeight: 900, cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}
              >
                تسجيل الدخول
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}
            >
              ← العودة لتسجيل الدخول
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SKY_LIGHT}` }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, margin: 0 }}>
            لديك كود وصول؟{' '}
            <button
              type="button"
              onClick={() => window.location.href = '/?use_license=1'}
              style={{ background: 'none', border: 'none', color: SKY, cursor: 'pointer', fontSize: 10, fontFamily: 'Cairo, Tajawal, system-ui, sans-serif', fontWeight: 600 }}
            >
              ادخل كود الوصول
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap');
      `}</style>
    </div>
  );
}
