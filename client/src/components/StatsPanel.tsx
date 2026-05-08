// StatsPanel - Progress statistics and weight tracking
import { useState } from 'react';
import type { UserProfile } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';

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
  profile: UserProfile;
  onLogWeight: (w: number) => void;
}

export function StatsPanel({ stats, weightLog, profile, onLogWeight }: Props) {
  const [newWeight, setNewWeight] = useState('');

  const handleLogWeight = () => {
    const w = parseFloat(newWeight);
    if (w > 30 && w < 200) {
      onLogWeight(w);
      setNewWeight('');
    }
  };

  const sortedLog = [...weightLog].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {/* Main Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '🏆', label: 'إجمالي الجلسات', value: stats.totalSessions, color: '#E05A00' },
          { icon: '🔥', label: 'أيام متتالية', value: stats.streak, color: '#DC2626' },
          { icon: '📅', label: 'هذا الأسبوع', value: stats.thisWeek, color: '#7C3AED' },
          { icon: '📆', label: 'هذا الشهر', value: stats.thisMonth, color: '#2563EB' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 16, padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: `2px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4, fontFamily: 'Tajawal, sans-serif' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weight Progress */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 14px', color: '#1A1A2E', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
          ⚖️ تتبع الوزن
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'الوزن الحالي', value: `${profile.currentWeight} كجم`, color: '#E05A00' },
            { label: 'الهدف', value: `${profile.targetWeight} كجم`, color: '#1A7A4A' },
            { label: 'المفقود', value: `${stats.weightLost.toFixed(1)} كجم`, color: '#7C3AED' },
            { label: 'المتبقي', value: `${Math.max(0, profile.currentWeight - profile.targetWeight).toFixed(1)} كجم`, color: '#DC2626' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 80, background: `${s.color}10`,
              borderRadius: 10, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#8A8AAA', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>التقدم نحو الهدف</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E05A00', fontFamily: 'Cairo, sans-serif' }}>
              {stats.progressPercent}%
            </span>
          </div>
          <div style={{ height: 12, background: '#F0F0F0', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${stats.progressPercent}%`,
              background: 'linear-gradient(90deg, #1A7A4A, #E05A00)',
              borderRadius: 6, transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#8A8AAA' }}>{profile.startWeight} كجم</span>
            <span style={{ fontSize: 10, color: '#8A8AAA' }}>{profile.targetWeight} كجم</span>
          </div>
        </div>

        {/* Log Weight */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            step="0.1"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            placeholder="سجّلي وزنك اليوم..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={handleLogWeight}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
              color: 'white', border: 'none',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            تسجيل
          </button>
        </div>
      </div>

      {/* Weight Log */}
      {sortedLog.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
            📈 سجل الوزن
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
                <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>
                  {new Date(entry.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {diff !== 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: diff < 0 ? '#1A7A4A' : '#DC2626',
                    }}>
                      {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toFixed(1)}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>
                    {entry.weight} كجم
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sessions by Type */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
          📊 توزيع الجلسات
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
                  <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>
                    {def.icon} {def.nameAr.split(' - ')[0]}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: def.color }}>{count} جلسة</span>
                </div>
                <div style={{ height: 8, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / maxCount) * 100}%`,
                    background: def.color,
                    borderRadius: 4, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        {stats.totalSessions === 0 && (
          <p style={{ textAlign: 'center', color: '#8A8AAA', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>
            ابدئي جلساتك لترى الإحصائيات هنا
          </p>
        )}
      </div>
    </div>
  );
}
