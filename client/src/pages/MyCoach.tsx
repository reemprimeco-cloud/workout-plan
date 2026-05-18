/**
 * My Coach — AI Personal Trainer
 * Layout: WhatsApp-style — header+stats+tabs fixed at top,
 *         chat messages scroll independently, input bar fixed at bottom.
 * Design: White background + Navy blue (#1B2E5E) accents — Prime Fit style
 * Bilingual: Arabic RTL + English
 */

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useGymTracker } from '@/hooks/useGymTracker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { AppIcons } from '../components/AppIcons';

const NAVY      = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY       = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const BG        = '#F0F4F8';

interface ChatMsg { role: 'user' | 'assistant'; content: string; id: string }

const QUICK_ACTIONS = {
  ar: [
    { icon: 'stats', label: 'حلّل تقدمي', prompt: 'حلّل تقدمي في التمارين والوزن وأعطني ملاحظاتك' },
    { icon: 'dumbbell', label: 'ماذا أتمرن؟', prompt: 'ما هو التمرين المناسب لي اليوم؟' },
    { icon: 'scale', label: 'لماذا لا يتغير وزني؟', prompt: 'لماذا لا يتغير وزني رغم التمرين؟' },
    { icon: 'dumbbell', label: 'حفّزني', prompt: 'أحتاج إلى تحفيز لمواصلة رحلتي الرياضية' },
    { icon: 'yoga', label: 'تعافٍ', prompt: 'اقترح لي تمرين تعافٍ خفيف لليوم' },
  ],
  en: [
    { icon: 'stats', label: 'Analyse', prompt: 'Analyse my workout and weight progress and give me feedback' },
    { icon: 'dumbbell', label: 'What to train?', prompt: 'What workout is best for me today?' },
    { icon: 'scale', label: 'Weight stuck?', prompt: 'Why is my weight not changing despite working out?' },
    { icon: 'dumbbell', label: 'Motivate me', prompt: 'I need motivation to continue my fitness journey' },
    { icon: 'yoga', label: 'Recovery', prompt: 'Suggest a light recovery workout for today' },
  ],
};

const RATING_EMOJIS = ['1', '2', '3', '4', '5'];

const INSIGHT_COLORS: Record<string, string> = {
  progress: '#10B981', warning: '#F59E0B', motivation: NAVY, recommendation: SKY,
};
const INSIGHT_ICONS: Record<string, string> = {
  progress: 'stats', warning: 'warning', motivation: 'info', recommendation: 'target',
};

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '10px 6px',
      textAlign: 'center', border: '1px solid #E2EAF4', flex: 1,
      boxShadow: '0 2px 6px rgba(27,46,94,0.07)',
    }}>
      <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
      <div style={{ color, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#64748B', fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function InsightCard({ type, content }: { type: string; content: string }) {
  const color = INSIGHT_COLORS[type] ?? NAVY;
  const iconKey = INSIGHT_ICONS[type] ?? 'message';
  return (
    <div style={{
      background: 'white', border: `1px solid #E2EAF4`, borderLeft: `4px solid ${color}`,
      borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
      boxShadow: '0 2px 6px rgba(27,46,94,0.06)',
    }}>
      <span style={{ flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>{iconKey === 'stats' ? <AppIcons.Stats size={18} /> : iconKey === 'warning' ? <AppIcons.Warning size={18} /> : iconKey === 'info' ? <AppIcons.Info size={18} /> : iconKey === 'target' ? <AppIcons.Target size={18} /> : <AppIcons.Message size={18} />}</span>
      <p style={{ margin: 0, color: '#1E293B', fontSize: 13, lineHeight: 1.6 }}>{content}</p>
    </div>
  );
}

function ChatBubble({ msg, isRTL }: { msg: ChatMsg; isRTL: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
      marginBottom: 10, alignItems: 'flex-end', gap: 6,
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `linear-gradient(135deg, ${NAVY}, ${SKY})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}><AppIcons.Robot size={24} /></div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser ? `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})` : 'white',
        borderRadius: isUser
          ? (isRTL ? '16px 16px 16px 4px' : '16px 16px 4px 16px')
          : (isRTL ? '16px 16px 4px 16px' : '16px 16px 16px 4px'),
        padding: '9px 13px',
        border: isUser ? 'none' : '1px solid #E2EAF4',
        boxShadow: isUser ? `0 3px 10px rgba(27,46,94,0.25)` : '0 2px 6px rgba(27,46,94,0.08)',
      }}>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.65,
          color: isUser ? 'white' : '#1E293B',
          whiteSpace: 'pre-wrap',
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        }}>{msg.content}</p>
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: SKY_LIGHT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}><AppIcons.Profile size={24} /></div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: `linear-gradient(135deg, ${NAVY}, ${SKY})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}><AppIcons.Robot size={24} /></div>
      <div style={{
        background: 'white', border: '1px solid #E2EAF4',
        borderRadius: '16px 16px 16px 4px', padding: '9px 14px',
        display: 'flex', gap: 4, alignItems: 'center',
        boxShadow: '0 2px 6px rgba(27,46,94,0.08)',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: NAVY,
            animation: `coachBounce 1.2s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function CheckInCard({
  lang, isRTL, profile, stats, onDone,
}: { lang: 'ar' | 'en'; isRTL: boolean; profile: any; stats: any; onDone: (r: string) => void }) {
  const [feeling, setFeeling] = useState(3);
  const [energy,  setEnergy]  = useState(3);
  const [sleep,   setSleep]   = useState(3);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [aiResp,  setAiResp]  = useState('');
  const checkinMutation = trpc.coach.checkin.useMutation();
  const isAr = lang === 'ar';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await checkinMutation.mutateAsync({
        feeling, energy, sleep, lang,
        context: { name: profile.name, currentWeight: profile.currentWeight, targetWeight: profile.targetWeight, streak: stats.streak },
      });
      setAiResp(result.aiResponse); setDone(true); onDone(result.aiResponse);
    } catch {
      setAiResp(isAr ? 'حدث خطأ. حاول مجدداً.' : 'Something went wrong. Please try again.'); setDone(true);
    } finally { setLoading(false); }
  };

  const RatingRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#475569', fontSize: 13, marginBottom: 7, textAlign: isRTL ? 'right' : 'left', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', gap: 7, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
        {RATING_EMOJIS.map((emoji, i) => (
          <button key={i} onClick={() => onChange(i + 1)} style={{
            width: 44, height: 44, borderRadius: 12,
            border: value === i + 1 ? `2px solid ${NAVY}` : '2px solid #E2EAF4',
            background: value === i + 1 ? `${NAVY}11` : 'white',
            fontSize: 20, cursor: 'pointer', transition: 'all 0.15s',
            transform: value === i + 1 ? 'scale(1.15)' : 'scale(1)',
            boxShadow: value === i + 1 ? `0 4px 10px rgba(27,46,94,0.15)` : 'none',
          }}>{emoji}</button>
        ))}
      </div>
    </div>
  );

  if (done && aiResp) {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 16px', border: `1px solid #E2EAF4`, boxShadow: '0 3px 12px rgba(27,46,94,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <AppIcons.Robot size={22} />
          <span style={{ color: NAVY, fontWeight: 800, fontSize: 14 }}>{isAr ? 'رأي مدربك' : 'Your Coach Says'}</span>
        </div>
        <p style={{ color: '#1E293B', fontSize: 13, lineHeight: 1.7, margin: 0, direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{aiResp}</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '18px 16px', border: '1px solid #E2EAF4', boxShadow: '0 3px 12px rgba(27,46,94,0.08)' }}>
      <h3 style={{ color: NAVY, fontWeight: 900, fontSize: 15, margin: '0 0 4px', textAlign: isRTL ? 'right' : 'left' }}>
        <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Sun size={18} />{isAr ? 'تسجيل الحضور اليومي' : 'Daily Check-In'}</span>
      </h3>
      <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 16px', textAlign: isRTL ? 'right' : 'left' }}>
        {isAr ? 'أخبر مدربك كيف تشعر اليوم' : 'Tell your coach how you feel today'}
      </p>
      <RatingRow label={isAr ? 'كيف تشعر؟' : 'How do you feel?'} value={feeling} onChange={setFeeling} />
      <RatingRow label={isAr ? 'مستوى الطاقة' : 'Energy level'} value={energy} onChange={setEnergy} />
      <RatingRow label={isAr ? 'جودة النوم' : 'Sleep quality'} value={sleep} onChange={setSleep} />
      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%', padding: '12px',
        background: loading ? '#94A3B8' : `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
        color: 'white', fontWeight: 900, fontSize: 14, border: 'none', borderRadius: 13,
        cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'all 0.2s',
        boxShadow: loading ? 'none' : `0 4px 14px rgba(27,46,94,0.3)`,
      }}>
        <span style={{display:'flex',alignItems:'center',gap:6}}>{loading ? <AppIcons.Spinner size={16} /> : <AppIcons.Lightning size={16} />}{loading ? (isAr ? 'جاري التحليل...' : 'Analysing...') : (isAr ? 'احصل على توصية مدربك' : 'Get Coach Recommendation')}</span>
      </button>
    </div>
  );
}

export default function MyCoach() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, stats, data } = useGymTracker();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  const [activeSection, setActiveSection] = useState<'chat' | 'checkin' | 'insights'>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const historyQuery   = trpc.coach.getHistory.useQuery({ limit: 40 }, { enabled: isAuthenticated });
  const todayCheckin   = trpc.coach.getTodayCheckin.useQuery(undefined, { enabled: isAuthenticated });
  const insightsQuery  = trpc.coach.getInsights.useQuery({ limit: 8 }, { enabled: isAuthenticated });
  const todayNutrition = trpc.nutrition.getTodayLog.useQuery({ date: undefined }, { enabled: isAuthenticated, staleTime: 0 });
  const utils = trpc.useUtils();

  const chatMutation         = trpc.coach.chat.useMutation();
  const genInsightsMutation  = trpc.coach.generateInsights.useMutation();
  const clearHistoryMutation = trpc.coach.clearHistory.useMutation();

  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(historyQuery.data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content, id: String(m.id) })));
    }
  }, [historyQuery.data]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const weeklyCompletion = (() => {
    const now = new Date(); const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
    return Math.min(100, Math.round((data.sessions.filter(s => new Date(s.date) >= weekStart).length / 5) * 100));
  })();

  const weightChange = (() => {
    if (!profile.startWeight || !profile.currentWeight) return 0;
    return Math.round((profile.currentWeight - profile.startWeight) * 10) / 10;
  })();

  const buildContext = () => ({
    name: profile.name, currentWeight: profile.currentWeight, targetWeight: profile.targetWeight,
    streak: stats.streak, weeklyCompletion,
    todayNutrition: todayNutrition.data ? {
      calories: Math.round(todayNutrition.data.totals.calories), proteinG: Math.round(todayNutrition.data.totals.proteinG),
      carbsG: Math.round(todayNutrition.data.totals.carbsG), fatG: Math.round(todayNutrition.data.totals.fatG),
      waterMl: todayNutrition.data.totalWaterMl, goalCalories: todayNutrition.data.goals?.calories ?? 2000,
      goalProtein: todayNutrition.data.goals?.proteinG ?? 150, goalCarbs: todayNutrition.data.goals?.carbsG ?? 200,
      goalFat: todayNutrition.data.goals?.fatG ?? 65, goalWater: todayNutrition.data.goals?.waterMl ?? 2500,
      mealCount: todayNutrition.data.meals?.length ?? 0,
    } : undefined,
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: text, id: Date.now().toString() }]);
    setInput(''); setIsTyping(true);
    try {
      const result = await chatMutation.mutateAsync({ message: text, lang: lang as 'ar' | 'en', context: buildContext() });
      setMessages(prev => [...prev, { role: 'assistant', content: result.content, id: (Date.now() + 1).toString() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: isAr ? 'عذراً، حدث خطأ. حاول مجدداً.' : 'Sorry, something went wrong.', id: (Date.now() + 1).toString() }]);
    } finally { setIsTyping(false); }
  };

  if (authLoading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
      <div style={{ color: NAVY, fontSize: 14 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
    </div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 18, boxShadow: `0 8px 24px rgba(27,46,94,0.3)` }}><AppIcons.Robot size={24} /></div>
        <h2 style={{ color: NAVY, fontWeight: 900, fontSize: 20, margin: '0 0 8px' }}>{isAr ? 'مدربك الشخصي' : 'Your Personal Coach'}</h2>
        <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 22px' }}>{isAr ? 'سجّل الدخول للوصول إلى مدربك الذكي' : 'Sign in to access your AI coach'}</p>
        <a href={getLoginUrl()} style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`, color: 'white', fontWeight: 900, fontSize: 14, padding: '12px 32px', borderRadius: 13, textDecoration: 'none', boxShadow: `0 4px 14px rgba(27,46,94,0.3)` }}>
          {isAr ? 'تسجيل الدخول' : 'Sign In'}
        </a>
      </div>
    );
  }

  // ── Full-height flex column — NO page scroll ──────────────────────────────────
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0, background: BG,
      fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
    }}>

      {/* ── FIXED TOP: navy header ── */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%)`, padding: '12px 16px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}><AppIcons.Robot size={24} /></div>
          <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
            <h1 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{isAr ? 'مدربي الذكي' : 'My AI Coach'}</h1>
            <p style={{ margin: '3px 0 0', color: SKY_LIGHT, fontSize: 11 }}>{isAr ? `مرحباً ${profile.name || ''}! كيف يمكنني مساعدتك؟` : `Hi ${profile.name || ''}! How can I help you today?`}</p>
          </div>
        </div>
      </div>

      {/* ── FIXED: stats row ── */}
      <div style={{ padding: '10px 12px 0', background: BG, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <StatCard icon="dumbbell" value={data.sessions.length} label={isAr ? 'جلسة' : 'Sessions'} color={NAVY} />
          <StatCard icon={weightChange <= 0 ? 'trending_down' : 'stats'} value={`${weightChange > 0 ? '+' : ''}${weightChange}`} label={isAr ? 'تغيير الوزن' : 'Weight Δ'} color={weightChange <= 0 ? '#10B981' : '#F59E0B'} />
          <StatCard icon="check" value={`${weeklyCompletion}%`} label={isAr ? 'أسبوعي' : 'Weekly'} color="#10B981" />
          <StatCard icon="flame" value={stats.streak} label={isAr ? 'يوم متواصل' : 'Streak'} color="#E05A00" />
        </div>
      </div>

      {/* ── FIXED: section tabs ── */}
      <div style={{ display: 'flex', gap: 7, padding: '8px 12px', background: BG, flexShrink: 0 }}>
        {([
          { id: 'chat' as const,     icon: 'message', label: isAr ? 'المحادثة' : 'Chat' },
          { id: 'checkin' as const,  icon: 'sun', label: isAr ? 'تسجيل الحضور' : 'Check-In' },
          { id: 'insights' as const, icon: 'brain', label: isAr ? 'الرؤى' : 'Insights' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
            flex: 1, padding: '8px 4px',
            background: activeSection === tab.id ? NAVY : 'white',
            border: activeSection === tab.id ? 'none' : '1px solid #E2EAF4',
            borderRadius: 12, cursor: 'pointer',
            color: activeSection === tab.id ? 'white' : '#64748B',
            fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
            boxShadow: activeSection === tab.id ? `0 3px 10px rgba(27,46,94,0.25)` : '0 1px 3px rgba(27,46,94,0.06)',
          }}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE MIDDLE ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, padding: '0 12px' }}>

        {/* Chat messages */}
        {activeSection === 'chat' && (
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            {messages.length === 0 && !isTyping && (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}><AppIcons.Robot size={24} /></div>
                  <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                    {isAr ? `مرحباً ${profile.name || ''}! أنا مدربك الشخصي. اسألني أي شيء.` : `Hi ${profile.name || ''}! I'm your personal coach. Ask me anything.`}
                  </p>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: '#64748B', fontSize: 11, margin: '0 0 7px', textAlign: isRTL ? 'right' : 'left', fontWeight: 600 }}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Lightning size={16} />{isAr ? 'أسئلة سريعة' : 'Quick Actions'}</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_ACTIONS[isAr ? 'ar' : 'en'].map((qa, i) => (
                      <button key={i} onClick={() => sendMessage(qa.prompt)} style={{
                        background: 'white', border: `1px solid #E2EAF4`, borderRadius: 18, padding: '6px 11px',
                        color: NAVY, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        fontWeight: 600, boxShadow: '0 1px 3px rgba(27,46,94,0.08)',
                      }}>
                        <span>{qa.icon}</span> {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {messages.map(msg => <ChatBubble key={msg.id} msg={msg} isRTL={isRTL} />)}
            {isTyping && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Check-in */}
        {activeSection === 'checkin' && (
          <div style={{ paddingTop: 8, paddingBottom: 12 }}>
            {todayCheckin.data ? (
              <div>
                <div style={{ background: '#F0FDF4', border: `1px solid #86EFAC`, borderRadius: 13, padding: '11px 14px', marginBottom: 12, textAlign: 'center' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800, fontSize: 13 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Check size={14} />{isAr ? 'لقد سجّلت حضورك اليوم!' : 'You already checked in today!'}</span></span>
                </div>
                {todayCheckin.data.aiResponse && (
                  <div style={{ background: 'white', border: `1px solid #E2EAF4`, borderRadius: 14, padding: '14px', boxShadow: '0 2px 6px rgba(27,46,94,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                      <AppIcons.Robot size={18} />
                      <span style={{ color: NAVY, fontWeight: 800, fontSize: 13 }}>{isAr ? 'توصية مدربك' : "Coach's Recommendation"}</span>
                    </div>
                    <p style={{ color: '#1E293B', fontSize: 13, lineHeight: 1.7, margin: 0, direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{todayCheckin.data.aiResponse}</p>
                  </div>
                )}
              </div>
            ) : (
              <CheckInCard lang={lang as 'ar' | 'en'} isRTL={isRTL} profile={profile} stats={stats} onDone={() => utils.coach.getTodayCheckin.invalidate()} />
            )}
          </div>
        )}

        {/* Insights */}
        {activeSection === 'insights' && (
          <div style={{ paddingTop: 8, paddingBottom: 12 }}>
            <button
              onClick={async () => {
                setInsightsLoading(true);
                try {
                  await genInsightsMutation.mutateAsync({ lang: lang as 'ar' | 'en', context: { ...buildContext(), totalSessions: data.sessions.length, weightChange } });
                  utils.coach.getInsights.invalidate();
                } finally { setInsightsLoading(false); }
              }}
              disabled={insightsLoading}
              style={{
                width: '100%', padding: '12px',
                background: insightsLoading ? '#E2EAF4' : `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
                border: 'none', borderRadius: 13, cursor: insightsLoading ? 'not-allowed' : 'pointer',
                color: insightsLoading ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 13, marginBottom: 12,
                boxShadow: insightsLoading ? 'none' : `0 4px 14px rgba(27,46,94,0.25)`,
              }}
            >
              <span style={{display:'flex',alignItems:'center',gap:6}}>{insightsLoading ? <AppIcons.Spinner size={16} /> : <AppIcons.Brain size={16} />}{insightsLoading ? (isAr ? 'جاري التحليل...' : 'Analysing...') : (isAr ? 'توليد رؤى جديدة' : 'Generate New Insights')}</span>
            </button>
            {insightsQuery.isLoading && <div style={{ textAlign: 'center', padding: 18, color: '#64748B', fontSize: 13 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}
            {!insightsQuery.isLoading && (insightsQuery.data?.length ?? 0) === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ marginBottom: 10, display:"flex", justifyContent:"center" }}><AppIcons.Brain size={40} /></div>
                <p style={{ color: '#64748B', fontSize: 13 }}>{isAr ? 'لا توجد رؤى بعد. اضغط على الزر أعلاه لتوليد تحليل شخصي.' : 'No insights yet. Tap the button above to generate a personalised analysis.'}</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {insightsQuery.data?.map(ins => <InsightCard key={ins.id} type={ins.type} content={isAr ? ins.content : (ins.contentEn ?? ins.content)} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── FIXED BOTTOM: input bar (chat only) ── */}
      {activeSection === 'chat' && (
        <div style={{ background: 'white', borderTop: '1px solid #E2EAF4', padding: '10px 12px', flexShrink: 0, boxShadow: '0 -2px 10px rgba(27,46,94,0.08)' }}>
          {messages.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <button onClick={async () => { setMessages([]); try { await clearHistoryMutation.mutateAsync(); } catch { /* ignore */ } }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 11, cursor: 'pointer' }}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Trash size={14} />{isAr ? 'مسح المحادثة' : 'Clear chat'}</span>
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
              style={{
                flex: 1, background: '#F8FAFC', border: `1.5px solid #E2EAF4`, borderRadius: 22,
                padding: '11px 16px', color: '#1E293B', fontSize: 13, outline: 'none',
                direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left',
              }}
              disabled={isTyping}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: isTyping || !input.trim() ? '#E2EAF4' : `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
                border: 'none', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isTyping || !input.trim() ? 'none' : `0 3px 10px rgba(27,46,94,0.3)`,
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}>
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={isTyping || !input.trim() ? '#94A3B8' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes coachBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        input::placeholder { color: #94A3B8; }
      `}</style>
    </div>
  );
}
