/**
 * My Coach — AI Personal Trainer
 * Design: Prime Fit dark navy + neon sky-blue accent
 * Features: Dashboard stats, daily check-in, AI chat, insights
 * Bilingual: Arabic RTL + English
 */

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useGymTracker } from '@/hooks/useGymTracker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

// ── Brand colours ──────────────────────────────────────────────────────────────
const NAVY      = '#0D1B3E';
const NAVY2     = '#1B2E5E';
const SKY       = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const NEON      = '#00D4FF';
const ORANGE    = '#E05A00';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; content: string; id: string }

// ── Quick-action prompts ───────────────────────────────────────────────────────
const QUICK_ACTIONS = {
  ar: [
    { icon: '📊', label: 'حلّل تقدمي', prompt: 'حلّل تقدمي في التمارين والوزن وأعطني ملاحظاتك' },
    { icon: '🏋️', label: 'ماذا أتمرن اليوم؟', prompt: 'ما هو التمرين المناسب لي اليوم؟' },
    { icon: '⚖️', label: 'لماذا لا يتغير وزني؟', prompt: 'لماذا لا يتغير وزني رغم التمرين؟' },
    { icon: '💪', label: 'حفّزني', prompt: 'أحتاج إلى تحفيز لمواصلة رحلتي الرياضية' },
    { icon: '🧘', label: 'تمرين تعافٍ', prompt: 'اقترح لي تمرين تعافٍ خفيف لليوم' },
  ],
  en: [
    { icon: '📊', label: 'Analyse my progress', prompt: 'Analyse my workout and weight progress and give me feedback' },
    { icon: '🏋️', label: 'What to train today?', prompt: 'What workout is best for me today?' },
    { icon: '⚖️', label: 'Why is my weight stuck?', prompt: 'Why is my weight not changing despite working out?' },
    { icon: '💪', label: 'Motivate me', prompt: 'I need motivation to continue my fitness journey' },
    { icon: '🧘', label: 'Recovery workout', prompt: 'Suggest a light recovery workout for today' },
  ],
};

// ── Emoji rating helper ────────────────────────────────────────────────────────
const RATING_EMOJIS = ['😞', '😕', '😐', '😊', '🤩'];

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '14px 10px',
      textAlign: 'center',
      border: `1px solid rgba(123,184,212,0.2)`,
      flex: 1,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ color: SKY_LIGHT, fontSize: 11, marginTop: 4, opacity: 0.8 }}>{label}</div>
    </div>
  );
}

// ── Insight card ───────────────────────────────────────────────────────────────
const INSIGHT_COLORS: Record<string, string> = {
  progress:       '#10B981',
  warning:        '#F59E0B',
  motivation:     NEON,
  recommendation: SKY,
};
const INSIGHT_ICONS: Record<string, string> = {
  progress: '📈', warning: '⚠️', motivation: '💡', recommendation: '🎯',
};

function InsightCard({ type, content }: { type: string; content: string }) {
  const color = INSIGHT_COLORS[type] ?? SKY;
  const icon  = INSIGHT_ICONS[type]  ?? '💬';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <p style={{ margin: 0, color: '#E2E8F0', fontSize: 13, lineHeight: 1.5 }}>{content}</p>
    </div>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────────────────
function ChatBubble({ msg, isRTL }: { msg: ChatMsg; isRTL: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
      marginBottom: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${NEON}, ${SKY})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
          marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser
          ? `linear-gradient(135deg, ${NAVY2}, #243B6E)`
          : 'rgba(255,255,255,0.09)',
        borderRadius: isUser
          ? (isRTL ? '18px 18px 18px 4px' : '18px 18px 4px 18px')
          : (isRTL ? '18px 18px 4px 18px' : '18px 18px 18px 4px'),
        padding: '10px 14px',
        border: isUser ? `1px solid ${SKY}33` : `1px solid rgba(255,255,255,0.1)`,
      }}>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.6,
          color: isUser ? SKY_LIGHT : '#E2E8F0',
          whiteSpace: 'pre-wrap',
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        }}>{msg.content}</p>
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${NEON}, ${SKY})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>🤖</div>
      <div style={{
        background: 'rgba(255,255,255,0.09)',
        borderRadius: '18px 18px 18px 4px',
        padding: '10px 16px',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: NEON,
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Daily Check-in Card ────────────────────────────────────────────────────────
function CheckInCard({
  lang, isRTL, profile, stats,
  onDone,
}: {
  lang: 'ar' | 'en';
  isRTL: boolean;
  profile: any;
  stats: any;
  onDone: (response: string) => void;
}) {
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
        context: {
          name: profile.name,
          currentWeight: profile.currentWeight,
          targetWeight: profile.targetWeight,
          streak: stats.streak,
        },
      });
      setAiResp(result.aiResponse);
      setDone(true);
      onDone(result.aiResponse);
    } catch {
      setAiResp(isAr ? 'حدث خطأ. حاول مجدداً.' : 'Something went wrong. Please try again.');
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const RatingRow = ({
    label, value, onChange,
  }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: SKY_LIGHT, fontSize: 13, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
        {RATING_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            style={{
              width: 44, height: 44, borderRadius: 12,
              border: value === i + 1 ? `2px solid ${NEON}` : '2px solid rgba(255,255,255,0.1)',
              background: value === i + 1 ? `${NEON}22` : 'rgba(255,255,255,0.05)',
              fontSize: 22, cursor: 'pointer',
              transition: 'all 0.15s',
              transform: value === i + 1 ? 'scale(1.15)' : 'scale(1)',
            }}
          >{emoji}</button>
        ))}
      </div>
    </div>
  );

  if (done && aiResp) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${NAVY2}CC, #243B6ECC)`,
        borderRadius: 18, padding: '20px 18px',
        border: `1px solid ${NEON}44`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <span style={{ color: NEON, fontWeight: 800, fontSize: 15 }}>
            {isAr ? 'رأي مدربك' : 'Your Coach Says'}
          </span>
        </div>
        <p style={{
          color: '#E2E8F0', fontSize: 14, lineHeight: 1.7, margin: 0,
          direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left',
        }}>{aiResp}</p>
      </div>
    );
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${NAVY2}CC, #243B6ECC)`,
      borderRadius: 18, padding: '20px 18px',
      border: `1px solid ${SKY}33`,
    }}>
      <h3 style={{
        color: 'white', fontWeight: 900, fontSize: 16, margin: '0 0 4px',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {isAr ? '☀️ تسجيل الحضور اليومي' : '☀️ Daily Check-In'}
      </h3>
      <p style={{
        color: SKY_LIGHT, fontSize: 12, margin: '0 0 16px',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {isAr ? 'أخبر مدربك كيف تشعر اليوم' : 'Tell your coach how you feel today'}
      </p>

      <RatingRow label={isAr ? '😊 كيف تشعر؟' : '😊 How do you feel?'} value={feeling} onChange={setFeeling} />
      <RatingRow label={isAr ? '⚡ مستوى الطاقة' : '⚡ Energy level'} value={energy} onChange={setEnergy} />
      <RatingRow label={isAr ? '😴 جودة النوم' : '😴 Sleep quality'} value={sleep} onChange={setSleep} />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '12px',
          background: loading ? '#334' : `linear-gradient(135deg, ${NEON}, ${SKY})`,
          color: NAVY, fontWeight: 900, fontSize: 14,
          border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 4, transition: 'all 0.2s',
        }}
      >
        {loading
          ? (isAr ? '⏳ جاري التحليل...' : '⏳ Analysing...')
          : (isAr ? '🚀 احصل على توصية مدربك' : '🚀 Get Coach Recommendation')}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MyCoach() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, stats, data } = useGymTracker();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  const [activeSection, setActiveSection] = useState<'chat' | 'checkin' | 'insights'>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // tRPC queries
  const historyQuery   = trpc.coach.getHistory.useQuery({ limit: 40 }, { enabled: isAuthenticated });
  const todayCheckin   = trpc.coach.getTodayCheckin.useQuery(undefined, { enabled: isAuthenticated });
  const insightsQuery  = trpc.coach.getInsights.useQuery({ limit: 8 }, { enabled: isAuthenticated });
  const utils          = trpc.useUtils();

  const chatMutation       = trpc.coach.chat.useMutation();
  const genInsightsMutation = trpc.coach.generateInsights.useMutation();

  // Load history into local state on mount
  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(
        historyQuery.data.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          id: String(m.id),
        }))
      );
    }
  }, [historyQuery.data]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Weekly completion calculation
  const weeklyCompletion = (() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekSessions = data.sessions.filter(s => new Date(s.date) >= weekStart).length;
    return Math.min(100, Math.round((weekSessions / 5) * 100));
  })();

  const weightChange = (() => {
    if (!profile.startWeight || !profile.currentWeight) return 0;
    return Math.round((profile.currentWeight - profile.startWeight) * 10) / 10;
  })();

  const buildContext = () => ({
    name: profile.name,
    currentWeight: profile.currentWeight,
    targetWeight: profile.targetWeight,
    streak: stats.streak,
    weeklyCompletion,
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMsg = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await chatMutation.mutateAsync({
        message: text,
        lang: lang as 'ar' | 'en',
        context: buildContext(),
      });
      const aiMsg: ChatMsg = {
        role: 'assistant',
        content: result.content,
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAr ? 'عذراً، حدث خطأ. حاول مجدداً.' : 'Sorry, something went wrong. Please try again.',
        id: (Date.now() + 1).toString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    try {
      await genInsightsMutation.mutateAsync({
        lang: lang as 'ar' | 'en',
        context: {
          ...buildContext(),
          totalSessions: data.sessions.length,
          weightChange,
        },
      });
      utils.coach.getInsights.invalidate();
    } finally {
      setInsightsLoading(false);
    }
  };

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: SKY, fontSize: 14 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: NAVY,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
        <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: '0 0 8px' }}>
          {isAr ? 'مدربك الشخصي' : 'Your Personal Coach'}
        </h2>
        <p style={{ color: SKY_LIGHT, fontSize: 14, margin: '0 0 24px' }}>
          {isAr ? 'سجّل الدخول للوصول إلى مدربك الذكي' : 'Sign in to access your AI coach'}
        </p>
        <a
          href={getLoginUrl()}
          style={{
            background: `linear-gradient(135deg, ${NEON}, ${SKY})`,
            color: NAVY, fontWeight: 900, fontSize: 15,
            padding: '12px 32px', borderRadius: 14, textDecoration: 'none',
          }}
        >
          {isAr ? 'تسجيل الدخول' : 'Sign In'}
        </a>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${NAVY} 0%, #0A1428 100%)`,
      fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
      paddingBottom: 90,
    }}>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        padding: '16px 20px 12px',
        borderBottom: `1px solid ${SKY}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, ${NEON}33, ${SKY}33)`,
            border: `2px solid ${NEON}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🤖</div>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>
              {isAr ? 'مدربي' : 'My Coach'}
            </h1>
            <p style={{ margin: 0, color: NEON, fontSize: 11, marginTop: 2 }}>
              {isAr ? `مرحباً ${profile.name || ''}! كيف يمكنني مساعدتك؟` : `Hi ${profile.name || ''}! How can I help?`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Dashboard ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard icon="🔥" value={stats.streak} label={isAr ? 'يوم متواصل' : 'Day Streak'} color={ORANGE} />
          <StatCard icon="✅" value={`${weeklyCompletion}%`} label={isAr ? 'إنجاز أسبوعي' : 'Weekly'} color="#10B981" />
          <StatCard
            icon={weightChange <= 0 ? '📉' : '📈'}
            value={`${weightChange > 0 ? '+' : ''}${weightChange} kg`}
            label={isAr ? 'تغيير الوزن' : 'Weight Change'}
            color={weightChange <= 0 ? '#10B981' : '#F59E0B'}
          />
          <StatCard icon="🏋️" value={data.sessions.length} label={isAr ? 'جلسة' : 'Sessions'} color={NEON} />
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0' }}>
        {([
          { id: 'chat',     icon: '💬', label: isAr ? 'المحادثة' : 'Chat' },
          { id: 'checkin',  icon: '☀️', label: isAr ? 'تسجيل الحضور' : 'Check-In' },
          { id: 'insights', icon: '🧠', label: isAr ? 'الرؤى' : 'Insights' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              flex: 1, padding: '9px 4px',
              background: activeSection === tab.id
                ? `linear-gradient(135deg, ${NEON}22, ${SKY}22)`
                : 'rgba(255,255,255,0.05)',
              border: activeSection === tab.id ? `1px solid ${NEON}66` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, cursor: 'pointer',
              color: activeSection === tab.id ? NEON : SKY_LIGHT,
              fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '14px 16px 0' }}>

        {/* Chat Section */}
        {activeSection === 'chat' && (
          <div>
            {/* Quick actions */}
            {messages.length === 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{
                  color: SKY_LIGHT, fontSize: 12, margin: '0 0 8px',
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {isAr ? '⚡ أسئلة سريعة' : '⚡ Quick Actions'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_ACTIONS[isAr ? 'ar' : 'en'].map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qa.prompt)}
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: `1px solid ${SKY}33`,
                        borderRadius: 20, padding: '7px 12px',
                        color: SKY_LIGHT, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{qa.icon}</span> {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16, padding: '14px',
              minHeight: 200, maxHeight: 380, overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 10,
            }}>
              {messages.length === 0 && !isTyping && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
                  <p style={{ color: SKY_LIGHT, fontSize: 13 }}>
                    {isAr
                      ? `مرحباً ${profile.name || ''}! أنا مدربك الشخصي. اسألني أي شيء عن تمارينك.`
                      : `Hi ${profile.name || ''}! I'm your personal coach. Ask me anything about your workouts.`}
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} isRTL={isRTL} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${SKY}44`, borderRadius: 14,
                  padding: '11px 14px', color: 'white', fontSize: 13,
                  outline: 'none',
                  direction: isRTL ? 'rtl' : 'ltr',
                  textAlign: isRTL ? 'right' : 'left',
                }}
                disabled={isTyping}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isTyping || !input.trim()
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${NEON}, ${SKY})`,
                  border: 'none', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 18, flexShrink: 0,
                }}
              >
                {isRTL ? '◀' : '▶'}
              </button>
            </div>

            {/* Clear chat */}
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  trpc.coach.clearHistory.useMutation;
                }}
                style={{
                  marginTop: 8, background: 'none', border: 'none',
                  color: '#64748B', fontSize: 11, cursor: 'pointer',
                  display: 'block', width: '100%', textAlign: 'center',
                }}
              >
                {isAr ? '🗑 مسح المحادثة' : '🗑 Clear chat'}
              </button>
            )}
          </div>
        )}

        {/* Check-in Section */}
        {activeSection === 'checkin' && (
          <div>
            {todayCheckin.data ? (
              <div>
                <div style={{
                  background: `${NEON}11`, border: `1px solid ${NEON}44`,
                  borderRadius: 14, padding: '12px 16px', marginBottom: 14,
                  textAlign: 'center',
                }}>
                  <span style={{ color: NEON, fontWeight: 800, fontSize: 14 }}>
                    {isAr ? '✅ لقد سجّلت حضورك اليوم!' : '✅ You already checked in today!'}
                  </span>
                </div>
                {todayCheckin.data.aiResponse && (
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${SKY}33`,
                    borderRadius: 16, padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>🤖</span>
                      <span style={{ color: NEON, fontWeight: 800, fontSize: 14 }}>
                        {isAr ? 'توصية مدربك' : "Coach's Recommendation"}
                      </span>
                    </div>
                    <p style={{
                      color: '#E2E8F0', fontSize: 13, lineHeight: 1.7, margin: 0,
                      direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left',
                    }}>
                      {todayCheckin.data.aiResponse}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <CheckInCard
                lang={lang as 'ar' | 'en'}
                isRTL={isRTL}
                profile={profile}
                stats={stats}
                onDone={() => {
                  utils.coach.getTodayCheckin.invalidate();
                }}
              />
            )}
          </div>
        )}

        {/* Insights Section */}
        {activeSection === 'insights' && (
          <div>
            <button
              onClick={handleGenerateInsights}
              disabled={insightsLoading}
              style={{
                width: '100%', padding: '12px',
                background: insightsLoading
                  ? 'rgba(255,255,255,0.1)'
                  : `linear-gradient(135deg, ${NEON}22, ${SKY}22)`,
                border: `1px solid ${NEON}44`,
                borderRadius: 14, cursor: insightsLoading ? 'not-allowed' : 'pointer',
                color: NEON, fontWeight: 800, fontSize: 14,
                marginBottom: 14, transition: 'all 0.2s',
              }}
            >
              {insightsLoading
                ? (isAr ? '⏳ جاري التحليل...' : '⏳ Analysing...')
                : (isAr ? '🧠 توليد رؤى جديدة' : '🧠 Generate New Insights')}
            </button>

            {insightsQuery.isLoading && (
              <div style={{ textAlign: 'center', padding: 20, color: SKY_LIGHT, fontSize: 13 }}>
                {isAr ? 'جاري التحميل...' : 'Loading...'}
              </div>
            )}

            {!insightsQuery.isLoading && (insightsQuery.data?.length ?? 0) === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🧠</div>
                <p style={{ color: SKY_LIGHT, fontSize: 13 }}>
                  {isAr
                    ? 'لا توجد رؤى بعد. اضغط على الزر أعلاه لتوليد تحليل شخصي.'
                    : 'No insights yet. Tap the button above to generate a personalised analysis.'}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insightsQuery.data?.map(ins => (
                <InsightCard
                  key={ins.id}
                  type={ins.type}
                  content={isAr ? ins.content : (ins.contentEn ?? ins.content)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        input::placeholder { color: rgba(168,212,232,0.5); }
      `}</style>
    </div>
  );
}
