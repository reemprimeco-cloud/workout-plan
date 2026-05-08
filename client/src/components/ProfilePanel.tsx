// ProfilePanel - Smart editable profile with BMI, personalized plan, language switcher
// Design: Energetic Sports RTL, Primary #E05A00, Secondary #1A7A4A
import { useState } from 'react';
import { useGymTracker } from '@/hooks/useGymTracker';
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

// ── Component ─────────────────────────────────────────────────────────────
export function ProfilePanel() {
  const { profile, updateProfile, resetAll } = useGymTracker();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [form, setForm] = useState({ ...profile });

  const plan = calcPlan(profile.age, profile.currentWeight, profile.targetWeight, profile.height, profile.gender);
  const bmiCat = getBMICategory(plan.bmi, lang);
  const bmiPercent = Math.min(100, Math.max(0, ((plan.bmi - 15) / (40 - 15)) * 100));

  const handleSave = () => {
    updateProfile({
      name: form.name,
      age: Number(form.age) || 36,
      height: Number(form.height) || 165,
      currentWeight: Number(form.currentWeight) || 72.6,
      targetWeight: Number(form.targetWeight) || 65,
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
            className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${lang === l ? 'bg-[#E05A00] text-white border-[#E05A00]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#E05A00]'}`}>
            {l === 'ar' ? '🇸🇦 العربية' : '🇬🇧 English'}
          </button>
        ))}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#E05A00] to-[#FF8C42] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">{profile.name || (lang === 'ar' ? 'بطلتي' : 'Champion')}</h2>
              <p className="text-orange-100 text-sm mt-0.5">
                {lang === 'ar' ? `${profile.age} سنة • ${profile.height} سم` : `${profile.age} yrs • ${profile.height} cm`}
              </p>
            </div>
            <button onClick={() => { setForm({ ...profile }); setEditing(true); }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all">
              ✏️ {t('edit')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: lang === 'ar' ? 'الوزن الحالي' : 'Current', value: `${profile.currentWeight} kg` },
            { label: lang === 'ar' ? 'الهدف' : 'Target', value: `${profile.targetWeight} kg` },
            { label: 'BMI', value: plan.bmi.toString() },
          ].map((s, i) => (
            <div key={i} className="p-4 text-center">
              <div className="text-xl font-black text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
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

      {/* App Info */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-3">ℹ️ {t('appInfo')}</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{t('startDate')}</span>
            <span className="font-semibold text-gray-800">
              {new Date(profile.startDate).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{lang === 'ar' ? 'حفظ البيانات' : 'Data Storage'}</span>
            <span className="font-semibold text-green-600">✅ {t('autoSave')}</span>
          </div>
          <div className="flex justify-between">
            <span>{lang === 'ar' ? 'البيانات' : 'Data'}</span>
            <span className="font-semibold text-blue-600">🔒 {t('dataLocal')}</span>
          </div>
        </div>
      </div>

      {/* Weight Log Section */}
      <WeightLogSection />

      {/* Reset Button */}
      <div className="pb-4">
        <button onClick={() => setShowReset(true)}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all">
          🗑️ {t('resetData')}
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-lg font-black text-gray-800 mb-4">✏️ {t('editProfile')}</h3>
              <div className="space-y-4">
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
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" min={15} max={80} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('height')}</label>
                    <input type="number" value={form.height} onChange={e => setForm({ ...form, height: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" min={140} max={210} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('currentWeightLabel')}</label>
                    <input type="number" step="0.1" value={form.currentWeight} onChange={e => setForm({ ...form, currentWeight: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1">{t('targetWeightLabel')}</label>
                    <input type="number" step="0.1" value={form.targetWeight} onChange={e => setForm({ ...form, targetWeight: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">{t('startWeightLabel')}</label>
                  <input type="number" step="0.1" value={form.startWeight} onChange={e => setForm({ ...form, startWeight: Number(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-[#E05A00] outline-none" />
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
      )}

      {/* Reset Confirm Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
      )}
    </div>
  );
}

export default ProfilePanel;
