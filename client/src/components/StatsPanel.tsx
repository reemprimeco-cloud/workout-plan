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
      <div style={{ fontSize: 11, color: '#7A9BB5', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: NAVY }}>{payload[0].value} kg</div>
    </div>
  );
}

export function StatsPanel({ stats, weightLog, sessions, profile, onLogWeight }: Props) {
  const { lang } = useLanguage();
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
      setExportMsg(lang === 'ar' ? 'تم تصدير الجلسات ✅' : 'Sessions exported ✅');
    } else {
      setExportError(lang === 'ar' ? '⚠️ لا توجد جلسات مكتملة للتصدير بعد' : '⚠️ No completed sessions to export yet');
    }
    setTimeout(() => { setExportMsg(''); setExportError(''); }, 3000);
  };

  const handleExportWeight = () => {
    setExportError('');
    const ok = exportWeightCSV(weightLog, lang);
    if (ok) {
      setExportMsg(lang === 'ar' ? 'تم تصدير سجل الوزن ✅' : 'Weight log exported ✅');
    } else {
      setExportError(lang === 'ar' ? '⚠️ لا توجد بيانات وزن للتصدير بعد' : '⚠️ No weight data to export yet');
    }
    setTimeout(() => { setExportMsg(''); setExportError(''); }, 3000);
  };

  const isAr = lang === 'ar';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Main Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '🏆', label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', value: stats.totalSessions, color: NAVY },
          { icon: '🔥', label: isAr ? 'أيام متتالية' : 'Day Streak', value: stats.streak, color: '#DC2626' },
          { icon: '📅', label: isAr ? 'هذا الأسبوع' : 'This Week', value: stats.thisWeek, color: SKY },
          { icon: '📆', label: isAr ? 'هذا الشهر' : 'This Month', value: stats.thisMonth, color: '#3D5A80' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 16, padding: '16px',
            boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
            border: `2px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#7A9BB5', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Weight Progress Card ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
        border: `1px solid ${SKY_LIGHT}55`,
      }}>
        <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          ⚖️ {isAr ? 'تتبع الوزن' : 'Weight Tracking'}
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: isAr ? 'الوزن الحالي' : 'Current', value: `${profile.currentWeight} kg`, color: NAVY },
            { label: isAr ? 'الهدف' : 'Target', value: `${profile.targetWeight} kg`, color: '#10B981' },
            { label: isAr ? 'المفقود' : 'Lost', value: `${stats.weightLost.toFixed(1)} kg`, color: SKY },
            { label: isAr ? 'المتبقي' : 'Remaining', value: `${Math.max(0, profile.currentWeight - profile.targetWeight).toFixed(1)} kg`, color: '#DC2626' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 70, background: `${s.color}12`,
              borderRadius: 10, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#7A9BB5', marginTop: 2 }}>{s.label}</div>
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
            <span style={{ fontSize: 10, color: '#7A9BB5' }}>{profile.startWeight} kg</span>
            <span style={{ fontSize: 10, color: '#7A9BB5' }}>{profile.targetWeight} kg</span>
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
            <h3 style={{ margin: 0, color: NAVY, fontSize: 15, fontWeight: 900 }}>
              📈 {isAr ? 'منحنى الوزن' : 'Weight Trend'}
            </h3>
            <span style={{ fontSize: 11, color: '#7A9BB5' }}>
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
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A9BB5' }} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#7A9BB5' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<WeightTooltip />} />
              {profile.targetWeight > 0 && (
                <ReferenceLine
                  y={profile.targetWeight}
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  label={{ value: `🎯 ${profile.targetWeight}`, fill: '#10B981', fontSize: 10, position: 'right' }}
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
              <div style={{ width: 12, height: 0, border: '1.5px dashed #10B981', borderRadius: 2 }} />
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
          <h3 style={{ margin: '0 0 12px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
            📋 {isAr ? 'سجل الوزن' : 'Weight Log'}
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: diff < 0 ? '#10B981' : '#DC2626' }}>
                      {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toFixed(1)}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 900, color: NAVY }}>{entry.weight} kg</span>
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
        <h3 style={{ margin: '0 0 12px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          📊 {isAr ? 'توزيع الجلسات' : 'Sessions by Type'}
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
                    {def.icon} {isAr ? def.nameAr.split(' - ')[0] : def.nameEn}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                    {count} {isAr ? 'جلسة' : 'sessions'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#D0DFF0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(count / maxCount) * 100}%`,
                    background: `linear-gradient(90deg, ${SKY}, ${NAVY})`,
                    borderRadius: 4, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        {stats.totalSessions === 0 && (
          <p style={{ textAlign: 'center', color: '#7A9BB5', fontSize: 13 }}>
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
        <h3 style={{ margin: '0 0 6px', color: NAVY, fontSize: 15, fontWeight: 900 }}>
          💾 {isAr ? 'تصدير البيانات' : 'Export Data'}
        </h3>
        <p style={{ fontSize: 12, color: '#7A9BB5', marginBottom: 14, marginTop: 4 }}>
          {isAr
            ? 'قومي بتصدير بياناتك كملف CSV لحفظها أو مشاركتها مع مدربتك'
            : 'Export your data as CSV to save or share with your trainer'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleExportSessions}
            style={{
              flex: 1, minWidth: 130, padding: '11px 16px', borderRadius: 12,
              background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
              color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 4px 12px ${NAVY}33`,
            }}
          >
            📋 {isAr ? 'تصدير الجلسات' : 'Export Sessions'}
          </button>
          <button
            onClick={handleExportWeight}
            style={{
              flex: 1, minWidth: 130, padding: '11px 16px', borderRadius: 12,
              background: `linear-gradient(135deg, ${SKY}, #5BA3C4)`,
              color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 4px 12px ${SKY}44`,
            }}
          >
            ⚖️ {isAr ? 'تصدير سجل الوزن' : 'Export Weight Log'}
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
    </div>
  );
}
