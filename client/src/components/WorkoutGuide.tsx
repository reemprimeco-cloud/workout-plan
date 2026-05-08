// WorkoutGuide - Reference guide for exercises, sauna, aqua, and nutrition
import { useState } from 'react';
import { masterExercises, aquaExercises, saunaProtocol, sessionTypes } from '../data/exercises';
import type { SessionType } from '../data/exercises';

type GuideTab = 'plan' | 'exercises' | 'aqua' | 'sauna' | 'nutrition';

export function WorkoutGuide() {
  const [tab, setTab] = useState<GuideTab>('plan');
  const [selectedType, setSelectedType] = useState<SessionType>('lower_body');
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  const tabs: { id: GuideTab; icon: string; label: string }[] = [
    { id: 'plan', icon: '📅', label: 'الخطة' },
    { id: 'exercises', icon: '🏋️‍♀️', label: 'التمارين' },
    { id: 'aqua', icon: '🏊‍♀️', label: 'الأكوا' },
    { id: 'sauna', icon: '🧖‍♀️', label: 'السونا' },
    { id: 'nutrition', icon: '🥗', label: 'التغذية' },
  ];

  const typeOrder: SessionType[] = ['lower_body', 'upper_arms', 'core_cardio', 'chest_shoulders', 'full_body'];

  return (
    <div>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 20,
            border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
            background: tab === t.id ? '#E05A00' : 'white',
            color: tab === t.id ? 'white' : '#4A4A6A',
            boxShadow: tab === t.id ? '0 4px 12px #E05A0044' : '0 2px 6px rgba(0,0,0,0.06)',
          }}>
            {t.icon} {t.label}
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
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900 }}>📋 خطة التمرين الأسبوعية</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 12 }}>
              5 أيام تدريب + يوم أكوا + يوم سونا + يوم راحة. الجدول مرن - سجّلي حضورك متى أردتِ.
            </p>
          </div>

          {/* Weekly Template */}
          {[
            { day: 'الأحد', type: 'lower_body' as SessionType, note: 'الأرداف والفخذين' },
            { day: 'الاثنين', type: 'upper_arms' as SessionType, note: 'الذراعان والظهر' },
            { day: 'الثلاثاء', type: 'aqua' as SessionType, note: 'كلاس الأكوا 45 دقيقة' },
            { day: 'الأربعاء', type: 'core_cardio' as SessionType, note: 'البطن والكور' },
            { day: 'الخميس', type: 'chest_shoulders' as SessionType, note: 'الصدر والأكتاف' },
            { day: 'الجمعة', type: 'sauna' as SessionType, note: 'جلسة سونا للتعافي' },
            { day: 'السبت', type: 'active_rest' as SessionType, note: 'راحة أو مشي خفيف' },
          ].map((item, i) => {
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
                  <div style={{ fontWeight: 900, fontSize: 13, color: '#1A1A2E' }}>{item.day}</div>
                  <div style={{ fontSize: 11, color: def.color, marginTop: 2 }}>{item.note}</div>
                </div>
                <div style={{
                  background: def.bgColor, color: def.color,
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                }}>
                  {def.nameAr.split(' - ')[0].split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            );
          })}

          {/* Tips */}
          <div style={{
            background: '#FFF0E8', borderRadius: 14, padding: '14px 16px', marginTop: 14,
            borderRight: '4px solid #E05A00',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#E05A00', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
              💡 نصائح للجدول
            </h4>
            {[
              'الجدول مرن - سجّلي حضورك في أي يوم وأي وقت',
              'لا تتخطي أكثر من يومين متتاليين بدون تمرين',
              'الأكوا والسونا يمكن إضافتهما في أي يوم كإضافة',
              'زيدي الأوزان تدريجياً كل أسبوعين',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#E05A00', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{tip}</span>
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
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}>
                  {def.icon} {def.nameAr.split(' - ')[0].split(' ').slice(0, 2).join(' ')}
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
                    <img src={ex.image} alt={ex.nameAr} style={{
                      width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>{ex.nameAr}</div>
                      <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>{ex.muscleGroup}</div>
                      <div style={{ fontSize: 11, color: sessionTypes[selectedType].color, marginTop: 2 }}>
                        {ex.defaultSets} جولات × {ex.defaultReps} • {ex.defaultWeight}
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
                          { label: 'الجولات', value: `${ex.defaultSets}` },
                          { label: 'التكرارات', value: ex.defaultReps },
                          { label: 'الوزن', value: ex.defaultWeight },
                          { label: 'الراحة', value: `${ex.restSeconds}ث` },
                          { label: 'العضلة', value: ex.muscleGroup },
                        ].map(s => (
                          <div key={s.label} style={{
                            background: 'white', borderRadius: 8, padding: '8px 10px',
                            border: '1px solid #F0F0F0',
                          }}>
                            <div style={{ fontSize: 10, color: '#8A8AAA' }}>{s.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginTop: 2 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        background: '#FFF0E8', borderRadius: 10, padding: '10px 12px',
                        borderRight: '3px solid #E05A00', marginBottom: 10,
                      }}>
                        <span style={{ fontSize: 11, color: '#E05A00', fontWeight: 700 }}>💡 نصيحة: </span>
                        <span style={{ fontSize: 11, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{ex.tip}</span>
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
                          شاهدي شرح التمرين الصحيح على يوتيوب
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
            borderRight: '4px solid #0891B2',
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#0891B2', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
              🏊‍♀️ كلاس الأكوا - فوائد ومعلومات
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#0891B2', fontFamily: 'Tajawal, sans-serif' }}>
              تمارين الأكوا تحرق 400-600 سعرة/ساعة مع ضغط أقل على المفاصل. مثالية لحرق دهون الأرداف والبطن.
            </p>
          </div>
          <h4 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
            تمارين الكلاس (45 دقيقة):
          </h4>
          {aquaExercises.map((ex, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              border: '2px solid #B2EBF2', boxShadow: '0 2px 6px rgba(8,145,178,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0891B2' }}>{ex.nameAr}</div>
                <div style={{
                  background: '#E0F7FA', color: '#0891B2',
                  borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{ex.duration}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4, fontFamily: 'Tajawal, sans-serif' }}>
                💡 {ex.tip}
              </div>
            </div>
          ))}
          <div style={{
            background: '#E0F7FA', borderRadius: 12, padding: '12px 14px', marginTop: 8,
            border: '1px solid #B2EBF2',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#0891B2', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
              🎽 ما تحتاجينه:
            </h4>
            {['مايوه رياضي مريح', 'نظارة سباحة (اختياري)', 'حذاء مائي للحماية', 'منشفة وزجاجة ماء', 'دمبلز مائية (يوفرها النادي عادةً)'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#0891B2' }}>✓</span>
                <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{item}</span>
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
            borderRight: '4px solid #B45309',
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#B45309', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
              🧖‍♀️ السونا - فوائد ومعلومات
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#B45309', fontFamily: 'Tajawal, sans-serif' }}>
              السونا تحرق 200-400 سعرة/جلسة، تحسّن الدورة الدموية، تريح العضلات بعد التمرين، وتساعد في إزالة السموم.
            </p>
          </div>
          <h4 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
            بروتوكول الجلسة المثالية:
          </h4>
          {saunaProtocol.map((p, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              border: '2px solid #FDE68A', boxShadow: '0 2px 6px rgba(180,83,9,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#B45309' }}>
                  {i + 1}. {p.phase}
                </div>
                <div style={{
                  background: '#FEF3C7', color: '#B45309',
                  borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{p.duration}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 4 }}>🌡 {p.temp}</div>
              <div style={{ fontSize: 11, color: '#4A4A6A', marginTop: 3, fontFamily: 'Tajawal, sans-serif' }}>
                💡 {p.tip}
              </div>
            </div>
          ))}
          <div style={{
            background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', marginTop: 8,
            border: '1px solid #FDE68A',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#B45309', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
              ⚠️ تحذيرات مهمة:
            </h4>
            {[
              'اشربي 500 مل ماء قبل الدخول وبعده',
              'لا تدخلي مباشرة بعد وجبة كبيرة',
              'إذا شعرتِ بدوار اخرجي فوراً',
              'لا تتجاوزي 20 دقيقة في جلسة واحدة',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#B45309' }}>⚠</span>
                <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{item}</span>
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
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900 }}>🥗 النصائح الغذائية</h3>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 12 }}>
              لخسارة 7.6 كجم في 8 أسابيع: عجز يومي 500-700 سعرة مع بروتين كافٍ للحفاظ على العضلات
            </p>
          </div>

          {[
            {
              title: '🍳 وجبة ما قبل التمرين (1-2 ساعة قبل)',
              color: '#E05A00', bg: '#FFF0E8',
              items: ['موزة + ملعقة زبدة فول سوداني', 'شوفان بالحليب + فاكهة', 'خبز أسمر + بيضة مسلوقة'],
            },
            {
              title: '🥤 وجبة ما بعد التمرين (خلال 30 دقيقة)',
              color: '#7C3AED', bg: '#F0E8FF',
              items: ['بروتين شيك + موزة', 'زبادي يوناني + عسل + مكسرات', 'صدر دجاج + أرز بني + خضار'],
            },
            {
              title: '💧 الماء والترطيب',
              color: '#0891B2', bg: '#E0F7FA',
              items: ['2.5-3 لتر ماء يومياً', 'اشربي 500 مل قبل التمرين', 'اشربي كل 15-20 دقيقة أثناء التمرين', '500 مل بعد التمرين لإعادة الترطيب'],
            },
            {
              title: '🥩 البروتين اليومي',
              color: '#DC2626', bg: '#FFE8E8',
              items: ['1.6-2 جرام بروتين لكل كجم من وزنك', 'مصادر: دجاج، سمك، بيض، زبادي، بقوليات', 'وزّعي البروتين على 4-5 وجبات', 'هدفك: 116-145 جرام بروتين يومياً'],
            },
            {
              title: '🚫 تجنبي',
              color: '#8A8AAA', bg: '#F4F6F8',
              items: ['السكريات المضافة والمشروبات الغازية', 'الأطعمة المقلية والمعالجة', 'الوجبات الكبيرة قبل النوم مباشرة', 'تخطي وجبة الإفطار'],
            },
          ].map((section, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              border: `2px solid ${section.bg}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}>
              <h4 style={{ margin: '0 0 10px', color: section.color, fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
                {section.title}
              </h4>
              {section.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: section.color, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
