// StatsPanel - Progress statistics, weight chart, and data export
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { UserProfile, GymSession } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { useLanguage } from '../contexts/LanguageContext';
import { SessionHistory } from './SessionHistory';
import { BarChart, Bar } from 'recharts';
import { getDailyCaloriesBurned, getWeeklyCaloriesBurned, getMonthlyCaloriesBurned } from '../lib/calorieCalc';
import { AppIcons } from './AppIcons';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';

interface Props {
  stats: {
    totalSessions: number;
    thisWeek: number;
    thisMonth: number;
    weightLost: number;
    progressPercent: number;
    sessionsByType: Record<SessionType, number>;
    streak: number;
  };
  weightLog: { date: string; weight: number }[];
  sessions: GymSession[];
  profile: UserProfile;
  onLogWeight: (w: number) => void;
  onDelete: (id: string) => void;
  onDeleteExercise?: (sessionId: string, exerciseIdx: number) => void;
  onDeleteCardio?: (sessionId: string) => void;
}

// ── CSV Export ─────────────────────────────────────────────
function exportSessionsCSV(sessions: GymSession[], lang: 'ar' | 'en'): boolean {
  const completed = sessions.filter(s => !s.isActive);
  if (!completed.length) return false;

  const headers = lang === 'ar'
    ? ['التاريخ', 'وقت الدخول', 'وقت الخروج', 'نوع الجلسة', 'عدد التمارين', 'المزاج', 'الطاقة', 'ملاحظات']
    : ['Date', 'Check-in', 'Check-out', 'Session Type', 'Exercises', 'Mood', 'Energy', 'Notes'];

  const rows = completed.map(s => [
    s.date,
    s.checkInTime,
    s.checkOutTime || '',
    sessionTypes[s.sessionType]?.nameAr || s.sessionType,
    s.exercises.length,
    s.mood,
    s.energyLevel,
    s.notes || '',
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prime-fit-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

function exportWeightCSV(weightLog: { date: string; weight: number }[], lang: 'ar' | 'en'): boolean {
  if (!weightLog.length) return false;
  const headers = lang === 'ar' ? ['التاريخ', 'الوزن (كجم)'] : ['Date', 'Weight (kg)'];
  const rows = [...weightLog].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.weight]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prime-fit-weight-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

// ── Custom Tooltip ─────────────────────────────────────────
function WeightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: `1px solid ${SKY}`, borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 4px 16px rgba(27,46,94,0.15)',
    }}>
      <div style={{ fontSize: 11, color: '#506A88', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{payload[0].value} kg</div>
    </div>
  );
}

export function StatsPanel({ stats, weightLog, sessions, profile, onLogWeight, onDelete, onDeleteExercise, onDeleteCardio }: Props) {
  const { lang } = useLanguage();
  const [subTab, setSubTab] = useState<'stats' | 'history'>('stats');
  const [newWeight, setNewWeight] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [exportError, setExportError] = useState('');

  const handleLogWeight = () => {
    const w = parseFloat(newWeight);
    if (w > 30 && w < 200) {
      onLogWeight(w);
      setNewWeight('');
    }
  };

  const sortedLog = [...weightLog].sort((a, b) => b.date.localeCompare(a.date));

  // Chart data - last 30 entries sorted ascending
  const chartData = [...weightLog]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: e.weight,
    }));

  const handleExportSessions = () => {
    setExportError('');
    const ok = exportSessionsCSV(sessions, lang);
    if (ok) {
      setExportMsg(lang === 'ar' ? 'تم تصدير الجلسات' : 'Sessions exported');
    } else {
      setExportError(lang === 'ar' ? 'لا توجد جلسات مكتملة للتصدير بعد' : 'No completed sessions to export yet');
    }
    setTimeout(() => { setExportMsg(''); setExportError(''); }, 3000);
  };

  const handleExportWeight = () => {
    setExportError('');
    const ok = exportWeightCSV(weightLog, lang);
    if (ok) {
      setExportMsg(lang === 'ar' ? 'تم تصدير سجل الوزن' : 'Weight log exported');
    } else {
      setExportError(lang === 'ar' ? 'لا توجد بيانات وزن للتصدير بعد' : 'No weight data to export yet');
    }
    setTimeout(() => { setExportMsg(''); setExportError(''); }, 3000);
  };

  const isAr = lang === 'ar';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Sub-tab switcher ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        background: 'white', borderRadius: 14, padding: 4,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
      }}>
        {(['stats', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
              background: subTab === t ? '#1B2E5E' : 'transparent',
              color: subTab === t ? 'white' : '#506A88',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: isAr ? 'Tajawal, Inter, sans-serif' : 'Inter, Tajawal, sans-serif',
            }}
          >
            <span style={{display:'flex',alignItems:'center',gap:6}}>{t === 'stats' ? <AppIcons.Stats size={14} /> : <AppIcons.Clipboard size={14} />}{t === 'stats' ? (isAr ? 'الإحصائيات' : 'Statistics') : (isAr ? 'السجل' : 'History')}</span>
          </button>
        ))}
      </div>

      {/* ── History sub-tab ── */}
      {subTab === 'history' && (
        <SessionHistory sessions={sessions} onDelete={onDelete} onDeleteExercise={onDeleteExercise} onDeleteCardio={onDeleteCardio} />
      )}

      {/* ── Stats sub-tab ── */}
      {subTab === 'stats' && <>

      {/* ── Main Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { icon: 'flame', label: isAr ? 'أيام متتالية' : 'Day Streak', value: stats.streak, ink: '#17697A', tint: '#E2F0F3' },
          { icon: 'trophy', label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', value: stats.totalSessions, ink: '#2A4A8C', tint: '#E5EAF4' },
          { icon: 'calendar', label: isAr ? 'هذا الأسبوع' : 'This Week', value: stats.thisWeek, ink: '#4F5BA6', tint: '#E8EAF5' },
          { icon: 'calendarcheck', label: isAr ? 'هذا الشهر' : 'This Month', value: stats.thisMonth, ink: '#226B54', tint: '#E3F1EC' },
        ].map(s => (
          // Each count gets a sea-family icon tile so the four read apart at a
          // glance; the figures stay navy. No red or green: a streak is not an
          // alarm and a count is not a success.
          <div key={s.label} style={{
            background: 'white', borderRadius: 16, padding: '14px 16px 16px',
            boxShadow: '0 4px 20px rgba(27,46,94,0.08)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: s.tint, color: s.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon === 'flame' ? <AppIcons.Flame size={18} /> : s.icon === 'trophy' ? <AppIcons.Trophy size={18} /> : s.icon === 'calendar' ? <AppIcons.Calendar size={18} /> : <AppIcons.CalendarCheck size={18} />}
            </span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, Tajawal, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#506A88', marginTop: 6 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weight Progress Card ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
        border: `1px solid ${SKY_LIGHT}55`,
      }}>
        <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 15, fontWeight: 800 }}>
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Scale size={18} />{isAr ? 'تتبع الوزن' : 'Weight Tracking'}</span>
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: isAr ? 'الوزن الحالي' : 'Current', value: profile.currentWeight, color: NAVY },
            { label: isAr ? 'الهدف' : 'Target', value: profile.targetWeight, color: NAVY },
            // Weight lost is the one figure here that is good news, so it alone
            // carries the success tone; "remaining" is a distance, not an error.
            { label: isAr ? 'المفقود' : 'Lost', value: stats.weightLost.toFixed(1), color: stats.weightLost > 0 ? '#15803D' : NAVY },
            { label: isAr ? 'المتبقي' : 'Remaining', value: Math.max(0, profile.currentWeight - profile.targetWeight).toFixed(1), color: NAVY },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 70, background: '#F3F7FB',
              borderRadius: 12, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, Tajawal, sans-serif', whiteSpace: 'nowrap' }}>
                {s.value}<span style={{ fontSize: 11, fontWeight: 600, marginInlineStart: 2 }}>kg</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#506A88', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#3D5A80' }}>{isAr ? 'التقدم نحو الهدف' : 'Progress to Goal'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{stats.progressPercent}%</span>
          </div>
          <div style={{ height: 12, background: '#D0DFF0', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${stats.progressPercent}%`,
              background: `linear-gradient(90deg, ${SKY}, ${NAVY})`,
              borderRadius: 6, transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#506A88' }}>{profile.startWeight} kg</span>
            <span style={{ fontSize: 11, color: '#506A88' }}>{profile.targetWeight} kg</span>
          </div>
        </div>

        {/* Log Weight Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number" step="0.1" value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogWeight()}
            placeholder={isAr ? 'سجّلي وزنك اليوم...' : "Log today's weight..."}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${SKY_LIGHT}`, fontSize: 14, outline: 'none',
              color: NAVY,
            }}
          />
          <button onClick={handleLogWeight} style={{
            padding: '10px 18px', borderRadius: 10,
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
            color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            {isAr ? 'تسجيل' : 'Log'}
          </button>
        </div>
      </div>

      {/* ── Weight Chart ── */}
      {chartData.length >= 2 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
          boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: NAVY, fontSize: 15, fontWeight: 800 }}>
              <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Stats size={18} />{isAr ? 'منحنى الوزن' : 'Weight Trend'}</span>
            </h3>
            <span style={{ fontSize: 11, color: '#506A88' }}>
              {isAr ? `آخر ${chartData.length} قراءة` : `Last ${chartData.length} readings`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SKY} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={SKY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF7" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#506A88' }} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#506A88' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<WeightTooltip />} />
              {profile.targetWeight > 0 && (
                <ReferenceLine
                  y={profile.targetWeight}
                  stroke="#15803D"
                  strokeDasharray="5 5"
                  label={{ value: `${profile.targetWeight}`, fill: '#15803D', fontSize: 11, position: 'right' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke={NAVY}
                strokeWidth={2.5}
                fill="url(#weightGrad)"
                dot={{ fill: NAVY, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: SKY }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 3, background: NAVY, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#3D5A80' }}>{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 0, border: '1.5px dashed #15803D', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#3D5A80' }}>{isAr ? 'الهدف' : 'Target'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Weight Log List ── */}
      {sortedLog.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
          boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
        }}>
          <h3 style={{ margin: '0 0 12px', color: NAVY, fontSize: 15, fontWeight: 800 }}>
            <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Clipboard size={18} />{isAr ? 'سجل الوزن' : 'Weight Log'}</span>
          </h3>
          {sortedLog.slice(0, 10).map((entry, i) => {
            const prev = sortedLog[i + 1];
            const diff = prev ? entry.weight - prev.weight : 0;
            return (
              <div key={entry.date} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, marginBottom: 4,
                background: i === 0 ? `${SKY_LIGHT}30` : '#FAFBFC',
                border: i === 0 ? `1px solid ${SKY}55` : '1px solid #EEF2F7',
              }}>
                <span style={{ fontSize: 12, color: '#3D5A80' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {diff !== 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: diff < 0 ? '#15803D' : '#B45309' }}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:2}}>{diff < 0 ? <AppIcons.ChevronDown size={12} /> : <AppIcons.ChevronUp size={12} />}{Math.abs(diff).toFixed(1)}</span>
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{entry.weight} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sessions by Type ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: NAVY, fontSize: 15, fontWeight: 800 }}>
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Stats size={18} />{isAr ? 'توزيع الجلسات' : 'Sessions by Type'}</span>
        </h3>
        {(Object.entries(stats.sessionsByType) as [SessionType, number][])
          .filter(([, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => {
            const def = sessionTypes[type];
            const maxCount = Math.max(...Object.values(stats.sessionsByType));
            return (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#3D5A80' }}>
                    {isAr ? def.nameAr.split(' - ')[0] : def.nameEn}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                    {count} {isAr ? (count === 2 ? 'جلستان' : count >= 3 && count <= 10 ? 'جلسات' : 'جلسة') : (count === 1 ? 'session' : 'sessions')}
                  </span>
                </div>
                {/* Each bar in its session type's colour, on that type's tint. */}
                <div style={{ height: 8, background: def.bgColor, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(count / maxCount) * 100}%`,
                    background: def.color,
                    borderRadius: 4, transition: 'width 0.5s cubic-bezier(.16,1,.3,1)',
                  }} />
                </div>
              </div>
            );
          })}
        {stats.totalSessions === 0 && (
          <p style={{ textAlign: 'center', color: '#506A88', fontSize: 13 }}>
            {isAr ? 'ابدئي جلساتك لترى الإحصائيات هنا' : 'Start your sessions to see stats here'}
          </p>
        )}
      </div>

      {/* ── Export Data ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
        border: `1px solid ${SKY_LIGHT}55`,
      }}>
        <h3 style={{ margin: '0 0 6px', color: NAVY, fontSize: 15, fontWeight: 800 }}>
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Download size={18} />{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
        </h3>
        <p style={{ fontSize: 12, color: '#506A88', marginBottom: 14, marginTop: 4 }}>
          {isAr
            ? 'قومي بتصدير بياناتك كملف CSV لحفظها أو مشاركتها مع مدربتك'
            : 'Export your data as CSV to save or share with your trainer'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleExportSessions}
            style={{
              flex: 1, minWidth: 130, minHeight: 44, padding: '0 16px', borderRadius: 12,
              background: 'white', color: NAVY, border: '1px solid #D0DFF0',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Clipboard size={14} />{isAr ? 'تصدير الجلسات' : 'Export Sessions'}</span>
          </button>
          <button
            onClick={handleExportWeight}
            style={{
              flex: 1, minWidth: 130, minHeight: 44, padding: '0 16px', borderRadius: 12,
              background: 'white', color: NAVY, border: '1px solid #D0DFF0',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Scale size={14} />{isAr ? 'تصدير سجل الوزن' : 'Export Weight Log'}</span>
          </button>
        </div>
        {exportMsg && (
          <div style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 10,
            background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 700, textAlign: 'center',
          }}>
            {exportMsg}
          </div>
        )}
        {exportError && (
          <div style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 10,
            background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, textAlign: 'center',
          }}>
            {exportError}
          </div>
        )}
      </div>

      {/* ── Estimated Calories Burned ── */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const wt = profile.currentWeight || 65;
        const daily = getDailyCaloriesBurned(sessions, today, wt);
        const weekly = getWeeklyCaloriesBurned(sessions, wt);
        const weekTotal = weekly.reduce((s, d) => s + d.calories, 0);
        const monthly = getMonthlyCaloriesBurned(sessions, wt);
        const monthTotal = monthly.reduce((s, w) => s + w.calories, 0);
        const hasData = weekly.some(d => d.calories > 0);
        return (
          <div style={{
            background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
            boxShadow: '0 4px 20px rgba(27,46,94,0.08)',
          }}>
            <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 15, fontWeight: 800 }}>
              <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Flame size={18} />{isAr ? 'السعرات المحروقة التقديرية' : 'Estimated Calories Burned'}</span>
            </h3>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: isAr ? 'اليوم' : 'Today', value: daily, icon: 'sun' },
                { label: isAr ? 'الأسبوع' : 'This Week', value: weekTotal, icon: 'calendar' },
                { label: isAr ? 'الشهر' : 'This Month', value: monthTotal, icon: 'calendarcheck' },
              ].map(c => (
                <div key={c.label} style={{
                  background: '#F3F7FB', borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                  border: 'none',
                }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:2 }}>
                    {c.icon === 'sun' ? <AppIcons.Sun size={20} color={NAVY} /> : c.icon === 'calendar' ? <AppIcons.Calendar size={20} color={NAVY} /> : <AppIcons.CalendarCheck size={20} color={NAVY} />}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#506A88', marginTop: 1 }}>kcal</div>
                  <div style={{ fontSize: 11, color: '#506A88', marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>
            {/* Weekly bar chart */}
            {hasData && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#506A88', marginBottom: 8, fontWeight: 600 }}>
                  {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={weekly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF7" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#506A88' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#506A88' }} />
                    <Tooltip
                      formatter={(v: number) => [`${v} kcal`, isAr ? 'سعرات' : 'Cal']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="calories" fill="#1F7A8C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Monthly bar chart */}
            {monthly.some(w => w.calories > 0) && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#506A88', marginBottom: 8, fontWeight: 600 }}>
                  {isAr ? 'آخر 4 أسابيع' : 'Last 4 Weeks'}
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF7" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#506A88' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#506A88' }} />
                    <Tooltip
                      formatter={(v: number) => [`${v} kcal`, isAr ? 'سعرات' : 'Cal']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="calories" fill="#4F5BA6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {!hasData && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#506A88', fontSize: 13 }}>
                {isAr ? 'أكملي جلسة تدريب لتظهر بيانات السعرات' : 'Complete a workout to see calorie data'}
              </div>
            )}
            <p style={{ fontSize: 11, color: '#506A88', margin: '8px 0 0', textAlign: 'center' }}>
              {isAr ? 'جميع القيم تقديرية بناءً على معادلة MET. ليست قيمًا طبية دقيقة.' : 'All values are MET-based estimates. Not medically exact.'}
            </p>
          </div>
        );
      })()}
    </>}
    </div>
  );
}
