// WorkoutGuide - Reference guide for exercises, sauna, aqua, and nutrition
import { useState } from 'react';
import { masterExercises, aquaExercises, saunaProtocol, sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';
import { useLanguage } from '../contexts/LanguageContext';

type GuideTab = 'plan' | 'exercises' | 'aqua' | 'sauna' | 'nutrition';

// Translate Arabic muscle group names to English
const muscleGroupEn: Record<string, string> = {
  'الأرداف والفخذين': 'Glutes & Thighs',
  'الأرداف': 'Glutes',
  'الفخذ الخلفي والأرداف': 'Hamstrings & Glutes',
  'الفخذ الخلفي': 'Hamstrings',
  'الفخذين والأرداف': 'Quads & Glutes',
  'داخل الفخذ والأرداف': 'Inner Thigh & Glutes',
  'عضلة الفخذ الأمامية': 'Quadriceps',
  'عضلة السمانة': 'Calves',
  'البايسبس': 'Biceps',
  'البايسبس والساعد': 'Biceps & Forearm',
  'الترايسبس': 'Triceps',
  'عضلة الظهر العريضة': 'Latissimus Dorsi',
  'عضلة الظهر': 'Back',
  'الأكتاف': 'Shoulders',
  'عضلات الصدر': 'Chest',
  'الصدر والترايسبس': 'Chest & Triceps',
  'عضلة البطن المستقيمة': 'Rectus Abdominis',
  'عضلات البطن الكاملة': 'Full Abs',
  'عضلات البطن السفلية': 'Lower Abs',
  'البطن السفلي': 'Lower Abs',
  'عضلات البطن الجانبية': 'Obliques',
  'البطن والكور والكارديو': 'Core & Cardio',
  'الجسم كله — ظهر، أكتاف، ذراعين، أرداف': 'Full Body',
};

// English names for session types (sessionTypes only has nameAr)
const sessionTypeNameEn: Record<string, string> = {
  lower_body:      'Lower Body',
  upper_arms:      'Upper Body',
  core_cardio:     'Core & Cardio',
  chest_shoulders: 'Chest & Shoulders',
  full_body:       'Full Body',
  aqua:            'Aqua Class',
  sauna:           'Sauna',
  active_rest:     'Cardio',
};


export function WorkoutGuide({ gender = 'female' }: { gender?: 'male' | 'female' }) {
  const { lang, isRTL } = useLanguage();
  const ar = lang === 'ar';

  const [tab, setTab] = useState<GuideTab>('plan');
  const [selectedType, setSelectedType] = useState<SessionType>('lower_body');
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  const tabs: { id: GuideTab; icon: string; labelAr: string; labelEn: string }[] = [
    { id: 'plan',      icon: '📅', labelAr: 'الخطة',    labelEn: 'Plan' },
    { id: 'exercises', icon: '🏋️‍♀️', labelAr: 'التمارين', labelEn: 'Exercises' },
    { id: 'aqua',      icon: '🏊‍♀️', labelAr: 'الأكوا',   labelEn: 'Aqua' },
    { id: 'sauna',     icon: '🧖‍♀️', labelAr: 'السونا',   labelEn: 'Sauna' },
    { id: 'nutrition', icon: '🥗', labelAr: 'التغذية',  labelEn: 'Nutrition' },
  ];

  const typeOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body'];

  // Weekly plan data with both languages
  const weeklyPlan = [
    { dayAr: 'الأحد',    dayEn: 'Sunday',    type: 'lower_body'      as SessionType, noteAr: 'الأرداف والفخذين',        noteEn: 'Glutes & Legs' },
    { dayAr: 'الاثنين', dayEn: 'Monday',    type: 'upper_arms'      as SessionType, noteAr: 'الذراعان والظهر',          noteEn: 'Arms & Back' },
    { dayAr: 'الثلاثاء', dayEn: 'Tuesday',  type: 'aqua'            as SessionType, noteAr: 'كلاس الأكوا 45 دقيقة',    noteEn: 'Aqua Class 45 min' },
    { dayAr: 'الأربعاء', dayEn: 'Wednesday',type: 'core_cardio'     as SessionType, noteAr: 'البطن والكور',             noteEn: 'Core & Cardio' },
    { dayAr: 'الخميس',  dayEn: 'Thursday', type: 'chest_shoulders' as SessionType, noteAr: 'الصدر والأكتاف',           noteEn: 'Chest & Shoulders' },
    { dayAr: 'الجمعة',  dayEn: 'Friday',   type: 'sauna'           as SessionType, noteAr: 'جلسة سونا للتعافي',        noteEn: 'Sauna Recovery' },
    { dayAr: 'السبت',   dayEn: 'Saturday', type: 'active_rest'     as SessionType, noteAr: 'راحة أو مشي خفيف',        noteEn: 'Rest or Light Walk' },
  ];

  // Aqua exercises with English
  const aquaData = [
    { nameAr: 'المشي في الماء',                          nameEn: 'Water Walking',              duration: ar ? '5 دقائق'          : '5 min',          tipAr: gender === 'female' ? 'ابدئي بالمشي للإحماء' : 'ابدأ بالمشي للإحماء',                                   tipEn: 'Start with walking to warm up' },
    { nameAr: 'القفز في الماء (Aqua Jumping Jacks)',     nameEn: 'Aqua Jumping Jacks',         duration: ar ? '3 × دقيقة'        : '3 × 1 min',      tipAr: 'افتحي ذراعيك وساقيك معاً',                              tipEn: 'Open arms and legs simultaneously' },
    { nameAr: 'ركل الماء للأمام (Flutter Kicks)',        nameEn: 'Flutter Kicks',              duration: ar ? '3 × دقيقة'        : '3 × 1 min',      tipAr: gender === 'female' ? 'أمسكي حافة المسبح وركلي بسرعة' : 'أمسك حافة المسبح واركل بسرعة',                         tipEn: 'Hold pool edge and kick rapidly' },
    { nameAr: 'تمرين الدمبل المائي (Water Dumbbell Curls)', nameEn: 'Water Dumbbell Curls',   duration: ar ? '3 × 15 تكرار'     : '3 × 15 reps',    tipAr: 'استخدمي الدمبل المائي لمقاومة الماء',                    tipEn: 'Use water dumbbells for resistance' },
    { nameAr: 'الركض في الماء (Aqua Jogging)',           nameEn: 'Aqua Jogging',               duration: ar ? '5 دقائق'          : '5 min',          tipAr: 'الماء يقاوم حركتك ويزيد من حرق السعرات',                tipEn: 'Water resistance increases calorie burn' },
    { nameAr: 'تمرين الأرداف في الماء (Aqua Squats)',   nameEn: 'Aqua Squats',                duration: ar ? '3 × 15 تكرار'     : '3 × 15 reps',    tipAr: 'السكوات في الماء أقل ضغطاً على الركبتين',               tipEn: 'Squats in water are easier on knees' },
    { nameAr: 'تمرين الجانبين (Side Kicks)',             nameEn: 'Side Kicks',                 duration: ar ? '3 × 12 لكل جهة'  : '3 × 12 each side',tipAr: gender === 'female' ? 'ارفعي ساقك للجانب ضد مقاومة الماء' : 'ارفع ساقك للجانب ضد مقاومة الماء',                    tipEn: 'Lift leg sideways against water resistance' },
    { nameAr: 'التمدد والإطالة المائية',                  nameEn: 'Aqua Stretching',            duration: ar ? '5 دقائق'          : '5 min',          tipAr: 'الماء يساعد على مرونة أفضل',                            tipEn: 'Water helps achieve better flexibility' },
  ];

  // Sauna protocol with English
  const saunaData = [
    { phaseAr: 'الجلسة الأولى',    phaseEn: 'First Session',    duration: ar ? '10 دقائق' : '10 min', temp: '70–80°C', tipAr: gender === 'female' ? 'ادخلي وأنتِ مرتاحة، لا تدخلي مباشرة بعد تمرين مكثف' : 'ادخل وأنت مرتاح، لا تدخل مباشرة بعد تمرين مكثف', tipEn: 'Enter relaxed, avoid entering right after intense workout' },
    { phaseAr: 'استراحة خارجية',   phaseEn: 'Outside Break',    duration: ar ? '5 دقائق'  : '5 min',  temp: ar ? 'درجة حرارة الغرفة' : 'Room temperature', tipAr: gender === 'female' ? 'اشربي ماءً واستريحي خارج السونا' : 'اشرب ماءً واسترح خارج السونا', tipEn: 'Drink water and rest outside the sauna' },
    { phaseAr: 'الجلسة الثانية',   phaseEn: 'Second Session',   duration: ar ? '10 دقائق' : '10 min', temp: '75–85°C', tipAr: 'يمكنك رفع الحرارة قليلاً في الجلسة الثانية', tipEn: 'You can increase the heat slightly in the second session' },
    { phaseAr: 'تبريد',            phaseEn: 'Cool Down',        duration: ar ? '3-5 دقائق': '3–5 min', temp: ar ? 'ماء بارد أو درجة حرارة معتدلة' : 'Cold or cool water', tipAr: 'دش بارد أو بارد معتدل لإغلاق المسام', tipEn: 'Cold or cool shower to close pores' },
    { phaseAr: 'راحة نهائية',      phaseEn: 'Final Rest',       duration: ar ? '10 دقائق' : '10 min', temp: ar ? 'درجة حرارة الغرفة' : 'Room temperature', tipAr: gender === 'female' ? 'اشربي 500 مل ماء على الأقل واستريحي' : 'اشرب 500 مل ماء على الأقل واسترح', tipEn: 'Drink at least 500 ml water and rest' },
  ];

  // Nutrition sections with English
  const nutritionSections = [
    {
      titleAr: '🍳 وجبة ما قبل التمرين (1-2 ساعة قبل)',
      titleEn: '🍳 Pre-Workout Meal (1–2 hours before)',
      color: '#E05A00', bg: '#FFF0E8',
      itemsAr: ['موزة + ملعقة زبدة فول سوداني', 'شوفان بالحليب + فاكهة', 'خبز أسمر + بيضة مسلوقة'],
      itemsEn: ['Banana + 1 tbsp peanut butter', 'Oatmeal with milk + fruit', 'Whole wheat bread + boiled egg'],
    },
    {
      titleAr: '🥤 وجبة ما بعد التمرين (خلال 30 دقيقة)',
      titleEn: '🥤 Post-Workout Meal (within 30 minutes)',
      color: '#7C3AED', bg: '#F0E8FF',
      itemsAr: ['بروتين شيك + موزة', 'زبادي يوناني + عسل + مكسرات', 'صدر دجاج + أرز بني + خضار'],
      itemsEn: ['Protein shake + banana', 'Greek yogurt + honey + nuts', 'Chicken breast + brown rice + vegetables'],
    },
    {
      titleAr: '💧 الماء والترطيب',
      titleEn: '💧 Water & Hydration',
      color: '#0891B2', bg: '#E0F7FA',
      itemsAr: gender === 'female' ? ['2.5-3 لتر ماء يومياً', 'اشربي 500 مل قبل التمرين', 'اشربي كل 15-20 دقيقة أثناء التمرين', '500 مل بعد التمرين لإعادة الترطيب'] : ['2.5-3 لتر ماء يومياً', 'اشرب 500 مل قبل التمرين', 'اشرب كل 15-20 دقيقة أثناء التمرين', '500 مل بعد التمرين لإعادة الترطيب'],
      itemsEn: ['2.5–3 liters of water daily', 'Drink 500 ml before workout', 'Drink every 15–20 minutes during workout', '500 ml after workout to rehydrate'],
    },
    {
      titleAr: '🥩 البروتين اليومي',
      titleEn: '🥩 Daily Protein',
      color: '#DC2626', bg: '#FFE8E8',
      itemsAr: ['1.6-2 جرام بروتين لكل كجم من وزنك', 'مصادر: دجاج، سمك، بيض، زبادي، بقوليات', 'وزّعي البروتين على 4-5 وجبات', 'هدفك: 116-145 جرام بروتين يومياً'],
      itemsEn: ['1.6–2 g protein per kg of body weight', 'Sources: chicken, fish, eggs, yogurt, legumes', 'Spread protein across 4–5 meals', 'Target: 116–145 g protein per day'],
    },
    {
      titleAr: '🚫 تجنبي',
      titleEn: '🚫 Avoid',
      color: '#8A8AAA', bg: '#F4F6F8',
      itemsAr: ['السكريات المضافة والمشروبات الغازية', 'الأطعمة المقلية والمعالجة', 'الوجبات الكبيرة قبل النوم مباشرة', 'تخطي وجبة الإفطار'],
      itemsEn: ['Added sugars and carbonated drinks', 'Fried and processed foods', 'Large meals right before bed', 'Skipping breakfast'],
    },
  ];

  const planTips = ar
    ? [
        'الجدول مرن - سجّلي حضورك في أي يوم وأي وقت',
        'لا تتخطي أكثر من يومين متتاليين بدون تمرين',
        'الأكوا والسونا يمكن إضافتهما في أي يوم كإضافة',
        'زيدي الأوزان تدريجياً كل أسبوعين',
      ]
    : [
        'The schedule is flexible — log your attendance any day, any time',
        'Do not skip more than 2 consecutive days without exercise',
        'Aqua and Sauna sessions can be added on any day as a bonus',
        'Increase weights gradually every two weeks',
      ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 20,
            border: 'none', cursor: 'pointer',
            fontFamily: ar ? 'Cairo, sans-serif' : 'Inter, system-ui, sans-serif',
            fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
            background: tab === t.id ? '#E05A00' : 'white',
            color: tab === t.id ? 'white' : '#4A4A6A',
            boxShadow: tab === t.id ? '0 4px 12px #E05A0044' : '0 2px 6px rgba(0,0,0,0.06)',
          }}>
            {t.icon} {ar ? t.labelAr : t.labelEn}
          </button>
        ))}
      </div>

      {/* ── PLAN TAB ── */}
      {tab === 'plan' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #1A1A2E, #2D2D4E)',
            borderRadius: 16, padding: '16px 18px', marginBottom: 14, color: 'white',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900 }}>
              📋 {ar ? 'خطة التمرين الأسبوعية' : 'Weekly Workout Plan'}
            </h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 12 }}>
              {ar
                ? '5 أيام تدريب + يوم أكوا + يوم سونا + يوم راحة. الجدول مرن - سجّلي حضورك متى أردتِ.'
                : '5 training days + aqua day + sauna day + rest day. The schedule is flexible — log attendance whenever you want.'}
            </p>
          </div>

          {/* Weekly Template */}
          {weeklyPlan.map((item, i) => {
            const def = sessionTypes[item.type];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: `2px solid ${def.bgColor}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: def.bgColor, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22,
                }}>{def.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, color: '#1A1A2E' }}>
                    {ar ? item.dayAr : item.dayEn}
                  </div>
                  <div style={{ fontSize: 11, color: def.color, marginTop: 2 }}>
                    {ar ? item.noteAr : item.noteEn}
                  </div>
                </div>
                <div style={{
                  background: def.bgColor, color: def.color,
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                }}>
                  {ar
                    ? def.nameAr.split(' - ')[0].split(' ').slice(0, 2).join(' ')
                    : (sessionTypeNameEn[item.type] || def.nameAr.split(' - ')[0])}
                </div>
              </div>
            );
          })}

          {/* Tips */}
          <div style={{
            background: '#FFF0E8', borderRadius: 14, padding: '14px 16px', marginTop: 14,
            borderRight: isRTL ? '4px solid #E05A00' : 'none',
            borderLeft: isRTL ? 'none' : '4px solid #E05A00',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#E05A00', fontSize: 13 }}>
              💡 {ar ? 'نصائح للجدول' : 'Schedule Tips'}
            </h4>
            {planTips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#E05A00', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: '#4A4A6A' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXERCISES TAB ── */}
      {tab === 'exercises' && (
        <div>
          {/* Type Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {typeOrder.map(type => {
              const def = sessionTypes[type];
              return (
                <button key={type} onClick={() => setSelectedType(type)} style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  border: `2px solid ${selectedType === type ? def.color : '#E2E8F0'}`,
                  background: selectedType === type ? def.bgColor : 'white',
                  color: selectedType === type ? def.color : '#4A4A6A',
                  fontFamily: ar ? 'Cairo, sans-serif' : 'Inter, system-ui, sans-serif',
                  fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}>
                  {def.icon} {ar
                    ? def.nameAr.split(' - ')[0].split(' ').slice(0, 2).join(' ')
                    : (sessionTypeNameEn[type] || def.nameAr.split(' - ')[0])}
                </button>
              );
            })}
          </div>

          {/* Exercise Cards */}
          {masterExercises
            .filter(ex => ex.sessionTypes.includes(selectedType))
            .map(ex => {
              const isExpanded = expandedEx === ex.id;
              return (
                <div key={ex.id} style={{
                  background: 'white', borderRadius: 14, marginBottom: 8,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: `2px solid ${isExpanded ? sessionTypes[selectedType].color : '#F0F0F0'}`,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                  >
                    <img src={ex.image} alt={ar ? ex.nameAr : ex.nameEn} style={{
                      width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>
                        {ar ? ex.nameAr : ex.nameEn}
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
                        {ar ? ex.muscleGroup : (muscleGroupEn[ex.muscleGroup] || ex.muscleGroup)}
                      </div>
                      <div style={{ fontSize: 11, color: sessionTypes[selectedType].color, marginTop: 2 }}>
                        {ex.defaultSets} {ar ? 'جولات' : 'sets'} × {ex.defaultReps} • {ex.defaultWeight}
                      </div>
                    </div>
                    <span style={{ color: '#8A8AAA' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{
                      padding: '12px 14px', borderTop: '1px solid #F0F0F0',
                      background: '#FAFAFA',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                        {[
                          { labelAr: 'الجولات',   labelEn: 'Sets',   value: `${ex.defaultSets}` },
                          { labelAr: 'التكرارات', labelEn: 'Reps',   value: ex.defaultReps },
                          { labelAr: 'الوزن',     labelEn: 'Weight', value: ex.defaultWeight },
                          { labelAr: 'الراحة',    labelEn: 'Rest',   value: `${ex.restSeconds}s` },
                          { labelAr: 'العضلة',    labelEn: 'Muscle', value: ar ? ex.muscleGroup : (muscleGroupEn[ex.muscleGroup] || ex.muscleGroup) },
                        ].map(s => (
                          <div key={s.labelEn} style={{
                            background: 'white', borderRadius: 8, padding: '8px 10px',
                            border: '1px solid #F0F0F0',
                          }}>
                            <div style={{ fontSize: 10, color: '#8A8AAA' }}>{ar ? s.labelAr : s.labelEn}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginTop: 2 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        background: '#FFF0E8', borderRadius: 10, padding: '10px 12px',
                        borderRight: isRTL ? '3px solid #E05A00' : 'none',
                        borderLeft: isRTL ? 'none' : '3px solid #E05A00',
                        marginBottom: 10,
                      }}>
                        <span style={{ fontSize: 11, color: '#E05A00', fontWeight: 700 }}>
                          💡 {ar ? 'نصيحة: ' : 'Tip: '}
                        </span>
                        <span style={{ fontSize: 11, color: '#4A4A6A' }}>
                          {ar ? ex.tip : (ex.tipEn || ex.tip)}
                        </span>
                      </div>
                      {ex.youtubeUrl && (
                        <a
                          href={ex.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#FF0000', color: 'white',
                            borderRadius: 10, padding: '10px 14px',
                            textDecoration: 'none', fontWeight: 700, fontSize: 13,
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>▶</span>
                          {ar ? 'شاهدي شرح التمرين الصحيح على يوتيوب' : 'Watch exercise tutorial on YouTube'}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ── AQUA TAB ── */}
      {tab === 'aqua' && (
        <div>
          <div style={{
            borderRadius: 16, overflow: 'hidden', marginBottom: 14,
            boxShadow: '0 4px 16px rgba(8,145,178,0.2)',
          }}>
            <img src="/manus-storage/aqua_690009c3.jpg" alt="Aqua Aerobics" style={{
              width: '100%', height: 180, objectFit: 'cover',
            }} />
          </div>
          <div style={{
            background: '#E0F7FA', borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            borderRight: isRTL ? '4px solid #0891B2' : 'none',
            borderLeft: isRTL ? 'none' : '4px solid #0891B2',
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#0891B2', fontSize: 15, fontWeight: 900 }}>
              🏊‍♀️ {ar ? 'كلاس الأكوا - فوائد ومعلومات' : 'Aqua Class — Benefits & Info'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#0891B2' }}>
              {ar
                ? 'تمارين الأكوا تحرق 400-600 سعرة/ساعة مع ضغط أقل على المفاصل. مثالية لحرق دهون الأرداف والبطن.'
                : 'Aqua exercises burn 400–600 calories/hour with less joint stress. Ideal for burning glutes and belly fat.'}
            </p>
          </div>
          <h4 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 14 }}>
            {ar ? 'تمارين الكلاس (45 دقيقة):' : 'Class Exercises (45 minutes):'}
          </h4>
          {aquaData.map((ex, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              border: '2px solid #B2EBF2', boxShadow: '0 2px 6px rgba(8,145,178,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0891B2' }}>
                  {ar ? ex.nameAr : ex.nameEn}
                </div>
                <div style={{
                  background: '#E0F7FA', color: '#0891B2',
                  borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{ex.duration}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4 }}>
                💡 {ar ? ex.tipAr : ex.tipEn}
              </div>
            </div>
          ))}
          <div style={{
            background: '#E0F7FA', borderRadius: 12, padding: '12px 14px', marginTop: 8,
            border: '1px solid #B2EBF2',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#0891B2', fontSize: 13 }}>
              🎽 {ar ? 'ما تحتاجينه:' : 'What you need:'}
            </h4>
            {(ar
              ? ['مايوه رياضي مريح', 'نظارة سباحة (اختياري)', 'حذاء مائي للحماية', 'منشفة وزجاجة ماء', 'دمبلز مائية (يوفرها النادي عادةً)']
              : ['Comfortable swimsuit', 'Swimming goggles (optional)', 'Water shoes for protection', 'Towel and water bottle', 'Water dumbbells (usually provided by the gym)']
            ).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#0891B2' }}>✓</span>
                <span style={{ fontSize: 12, color: '#4A4A6A' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAUNA TAB ── */}
      {tab === 'sauna' && (
        <div>
          <div style={{
            borderRadius: 16, overflow: 'hidden', marginBottom: 14,
            boxShadow: '0 4px 16px rgba(180,83,9,0.2)',
          }}>
            <img src="/manus-storage/sauna_b9935cdb.jpg" alt="Sauna" style={{
              width: '100%', height: 180, objectFit: 'cover',
            }} />
          </div>
          <div style={{
            background: '#FEF3C7', borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            borderRight: isRTL ? '4px solid #B45309' : 'none',
            borderLeft: isRTL ? 'none' : '4px solid #B45309',
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#B45309', fontSize: 15, fontWeight: 900 }}>
              🧖‍♀️ {ar ? 'السونا - فوائد ومعلومات' : 'Sauna — Benefits & Info'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#B45309' }}>
              {ar
                ? 'السونا تحرق 200-400 سعرة/جلسة، تحسّن الدورة الدموية، تريح العضلات بعد التمرين، وتساعد في إزالة السموم.'
                : 'Sauna burns 200–400 calories/session, improves blood circulation, relaxes muscles after workout, and helps detoxify.'}
            </p>
          </div>
          <h4 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 14 }}>
            {ar ? 'بروتوكول الجلسة المثالية:' : 'Ideal Session Protocol:'}
          </h4>
          {saunaData.map((p, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              border: '2px solid #FDE68A', boxShadow: '0 2px 6px rgba(180,83,9,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#B45309' }}>
                  {i + 1}. {ar ? p.phaseAr : p.phaseEn}
                </div>
                <div style={{
                  background: '#FEF3C7', color: '#B45309',
                  borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{p.duration}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4 }}>🌡 {p.temp}</div>
              <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 3 }}>
                💡 {ar ? p.tipAr : p.tipEn}
              </div>
            </div>
          ))}
          <div style={{
            background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', marginTop: 8,
            border: '1px solid #FDE68A',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#B45309', fontSize: 13 }}>
              ⚠️ {ar ? 'تحذيرات مهمة:' : 'Important Warnings:'}
            </h4>
            {(ar
              ? (gender === 'female' ? ['اشربي 500 مل ماء قبل الدخول وبعده', 'لا تدخلي مباشرة بعد وجبة كبيرة', 'إذا شعرتِ بدوار اخرجي فوراً', 'لا تتجاوزي 20 دقيقة في جلسة واحدة'] : ['اشرب 500 مل ماء قبل الدخول وبعده', 'لا تدخل مباشرة بعد وجبة كبيرة', 'إذا شعرت بدوار اخرج فوراً', 'لا تتجاوز 20 دقيقة في جلسة واحدة'])
              : ['Drink 500 ml water before and after entering', 'Do not enter immediately after a large meal', 'If you feel dizzy, exit immediately', 'Do not exceed 20 minutes in a single session']
            ).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#B45309' }}>⚠</span>
                <span style={{ fontSize: 12, color: '#4A4A6A' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NUTRITION TAB ── */}
      {tab === 'nutrition' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #1A7A4A, #2EA86A)',
            borderRadius: 16, padding: '16px 18px', marginBottom: 14, color: 'white',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900 }}>
              🥗 {ar ? 'النصائح الغذائية' : 'Nutrition Tips'}
            </h3>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 12 }}>
              {ar
                ? 'لخسارة 7.6 كجم في 8 أسابيع: عجز يومي 500-700 سعرة مع بروتين كافٍ للحفاظ على العضلات'
                : 'To lose 7.6 kg in 8 weeks: daily deficit of 500–700 calories with enough protein to preserve muscle'}
            </p>
          </div>

          {nutritionSections.map((section, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              border: `2px solid ${section.bg}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}>
              <h4 style={{ margin: '0 0 10px', color: section.color, fontSize: 13 }}>
                {ar ? section.titleAr : section.titleEn}
              </h4>
              {(ar ? section.itemsAr : section.itemsEn).map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: section.color, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 12, color: '#4A4A6A' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
