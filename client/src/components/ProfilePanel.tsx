// ProfilePanel - Smart editable profile with BMI, personalized plan, language switcher
// Design: Energetic Sports RTL, Primary #E05A00, Secondary #1A7A4A
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useGymTracker } from '@/hooks/useGymTracker';
import NotificationSettings from './NotificationSettings';
import PrivacySettingsSection from './PrivacySettingsSection';
import UserGuide from './UserGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppIcons } from './AppIcons';

// ── BMI & Plan Calculator ──────────────────────────────────────────────────
function calcBMI(weight: number, height: number): number {
  if (!height || !weight) return 0;
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

function getBMICategory(bmi: number, lang: 'ar' | 'en') {
  if (bmi < 18.5) return { label: lang === 'ar' ? 'نقص وزن' : 'Underweight', color: '#3B82F6' };
  if (bmi < 25)   return { label: lang === 'ar' ? 'طبيعي' : 'Normal', color: '#10B981' };
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
      <h3 className="font-bold text-gray-800 mb-3">{lang === 'ar' ? 'سجل الوزن' : 'Weight Log'}</h3>
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
          <span style={{display:'flex',alignItems:'center',gap:4}}>{saved ? <AppIcons.Check size={14} /> : null}{saved ? '' : (lang === 'ar' ? 'سجّل' : 'Log')}</span>
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
          {lang === 'ar' ? 'دليل الاستخدام' : 'Help & User Guide'}
        </span>
        <span className="text-gray-400 text-lg transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
          <AppIcons.ChevronDown size={14} />
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

// ── Subscription Card ────────────────────────────────────────────────────────────
function SubscriptionCard({ lang, isAdmin }: { lang: 'ar' | 'en'; isAdmin: boolean }) {
  const subQuery = trpc.subscription.getStatus.useQuery();
  const sub = subQuery.data;

  if (subQuery.isLoading) return null;

  // Determine display values
  let planDisplay = '';
  let periodDisplay = '';
  let statusLabel = '';
  let statusColor = '#22C55E';
  let expiresAt: Date | null = null;
  let daysLeft: number | null = null;
  let isExpired = false;

  if (isAdmin) {
    // Admin: show Admin badge
    planDisplay = lang === 'ar' ? 'مدير' : 'Admin';
    periodDisplay = lang === 'ar' ? 'وصول كامل' : 'Full Access';
    statusLabel = lang === 'ar' ? 'نشط' : 'Active';
    statusColor = '#22C55E';
  } else if (sub) {
    const planLabels: Record<string, Record<'ar' | 'en', string>> = {
      free:       { ar: 'مجاني',      en: 'Free' },
      prime_plus: { ar: 'Prime Plus', en: 'Prime Plus' },
      prime_pro:  { ar: 'Prime Pro',  en: 'Prime Pro' },
    };
    const periodLabels: Record<string, Record<'ar' | 'en', string>> = {
      monthly:    { ar: 'شهري',         en: 'Monthly' },
      yearly:     { ar: 'سنوي',          en: 'Yearly' },
      lifetime:   { ar: 'دائم',          en: 'Lifetime' },
      free_trial: { ar: 'تجريبي مجاني', en: 'Free Trial' },
    };
    planDisplay = planLabels[sub.plan ?? 'free']?.[lang] ?? sub.plan ?? '';
    const subAny = sub as any;
    periodDisplay = periodLabels[subAny.period ?? 'monthly']?.[lang] ?? '';
    expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
    daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000) : null;
    isExpired = expiresAt ? expiresAt < new Date() : false;
    statusColor = isExpired ? '#EF4444' : (daysLeft !== null && daysLeft <= 3 ? '#F59E0B' : '#22C55E');
    statusLabel = isExpired
      ? (lang === 'ar' ? 'منتهي' : 'Expired')
      : sub.status === 'trialing'
        ? (lang === 'ar' ? 'تجريبي' : 'Trialing')
        : (lang === 'ar' ? 'نشط' : 'Active');
  } else {
    return null;
  }

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px 18px',
      boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
      border: `1.5px solid ${statusColor}33`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 800, color: '#1B2E5E', fontSize: 15 }}>
          {lang === 'ar' ? 'الاشتراك' : 'Subscription'}
        </span>
        <span style={{
          background: `${statusColor}22`, color: statusColor,
          borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 800,
        }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 2px', color: '#374151', fontSize: 15, fontWeight: 800 }}>{periodDisplay || planDisplay}</p>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13, fontWeight: 600 }}>{planDisplay}</p>
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
}

// ── Component ─────────────────────────────────────────────────────────────
export function ProfilePanel() {
  const { profile, updateProfile, resetAll } = useGymTracker();
  const { logout: logoutFn, user } = useAuth();
  const { lang, setLang, t, isRTL } = useLanguage();
  const userEmail = (user as any)?.email || '';
  const userRole = (user as any)?.role || 'user';
  const isAdmin = userRole === 'admin';
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

      {/* ── Profile Settings Header (reference design) ── */}
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

        {/* Name + meta + email */}
        <div style={{ padding: '0 20px 4px' }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: 0 }}>
            {profile.name || (lang === 'ar' ? 'بطلتي' : 'Champion')}
          </p>
          {userEmail && (
            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0', direction: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
              {userEmail}
            </p>
          )}
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0', lineHeight: 1.5 }}>
            {lang === 'ar'
              ? `${profile.age} سنة · ${profile.height} سم · ${profile.gender === 'female' ? 'أنثى' : 'ذكر'}`
              : `${profile.age} yrs · ${profile.height} cm · ${profile.gender === 'female' ? 'Female' : 'Male'}`}
          </p>
          {isAdmin && (
            <span style={{ display: 'inline-block', marginTop: 4, background: '#1B2E5E', color: 'white', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 10px', letterSpacing: '0.05em' }}>
              {lang === 'ar' ? 'مدير' : 'Admin'}
            </span>
          )}
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
        <h3 className="font-bold text-gray-800 mb-3">{t('bmiLabel')}</h3>
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
          }}><AppIcons.Target size={16} /></div>
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

      {/* Subscription Status Card — uses DB subscription via trpc */}
      <SubscriptionCard lang={lang} isAdmin={isAdmin} />

      {/* Logout Button */}
      <div className="pb-2">
        <button
          onClick={async () => {
            if (window.confirm(lang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Logout?')) {
              await logoutFn();
              window.location.href = '/';
            }
          }}
          className="w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all"
          style={{ borderColor: '#EF4444', color: '#DC2626', background: 'rgba(239,68,68,0.08)' }}
        >
          {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>

      {/* Reset Button */}
      <div className="pb-2">
        <button onClick={() => setShowReset(true)}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all">
          {t('resetData')}
        </button>
      </div>

      {/* Privacy Settings */}
      <PrivacySettingsSection lang={lang} />
      {/* Help Section */}
      <HelpSection lang={lang} />

      {/* App Info Footer */}
      <div className="pb-6 text-center" style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, marginTop: 4 }}>
        <p className="text-xs mt-2" style={{ color: '#C8C8D0', letterSpacing: '0.03em' }}>
          Made by <span style={{ fontWeight: 700, color: '#B0B0C0' }}>Primeco</span> © {new Date().getFullYear()} All rights reserved
        </p>
      </div>

      {/* Edit Modal - rendered via Portal to escape stacking context */}
      {editing && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'white',
          overflowY: 'auto',
          fontFamily: lang === 'ar' ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
        }}>
          <div dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 520, margin: '0 auto', minHeight: '100vh', background: 'white' }}>

            {/* ── Header ── */}
            <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F3F4F6' }}>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#374151', fontSize: 20, lineHeight: 1 }}>←</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827' }}>
                  {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                  {lang === 'ar' ? 'تحديث معلوماتك وتتبع تقدمك' : 'Update your information and track your progress'}
                </p>
              </div>
              <div style={{ width: 28 }} />
            </div>

            {/* ── User Card ── */}
            <div style={{ margin: '16px 16px 0', background: '#F8FAFC', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #1B2E5E 0%, #7BB8D4 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: 'white',
                border: '3px solid #1B2E5E',
              }}>
                {form.name ? form.name.trim()[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>{form.name || (lang === 'ar' ? 'بطلتي' : 'Champion')}</p>
                {userEmail && <p style={{ margin: '2px 0 4px', fontSize: 12, color: '#6B7280', direction: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{userEmail}</p>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {lang === 'ar' ? 'حساب البريد' : 'Email Account'}
                </span>
              </div>
            </div>

            {/* ── Personal Information ── */}
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2E5E" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{lang === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</span>
              </div>

              {/* Field helper */}
              {([
                { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', label: lang === 'ar' ? 'الاسم' : 'Name', field: 'name' as const, type: 'text', placeholder: lang === 'ar' ? 'اسمك' : 'Your name', min: undefined, max: undefined, step: undefined },
                { icon: 'M3 6h18M3 12h18M3 18h18', label: lang === 'ar' ? 'الوزن الحالي (kg)' : 'Current Weight (kg)', field: 'currentWeight' as const, type: 'number', placeholder: '73.1', min: 30, max: 250, step: 0.1 },
                { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', label: lang === 'ar' ? 'الوزن المستهدف (kg)' : 'Target Weight (kg)', field: 'targetWeight' as const, type: 'number', placeholder: '66', min: 30, max: 250, step: 0.1 },
                { icon: 'M3 3v18h18', label: lang === 'ar' ? 'وزن البداية (kg)' : 'Starting Weight (kg)', field: 'startWeight' as const, type: 'number', placeholder: '72.6', min: 30, max: 300, step: 0.1 },
              ] as const).map((f) => (
                <div key={f.field} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{f.label}</p>
                    <input
                      type={f.type}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      value={f.field === 'name' ? (form.name || '') : ((form[f.field] as number) || '')}
                      onChange={e => setForm({ ...form, [f.field]: f.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value })}
                      placeholder={f.placeholder}
                      autoFocus={f.field === 'currentWeight'}
                      style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              ))}

              {/* Height + Age side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {([
                  { icon: 'M12 2v20M2 12h20', label: lang === 'ar' ? 'الطول (cm)' : 'Height (cm)', field: 'height' as const, placeholder: '165', min: 100, max: 250 },
                  { icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: lang === 'ar' ? 'العمر' : 'Age', field: 'age' as const, placeholder: '36', min: 10, max: 100 },
                ] as const).map(f => (
                  <div key={f.field} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={f.icon} />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{f.label}</p>
                      <input
                        type="number"
                        min={f.min} max={f.max}
                        value={(form[f.field] as number) || ''}
                        onChange={e => setForm({ ...form, [f.field]: Number(e.target.value) })}
                        placeholder={f.placeholder}
                        style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gender */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2E5E" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{lang === 'ar' ? 'الجنس' : 'Gender'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: '#F3F4F6', borderRadius: 12, padding: 4 }}>
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} onClick={() => setForm({ ...form, gender: g })}
                      style={{
                        padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                        background: form.gender === g ? '#2563EB' : 'transparent',
                        color: form.gender === g ? 'white' : '#6B7280',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}>{g === 'male' ? <AppIcons.Male size={14} /> : <AppIcons.Female size={14} />}{g === 'male' ? (lang === 'ar' ? 'ذكر' : 'Male') : (lang === 'ar' ? 'أنثى' : 'Female')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Health Summary ── */}
              {Number(form.height) > 0 && Number(form.currentWeight) >= 30 && (() => {
                const previewBMI = calcBMI(Number(form.currentWeight), Number(form.height));
                const previewCat = getBMICategory(previewBMI, lang);
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2E5E" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{lang === 'ar' ? 'ملخص الصحة' : 'Health Summary'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {/* Weight Status */}
                      <div style={{ background: `${previewCat.color}15`, border: `1.5px solid ${previewCat.color}40`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${previewCat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={previewCat.color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{previewCat.label}</p>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: previewCat.color }}>{previewBMI}</p>
                        </div>
                      </div>
                      {/* BMI */}
                      <div style={{ background: '#F8FAFC', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{lang === 'ar' ? 'مؤشر كتلة الجسم' : 'Body Mass Index (BMI)'}</p>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#2563EB' }}>{previewBMI}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Save / Cancel ── */}
              <div style={{ paddingBottom: 32 }}>
                <button onClick={handleSave}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#2563EB', color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                  <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Lock size={14} />{lang === 'ar' ? 'بياناتك آمنة وخاصة' : 'Your data is secure and private'}</span>
                </p>
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
              <div style={{ marginBottom: 8, display:"flex", justifyContent:"center" }}><AppIcons.Warning size={36} className="text-red-600" /></div>
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
                  ? 'سيتم حذف: جميع جلسات التمرين، سجل الوزن، بيانات الملف الشخصي. لا يمكن التراجع عن هذا الإجراء.'
                  : 'This will delete: all workout sessions, weight log, and profile data. This cannot be undone.'}
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
