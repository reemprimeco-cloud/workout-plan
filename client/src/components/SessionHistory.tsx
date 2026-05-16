// SessionHistory - Full log of all gym sessions
import { useState } from 'react';
import type { GymSession } from '../hooks/useGymTracker';
import { sessionTypes } from '../data/exercises';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  sessions: GymSession[];
  onDelete: (id: string) => void;
  onDeleteExercise?: (sessionId: string, exerciseIdx: number) => void;
}

export function SessionHistory({ sessions, onDelete, onDeleteExercise }: Props) {
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
    const [ih, im] = s.checkInTime.split(':').map(Number);
    const [oh, om] = s.checkOutTime.split(':').map(Number);
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
        <div style={{ fontSize: 60, marginBottom: 12 }}>📋</div>
        <h3 style={{ color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>{isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}</h3>
        <p style={{ color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif', fontSize: 14 }}>
          {isAr ? 'ابدئي أول جلسة من الصفحة الرئيسية وسيظهر سجلها هنا' : 'Start your first session from the home page and it will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif', fontSize: 17, fontWeight: 900 }}>
          📋 {isAr ? 'سجل الجلسات' : 'Session History'} ({completed.length})
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
            border: `2px solid ${isExpanded ? typeDef.color : '#F0F0F0'}`,
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
                {typeDef.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>
                  {isAr ? typeDef.nameAr.split(' - ')[0] : typeDef.nameEn}
                </div>
                <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
                  {formatDate(session.date)} • {session.checkInTime}
                  {session.checkOutTime && ` - ${session.checkOutTime}`}
                  {' • '}{getDuration(session)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 16 }}>{session.mood}</div>
                {session.exercises.length > 0 && (
                  <div style={{
                    fontSize: 10, color: typeDef.color, fontWeight: 700,
                    background: typeDef.bgColor, borderRadius: 6, padding: '2px 6px',
                  }}>
                    {completedExercises}/{session.exercises.length} ✓
                  </div>
                )}
              </div>
              <span style={{ color: '#8A8AAA', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #F0F0F0', padding: '14px 16px', background: '#FAFAFA' }}>
                {/* Exercises */}
                {session.exercises.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#1A1A2E', fontFamily: 'Cairo, sans-serif' }}>
                      {isAr ? 'التمارين' : 'Exercises'}:
                    </h4>
                    {session.exercises.map((ex, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 8,
                        background: ex.completed ? `${typeDef.color}10` : 'white',
                        marginBottom: 4, border: '1px solid #F0F0F0',
                      }}>
                        <span style={{ color: ex.completed ? typeDef.color : '#D0D0E0', fontSize: 14 }}>
                          {ex.completed ? '✅' : '⬜'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: '#1A1A2E',
                          }}>{isAr ? ex.nameAr : (ex.nameEn || ex.nameAr)}</span>
                          <span style={{ fontSize: 11, color: '#8A8AAA', marginRight: 8 }}>
                            {ex.sets}×{ex.reps} • {ex.weight}
                          </span>
                        </div>
                        {ex.notes && <span style={{ fontSize: 10, color: '#8A8AAA' }}>📝 {ex.notes}</span>}
                        {onDeleteExercise && (
                          <button
                            onClick={() => onDeleteExercise(session.id, i)}
                            title={isAr ? 'حذف التمرين' : 'Delete exercise'}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '2px 4px', borderRadius: 6, fontSize: 14,
                              color: '#E05A00', opacity: 0.7, flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >🗑️</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Cardio */}
                {session.cardio && (
                  <div style={{
                    background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    border: '1px solid #F0F0F0',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>
                      🏊‍♀️ {isAr ? session.cardio.nameAr : (session.cardio.nameEn || session.cardio.nameAr)}
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 3 }}>
                      {session.cardio.duration} {isAr ? 'د' : 'min'} • {session.cardio.speed}
                      {session.cardio.distanceKm && ` • ${session.cardio.distanceKm} ${isAr ? 'كم' : 'km'}`}
                      {session.cardio.caloriesBurned && ` • ${session.cardio.caloriesBurned} ${isAr ? 'سعرة' : 'kcal'}`}
                    </div>
                  </div>
                )}

                {/* Aqua */}
                {session.aqua && (
                  <div style={{
                    background: '#E0F7FA', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    border: '1px solid #B2EBF2',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0891B2' }}>
                      🏊‍♀️ {isAr ? 'كلاس الأكوا' : 'Aqua Aerobics'} • {session.aqua.duration} {isAr ? 'دقيقة' : 'min'} • {session.aqua.intensity}
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
                      🧖‍♀️ {isAr ? 'السونا' : 'Sauna'} • {session.sauna.totalMinutes} {isAr ? 'دقيقة' : 'min'} • {session.sauna.rounds} {isAr ? 'جولات' : 'rounds'}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {session.notes && (
                  <div style={{
                    background: '#F8F8F8', borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                    fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif',
                    borderRight: '3px solid #E05A00',
                  }}>
                    📝 {session.notes}
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
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}
                    >{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: 'white', color: '#4A4A6A', border: '1px solid #E2E8F0',
                        fontFamily: 'Cairo, sans-serif', fontSize: 12, cursor: 'pointer',
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
                      fontFamily: 'Cairo, sans-serif', fontSize: 12, cursor: 'pointer',
                    }}
                  >🗑 {isAr ? 'حذف الجلسة' : 'Delete Session'}</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
