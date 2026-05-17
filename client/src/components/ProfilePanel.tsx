// ProfilePanel - Smart editable profile with BMI, personalized plan, language switcher
// Design: Energetic Sports RTL, Primary #E05A00, Secondary #1A7A4A
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '@/lib/trpc';
import { useGymTracker } from '@/hooks/useGymTracker';
import NotificationSettings from './NotificationSettings';
import UserGuide from './UserGuide';
import { useLanguage } from '@/contexts/LanguageContext';

// ── BMI & Plan Calculator ──────────────────────────────────────────────────
function calcBMI(weight: number, height: number): number {
  if (!height || !weight) return 0;
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

function getBMICategory(bmi: number, lang: 'ar' | 'en') {
  if (bmi < 18.5) return { label: lang === 'ar' ? 'نقص وزن' : 'Underweight', color: '#3B82F6' };
  if (bmi < 25)   return { label: lang === 'ar' ? 'طبيعي ✅' : 'Normal ✅', color: '#10B981' };
  if (bmi < 30)   return { label: lang === 'ar' ? 'زيادة وزن' : 'Overweight', color: '#F59E0B' };
  return { label: lang === 'ar' ? 'سمنة' : 'Obese', color: '#EF4444' };
}

function calcPlan(age: number, weight: number, targetWeight: number, height: number, gender: 'female' | 'male') {
  const bmi = calcBMI(weight, height);
  const tolose = Math.max(0, weight - targetWeight);
  let weeklyLoss = 0.5;
  if (bmi >= 30) weeklyLoss = 0.75;
  if (bmi >= 35) weeklyLoss = 1.0;
  if (age > 45) weeklyLoss = Math.max(0.3, weeklyLoss - 0.1);
  const weeks = tolose > 0 ? Math.ceil(tolose / weeklyLoss) : 0;
  let bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.55);
  const dailyCals = Math.max(1200, tdee - 500);
  let planName = '', planNameEn = '', planDesc = '', planDescEn = '';
  let sessionsPerWeek = 4;
  if (bmi < 25) {
    planName = 'برنامج بناء العضلات والتنشيط'; planNameEn = 'Muscle Building & Toning';
    planDesc = gender === 'female' ? 'وزنك في النطاق الطبيعي - ركزي على بناء العضلات وتحسين القوام' : 'وزنك في النطاق الطبيعي - ركز على بناء العضلات وتحسين القوام';
    planDescEn = 'Weight is in normal range - focus on muscle building and body toning';
    sessionsPerWeek = 4;
  } else if (bmi < 30) {
    planName = 'برنامج حرق الدهون وبناء العضلات'; planNameEn = 'Fat Burn & Muscle Build';
    planDesc = 'مزيج متوازن من الكارديو والأوزان لحرق الدهون وبناء العضلات في آنٍ واحد';
    planDescEn = 'Balanced mix of cardio and weights to burn fat and build muscle simultaneously';
    sessionsPerWeek = 5;
  } else {
    planName = 'برنامج إنقاص الوزن المكثف'; planNameEn = 'Intensive Weight Loss';
    planDesc = 'كارديو مكثف مع تمارين أوزان لحرق أكبر قدر من السعرات';
    planDescEn = 'Intensive cardio with weight training to maximize calorie burn';
    sessionsPerWeek = 5;
  }
  return { bmi, weeklyLoss, weeks, dailyCals, planName, planNameEn, planDesc, planDescEn, sessionsPerWeek };
}

// ── Weight Log Sub-component ─────────────────────────────────────────────
function WeightLogSection() {
  const { data, logWeight } = useGymTracker();
  const { lang } = useLanguage();
  const [newWeight, setNewWeight] = useState('');
  const [saved, setSaved] = useState(false);

  const handleLog = () => {
    const w = parseFloat(newWeight);
    if (!w || w < 30 || w > 250) return;
    logWeight(w);
    setNewWeight('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sorted = [...data.weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const last5 = sorted.slice(-5).reverse();

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h3 className="font-bold text-gray-800 mb-3">⚖️ {lang === 'ar' ? 'سجل الوزن' : 'Weight Log'}</h3>
      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="number" step="0.1" min="30" max="250"
          value={newWeight}
          onChange={e => setNewWeight(e.target.value)}
          placeholder={lang === 'ar' ? 'وزنك اليوم (كجم)' : "Today's weight (kg)"}
          className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none text-sm"
        />
        <button
          onClick={handleLog}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
          style={{ background: saved ? '#10B981' : '#E05A00' }}
        >
          {saved ? '✅' : (lang === 'ar' ? 'سجّل' : 'Log')}
        </button>
      </div>
      {/* Last 5 entries */}
      {last5.length > 0 && (
        <div className="space-y-2">
          {last5.map((entry, i) => {
            const prev = sorted[sorted.length - last5.length + (last5.length - 1 - i) - 1];
            const diff = prev ? entry.weight - prev.weight : 0;
            return (
              <div key={entry.date} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">
                  {new Date(entry.date).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{entry.weight} kg</span>
                  {i < last5.length - 1 && diff !== 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                      background: diff < 0 ? '#D1FAE5' : '#FEE2E2',
                      color: diff < 0 ? '#065F46' : '#991B1B',
                    }}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Help Section Sub-component ──────────────────────────────────────────────
function HelpSection({ lang }: { lang: 'ar' | 'en' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span className="font-bold text-gray-800 text-sm">
          📘 {lang === 'ar' ? 'دليل الاستخدام' : 'Help & User Guide'}
        </span>
        <span className="text-gray-400 text-lg transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <UserGuide />
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function ProfilePanel() {
  const { profile, updateProfile, resetAll } = useGymTracker();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [form, setForm] = useState({ ...profile });
  // Inline current weight editing
  const [editingWeight, setEditingWeight] = useState(false);
  const [inlineWeight, setInlineWeight] = useState(profile.currentWeight.toString());
  // Inline target weight editing
  const [editingTarget, setEditingTarget] = useState(false);
  const [inlineTarget, setInlineTarget] = useState(profile.targetWeight.toString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const uploadAvatarMutation = trpc.userProfile.uploadAvatar.useMutation();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image too large (max 5 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarPreview(base64); // Show preview immediately
      setAvatarUploading(true);
      try {
        const { url } = await uploadAvatarMutation.mutateAsync({
          base64,
          mimeType: file.type || 'image/jpeg',
        });
        // Store S3 URL (not base64) in localStorage profile
        updateProfile({ ...profile, avatarUrl: url });
        setAvatarPreview(url);
      } catch {
        // Fallback: keep base64 in localStorage if S3 upload fails
        updateProfile({ ...profile, avatarUrl: base64 });
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const plan = calcPlan(profile.age, profile.currentWeight, profile.targetWeight, profile.height, profile.gender);
  const bmiCat = getBMICategory(plan.bmi, lang);
  const bmiPercent = Math.min(100, Math.max(0, ((plan.bmi - 15) / (40 - 15)) * 100));

  const handleSave = () => {
    const cw = Number(form.currentWeight);
    const tw = Number(form.targetWeight);
    if (!cw || cw < 30 || cw > 250) return;
    if (!tw || tw < 30 || tw > 250) return;
    updateProfile({
      name: form.name,
      age: Number(form.age) || 36,
      height: Number(form.height) || 165,
      currentWeight: cw,
      targetWeight: tw,
      startWeight: Number(form.startWeight) || profile.startWeight,
      gender: form.gender,
    });
    setEditing(false);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pb-24 px-4 max-w-lg mx-auto space-y-4">
      {/* Language Switcher */}
      <div className="flex gap-2 pt-4 justify-end">
        {(['ar', 'en'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${lang === l ? 'bg-[#1B2E5E] text-white border-[#1B2E5E]' : 'bg-white text-gray-500 border-gray-200'}`}>
            {l === 'ar' ? 'العربية' : 'English'}
          </button>
        ))}
      </div>

      {/* ── Instagram-style profile header ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Top row: avatar + stats */}
        <div className="flex items-center gap-5 px-5 pt-6 pb-3">

          {/* Avatar — initials only, no upload */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 82, height: 82, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1B2E5E 0%, #7BB8D4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 900, color: 'white',
              boxShadow: '0 0 0 3px white, 0 0 0 4.5px #1B2E5E22',
              userSelect: 'none',
            }}>
              {profile.name ? profile.name.trim()[0].toUpperCase() : '?'}
            </div>
          </div>

          {/* Stats columns */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>

            {/* Current Weight */}
            <div onClick={() => { setInlineWeight(profile.currentWeight.toString()); setEditingWeight(true); }}
              style={{ cursor: 'pointer', minWidth: 52 }}>
              {editingWeight ? (
                <form onSubmit={e => {
                  e.preventDefault();
                  const w = parseFloat(inlineWeight);
                  if (w >= 30 && w <= 250) updateProfile({ ...profile, currentWeight: w });
                  setEditingWeight(false);
                }}>
                  <input type="number" step="0.1" min="30" max="250"
                    value={inlineWeight} autoFocus
                    onChange={e => setInlineWeight(e.target.value)}
                    onBlur={() => { const w = parseFloat(inlineWeight); if (w >= 30 && w <= 250) updateProfile({ ...profile, currentWeight: w }); setEditingWeight(false); }}
                    style={{ width: 52, textAlign: 'center', fontSize: 17, fontWeight: 900, color: '#1B2E5E', borderBottom: '2px solid #1B2E5E', outline: 'none', background: 'transparent' }}
                  />
                </form>
              ) : (
                <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{profile.currentWeight}</div>
              )}
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{lang === 'ar' ? 'الوزن' : 'Weight'}</div>
              <div style={{ fontSize: 10, color: '#D1D5DB' }}>kg</div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', margin: '4px 0' }} />

            {/* Target Weight */}
            <div onClick={() => { setInlineTarget(profile.targetWeight.toString()); setEditingTarget(true); }}
              style={{ cursor: 'pointer', minWidth: 52 }}>
              {editingTarget ? (
                <form onSubmit={e => {
                  e.preventDefault();
                  const w = parseFloat(inlineTarget);
                  if (w >= 30 && w <= 250) updateProfile({ ...profile, targetWeight: w });
                  setEditingTarget(false);
                }}>
                  <input type="number" step="0.1" min="30" max="250"
                    value={inlineTarget} autoFocus
                    onChange={e => setInlineTarget(e.target.value)}
                    onBlur={() => { const w = parseFloat(inlineTarget); if (w >= 30 && w <= 250) updateProfile({ ...profile, targetWeight: w }); setEditingTarget(false); }}
                    style={{ width: 52, textAlign: 'center', fontSize: 17, fontWeight: 900, color: '#1B2E5E', borderBottom: '2px solid #1B2E5E', outline: 'none', background: 'transparent' }}
                  />
                </form>
              ) : (
                <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{profile.targetWeight}</div>
              )}
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{lang === 'ar' ? 'الهدف' : 'Target'}</div>
              <div style={{ fontSize: 10, color: '#D1D5DB' }}>kg</div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', margin: '4px 0' }} />

            {/* BMI */}
            <div style={{ minWidth: 52 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: bmiCat.color }}>{plan.bmi}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>BMI</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'white', background: bmiCat.color, borderRadius: 20, padding: '1px 7px', marginTop: 2, display: 'inline-block' }}>
                {bmiCat.label}
              </div>
            </div>
          </div>
        </div>

        {/* Name + meta */}
        <div style={{ padding: '0 20px 4px' }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#111827', margin: 0 }}>
            {profile.name || (lang === 'ar' ? 'بطلتي' : 'Champion')}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0', lineHeight: 1.5 }}>
            {lang === 'ar'
              ? `${profile.age} سنة · ${profile.height} سم · ${profile.gender === 'female' ? 'أنثى' : 'ذكر'}`
              : `${profile.age} yrs · ${profile.height} cm · ${profile.gender === 'female' ? 'Female' : 'Male'}`}
          </p>
        </div>

        {/* Edit Profile button */}
        <div style={{ padding: '12px 20px 16px' }}>
          <button
            onClick={() => { setForm({ ...profile }); setEditing(true); }}
            style={{
              width: '100%', padding: '7px 0',
              background: 'white', border: '1.5px solid #E5E7EB',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
              color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* BMI Meter */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-3">📊 {t('bmiLabel')}</h3>
        <div className="relative h-4 rounded-full overflow-hidden mb-2"
          style={{ background: 'linear-gradient(to right, #3B82F6 0%, #10B981 25%, #F59E0B 55%, #EF4444 80%, #7C3AED 100%)' }}>
          <div className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-md transition-all duration-500"
            style={{ left: `calc(${bmiPercent}% - 8px)` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black" style={{ color: bmiCat.color }}>{plan.bmi}</span>
          <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: bmiCat.color }}>
            {bmiCat.label}
          </span>
        </div>
      </div>

      {/* ── Personalized Plan — modern minimalist ── */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        {/* Header strip */}
        <div style={{
          background: '#1B2E5E',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#7BB8D4', fontSize: 10, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('recommendedPlan')}
            </p>
            <p style={{ color: 'white', fontSize: 15, fontWeight: 900, margin: '3px 0 0' }}>
              {lang === 'ar' ? plan.planName : plan.planNameEn}
            </p>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>🎯</div>
        </div>

        {/* Description */}
        <div style={{ padding: '12px 18px 4px', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            {lang === 'ar' ? plan.planDesc : plan.planDescEn}
          </p>
        </div>

        {/* Stats rows */}
        {[
          {
            svgPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            label: t('planDuration'),
            value: plan.weeks > 0 ? `${plan.weeks}` : '—',
            unit: plan.weeks > 0 ? t('weeks') : (lang === 'ar' ? 'في الوزن المثالي' : 'At ideal weight'),
            accent: '#1B2E5E',
          },
          {
            svgPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
            label: t('weeklyLoss'),
            value: `${plan.weeklyLoss}`,
            unit: `${t('kg')} / ${lang === 'ar' ? 'أسبوع' : 'week'}`,
            accent: '#7BB8D4',
          },
          {
            svgPath: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
            label: t('dailyCalories'),
            value: `${plan.dailyCals}`,
            unit: t('calories'),
            accent: '#E05A00',
          },
          {
            svgPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
            label: lang === 'ar' ? 'جلسات أسبوعياً' : 'Sessions / week',
            value: `${plan.sessionsPerWeek}`,
            unit: lang === 'ar' ? 'جلسات' : 'sessions',
            accent: '#10B981',
          },
        ].map((row, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            padding: '13px 18px',
            borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none',
            gap: 14,
          }}>
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${row.accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={row.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={row.svgPath} />
              </svg>
            </div>
            {/* Label */}
            <div style={{ flex: 1 }}>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0, fontWeight: 600 }}>{row.label}</p>
            </div>
            {/* Value */}
            <div style={{ textAlign: 'end' }}>
              <span style={{ color: '#111827', fontSize: 16, fontWeight: 900 }}>{row.value}</span>
              <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 4, marginLeft: 4 }}>{row.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Status Card */}
      {(() => {
        try {
          const stored = JSON.parse(localStorage.getItem('primefit_license') ?? 'null') as {
            key?: string; plan?: string; expiresAt?: string | null;
            customerName?: string; customerEmail?: string; verifiedAt?: string;
          } | null;
          if (!stored?.key) return null;
          const expiresAt  = stored.expiresAt ? new Date(stored.expiresAt) : null;
          const daysLeft   = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000) : null;
          const isExpired  = expiresAt ? expiresAt < new Date() : false;
          const planLabels: Record<string, string> = {
            monthly:   lang === 'ar' ? 'تجربة مجانية' : 'Free Trial',
            quarterly: lang === 'ar' ? 'ربع سنوي'     : 'Quarterly',
            yearly:    lang === 'ar' ? 'سنوي'          : 'Yearly',
            lifetime:  lang === 'ar' ? 'دائم'          : 'Lifetime',
          };
          const planLabel  = planLabels[stored.plan ?? 'monthly'] ?? (lang === 'ar' ? 'نشط' : 'Active');
          const statusColor = isExpired ? '#EF4444' : daysLeft !== null && daysLeft <= 3 ? '#F59E0B' : '#22C55E';
          return (
            <div style={{
              background: 'white', borderRadius: 16, padding: '16px 18px',
              boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
              border: `1.5px solid ${statusColor}33`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: '#1B2E5E', fontSize: 14 }}>
                  🔑 {lang === 'ar' ? 'الاشتراك' : 'Subscription'}
                </span>
                <span style={{
                  background: `${statusColor}22`, color: statusColor,
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800,
                }}>
                  {isExpired ? (lang === 'ar' ? 'منتهي' : 'Expired') : (lang === 'ar' ? 'نشط' : 'Active')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 3px', color: '#374151', fontSize: 13, fontWeight: 700 }}>{planLabel}</p>
                  <p style={{ margin: 0, color: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}>{stored.key}</p>
                </div>
                <div style={{ textAlign: 'end' }}>
                  {expiresAt && (
                    <p style={{ margin: 0, color: statusColor, fontSize: 12, fontWeight: 700 }}>
                      {isExpired
                        ? (lang === 'ar' ? 'انتهى' : 'Expired')
                        : daysLeft === 0 ? (lang === 'ar' ? 'اليوم' : 'Today')
                        : `${daysLeft} ${lang === 'ar' ? 'يوم' : 'days'}`}
                    </p>
                  )}
                  {expiresAt && (
                    <p style={{ margin: '2px 0 0', color: '#9CA3AF', fontSize: 10 }}>
                      {expiresAt.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* Notification Settings */}
      <NotificationSettings />
      {/* Logout Button */}
      <div className="pb-2">
        <button
          onClick={() => {
            if (window.confirm(lang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Logout?')) {
              trpc.standaloneAuth.logout.useMutation().mutate(undefined, {
                onSuccess: () => {
                  window.location.href = '/';
                },
              });
            }
          }}
          className="w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all"
          style={{ borderColor: '#EF4444', color: '#DC2626', background: 'rgba(239,68,68,0.08)' }}
        >
          🚪 {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>
      {/* Change License Button */}
      <div className="pb-2">
        <button
          onClick={() => {
            if (window.confirm(lang === 'ar' ? 'هل تريد تغيير مفتاح الترخيص؟ سيتم تسجيل خروجك من البرنامج.' : 'Change license key? You will be logged out of the app.')) {
              localStorage.removeItem('primefit_license');
              window.location.reload();
            }
          }}
          className="w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all"
          style={{ borderColor: '#7BB8D4', color: '#1B2E5E', background: 'rgba(123,184,212,0.08)' }}
        >
          🔑 {lang === 'ar' ? 'تغيير مفتاح الترخيص' : 'Change License Key'}
        </button>
      </div>
      {/* Reset Button */}
      <div className="pb-2">
        <button onClick={() => setShowReset(true)}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all">
          🗑️ {t('resetData')}
        </button>
      </div>

      {/* Help Section */}
      <HelpSection lang={lang} />

      {/* App Info Footer */}
      <div className="pb-6 text-center" style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, marginTop: 4 }}>
        <p className="text-xs text-gray-400 leading-relaxed">
          {lang === 'ar'
            ? `تاريخ البداية: ${new Date(profile.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • البيانات محفوظة محلياً على جهازك 🔒`
            : `Started: ${new Date(profile.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • Data saved locally on your device 🔒`
          }
        </p>
        <p className="text-xs text-gray-300 mt-1">Gym Tracker v1.0 • Auto-save enabled ✅</p>
        <p className="text-xs mt-2" style={{ color: '#C8C8D0', letterSpacing: '0.03em' }}>
          Made by <span style={{ fontWeight: 700, color: '#B0B0C0' }}>Primeco</span>  © {new Date().getFullYear()} All rights reserved
        </p>
      </div>

      {/* Edit Modal - rendered via Portal to escape stacking context */}
      {editing && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 0 0',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 520,
            maxHeight: '92vh', overflowY: 'auto',
          }}>
            <div className="p-5">
              <h3 className="text-lg font-black text-gray-800 mb-4">✏️ {t('editProfile')}</h3>
              <div className="space-y-4">
                {/* ── Current Weight - Highlighted at top ── */}
                <div className="bg-orange-50 border-2 border-[#E05A00] rounded-2xl p-4">
                  <label className="text-sm font-black text-[#E05A00] block mb-2">⚖️ {lang === 'ar' ? 'الوزن الحالي' : 'Current Weight'}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" step="0.1" min="30" max="250"
                      value={form.currentWeight || ''}
                      onChange={e => setForm({ ...form, currentWeight: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder={lang === 'ar' ? 'مثال: 72.6' : 'e.g. 72.6'}
                      className="flex-1 border-2 border-orange-300 rounded-xl px-4 py-3 text-gray-800 text-lg font-bold focus:border-[#E05A00] outline-none bg-white"
                      autoFocus
                    />
                    <span className="text-lg font-bold text-[#E05A00]">kg</span>
                  </div>
                  {form.currentWeight > 0 && form.currentWeight < 30 && (
                    <p className="text-xs text-red-500 mt-1">{lang === 'ar' ? 'الوزن يجب أن يكون أكثر من 30 كجم' : 'Weight must be over 30 kg'}</p>
                  )}
                  {Number(form.height) > 0 && Number(form.currentWeight) >= 30 && (() => {
                    const previewBMI = calcBMI(Number(form.currentWeight), Number(form.height));
                    const previewCat = getBMICategory(previewBMI, lang);
                    return (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">BMI:</span>
                        <span className="text-sm font-black" style={{ color: previewCat.color }}>{previewBMI} — {previewCat.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">{t('name')}</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none"
                    placeholder={lang === 'ar' ? 'اسمك...' : 'Your name...'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('age')}</label>
                    <input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" min={10} max={100} placeholder="e.g. 36" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('height')}</label>
                    <input type="number" value={form.height} onChange={e => setForm({ ...form, height: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" min={100} max={250} placeholder="e.g. 165" />
                  </div>
                </div>
                {/* Target Weight */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    🎯 {t('targetWeightLabel')} <span className="text-xs text-gray-400">(kg)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number" step="0.1" min="30" max="250"
                      value={form.targetWeight || ''}
                      onChange={e => setForm({ ...form, targetWeight: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder={lang === 'ar' ? 'مثال: 65' : 'e.g. 65'}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">kg</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">{t('startWeightLabel')}</label>
                  <input type="number" step="0.1" value={form.startWeight} onChange={e => setForm({ ...form, startWeight: Number(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" min={30} max={300} placeholder="e.g. 72.6" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">{t('gender')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['female', 'male'] as const).map(g => (
                      <button key={g} onClick={() => setForm({ ...form, gender: g })}
                        className={`py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${form.gender === g ? 'bg-[#E05A00] text-white border-[#E05A00]' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {g === 'female' ? `♀️ ${t('genderFemale')}` : `♂️ ${t('genderMale')}`}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Live BMI Preview */}
                {Number(form.height) > 0 && Number(form.currentWeight) > 0 && (() => {
                  const previewBMI = calcBMI(Number(form.currentWeight), Number(form.height));
                  const previewCat = getBMICategory(previewBMI, lang);
                  return (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-sm text-gray-500">{t('bmiLabel')}</div>
                      <div className="text-2xl font-black mt-1" style={{ color: previewCat.color }}>{previewBMI}</div>
                      <div className="text-sm font-semibold mt-0.5" style={{ color: previewCat.color }}>{previewCat.label}</div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid #E5E7EB', background: 'white', color: '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >{t('cancel')}</button>
                <button onClick={handleSave}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#1B2E5E', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >✅ {t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Reset Confirm Modal - inline styles only, no Tailwind dependency */}
      {showReset && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
        }}>
          <div dir={isRTL ? 'rtl' : 'ltr'} style={{
            background: 'white', borderRadius: 20,
            width: '100%', maxWidth: 360,
            padding: '28px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#DC2626' }}>
                {t('resetData')}
              </h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>
                {t('resetWarning')}
              </p>
            </div>
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
                {lang === 'ar'
                  ? '🗑️ سيتم حذف: جميع جلسات التمرين، سجل الوزن، بيانات الملف الشخصي. لا يمكن التراجع عن هذا الإجراء.'
                  : '🗑️ This will delete: all workout sessions, weight log, and profile data. This cannot be undone.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowReset(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  border: '2px solid #E5E7EB', background: 'white',
                  color: '#6B7280', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => { resetAll(); setShowReset(false); }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  border: 'none', background: '#EF4444',
                  color: 'white', fontSize: 14, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('resetConfirm')}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

export default ProfilePanel;
