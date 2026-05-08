// Design: Energetic Sports & Wellness Arabic RTL
// Colors: Primary #E05A00 (orange), Secondary #1A7A4A (green)
// Fonts: Cairo (headings), Tajawal (body)
// Layout: RTL, card-based, tabbed weeks

import { useState } from 'react';
import { allWeeks, nutritionTips, userProfile, type DayPlan, type WeekPlan } from '../data/workoutData';

// ===== HEADER COMPONENT =====
function Header() {
  const progress = ((userProfile.currentWeight - userProfile.targetWeight) / (userProfile.currentWeight - userProfile.targetWeight)) * 100;
  const lostSoFar = 0;
  const toGo = userProfile.currentWeight - userProfile.targetWeight;
  const progressPct = (lostSoFar / (userProfile.currentWeight - userProfile.targetWeight)) * 100;

  return (
    <header style={{
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      color: 'white',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>💪</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
                جدول التمارين الشامل
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontFamily: 'Tajawal, sans-serif' }}>
                8 أسابيع · عمر 36 · وزن 72.6 كجم → هدف 65 كجم
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'الوزن الحالي', value: '72.6 كجم', color: '#E05A00' },
              { label: 'الهدف', value: '65 كجم', color: '#1A7A4A' },
              { label: 'المطلوب إنقاصه', value: '7.6 كجم', color: '#7C3AED' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: 'Cairo, sans-serif' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Tajawal, sans-serif' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

// ===== PROFILE CARD =====
function ProfileCard() {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, #FFF5EF, #FFFFFF)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, flexShrink: 0,
        }}>👩‍🏋️</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 8px', fontFamily: 'Cairo, sans-serif', color: '#1A1A2E' }}>ملفك الرياضي</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'العمر', value: '36 سنة', icon: '🎂' },
              { label: 'الوزن الحالي', value: '72.6 كجم', icon: '⚖️' },
              { label: 'الهدف', value: '65 كجم', icon: '🎯' },
              { label: 'BMI', value: '26.7', icon: '📊' },
              { label: 'المستوى', value: 'متوسط', icon: '💪' },
              { label: 'المدة', value: '8 أسابيع', icon: '📅' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>تقدم الوزن</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E05A00', fontFamily: 'Cairo, sans-serif' }}>72.6 كجم → 65 كجم</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '0%', '--progress-width': '0%' } as any}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#8A8AAA' }}>72.6 كجم</span>
              <span style={{ fontSize: 11, color: '#1A7A4A', fontWeight: 600 }}>65 كجم 🎯</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#FFF0E8', borderRadius: 10, borderRight: '4px solid #E05A00' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', lineHeight: 1.7 }}>
          🎯 <strong>مناطق التركيز:</strong> حرق دهون اليدين والبطن والأرداف مع بناء العضلات. البرنامج مصمم لحرق 7.6 كجم في 8 أسابيع مع الالتزام بالتغذية السليمة.
        </p>
      </div>
    </div>
  );
}

// ===== WARM UP SECTION =====
function WarmUpSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 20, marginBottom: 24 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <div className="section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          <div className="section-icon" style={{ background: '#FFF0E8' }}>🔥</div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E' }}>الإحماء اليومي (قبل كل تمرين)</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#8A8AAA' }}>5-10 دقائق · ضروري قبل كل جلسة</p>
          </div>
        </div>
        <span style={{ fontSize: 20, color: '#E05A00', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div className="slide-down" style={{ marginTop: 16 }}>
          <img src="/manus-storage/warmup_f8a00b2a.png" alt="تمارين الإحماء" className="exercise-img" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
            {[
              { name: 'المشي السريع في المكان (High Knees)', time: '60 ثانية', icon: '🏃‍♀️' },
              { name: 'دوران الذراعين للأمام والخلف', time: '60 ثانية', icon: '🔄' },
              { name: 'دوران الجذع (Torso Twists)', time: '60 ثانية', icon: '🌀' },
              { name: 'تمديد الفخذ الأمامي', time: '30 ثانية لكل جهة', icon: '🦵' },
              { name: 'القفز الخفيف (Jumping Jacks)', time: '60 ثانية', icon: '⭐' },
              { name: 'تدوير الركبتين', time: '30 ثانية', icon: '🔵' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: '#F8F9FA', borderRadius: 10,
                border: '1px solid #E2E8F0',
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#E05A00', fontFamily: 'Tajawal, sans-serif' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 12, background: '#E8F5EE', borderRadius: 10, borderRight: '4px solid #1A7A4A' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1A7A4A', fontFamily: 'Tajawal, sans-serif' }}>
              ✅ الإحماء يقلل خطر الإصابات بنسبة 50% ويزيد من أداء التمرين. لا تتخطيه أبداً!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== EXERCISE CARD =====
function ExerciseCard({ ex, index }: { ex: any; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 10,
      background: 'white',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          cursor: 'pointer', background: open ? '#FFF5EF' : 'white',
          transition: 'background 0.2s',
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, fontFamily: 'Cairo, sans-serif', flexShrink: 0,
        }}>{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>{ex.nameAr}</div>
          <div style={{ fontSize: 12, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>{ex.muscleGroup}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-orange">{ex.sets} جولات</span>
          <span className="badge badge-green">{ex.reps}</span>
          <span className="badge badge-blue">{ex.weight}</span>
        </div>
        <span style={{ fontSize: 16, color: '#E05A00', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F0F0F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <img src={ex.image} alt={ex.nameAr} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }} />
            <div>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  {[
                    ['الجولات', ex.sets],
                    ['التكرارات', ex.reps],
                    ['الوزن', ex.weight],
                    ['الراحة', ex.rest],
                    ['العضلة المستهدفة', ex.muscleGroup],
                  ].map(([k, v]) => (
                    <tr key={k as string}>
                      <td style={{ fontWeight: 600, color: '#4A4A6A', paddingRight: 0, paddingLeft: 8, border: 'none', background: 'transparent', fontSize: 12 }}>{k}:</td>
                      <td style={{ color: '#1A1A2E', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#FFF5EF', borderRadius: 10, borderRight: '3px solid #E05A00' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', lineHeight: 1.7 }}>
              💡 <strong>نصيحة:</strong> {ex.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CARDIO CARD =====
function CardioCard({ cardio }: { cardio: any }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #E8F5EE, #F0FFF6)',
      border: '2px solid #1A7A4A',
      borderRadius: 14,
      padding: 16,
      marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1A7A4A, #2EA86A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>🏃‍♀️</div>
        <div>
          <h4 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A7A4A', fontSize: 15 }}>الكارديو</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{cardio.machineAr}</p>
        </div>
      </div>
      <img src={cardio.image} alt={cardio.machineAr} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'المدة', value: cardio.duration, icon: '⏱️' },
          { label: 'السرعة', value: cardio.speed, icon: '⚡' },
          { label: 'الانحدار', value: cardio.incline, icon: '📐' },
          { label: 'المسافة', value: cardio.distance, icon: '📏' },
          { label: 'السعرات المحروقة', value: cardio.calories, icon: '🔥' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'white', borderRadius: 8, padding: '8px 10px',
            border: '1px solid #C8E6D4',
          }}>
            <div style={{ fontSize: 11, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>{item.icon} {item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A7A4A', fontFamily: 'Cairo, sans-serif' }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', background: 'white', borderRadius: 10, borderRight: '3px solid #1A7A4A' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', lineHeight: 1.7 }}>
          💡 {cardio.tip}
        </p>
      </div>
    </div>
  );
}

// ===== DAY CARD =====
function DayCard({ day }: { day: DayPlan }) {
  const [open, setOpen] = useState(false);

  const typeColors: Record<string, { bg: string; border: string; badge: string }> = {
    training: { bg: '#FFF5EF', border: '#E05A00', badge: '#E05A00' },
    'active-rest': { bg: '#E8F5EE', border: '#1A7A4A', badge: '#1A7A4A' },
    rest: { bg: '#F0F0F0', border: '#8A8AAA', badge: '#8A8AAA' },
  };
  const colors = typeColors[day.type];

  return (
    <div style={{
      border: `2px solid ${open ? colors.border : '#E2E8F0'}`,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
      background: 'white',
      transition: 'all 0.3s ease',
      boxShadow: open ? `0 4px 20px ${colors.border}22` : '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Day Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          cursor: day.type !== 'rest' ? 'pointer' : 'default',
          background: open ? colors.bg : 'white',
          transition: 'background 0.2s',
        }}
        onClick={() => day.type !== 'rest' && setOpen(!open)}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: open ? `linear-gradient(135deg, ${colors.border}, ${colors.border}CC)` : '#F4F6F8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0, transition: 'all 0.3s',
        }}>{day.focusIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E' }}>
              اليوم {day.dayNum} - {day.dayName}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 10px', borderRadius: 20, fontFamily: 'Cairo, sans-serif', fontWeight: 600,
              background: `${colors.border}22`, color: colors.border,
            }}>
              {day.type === 'training' ? 'تدريب' : day.type === 'active-rest' ? 'راحة نشطة' : 'راحة تامة'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', marginTop: 2 }}>{day.focus}</div>
        </div>
        {day.type !== 'rest' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {day.type === 'training' && (
              <span className="badge badge-orange">{day.exercises.length} تمارين</span>
            )}
            {day.cardio && <span className="badge badge-green">كارديو</span>}
            <span style={{ fontSize: 18, color: colors.border, transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
          </div>
        )}
      </div>

      {/* Day Content */}
      {open && (
        <div className="slide-down" style={{ padding: '0 18px 18px', borderTop: `2px solid ${colors.border}33` }}>
          {day.notes && (
            <div style={{ margin: '12px 0', padding: '10px 14px', background: colors.bg, borderRadius: 10, borderRight: `3px solid ${colors.border}` }}>
              <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', lineHeight: 1.7 }}>
                📌 {day.notes}
              </p>
            </div>
          )}

          {day.exercises.length > 0 && (
            <>
              <h4 style={{ fontFamily: 'Cairo, sans-serif', color: '#1A1A2E', margin: '16px 0 10px', fontSize: 15 }}>
                🏋️‍♀️ تمارين الأوزان
              </h4>
              {day.exercises.map((ex, i) => (
                <ExerciseCard key={i} ex={ex} index={i} />
              ))}
            </>
          )}

          {day.cardio && <CardioCard cardio={day.cardio} />}

          {day.type === 'active-rest' && !day.exercises.length && day.cardio && (
            <div style={{ marginTop: 12, padding: 12, background: '#E8F5EE', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#1A7A4A', fontFamily: 'Tajawal, sans-serif' }}>
                ✅ يوم الراحة النشطة يساعد على التعافي وحرق سعرات إضافية. لا تتخطيه!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== WEEK SECTION =====
function WeekSection({ week }: { week: WeekPlan }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
        borderRadius: 12, color: 'white',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, fontFamily: 'Cairo, sans-serif', flexShrink: 0,
        }}>{week.weekNum}</div>
        <div>
          <div style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 15 }}>
            الأسبوع {week.weekNum}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Tajawal, sans-serif' }}>{week.theme}</div>
        </div>
      </div>
      {week.days.map((day, i) => (
        <DayCard key={i} day={day} />
      ))}
    </div>
  );
}

// ===== NUTRITION SECTION =====
function NutritionSection() {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div className="section-header">
        <div className="section-icon" style={{ background: '#E8F5EE' }}>🥗</div>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E' }}>النصائح الغذائية</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>التغذية 70% من النجاح، التمرين 30%</p>
        </div>
      </div>
      <img src="/manus-storage/nutrition_b9e25ab1.jpg" alt="التغذية الصحية" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {nutritionTips.map((tip, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 12,
            background: tip.color,
            borderRight: `4px solid ${tip.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{tip.icon}</span>
              <h4 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E', fontSize: 14 }}>{tip.title}</h4>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif', lineHeight: 1.7 }}>{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== MAIN HOME PAGE =====
export default function Home() {
  const [activeMonth, setActiveMonth] = useState(1);
  const month1Weeks = allWeeks.filter(w => w.month === 1);
  const month2Weeks = allWeeks.filter(w => w.month === 2);
  const displayWeeks = activeMonth === 1 ? month1Weeks : month2Weeks;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F8' }}>
      <Header />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <ProfileCard />
        <WarmUpSection />

        {/* Month Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { month: 1, label: 'الشهر الأول', sub: 'الأسابيع 1-4 · بناء الأساس', icon: '🌱' },
            { month: 2, label: 'الشهر الثاني', sub: 'الأسابيع 5-8 · رفع الشدة', icon: '🚀' },
          ].map(tab => (
            <button
              key={tab.month}
              className={`week-tab ${activeMonth === tab.month ? 'active' : ''}`}
              onClick={() => setActiveMonth(tab.month)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{tab.label}</div>
                <div style={{ fontSize: 11, opacity: 0.8, fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>{tab.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Weeks */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="section-header">
            <div className="section-icon" style={{ background: '#FFF0E8' }}>📅</div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E' }}>
                {activeMonth === 1 ? 'الشهر الأول - بناء الأساس' : 'الشهر الثاني - رفع الشدة'}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>
                انقري على أي يوم لرؤية تفاصيل التمارين الكاملة
              </p>
            </div>
          </div>
          {displayWeeks.map((week, i) => (
            <WeekSection key={i} week={week} />
          ))}
        </div>

        <NutritionSection />

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#8A8AAA', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>
          <p>💪 استشيري طبيبك أو مدرب متخصص قبل البدء بأي برنامج تمارين. هذا البرنامج للأغراض التوجيهية فقط.</p>
          <p style={{ color: '#E05A00', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>الالتزام + الصبر = النتيجة 🎯</p>
        </div>
      </div>
    </div>
  );
}
