// UserGuide — Prime Fit User Manual
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
// Clean, visual, bilingual (EN/AR) step-by-step guide

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const BG = '#F0F4F8';

interface Section {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  steps: {
    icon: string;
    en: string;
    ar: string;
  }[];
  tipEn?: string;
  tipAr?: string;
}

const sections: Section[] = [
  {
    id: 'start',
    icon: '🚀',
    titleEn: 'Getting Started',
    titleAr: 'البداية',
    steps: [
      { icon: '1️⃣', en: 'Open the app for the first time — a welcome screen will appear.', ar: 'افتحي التطبيق لأول مرة — ستظهر شاشة الترحيب.' },
      { icon: '2️⃣', en: 'Enter your name, age, height, current weight, and target weight.', ar: 'أدخلي اسمك، عمرك، طولك، وزنك الحالي، والوزن المستهدف.' },
      { icon: '3️⃣', en: 'Press "Start My Program" — your personalized dashboard is ready!', ar: 'اضغطي "Start My Program" — لوحة التحكم الخاصة بك جاهزة!' },
    ],
    tipEn: 'Your BMI is calculated automatically as you type.',
    tipAr: 'يتم حساب مؤشر كتلة الجسم (BMI) تلقائياً أثناء الإدخال.',
  },
  {
    id: 'workout',
    icon: '🏋️‍♀️',
    titleEn: 'Starting a Workout',
    titleAr: 'بدء التمرين',
    steps: [
      { icon: '👆', en: 'From the Home tab, choose the workout type you want (Lower Body, Upper Body, Cardio, etc.).', ar: 'من تبويب Home، اختاري نوع التمرين (الجزء السفلي، العلوي، كارديو...).' },
      { icon: '⏱', en: 'The check-in time is recorded automatically the moment you tap Start.', ar: 'يُسجَّل وقت الدخول تلقائياً فور الضغط على Start.' },
      { icon: '✅', en: 'Tick each exercise as you complete it — progress bar updates in real time.', ar: 'ضعي علامة ✓ على كل تمرين تنتهين منه — شريط التقدم يتحدث فوراً.' },
      { icon: '▶', en: 'Tap the play button next to any exercise to watch a YouTube tutorial.', ar: 'اضغطي على زر التشغيل بجانب أي تمرين لمشاهدة شرح على يوتيوب.' },
      { icon: '✏️', en: 'Edit sets, reps, or weight for any exercise using the pencil icon.', ar: 'عدّلي عدد الجولات، التكرارات، أو الوزن لأي تمرين بأيقونة القلم.' },
      { icon: '💾', en: 'When done, rate your mood & energy, add notes, then tap "Finish Session".', ar: 'عند الانتهاء، قيّمي مزاجك وطاقتك، أضيفي ملاحظات، ثم اضغطي "Finish Session".' },
    ],
    tipEn: 'You can add extra exercises mid-session using the "+ Add Exercise" button.',
    tipAr: 'يمكنك إضافة تمارين إضافية أثناء الجلسة بزر "+ إضافة تمرين".',
  },
  {
    id: 'weight',
    icon: '⚖️',
    titleEn: 'Tracking Your Weight',
    titleAr: 'تتبع الوزن',
    steps: [
      { icon: '📊', en: 'Go to the Stats tab to see your weight tracking section.', ar: 'انتقلي إلى تبويب Stats لرؤية قسم تتبع الوزن.' },
      { icon: '✍️', en: 'Type your current weight in the input field and press "Log" (or Enter).', ar: 'اكتبي وزنك الحالي في الحقل واضغطي "Log" أو Enter.' },
      { icon: '📈', en: 'A weight trend chart appears automatically once you have 2+ entries.', ar: 'يظهر مخطط منحنى الوزن تلقائياً عند تسجيل قراءتين أو أكثر.' },
      { icon: '🎯', en: 'The green dashed line on the chart shows your target weight.', ar: 'الخط الأخضر المتقطع في المخطط يُظهر وزنك المستهدف.' },
    ],
    tipEn: 'Log your weight once a day, ideally in the morning before eating.',
    tipAr: 'سجّلي وزنك مرة يومياً، ويُفضَّل صباحاً قبل الأكل.',
  },
  {
    id: 'profile',
    icon: '⚙️',
    titleEn: 'Managing Your Profile',
    titleAr: 'إدارة الملف الشخصي',
    steps: [
      { icon: '👤', en: 'Go to the Profile tab to view your info and BMI.', ar: 'انتقلي إلى تبويب Profile لعرض معلوماتك ومؤشر BMI.' },
      { icon: '✏️', en: 'Tap "Edit Profile" to update your weight, age, height, or target.', ar: 'اضغطي "Edit Profile" لتحديث وزنك، عمرك، طولك، أو هدفك.' },
      { icon: '⚡', en: 'Tap the weight number directly on the card to update it instantly.', ar: 'اضغطي على رقم الوزن مباشرة في البطاقة لتحديثه فوراً.' },
      { icon: '🗑', en: 'Use "Reset Data" to clear all data and start fresh (cannot be undone).', ar: 'استخدمي "Reset Data" لمسح جميع البيانات والبدء من جديد (لا يمكن التراجع).' },
    ],
    tipEn: 'BMI and recommended program update automatically when you change your data.',
    tipAr: 'يتحدث BMI والبرنامج الموصى به تلقائياً عند تغيير بياناتك.',
  },
  {
    id: 'stats',
    icon: '📊',
    titleEn: 'Viewing Statistics',
    titleAr: 'عرض الإحصائيات',
    steps: [
      { icon: '🏆', en: 'Stats tab shows: total sessions, weekly streak, this week & month count.', ar: 'تبويب Stats يعرض: إجمالي الجلسات، الأيام المتتالية، عدد جلسات الأسبوع والشهر.' },
      { icon: '📋', en: '"Sessions by Type" bar shows which workouts you do most.', ar: 'شريط "Sessions by Type" يُظهر أكثر التمارين التي تمارسينها.' },
      { icon: '💾', en: 'Use "Export Sessions" or "Export Weight Log" to download your data as CSV.', ar: 'استخدمي "Export Sessions" أو "Export Weight Log" لتحميل بياناتك كملف CSV.' },
    ],
    tipEn: 'CSV files open in Excel, Google Sheets, or any spreadsheet app.',
    tipAr: 'ملفات CSV تُفتح في Excel أو Google Sheets أو أي تطبيق جداول.',
  },
  {
    id: 'history',
    icon: '📋',
    titleEn: 'Session History',
    titleAr: 'سجل الجلسات',
    steps: [
      { icon: '🗓', en: 'The History tab shows all your completed workout sessions.', ar: 'تبويب History يعرض جميع جلسات التمرين المكتملة.' },
      { icon: '🗑', en: 'Swipe or tap the delete icon to remove a session from history.', ar: 'اضغطي أيقونة الحذف لإزالة جلسة من السجل.' },
    ],
    tipEn: 'Each session card shows date, time, session type, and exercises completed.',
    tipAr: 'كل بطاقة جلسة تعرض التاريخ، الوقت، نوع التمرين، والتمارين المنجزة.',
  },
  {
    id: 'guide',
    icon: '📖',
    titleEn: 'Workout Guide',
    titleAr: 'الجدول الإرشادي',
    steps: [
      { icon: '📅', en: 'The Guide tab shows a full 8-week workout schedule.', ar: 'تبويب Guide يعرض جدول تمارين كامل لمدة 8 أسابيع.' },
      { icon: '▶', en: 'Each exercise has a YouTube link for a visual demonstration.', ar: 'كل تمرين يحتوي على رابط يوتيوب لشرح مرئي.' },
    ],
    tipEn: 'Use the Guide as a reference before starting each session.',
    tipAr: 'استخدمي الجدول الإرشادي كمرجع قبل بدء كل جلسة.',
  },
];

export default function UserGuide() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [openSection, setOpenSection] = useState<string | null>('start');

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        borderRadius: 20, padding: '20px 22px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${SKY}18` }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📘</div>
          <h2 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 900 }}>
            {isAr ? 'دليل المستخدم' : 'User Guide'}
          </h2>
          <p style={{ margin: '6px 0 0', color: SKY_LIGHT, fontSize: 13 }}>
            {isAr
              ? 'كل ما تحتاجين معرفته لاستخدام Prime Fit بكفاءة'
              : 'Everything you need to use Prime Fit effectively'}
          </p>
        </div>
      </div>

      {/* Quick Nav Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 700, fontSize: 12,
              background: openSection === s.id ? NAVY : 'white',
              color: openSection === s.id ? 'white' : NAVY,
              boxShadow: openSection === s.id ? `0 4px 12px ${NAVY}33` : '0 2px 6px rgba(27,46,94,0.08)',
              transition: 'all 0.2s',
              border: `1.5px solid ${openSection === s.id ? NAVY : SKY_LIGHT}`,
            }}
          >
            {s.icon} {isAr ? s.titleAr : s.titleEn}
          </button>
        ))}
      </div>

      {/* Sections */}
      {sections.map(section => (
        <div key={section.id} style={{ marginBottom: 10 }}>
          {/* Section Header (clickable) */}
          <button
            onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            style={{
              width: '100%', textAlign: isAr ? 'right' : 'left',
              background: openSection === section.id
                ? `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`
                : 'white',
              border: `1.5px solid ${openSection === section.id ? NAVY : SKY_LIGHT}`,
              borderRadius: openSection === section.id ? '14px 14px 0 0' : 14,
              padding: '14px 18px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(27,46,94,0.07)',
              transition: 'all 0.25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{section.icon}</span>
              <span style={{
                fontWeight: 800, fontSize: 15,
                color: openSection === section.id ? 'white' : NAVY,
              }}>
                {isAr ? section.titleAr : section.titleEn}
              </span>
            </div>
            <span style={{
              fontSize: 16, color: openSection === section.id ? SKY_LIGHT : '#7A9BB5',
              transform: openSection === section.id ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s',
              display: 'inline-block',
            }}>▼</span>
          </button>

          {/* Section Content */}
          {openSection === section.id && (
            <div style={{
              background: 'white',
              border: `1.5px solid ${NAVY}`,
              borderTopWidth: 0,
              borderRadius: '0 0 14px 14px',
              padding: '16px 18px',
              boxShadow: '0 4px 12px rgba(27,46,94,0.08)',
            }}>
              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {section.steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 14px',
                    background: BG,
                    borderRadius: 10,
                    border: `1px solid ${SKY_LIGHT}55`,
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }}>{step.icon}</span>
                    <p style={{ margin: 0, fontSize: 13, color: '#2D3F5E', lineHeight: 1.6 }}>
                      {isAr ? step.ar : step.en}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tip */}
              {(section.tipEn || section.tipAr) && (
                <div style={{
                  marginTop: 14, padding: '10px 14px',
                  background: `${SKY_LIGHT}30`,
                  borderRadius: 10,
                  border: `1px solid ${SKY}55`,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                  <p style={{ margin: 0, fontSize: 12, color: NAVY, fontWeight: 600, lineHeight: 1.5 }}>
                    {isAr ? section.tipAr : section.tipEn}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Footer Note */}
      <div style={{
        marginTop: 20, padding: '14px 18px',
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        borderRadius: 14, textAlign: 'center',
      }}>
        <p style={{ margin: 0, color: SKY_LIGHT, fontSize: 12 }}>
          {isAr
            ? '🌟 Prime Fit — مصمم خصيصاً لمساعدتك في الوصول لهدفك بثقة وانتظام'
            : '🌟 Prime Fit — Designed to help you reach your goal with confidence and consistency'}
        </p>
        <p style={{ margin: '6px 0 0', color: `${SKY_LIGHT}88`, fontSize: 10 }}>
          Made by <strong style={{ color: SKY_LIGHT }}>Prime Printing Co.</strong> © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
