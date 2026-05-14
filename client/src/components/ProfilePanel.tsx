// ProfilePanel - Smart editable profile with BMI, personalized plan, language switcher
// Design: Energetic Sports RTL, Primary #E05A00, Secondary #1A7A4A
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGymTracker } from '@/hooks/useGymTracker';
import type { UserProfile } from '@/hooks/useGymTracker';
import NotificationSettings from './NotificationSettings';
import UserGuide from './UserGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

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
    planDesc = 'وزنك في النطاق الطبيعي - ركزي على بناء العضلات وتحسين القوام';
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
                  {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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


// ── My Subscription Card ──────────────────────────────────────────────────
function MySubscriptionCard() {
  const { lang } = useLanguage();
  const [, navigate] = useLocation();
  const subQuery = trpc.subscription.getStatus.useQuery(undefined, { retry: false });
  const activateMutation = trpc.subscription.activateFreeTrial.useMutation({
    onSuccess: () => subQuery.refetch(),
  });
  const [keyInput, setKeyInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [errMsg, setErrMsg] = useState('');
   const [copied, setCopied] = useState(false);
  const sub = subQuery.data;
  // Read license key from localStorage as fallback
  const localKey = (() => { try { const s = localStorage.getItem('primefit_license'); return s ? JSON.parse(s).key : null; } catch { return null; } })();
  const displayKey = sub?.licenseKey ?? localKey ?? null;
  const isTrialing = sub?.status === 'trialing';
  const isActive = sub?.status === 'active' && sub?.plan !== 'free';
  const isExpired = sub?.status === 'expired';

  const planLabel: Record<string, Record<'ar'|'en', string>> = {
    free: { ar: 'مجاني', en: 'Free' },
    prime_plus: { ar: 'برايم بلس', en: 'Prime Plus' },
    prime_pro: { ar: 'برايم برو', en: 'Prime Pro' },
  };
  const statusLabel: Record<string, Record<'ar'|'en', string>> = {
    active: { ar: '✅ نشط', en: '✅ Active' },
    trialing: { ar: '🔵 تجريبي', en: '🔵 Free Trial' },
    expired: { ar: '⏰ منتهي', en: '⏰ Expired' },
    cancelled: { ar: '❌ ملغي', en: '❌ Cancelled' },
    pending: { ar: '⏳ معلق', en: '⏳ Pending' },
  };
  const statusColor: Record<string, string> = {
    active: '#16A34A', trialing: '#2563EB', expired: '#DC2626', cancelled: '#64748b', pending: '#D97706',
  };

  const handleActivate = () => {
    setErrMsg('');
    if (!keyInput.trim()) { setErrMsg(lang === 'ar' ? 'يرجى إدخال مفتاح الترخيص' : 'Please enter a license key'); return; }
    activateMutation.mutate(
      { licenseKey: keyInput.trim() },
      {
        onError: (err: any) => setErrMsg(err.message),
        onSuccess: () => { setShowInput(false); setKeyInput(''); },
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h3 className="font-bold text-gray-800 mb-3">💳 {lang === 'ar' ? 'اشتراكي' : 'My Subscription'}</h3>
      {subQuery.isLoading ? (
        <p className="text-sm text-gray-400">⏳ {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{lang === 'ar' ? 'الخطة' : 'Plan'}</span>
            <span className="font-bold text-gray-800">
              {planLabel[sub?.plan ?? 'free']?.[lang] ?? (sub?.plan ?? 'Free')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: `${statusColor[sub?.status ?? 'active']}18`, color: statusColor[sub?.status ?? 'active'] }}>
              {statusLabel[sub?.status ?? 'active']?.[lang] ?? sub?.status ?? 'Active'}
            </span>
          </div>
          {sub?.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}</span>
              <span className="text-sm font-semibold text-gray-700">
                {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{lang === 'ar' ? 'مفتاح الترخيص' : 'License Key'}</span>
            {displayKey ? (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-gray-700 tracking-wide">{displayKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(displayKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title={lang === 'ar' ? 'نسخ' : 'Copy'}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 13 }}
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">{lang === 'ar' ? 'لا يوجد مفتاح' : 'No key linked'}</span>
            )}
          </div>
          {/* Activate free trial section */}
          {!isActive && !isTrialing && (
            <div className="pt-2 border-t border-gray-100">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#1B2E5E', color: 'white' }}
                >
                  🔑 {lang === 'ar' ? 'تفعيل بمفتاح ترخيص مجاني' : 'Activate with Free License Key'}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value.toUpperCase())}
                    placeholder="PRIME-XXXX-XXXX"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#1B2E5E] outline-none"
                    style={{ direction: 'ltr' }}
                  />
                  {errMsg && <p className="text-xs text-red-500">{errMsg}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowInput(false); setKeyInput(''); setErrMsg(''); }}
                      className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={handleActivate} disabled={activateMutation.isPending}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: activateMutation.isPending ? '#94A3B8' : '#1B2E5E' }}>
                      {activateMutation.isPending ? '⏳' : (lang === 'ar' ? '✅ تفعيل' : '✅ Activate')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {isExpired && (
            <p className="text-xs text-orange-500 pt-1">
              {lang === 'ar' ? '⚠️ انتهت صلاحية اشتراكك. يمكنك إعادة استخدام مفتاح الترخيص بعد الشراء.' : '⚠️ Your subscription has expired. You can reuse your license key after purchasing a plan.'}
            </p>
          )}
          {/* Renew / Upgrade CTA */}
          {(isExpired || (!isActive && !isTrialing)) && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-2.5 rounded-xl text-sm font-bold mt-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #E05A00, #FF8C42)', color: 'white' }}
            >
              💎 {lang === 'ar' ? 'عرض خطط الاشتراك' : 'View Subscription Plans'}
            </button>
          )}
          {isActive && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#F0F4F8', color: '#1B2E5E' }}
              >
                🔄 {lang === 'ar' ? 'تجديد أو ترقية الاشتراك' : 'Renew or Upgrade Plan'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Profile Completion Bar ────────────────────────────────────────────────────
function ProfileCompletionBar({ profile, hasAvatar, lang }: { profile: UserProfile; hasAvatar: boolean; lang: 'ar' | 'en' }) {
  const fields = [
    { key: 'name', done: !!profile.name, label: lang === 'ar' ? 'الاسم' : 'Name' },
    { key: 'weight', done: profile.currentWeight > 0, label: lang === 'ar' ? 'الوزن' : 'Weight' },
    { key: 'height', done: profile.height > 0, label: lang === 'ar' ? 'الطول' : 'Height' },
    { key: 'age', done: profile.age > 0, label: lang === 'ar' ? 'العمر' : 'Age' },
    { key: 'goal', done: profile.targetWeight > 0, label: lang === 'ar' ? 'الهدف' : 'Goal' },
    { key: 'avatar', done: hasAvatar, label: lang === 'ar' ? 'الصورة' : 'Photo' },
  ];
  const completed = fields.filter(f => f.done).length;
  const percent = Math.round((completed / fields.length) * 100);
  if (percent === 100) return null; // Hide when complete
  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">
          {lang === 'ar' ? '📋 اكتمال الملف الشخصي' : '📋 Profile Completion'}
        </span>
        <span className="text-sm font-black" style={{ color: percent >= 80 ? '#16A34A' : percent >= 50 ? '#D97706' : '#DC2626' }}>
          {percent}%
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, background: percent >= 80 ? '#16A34A' : percent >= 50 ? '#D97706' : '#E05A00' }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fields.map(f => (
          <span key={f.key} className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: f.done ? '#16A34A18' : '#F3F4F6',
              color: f.done ? '#16A34A' : '#9CA3AF',
              border: `1px solid ${f.done ? '#16A34A40' : '#E5E7EB'}`,
            }}>
            {f.done ? '✓' : '○'} {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function ProfilePanel() {
  const { profile, updateProfile, resetAll } = useGymTracker();
  const { lang, setLang, t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [form, setForm] = useState({ ...profile });
  // Inline current weight editing
  const [editingWeight, setEditingWeight] = useState(false);
  const [inlineWeight, setInlineWeight] = useState(profile.currentWeight.toString());
  // Inline target weight editing
  const [editingTarget, setEditingTarget] = useState(false);
  const [inlineTarget, setInlineTarget] = useState(profile.targetWeight.toString());
  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const profileQuery = trpc.userProfile.getProfile.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const uploadAvatarMutation = trpc.userProfile.uploadAvatar.useMutation({
    onSuccess: (data) => {
      setAvatarPreview(data.url);
      profileQuery.refetch();
    },
  });
  const updateNameMutation = trpc.userProfile.updateDisplayName.useMutation();
  // Sync avatar from DB on load
  useEffect(() => {
    if (profileQuery.data?.avatarUrl) {
      setAvatarPreview(profileQuery.data.avatarUrl);
    }
  }, [profileQuery.data?.avatarUrl]);
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'ar' ? 'حجم الصورة كبير جداً (الحد 5 ميجابايت)' : 'Image too large (max 5 MB)');
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // Canvas-based square crop + resize to 256×256
      const cropAndResize = (): Promise<string> => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = dataUrl;
      });
      const croppedBase64 = await cropAndResize();
      setAvatarPreview(croppedBase64); // optimistic preview
      try {
        await uploadAvatarMutation.mutateAsync({ base64: croppedBase64, mimeType: 'image/jpeg' });
      } catch (err: any) {
        alert(err.message ?? 'Upload failed');
        setAvatarPreview(profileQuery.data?.avatarUrl ?? null);
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
    // Sync name to DB if authenticated
    if (isAuthenticated && form.name) {
      updateNameMutation.mutate({ name: form.name });
    }
    setEditing(false);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pb-24 px-4 max-w-lg mx-auto space-y-4">
      {/* Language Switcher */}
      <div className="flex gap-2 pt-4 justify-end">
        {(['ar', 'en'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${lang === l ? 'bg-[#E05A00] text-white border-[#E05A00]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#E05A00]'}`}>
            {l === 'ar' ? '🇸🇦 العربية' : '🇬🇧 English'}
          </button>
        ))}
      </div>

      {/* Profile Completion Bar */}
      <ProfileCompletionBar profile={profile} hasAvatar={!!avatarPreview} lang={lang as 'ar' | 'en'} />
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#E05A00] to-[#FF8C42] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar circle — tap to upload */}
              <div className="relative flex-shrink-0">
                <div
                  onClick={() => isAuthenticated && avatarInputRef.current?.click()}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/60 shadow-md flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                  title={lang === 'ar' ? 'انقر لتغيير الصورة' : 'Tap to change photo'}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-white">
                      {(profile.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                      <span className="text-white text-xs">⏳</span>
                    </div>
                  )}
                </div>
                {isAuthenticated && (
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow cursor-pointer"
                    style={{ border: '1.5px solid #E05A00' }}
                  >
                    <span style={{ fontSize: 10 }}>📷</span>
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h2 className="text-xl font-black">{profile.name || (lang === 'ar' ? 'بطلتي' : 'Champion')}</h2>
                <p className="text-orange-100 text-sm mt-0.5">
                  {lang === 'ar' ? `${profile.age} سنة • ${profile.height} سم` : `${profile.age} yrs • ${profile.height} cm`}
                </p>
              </div>
            </div>
            <button onClick={() => { setForm({ ...profile }); setEditing(true); }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all">
              ✏️ {t('edit')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {/* Current Weight - inline editable */}
          <div className="p-4 text-center cursor-pointer group" onClick={() => { setInlineWeight(profile.currentWeight.toString()); setEditingWeight(true); }}>
            {editingWeight ? (
              <form onSubmit={e => {
                e.preventDefault();
                const w = parseFloat(inlineWeight);
                if (w >= 30 && w <= 250) {
                  updateProfile({ ...profile, currentWeight: w });
                }
                setEditingWeight(false);
              }}>
                <input
                  type="number" step="0.1" min="30" max="250"
                  value={inlineWeight}
                  onChange={e => setInlineWeight(e.target.value)}
                  onBlur={() => {
                    const w = parseFloat(inlineWeight);
                    if (w >= 30 && w <= 250) updateProfile({ ...profile, currentWeight: w });
                    setEditingWeight(false);
                  }}
                  autoFocus
                  className="w-full text-center text-lg font-black text-[#E05A00] border-b-2 border-[#E05A00] outline-none bg-transparent"
                />
                <div className="text-xs text-[#E05A00] mt-0.5">{lang === 'ar' ? '✓ حفظ' : '✓ Save'}</div>
              </form>
            ) : (
              <>
                <div className="text-xl font-black text-gray-800 group-hover:text-[#E05A00] transition-colors">
                  {profile.currentWeight} kg
                  <span className="text-xs text-gray-400 block font-normal group-hover:text-[#E05A00]">✏️</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{lang === 'ar' ? 'الوزن الحالي' : 'Current'}</div>
              </>
            )}
          </div>
          {/* Target Weight - inline editable */}
          <div className="p-4 text-center cursor-pointer group" onClick={() => { setInlineTarget(profile.targetWeight.toString()); setEditingTarget(true); }}>
            {editingTarget ? (
              <form onSubmit={e => {
                e.preventDefault();
                const w = parseFloat(inlineTarget);
                if (w >= 30 && w <= 250) {
                  updateProfile({ ...profile, targetWeight: w });
                }
                setEditingTarget(false);
              }}>
                <input
                  type="number" step="0.1" min="30" max="250"
                  value={inlineTarget}
                  onChange={e => setInlineTarget(e.target.value)}
                  onBlur={() => {
                    const w = parseFloat(inlineTarget);
                    if (w >= 30 && w <= 250) updateProfile({ ...profile, targetWeight: w });
                    setEditingTarget(false);
                  }}
                  autoFocus
                  className="w-full text-center text-lg font-black text-[#E05A00] border-b-2 border-[#E05A00] outline-none bg-transparent"
                />
                <div className="text-xs text-[#E05A00] mt-0.5">{lang === 'ar' ? '✓ حفظ' : '✓ Save'}</div>
              </form>
            ) : (
              <>
                <div className="text-xl font-black text-gray-800 group-hover:text-[#E05A00] transition-colors">
                  {profile.targetWeight} kg
                  <span className="text-xs text-gray-400 block font-normal group-hover:text-[#E05A00]">✏️</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{lang === 'ar' ? 'الهدف' : 'Target'}</div>
              </>
            )}
          </div>
          {/* BMI */}
          <div className="p-4 text-center">
            <div className="text-xl font-black text-gray-800">{plan.bmi}</div>
            <div className="text-xs text-gray-500 mt-0.5">BMI</div>
          </div>
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

      {/* Personalized Plan */}
      <div className="rounded-2xl shadow-md p-5" style={{ background: 'linear-gradient(135deg, #F0FAF5, #E4F5EC)', border: '2px solid #B8DFC9' }}>
        <h3 className="font-bold mb-1 text-sm" style={{ color: '#2D7A50' }}>{t('recommendedPlan')}</h3>
        <h4 className="text-lg font-black mb-2" style={{ color: '#1A5C3A' }}>{lang === 'ar' ? plan.planName : plan.planNameEn}</h4>
        <p className="text-sm mb-4" style={{ color: '#3D7A5A' }}>{lang === 'ar' ? plan.planDesc : plan.planDescEn}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📅', label: t('planDuration'), value: plan.weeks > 0 ? `${plan.weeks} ${t('weeks')}` : (lang === 'ar' ? 'في الوزن المثالي' : 'At ideal weight') },
            { icon: '⚖️', label: t('weeklyLoss'), value: `${plan.weeklyLoss} ${t('kg')} / ${lang === 'ar' ? 'أسبوع' : 'week'}` },
            { icon: '🔥', label: t('dailyCalories'), value: `${plan.dailyCals} ${t('calories')}` },
            { icon: '🏋️', label: lang === 'ar' ? 'جلسات أسبوعياً' : 'Sessions/week', value: `${plan.sessionsPerWeek} ${lang === 'ar' ? 'جلسات' : 'sessions'}` },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #C5E5D3' }}>
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-xs" style={{ color: '#4A8A6A' }}>{item.label}</div>
              <div className="font-bold text-sm" style={{ color: '#1A5C3A' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My Subscription Card */}
      <MySubscriptionCard />
      {/* Notification Settings */}
      <NotificationSettings />
      {/* WhatsApp Contact Button */}
      <div className="pb-2">
        <a
          href="https://wa.me/96565068000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {lang === 'ar' ? '📞 تواصل عبر واتسآب — 65068000' : '📞 Contact Us via WhatsApp — 65068000'}
        </a>
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
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">{t('cancel')}</button>
                <button onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-[#E05A00] text-white font-bold">✅ {t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Reset Confirm Modal - rendered via Portal */}
      {showReset && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-red-600 mb-2">⚠️ {t('resetData')}</h3>
            <p className="text-gray-600 text-sm mb-6">{t('resetWarning')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">{t('cancel')}</button>
              <button onClick={() => { resetAll(); setShowReset(false); }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm">{t('resetConfirm')}</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

export default ProfilePanel;
