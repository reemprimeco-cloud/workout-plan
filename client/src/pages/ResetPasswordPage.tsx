// ============================================================
// ResetPasswordPage — Prime Fit Password Reset
// Accessed via email link: /reset-password?token=xxx
// ============================================================
import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_befced15.PNG?v=2';

export default function ResetPasswordPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const resetMutation = trpc.standaloneAuth.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    try {
      await resetMutation.mutateAsync({ token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل إعادة التعيين. قد يكون الرابط منتهي الصلاحية.' : 'Reset failed. The link may have expired.'));
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${SKY_LIGHT}`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: isAr ? 'Cairo, Tajawal, system-ui, sans-serif' : 'Inter, system-ui, sans-serif',
    outline: 'none',
    color: NAVY,
    background: '#F8FAFC',
    boxSizing: 'border-box',
    direction: 'ltr',
    textAlign: 'left',
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
      fontFamily: isAr ? 'Cairo, Tajawal, system-ui, sans-serif' : 'Inter, system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 28px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(27,46,94,0.45)',
        textAlign: 'center',
      }}>
        <img src={LOGO_URL} alt="Prime Fit" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 16, marginBottom: 12 }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: '0 0 4px' }}>Prime Fit</h1>

        {done ? (
          <div style={{ marginTop: 20 }}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 900 }}>{isAr ? 'تم تغيير كلمة المرور' : 'Password Changed'}</h2>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>{isAr ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' : 'You can now log in with your new password'}</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 32px',
                background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
                color: 'white', border: 'none', borderRadius: 14,
                fontSize: 14, fontWeight: 900, cursor: 'pointer',
                fontFamily: isAr ? 'Cairo, Tajawal, system-ui, sans-serif' : 'Inter, system-ui, sans-serif',
              }}
            >
              {isAr ? 'تسجيل الدخول' : 'Log In'}
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#7A9BB5', fontSize: 13, margin: '4px 0 24px' }}>{isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}</p>

            {!token && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
                {isAr ? 'رابط غير صالح. يرجى طلب رابط جديد.' : 'Invalid link. Please request a new one.'}
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14, textAlign: isAr ? 'right' : 'left' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
                    required
                    disabled={!token}
                    style={{ ...inputStyle, paddingLeft: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16,
                  }}>
                    {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20, textAlign: isAr ? 'right' : 'left' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
                  required
                  disabled={!token}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={resetMutation.isPending || !token}
                style={{
                  width: '100%', padding: '14px',
                  background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
                  color: 'white', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 900, cursor: resetMutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: isAr ? 'Cairo, Tajawal, system-ui, sans-serif' : 'Inter, system-ui, sans-serif',
                  opacity: resetMutation.isPending ? 0.7 : 1,
                }}
              >
                {resetMutation.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تغيير كلمة المرور' : 'Change Password')}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap');
      `}</style>
    </div>
  );
}
