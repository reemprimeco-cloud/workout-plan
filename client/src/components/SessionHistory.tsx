// SessionHistory - Full log of all gym sessions
import { useState } from 'react';
import type { GymSession } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import { useLanguage } from '../contexts/LanguageContext';
import { AppIcons } from './AppIcons';
import { toAsciiDigits } from '../lib/calorieCalc';

interface Props {
  sessions: GymSession[];
  onDelete: (id: string) => void;
  onDeleteExercise?: (sessionId: string, exerciseIdx: number) => void;
  onDeleteCardio?: (sessionId: string) => void;
}

export function SessionHistory({ sessions, onDelete, onDeleteExercise, onDeleteCardio }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const completed = sessions.filter(s => !s.isActive).sort((a, b) =>
    b.date.localeCompare(a.date) || b.checkInTime.localeCompare(a.checkInTime)
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getDuration = (s: GymSession) => {
    if (!s.checkOutTime) return '—';
    const [ih, im] = toAsciiDigits(s.checkInTime).split(':').map(Number);
    const [oh, om] = toAsciiDigits(s.checkOutTime).split(':').map(Number);
    if (isNaN(ih) || isNaN(im) || isNaN(oh) || isNaN(om)) return '—';
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (isAr) return h > 0 ? `${h}س ${m}د` : `${m} دقيقة`;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  if (completed.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 20, padding: '40px 20px',
        textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><AppIcons.Clipboard size={60} className="text-[#506A88]" /></div>
        <h3 style={{ color: '#1B2E5E', fontFamily: 'Tajawal, Inter, sans-serif' }}>{isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}</h3>
        <p style={{ color: '#506A88', fontFamily: 'Tajawal, sans-serif', fontSize: 14 }}>
          {isAr ? 'ابدئي أول جلسة من الصفحة الرئيسية وسيظهر سجلها هنا' : 'Start your first session from the home page and it will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#1B2E5E', fontFamily: 'Tajawal, Inter, sans-serif', fontSize: 17, fontWeight: 800 }}>
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Clipboard size={20} />{isAr ? 'سجل الجلسات' : 'Session History'} ({completed.length})</span>
        </h3>
      </div>

      {completed.map(session => {
        const typeDef = sessionTypes[session.sessionType];
        const isExpanded = expandedId === session.id;
        const completedExercises = session.exercises.filter(e => e.completed).length;

        return (
          <div key={session.id} style={{
            background: 'white', borderRadius: 16, marginBottom: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: `2px solid ${isExpanded ? typeDef.color : '#D0DFF0'}`,
            overflow: 'hidden', transition: 'border-color 0.2s',
          }}>
            {/* Header Row */}
            <div
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: typeDef.bgColor, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22,
                border: `2px solid ${typeDef.color}33`,
              }}>
                <AppIcons.Dumbbell size={22} color={typeDef.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1B2E5E' }}>
                  {isAr ? typeDef.nameAr.split(' - ')[0] : typeDef.nameEn}
                </div>
                <div style={{ fontSize: 11, color: '#506A88', marginTop: 2 }}>
                  {formatDate(session.date)} • {session.checkInTime}
                  {session.checkOutTime && ` - ${session.checkOutTime}`}
                  {' • '}{getDuration(session)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  {(session.mood as string) === 'sleep' || (session.mood as string) === '😴' ? <AppIcons.Moon size={16} /> :
                   (session.mood as string) === 'neutral' || (session.mood as string) === '😐' ? <AppIcons.Minus size={16} /> :
                   (session.mood as string) === 'strong' || (session.mood as string) === '💪' ? <AppIcons.Dumbbell size={16} /> :
                   (session.mood as string) === 'fire' || (session.mood as string) === '🔥' ? <AppIcons.Flame size={16} /> :
                   <AppIcons.Smile size={16} />}
                </div>
                {session.exercises.length > 0 && (
                  <div style={{
                    fontSize: 11, color: typeDef.color, fontWeight: 700,
                    background: typeDef.bgColor, borderRadius: 6, padding: '2px 6px',
                  }}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4}}>{completedExercises}/{session.exercises.length}<AppIcons.Check size={12} /></span>
                  </div>
                )}
              </div>
              <span style={{ color: '#506A88', fontSize: 14 }}>{isExpanded ? <AppIcons.ChevronUp size={14} /> : <AppIcons.ChevronDown size={14} />}</span>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #D0DFF0', padding: '14px 16px', background: '#FAFAFA' }}>
                {/* Exercises */}
                {session.exercises.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#1B2E5E', fontFamily: 'Tajawal, Inter, sans-serif' }}>
                      {isAr ? 'التمارين' : 'Exercises'}:
                    </h4>
                    {session.exercises.map((ex, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 8,
                        background: ex.completed ? `${typeDef.color}10` : 'white',
                        marginBottom: 4, border: '1px solid #D0DFF0',
                      }}>
                        <span style={{ color: ex.completed ? typeDef.color : '#D0D0E0', fontSize: 14 }}>
                          <span style={{display:'inline-flex'}}>{ex.completed ? <AppIcons.Check size={14} className='text-green-500' /> : <AppIcons.Square size={14} className='text-[#506A88]' />}</span>
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: '#1B2E5E',
                          }}>{isAr ? ex.nameAr : (ex.nameEn || ex.nameAr)}</span>
                          <span style={{ fontSize: 11, color: '#506A88', marginRight: 8 }}>
                            {ex.sets}×{ex.reps} • {ex.weight}
                          </span>
                        </div>
                        {ex.notes && <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize: 11,color:'#506A88'}}><AppIcons.Notes size={10} />{ex.notes}</span>}
                        {onDeleteExercise && (
                          <button
                            onClick={() => onDeleteExercise(session.id, i)}
                            title={isAr ? 'حذف التمرين' : 'Delete exercise'}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '2px 4px', borderRadius: 6, fontSize: 14,
                              color: '#B45309', opacity: 0.7, flexShrink: 0,
                              lineHeight: 1,
                            }}
                          ><AppIcons.Trash size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Cardio */}
                {session.cardio && (
                  <div style={{
                    background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    border: '1px solid #D0DFF0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2E5E' }}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><AppIcons.Running size={14} />{isAr ? session.cardio.nameAr : (session.cardio.nameEn || session.cardio.nameAr)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#506A88', marginTop: 3 }}>
                        {session.cardio.duration} {isAr ? 'د' : 'min'} • {session.cardio.speed}
                        {session.cardio.distanceKm && ` • ${session.cardio.distanceKm} ${isAr ? 'كم' : 'km'}`}
                        {session.cardio.caloriesBurned && ` • ${session.cardio.caloriesBurned} ${isAr ? 'سعرة' : 'kcal'}`}
                      </div>
                    </div>
                    {onDeleteCardio && (
                      <button
                        onClick={() => onDeleteCardio(session.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 16, padding: '4px 8px', color: '#aaa',
                          flexShrink: 0,
                        }}
                        title={isAr ? 'حذف الكارديو' : 'Remove cardio'}
                      >
                        
                      </button>
                    )}
                  </div>
                )}

                {/* Aqua */}
                {session.aqua && (
                  <div style={{
                    background: '#E0F7FA', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    border: '1px solid #B2EBF2',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0891B2' }}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:6}}><AppIcons.Swimming size={14} />{isAr ? 'كلاس الأكوا' : 'Aqua Aerobics'}</span> • {session.aqua.duration} {isAr ? 'دقيقة' : 'min'} • {session.aqua.intensity}
                    </div>
                  </div>
                )}

                {/* Sauna */}
                {session.sauna && (
                  <div style={{
                    background: '#FEF3C7', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    border: '1px solid #FDE68A',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:6}}><AppIcons.Spa size={14} />{isAr ? 'السونا' : 'Sauna'}</span> • {session.sauna.totalMinutes} {isAr ? 'دقيقة' : 'min'} • {session.sauna.rounds} {isAr ? 'جولات' : 'rounds'}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {session.notes && (
                  <div style={{
                    background: '#F3F7FB', borderRadius: 10, padding: '8px 12px', marginBottom: 12,
                    fontSize: 12, color: '#3D5A80', fontFamily: 'Tajawal, Inter, sans-serif',
                  }}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:6}}><AppIcons.Notes size={12} />{session.notes}</span>
                  </div>
                )}

                {/* Delete */}
                {confirmDelete === session.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { onDelete(session.id); setConfirmDelete(null); }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: '#DC2626', color: 'white', border: 'none',
                        fontFamily: 'Tajawal, Inter, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}
                    >{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: 'white', color: '#3D5A80', border: '1px solid #D0DFF0',
                        fontFamily: 'Tajawal, Inter, sans-serif', fontSize: 12, cursor: 'pointer',
                      }}
                    >{isAr ? 'إلغاء' : 'Cancel'}</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(session.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: '#FFF5F5', color: '#DC2626',
                      border: '1px solid #FFE0E0',
                      fontFamily: 'Tajawal, Inter, sans-serif', fontSize: 12, cursor: 'pointer',
                    }}
                  ><span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Trash size={14} />{isAr ? 'حذف الجلسة' : 'Delete Session'}</span></button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
