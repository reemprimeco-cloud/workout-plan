// ============================================================
// Nutrition Page — AI Nutrition System
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
// Features: Dashboard, Meal Tracking, AI Food Scanner, AI Insights
// Bilingual: Arabic (Kuwaiti dialect) + English
// ============================================================
import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '../contexts/LanguageContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

// ── Brand colors ────────────────────────────────────────────
const NAVY      = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY       = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const GREEN     = '#10B981';
const ORANGE    = '#F59E0B';
const PURPLE    = '#8B5CF6';
const RED       = '#EF4444';

type NutritionTab = 'dashboard' | 'meals' | 'scanner' | 'insights';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ── Circular Progress Ring ──────────────────────────────────
function Ring({
  value, max, color, size = 80, strokeWidth = 8, label, sublabel,
}: {
  value: number; max: number; color: string; size?: number;
  strokeWidth?: number; label: string; sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const dash = pct * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EFF7" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', marginTop: -size * 0.7, marginBottom: size * 0.5 }}>
        <div style={{ fontSize: size * 0.18, fontWeight: 900, color: NAVY }}>{value}</div>
        <div style={{ fontSize: size * 0.12, color: '#7A9BB5' }}>/ {max}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, textAlign: 'center' }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: '#7A9BB5', textAlign: 'center' }}>{sublabel}</div>}
    </div>
  );
}

// ── Macro Bar ───────────────────────────────────────────────
function MacroBar({ label, value, max, color, unit = 'g' }: {
  label: string; value: number; max: number; color: string; unit?: string;
}) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{label}</span>
        <span style={{ fontSize: 12, color: '#7A9BB5' }}>{Math.round(value)}{unit} / {max}{unit}</span>
      </div>
      <div style={{ height: 8, background: '#E8EFF7', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ── Water Drop Button ───────────────────────────────────────
function WaterButton({ ml, label, onClick }: { ml: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 4px', borderRadius: 12,
      background: `linear-gradient(135deg, ${SKY}22, ${SKY}44)`,
      border: `1px solid ${SKY}66`, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 20 }}>💧</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{label}</span>
      <span style={{ fontSize: 10, color: '#7A9BB5' }}>{ml}ml</span>
    </button>
  );
}

// ── Dashboard Tab ───────────────────────────────────────────
function DashboardTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: todayData, isLoading } = trpc.nutrition.getTodayLog.useQuery({ date: undefined });
  const { data: weekData } = trpc.nutrition.getWeeklyTrends.useQuery();
  const logWater = trpc.nutrition.logWater.useMutation({
    onSuccess: () => utils.nutrition.getTodayLog.invalidate(),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#7A9BB5' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🥗</div>
        {isAr ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  const goals   = todayData?.goals;
  const totals  = todayData?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const waterMl = todayData?.totalWaterMl ?? 0;
  const waterGoal = goals?.waterMl ?? 2500;

  const waterPct = Math.min((waterMl / waterGoal) * 100, 100);

  const waterOptions = [
    { ml: 150, label: isAr ? 'كوب صغير' : 'Small Cup' },
    { ml: 250, label: isAr ? 'كوب' : 'Cup' },
    { ml: 330, label: isAr ? 'علبة' : 'Can' },
    { ml: 500, label: isAr ? 'قنينة' : 'Bottle' },
  ];

  return (
    <div>
      {/* ── Calories Ring ── */}
      <div style={{
        background: 'white', borderRadius: 20, padding: '20px 16px', marginBottom: 14,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
      }}>
        <h3 style={{ margin: '0 0 16px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          🔥 {isAr ? 'السعرات اليومية' : 'Daily Calories'}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Ring
            value={Math.round(totals.calories)}
            max={goals?.calories ?? 2000}
            color={totals.calories > (goals?.calories ?? 2000) ? RED : NAVY}
            size={110}
            strokeWidth={10}
            label={isAr ? 'سعرة حرارية' : 'kcal'}
            sublabel={isAr ? `من ${goals?.calories ?? 2000}` : `of ${goals?.calories ?? 2000}`}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
          {[
            { label: isAr ? 'متبقي' : 'Remaining', value: Math.max(0, (goals?.calories ?? 2000) - Math.round(totals.calories)), color: GREEN, unit: isAr ? 'سعرة' : 'kcal' },
            { label: isAr ? 'مستهلك' : 'Consumed', value: Math.round(totals.calories), color: NAVY, unit: isAr ? 'سعرة' : 'kcal' },
            { label: isAr ? 'الهدف' : 'Goal', value: goals?.calories ?? 2000, color: SKY, unit: isAr ? 'سعرة' : 'kcal' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, borderRadius: 12, padding: '10px 4px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#7A9BB5', marginTop: 1 }}>{s.unit}</div>
              <div style={{ fontSize: 10, color: '#3D5A80', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Macro Bars ── */}
      <div style={{
        background: 'white', borderRadius: 20, padding: '18px 16px', marginBottom: 14,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
      }}>
        <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          🥩 {isAr ? 'المغذيات الكبرى' : 'Macronutrients'}
        </h3>
        <MacroBar label={isAr ? 'بروتين' : 'Protein'} value={totals.proteinG} max={goals?.proteinG ?? 150} color={RED} />
        <MacroBar label={isAr ? 'كربوهيدرات' : 'Carbs'} value={totals.carbsG} max={goals?.carbsG ?? 200} color={ORANGE} />
        <MacroBar label={isAr ? 'دهون' : 'Fat'} value={totals.fatG} max={goals?.fatG ?? 65} color={PURPLE} />
        {/* Macro rings row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
          <Ring value={Math.round(totals.proteinG)} max={goals?.proteinG ?? 150} color={RED} size={72} strokeWidth={7} label={isAr ? 'بروتين' : 'Protein'} />
          <Ring value={Math.round(totals.carbsG)} max={goals?.carbsG ?? 200} color={ORANGE} size={72} strokeWidth={7} label={isAr ? 'كارب' : 'Carbs'} />
          <Ring value={Math.round(totals.fatG)} max={goals?.fatG ?? 65} color={PURPLE} size={72} strokeWidth={7} label={isAr ? 'دهون' : 'Fat'} />
        </div>
      </div>

      {/* ── Water Tracker ── */}
      <div style={{
        background: 'white', borderRadius: 20, padding: '18px 16px', marginBottom: 14,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15, fontWeight: 900 }}>
            💧 {isAr ? 'شرب الماء' : 'Water Intake'}
          </h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: SKY }}>
            {waterMl}ml / {waterGoal}ml
          </span>
        </div>
        {/* Water fill bar */}
        <div style={{ height: 14, background: '#E8EFF7', borderRadius: 7, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            height: '100%', width: `${waterPct}%`,
            background: `linear-gradient(90deg, ${SKY_LIGHT}, ${SKY})`,
            borderRadius: 7, transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {waterOptions.map(opt => (
            <WaterButton
              key={opt.ml}
              ml={opt.ml}
              label={opt.label}
              onClick={() => logWater.mutate({ amountMl: opt.ml })}
            />
          ))}
        </div>
        {waterPct >= 100 && (
          <div style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 10,
            background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 700, textAlign: 'center',
          }}>
            🎉 {isAr ? 'أحسنتِ! وصلتِ لهدف الماء اليوم' : "Great! You've reached your water goal today!"}
          </div>
        )}
      </div>

      {/* ── Weekly Calories Chart ── */}
      {weekData && weekData.trend.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 20, padding: '18px 16px', marginBottom: 14,
          boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
        }}>
          <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
            📈 {isAr ? 'الاتجاه الأسبوعي' : 'Weekly Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weekData.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF7" />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#7A9BB5' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7A9BB5' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [`${Math.round(v)} kcal`, isAr ? 'سعرات' : 'Calories']}
                contentStyle={{ borderRadius: 10, border: `1px solid ${SKY}`, fontSize: 12 }}
              />
              {weekData.trend.map((entry, i) => (
                <Cell key={i} fill={entry.calories >= (weekData.goals?.calories ?? 2000) ? GREEN : SKY} />
              ))}
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {weekData.trend.map((entry, i) => (
                  <Cell key={i} fill={entry.calories >= (weekData.goals?.calories ?? 2000) ? GREEN : SKY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, background: GREEN, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: '#3D5A80' }}>{isAr ? 'وصل الهدف' : 'Goal met'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, background: SKY, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: '#3D5A80' }}>{isAr ? 'دون الهدف' : 'Below goal'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Meal Tracking Tab ───────────────────────────────────────
function MealsTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: todayData, isLoading } = trpc.nutrition.getTodayLog.useQuery({ date: undefined });
  const logMeal = trpc.nutrition.logMeal.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayLog.invalidate();
      setShowAdd(null);
      setForm({ foodName: '', calories: '', proteinG: '', carbsG: '', fatG: '', servingSize: '' });
    },
  });
  const deleteMeal = trpc.nutrition.deleteMeal.useMutation({
    onSuccess: () => utils.nutrition.getTodayLog.invalidate(),
  });

  const [showAdd, setShowAdd] = useState<MealType | null>(null);
  const [form, setForm] = useState({ foodName: '', calories: '', proteinG: '', carbsG: '', fatG: '', servingSize: '' });

  const mealSections: { type: MealType; icon: string; labelEn: string; labelAr: string; color: string }[] = [
    { type: 'breakfast', icon: '🌅', labelEn: 'Breakfast', labelAr: 'الفطور', color: ORANGE },
    { type: 'lunch',     icon: '☀️', labelEn: 'Lunch',     labelAr: 'الغداء',  color: GREEN },
    { type: 'dinner',    icon: '🌙', labelEn: 'Dinner',    labelAr: 'العشاء',  color: NAVY },
    { type: 'snack',     icon: '🍎', labelEn: 'Snacks',    labelAr: 'وجبات خفيفة', color: PURPLE },
  ];

  const handleSubmit = (type: MealType) => {
    if (!form.foodName || !form.calories) return;
    logMeal.mutate({
      mealType: type,
      foodName: form.foodName,
      calories: parseInt(form.calories) || 0,
      proteinG: parseFloat(form.proteinG) || 0,
      carbsG:   parseFloat(form.carbsG)   || 0,
      fatG:     parseFloat(form.fatG)     || 0,
      servingSize: form.servingSize || undefined,
    });
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#7A9BB5' }}>
      {isAr ? 'جاري التحميل...' : 'Loading...'}
    </div>;
  }

  return (
    <div>
      {mealSections.map(section => {
        const entries = (todayData?.meals ?? []).filter(m => m.mealType === section.type);
        const sectionCalories = entries.reduce((s, m) => s + m.calories, 0);
        const isExpanded = showAdd === section.type;

        return (
          <div key={section.type} style={{
            background: 'white', borderRadius: 20, padding: '16px', marginBottom: 12,
            boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
          }}>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{section.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: NAVY }}>
                    {isAr ? section.labelAr : section.labelEn}
                  </div>
                  <div style={{ fontSize: 11, color: '#7A9BB5' }}>
                    {sectionCalories} {isAr ? 'سعرة' : 'kcal'} • {entries.length} {isAr ? 'عنصر' : 'items'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAdd(isExpanded ? null : section.type)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: isExpanded ? '#FEE2E2' : `${section.color}22`,
                  color: isExpanded ? RED : section.color,
                  fontSize: 18, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isExpanded ? '×' : '+'}
              </button>
            </div>

            {/* Entries list */}
            {entries.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                background: '#F8FAFC', border: '1px solid #EEF2F7',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                    {isAr && entry.foodNameAr ? entry.foodNameAr : entry.foodName}
                    {entry.addedByAI && <span style={{ fontSize: 10, color: PURPLE, marginLeft: 4 }}>✨ AI</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#7A9BB5' }}>
                    {entry.servingSize && `${entry.servingSize} • `}
                    P:{Math.round(Number(entry.proteinG))}g C:{Math.round(Number(entry.carbsG))}g F:{Math.round(Number(entry.fatG))}g
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: section.color }}>{entry.calories}</span>
                  <span style={{ fontSize: 10, color: '#7A9BB5' }}>{isAr ? 'سعرة' : 'kcal'}</span>
                  <button
                    onClick={() => deleteMeal.mutate({ id: entry.id })}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: 'none',
                      background: '#FEE2E2', color: RED, fontSize: 12, cursor: 'pointer',
                    }}
                  >×</button>
                </div>
              </div>
            ))}

            {/* Add form */}
            {isExpanded && (
              <div style={{
                marginTop: 10, padding: '14px', borderRadius: 14,
                background: `${section.color}08`, border: `1px solid ${section.color}33`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                  {isAr ? '+ إضافة وجبة' : '+ Add Food'}
                </div>
                <input
                  placeholder={isAr ? 'اسم الطعام...' : 'Food name...'}
                  value={form.foodName}
                  onChange={e => setForm(f => ({ ...f, foodName: e.target.value }))}
                  style={inputStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <input placeholder={isAr ? 'سعرات حرارية' : 'Calories'} type="number" value={form.calories}
                    onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} style={inputStyle} />
                  <input placeholder={isAr ? 'بروتين (ج)' : 'Protein (g)'} type="number" value={form.proteinG}
                    onChange={e => setForm(f => ({ ...f, proteinG: e.target.value }))} style={inputStyle} />
                  <input placeholder={isAr ? 'كارب (ج)' : 'Carbs (g)'} type="number" value={form.carbsG}
                    onChange={e => setForm(f => ({ ...f, carbsG: e.target.value }))} style={inputStyle} />
                  <input placeholder={isAr ? 'دهون (ج)' : 'Fat (g)'} type="number" value={form.fatG}
                    onChange={e => setForm(f => ({ ...f, fatG: e.target.value }))} style={inputStyle} />
                </div>
                <input
                  placeholder={isAr ? 'حجم الحصة (اختياري)' : 'Serving size (optional)'}
                  value={form.servingSize}
                  onChange={e => setForm(f => ({ ...f, servingSize: e.target.value }))}
                  style={{ ...inputStyle, marginTop: 8 }}
                />
                <button
                  onClick={() => handleSubmit(section.type)}
                  disabled={logMeal.isPending}
                  style={{
                    width: '100%', marginTop: 10, padding: '11px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${section.color}, ${section.color}CC)`,
                    color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {logMeal.isPending ? '...' : (isAr ? '✓ إضافة' : '✓ Add')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── AI Food Scanner Tab ─────────────────────────────────────
function ScannerTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    foodName: string; foodNameAr: string; servingSize: string;
    calories: number; proteinG: number; carbsG: number; fatG: number;
    confidence: string; notes: string;
  } | null>(null);
  const [editedResult, setEditedResult] = useState<typeof scanResult>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [addMsg, setAddMsg] = useState('');

  const scanFood = trpc.nutrition.scanFood.useMutation();
  const logMeal  = trpc.nutrition.logMeal.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayLog.invalidate();
      setAddMsg(isAr ? '✅ تمت الإضافة للسجل' : '✅ Added to diary');
      setTimeout(() => setAddMsg(''), 3000);
    },
  });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
      if (resp.ok) {
        const { url } = await resp.json();
        setUploadedUrl(url);
      }
    } catch {
      // Use data URL as fallback for scanning
      setUploadedUrl(reader.result as string);
    }
  }, []);

  const handleScan = async () => {
    const url = uploadedUrl || preview;
    if (!url) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanFood.mutateAsync({ imageUrl: url, lang: isAr ? 'ar' : 'en' });
      setScanResult(result);
      setEditedResult({ ...result });
    } catch {
      // error handled by tRPC
    } finally {
      setScanning(false);
    }
  };

  const handleAddToDiary = () => {
    if (!editedResult) return;
    logMeal.mutate({
      mealType,
      foodName:    editedResult.foodName,
      foodNameAr:  editedResult.foodNameAr,
      calories:    Math.round(editedResult.calories),
      proteinG:    editedResult.proteinG,
      carbsG:      editedResult.carbsG,
      fatG:        editedResult.fatG,
      servingSize: editedResult.servingSize,
      imageUrl:    uploadedUrl ?? undefined,
      addedByAI:   true,
    });
  };

  const confidenceColor = (c: string) => c === 'high' ? GREEN : c === 'medium' ? ORANGE : RED;

  return (
    <div>
      <div style={{
        background: 'white', borderRadius: 20, padding: '20px 16px', marginBottom: 14,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
      }}>
        <h3 style={{ margin: '0 0 6px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          📸 {isAr ? 'مسح الطعام بالذكاء الاصطناعي' : 'AI Food Scanner'}
        </h3>
        <p style={{ fontSize: 12, color: '#7A9BB5', margin: '0 0 16px' }}>
          {isAr
            ? 'صوّري طعامك وسيحلل الذكاء الاصطناعي السعرات والمغذيات تلقائياً'
            : 'Take a photo of your food and AI will automatically analyze calories and nutrients'}
        </p>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${SKY}`,
            borderRadius: 16, padding: '24px 16px',
            textAlign: 'center', cursor: 'pointer',
            background: preview ? 'transparent' : `${SKY}08`,
            marginBottom: 14, position: 'relative', overflow: 'hidden',
          }}
        >
          {preview ? (
            <img src={preview} alt="food" style={{
              width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12,
            }} />
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                {isAr ? 'اضغطي لرفع صورة الطعام' : 'Tap to upload food photo'}
              </div>
              <div style={{ fontSize: 11, color: '#7A9BB5', marginTop: 4 }}>
                {isAr ? 'JPG, PNG, HEIC مدعومة' : 'JPG, PNG, HEIC supported'}
              </div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {preview && (
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: scanning
                ? '#E8EFF7'
                : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
              color: scanning ? '#7A9BB5' : 'white',
              border: 'none', fontWeight: 700, fontSize: 14, cursor: scanning ? 'not-allowed' : 'pointer',
            }}
          >
            {scanning
              ? (isAr ? '🔍 جاري التحليل...' : '🔍 Analyzing...')
              : (isAr ? '✨ تحليل بالذكاء الاصطناعي' : '✨ Analyze with AI')}
          </button>
        )}
      </div>

      {/* Scan Result */}
      {editedResult && (
        <div style={{
          background: 'white', borderRadius: 20, padding: '20px 16px', marginBottom: 14,
          boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
          border: `2px solid ${GREEN}44`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: NAVY, fontSize: 15, fontWeight: 900 }}>
              🎯 {isAr ? 'نتيجة التحليل' : 'Analysis Result'}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
              background: `${confidenceColor(scanResult?.confidence ?? 'low')}22`,
              color: confidenceColor(scanResult?.confidence ?? 'low'),
            }}>
              {scanResult?.confidence === 'high' ? (isAr ? 'دقة عالية' : 'High') :
               scanResult?.confidence === 'medium' ? (isAr ? 'دقة متوسطة' : 'Medium') :
               (isAr ? 'دقة منخفضة' : 'Low')}
            </span>
          </div>

          {/* Editable fields */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#7A9BB5', display: 'block', marginBottom: 4 }}>
              {isAr ? 'اسم الطعام' : 'Food Name'}
            </label>
            <input
              value={isAr ? editedResult.foodNameAr : editedResult.foodName}
              onChange={e => setEditedResult(r => r ? {
                ...r,
                [isAr ? 'foodNameAr' : 'foodName']: e.target.value,
              } : r)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'calories', label: isAr ? 'سعرات' : 'Calories', unit: 'kcal', color: NAVY },
              { key: 'proteinG', label: isAr ? 'بروتين' : 'Protein', unit: 'g', color: RED },
              { key: 'carbsG',   label: isAr ? 'كارب' : 'Carbs',     unit: 'g', color: ORANGE },
              { key: 'fatG',     label: isAr ? 'دهون' : 'Fat',       unit: 'g', color: PURPLE },
            ].map(f => (
              <div key={f.key} style={{
                background: `${f.color}08`, borderRadius: 12, padding: '10px',
                border: `1px solid ${f.color}22`,
              }}>
                <div style={{ fontSize: 10, color: '#7A9BB5', marginBottom: 4 }}>{f.label} ({f.unit})</div>
                <input
                  type="number"
                  value={editedResult[f.key as keyof typeof editedResult] as number}
                  onChange={e => setEditedResult(r => r ? { ...r, [f.key]: parseFloat(e.target.value) || 0 } : r)}
                  style={{ ...inputStyle, fontWeight: 900, color: f.color, fontSize: 16, textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
          {scanResult?.notes && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 10,
              background: '#F0F9FF', color: '#0369A1', fontSize: 12,
            }}>
              💡 {scanResult.notes}
            </div>
          )}

          {/* Meal type selector */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: '#7A9BB5', marginBottom: 6 }}>
              {isAr ? 'أضف إلى:' : 'Add to:'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 10, border: 'none',
                    background: mealType === t ? NAVY : '#F0F4F8',
                    color: mealType === t ? 'white' : '#7A9BB5',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {t === 'breakfast' ? (isAr ? 'فطور' : 'Breakfast') :
                   t === 'lunch'     ? (isAr ? 'غداء' : 'Lunch') :
                   t === 'dinner'    ? (isAr ? 'عشاء' : 'Dinner') :
                   (isAr ? 'خفيف' : 'Snack')}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddToDiary}
            disabled={logMeal.isPending}
            style={{
              width: '100%', marginTop: 12, padding: '13px', borderRadius: 14,
              background: `linear-gradient(135deg, ${GREEN}, #059669)`,
              color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {logMeal.isPending ? '...' : (isAr ? '✓ إضافة للسجل' : '✓ Add to Diary')}
          </button>
          {addMsg && (
            <div style={{
              marginTop: 8, padding: '8px', borderRadius: 10,
              background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 700, textAlign: 'center',
            }}>
              {addMsg}
            </div>
          )}
        </div>
      )}

      {/* Future ready note */}
      <div style={{
        background: `${PURPLE}08`, borderRadius: 16, padding: '14px 16px',
        border: `1px solid ${PURPLE}22`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: PURPLE, marginBottom: 6 }}>
          🚀 {isAr ? 'قريباً' : 'Coming Soon'}
        </div>
        <div style={{ fontSize: 12, color: '#7A9BB5', lineHeight: 1.5 }}>
          {isAr
            ? '• مسح الباركود للمنتجات المعبأة\n• مزامنة مع الساعة الذكية\n• خطط وجبات مخصصة'
            : '• Barcode scanner for packaged foods\n• Smartwatch calorie sync\n• Personalized meal plans'}
        </div>
      </div>
    </div>
  );
}

// ── AI Insights Tab ─────────────────────────────────────────
function InsightsTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: insights, isLoading } = trpc.nutrition.getInsights.useQuery();
  const generateInsights = trpc.nutrition.generateInsights.useMutation({
    onSuccess: () => utils.nutrition.getInsights.invalidate(),
  });

  const typeIcon: Record<string, string> = {
    protein:    '🥩',
    hydration:  '💧',
    calories:   '🔥',
    macros:     '⚖️',
    recovery:   '🔄',
    general:    '💡',
  };

  const priorityColor = (p: string) =>
    p === 'high' ? RED : p === 'medium' ? ORANGE : GREEN;

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        borderRadius: 20, padding: '20px 16px', marginBottom: 14,
        boxShadow: '0 4px 20px rgba(27,46,94,0.3)',
      }}>
        <h3 style={{ margin: '0 0 6px', color: 'white', fontSize: 15, fontWeight: 900 }}>
          🤖 {isAr ? 'تحليل التغذية بالذكاء الاصطناعي' : 'AI Nutrition Analysis'}
        </h3>
        <p style={{ fontSize: 12, color: SKY_LIGHT, margin: '0 0 14px' }}>
          {isAr
            ? 'يحلل الذكاء الاصطناعي نمطك الغذائي وتمارينك ليعطيك توصيات مخصصة'
            : 'AI analyzes your eating patterns and workouts to give personalized recommendations'}
        </p>
        <button
          onClick={() => generateInsights.mutate({ lang: isAr ? 'ar' : 'en' })}
          disabled={generateInsights.isPending}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: generateInsights.isPending ? 'rgba(255,255,255,0.2)' : SKY,
            color: generateInsights.isPending ? 'rgba(255,255,255,0.6)' : NAVY,
            border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {generateInsights.isPending
            ? (isAr ? '🔍 جاري التحليل...' : '🔍 Analyzing...')
            : (isAr ? '✨ توليد تحليل جديد' : '✨ Generate New Analysis')}
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 30, color: '#7A9BB5' }}>
          {isAr ? 'جاري التحميل...' : 'Loading...'}
        </div>
      )}

      {!isLoading && (!insights || insights.length === 0) && (
        <div style={{
          background: 'white', borderRadius: 20, padding: '30px 20px',
          textAlign: 'center', boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🥗</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
            {isAr ? 'لا توجد تحليلات بعد' : 'No insights yet'}
          </div>
          <div style={{ fontSize: 12, color: '#7A9BB5' }}>
            {isAr
              ? 'سجّلي وجباتك لعدة أيام ثم اضغطي على "توليد تحليل جديد"'
              : 'Log your meals for a few days, then tap "Generate New Analysis"'}
          </div>
        </div>
      )}

      {insights?.map(insight => (
        <div key={insight.id} style={{
          background: 'white', borderRadius: 16, padding: '16px', marginBottom: 10,
          boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
          borderLeft: `4px solid ${priorityColor(insight.priority)}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{typeIcon[insight.type] ?? '💡'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, textTransform: 'capitalize' }}>
                {insight.type}
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              background: `${priorityColor(insight.priority)}22`,
              color: priorityColor(insight.priority),
            }}>
              {insight.priority === 'high' ? (isAr ? 'مهم' : 'High') :
               insight.priority === 'medium' ? (isAr ? 'متوسط' : 'Medium') :
               (isAr ? 'عادي' : 'Low')}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#3D5A80', lineHeight: 1.5 }}>
            {isAr && insight.contentAr ? insight.contentAr : insight.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Goals Settings ──────────────────────────────────────────
function GoalsModal({ isAr, onClose }: { isAr: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: goals } = trpc.nutrition.getGoals.useQuery();
  const setGoals = trpc.nutrition.setGoals.useMutation({
    onSuccess: () => {
      utils.nutrition.getGoals.invalidate();
      utils.nutrition.getTodayLog.invalidate();
      onClose();
    },
  });
  const [form, setForm] = useState({
    calories: String(goals?.calories ?? 2000),
    proteinG: String(goals?.proteinG ?? 150),
    carbsG:   String(goals?.carbsG   ?? 200),
    fatG:     String(goals?.fatG     ?? 65),
    waterMl:  String(goals?.waterMl  ?? 2500),
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0',
        padding: '24px 20px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 17, fontWeight: 900 }}>
            🎯 {isAr ? 'أهداف التغذية' : 'Nutrition Goals'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#7A9BB5' }}>×</button>
        </div>
        {[
          { key: 'calories', label: isAr ? 'السعرات اليومية' : 'Daily Calories', unit: 'kcal' },
          { key: 'proteinG', label: isAr ? 'البروتين' : 'Protein', unit: 'g' },
          { key: 'carbsG',   label: isAr ? 'الكربوهيدرات' : 'Carbs', unit: 'g' },
          { key: 'fatG',     label: isAr ? 'الدهون' : 'Fat', unit: 'g' },
          { key: 'waterMl',  label: isAr ? 'الماء' : 'Water', unit: 'ml' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 }}>
              {f.label} ({f.unit})
            </label>
            <input
              type="number"
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}
        <button
          onClick={() => setGoals.mutate({
            calories: parseInt(form.calories) || 2000,
            proteinG: parseInt(form.proteinG) || 150,
            carbsG:   parseInt(form.carbsG)   || 200,
            fatG:     parseInt(form.fatG)     || 65,
            waterMl:  parseInt(form.waterMl)  || 2500,
          })}
          disabled={setGoals.isPending}
          style={{
            width: '100%', padding: '13px', borderRadius: 14,
            background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {setGoals.isPending ? '...' : (isAr ? '✓ حفظ الأهداف' : '✓ Save Goals')}
        </button>
      </div>
    </div>
  );
}

// ── Shared input style ──────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid #D0DFF0', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#FAFBFC', color: '#1B2E5E',
};

// ── Main Nutrition Component ────────────────────────────────
export default function Nutrition() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<NutritionTab>('dashboard');
  const [showGoals, setShowGoals] = useState(false);

  const tabs: { id: NutritionTab; icon: string; labelEn: string; labelAr: string }[] = [
    { id: 'dashboard', icon: '📊', labelEn: 'Dashboard', labelAr: 'لوحة التحكم' },
    { id: 'meals',     icon: '🍽️', labelEn: 'Meals',     labelAr: 'الوجبات' },
    { id: 'scanner',   icon: '📸', labelEn: 'Scanner',   labelAr: 'المسح' },
    { id: 'insights',  icon: '🤖', labelEn: 'Insights',  labelAr: 'التحليل' },
  ];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
    }}>
      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, color: NAVY, fontSize: 20, fontWeight: 900 }}>
            🥗 {isAr ? 'التغذية' : 'Nutrition'}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7A9BB5' }}>
            {isAr ? new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })
                   : new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowGoals(true)}
          style={{
            padding: '8px 14px', borderRadius: 12, border: 'none',
            background: `${NAVY}12`, color: NAVY, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}
        >
          🎯 {isAr ? 'الأهداف' : 'Goals'}
        </button>
      </div>

      {/* Sub-tab switcher */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        background: 'white', borderRadius: 14, padding: 4,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none',
              background: activeTab === tab.id ? NAVY : 'transparent',
              color: activeTab === tab.id ? 'white' : '#7A9BB5',
              fontWeight: 700, fontSize: 11, cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{isAr ? tab.labelAr : tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && <DashboardTab isAr={isAr} />}
      {activeTab === 'meals'     && <MealsTab     isAr={isAr} />}
      {activeTab === 'scanner'   && <ScannerTab   isAr={isAr} />}
      {activeTab === 'insights'  && <InsightsTab  isAr={isAr} />}

      {/* Goals modal */}
      {showGoals && <GoalsModal isAr={isAr} onClose={() => setShowGoals(false)} />}
    </div>
  );
}
