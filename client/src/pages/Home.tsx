// ============================================================
// Home Page - Dashboard + Check-in
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
// Brand: Prime Printing Co.
// Supports full Arabic/English translation via LanguageContext
// ============================================================
import { useState } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { ActiveSession } from '../components/ActiveSession';
import { SessionHistory } from '../components/SessionHistory';
import { StatsPanel } from '../components/StatsPanel';
import { WorkoutGuide } from '../components/WorkoutGuide';
import ProfilePanel from '../components/ProfilePanel';
import { useLanguage } from '../contexts/LanguageContext';

// Brand colors
const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/ac92d03d-28a4-4634-83f6-c2b0ec05fc4a_833a088c.jpg';

type Tab = 'home' | 'history' | 'stats' | 'guide' | 'profile';

export default function Home() {
  const tracker = useGymTracker();
  const { lang, t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [startingSession, setStartingSession] = useState(false);
  const { activeSession, startSession, stats, data } = tracker;

  // Show profile setup if new user (no name or weight set)
  const isNewUser = !data.profile.name || data.profile.currentWeight === 0;
  if (isNewUser) {
    return (
      <div dir="ltr" style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '32px 24px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(27,46,94,0.35)',
        }}>
          {/* Logo on setup screen */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src={LOGO_URL}
              alt="Prime Printing Co."
              style={{ height: 52, objectFit: 'contain', marginBottom: 12 }}
            />
            <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0 }}>
              Welcome to Prime Fit
            </h1>
            <p style={{ color: '#7A9BB5', fontSize: 13, marginTop: 6 }}>
              Set up your profile to get started
            </p>
          </div>
          <SetupForm onComplete={() => {}} tracker={tracker} />
        </div>
      </div>
    );
  }

  const handleStart = (type: SessionType) => {
    setStartingSession(true);
    startSession(type);
    setTimeout(() => setStartingSession(false), 300);
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: t('navHome') },
    { id: 'history', icon: '📋', label: t('navHistory') },
    { id: 'stats', icon: '📊', label: t('navStats') },
    { id: 'guide', icon: '📖', label: t('navGuide') },
    { id: 'profile', icon: '⚙️', label: t('navProfile') },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: '#F0F4F8',
      fontFamily: lang === 'ar' ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
    }}>
      {/* ── Top Header ── */}
      <header style={{
        background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(27,46,94,0.35)',
      }}>
        {/* Left: Logo + App Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Prime Printing Co. Logo (small) */}
          <div style={{
            background: 'white',
            borderRadius: 10,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <img
              src={LOGO_URL}
              alt="Prime Printing Co."
              style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 900, lineHeight: 1 }}>
              Prime Fit
            </h1>
            <p style={{ margin: 0, color: SKY_LIGHT, fontSize: 11 }}>
              {data.profile.name} • {t('goal')} {data.profile.targetWeight} {t('kg')}
            </p>
          </div>
        </div>

        {/* Right: streak + active indicator */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeSession && (
            <div style={{
              background: SKY, borderRadius: 20, padding: '4px 12px',
              color: NAVY, fontSize: 12, fontWeight: 700,
              animation: 'pulse 2s infinite',
            }}>
              🔴 {t('activeSession')}
            </div>
          )}
          <div style={{
            background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px',
            color: SKY_LIGHT, fontSize: 12,
          }}>
            🔥 {stats.streak} {t('streak')}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ padding: '16px', maxWidth: 800, margin: '0 auto', paddingBottom: 90 }}>

        {/* Active Session Banner */}
        {activeSession && (
          <div style={{
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
            borderRadius: 16, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 8px 24px ${NAVY}44`,
          }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>
                {sessionTypes[activeSession.sessionType].icon} {t('activeSession')}
              </div>
              <div style={{ color: SKY_LIGHT, fontSize: 12, marginTop: 2 }}>
                {lang === 'ar' ? sessionTypes[activeSession.sessionType].nameAr : (sessionTypes[activeSession.sessionType] as any).nameEn || sessionTypes[activeSession.sessionType].nameAr} • {activeSession.checkInTime}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              style={{
                background: SKY, color: NAVY, border: 'none',
                borderRadius: 10, padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              {isRTL ? 'متابعة ◀' : '▶ Continue'}
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
        {activeTab === 'stats' && <StatsPanel stats={stats} weightLog={data.weightLog} sessions={data.sessions} profile={data.profile} onLogWeight={tracker.logWeight} />}
        {activeTab === 'guide' && <WorkoutGuide />}
        {activeTab === 'profile' && <ProfilePanel />}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white',
        borderTop: `2px solid ${SKY_LIGHT}`,
        display: 'flex',
        boxShadow: '0 -4px 20px rgba(27,46,94,0.10)',
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
              borderTop: activeTab === tab.id ? `3px solid ${NAVY}` : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: activeTab === tab.id ? NAVY : '#7A9BB5',
            }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Prime Printing Co. Signature ── */}
      <div style={{
        position: 'fixed', bottom: 62, left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none', zIndex: 99,
      }}>
        <span style={{
          fontSize: 9, color: 'rgba(123,184,212,0.6)',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.06em', fontWeight: 500,
        }}>
          Made by <strong style={{ fontWeight: 700 }}>Prime Printing Co.</strong> © {new Date().getFullYear()}
        </span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&family=Inter:wght@400;600;700;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #E8EFF7; }
        ::-webkit-scrollbar-thumb { background: ${SKY}; border-radius: 4px; }
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
  const { lang, t, isRTL } = useLanguage();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 17 ? t('greetingAfternoon') : t('greetingEvening');

  // Gregorian date display
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US';
  const dayName = now.toLocaleDateString(locale, { weekday: 'long' });
  const dateStr = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const sessionOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body', 'aqua', 'sauna', 'active_rest'];

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      {/* Greeting Card */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        borderRadius: 20, padding: '20px 22px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: `${SKY}18` }} />
        <div style={{ position: 'absolute', bottom: -30, left: -10, width: 90, height: 90, borderRadius: '50%', background: `${SKY}10` }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 4px', color: SKY_LIGHT, fontSize: 13 }}>{greeting} 👋</p>
          <h2 style={{ margin: '0 0 4px', color: 'white', fontSize: 22, fontWeight: 900 }}>
            {profile.name}
          </h2>
          <p style={{ margin: 0, color: `${SKY_LIGHT}CC`, fontSize: 12 }}>{dayName}، {dateStr}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: t('thisWeek'), value: `${stats.thisWeek} ${t('session')}`, icon: '📅' },
              { label: t('thisMonth'), value: `${stats.thisMonth} ${t('session')}`, icon: '📆' },
              { label: t('total'), value: `${stats.totalSessions} ${t('session')}`, icon: '🏆' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.10)', borderRadius: 10, padding: '8px 14px',
                border: `1px solid ${SKY}33`,
              }}>
                <div style={{ color: SKY_LIGHT, fontSize: 10 }}>{s.icon} {s.label}</div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Progress */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px 18px', marginBottom: 16,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)',
        border: `1px solid ${SKY_LIGHT}55`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>⚖️ {t('weightProgress')}</span>
          <span style={{ fontSize: 12, color: '#7A9BB5' }}>
            {profile.currentWeight} {t('kg')} ← {profile.targetWeight} {t('kg')}
          </span>
        </div>
        <div style={{ height: 10, background: '#D0DFF0', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${stats.progressPercent}%`,
            background: `linear-gradient(90deg, ${SKY}, ${NAVY})`,
            borderRadius: 5,
            transition: 'width 0.8s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#7A9BB5' }}>{lang === 'ar' ? 'بداية' : 'Start'}: {profile.startWeight} {t('kg')}</span>
          <span style={{ fontSize: 11, color: NAVY, fontWeight: 700 }}>
            {stats.progressPercent}% • {lang === 'ar' ? 'خسرتِ' : 'Lost'} {stats.weightLost.toFixed(1)} {t('kg')} 🎉
          </span>
        </div>
      </div>

      {/* Check-In Title */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: NAVY, fontSize: 17, fontWeight: 900 }}>
          🏋️‍♀️ {t('chooseWorkout')}
        </h3>
        <p style={{ margin: '4px 0 0', color: '#7A9BB5', fontSize: 12 }}>
          {t('autoTime')}
        </p>
      </div>

      {/* Session Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {sessionOrder.map(type => {
          const def = sessionTypes[type];
          const nameDisplay = lang === 'ar' ? def.nameAr : ((def as any).nameEn || def.nameAr);
          const descDisplay = lang === 'ar' ? def.description : ((def as any).descriptionEn || def.description);
          return (
            <button
              key={type}
              onClick={() => onStart(type)}
              style={{
                background: 'white',
                border: `2px solid ${SKY_LIGHT}`,
                borderRadius: 16,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(27,46,94,0.06)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 20px ${NAVY}22`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = SKY;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(27,46,94,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = SKY_LIGHT;
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{def.icon}</div>
              <div style={{ fontWeight: 900, color: NAVY, fontSize: 13, lineHeight: 1.3 }}>
                {nameDisplay.split(' - ')[0]}
              </div>
              <div style={{ fontSize: 10, color: '#7A9BB5', marginTop: 4, lineHeight: 1.4 }}>
                {descDisplay}
              </div>
              <div style={{
                marginTop: 8, display: 'inline-block',
                background: `${SKY}22`, color: NAVY,
                borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700,
              }}>
                {isRTL ? 'ابدئي الآن ▶' : '▶ Start Now'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Setup Form (shown to new users) ──────────────────────────
function SetupForm({ tracker }: { onComplete: () => void; tracker: ReturnType<typeof useGymTracker> }) {
  const [form, setForm] = useState({ name: '', age: '', height: '', currentWeight: '', targetWeight: '', gender: 'female' as 'female' | 'male' });
  const [error, setError] = useState('');

  const calcBMI = (w: number, h: number) => h > 0 ? +(w / ((h / 100) ** 2)).toFixed(1) : 0;

  const handleSubmit = () => {
    const cw = Number(form.currentWeight);
    const tw = Number(form.targetWeight);
    const age = Number(form.age);
    const height = Number(form.height);
    if (!form.name.trim()) { setError('Please enter your name'); return; }
    if (!age || age < 10 || age > 100) { setError('Please enter a valid age (10-100)'); return; }
    if (!height || height < 100 || height > 250) { setError('Please enter a valid height (100-250 cm)'); return; }
    if (!cw || cw < 30 || cw > 300) { setError('Please enter a valid current weight (30-300 kg)'); return; }
    if (!tw || tw < 30 || tw > 300) { setError('Please enter a valid target weight (30-300 kg)'); return; }
    setError('');
    tracker.updateProfile({
      name: form.name.trim(),
      age,
      height,
      currentWeight: cw,
      targetWeight: tw,
      startWeight: cw,
      gender: form.gender,
      bmi: calcBMI(cw, height),
    });
  };

  const previewBMI = form.currentWeight && form.height ? calcBMI(Number(form.currentWeight), Number(form.height)) : null;

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `2px solid #D0DFF0`, borderRadius: 12,
    padding: '10px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, sans-serif', color: NAVY,
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#3D5A80', display: 'block', marginBottom: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Your Name</label>
        <input style={inputStyle} placeholder="e.g. Sarah" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Age</label>
          <input style={inputStyle} type="number" placeholder="e.g. 36" min={10} max={100} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Height (cm)</label>
          <input style={inputStyle} type="number" placeholder="e.g. 165" min={100} max={250} value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Current Weight (kg)</label>
          <input style={inputStyle} type="number" step="0.1" placeholder="e.g. 72.6" min={30} max={300} value={form.currentWeight} onChange={e => setForm({ ...form, currentWeight: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Target Weight (kg)</label>
          <input style={inputStyle} type="number" step="0.1" placeholder="e.g. 65" min={30} max={300} value={form.targetWeight} onChange={e => setForm({ ...form, targetWeight: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['female', 'male'] as const).map(g => (
            <button key={g} onClick={() => setForm({ ...form, gender: g })} style={{
              padding: '10px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: `2px solid ${form.gender === g ? NAVY : '#D0DFF0'}`,
              background: form.gender === g ? NAVY : '#fff',
              color: form.gender === g ? '#fff' : '#3D5A80',
            }}>
              {g === 'female' ? '♀ Female' : '♂ Male'}
            </button>
          ))}
        </div>
      </div>
      {previewBMI && (
        <div style={{ background: '#EAF3F9', borderRadius: 12, padding: '10px 14px', textAlign: 'center', border: `1px solid ${SKY_LIGHT}` }}>
          <span style={{ fontSize: 12, color: '#3D5A80' }}>BMI Preview: </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: previewBMI < 18.5 ? '#3B82F6' : previewBMI < 25 ? '#10B981' : previewBMI < 30 ? '#F59E0B' : '#EF4444' }}>{previewBMI}</span>
          <span style={{ fontSize: 12, color: '#3D5A80', marginLeft: 6 }}>{previewBMI < 18.5 ? 'Underweight' : previewBMI < 25 ? 'Normal' : previewBMI < 30 ? 'Overweight' : 'Obese'}</span>
        </div>
      )}
      {error && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>⚠️ {error}</p>}
      <button onClick={handleSubmit} style={{
        background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`, color: '#fff', border: 'none', borderRadius: 14,
        padding: '14px', fontSize: 16, fontWeight: 900, cursor: 'pointer', marginTop: 4,
        boxShadow: `0 4px 16px ${NAVY}44`,
      }}>
        🚀 Start My Program
      </button>
    </div>
  );
}
