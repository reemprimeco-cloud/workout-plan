// ============================================================
// Home Page - Dashboard + Check-in
// Design: Energetic Sports RTL, Warm Orange #E05A00 + Deep Navy #1A1A2E
// ============================================================
import { useState } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { ActiveSession } from '../components/ActiveSession';
import { SessionHistory } from '../components/SessionHistory';
import { StatsPanel } from '../components/StatsPanel';
import { WorkoutGuide } from '../components/WorkoutGuide';
import { ProfilePanel } from '../components/ProfilePanel';

type Tab = 'home' | 'history' | 'stats' | 'guide' | 'profile';

export default function Home() {
  const tracker = useGymTracker();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [startingSession, setStartingSession] = useState(false);

  const { activeSession, startSession, stats, data } = tracker;

  const handleStart = (type: SessionType) => {
    setStartingSession(true);
    startSession(type);
    setTimeout(() => setStartingSession(false), 300);
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: 'الرئيسية' },
    { id: 'history', icon: '📋', label: 'السجل' },
    { id: 'stats', icon: '📊', label: 'الإحصائيات' },
    { id: 'guide', icon: '📖', label: 'الجدول' },
    { id: 'profile', icon: '⚙️', label: 'الملف' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FC',
      fontFamily: 'Cairo, Tajawal, sans-serif',
      direction: 'rtl',
    }}>
      {/* ── Top Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D4E 100%)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 12px #E05A0066',
          }}>💪</div>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>
              متتبع النادي
            </h1>
            <p style={{ margin: 0, color: '#A0A0C0', fontSize: 11 }}>
              {data.profile.name} • هدف {data.profile.targetWeight} كجم
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeSession && (
            <div style={{
              background: '#E05A00', borderRadius: 20, padding: '4px 12px',
              color: 'white', fontSize: 12, fontWeight: 700,
              animation: 'pulse 2s infinite',
            }}>
              🔴 جلسة نشطة
            </div>
          )}
          <div style={{
            background: '#2D2D4E', borderRadius: 10, padding: '6px 12px',
            color: '#A0A0C0', fontSize: 12,
          }}>
            🔥 {stats.streak} يوم متتالي
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ padding: '16px', maxWidth: 800, margin: '0 auto', paddingBottom: 90 }}>

        {/* Active Session Banner */}
        {activeSession && (
          <div style={{
            background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
            borderRadius: 16, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 24px #E05A0044',
          }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>
                {sessionTypes[activeSession.sessionType].icon} جلسة نشطة الآن
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
                {sessionTypes[activeSession.sessionType].nameAr} • بدأت {activeSession.checkInTime}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              style={{
                background: 'white', color: '#E05A00', border: 'none',
                borderRadius: 10, padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              }}
            >
              متابعة ◀
            </button>
          </div>
        )}

        {/* ── TAB: HOME ── */}
        {activeTab === 'home' && (
          <>
            {activeSession ? (
              <ActiveSession session={activeSession} tracker={tracker} />
            ) : (
              <CheckInPanel onStart={handleStart} stats={stats} profile={data.profile} />
            )}
          </>
        )}

        {activeTab === 'history' && <SessionHistory sessions={data.sessions} onDelete={tracker.deleteSession} />}
        {activeTab === 'stats' && <StatsPanel stats={stats} weightLog={data.weightLog} profile={data.profile} onLogWeight={tracker.logWeight} />}
        {activeTab === 'guide' && <WorkoutGuide />}
        {activeTab === 'profile' && <ProfilePanel profile={data.profile} onUpdate={tracker.updateProfile} />}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white',
        borderTop: '1px solid #E8EAF0',
        display: 'flex',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        zIndex: 100,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 4px 8px',
              border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'all 0.2s',
              borderTop: activeTab === tab.id ? '3px solid #E05A00' : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontFamily: 'Cairo, sans-serif', fontWeight: 700,
              color: activeTab === tab.id ? '#E05A00' : '#8A8AAA',
            }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F0F0F0; }
        ::-webkit-scrollbar-thumb { background: #E05A00; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── Check-In Panel ─────────────────────────────────────────
function CheckInPanel({ onStart, stats, profile }: {
  onStart: (type: SessionType) => void;
  stats: ReturnType<typeof useGymTracker>['stats'];
  profile: ReturnType<typeof useGymTracker>['data']['profile'];
}) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';
  const dayName = now.toLocaleDateString('ar-SA', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });

  const sessionOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body', 'aqua', 'sauna', 'active_rest'];

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      {/* Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E, #2D2D4E)',
        borderRadius: 20, padding: '20px 22px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: '#E05A0015' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 4px', color: '#A0A0C0', fontSize: 13 }}>{greeting} 👋</p>
          <h2 style={{ margin: '0 0 4px', color: 'white', fontSize: 22, fontWeight: 900 }}>
            {profile.name}
          </h2>
          <p style={{ margin: 0, color: '#A0A0C0', fontSize: 12 }}>{dayName}، {dateStr}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'هذا الأسبوع', value: `${stats.thisWeek} جلسة`, icon: '📅' },
              { label: 'هذا الشهر', value: `${stats.thisMonth} جلسة`, icon: '📆' },
              { label: 'المجموع', value: `${stats.totalSessions} جلسة`, icon: '🏆' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px',
              }}>
                <div style={{ color: '#A0A0C0', fontSize: 10 }}>{s.icon} {s.label}</div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Progress */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px 18px', marginBottom: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: '#1A1A2E', fontSize: 14 }}>⚖️ تقدم الوزن</span>
          <span style={{ fontSize: 12, color: '#8A8AAA' }}>
            {profile.currentWeight} كجم ← {profile.targetWeight} كجم
          </span>
        </div>
        <div style={{ height: 10, background: '#F0F0F0', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${stats.progressPercent}%`,
            background: 'linear-gradient(90deg, #1A7A4A, #E05A00)',
            borderRadius: 5,
            transition: 'width 0.8s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#8A8AAA' }}>بداية: {profile.startWeight} كجم</span>
          <span style={{ fontSize: 11, color: '#E05A00', fontWeight: 700 }}>
            {stats.progressPercent}% • خسرتِ {stats.weightLost.toFixed(1)} كجم 🎉
          </span>
        </div>
      </div>

      {/* Check-In Title */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#1A1A2E', fontSize: 17, fontWeight: 900 }}>
          🏋️‍♀️ اختاري نوع تمرين اليوم
        </h3>
        <p style={{ margin: '4px 0 0', color: '#8A8AAA', fontSize: 12 }}>
          سيتم تسجيل الوقت تلقائياً عند الضغط
        </p>
      </div>

      {/* Session Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {sessionOrder.map(type => {
          const def = sessionTypes[type];
          return (
            <button
              key={type}
              onClick={() => onStart(type)}
              style={{
                background: 'white',
                border: `2px solid ${def.bgColor}`,
                borderRadius: 16,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                fontFamily: 'Cairo, sans-serif',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 20px ${def.color}33`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = def.color;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = def.bgColor;
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{def.icon}</div>
              <div style={{ fontWeight: 900, color: def.color, fontSize: 13, lineHeight: 1.3 }}>
                {def.nameAr.split(' - ')[0]}
              </div>
              <div style={{ fontSize: 10, color: '#8A8AAA', marginTop: 4, lineHeight: 1.4 }}>
                {def.description}
              </div>
              <div style={{
                marginTop: 8, display: 'inline-block',
                background: def.bgColor, color: def.color,
                borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700,
              }}>
                ابدئي الآن ▶
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
