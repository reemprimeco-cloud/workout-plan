// UserGuide — Prime Fit User Manual
// Design: Prime Fit — Navy Blue #1B2E5E + Sky Blue #7BB8D4
// Clean, visual, bilingual (EN/AR) step-by-step guide
import { AppIcons } from './AppIcons';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';

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
    icon: 'rocket',
    titleEn: 'Getting Started',
    titleAr: 'البداية',
    steps: [
      { icon: '1', en: 'Open the app — sign in with Google or create an account with email & password.', ar: 'افتح التطبيق — سجّل الدخول عبر Google أو أنشئ حساباً بالبريد الإلكتروني وكلمة المرور.' },
      { icon: '2', en: 'Complete your profile: enter your name, age, height, current weight, target weight, and gender.', ar: 'أكمل ملفك الشخصي: أدخل اسمك، عمرك، طولك، وزنك الحالي، الوزن المستهدف، والجنس.' },
      { icon: '3', en: 'Press "Start My Program" — your personalized dashboard is ready!', ar: 'اضغط "Start My Program" — لوحة التحكم الخاصة بك جاهزة!' },
      { icon: '4', en: 'Your data is saved to the cloud — sign in on any device to restore everything.', ar: 'بياناتك محفوظة في السحابة — سجّل الدخول من أي جهاز لاستعادة كل شيء.' },
    ],
    tipEn: 'Your BMI and recommended program are calculated automatically based on your profile.',
    tipAr: 'يتم حساب مؤشر BMI والبرنامج الموصى به تلقائياً بناءً على ملفك الشخصي.',
  },
  {
    id: 'account',
    icon: 'profile',
    titleEn: 'Account & Sign In',
    titleAr: 'الحساب وتسجيل الدخول',
    steps: [
      { icon: 'email', en: 'Sign up with your email and password — or use Google Sign-In for one-tap access.', ar: 'سجّل بالبريد الإلكتروني وكلمة المرور — أو استخدم تسجيل الدخول عبر Google.' },
      { icon: 'key', en: 'Forgot your password? Tap "Forgot Password" on the login screen to receive a reset email.', ar: 'نسيت كلمة المرور؟ اضغط "Forgot Password" في شاشة الدخول لاستلام رسالة إعادة تعيين.' },
      { icon: '🔄', en: 'Sign in on a new device — all your sessions, weight logs, and profile sync automatically.', ar: 'سجّل الدخول على جهاز جديد — جميع جلساتك وسجلات الوزن وملفك تُزامَن تلقائياً.' },
      { icon: '🚪', en: 'To log out, go to Profile tab and tap the Logout button.', ar: 'لتسجيل الخروج، انتقل إلى تبويب Profile واضغط زر تسجيل الخروج.' },
    ],
    tipEn: 'If you have an existing subscription, it is automatically linked to your account by email.',
    tipAr: 'إذا كان لديك اشتراك موجود، يتم ربطه تلقائياً بحسابك عبر البريد الإلكتروني.',
  },
  {
    id: 'subscription',
    icon: 'card',
    titleEn: 'Subscription & Access',
    titleAr: 'الاشتراك والوصول',
    steps: [
      { icon: 'star', en: 'Prime Fit offers monthly and yearly subscription plans for full access.', ar: 'يقدم Prime Fit خطط اشتراك شهرية وسنوية للوصول الكامل.' },
      { icon: '📋', en: 'View your subscription status, plan, and expiry date in the Profile tab.', ar: 'اعرض حالة اشتراكك، الخطة، وتاريخ الانتهاء في تبويب Profile.' },
      { icon: 'message', en: 'To subscribe or renew, contact support via the WhatsApp button on the login screen.', ar: 'للاشتراك أو التجديد، تواصل مع الدعم عبر زر WhatsApp في شاشة الدخول.' },
    ],
    tipEn: 'Your subscription status is shown with a color indicator: green (active), orange (expiring soon), red (expired).',
    tipAr: 'تظهر حالة اشتراكك بمؤشر لوني: أخضر (نشط)، برتقالي (ينتهي قريباً)، أحمر (منتهي).',
  },
  {
    id: 'workout',
    icon: 'workout',
    titleEn: 'Starting a Workout',
    titleAr: 'بدء التمرين',
    steps: [
      { icon: 'pointer', en: 'From the Home tab, choose the workout type you want (Lower Body, Upper Body, Cardio, etc.).', ar: 'من تبويب Home، اختر نوع التمرين (الجزء السفلي، العلوي، كارديو...).' },
      { icon: '⏱', en: 'The check-in time is recorded automatically the moment you tap Start.', ar: 'يُسجَّل وقت الدخول تلقائياً فور الضغط على Start.' },
      { icon: '✅', en: 'Tick each exercise as you complete it — progress bar updates in real time.', ar: 'ضع علامة ✓ على كل تمرين تنتهي منه — شريط التقدم يتحدث فوراً.' },
      { icon: '▶', en: 'Tap the play button next to any exercise to watch a YouTube tutorial.', ar: 'اضغط على زر التشغيل بجانب أي تمرين لمشاهدة شرح على يوتيوب.' },
      { icon: '✏️', en: 'Edit sets, reps, or weight for any exercise using the pencil icon.', ar: 'عدّل عدد الجولات، التكرارات، أو الوزن لأي تمرين بأيقونة القلم.' },
      { icon: '💾', en: 'When done, rate your mood & energy, add notes, then tap "Finish Session".', ar: 'عند الانتهاء، قيّم مزاجك وطاقتك، أضف ملاحظات، ثم اضغط "Finish Session".' },
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
      { icon: 'stats', en: 'Go to the Stats tab to see your weight tracking section.', ar: 'انتقل إلى تبويب Stats لرؤية قسم تتبع الوزن.' },
      { icon: 'edit', en: 'Type your current weight in the input field and press "Log" (or Enter).', ar: 'اكتب وزنك الحالي في الحقل واضغط "Log" أو Enter.' },
      { icon: 'chart', en: 'A weight trend chart appears automatically once you have 2+ entries.', ar: 'يظهر مخطط منحنى الوزن تلقائياً عند تسجيل قراءتين أو أكثر.' },
      { icon: 'target', en: 'The green dashed line on the chart shows your target weight.', ar: 'الخط الأخضر المتقطع في المخطط يُظهر وزنك المستهدف.' },
      { icon: 'cloud', en: 'Weight logs are synced to the cloud — available on all your devices.', ar: 'سجلات الوزن تُزامَن مع السحابة — متاحة على جميع أجهزتك.' },
    ],
    tipEn: 'Log your weight once a day, ideally in the morning before eating.',
    tipAr: 'سجّل وزنك مرة يومياً، ويُفضَّل صباحاً قبل الأكل.',
  },
  {
    id: 'profile',
    icon: 'settings',
    titleEn: 'Managing Your Profile',
    titleAr: 'إدارة الملف الشخصي',
    steps: [
      { icon: 'profile', en: 'Go to the Profile tab to view your info, BMI, and subscription status.', ar: 'انتقل إلى تبويب Profile لعرض معلوماتك، BMI، وحالة الاشتراك.' },
      { icon: '✏️', en: 'Tap "Edit Profile" to update your weight, age, height, or target.', ar: 'اضغط "Edit Profile" لتحديث وزنك، عمرك، طولك، أو هدفك.' },
      { icon: '⚡', en: 'Tap the weight number directly on the card to update it instantly.', ar: 'اضغط على رقم الوزن مباشرة في البطاقة لتحديثه فوراً.' },
      { icon: 'card', en: 'The subscription card shows your plan, expiry date, and days remaining.', ar: 'بطاقة الاشتراك تعرض خطتك، تاريخ الانتهاء، والأيام المتبقية.' },
      { icon: '🗑', en: 'Use "Reset Data" to clear all local data and start fresh (cannot be undone).', ar: 'استخدم "Reset Data" لمسح جميع البيانات المحلية والبدء من جديد (لا يمكن التراجع).' },
    ],
    tipEn: 'BMI and recommended program update automatically when you change your data.',
    tipAr: 'يتحدث BMI والبرنامج الموصى به تلقائياً عند تغيير بياناتك.',
  },
  {
    id: 'stats',
    icon: 'stats',
    titleEn: 'Viewing Statistics',
    titleAr: 'عرض الإحصائيات',
    steps: [
      { icon: 'trophy', en: 'Stats tab shows: total sessions, weekly streak, this week & month count.', ar: 'تبويب Stats يعرض: إجمالي الجلسات، الأيام المتتالية، عدد جلسات الأسبوع والشهر.' },
      { icon: '📋', en: '"Sessions by Type" bar shows which workouts you do most.', ar: 'شريط "Sessions by Type" يُظهر أكثر التمارين التي تمارسها.' },
      { icon: '💾', en: 'Use "Export Sessions" or "Export Weight Log" to download your data as CSV.', ar: 'استخدم "Export Sessions" أو "Export Weight Log" لتحميل بياناتك كملف CSV.' },
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
      { icon: 'cloud', en: 'Sessions are synced to the cloud — sign in on any device to see your full history.', ar: 'الجلسات تُزامَن مع السحابة — سجّل الدخول من أي جهاز لرؤية سجلك الكامل.' },
      { icon: '🗑', en: 'Tap the delete icon to remove a session from history.', ar: 'اضغط أيقونة الحذف لإزالة جلسة من السجل.' },
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
      { icon: 'calendar', en: 'The Guide tab shows a full 8-week workout schedule tailored to your gender.', ar: 'تبويب Guide يعرض جدول تمارين كامل لمدة 8 أسابيع مُخصَّص لجنسك.' },
      { icon: '▶', en: 'Each exercise has a YouTube link for a visual demonstration.', ar: 'كل تمرين يحتوي على رابط يوتيوب لشرح مرئي.' },
    ],
    tipEn: 'Use the Guide as a reference before starting each session.',
    tipAr: 'استخدم الجدول الإرشادي كمرجع قبل بدء كل جلسة.',
  },
  {
    id: 'exercises',
    icon: 'workout',
    titleEn: 'Exercise Library',
    titleAr: 'مكتبة التمارين',
    steps: [
      { icon: '🔍', en: 'The Exercises tab shows the full exercise library organized by muscle group.', ar: 'تبويب Exercises يعرض مكتبة التمارين الكاملة مُنظَّمة حسب مجموعة العضلات.' },
      { icon: '▶', en: 'Tap any exercise to see sets, reps, and a YouTube demonstration link.', ar: 'اضغط على أي تمرين لرؤية الجولات، التكرارات، ورابط شرح يوتيوب.' },
      { icon: '👫', en: 'The library shows exercises for your gender (men\'s or women\'s program).', ar: 'تعرض المكتبة تمارين مناسبة لجنسك (برنامج الرجال أو النساء).' },
    ],
    tipEn: 'Browse the library before your workout to plan which exercises to focus on.',
    tipAr: 'تصفح المكتبة قبل تمرينك لتخطيط التمارين التي ستركز عليها.',
  },
  {
    id: 'sync',
    icon: 'cloud',
    titleEn: 'Cross-Device Sync',
    titleAr: 'المزامنة عبر الأجهزة',
    steps: [
      { icon: 'mobile', en: 'All your data (sessions, weight logs, profile) is saved to the cloud automatically.', ar: 'جميع بياناتك (الجلسات، سجلات الوزن، الملف الشخصي) تُحفظ في السحابة تلقائياً.' },
      { icon: '💻', en: 'Sign in on any device (phone, tablet, computer) to access your full history.', ar: 'سجّل الدخول من أي جهاز (هاتف، تابلت، كمبيوتر) للوصول إلى سجلك الكامل.' },
      { icon: '🔄', en: 'Data syncs in the background — no manual backup needed.', ar: 'تتم المزامنة في الخلفية — لا حاجة لنسخ احتياطي يدوي.' },
      { icon: '⚡', en: 'First login on a new device imports all existing data automatically.', ar: 'أول تسجيل دخول على جهاز جديد يستورد جميع البيانات الموجودة تلقائياً.' },
    ],
    tipEn: 'Make sure you are signed in to benefit from cross-device sync.',
    tipAr: 'تأكد من تسجيل الدخول للاستفادة من المزامنة عبر الأجهزة.',
  },
  {
    id: 'support',
    icon: 'message',
    titleEn: 'Support & Help',
    titleAr: 'الدعم والمساعدة',
    steps: [
      { icon: 'message', en: 'Need help? Tap "Need Help? 💬" on the login screen to open WhatsApp support.', ar: 'تحتاج مساعدة؟ اضغط "Need Help? 💬" في شاشة الدخول لفتح دعم WhatsApp.' },
      { icon: 'phone', en: 'WhatsApp support: +965 6506 8000', ar: 'دعم WhatsApp: 96565068000+' },
      { icon: 'lock', en: 'Your data is private and secure — we never share your personal information.', ar: 'بياناتك خاصة وآمنة — لا نشارك معلوماتك الشخصية أبداً.' },
    ],
    tipEn: 'For subscription inquiries or technical issues, WhatsApp support is the fastest way to get help.',
    tipAr: 'لاستفسارات الاشتراك أو المشاكل التقنية، دعم WhatsApp هو أسرع طريقة للحصول على المساعدة.',
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
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><AppIcons.Clipboard size={32} /></div>
          <h2 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 900 }}>
            {isAr ? 'دليل المستخدم' : 'User Guide'}
          </h2>
          <p style={{ margin: '6px 0 0', color: SKY_LIGHT, fontSize: 13 }}>
            {isAr
              ? 'كل ما تحتاج معرفته لاستخدام Prime Fit بكفاءة'
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
              background: openSection === s.id ? NAVY : 'white',
              color: openSection === s.id ? 'white' : NAVY,
              border: `1.5px solid ${openSection === s.id ? NAVY : SKY_LIGHT}`,
              fontSize: 12, fontWeight: 700,
              fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {s.icon} {isAr ? s.titleAr : s.titleEn}
          </button>
        ))}
      </div>

      {/* Sections */}
      {sections.map(section => (
        <div key={section.id} style={{ marginBottom: 12 }}>
          {/* Section Header */}
          <button
            onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            style={{
              width: '100%', textAlign: isAr ? 'right' : 'left',
              background: openSection === section.id
                ? `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`
                : 'white',
              border: `1.5px solid ${openSection === section.id ? NAVY : SKY_LIGHT}`,
              borderRadius: openSection === section.id ? '14px 14px 0 0' : 14,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{section.icon}</span>
              <span style={{
                fontWeight: 800, fontSize: 15,
                color: openSection === section.id ? 'white' : NAVY,
                fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
              }}>
                {isAr ? section.titleAr : section.titleEn}
              </span>
            </div>
            <span style={{ color: openSection === section.id ? SKY_LIGHT : '#94A3B8', fontSize: 18 }}>
              {openSection === section.id ? <AppIcons.ChevronUp size={14} /> : <AppIcons.ChevronDown size={14} />}
            </span>
          </button>

          {/* Section Content */}
          {openSection === section.id && (
            <div style={{
              background: '#FAFCFF',
              border: `1.5px solid ${NAVY}`,
              borderTop: 'none',
              borderRadius: '0 0 14px 14px',
              padding: '16px 18px',
            }}>
              {section.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, marginBottom: 12,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{step.icon}</span>
                  <p style={{
                    margin: 0, fontSize: 13, lineHeight: 1.6,
                    color: '#374151',
                    fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
                  }}>
                    {isAr ? step.ar : step.en}
                  </p>
                </div>
              ))}

              {(section.tipEn || section.tipAr) && (
                <div style={{
                  marginTop: 8,
                  background: `${SKY}18`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  borderLeft: isAr ? 'none' : `3px solid ${SKY}`,
                  borderRight: isAr ? `3px solid ${SKY}` : 'none',
                }}>
                  <p style={{
                    margin: 0, fontSize: 12, color: NAVY, fontWeight: 600,
                    fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
                  }}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Info size={14} />{isAr ? section.tipAr : section.tipEn}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* WhatsApp Support Footer */}
      <div style={{ marginTop: 20, textAlign: 'center', paddingBottom: 8 }}>
        <a
          href="https://wa.me/96565068000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#25D366', fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
            background: 'rgba(37,211,102,0.08)',
            borderRadius: 20, padding: '9px 20px',
            border: '1.5px solid rgba(37,211,102,0.3)',
            fontFamily: isAr ? 'Cairo, Tajawal, sans-serif' : 'Inter, system-ui, sans-serif',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {isAr ? 'تواصل مع الدعم عبر WhatsApp' : 'Contact Support via WhatsApp'}
        </a>
      </div>

    </div>
  );
}
