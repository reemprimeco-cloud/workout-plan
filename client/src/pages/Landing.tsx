/**
 * Landing — the one public marketing page on the web.
 *
 * Direction contract: .impeccable/surfaces/client-src-pages-landing-tsx.md
 *
 * The page is a sequence of exchanges: a situation someone brings, and the
 * plan the coach returns, rendered as the artifact the app would actually
 * produce rather than as chat text. It proves personalisation by performing
 * it, which is the one thing a feature list cannot do.
 *
 * Every exchange is authored demonstration material, deliberately framed as
 * "what you can ask" rather than as something a member said. Prime Fit has no
 * testimonials, and a sentence in a person's voice would be a fabricated one.
 */
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { APP_STORE_URL } from "@/lib/appStore";

// ── Authored demonstration material ───────────────────────────────────────
// Four asks, four different artifacts. The variety is the argument: the coach
// does not return one template with the nouns swapped.

type Reply =
  | { kind: "plan"; rows: { move: string; detail: string }[]; note: string }
  | { kind: "week"; days: { day: string; focus: string; rest?: boolean }[]; note: string }
  | { kind: "report"; avoid: string[]; safe: string[]; note: string }
  | { kind: "rhythm"; beats: { at: string; what: string }[]; note: string };

interface Exchange {
  ask: { ar: string; en: string };
  replyLabel: { ar: string; en: string };
  ar: Reply;
  en: Reply;
}

const EXCHANGES: Exchange[] = [
  {
    ask: {
      ar: "عندي ألم بالركبة وأدوام تسع ساعات على الكرسي. أقدر أتمرّن؟",
      en: "My knee hurts and I sit nine hours at a desk. Can I still train?",
    },
    replyLabel: { ar: "برنامج الأسبوع الأول", en: "Week one" },
    ar: {
      kind: "plan",
      rows: [
        { move: "ضغط الصدر بالجهاز", detail: "٣ × ١٢ · وزن متوسط" },
        { move: "سحب علوي", detail: "٣ × ١٠" },
        { move: "جسر الحوض", detail: "٣ × ١٥ · يقوّي ما حول الركبة" },
        { move: "مشي على الدرّاجة الثابتة", detail: "١٢ دقيقة · مقاومة خفيفة" },
      ],
      note: "تُجنّب السكوات والطعنات هذا الأسبوع. وتذكير بالوقوف كل ٥٠ دقيقة أثناء الدوام.",
    },
    en: {
      kind: "plan",
      rows: [
        { move: "Machine chest press", detail: "3 × 12 · moderate" },
        { move: "Lat pulldown", detail: "3 × 10" },
        { move: "Glute bridge", detail: "3 × 15 · builds around the knee" },
        { move: "Stationary bike", detail: "12 min · light resistance" },
      ],
      note: "Squats and lunges are out this week. Plus a stand-up reminder every 50 minutes at your desk.",
    },
  },
  {
    ask: {
      ar: "ما أقدر أطلع أكثر من ثلاثة أيام بالأسبوع.",
      en: "I can only make it three days a week.",
    },
    replyLabel: { ar: "جدولك", en: "Your week" },
    ar: {
      kind: "week",
      days: [
        { day: "الأحد", focus: "الجزء العلوي" },
        { day: "الاثنين", focus: "راحة", rest: true },
        { day: "الثلاثاء", focus: "الجزء السفلي" },
        { day: "الأربعاء", focus: "راحة", rest: true },
        { day: "الخميس", focus: "كامل الجسم" },
        { day: "الجمعة", focus: "راحة", rest: true },
        { day: "السبت", focus: "مشي خفيف" },
      ],
      note: "ثلاثة أيام تكفي. التوزيع هو ما يفرق، لا العدد.",
    },
    en: {
      kind: "week",
      days: [
        { day: "Sunday", focus: "Upper body" },
        { day: "Monday", focus: "Rest", rest: true },
        { day: "Tuesday", focus: "Lower body" },
        { day: "Wednesday", focus: "Rest", rest: true },
        { day: "Thursday", focus: "Full body" },
        { day: "Friday", focus: "Rest", rest: true },
        { day: "Saturday", focus: "Easy walk" },
      ],
      note: "Three days is enough. How they are spaced matters more than how many.",
    },
  },
  {
    ask: {
      ar: "هذا تحليل الدم حقّي. فيه شي لازم أنتبه له؟",
      en: "Here is my blood test. Anything I should be careful about?",
    },
    replyLabel: { ar: "قراءة التقرير", en: "Reading the report" },
    ar: {
      kind: "report",
      avoid: ["رفع الأوزان الثقيلة فوق الرأس", "الكارديو العالي الشدة قبل الأكل"],
      safe: ["تمارين المقاومة المتوسطة", "المشي والسباحة", "تمارين الإطالة"],
      note: "فيتامين د منخفض وضغط الدم على الحد الأعلى. راجع طبيبك — المدرّب لا يشخّص، لكنه يبني البرنامج حول ما ذكره تقريرك.",
    },
    en: {
      kind: "report",
      avoid: ["Heavy overhead lifting", "High-intensity cardio before eating"],
      safe: ["Moderate resistance work", "Walking and swimming", "Stretching"],
      note: "Vitamin D is low and blood pressure sits at the upper limit. See your doctor — the coach does not diagnose, it builds the programme around what your report says.",
    },
  },
  {
    ask: {
      ar: "أنسى أشرب ماي، وأقعد ساعات بدون ما أتحرّك.",
      en: "I forget to drink water, and I sit for hours without moving.",
    },
    replyLabel: { ar: "يومك", en: "Your day" },
    ar: {
      kind: "rhythm",
      beats: [
        { at: "٩:٠٠", what: "كوب ماء · بداية الدوام" },
        { at: "١٠:٥٠", what: "تمرين مكتب · دقيقتان للرقبة والكتف" },
        { at: "١٢:٣٠", what: "كوب ماء" },
        { at: "١٥:٢٠", what: "تمرين مكتب · إطالة الظهر" },
        { at: "٢١:٠٠", what: "حساب سعرات اليوم" },
      ],
      note: "تذكيرات تعمل على جهازك، لا تحتاج أن تفتح التطبيق لتصلك.",
    },
    en: {
      kind: "rhythm",
      beats: [
        { at: "09:00", what: "Glass of water · start of the day" },
        { at: "10:50", what: "Desk exercise · two minutes, neck and shoulders" },
        { at: "12:30", what: "Glass of water" },
        { at: "15:20", what: "Desk exercise · back stretch" },
        { at: "21:00", what: "Today's calories" },
      ],
      note: "Reminders run on your device. You do not have to open the app to get them.",
    },
  },
];

const COPY = {
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  download: { ar: "حمّل التطبيق", en: "Get the app" },
  onAppStore: { ar: "على App Store", en: "on the App Store" },
  lead: {
    ar: "اسأل المدرّب كما تسأل إنساناً.",
    en: "Ask the coach the way you would ask a person.",
  },
  sub: {
    ar: "برايم فت يقرأ وضعك — إصابتك، دوامك، تحليلك — ويبني لك برنامجاً عليه. بالعربية، من أول كلمة.",
    en: "Prime Fit reads your situation — your injury, your hours, your lab results — and builds the programme around it. In Arabic, from the first word.",
  },
  synthetic: {
    ar: "الأمثلة أدناه من تأليفنا، تُظهر ما يُنتجه التطبيق. ليست حالات لأشخاص حقيقيين.",
    en: "The examples below are authored to show what the app produces. They are not real people's cases.",
  },
  closeTitle: { ar: "جاهز تبدأ؟", en: "Ready to start?" },
  closeBody: {
    ar: "تجربة مجانية سبعة أيام. بدون بطاقة، ولا تتحوّل إلى اشتراك من نفسها.",
    en: "Seven days free. No card, and it does not turn into a subscription by itself.",
  },
  avoid: { ar: "تجنّب", en: "Avoid" },
  safe: { ar: "آمن لك", en: "Safe for you" },
  footerLegal: { ar: "الخصوصية", en: "Privacy" },
  footerTerms: { ar: "الشروط", en: "Terms" },
  madeBy: { ar: "من Primeco · الكويت", en: "By Primeco · Kuwait" },
};

/** Reveals children once, when they first scroll into view. */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && (setShown(true), io.disconnect())),
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Safety net. The observer is an enhancement, never the thing that decides
    // whether content exists: a missed callback, a scripted scroll or a
    // headless capture must not leave a card at opacity 0 forever.
    const failsafe = window.setTimeout(() => setShown(true), 1400);
    return () => { io.disconnect(); window.clearTimeout(failsafe); };
  }, []);
  return { ref, shown };
}

export default function Landing() {
  const { lang, setLang, isRTL } = useLanguage();
  const pick = <T,>(o: { ar: T; en: T }) => (isRTL ? o.ar : o.en);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="landing">
      <style>{LANDING_CSS}</style>

      <header className="l-bar">
        <span className="l-mark">Prime&nbsp;Fit</span>
        <nav className="l-bar-actions">
          <button
            className="l-lang"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={isRTL ? "Switch to English" : "التبديل إلى العربية"}
          >
            {isRTL ? "English" : "العربية"}
          </button>
          <a className="l-quiet" href="/signin">{pick(COPY.signIn)}</a>
        </nav>
      </header>

      {/* ── First viewport: the opening ask, answered ──────────────────── */}
      <main>
        <section className="l-open">
          <h1 className="l-ask l-ask--lead">{pick(EXCHANGES[0].ask)}</h1>
          <div className="l-open-answer">
            <ReplyCard exchange={EXCHANGES[0]} isRTL={isRTL} pick={pick} shown />
            <aside className="l-open-aside">
              <p className="l-sub">{pick(COPY.sub)}</p>
              <a className="l-cta" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <span className="l-cta-main">{pick(COPY.download)}</span>
                <span className="l-cta-sub">{pick(COPY.onAppStore)}</span>
              </a>
              <p className="l-synthetic">{pick(COPY.synthetic)}</p>
            </aside>
          </div>
        </section>

        {EXCHANGES.slice(1).map((x, i) => (
          <ExchangeBlock key={i} exchange={x} isRTL={isRTL} pick={pick} />
        ))}

        <section className="l-close">
          <h2 className="l-close-title">{pick(COPY.closeTitle)}</h2>
          <p className="l-close-body">{pick(COPY.closeBody)}</p>
          <a className="l-cta l-cta-light" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <span className="l-cta-main">{pick(COPY.download)}</span>
            <span className="l-cta-sub">{pick(COPY.onAppStore)}</span>
          </a>
        </section>
      </main>

      <footer className="l-foot">
        <span>{pick(COPY.madeBy)}</span>
        <span className="l-foot-links">
          <a href="/privacy">{pick(COPY.footerLegal)}</a>
          <a href="/terms">{pick(COPY.footerTerms)}</a>
        </span>
      </footer>
    </div>
  );
}

function ExchangeBlock({
  exchange, isRTL, pick,
}: {
  exchange: Exchange;
  isRTL: boolean;
  pick: <T,>(o: { ar: T; en: T }) => T;
}) {
  const { ref, shown } = useRevealed<HTMLElement>();
  return (
    <section className={`l-x ${shown ? "is-shown" : ""}`} ref={ref}>
      <h2 className="l-ask">{pick(exchange.ask)}</h2>
      <ReplyCard exchange={exchange} isRTL={isRTL} pick={pick} shown={shown} />
    </section>
  );
}

function ReplyCard({
  exchange, isRTL, pick, shown,
}: {
  exchange: Exchange;
  isRTL: boolean;
  pick: <T,>(o: { ar: T; en: T }) => T;
  shown: boolean;
}) {
  const reply = isRTL ? exchange.ar : exchange.en;
  return (
    <div className={shown ? "is-shown" : ""}>
      <article className="l-reply" aria-label={pick(exchange.replyLabel)}>
        <h3 className="l-reply-title">{pick(exchange.replyLabel)}</h3>

        {reply.kind === "plan" && (
          <ol className="l-rows">
            {reply.rows.map((r, i) => (
              <li className="l-row" key={i} style={{ "--i": i } as React.CSSProperties}>
                <span className="l-row-move">{r.move}</span>
                <span className="l-row-detail">{r.detail}</span>
              </li>
            ))}
          </ol>
        )}

        {reply.kind === "week" && (
          <ol className="l-week">
            {reply.days.map((d, i) => (
              <li
                className={`l-day ${d.rest ? "is-rest" : ""}`}
                key={i}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="l-day-name">{d.day}</span>
                <span className="l-day-focus">{d.focus}</span>
              </li>
            ))}
          </ol>
        )}

        {reply.kind === "report" && (
          <div className="l-report">
            <div className="l-report-col">
              <h4 className="l-report-head l-report-head--avoid">{pick(COPY.avoid)}</h4>
              <ul>{reply.avoid.map((s, i) => <li key={i} style={{ "--i": i } as React.CSSProperties}>{s}</li>)}</ul>
            </div>
            <div className="l-report-col">
              <h4 className="l-report-head l-report-head--safe">{pick(COPY.safe)}</h4>
              <ul>{reply.safe.map((s, i) => <li key={i} style={{ "--i": i + 2 } as React.CSSProperties}>{s}</li>)}</ul>
            </div>
          </div>
        )}

        {reply.kind === "rhythm" && (
          <ol className="l-rhythm">
            {reply.beats.map((b, i) => (
              <li className="l-beat" key={i} style={{ "--i": i } as React.CSSProperties}>
                <span className="l-beat-at">{b.at}</span>
                <span className="l-beat-what">{b.what}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="l-reply-note">{reply.note}</p>
      </article>
    </div>
  );
}

const LANDING_CSS = `
.landing {
  --l-gut: clamp(20px, 6vw, 72px);
  text-align: start;
  background: var(--bg-main, #F0F4F8);
  color: var(--text-dark, #1B2E5E);
  font-family: 'Tajawal', 'Inter', sans-serif;
  min-height: 100dvh;
}
.landing ::selection { background: var(--secondary-light, #A8D4E8); color: var(--primary, #1B2E5E); }
.landing a:focus-visible,
.landing button:focus-visible {
  outline: 2px solid var(--secondary, #7BB8D4);
  outline-offset: 3px;
  border-radius: 8px;
}

/* ── Bar ─────────────────────────────────────────────────────────────── */
.l-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px var(--l-gut);
  position: sticky; top: 0; z-index: 10;
  background: color-mix(in srgb, var(--bg-main, #F0F4F8) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border, #D0DFF0);
}
.l-mark {
  font-family: 'Inter', 'Tajawal', sans-serif; font-weight: 800; font-size: 17px;
  letter-spacing: -0.01em; color: var(--primary, #1B2E5E);
}
.l-bar-actions { display: flex; align-items: center; gap: 18px; }
.l-lang, .l-quiet {
  font-family: 'Inter', 'Tajawal', sans-serif; font-size: 12px; font-weight: 600;
  color: var(--text-medium, #3D5A80);
  background: none; border: none; cursor: pointer; text-decoration: none;
  padding: 8px 2px; min-height: 44px; display: inline-flex; align-items: center;
}
.l-lang:hover, .l-quiet:hover { color: var(--primary, #1B2E5E); }

/* ── Opening ─────────────────────────────────────────────────────────── */
.l-open { padding: clamp(40px, 7vw, 76px) var(--l-gut) clamp(40px, 7vw, 72px); max-width: 1180px; }
.l-ask--lead {
  font-size: clamp(30px, 5.4vw, 60px);
  line-height: 1.1;
  letter-spacing: -0.025em;
  max-width: 19ch;
  margin-bottom: clamp(26px, 4vw, 42px);
}
.l-open-answer {
  display: grid;
  grid-template-columns: minmax(0, 560px) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 52px);
  align-items: start;
}
.l-open-aside { padding-top: 6px; }
.l-sub {
  font-size: clamp(15px, 1.5vw, 18px); line-height: 1.75;
  color: var(--text-medium, #3D5A80);
  margin: 0 0 26px; max-width: 44ch;
}
.l-synthetic {
  font-size: 12px; line-height: 1.6; color: var(--text-light, #7A9BB5);
  margin: 28px 0 0; max-width: 52ch;
}

/* ── Call to action ──────────────────────────────────────────────────── */
.l-cta {
  display: inline-flex; flex-direction: column; gap: 2px;
  background: var(--primary, #1B2E5E); color: #fff;
  text-decoration: none; border-radius: 12px;
  padding: 14px 30px; min-height: 44px;
  transition: background .2s ease, transform .08s ease;
}
.l-cta:hover { background: var(--primary-light, #2A4A8C); }
.l-cta:active { transform: scale(.97); }
.l-cta-main { font-family: 'Inter','Tajawal',sans-serif; font-weight: 700; font-size: 15px; }
.l-cta-sub { font-size: 12px; opacity: .72; }
.l-cta-light { background: var(--secondary, #7BB8D4); color: var(--primary, #1B2E5E); }
.l-cta-light:hover { background: var(--secondary-light, #A8D4E8); }

/* ── Exchange ────────────────────────────────────────────────────────── */
/* Ask and answer face each other: the exchange reads as a conversation across
   the page rather than a caption stacked on a card, and the column that would
   otherwise sit empty at desktop width is the one carrying the question. */
.l-x {
  position: relative;
  padding: clamp(40px, 7vw, 76px) var(--l-gut);
  max-width: 1180px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 560px);
  gap: clamp(20px, 5vw, 64px);
  align-items: start;
}
.l-x + .l-x { border-top: 1px solid var(--border, #D0DFF0); }
.l-ask {
  font-family: 'Inter', 'Tajawal', sans-serif;
  font-weight: 700;
  font-size: clamp(21px, 3.3vw, 36px);
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--primary, #1B2E5E);
  margin: 0;
  max-width: 20ch;
  padding-top: 4px;
  text-wrap: balance;
}
.l-reply {
  background: var(--bg-card, #fff);
  border-radius: 16px;
  padding: clamp(20px, 3vw, 30px);
  box-shadow: var(--shadow, 0 4px 20px rgba(27,46,94,.08));
  max-width: 560px;
  opacity: 0; transform: translateY(14px);
  transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1);
}
.l-x.is-shown .l-reply,
.is-shown > .l-reply { opacity: 1; transform: none; }
.l-reply-title {
  font-family: 'Inter','Tajawal',sans-serif; font-weight: 700; font-size: 15px;
  color: var(--text-medium, #3D5A80); margin: 0 0 16px;
  padding-bottom: 12px; border-bottom: 3px solid var(--secondary, #7BB8D4);
}
.l-reply-note {
  font-size: 14px; line-height: 1.7; color: var(--text-medium, #3D5A80);
  margin: 18px 0 0; padding-top: 16px; border-top: 1px solid var(--border, #D0DFF0);
}

/* rows, week, report, rhythm all stagger in behind the card */
.l-row, .l-day, .l-beat, .l-report li {
  opacity: 0; transform: translateY(8px);
  transition: opacity .5s ease-out, transform .5s ease-out;
  transition-delay: calc(.18s + var(--i, 0) * .07s);
}
.l-x.is-shown .l-row, .is-shown .l-row,
.l-x.is-shown .l-day, .is-shown .l-day,
.l-x.is-shown .l-beat, .is-shown .l-beat,
.l-x.is-shown .l-report li, .is-shown .l-report li { opacity: 1; transform: none; }

.l-rows, .l-week, .l-rhythm { list-style: none; margin: 0; padding: 0; }
.l-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  padding: 11px 0;
}
.l-row + .l-row { border-top: 1px solid var(--border, #D0DFF0); }
.l-row-move { font-weight: 500; font-size: 15px; }
.l-row-detail {
  font-family: 'Inter','Tajawal',sans-serif; font-size: 12px; font-weight: 600;
  color: var(--text-medium, #3D5A80); white-space: nowrap; font-variant-numeric: tabular-nums;
}

.l-day { display: flex; align-items: baseline; gap: 14px; padding: 9px 0; }
.l-day + .l-day { border-top: 1px solid var(--border, #D0DFF0); }
.l-day-name {
  font-family: 'Inter','Tajawal',sans-serif; font-size: 12px; font-weight: 700;
  color: var(--primary, #1B2E5E); min-width: 6.5ch;
}
.l-day-focus { font-size: 15px; }
.l-day.is-rest .l-day-name, .l-day.is-rest .l-day-focus { color: var(--text-light, #7A9BB5); font-weight: 400; }

.l-report { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.l-report-col ul { list-style: none; margin: 0; padding: 0; }
.l-report-col li { font-size: 14px; line-height: 1.55; padding: 7px 0; }
.l-report-head {
  font-family: 'Inter','Tajawal',sans-serif; font-size: 12px; font-weight: 700;
  margin: 0 0 8px; padding-bottom: 7px;
  border-bottom: 2px solid currentColor;
}
.l-report-head--avoid { color: #B45309; }
.l-report-head--safe { color: #15803D; }

.l-beat { display: flex; align-items: baseline; gap: 16px; padding: 10px 0; }
.l-beat + .l-beat { border-top: 1px solid var(--border, #D0DFF0); }
.l-beat-at {
  font-family: 'Inter','Tajawal',sans-serif; font-size: 12px; font-weight: 700;
  color: var(--secondary, #7BB8D4); min-width: 6ch; font-variant-numeric: tabular-nums;
}
.l-beat-what { font-size: 15px; }

/* ── Close ───────────────────────────────────────────────────────────── */
.l-close {
  background: var(--primary, #1B2E5E); color: #fff;
  padding: clamp(56px, 9vw, 104px) var(--l-gut);
  margin-top: clamp(40px, 6vw, 72px);
}
.l-close-title {
  font-family: 'Inter','Tajawal',sans-serif; font-weight: 800;
  font-size: clamp(27px, 4.6vw, 46px); line-height: 1.15; letter-spacing: -0.02em;
  margin: 0 0 14px;
}
.l-close-body { font-size: 15px; line-height: 1.7; margin: 0 0 30px; max-width: 48ch; opacity: .82; }

/* ── Foot ────────────────────────────────────────────────────────────── */
.l-foot {
  display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between;
  padding: 26px var(--l-gut); font-size: 12px; color: var(--text-light, #7A9BB5);
}
.l-foot-links { display: flex; gap: 20px; }
.l-foot a { color: inherit; text-decoration: none; text-underline-offset: 3px; }
.l-foot a:hover { color: var(--text-medium, #3D5A80); text-decoration: underline; }

@media (max-width: 980px) {
  .l-open-answer { grid-template-columns: minmax(0, 1fr); }
  .l-x { grid-template-columns: minmax(0, 1fr); gap: clamp(18px, 4vw, 30px); }
  .l-ask { max-width: 24ch; }
}
@media (max-width: 720px) {
  .l-report { grid-template-columns: 1fr; gap: 18px; }
  .l-reply { margin-inline-start: 0; }
  .l-row { flex-direction: column; gap: 3px; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .l-reply, .l-row, .l-day, .l-beat, .l-report li {
    opacity: 1 !important; transform: none !important; transition: none !important;
  }
  .l-cta:active { transform: none; }
}
`;
