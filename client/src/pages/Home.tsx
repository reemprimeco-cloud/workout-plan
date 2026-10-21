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
import { useCMS } from '../contexts/CMSContext';
import { AppIcons } from '../components/AppIcons';
import MyCoach from './MyCoach';
const Community = React.lazy(() => import('./Community'));
import Nutrition from './Nutrition';
import { useGymSync } from '../hooks/useGymSync';
import { useHaptic } from '../hooks/useHaptic';
import { resolveImageUrl } from '../lib/imageUtils';

// Brand colors
const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const LOGO_URL = '/api/img/primefit_logo_11f9ef29.PNG';

// Inline SVG logo — renders on all browsers without image loading issues
function PrimeFitLogo({ size = 40 }: { size?: number }) {
  return (
    <div aria-hidden style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: NAVY,
      boxShadow: '0 2px 8px rgba(27,46,94,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z"
          fill={SKY} stroke={SKY} strokeWidth="0.5" strokeLinejoin="round" />
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
  const [prevTab, setPrevTab] = useState<Tab>('home');
  const [tabKey, setTabKey] = useState(0);
  const [startingSession, setStartingSession] = useState(false);
  const { selection, lightTap } = useHaptic();

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    selection(); // haptic feedback on tab tap
    setPrevTab(activeTab);
    setActiveTab(tab);
    setTabKey(k => k + 1);
  };
  const { activeSession, startSession, stats, data } = tracker;
  const { data: currentUser } = trpc.auth.me.useQuery();


  const handleStart = (type: SessionType) => {
    lightTap(); // haptic feedback on session start
    setStartingSession(true);
    startSession(type);
    setTimeout(() => setStartingSession(false), 300);
  };

  // Community is built but deliberately hidden (PRODUCT.md): it shipped as a
  // placeholder once, and advertising an unfinished feature is worse than its
  // absence. The tab renderer below is kept for when it returns.
  const tabs: { id: Tab; Icon: (p: { size?: number; strokeWidth?: number }) => React.ReactElement; label: string }[] = [
    { id: 'home',      Icon: AppIcons.Home,      label: t('navHome') },
    { id: 'stats',     Icon: AppIcons.Stats,     label: t('navStats') },
    { id: 'nutrition', Icon: AppIcons.Nutrition, label: isRTL ? 'التغذية' : 'Nutrition' },
    { id: 'exercises', Icon: AppIcons.Exercises, label: isRTL ? 'التمارين' : 'Exercises' },
    { id: 'coach',     Icon: AppIcons.Coach,     label: isRTL ? 'مدربي' : 'Coach' },
    { id: 'profile',   Icon: AppIcons.Profile,   label: t('navProfile') },
  ];
  const goalLine = data.profile.targetWeight > 0
    ? `${t('goal')} ${data.profile.targetWeight} ${t('kg')}`
    : null;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#F0F4F8',
      color: NAVY,
      fontFamily: lang === 'ar' ? 'Tajawal, Inter, sans-serif' : 'Inter, Tajawal, sans-serif',
    }}>
      {/* ── Top Header ── */}
      <header style={{
        background: 'rgba(240,244,248,0.88)',
        backdropFilter: 'saturate(1.4) blur(14px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(14px)',
        borderBottom: '1px solid #D0DFF0',
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        paddingBottom: 10,
        paddingInline: 'max(16px, calc((100vw - 800px) / 2 + 16px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <PrimeFitLogo size={36} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em', fontFamily: 'Inter, Tajawal, sans-serif' }}>
              Prime Fit
            </h1>
            {(data.profile.name || goalLine) && (
              <p style={{ margin: '2px 0 0', color: '#3D5A80', fontSize: 12, fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {[data.profile.name, goalLine].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {activeSession && (
            <button
              onClick={() => handleTabChange('home')}
              style={{
                background: SKY_LIGHT, color: NAVY, border: 'none', cursor: 'pointer',
                borderRadius: 999, padding: '0 12px', minHeight: 32,
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="pf-live-dot" aria-hidden />
              {t('activeSession')}
            </button>
          )}
          {(currentUser as any)?.role === 'admin' && (
            <a
              href="/admin"
              style={{
                background: 'white',
                border: '1px solid #D0DFF0',
                borderRadius: 10,
                padding: '0 12px',
                minHeight: 36,
                color: NAVY,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AppIcons.Settings size={16} />
              {lang === 'ar' ? 'الإدارة' : 'Admin'}
            </a>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      {/* Coach tab gets its own full-height flex container (WhatsApp-style) */}
      {activeTab === 'coach' && (
        <div key={`coach-${tabKey}`} className="tab-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <MyCoach />
        </div>
      )}
      {/* Community tab gets its own full-height container — avoids overflow:hidden clipping fixed panels */}
      {activeTab === 'community' && (
        <div key={`community-${tabKey}`} className="tab-enter" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <React.Suspense fallback={null}><Community
            userId={currentUser?.id}
            streak={stats.streak}
            weeklyCompletion={stats.progressPercent}
            currentWeight={data.profile.currentWeight}
            targetWeight={data.profile.targetWeight}
            name={data.profile.name}
          /></React.Suspense>
        </div>
      )}
      <main
        key={`main-${tabKey}`}
        className={(activeTab !== 'coach' && activeTab !== 'community') ? 'tab-enter scroll-ios' : ''}
        style={(activeTab === 'coach' || activeTab === 'community') ? { display: 'none' } : { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', maxWidth: 800, margin: '0 auto', width: '100%', paddingBottom: 16, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >

        {/* Active Session Banner — on other tabs only; on Home the session
            itself is the screen, and the banner repeated it above itself. */}
        {activeSession && activeTab !== 'home' && (
          <div style={{
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
            borderRadius: 16, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 8px 24px ${NAVY}44`,
          }}>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AppIcons.Dumbbell size={16} />{t('activeSession')}</span>
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
              <span style={{display:'flex',alignItems:'center',gap:4}}>{isRTL ? <AppIcons.ChevronLeft size={14}/> : <AppIcons.ChevronRight size={14}/>}{isRTL ? 'متابعة' : 'Continue'}</span>
            </button>
          </div>
        )}

        {/* ── TAB: HOME ── */}
        {activeTab === 'home' && (
          <>
            {activeSession ? (
              <ActiveSession session={activeSession} tracker={tracker} gender={(data.profile.gender as "male" | "female") || "female"} weightKg={data.profile.currentWeight || 65} />
            ) : (
              <CheckInPanel onStart={handleStart} stats={stats} profile={data.profile} onOpenProfile={() => handleTabChange('profile')} />
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
                <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Dumbbell size={20} className='text-[#1B2E5E]' />{isRTL ? 'قائمة التمارين' : 'Exercise Library'}</span>
              </h2>
              <p style={{ color: '#3D5A80', fontSize: 13, margin: '4px 0 0' }}>
                {isRTL
                  ? `برنامج ${data.profile.gender === 'female' ? 'المرأة' : 'الرجل'}`
                  : `${data.profile.gender === 'female' ? "Women's" : "Men's"} Program`}
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

      <nav aria-label={isRTL ? 'التنقل الرئيسي' : 'Main'} style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'saturate(1.4) blur(14px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(14px)',
        borderTop: '1px solid #D0DFF0',
        display: 'flex',
        flexShrink: 0,
        paddingTop: 6,
        paddingInline: 'max(4px, calc((100vw - 640px) / 2))',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom, 0px))',
      }}>
        {tabs.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              aria-current={active ? 'page' : undefined}
              className="haptic-press no-select pf-tab"
              style={{
                flex: 1, minWidth: 0, minHeight: 54, padding: '2px 2px 4px',
                border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: active ? NAVY : '#3D5A80',
                fontFamily: 'inherit',
              }}
            >
              <span className="pf-tab-pill" data-active={active || undefined}>
                <Icon size={22} strokeWidth={active ? 2.1 : 1.8} />
              </span>
              <span style={{
                fontSize: 11, lineHeight: 1.2, fontWeight: active ? 700 : 500,
                maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{label}</span>
            </button>
          );
        })}
      </nav>


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .pf-tab-pill {
          display: flex; align-items: center; justify-content: center;
          width: 56px; height: 30px; border-radius: 15px;
          transition: background-color .25s cubic-bezier(.16,1,.3,1), transform .25s cubic-bezier(.16,1,.3,1);
        }
        .pf-tab-pill[data-active] { background: #DCEBF4; }
        .pf-tab:active .pf-tab-pill { transform: scale(.94); }
        .pf-tab:focus-visible { outline: none; }
        .pf-tab:focus-visible .pf-tab-pill { box-shadow: 0 0 0 2px ${NAVY}; }
        .pf-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #15803D; animation: pulse 2s infinite; }
        @media (prefers-reduced-motion: reduce) { .pf-live-dot { animation: none; } .pf-tab-pill { transition: none; } }
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

// Counted noun. English needs the plural; Arabic needs the dual and the 3–10
// plural, and returns to the singular from 11.
function sessionsWord(n: number, lang: string) {
  if (lang !== 'ar') return n === 1 ? 'session' : 'sessions';
  if (n === 2) return 'جلستان';
  if (n >= 3 && n <= 10) return 'جلسات';
  return 'جلسة';
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

function CheckInPanel({ onStart, stats, profile, onOpenProfile }: {
  onStart: (type: SessionType) => void;
  onOpenProfile: () => void;
  stats: ReturnType<typeof useGymTracker>['stats'];
  profile: ReturnType<typeof useGymTracker>['data']['profile'];
}) {
  const { lang, t, isRTL } = useLanguage();
  const { sessionIconOverrides } = useCMS();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 17 ? t('greetingAfternoon') : t('greetingEvening');
  // Gregorian date display
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US';
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sessionOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body', 'aqua', 'sauna', 'active_rest', 'warm_up', 'stretching', 'home_workouts', 'pilates', 'mobility', 'quick_workouts'];

  // Icon URLs for each session type — CMS overrides take priority over defaults
  // Using manus-storage URLs (same ones as AdminCMSTab defaultIcon) — no CloudFront dependency
  const DEFAULT_SESSION_ICON_URLS: Partial<Record<SessionType, string>> = {
    lower_body:      '/api/img/icon_lower_body_59f81631.png',
    upper_arms:      '/api/img/icon_upper_body_bbd91e5d.png',
    chest_shoulders: '/api/img/icon_chest_shoulders_8582f4ac.png',
    core_cardio:     '/api/img/icon_core_cardio_5e8c3914.png',
    full_body:       '/api/img/icon_full_body_55a7cc7f.png',
    aqua:            '/api/img/icon_aqua_6436dff1.png',
    sauna:           '/api/img/icon_sauna_24076898.png',
    active_rest:     '/api/img/icon_cardio_d3fdaaba.png',
    warm_up:         '/api/img/icon_warm_up_6ff9052b.png',
    stretching:      '/api/img/icon_stretching_59c73b13.png',
    home_workouts:   '/api/img/icon_home_workouts_10e4a4f7.png',
    pilates:         '/api/img/icon_pilates_1a0c0196.png',
    mobility:        '/api/img/icon_mobility_e968ef5f.png',
    quick_workouts:  '/api/img/icon_quick_workouts_2e09574e.png',
  };
  // Merge defaults with CMS overrides — CMS wins when set
  const SESSION_ICON_URLS: Partial<Record<SessionType, string>> = {
    ...DEFAULT_SESSION_ICON_URLS,
    ...Object.fromEntries(
      Object.entries(sessionIconOverrides).filter(([, v]) => !!v)
    ) as Partial<Record<SessionType, string>>,
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
          <p style={{ margin: '0 0 4px', color: SKY_LIGHT, fontSize: 13 }}><span style={{display:'flex',alignItems:'center',gap:6}}>{greeting}<AppIcons.Wave size={16} /></span></p>
          <h2 style={{ margin: '0 0 4px', color: 'white', fontSize: 22, fontWeight: 800 }}>
            {(profile.name || '').trim().split(/\s+/)[0]}
          </h2>
          <p style={{ margin: '0 0 0', color: `${SKY_LIGHT}CC`, fontSize: 12 }}>{dayName}، {dateStr}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: t('thisWeek'), value: `${stats.thisWeek} ${sessionsWord(stats.thisWeek, lang)}` },
              { label: t('thisMonth'), value: `${stats.thisMonth} ${sessionsWord(stats.thisMonth, lang)}` },
              { label: t('total'), value: `${stats.totalSessions} ${sessionsWord(stats.totalSessions, lang)}` },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.10)', borderRadius: 10, padding: '8px 14px',
                border: `1px solid ${SKY}33`,
              }}>
                <div style={{ color: SKY_LIGHT, fontSize: 11 }}>{s.label}</div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Progress — or, before any weights exist, the one step that
          makes this card mean something. */}
      {!(profile.currentWeight > 0 && profile.targetWeight > 0) ? (
        <button onClick={onOpenProfile} style={{
          width: '100%', textAlign: 'start', cursor: 'pointer', fontFamily: 'inherit',
          background: 'white', borderRadius: 16, padding: '16px 18px', marginBottom: 16,
          boxShadow: '0 4px 20px rgba(27,46,94,0.08)', border: 'none',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: '#EAF2F8', color: NAVY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AppIcons.Scale size={20} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 700, color: NAVY, fontSize: 14 }}>
              {lang === 'ar' ? 'أضف وزنك الحالي وهدفك' : 'Add your current and target weight'}
            </span>
            <span style={{ display: 'block', fontSize: 12, color: '#506A88', marginTop: 2 }}>
              {lang === 'ar' ? 'حتى نحسب تقدمك ونبني خطتك عليه.' : 'So your progress can be tracked and your plan built around it.'}
            </span>
          </span>
          <span style={{ color: '#3D5A80', display: 'inline-flex' }}>{isRTL ? <AppIcons.ChevronLeft size={18} /> : <AppIcons.ChevronRight size={18} />}</span>
        </button>
      ) : (
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px 18px', marginBottom: 16,
        boxShadow: '0 4px 20px rgba(27,46,94,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Scale size={16} />{t('weightProgress')}</span></span>
          <span style={{ fontSize: 12, color: '#506A88' }}>
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
          <span style={{ fontSize: 11, color: '#506A88' }}>{lang === 'ar' ? 'بداية' : 'Start'}: {profile.startWeight} {t('kg')}</span>
          <span style={{ fontSize: 11, color: NAVY, fontWeight: 700 }}>
            {stats.progressPercent}% • {lang === 'ar' ? (gender === 'female' ? 'خسرتِ' : 'خسرت') : 'Lost'} {stats.weightLost.toFixed(1)} {t('kg')} 
          </span>
        </div>
      </div>
      )}



      {/* Check-In Title */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: NAVY, fontSize: 17, fontWeight: 800 }}>
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Dumbbell size={18} className='text-[#1B2E5E]' />{t('chooseWorkout')}</span>
        </h3>
        <p style={{ margin: '4px 0 0', color: '#506A88', fontSize: 12 }}>
          {t('autoTime')}
        </p>
      </div>

      {/* Today's Gym Classes */}
      <TodayGymClasses />

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
                        <img
                          src={SESSION_ICON_URLS[type]}
                          alt={nameDisplay}
                          style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            console.warn('[CMS] IMAGE SRC failed on home card:', type, SESSION_ICON_URLS[type]);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>{def.icon}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: NAVY, fontSize: 13, lineHeight: 1.3 }}>
                      {nameDisplay.split(' - ')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: '#506A88', marginTop: 4, lineHeight: 1.4 }}>
                      {descDisplay}
                    </div>
                    {sessionExercises.length > 0 && (
                      <div style={{ fontSize: 11, color: '#3D5A80', marginTop: 4, fontWeight: 600 }}>
                        {sessionExercises.length} {lang === 'ar' ? 'تمرين' : 'exercises'}
                      </div>
                    )}
                  </div>
                  {sessionExercises.length > 0 && (
                    <span style={{ color: SKY, fontSize: 14, marginTop: 4 }}>{isExpanded ? <AppIcons.ChevronUp size={14} /> : <AppIcons.ChevronDown size={14} />}</span>
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
                  <div style={{ marginBottom: 10, color: '#506A88', fontSize: 11, fontWeight: 600 }}>
                    {lang === 'ar' ? 'أجهزة الكارديو — سجّل بياناتك بعد التمرين:' : 'Cardio Machines — Log your data after workout:'}
                  </div>

                  {cardioMachines.map(machine => {
                    const mid = machine.id;
                    const mData = cardioData[mid] || { speed: '', incline: '', time: '', distance: '', calories: '' };
                    const isSaved = !!cardioSaved[mid];

                    // Define fields per machine
                    const machineIcons: Record<string, string> = {
                      treadmill: 'running',
                      rower: 'rowing',
                      precor_bike: 'bike',
                      climbmill: 'mountain',
                    };
                    const iconKey = machineIcons[mid] || 'dumbbell';

                    // Fields config per machine
                    type FieldDef = { key: keyof typeof mData; labelAr: string; labelEn: string; placeholder: string; fullRow?: boolean };
                    const fieldsMap: Record<string, FieldDef[]> = {
                      treadmill: [
                        { key: 'speed', labelAr: 'السرعة (km/h)', labelEn: 'Speed (km/h)', placeholder: 'e.g. 5.5' },
                        { key: 'incline', labelAr: 'الانحدار (%)', labelEn: 'Incline (%)', placeholder: 'e.g. 3' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: 'المسافة (km)', labelEn: 'Distance (km)', placeholder: 'e.g. 1.8' },
                        { key: 'calories', labelAr: 'السعرات', labelEn: 'Calories', placeholder: 'e.g. 150', fullRow: true },
                      ],
                      rower: [
                        { key: 'speed', labelAr: 'الإيقاع (SPM)', labelEn: 'Rate (SPM)', placeholder: 'e.g. 24' },
                        { key: 'incline', labelAr: 'المقاومة (Level)', labelEn: 'Resistance', placeholder: 'e.g. 5' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 15' },
                        { key: 'distance', labelAr: 'المسافة (m)', labelEn: 'Distance (m)', placeholder: 'e.g. 3100' },
                        { key: 'calories', labelAr: 'السعرات', labelEn: 'Calories', placeholder: 'e.g. 120', fullRow: true },
                      ],
                      precor_bike: [
                        { key: 'speed', labelAr: 'السرعة (RPM)', labelEn: 'Speed (RPM)', placeholder: 'e.g. 80' },
                        { key: 'incline', labelAr: 'المقاومة (Level)', labelEn: 'Resistance', placeholder: 'e.g. 8' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: 'المسافة (km)', labelEn: 'Distance (km)', placeholder: 'e.g. 5.0' },
                        { key: 'calories', labelAr: 'السعرات', labelEn: 'Calories', placeholder: 'e.g. 180', fullRow: true },
                      ],
                      climbmill: [
                        { key: 'speed', labelAr: 'السرعة (خطوة/د)', labelEn: 'Steps/min', placeholder: 'e.g. 60' },
                        { key: 'incline', labelAr: 'المستوى', labelEn: 'Level', placeholder: 'e.g. 8' },
                        { key: 'time', labelAr: '⏱ الوقت (min)', labelEn: '⏱ Time (min)', placeholder: 'e.g. 20' },
                        { key: 'distance', labelAr: 'الطوابق', labelEn: 'Floors', placeholder: 'e.g. 40' },
                        { key: 'calories', labelAr: 'السعرات', labelEn: 'Calories', placeholder: 'e.g. 200', fullRow: true },
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
                            <span style={{display:'inline-flex',alignItems:'center',gap:6}}>{iconKey === 'running' ? <AppIcons.Running size={16} /> : iconKey === 'mountain' ? <AppIcons.Mountain size={16} /> : <AppIcons.Cardio size={16} />}{lang === 'ar' ? machine.nameAr : machine.nameEn}</span>
                          </div>
                        </div>

                        {/* Tip */}
                        <div style={{ padding: '8px 12px 4px' }}>
                          <div style={{ color: '#506A88', fontSize: 11, fontWeight: 600 }}>
                            <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Info size={14} className='text-blue-500' />{lang === 'ar' ? machine.tip : (machine.tipEn || machine.tip)}</span>
                          </div>
                        </div>

                        {/* Input fields */}
                        <div style={{ padding: '8px 12px 12px' }}>
                          <div style={{ color: '#506A88', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
                            <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Stats size={14} />{lang === 'ar' ? 'سجّل بياناتك بعد التمرين:' : 'Log your data after workout:'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {fields.map(field => (
                              <div key={field.key} style={{ gridColumn: field.fullRow ? '1 / -1' : 'auto' }}>
                                <div style={{ fontSize: 11, color: NAVY, fontWeight: 700, marginBottom: 4 }}>
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
                              fontFamily: 'Tajawal, Inter, sans-serif',
                            }}
                          >
                            {isSaved
                              ? (lang === 'ar' ? 'تم الحفظ!' : 'Saved!')
                              : (lang === 'ar' ? `حفظ بيانات ${machine.nameAr.split(' ')[0]}` : `Save ${machine.nameEn} Data`)}
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
                  <div style={{ marginBottom: 8, color: '#506A88', fontSize: 11, fontWeight: 600 }}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Clipboard size={14} />{lang === 'ar' ? 'تمارين هذا القسم:' : 'Exercises in this section:'}</span>
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
                        <div style={{ color: '#506A88', fontSize: 11, marginTop: 2 }}>
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
                          fontSize: 11,
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
                  <AppIcons.ChevronRight size={14} />
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

// ── Today's Gym Classes (shown on Home below check-in title, above exercise cards) ─────────────────────────
function TodayGymClasses() {
  const { lang } = useLanguage();
  const { isAuthenticated } = useAuth();

  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const { data: classes = [], isLoading } = trpc.gymClasses.getTodayClasses.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const joinMutation = trpc.gymClasses.joinClass.useMutation();
  const leaveMutation = trpc.gymClasses.leaveClass.useMutation();

  const [joinedIds, setJoinedIds] = React.useState<Set<number>>(new Set());
  const [joiningId, setJoiningId] = React.useState<number | null>(null);
  const [leavingId, setLeavingId] = React.useState<number | null>(null);
  // Track which gym cards are expanded — default: all expanded
  const [expandedGyms, setExpandedGyms] = React.useState<Set<number>>(new Set());
  // Track which branches are expanded — default: all expanded
  const [expandedBranches, setExpandedBranches] = React.useState<Set<number>>(new Set());

  // Group classes by gymId, then by branchId
  const gymGroups = React.useMemo(() => {
    const map = new Map<number, {
      gymId: number;
      gymName: string;
      gymBrandColor: string | null;
      gymLogoUrl: string | null;
      branches: Map<number, { branchId: number; branchName: string; classes: any[] }>;
    }>();
    for (const cls of classes as any[]) {
      if (!map.has(cls.gymId)) {
        map.set(cls.gymId, {
          gymId: cls.gymId,
          gymName: cls.gymName,
          gymBrandColor: cls.gymBrandColor,
          gymLogoUrl: cls.gymLogoUrl ?? null,
          branches: new Map(),
        });
      }
      const gym = map.get(cls.gymId)!;
      if (!gym.branches.has(cls.branchId)) {
        gym.branches.set(cls.branchId, { branchId: cls.branchId, branchName: cls.branchName ?? '', classes: [] });
      }
      gym.branches.get(cls.branchId)!.classes.push(cls);
    }
    return Array.from(map.values());
  }, [classes]);

  // Gyms and branches start collapsed; user taps to expand

  const handleJoin = async (classId: number) => {
    if (joinedIds.has(classId) || joiningId === classId) return;
    setJoiningId(classId);
    try {
      await joinMutation.mutateAsync({ classId });
      setJoinedIds(prev => new Set(Array.from(prev).concat(classId)));
    } catch {
      setJoinedIds(prev => new Set(Array.from(prev).concat(classId)));
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (classId: number) => {
    if (leavingId === classId) return;
    setLeavingId(classId);
    try {
      await leaveMutation.mutateAsync({ classId });
      setJoinedIds(prev => {
        const next = new Set(Array.from(prev));
        next.delete(classId);
        return next;
      });
    } catch {
      // If server returns NOT_FOUND, still remove from local state
      setJoinedIds(prev => {
        const next = new Set(Array.from(prev));
        next.delete(classId);
        return next;
      });
    } finally {
      setLeavingId(null);
    }
  };

  const toggleGym = (gymId: number) => {
    setExpandedGyms(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(gymId)) next.delete(gymId); else next.add(gymId);
      return next;
    });
  };

  const toggleBranch = (branchId: number) => {
    setExpandedBranches(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(branchId)) next.delete(branchId); else next.add(branchId);
      return next;
    });
  };

  const intensityColor = (i: string) => {
    if (i === 'Beginner') return { bg: '#DCFCE7', text: '#16A34A' };
    if (i === 'Intermediate') return { bg: '#FEF9C3', text: '#CA8A04' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  if (!isLoading && classes.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 800 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcons.Calendar size={18} />
            {lang === 'ar' ? 'حصص اليوم' : "Today's Classes"}
          </span>
        </h3>
        <span style={{ fontSize: 11, color: '#506A88', fontWeight: 600 }}>{todayDay}</span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 72, background: '#D0DFF0', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* One card per gym */}
      {!isLoading && gymGroups.map(gym => {
        const isExpanded = expandedGyms.has(gym.gymId);
        const accentColor = gym.gymBrandColor || NAVY;
        const totalClasses = Array.from(gym.branches.values()).reduce((s, b) => s + b.classes.length, 0);
        return (
          <div
            key={gym.gymId}
            style={{
              background: 'white',
              borderRadius: 18,
              marginBottom: 12,
              boxShadow: '0 3px 16px rgba(27,46,94,0.09)',
              overflow: 'hidden',
              border: `1.5px solid ${SKY_LIGHT}`,
            }}
          >
            {/* Gym header — tap to expand/collapse */}
            <button
              onClick={() => toggleGym(gym.gymId)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: isExpanded ? `1.5px solid ${SKY_LIGHT}` : 'none',
              }}
            >
              {/* Accent bar */}
              <div style={{ width: 5, height: 42, borderRadius: 4, background: accentColor, flexShrink: 0 }} />

              {/* Gym logo or initial */}
              {gym.gymLogoUrl ? (
                <img src={resolveImageUrl(gym.gymLogoUrl)} alt={gym.gymName}
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 18,
                }}>
                  {gym.gymName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Gym name + class count */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>{gym.gymName}</div>
                <div style={{ fontSize: 11, color: '#506A88', marginTop: 2 }}>
                  {totalClasses} {lang === 'ar' ? 'حصة اليوم' : totalClasses === 1 ? 'class today' : 'classes today'}
                  {' · '}{gym.branches.size} {lang === 'ar' ? 'فرع' : gym.branches.size === 1 ? 'branch' : 'branches'}
                </div>
              </div>

              {/* Chevron */}
              <svg
                width={18} height={18} viewBox="0 0 24 24" fill="none"
                style={{ flexShrink: 0, transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M6 9l6 6 6-6" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Expanded content: branches + classes */}
            {isExpanded && (
              <div style={{ padding: '8px 16px 14px' }}>
                {Array.from(gym.branches.values()).map((branch, bIdx) => {
                  const isBranchExpanded = expandedBranches.has(branch.branchId);
                  return (
                  <div key={branch.branchId} style={{ marginTop: bIdx > 0 ? 14 : 6 }}>
                    {/* Branch header — tap to expand/collapse */}
                    <button
                      onClick={() => toggleBranch(branch.branchId)}
                      style={{
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: isBranchExpanded ? 8 : 0,
                      }}
                    >
                      <AppIcons.Location size={11} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#506A88', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1, textAlign: 'left' }}>
                        {branch.branchName || (lang === 'ar' ? 'الفرع الرئيسي' : 'Main Branch')}
                      </span>
                      <span style={{ fontSize: 11, color: '#506A88', marginRight: 4 }}>
                        {branch.classes.length} {lang === 'ar' ? 'حصة' : branch.classes.length === 1 ? 'class' : 'classes'}
                      </span>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isBranchExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path d="M6 9l6 6 6-6" stroke="#7A9BB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* Class rows — only shown when branch is expanded */}
                    {isBranchExpanded && branch.classes.map((cls: any, cIdx: number) => {
                      const joined = joinedIds.has(cls.id) || cls.alreadyJoined;
                      const ic = intensityColor(cls.intensity);
                      const kcal = cls.caloriesOverride ?? (cls.intensity === 'Beginner' ? 200 : cls.intensity === 'Intermediate' ? 300 : 400);
                      return (
                        <div
                          key={cls.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: joined ? '#F0FDF4' : '#F8FAFC',
                            marginBottom: cIdx < branch.classes.length - 1 ? 6 : 0,
                            border: `1px solid ${joined ? '#BBF7D0' : '#D0DFF0'}`,
                            transition: 'background 0.3s, border-color 0.3s',
                          }}
                        >
                          {/* Left accent dot */}
                          <div style={{ width: 4, height: 36, borderRadius: 3, background: accentColor, flexShrink: 0 }} />

                          {/* Class info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, color: NAVY, fontSize: 13 }}>{cls.className}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: ic.bg, color: ic.text }}>
                                {cls.intensity}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#3D5A80' }}>
                                <AppIcons.Coach size={11} />{cls.coach}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#3D5A80' }}>
                                <AppIcons.Timer size={11} />{cls.time} · {cls.durationMin}{lang === 'ar' ? 'د' : 'min'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#F97316', fontWeight: 600 }}>
                                🔥 {kcal} {lang === 'ar' ? 'سعرة' : 'kcal'}
                              </span>
                            </div>
                            {cls.notes && (
                              <div style={{ fontSize: 11, color: '#506A88', marginTop: 2 }}>{cls.notes}</div>
                            )}
                          </div>

                          {/* Join / Leave button */}
                          {joined ? (
                            <button
                              onClick={() => handleLeave(cls.id)}
                              disabled={leavingId === cls.id}
                              style={{
                                flexShrink: 0,
                                padding: '7px 13px',
                                borderRadius: 9,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 700,
                                background: leavingId === cls.id
                                  ? '#94A3B8'
                                  : 'linear-gradient(135deg, #EF4444, #DC2626)',
                                color: 'white',
                                transition: 'background 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {leavingId === cls.id ? (
                                <><AppIcons.Spinner size={12} /> ...</>
                              ) : (
                                <>{lang === 'ar' ? 'إلغاء' : 'Leave'}</>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoin(cls.id)}
                              disabled={joiningId === cls.id}
                              style={{
                                flexShrink: 0,
                                padding: '7px 13px',
                                borderRadius: 9,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 700,
                                background: joiningId === cls.id
                                  ? '#94A3B8'
                                  : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
                                color: 'white',
                                transition: 'background 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {joiningId === cls.id ? (
                                <><AppIcons.Spinner size={12} /> ...</>
                              ) : (
                                <><AppIcons.Plus size={12} /> {lang === 'ar' ? 'انضم' : 'Join'}</>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Salad size={18} className='text-green-600' />{lang === 'ar' ? 'تغذية اليوم' : "Today's Nutrition"}</span>
        </span>
      </div>

      {/* Calories row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#3D5A80'}}><AppIcons.Flame size={12} className='text-orange-500' />{lang === 'ar' ? 'سعرات' : 'Calories'}</span>
        <span style={{ fontSize: 12, color: '#3D5A80' }}>{calories} / {goalCal} kcal</span>
      </div>
      <div style={{ height: 6, background: '#D0DFF0', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${calPct}%`, background: `linear-gradient(90deg, ${SKY}, ${NAVY})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>

      {/* Macros row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[
          { label: lang === 'ar' ? 'بروتين' : 'Protein', value: `${Math.round(protein)}g`, color: '#EF4444', bg: '#FEF2F2' },
          { label: lang === 'ar' ? 'كربو' : 'Carbs', value: `${Math.round(carbs)}g`, color: '#B45309', bg: '#FFFBEB' },
          { label: lang === 'ar' ? 'دهون' : 'Fat', value: `${Math.round(fat)}g`, color: '#8B5CF6', bg: '#F5F3FF' },
        ].map(m => (
          <div key={m.label} style={{ flex: 1, background: m.bg, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: m.color, fontSize: 14 }}>{m.value}</div>
            <div style={{ color: '#506A88', fontSize: 11 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Water row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#3D5A80'}}><AppIcons.Water size={12} className='text-blue-500' />{lang === 'ar' ? 'ماء' : 'Water'}</span>
        <span style={{ fontSize: 12, color: SKY, fontWeight: 700 }}>{water} / {goalWater} ml</span>
      </div>
      <div style={{ height: 6, background: '#D0DFF0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${waterPct}%`, background: `linear-gradient(90deg, #5BA3C4, #5BA3C4)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
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
    fontFamily: 'Inter, Tajawal, sans-serif', color: NAVY,
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
              <span style={{display:'flex',alignItems:'center',gap:4}}>{g === 'female' ? <AppIcons.Female size={14} /> : <AppIcons.Male size={14} />}{g === 'female' ? 'Female' : 'Male'}</span>
            </button>
          ))}
        </div>
      </div>
      {previewBMI && (
        <div style={{ background: '#EAF3F9', borderRadius: 12, padding: '10px 14px', textAlign: 'center', border: `1px solid ${SKY_LIGHT}` }}>
          <span style={{ fontSize: 12, color: '#3D5A80' }}>BMI Preview: </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: previewBMI < 18.5 ? '#2A4A8C' : previewBMI < 25 ? '#15803D' : previewBMI < 30 ? '#B45309' : '#EF4444' }}>{previewBMI}</span>
          <span style={{ fontSize: 12, color: '#3D5A80', marginLeft: 6 }}>{previewBMI < 18.5 ? 'Underweight' : previewBMI < 25 ? 'Normal' : previewBMI < 30 ? 'Overweight' : 'Obese'}</span>
        </div>
      )}
      {error && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}><span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Warning size={14} className='text-[#B91C1C]' />{error}</span></p>}
      <button onClick={handleSubmit} style={{
        background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`, color: '#fff', border: 'none', borderRadius: 14,
        padding: '14px', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 4,
        boxShadow: `0 4px 16px ${NAVY}44`,
      }}>
        <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Lightning size={16} />Start My Program</span>
      </button>
    </div>
  );
}
