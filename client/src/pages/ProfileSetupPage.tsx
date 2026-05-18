import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_11f9ef29.PNG';

export default function ProfileSetupPage() {
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateProfileMutation = trpc.standaloneAuth.updateProfile.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError(isAr ? 'الرجاء إدخال الاسم' : 'Please enter your name');
      setLoading(false);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        age: parseInt(age) || 0,
        height: parseInt(height) || 0,
        currentWeight: parseFloat(currentWeight) || 0,
        targetWeight: parseFloat(targetWeight) || 0,
        gender,
      });

      // Redirect to home after successful profile setup
      setLocation('/');
    } catch (err: any) {
      setError(
        (err?.data?.zodError?.fieldErrors?.fullName?.[0]) ||
        err?.message ||
        (isAr ? 'حدث خطأ أثناء حفظ البيانات' : 'An error occurred while saving your data')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
      fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '32px 24px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(27,46,94,0.35)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src={LOGO_URL}
            alt="Prime Fit"
            style={{ height: 52, objectFit: 'contain', marginBottom: 12 }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0 }}>
            {isAr ? 'مرحباً بك في Prime Fit' : 'Welcome to Prime Fit'}
          </h1>
          <p style={{ color: '#7A9BB5', fontSize: 13, marginTop: 6 }}>
            {isAr ? 'أكمل ملفك الشخصي للبدء' : 'Complete your profile to get started'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: `1px solid #fcc`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#c33',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
              {isAr ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isAr ? 'مثال: سارة' : 'e.g. Sarah'}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${SKY_LIGHT}`,
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Age & Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                {isAr ? 'العمر' : 'Age'}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={isAr ? 'مثال: 30' : 'e.g. 30'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${SKY_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                {isAr ? 'الطول (سم)' : 'Height (cm)'}
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={isAr ? 'مثال: 165' : 'e.g. 165'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${SKY_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Current & Target Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                {isAr ? 'الوزن الحالي (كغ)' : 'Current Weight (kg)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={isAr ? 'مثال: 72.5' : 'e.g. 72.5'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${SKY_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                {isAr ? 'الوزن المستهدف (كغ)' : 'Target Weight (kg)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder={isAr ? 'مثال: 65' : 'e.g. 65'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${SKY_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
              {isAr ? 'الجنس' : 'Gender'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => setGender('female')}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${gender === 'female' ? NAVY : SKY_LIGHT}`,
                  background: gender === 'female' ? NAVY : 'white',
                  color: gender === 'female' ? 'white' : NAVY,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isAr ? 'أنثى' : 'Female'}
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${gender === 'male' ? NAVY : SKY_LIGHT}`,
                  background: gender === 'male' ? NAVY : 'white',
                  color: gender === 'male' ? 'white' : NAVY,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isAr ? 'ذكر' : 'Male'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: loading ? '#ccc' : `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 8,
            }}
          >
            {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'ابدأ البرنامج' : 'Start My Program')}
          </button>
        </form>
      </div>
    </div>
  );
}
