// ============================================================
// AuthPage — Prime Fit Sign In / Sign Up / Forgot Password
// Design: Navy #1B2E5E + Sky Blue #7BB8D4 (matches app theme)
// Google Sign-In: redirect flow (mobile Safari safe, no popup)
// ============================================================
import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/api/img/primefit_logo_11f9ef29.PNG';


type Mode = 'login' | 'signup' | 'forgot' | 'reset-sent';

interface AuthPageProps {
  onSuccess?: () => void;
  onBackToPricing?: () => void;
  selectedPlan?: string | null;
}

export default function AuthPage({ onSuccess, onBackToPricing, selectedPlan }: AuthPageProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

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
    const oauthError = params.get('error');
    if (googleError) {
      const errorMessagesAr: Record<string, string> = {
        cancelled: 'تم إلغاء تسجيل الدخول عبر Google',
        token_exchange_failed: 'فشل التحقق من حساب Google. يرجى المحاولة مرة أخرى.',
        userinfo_failed: 'تعذر الحصول على معلومات الحساب من Google.',
        invalid_user: 'بيانات حساب Google غير صالحة.',
        user_creation_failed: 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.',
        config_error: 'تسجيل الدخول عبر Google غير مفعّل حالياً.',
        db_unavailable: 'خدمة قاعدة البيانات غير متاحة. يرجى المحاولة لاحقاً.',
        unexpected_error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      };
      const errorMessagesEn: Record<string, string> = {
        cancelled: 'Google sign-in was cancelled.',
        token_exchange_failed: 'Google account verification failed. Please try again.',
        userinfo_failed: 'Could not retrieve Google account information.',
        invalid_user: 'Invalid Google account data.',
        user_creation_failed: 'Could not create account. Please try again.',
        config_error: 'Google sign-in is not currently enabled.',
        db_unavailable: 'Database service unavailable. Please try again later.',
        unexpected_error: 'An unexpected error occurred. Please try again.',
      };
      const messages = isAr ? errorMessagesAr : errorMessagesEn;
      setError(messages[googleError] || (isAr ? 'فشل تسجيل الدخول عبر Google' : 'Google sign-in failed'));
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_error');
      window.history.replaceState({}, '', url.toString());
    } else if (oauthError === 'oauth_failed') {
      setError(isAr ? 'فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.' : 'Google sign-in failed. Please try again.');
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isAr]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      try {
        await loginMutation.mutateAsync({ email, password });
        await utils.auth.me.invalidate();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } catch (err: any) {
        setError(err.message || (isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.'));
      }
    } else if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
        return;
      }
      try {
        await signUpMutation.mutateAsync({ fullName, email, password });
        await utils.auth.me.invalidate();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } catch (err: any) {
        setError(err.message || (isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.'));
      }
    } else if (mode === 'forgot') {
      try {
        await forgotMutation.mutateAsync({ email, origin: window.location.origin });
        setMode('reset-sent');
      } catch (err: any) {
        setError(err.message || (isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.'));
      }
    }
  };

  const isLoading = loginMutation.isPending || signUpMutation.isPending || forgotMutation.isPending;

  const fontFamily = isAr ? 'Cairo, Tajawal, system-ui, sans-serif' : 'Inter, system-ui, sans-serif';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${SKY_LIGHT}`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily,
    outline: 'none',
    color: NAVY,
    background: '#F8FAFC',
    boxSizing: 'border-box',
    direction: isAr ? 'rtl' : 'ltr',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 6,
    textAlign: isAr ? 'right' : 'left',
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
    fontFamily,
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.2s',
  };

  // Reset sent screen
  if (mode === 'reset-sent') {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'} style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        fontFamily,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '40px 28px',
          width: '100%', maxWidth: 420, textAlign: 'center',
          boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, color: NAVY }}>&#9993;</div>
          <h2 style={{ color: NAVY, fontSize: 20, fontWeight: 900, margin: '0 0 12px' }}>
            {isAr ? 'تحقق من بريدك الإلكتروني' : 'Check Your Email'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
            {isAr ? 'أرسلنا رابط إعادة تعيين كلمة المرور إلى' : 'We sent a password reset link to'}<br />
            <strong style={{ color: NAVY }}>{email}</strong>
          </p>
          <button onClick={() => setMode('login')} style={{ ...primaryBtn, width: 'auto', padding: '12px 32px' }}>
            {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
      fontFamily,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 28px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
      }}>
        {/* Back to pricing button */}
        {onBackToPricing && (
          <button
            onClick={onBackToPricing}
            style={{
              background: 'none', border: 'none', color: '#7A9BB5', cursor: 'pointer',
              fontSize: 13, fontFamily,
              display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0,
            }}
          >
            &#8594; {isAr ? 'تغيير الخطة' : 'Change Plan'}
          </button>
        )}

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={LOGO_URL} alt="Prime Fit" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 18, marginBottom: 10 }} />
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: '0 0 4px' }}>Prime Fit</h1>
          <p style={{ color: '#7A9BB5', fontSize: 12, margin: 0 }}>
            {mode === 'login'
              ? (isAr ? 'مرحباً بعودتك' : 'Welcome back')
              : mode === 'signup'
              ? (isAr ? 'أنشئ حسابك الآن' : 'Create your account')
              : (isAr ? 'إعادة تعيين كلمة المرور' : 'Reset your password')}
          </p>
          {selectedPlan && selectedPlan !== 'free' && (
            <div style={{ marginTop: 8, background: '#EFF6FF', borderRadius: 8, padding: '4px 12px', display: 'inline-block' }}>
              <span style={{ color: NAVY, fontSize: 12, fontWeight: 700 }}>
                {isAr ? 'الخطة المختارة:' : 'Selected Plan:'} {selectedPlan === 'prime_plus' ? 'Prime Plus' : 'Prime Pro'}
              </span>
            </div>
          )}
          {selectedPlan === 'free' && (
            <div style={{ marginTop: 8, background: '#F0FDF4', borderRadius: 8, padding: '4px 12px', display: 'inline-block' }}>
              <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>{isAr ? 'تجربة مجانية 7 أيام' : '7-Day Free Trial'}</span>
            </div>
          )}
        </div>

        {/* Google Sign-In button removed — email/password login only */}

        {/* Error / Success */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13, textAlign: isAr ? 'right' : 'left',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
            padding: '10px 14px', marginBottom: 16, color: '#16A34A', fontSize: 13, textAlign: isAr ? 'right' : 'left',
          }}>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={isAr ? 'مثال: ريم الفرج' : 'e.g. Sarah Smith'}
                required
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
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
              <label style={labelStyle}>{isAr ? 'كلمة المرور' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? (isAr ? '8 أحرف على الأقل' : 'At least 8 characters') : (isAr ? 'كلمة المرور' : 'Password')}
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
                  {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
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
                  cursor: 'pointer', fontFamily,
                  fontWeight: 600, padding: 0,
                }}
              >
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={primaryBtn}>
            {isLoading
              ? (isAr ? 'جاري التحميل...' : 'Loading...')
              : mode === 'login'
              ? (isAr ? 'تسجيل الدخول' : 'Log In')
              : mode === 'signup'
              ? (isAr ? 'إنشاء الحساب' : 'Create Account')
              : (isAr ? 'إرسال رابط الإعادة' : 'Send Reset Link')}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {mode === 'login' && (
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              {isAr ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                style={{ background: 'none', border: 'none', color: NAVY, fontWeight: 900, cursor: 'pointer', fontSize: 13, fontFamily }}
              >
                {isAr ? 'سجل الآن' : 'Sign Up'}
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: NAVY, fontWeight: 900, cursor: 'pointer', fontSize: 13, fontFamily }}
              >
                {isAr ? 'تسجيل الدخول' : 'Log In'}
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, fontFamily }}
            >
              {isAr ? '← العودة لتسجيل الدخول' : '← Back to Login'}
            </button>
          )}
        </div>

        {/* Footer - WhatsApp Support */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SKY_LIGHT}` }}>
          <a
            href="https://wa.me/96565068000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#25D366',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              background: 'rgba(37,211,102,0.08)',
              borderRadius: 20,
              padding: '7px 18px',
              border: '1.5px solid rgba(37,211,102,0.25)',
              fontFamily,
              transition: 'background 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Need Help?
          </a>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap');
      `}</style>
    </div>
  );
}
