// ============================================================
// Home Page - Dashboard + Check-in
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
// Brand: Prime Printing Co.
// Supports full Arabic/English translation via LanguageContext
// ============================================================
import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useGymTracker } from '../hooks/useGymTracker';
import { sessionTypes, cardioTemplates } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { getExercisesByCategoryAll } from '../lib/exerciseData';
import { ActiveSession } from '../components/ActiveSession';
import { SessionHistory } from '../components/SessionHistory';
import { StatsPanel } from '../components/StatsPanel';
import { WorkoutGuide } from '../components/WorkoutGuide';
import UserGuide from '../components/UserGuide';
import ProfilePanel from '../components/ProfilePanel';
import { ExerciseLibrary } from '../components/ExerciseLibrary';
import { useLanguage } from '../contexts/LanguageContext';
import MyCoach from './MyCoach';
import Community from './Community';
import Nutrition from './Nutrition';
import { useGymSync } from '../hooks/useGymSync';

// Brand colors
const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/manus-storage/primefit_logo_11f9ef29.PNG';

// Inline SVG logo — renders on all browsers without image loading issues
function PrimeFitLogo({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'linear-gradient(135deg, #1B2E5E 0%, #7BB8D4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z"
          fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type Tab = 'home' | 'nutrition' | 'stats' | 'guide' | 'exercises' | 'profile' | 'coach' | 'community';

export default function Home() {
  const tracker = useGymTracker();
  const { lang, t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  // Background DB sync — keeps sessions + weight logs in sync across devices
  useGymSync();

  // Reload page when DB sync brings in new data from another device
  useEffect(() => {
    const handleSynced = () => window.location.reload();
    window.addEventListener('gym-data-synced', handleSynced);
    return () => window.removeEventListener('gym-data-synced', handleSynced);
  }, []);

  const profileQuery = trpc.userProfile.getProfile.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const headerAvatar = profileQuery.data?.avatarUrl ?? null;
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [startingSession, setStartingSession] = useState(false);
  const { activeSession, startSession, stats, data } = tracker;
  const { data: currentUser } = trpc.auth.me.useQuery();


  const handleStart = (type: SessionType) => {
    setStartingSession(true);
    startSession(type);
    setTimeout(() => setStartingSession(false), 300);
  };

  // Inline SVG icons for tabs without CDN webp icons
  const TabSVGIcons: Record<string, (active: boolean) => React.ReactElement> = {
    pricing: (active) => (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: active ? 1 : 0.45 }}>
        <circle cx="15" cy="15" r="12" stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" fill="none"/>
        <path d="M15 8v14M11 11.5c0-1.1.9-2 2-2h3.5a2 2 0 010 4H13a2 2 0 000 4H17a2 2 0 002-2"
          stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    nutrition: (active) => (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: active ? 1 : 0.45 }}>
        {/* Plate */}
        <circle cx="15" cy="17" r="9" stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" fill="none"/>
        {/* Fork */}
        <path d="M9 6v4M9 10c0 1.1.9 2 2 2v5" stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 6v3M11 6v3" stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" strokeLinecap="round"/>
        {/* Knife */}
        <path d="M21 6c0 0 1 2 1 4s-1 3-1 3v4" stroke={active ? NAVY : '#7A9BB5'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };
  const tabs: { id: Tab; iconUrl?: string; label: string }[] = [
    { id: 'home', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_home-MB3HH244jNRVyt3UBmjfaH.webp', label: t('navHome') },
    { id: 'stats', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_stats-RXVm9hpxc7GBzmaMdWrFmx.webp', label: t('navStats') },
    { id: 'nutrition', label: isRTL ? 'تغذية' : 'Nutrition' },
    { id: 'exercises', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_exercises-3TC2oqKP4xXQknExSCkvXw.webp', label: isRTL ? 'التمارين' : 'Exercises' },
    { id: 'coach', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_coach-3A6CnqUcxkmm9BJjYrTrbx.webp', label: isRTL ? 'مدربي' : 'Coach' },
    { id: 'community', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_community-cqTg9EGeLKQ5s3xGH4BQNP.webp', label: isRTL ? 'المجتمع' : 'Community' },
    { id: 'profile', iconUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/nav_profile-4Skb4HPfvUiSWNBfKW6iLX.webp', label: t('navProfile') },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
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
          {/* Prime Fit Logo (small) — inline SVG, renders on all browsers */}
          <PrimeFitLogo size={40} />

          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 900, lineHeight: 1 }}>
              Prime Fit
            </h1>
            <p style={{ margin: 0, color: SKY_LIGHT, fontSize: 11 }}>
              {data.profile.name} • {t('goal')} {data.profile.targetWeight} {t('kg')}
            </p>
          </div>
        </div>

        {/* Right: active session indicator + admin button */}
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
          {(currentUser as any)?.role === 'admin' && (
            <a
              href="/admin"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 10,
                padding: '5px 12px',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                backdropFilter: 'blur(4px)',
              }}
            >
              ⚙️ {lang === 'ar' ? 'الإدارة' : 'Admin'}
            </a>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      {/* Coach tab gets its own full-height flex container (WhatsApp-style) */}
      {activeTab === 'coach' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <MyCoach />
        </div>
      )}
      {/* Community tab gets its own full-height container — avoids overflow:hidden clipping fixed panels */}
      {activeTab === 'community' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          <Community
            userId={currentUser?.id}
            streak={stats.streak}
            weeklyCompletion={stats.progressPercent}
            currentWeight={data.profile.currentWeight}
            targetWeight={data.profile.targetWeight}
            name={data.profile.name}
          />
        </div>
      )}
      <main style={(activeTab === 'coach' || activeTab === 'community') ? { display: 'none' } : { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', maxWidth: 800, margin: '0 auto', width: '100%', paddingBottom: 16 }}>

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
              <ActiveSession session={activeSession} tracker={tracker} gender={(data.profile.gender as "male" | "female") || "female"} weightKg={data.profile.currentWeight || 65} />
            ) : (
              <CheckInPanel onStart={handleStart} stats={stats} profile={data.profile} />
            )}
          </>
        )}

        {activeTab === 'nutrition' && <Nutrition />}
        {activeTab === 'stats' && <StatsPanel stats={stats} weightLog={data.weightLog} sessions={data.sessions} profile={data.profile} onLogWeight={tracker.logWeight} onDelete={tracker.deleteSession} onDeleteExercise={tracker.removeExercise} onDeleteCardio={tracker.removeCardio} />}
        {activeTab === 'guide' && <WorkoutGuide gender={(data.profile.gender as 'male' | 'female') || 'female'} />}
        {activeTab === 'exercises' && (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: '#1B2E5E', fontWeight: 800, fontSize: 20, margin: 0 }}>
                {isRTL ? '🏋️ قائمة التمارين' : '🏋️ Exercise Library'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                {isRTL
                  ? `برنامج ${data.profile.gender === 'female' ? 'المرأة' : 'الرجل'} — ${data.profile.name || ''}`
                  : `${data.profile.gender === 'female' ? "Women's" : "Men's"} Program — ${data.profile.name || ''}`}
              </p>
            </div>
            <ExerciseLibrary
              gender={(data.profile.gender as 'male' | 'female') || 'female'}
              language={lang as 'ar' | 'en'}
            />
          </div>
        )}
        {activeTab === 'profile' && <ProfilePanel />}
        {/* coach + community tabs rendered outside main above */}
      </main>

      {/* ── Bottom Navigation ── */}

      <nav style={{
        background: 'white',
        borderTop: `2px solid ${SKY_LIGHT}`,
        display: 'flex',
        boxShadow: '0 -4px 20px rgba(27,46,94,0.10)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
            {TabSVGIcons[tab.id]
              ? TabSVGIcons[tab.id](activeTab === tab.id)
              : <img src={tab.iconUrl} alt={tab.label} style={{ width: 30, height: 30, objectFit: 'contain', opacity: activeTab === tab.id ? 1 : 0.45, filter: activeTab === tab.id ? 'none' : 'grayscale(30%)' }} />
            }
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: activeTab === tab.id ? NAVY : '#7A9BB5',
            }}>{tab.label}</span>
          </button>
        ))}
      </nav>


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&family=Inter:wght@400;600;700;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; height: 100dvh; margin: 0; padding: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #E8EFF7; }
        ::-webkit-scrollbar-thumb { background: ${SKY}; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── Check-In Panel ─────────────────────────────────────────
// Maps sessionType → exercise categories from exerciseData
const SESSION_CATEGORY_MAP: Partial<Record<SessionType, string[]>> = {
  chest_shoulders: ['Chest', 'Shoulders'],
  upper_arms: ['Arms', 'Back'],
  lower_body: ['Legs', 'Glutes'],
  core_cardio: ['Core'],
  full_body: ['Chest', 'Shoulders', 'Back', 'Arms', 'Legs', 'Core', 'Glutes'],
  active_rest: [], // Cardio only — handled by the cardio machines section
  warm_up: ['Warm-Up'],
  stretching: ['Stretching'],
  home_workouts: ['Home Workouts'],
  pilates: ['Pilates'],
  mobility: ['Mobility'],
  quick_workouts: ['Quick Workouts'],
};
// Glutes included in lower_body for all genders
const GLUTES_SESSION: SessionType = 'lower_body';

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
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sessionOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body', 'aqua', 'sauna', 'active_rest', 'warm_up', 'stretching', 'home_workouts', 'pilates', 'mobility', 'quick_workouts'];

  // Icon URLs for each session type
  const SESSION_ICON_URLS: Partial<Record<SessionType, string>> = {
    lower_body: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_lower_body-MuCkSzyesxhQdyW2sjXWAq.webp',
    upper_arms: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_upper_body-d4Fkcsb5PVaBtsoBf7kR6u.webp',
    core_cardio: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_core_cardio-2XKA22my7CHNgVpQZBhzVC.webp',
    chest_shoulders: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_chest_shoulders-7n7FKiPHKydZoJhE4L2Y2a.webp',
    full_body: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_full_body-DTurmyGnhh2FK22ddoLwZJ.webp',
    aqua: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_aqua-CTdfNbHhgUmSuEDYAYZErP.webp',
    sauna: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_sauna-euKmrDgyW3kcnrExDVuZEj.webp',
    active_rest: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_cardio-JgDT6bvc8LxDoDkZC3MFmL.webp',
    warm_up: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_warm_up-QRSEACQjVrSnzzkfpSfCPF.webp',
    stretching: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_stretching-F4ZvDFQRX2KXtbCduArTqe.webp',
    home_workouts: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_home_workouts-8TAShRf99uAcBdK8sVxufW.webp',
    pilates: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_pilates-hfeJyx2Mk2XJHngo6SaSmM.webp',
    mobility: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_mobility-M3ZmtXZ8badZAeB5P6DYgH.webp',
    quick_workouts: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663573066350/2uwsTsKVVU7RLKXYLxnCKd/icon_quick_workouts-WYyiQ3V9SSSK3mS8Ett7pm.webp',
  };
  const [expandedSession, setExpandedSession] = useState<SessionType | null>(null);
  // Cardio machines state — 4 machines
  type CardioFields = { speed: string; incline: string; time: string; distance: string; calories: string };
  const emptyFields = (): CardioFields => ({ speed: '', incline: '', time: '', distance: '', calories: '' });
  const [cardioData, setCardioData] = useState<Record<string, CardioFields>>({
    treadmill: emptyFields(),
    rower: emptyFields(),
    precor_bike: emptyFields(),
    climbmill: emptyFields(),
  });
  const [cardioSaved, setCardioSaved] = useState<Record<string, boolean>>({});
  const cardioMachines = cardioTemplates.filter(c => ['treadmill', 'rower', 'precor_bike', 'climbmill'].includes(c.id));
  const gender = (profile.gender as 'male' | 'female') || 'female';
  const exercisesByCategory = getExercisesByCategoryAll(gender);

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
          <p style={{ margin: '0 0 0', color: `${SKY_LIGHT}CC`, fontSize: 12 }}>{dayName}، {dateStr}</p>
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
            {profile.currentWeight} {t('kg')} {isRTL ? '←' : '→'} {profile.targetWeight} {t('kg')}
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
            {stats.progressPercent}% • {lang === 'ar' ? (gender === 'female' ? 'خسرتِ' : 'خسرت') : 'Lost'} {stats.weightLost.toFixed(1)} {t('kg')} 🎉
          </span>
        </div>
      </div>



      {/* Check-In Title */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: NAVY, fontSize: 17, fontWeight: 900 }}>
          🏗️‍♀️ {t('chooseWorkout')}
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
          const isExpanded = expandedSession === type;
          // Get exercises for this session type from exerciseData categories
          const catKeys = SESSION_CATEGORY_MAP[type] || [];
          const sessionExercises = catKeys.flatMap(cat => exercisesByCategory[cat] || []);

          return (
            <div
              key={type}
              style={{
                background: 'white',
                border: `2px solid ${isExpanded ? SKY : SKY_LIGHT}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: isExpanded ? `0 8px 20px ${NAVY}22` : '0 2px 8px rgba(27,46,94,0.06)',
                transition: 'all 0.2s',
                gridColumn: isExpanded ? '1 / -1' : 'auto',
              }}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedSession(isExpanded ? null : type)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6 }}>
                      {SESSION_ICON_URLS[type] ? (
                        <img src={SESSION_ICON_URLS[type]} alt={nameDisplay} style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>{def.icon}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 900, color: NAVY, fontSize: 13, lineHeight: 1.3 }}>
                      {nameDisplay.split(' - ')[0]}
                    </div>
                    <div style={{ fontSize: 10, color: '#7A9BB5', marginTop: 4, lineHeight: 1.4 }}>
                      {descDisplay}
                    </div>
                    {sessionExercises.length > 0 && (
                      <div style={{ fontSize: 10, color: SKY, marginTop: 4, fontWeight: 600 }}>
                        {sessionExercises.length} {lang === 'ar' ? 'تمرين' : 'exercises'}
                      </div>
                    )}
                  </div>
                  {sessionExercises.length > 0 && (
                    <span style={{ color: SKY, fontSize: 14, marginTop: 4 }}>{isExpanded ? '▲' : '▼'}</span>
                  )}
                </div>
              </button>

              {/* Cardio Section: 4 machines (only for active_rest) */}
              {isExpanded && type === 'active_rest' && (
                <div style={{
                  borderTop: `1px solid ${SKY_LIGHT}55`,
                  padding: '12px',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  <div style={{ marginBottom: 10, color: '#7A9BB5', fontSize: 11, fontWeight: 600 }}>
                    {lang === 'ar' ? '🏃 أجهزة الكارديو — سجّل بياناتك بعد التمرين:' : '🏃 Cardio Machines — Log your data after each workout:'}
                  </div>

                  {cardioMachines.map(machine => {
                    const mid = machine.id;
                    const mData = cardioData[mid] || { speed: '', incline: '', time: '', distance: '', calories: '' };
                    const isSaved = !!cardioSaved[mid];

                    // Define fields per machine
                    const machineIcons: Record<string, string> = {
                      treadmill: '🏃',
                      rower: '🚣',
                      precor_bike: '🚴',
                      climbmill: '🏔️',
                    };
                    const icon = machineIcons[mid] || '💪';

                    // Fields config per machine
                    type FieldDef = { key: keyof typeof mData; labelAr: string; labelEn: string; placeholder: string; fullRow?: boolean };
                    const fieldsMap: Record<string, FieldDef[]> = {
                      treadmill: [
                        { key: 'speed', labelAr: '⚡ السرعة (km/h)', labelEn: '⚡ Speed (km/h)', placeholder: 'e.g. 5.5' },
                        { key: 'incline', labelAr: '📈 الانحدار (%)', labelEn: '📈 Incline (%)', placeholder: 'e.g. 3' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: '📏 المسافة (km)', labelEn: '📏 Distance (km)', placeholder: 'e.g. 1.8' },
                        { key: 'calories', labelAr: '🔥 السعرات', labelEn: '🔥 Calories', placeholder: 'e.g. 150', fullRow: true },
                      ],
                      rower: [
                        { key: 'speed', labelAr: '🚣 الإيقاع (SPM)', labelEn: '🚣 Rate (SPM)', placeholder: 'e.g. 24' },
                        { key: 'incline', labelAr: '🔧 المقاومة (Level)', labelEn: '🔧 Resistance', placeholder: 'e.g. 5' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 15' },
                        { key: 'distance', labelAr: '📏 المسافة (m)', labelEn: '📏 Distance (m)', placeholder: 'e.g. 3100' },
                        { key: 'calories', labelAr: '🔥 السعرات', labelEn: '🔥 Calories', placeholder: 'e.g. 120', fullRow: true },
                      ],
                      precor_bike: [
                        { key: 'speed', labelAr: '🚴 السرعة (RPM)', labelEn: '🚴 Speed (RPM)', placeholder: 'e.g. 80' },
                        { key: 'incline', labelAr: '🔧 المقاومة (Level)', labelEn: '🔧 Resistance', placeholder: 'e.g. 8' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: '📏 المسافة (km)', labelEn: '📏 Distance (km)', placeholder: 'e.g. 5.0' },
                        { key: 'calories', labelAr: '🔥 السعرات', labelEn: '🔥 Calories', placeholder: 'e.g. 180', fullRow: true },
                      ],
                      climbmill: [
                        { key: 'speed', labelAr: '🏔️ السرعة (خطوة/د)', labelEn: '🏔️ Steps/min', placeholder: 'e.g. 60' },
                        { key: 'incline', labelAr: '🔧 المستوى', labelEn: '🔧 Level', placeholder: 'e.g. 8' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: '📏 الطوابق', labelEn: '📏 Floors', placeholder: 'e.g. 40' },
                        { key: 'calories', labelAr: '🔥 السعرات', labelEn: '🔥 Calories', placeholder: 'e.g. 200', fullRow: true },
                      ],
                    };
                    const fields = fieldsMap[mid] || [];

                    return (
                      <div key={mid} style={{
                        background: '#F8FBFF',
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: `1.5px solid ${SKY_LIGHT}`,
                        marginBottom: 14,
                      }}>
                        {/* Machine image + title */}
                        <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
                          <img src={machine.image} alt={machine.nameEn}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(transparent, rgba(27,46,94,0.85))',
                            padding: '16px 12px 10px',
                            color: 'white', fontWeight: 700, fontSize: 14,
                          }}>
                            {icon} {lang === 'ar' ? machine.nameAr : machine.nameEn}
                          </div>
                        </div>

                        {/* Tip */}
                        <div style={{ padding: '8px 12px 4px' }}>
                          <div style={{ color: '#7A9BB5', fontSize: 10, fontWeight: 600 }}>
                            💡 {lang === 'ar' ? machine.tip : (machine.tipEn || machine.tip)}
                          </div>
                        </div>

                        {/* Input fields */}
                        <div style={{ padding: '8px 12px 12px' }}>
                          <div style={{ color: '#7A9BB5', fontSize: 10, marginBottom: 8, fontWeight: 600 }}>
                            {lang === 'ar' ? '📊 سجّل بياناتك بعد التمرين:' : '📊 Log your data after workout:'}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {fields.map(field => (
                              <div key={field.key} style={{ gridColumn: field.fullRow ? '1 / -1' : 'auto' }}>
                                <div style={{ fontSize: 10, color: NAVY, fontWeight: 700, marginBottom: 4 }}>
                                  {lang === 'ar' ? field.labelAr : field.labelEn}
                                </div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={field.placeholder}
                                  value={mData[field.key]}
                                  onChange={e => setCardioData(prev => ({
                                    ...prev,
                                    [mid]: { ...prev[mid], [field.key]: e.target.value },
                                  }))}
                                  style={{
                                    width: '100%', boxSizing: 'border-box',
                                    border: `1.5px solid ${SKY_LIGHT}`,
                                    borderRadius: 10, padding: '9px 10px',
                                    fontSize: 14, fontWeight: 700, color: NAVY,
                                    background: 'white', outline: 'none',
                                    fontFamily: 'monospace',
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Save button */}
                          <button
                            onClick={() => {
                              const key = `cardio_${mid}_${new Date().toISOString().split('T')[0]}`;
                              localStorage.setItem(key, JSON.stringify({ ...mData, machine: mid, date: new Date().toISOString() }));
                              setCardioSaved(prev => ({ ...prev, [mid]: true }));
                              setTimeout(() => setCardioSaved(prev => ({ ...prev, [mid]: false })), 3000);
                            }}
                            style={{
                              width: '100%', marginTop: 10,
                              background: isSaved
                                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                                : `linear-gradient(135deg, ${NAVY}, #2a4a8a)`,
                              color: 'white', border: 'none', borderRadius: 10,
                              padding: '10px 12px', fontSize: 13, fontWeight: 700,
                              cursor: 'pointer', transition: 'background 0.3s',
                              fontFamily: 'Cairo, sans-serif',
                            }}
                          >
                            {isSaved
                              ? (lang === 'ar' ? '✅ تم الحفظ!' : '✅ Saved!')
                              : (lang === 'ar' ? `💾 حفظ بيانات ${machine.nameAr.split(' ')[0]}` : `💾 Save ${machine.nameEn} Data`)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Exercise List (expanded) — for non-cardio sections */}
              {isExpanded && type !== 'active_rest' && sessionExercises.length > 0 && (
                <div style={{
                  borderTop: `1px solid ${SKY_LIGHT}55`,
                  padding: '10px 12px',
                  maxHeight: 320,
                  overflowY: 'auto',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  <div style={{ marginBottom: 8, color: '#7A9BB5', fontSize: 11, fontWeight: 600 }}>
                    {lang === 'ar' ? '📋 تمارين هذا القسم:' : '📋 Exercises in this section:'}
                  </div>
                  {sessionExercises.map((ex, idx) => (
                    <div key={ex.id} style={{
                      padding: '8px 0',
                      borderBottom: idx < sessionExercises.length - 1 ? `1px solid ${SKY_LIGHT}33` : 'none',
                    }}>
                      {/* Machine Image */}
                      {ex.imageUrl && (
                        <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 6, height: 100 }}>
                          <img
                            src={ex.imageUrl}
                            alt={lang === 'ar' ? ex.nameAr : ex.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Index */}
                      <div style={{
                        minWidth: 24, height: 24,
                        background: `${NAVY}15`,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: NAVY, flexShrink: 0,
                      }}>{idx + 1}</div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: NAVY, fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
                          {lang === 'ar' ? ex.nameAr : ex.name}
                        </div>
                        <div style={{ color: '#7A9BB5', fontSize: 10, marginTop: 2 }}>
                          {ex.sets} {lang === 'ar' ? 'جولات' : 'sets'} × {ex.reps} {lang === 'ar' ? 'تكرار' : 'reps'}
                          &nbsp;·&nbsp;⏱ {lang === 'ar' ? ex.restAr : `${ex.rest}s`}
                        </div>
                      </div>
                      {/* YouTube */}
                      <a
                        href={ex.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: '#ff0000',
                          color: 'white',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          textDecoration: 'none',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <svg width="12" height="9" viewBox="0 0 20 14" fill="white">
                          <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6C20 10.2 20 7 20 7s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/>
                        </svg>
                        {lang === 'ar' ? 'شرح' : 'Watch'}
                      </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Start Button */}
              <div style={{ padding: '0 12px 12px' }}>
                <button
                  onClick={() => onStart(type)}
                  style={{
                    width: '100%',
                    background: `linear-gradient(135deg, ${NAVY}, #2a4a8a)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>▶</span>
                  <span>{isRTL ? (gender === 'female' ? 'ابدئي الآن' : 'ابدأ الآن') : 'Start Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Nutrition Summary Card (shown on Home above workout section) ────────────────────────────────────────────
function NutritionSummaryCard() {
  const { lang, isRTL } = useLanguage();
  const { data: todayLog } = trpc.nutrition.getTodayLog.useQuery({});
  const { data: goals } = trpc.nutrition.getGoals.useQuery();

  const calories = todayLog?.totals?.calories ?? 0;
  const goalCal = todayLog?.goals?.calories ?? 2000;
  const protein = todayLog?.totals?.proteinG ?? 0;
  const carbs = todayLog?.totals?.carbsG ?? 0;
  const fat = todayLog?.totals?.fatG ?? 0;
  const water = todayLog?.totalWaterMl ?? 0;
  const goalWater = todayLog?.goals?.waterMl ?? 2500;
  const calPct = Math.min(100, Math.round((calories / goalCal) * 100));
  const waterPct = Math.min(100, Math.round((water / goalWater) * 100));

  const NAVY = '#1B2E5E';
  const SKY = '#7BB8D4';
  const GREEN = '#22C55E';

  return (
    <div
      style={{
        background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 14,
        boxShadow: '0 2px 12px rgba(27,46,94,0.08)', border: '1px solid #D0DFF055',
        cursor: 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 800, color: NAVY, fontSize: 14 }}>
          🥗 {lang === 'ar' ? 'تغذية اليوم' : "Today's Nutrition"}
        </span>
      </div>

      {/* Calories row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#475569' }}>🔥 {lang === 'ar' ? 'سعرات' : 'Calories'}</span>
        <span style={{ fontSize: 12, color: '#475569' }}>{calories} / {goalCal} kcal</span>
      </div>
      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${calPct}%`, background: `linear-gradient(90deg, ${SKY}, ${NAVY})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>

      {/* Macros row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[
          { label: lang === 'ar' ? 'بروتين' : 'Protein', value: `${Math.round(protein)}g`, color: '#EF4444', bg: '#FEF2F2' },
          { label: lang === 'ar' ? 'كربو' : 'Carbs', value: `${Math.round(carbs)}g`, color: '#F59E0B', bg: '#FFFBEB' },
          { label: lang === 'ar' ? 'دهون' : 'Fat', value: `${Math.round(fat)}g`, color: '#8B5CF6', bg: '#F5F3FF' },
        ].map(m => (
          <div key={m.label} style={{ flex: 1, background: m.bg, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: m.color, fontSize: 14 }}>{m.value}</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Water row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#475569' }}>💧 {lang === 'ar' ? 'ماء' : 'Water'}</span>
        <span style={{ fontSize: 12, color: SKY, fontWeight: 700 }}>{water} / {goalWater} ml</span>
      </div>
      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${waterPct}%`, background: `linear-gradient(90deg, #38BDF8, #0EA5E9)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Setup Form (shown to new users) ────────────────────────────────────────────
function SetupForm({ tracker, onComplete: _onComplete }: { onComplete: () => void; tracker: ReturnType<typeof useGymTracker> }) {
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
