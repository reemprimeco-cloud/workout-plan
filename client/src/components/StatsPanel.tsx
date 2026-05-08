// StatsPanel - Progress statistics, weight chart, and data export
// Design: Energetic Sports, Primary #E05A00, Secondary #1A7A4A
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { UserProfile, GymSession } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { useLanguage } from '../contexts/LanguageContext';

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
function exportSessionsCSV(sessions: GymSession[], lang: 'ar' | 'en') {
  const completed = sessions.filter(s => !s.isActive);
  if (!completed.length) return;

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
  a.download = `gym-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportWeightCSV(weightLog: { date: string; weight: number }[], lang: 'ar' | 'en') {
  if (!weightLog.length) return;
  const headers = lang === 'ar' ? ['التاريخ', 'الوزن (كجم)'] : ['Date', 'Weight (kg)'];
  const rows = [...weightLog].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.weight]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weight-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Custom Tooltip ─────────────────────────────────────────
function WeightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #E05A00', borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 11, color: '#8A8AAA', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#E05A00' }}>{payload[0].value} kg</div>
    </div>
  );
}

export function StatsPanel({ stats, weightLog, sessions, profile, onLogWeight }: Props) {
  const { lang } = useLanguage();
  const [newWeight, setNewWeight] = useState('');
  const [exportMsg, setExportMsg] = useState('');

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
    exportSessionsCSV(sessions, lang);
    setExportMsg(lang === 'ar' ? 'تم التصدير ✅' : 'Exported ✅');
    setTimeout(() => setExportMsg(''), 2500);
  };

  const handleExportWeight = () => {
    exportWeightCSV(weightLog, lang);
    setExportMsg(lang === 'ar' ? 'تم التصدير ✅' : 'Exported ✅');
    setTimeout(() => setExportMsg(''), 2500);
  };

  const isAr = lang === 'ar';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Main Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '🏆', label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', value: stats.totalSessions, color: '#E05A00' },
          { icon: '🔥', label: isAr ? 'أيام متتالية' : 'Day Streak', value: stats.streak, color: '#DC2626' },
          { icon: '📅', label: isAr ? 'هذا الأسبوع' : 'This Week', value: stats.thisWeek, color: '#7C3AED' },
          { icon: '📆', label: isAr ? 'هذا الشهر' : 'This Month', value: stats.thisMonth, color: '#2563EB' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 16, padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: `2px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Weight Progress Card ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 14px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
          ⚖️ {isAr ? 'تتبع الوزن' : 'Weight Tracking'}
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: isAr ? 'الوزن الحالي' : 'Current', value: `${profile.currentWeight} kg`, color: '#E05A00' },
            { label: isAr ? 'الهدف' : 'Target', value: `${profile.targetWeight} kg`, color: '#1A7A4A' },
            { label: isAr ? 'المفقود' : 'Lost', value: `${stats.weightLost.toFixed(1)} kg`, color: '#7C3AED' },
            { label: isAr ? 'المتبقي' : 'Remaining', value: `${Math.max(0, profile.currentWeight - profile.targetWeight).toFixed(1)} kg`, color: '#DC2626' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 70, background: `${s.color}10`,
              borderRadius: 10, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#8A8AAA', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#4A4A6A' }}>{isAr ? 'التقدم نحو الهدف' : 'Progress to Goal'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E05A00' }}>{stats.progressPercent}%</span>
          </div>
          <div style={{ height: 12, background: '#F0F0F0', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${stats.progressPercent}%`,
              background: 'linear-gradient(90deg, #1A7A4A, #E05A00)',
              borderRadius: 6, transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#8A8AAA' }}>{profile.startWeight} kg</span>
            <span style={{ fontSize: 10, color: '#8A8AAA' }}>{profile.targetWeight} kg</span>
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
              border: '1px solid #E2E8F0', fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleLogWeight} style={{
            padding: '10px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
              📈 {isAr ? 'منحنى الوزن' : 'Weight Trend'}
            </h3>
            <span style={{ fontSize: 11, color: '#8A8AAA' }}>
              {isAr ? `آخر ${chartData.length} قراءة` : `Last ${chartData.length} readings`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E05A00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#E05A00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8AAA' }} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#8A8AAA' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<WeightTooltip />} />
              {profile.targetWeight > 0 && (
                <ReferenceLine
                  y={profile.targetWeight}
                  stroke="#1A7A4A"
                  strokeDasharray="5 5"
                  label={{ value: `🎯 ${profile.targetWeight}`, fill: '#1A7A4A', fontSize: 10, position: 'right' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#E05A00"
                strokeWidth={2.5}
                fill="url(#weightGrad)"
                dot={{ fill: '#E05A00', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#E05A00' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 3, background: '#E05A00', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#4A4A6A' }}>{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 0, border: '1.5px dashed #1A7A4A', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#4A4A6A' }}>{isAr ? 'الهدف' : 'Target'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Weight Log List ── */}
      {sortedLog.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
            📋 {isAr ? 'سجل الوزن' : 'Weight Log'}
          </h3>
          {sortedLog.slice(0, 10).map((entry, i) => {
            const prev = sortedLog[i + 1];
            const diff = prev ? entry.weight - prev.weight : 0;
            return (
              <div key={entry.date} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, marginBottom: 4,
                background: i === 0 ? '#FFF0E8' : '#FAFAFA',
                border: i === 0 ? '1px solid #E05A0033' : '1px solid #F0F0F0',
              }}>
                <span style={{ fontSize: 12, color: '#4A4A6A' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {diff !== 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: diff < 0 ? '#1A7A4A' : '#DC2626' }}>
                      {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toFixed(1)}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#1A1A2E' }}>{entry.weight} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sessions by Type ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
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
                  <span style={{ fontSize: 12, color: '#4A4A6A' }}>
                    {def.icon} {def.nameAr.split(' - ')[0]}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: def.color }}>
                    {count} {isAr ? 'جلسة' : 'sessions'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(count / maxCount) * 100}%`,
                    background: def.color, borderRadius: 4, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        {stats.totalSessions === 0 && (
          <p style={{ textAlign: 'center', color: '#8A8AAA', fontSize: 13 }}>
            {isAr ? 'ابدئي جلساتك لترى الإحصائيات هنا' : 'Start your sessions to see stats here'}
          </p>
        )}
      </div>

      {/* ── Export Data ── */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
          💾 {isAr ? 'تصدير البيانات' : 'Export Data'}
        </h3>
        <p style={{ fontSize: 12, color: '#8A8AAA', marginBottom: 14 }}>
          {isAr
            ? 'قومي بتصدير بياناتك كملف CSV لحفظها أو مشاركتها مع مدربتك'
            : 'Export your data as CSV to save or share with your trainer'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExportSessions} style={{
            flex: 1, minWidth: 130, padding: '11px 16px', borderRadius: 12,
            background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            📋 {isAr ? 'تصدير الجلسات' : 'Export Sessions'}
          </button>
          <button onClick={handleExportWeight} style={{
            flex: 1, minWidth: 130, padding: '11px 16px', borderRadius: 12,
            background: 'linear-gradient(135deg, #1A7A4A, #2ECC71)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
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
      </div>
    </div>
  );
}
