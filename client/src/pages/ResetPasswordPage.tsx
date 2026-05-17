// ============================================================
// ResetPasswordPage — Prime Fit Password Reset
// Accessed via email link: /reset-password?token=xxx
// ============================================================
import React, { useState } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_11f9ef29.PNG';

export default function ResetPasswordPage() {
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
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    try {
      await resetMutation.mutateAsync({ token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'فشل إعادة التعيين. قد يكون الرابط منتهي الصلاحية.');
    }
  };

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
    direction: 'ltr',
    textAlign: 'left',
  };

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
        textAlign: 'center',
      }}>
        <img src={LOGO_URL} alt="Prime Fit" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 16, marginBottom: 12 }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: '0 0 4px' }}>Prime Fit</h1>

        {done ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 900 }}>تم تغيير كلمة المرور</h2>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 32px',
                background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
                color: 'white', border: 'none', borderRadius: 14,
                fontSize: 14, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
              }}
            >
              تسجيل الدخول
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#7A9BB5', fontSize: 13, margin: '4px 0 24px' }}>أدخل كلمة المرور الجديدة</p>

            {!token && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
                ⚠️ رابط غير صالح. يرجى طلب رابط جديد.
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14, textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>كلمة المرور الجديدة</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    required
                    disabled={!token}
                    style={{ ...inputStyle, paddingLeft: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16,
                  }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20, textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>تأكيد كلمة المرور</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
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
                  fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
                  opacity: resetMutation.isPending ? 0.7 : 1,
                }}
              >
                {resetMutation.isPending ? '⏳ جاري الحفظ...' : '🔑 تغيير كلمة المرور'}
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
