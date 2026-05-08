// ActiveSession - Live workout session with editable exercises
import { useState, useEffect } from 'react';
import type { GymSession } from '../hooks/useGymTracker';
import type { useGymTracker } from '../hooks/useGymTracker';
import { sessionTypes, masterExercises, aquaExercises, saunaProtocol } from '../data/exercises';
import { WorkoutTimer } from './WorkoutTimer';

interface Props {
  session: GymSession;
  tracker: ReturnType<typeof useGymTracker>;
}

export function ActiveSession({ session, tracker }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const typeDef = sessionTypes[session.sessionType];

  // Elapsed time counter
  useEffect(() => {
    const start = new Date(`${session.date}T${session.checkInTime}`).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [session.checkInTime, session.date]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}س ${m % 60}د`;
    return `${m} دقيقة`;
  };

  const completedCount = session.exercises.filter(e => e.completed).length;
  const totalCount = session.exercises.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCheckOut = () => {
    setCheckingOut(true);
    tracker.checkOut(session.id, {
      mood: session.mood,
      energyLevel: session.energyLevel,
      notes: session.notes,
    });
  };

  return (
    <div style={{ animation: 'slideUp 0.3s ease' }}>
      {/* Session Header */}
      <div style={{
        background: `linear-gradient(135deg, ${typeDef.color}, ${typeDef.color}CC)`,
        borderRadius: 20, padding: '18px 20px', marginBottom: 14,
        color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{typeDef.icon}</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{typeDef.nameAr}</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 12 }}>
              ⏰ بدأتِ: {session.checkInTime} • مضى: {formatElapsed(elapsed)}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900,
            }}>
              {progressPct}%
            </div>
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>مكتمل</div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: 'white', borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>
              {completedCount} / {totalCount} تمرين مكتمل
            </div>
          </div>
        )}
      </div>

      {/* Timer Toggle */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setShowTimer(!showTimer)}
          style={{
            width: '100%', padding: '10px', borderRadius: 12,
            border: `2px solid ${showTimer ? typeDef.color : '#E2E8F0'}`,
            background: showTimer ? `${typeDef.color}10` : 'white',
            color: showTimer ? typeDef.color : '#4A4A6A',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          ⏱ {showTimer ? 'إخفاء المؤقت' : 'إظهار مؤقت الراحة'}
        </button>
        {showTimer && <div style={{ marginTop: 10 }}><WorkoutTimer defaultSeconds={60} /></div>}
      </div>

      {/* AQUA SESSION */}
      {session.sessionType === 'aqua' && session.aqua && (
        <AquaSessionPanel
          aqua={session.aqua}
          onUpdate={u => tracker.updateAqua(session.id, u)}
        />
      )}

      {/* SAUNA SESSION */}
      {session.sessionType === 'sauna' && session.sauna && (
        <SaunaSessionPanel
          sauna={session.sauna}
          onUpdate={u => tracker.updateSauna(session.id, u)}
        />
      )}

      {/* EXERCISES LIST */}
      {session.exercises.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
            🏋️‍♀️ التمارين ({session.exercises.length})
          </h3>
          {session.exercises.map((ex, idx) => {
            const exData = masterExercises.find(e => e.id === ex.exerciseId);
            return (
              <ExerciseCard
                key={idx}
                exercise={ex}
                idx={idx}
                color={typeDef.color}
                isEditing={editingIdx === idx}
                youtubeUrl={exData?.youtubeUrl}
                onToggle={() => tracker.toggleExercise(session.id, idx)}
                onEdit={() => setEditingIdx(editingIdx === idx ? null : idx)}
                onUpdate={u => tracker.updateExercise(session.id, idx, u)}
                onRemove={() => tracker.removeExercise(session.id, idx)}
              />
            );
          })}
        </div>
      )}

      {/* CARDIO */}
      {session.cardio && (
        <CardioCard
          cardio={session.cardio}
          color={typeDef.color}
          onUpdate={u => tracker.updateCardio(session.id, u)}
        />
      )}

      {/* Add Exercise Button */}
      {session.sessionType !== 'aqua' && session.sessionType !== 'sauna' && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowAddExercise(!showAddExercise)}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 12, border: `2px dashed ${typeDef.color}66`,
              background: `${typeDef.color}08`, color: typeDef.color,
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            + إضافة تمرين
          </button>
          {showAddExercise && (
            <AddExercisePanel
              color={typeDef.color}
              onAdd={ex => {
                tracker.addExerciseToSession(session.id, {
                  exerciseId: ex.id, nameAr: ex.nameAr,
                  sets: ex.defaultSets, reps: ex.defaultReps,
                  weight: ex.defaultWeight, restSeconds: ex.restSeconds,
                  completed: false, notes: '',
                });
                setShowAddExercise(false);
              }}
            />
          )}
        </div>
      )}

      {/* Session Notes & Mood */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px', marginBottom: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h4 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 14, fontWeight: 700 }}>
          📝 ملاحظات الجلسة
        </h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#4A4A6A', alignSelf: 'center' }}>المزاج:</span>
          {(['😴', '😐', '😊', '💪', '🔥'] as const).map(m => (
            <button key={m} onClick={() => tracker.updateSessionMeta(session.id, { mood: m })}
              style={{
                fontSize: 22, border: `2px solid ${session.mood === m ? typeDef.color : '#E2E8F0'}`,
                borderRadius: 10, padding: '4px 8px', cursor: 'pointer',
                background: session.mood === m ? `${typeDef.color}15` : 'white',
              }}>{m}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#4A4A6A', alignSelf: 'center' }}>الطاقة:</span>
          {([1, 2, 3, 4, 5] as const).map(n => (
            <button key={n} onClick={() => tracker.updateSessionMeta(session.id, { energyLevel: n })}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `2px solid ${session.energyLevel >= n ? typeDef.color : '#E2E8F0'}`,
                background: session.energyLevel >= n ? typeDef.color : 'white',
                color: session.energyLevel >= n ? 'white' : '#8A8AAA',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>{n}</button>
          ))}
        </div>
        <textarea
          value={session.notes}
          onChange={e => tracker.updateSessionMeta(session.id, { notes: e.target.value })}
          placeholder="ملاحظات، إصابات، تحسينات..."
          rows={2}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
            fontSize: 13, resize: 'none', outline: 'none',
          }}
        />
      </div>

      {/* Check Out Button */}
      <button
        onClick={handleCheckOut}
        disabled={checkingOut}
        style={{
          width: '100%', padding: '16px',
          background: checkingOut ? '#8A8AAA' : 'linear-gradient(135deg, #1A7A4A, #2EA86A)',
          color: 'white', border: 'none', borderRadius: 16,
          fontFamily: 'Cairo, sans-serif', fontWeight: 900, fontSize: 17,
          cursor: checkingOut ? 'not-allowed' : 'pointer',
          boxShadow: '0 6px 20px rgba(26,122,74,0.4)',
        }}
      >
        {checkingOut ? '⏳ جاري الحفظ...' : '✅ إنهاء الجلسة وحفظ التقدم'}
      </button>
    </div>
  );
}

// ── Exercise Card ──────────────────────────────────────────
function ExerciseCard({ exercise, idx, color, isEditing, onToggle, onEdit, onUpdate, onRemove, youtubeUrl }: {
  exercise: import('../hooks/useGymTracker').ExerciseLog;
  idx: number; color: string; isEditing: boolean;
  youtubeUrl?: string;
  onToggle: () => void; onEdit: () => void;
  onUpdate: (u: Partial<import('../hooks/useGymTracker').ExerciseLog>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      background: exercise.completed ? `${color}08` : 'white',
      borderRadius: 14, marginBottom: 8, overflow: 'hidden',
      border: `2px solid ${exercise.completed ? color : '#E8EAF0'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: `2px solid ${exercise.completed ? color : '#D0D0E0'}`,
            background: exercise.completed ? color : 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 0.2s',
          }}
        >
          {exercise.completed ? '✓' : ''}
        </button>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#1A1A2E',
            textDecoration: exercise.completed ? 'line-through' : 'none',
            opacity: exercise.completed ? 0.6 : 1,
          }}>
            {exercise.nameAr}
          </div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
            {exercise.sets} جولات × {exercise.reps} • {exercise.weight}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
              title="شاهدي شرح التمرين"
              style={{
                padding: '4px 8px', borderRadius: 8,
                border: '1px solid #FFD0D0', background: '#FFF0F0',
                color: '#FF0000', fontSize: 12, textDecoration: 'none',
                display: 'flex', alignItems: 'center', fontWeight: 700,
              }}>
              ▶
            </a>
          )}
          <button onClick={onEdit} style={{
            padding: '4px 8px', borderRadius: 8,
            border: `1px solid ${isEditing ? color : '#E2E8F0'}`,
            background: isEditing ? `${color}15` : 'white',
            color: isEditing ? color : '#8A8AAA',
            fontSize: 12, cursor: 'pointer',
          }}>✏️</button>
          <button onClick={onRemove} style={{
            padding: '4px 8px', borderRadius: 8,
            border: '1px solid #FFE0E0', background: '#FFF5F5',
            color: '#DC2626', fontSize: 12, cursor: 'pointer',
          }}>🗑</button>
        </div>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div style={{
          padding: '12px 14px', borderTop: '1px solid #F0F0F0',
          background: '#FAFAFA', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {[
            { label: 'الجولات', field: 'sets' as const, type: 'number', value: String(exercise.sets) },
            { label: 'التكرارات', field: 'reps' as const, type: 'text', value: exercise.reps },
            { label: 'الوزن', field: 'weight' as const, type: 'text', value: exercise.weight },
            { label: 'راحة (ث)', field: 'restSeconds' as const, type: 'number', value: String(exercise.restSeconds) },
          ].map(f => (
            <div key={f.field}>
              <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => onUpdate({ [f.field]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
                  fontSize: 13, outline: 'none', background: 'white',
                }}
              />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>ملاحظة</label>
            <input
              type="text"
              value={exercise.notes}
              onChange={e => onUpdate({ notes: e.target.value })}
              placeholder="أي ملاحظة..."
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8,
                border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
                fontSize: 13, outline: 'none', background: 'white',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cardio Card ────────────────────────────────────────────
function CardioCard({ cardio, color, onUpdate }: {
  cardio: import('../hooks/useGymTracker').CardioLog;
  color: string;
  onUpdate: (u: Partial<import('../hooks/useGymTracker').CardioLog>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: cardio.completed ? `${color}08` : 'white',
      borderRadius: 14, marginBottom: 14,
      border: `2px solid ${cardio.completed ? color : '#E8EAF0'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onUpdate({ completed: !cardio.completed })}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: `2px solid ${cardio.completed ? color : '#D0D0E0'}`,
            background: cardio.completed ? color : 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 0.2s',
          }}>
          {cardio.completed ? '✓' : ''}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>🏃‍♀️ {cardio.nameAr}</div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
            {cardio.duration} د • {cardio.speed} • انحدار: {cardio.incline}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{
          padding: '4px 8px', borderRadius: 8,
          border: `1px solid ${expanded ? color : '#E2E8F0'}`,
          background: expanded ? `${color}15` : 'white',
          color: expanded ? color : '#8A8AAA', fontSize: 12, cursor: 'pointer',
        }}>✏️</button>
      </div>
      {expanded && (
        <div style={{
          padding: '12px 14px', borderTop: '1px solid #F0F0F0',
          background: '#FAFAFA', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {[
            { label: 'المدة (دقيقة)', field: 'duration' as const, type: 'number', value: String(cardio.duration) },
            { label: 'السرعة', field: 'speed' as const, type: 'text', value: cardio.speed },
            { label: 'الانحدار', field: 'incline' as const, type: 'text', value: cardio.incline },
            { label: 'المسافة (كم)', field: 'distanceKm' as const, type: 'text', value: cardio.distanceKm },
            { label: 'السعرات المحروقة', field: 'caloriesBurned' as const, type: 'text', value: cardio.caloriesBurned },
          ].map(f => (
            <div key={f.field}>
              <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => onUpdate({ [f.field]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
                  fontSize: 13, outline: 'none', background: 'white',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Exercise Panel ─────────────────────────────────────
function AddExercisePanel({ color, onAdd }: {
  color: string;
  onAdd: (ex: typeof masterExercises[0]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = masterExercises.filter(e =>
    e.nameAr.includes(search) || e.muscleGroup.includes(search) || e.nameEn.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: 14, marginTop: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <input
        type="text"
        placeholder="🔍 ابحثي عن تمرين..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
          fontSize: 13, marginBottom: 10, outline: 'none',
        }}
      />
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map(ex => (
          <button
            key={ex.id}
            onClick={() => onAdd(ex)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid #F0F0F0', background: 'white',
              textAlign: 'right', cursor: 'pointer', marginBottom: 4,
              fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${color}10`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>{ex.nameAr}</div>
              <div style={{ fontSize: 11, color: '#8A8AAA' }}>{ex.muscleGroup} • {ex.defaultSets}×{ex.defaultReps} • {ex.defaultWeight}</div>
            </div>
            <span style={{ color, fontSize: 18 }}>+</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8A8AAA', fontSize: 13, padding: '20px 0' }}>
            لا توجد نتائج
          </p>
        )}
      </div>
    </div>
  );
}

// ── Aqua Session Panel ─────────────────────────────────────
function AquaSessionPanel({ aqua, onUpdate }: {
  aqua: import('../hooks/useGymTracker').AquaLog;
  onUpdate: (u: Partial<import('../hooks/useGymTracker').AquaLog>) => void;
}) {
  return (
    <div style={{
      background: '#E0F7FA', borderRadius: 16, padding: '16px', marginBottom: 14,
      border: '2px solid #0891B2',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/manus-storage/aqua_690009c3.jpg" alt="Aqua" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
        <div>
          <h3 style={{ margin: 0, color: '#0891B2', fontSize: 15, fontWeight: 900 }}>🏊‍♀️ كلاس الأكوا</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#0891B2' }}>تمارين مائية لحرق الدهون</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#0891B2', display: 'block', marginBottom: 4 }}>المدة (دقيقة)</label>
          <input type="number" value={aqua.duration}
            onChange={e => onUpdate({ duration: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #B2EBF2', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#0891B2', display: 'block', marginBottom: 4 }}>الشدة</label>
          <select value={aqua.intensity} onChange={e => onUpdate({ intensity: e.target.value as any })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #B2EBF2', fontFamily: 'Cairo, sans-serif', fontSize: 13 }}>
            <option>خفيف</option><option>متوسط</option><option>مكثف</option>
          </select>
        </div>
      </div>
      <h4 style={{ margin: '0 0 8px', color: '#0891B2', fontSize: 13 }}>تمارين الكلاس:</h4>
      {aquaExercises.map((ex, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 6,
          border: '1px solid #B2EBF2',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0891B2' }}>{ex.nameAr}</div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>{ex.duration} • {ex.tip}</div>
        </div>
      ))}
      <button
        onClick={() => onUpdate({ completed: !aqua.completed })}
        style={{
          width: '100%', marginTop: 10, padding: '10px',
          background: aqua.completed ? '#0891B2' : 'white',
          color: aqua.completed ? 'white' : '#0891B2',
          border: '2px solid #0891B2', borderRadius: 10,
          fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}
      >
        {aqua.completed ? '✅ مكتملة' : 'تحديد كمكتملة'}
      </button>
    </div>
  );
}

// ── Sauna Session Panel ────────────────────────────────────
function SaunaSessionPanel({ sauna, onUpdate }: {
  sauna: import('../hooks/useGymTracker').SaunaLog;
  onUpdate: (u: Partial<import('../hooks/useGymTracker').SaunaLog>) => void;
}) {
  return (
    <div style={{
      background: '#FEF3C7', borderRadius: 16, padding: '16px', marginBottom: 14,
      border: '2px solid #B45309',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/manus-storage/sauna_b9935cdb.jpg" alt="Sauna" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
        <div>
          <h3 style={{ margin: 0, color: '#B45309', fontSize: 15, fontWeight: 900 }}>🧖‍♀️ جلسة السونا</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B45309' }}>تعافٍ وحرق سعرات وإزالة سموم</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#B45309', display: 'block', marginBottom: 4 }}>إجمالي الدقائق</label>
          <input type="number" value={sauna.totalMinutes}
            onChange={e => onUpdate({ totalMinutes: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #FDE68A', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#B45309', display: 'block', marginBottom: 4 }}>عدد الجولات</label>
          <input type="number" value={sauna.rounds}
            onChange={e => onUpdate({ rounds: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #FDE68A', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
      </div>
      <h4 style={{ margin: '0 0 8px', color: '#B45309', fontSize: 13 }}>بروتوكول السونا:</h4>
      {saunaProtocol.map((p, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 6,
          border: '1px solid #FDE68A',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#B45309' }}>{p.phase} ({p.duration})</div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>🌡 {p.temp} • {p.tip}</div>
        </div>
      ))}
      <textarea value={sauna.notes} onChange={e => onUpdate({ notes: e.target.value })}
        placeholder="ملاحظات الجلسة..."
        rows={2}
        style={{
          width: '100%', marginTop: 8, padding: '8px 10px', borderRadius: 8,
          border: '1px solid #FDE68A', fontFamily: 'Cairo, sans-serif', fontSize: 13, resize: 'none',
        }}
      />
      <button
        onClick={() => onUpdate({ completed: !sauna.completed })}
        style={{
          width: '100%', marginTop: 10, padding: '10px',
          background: sauna.completed ? '#B45309' : 'white',
          color: sauna.completed ? 'white' : '#B45309',
          border: '2px solid #B45309', borderRadius: 10,
          fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}
      >
        {sauna.completed ? '✅ مكتملة' : 'تحديد كمكتملة'}
      </button>
    </div>
  );
}
