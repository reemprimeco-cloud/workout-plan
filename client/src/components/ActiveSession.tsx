// ActiveSession - Live workout session with editable exercises
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { GymSession } from '../hooks/useGymTracker';
import type { useGymTracker } from '../hooks/useGymTracker';
import { sessionTypes, masterExercises, upperBodyExercises, cardioTemplates, aquaExercises, saunaProtocol } from '../data/exercises';
import { getProgramByGender } from '../lib/exerciseData';
import { WorkoutTimer } from './WorkoutTimer';
import { useLanguage } from '../contexts/LanguageContext';
import { calcSessionCalories } from '../lib/calorieCalc';
import { AppIcons } from './AppIcons';
import { muscleGroupEn } from './WorkoutGuide';
import { translateWeight, translateReps } from '../lib/exerciseTranslations';

interface Props {
  session: GymSession;
  tracker: ReturnType<typeof useGymTracker>;
  gender?: 'male' | 'female';
  weightKg?: number;
}

export function ActiveSession({ session, tracker, gender = 'female', weightKg = 65 }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const typeDef = sessionTypes[session.sessionType];

  // Elapsed time counter
  useEffect(() => {
    const startMs = new Date(`${session.date}T${session.checkInTime}`).getTime();
    const start = isNaN(startMs) ? Date.now() : startMs;
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [session.checkInTime, session.date]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return isAr ? `${h}س ${m % 60}د` : `${h}h ${m % 60}m`;
    return isAr ? `${m} دقيقة` : `${m} min`;
  };

  const completedCount = session.exercises.filter(e => e.completed).length;
  const totalCount = session.exercises.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Live calorie estimate
  const liveCalories = calcSessionCalories(
    session.exercises,
    session.cardio,
    session.sessionType,
    weightKg,
    session.checkInTime,
    session.checkOutTime,
  );

  const handleCheckOut = () => {
    setCheckingOut(true);
    tracker.checkOut(session.id, {
      mood: session.mood,
      energyLevel: session.energyLevel,
      notes: session.notes,
      caloriesBurned: liveCalories,
    });
  };

  const hasStartedWorkout = session.exercises.some(e => e.completed) || session.notes.trim().length > 0;
  const handleCancelSession = () => {
    if (hasStartedWorkout) {
      if (!window.confirm(isAr ? (gender === 'female' ? 'تم البدء بالتمرين. هل تريدين حفظ الجلسة قبل الخروج؟' : 'تم البدء بالتمرين. هل تريد حفظ الجلسة قبل الخروج؟') : 'Workout started. Save session before leaving?')) return;
      handleCheckOut();
    } else {
      tracker.cancelSession(session.id);
    }
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
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button
                onClick={handleCancelSession}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                  color: 'white', padding: '4px 10px', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                }}
              >
                ← {hasStartedWorkout ? (isAr ? 'حفظ وخروج' : 'Save & Exit') : (isAr ? 'إلغاء' : 'Cancel')}
              </button>
              <div style={{ fontSize: 24 }}>{typeDef.icon}</div>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{isAr ? typeDef.nameAr : typeDef.nameEn}</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 12 }}>
              ⏰ {isAr ? (gender === 'female' ? 'بدأتِ' : 'بدأت') : 'Started'}: {session.checkInTime} • {isAr ? 'مضى' : 'Elapsed'}: {formatElapsed(elapsed)}
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
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>{isAr ? 'مكتمل' : 'Done'}</div>
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
              {completedCount} / {totalCount} {isAr ? 'تمرين مكتمل' : 'exercises done'}
            </div>
            {/* Live Calorie Counter */}
            <div style={{
              marginTop: 10, background: 'rgba(255,255,255,0.18)', borderRadius: 10,
              padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, opacity: 0.9 }}><span style={{display:'inline-flex',alignItems:'center',gap:4}}><AppIcons.Flame size={12} className='text-orange-400' />{isAr ? 'السعرات المحروقة التقديرية' : 'Est. Calories Burned'}</span></span>
              <span style={{ fontSize: 18, fontWeight: 900 }}>{liveCalories} kcal</span>
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
          ⏱ {showTimer ? (isAr ? 'إخفاء المؤقت' : 'Hide Timer') : (isAr ? 'إظهار مؤقت الراحة' : 'Show Rest Timer')}
        </button>
        {showTimer && <div style={{ marginTop: 10 }}><WorkoutTimer defaultSeconds={60} /></div>}
      </div>

      {/* AQUA SESSION */}
      {session.sessionType === 'aqua' && session.aqua && (
        <AquaSessionPanel
          aqua={session.aqua}
          isAr={isAr}
          gender={gender}
          onUpdate={u => tracker.updateAqua(session.id, u)}
        />
      )}

      {/* SAUNA SESSION */}
      {session.sessionType === 'sauna' && session.sauna && (
        <SaunaSessionPanel
          sauna={session.sauna}
          gender={gender}
          onUpdate={u => tracker.updateSauna(session.id, u)}
        />
      )}

      {/* EXERCISES LIST */}
      {session.exercises.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 10px', color: '#1A1A2E', fontSize: 15, fontWeight: 900 }}>
            <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Dumbbell size={16} />{isAr ? 'التمارين' : 'Exercises'} ({session.exercises.length})</span>
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
                isAr={isAr}
                gender={gender}
                onToggle={() => tracker.toggleExercise(session.id, idx)}
                onEdit={() => setEditingIdx(editingIdx === idx ? null : idx)}
                onUpdate={u => tracker.updateExercise(session.id, idx, u)}
                onRemove={() => tracker.removeExercise(session.id, idx)}
              />
            );
          })}
          {/* Undo Remove Button */}
          {tracker.lastRemovedExercise && tracker.lastRemovedExercise.sessionId === session.id && (
            <button
              onClick={tracker.undoRemoveExercise}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '2px solid #F59E0B', background: '#FFFBEB',
                color: '#92400E', fontFamily: 'Cairo, sans-serif',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 6,
              }}
            >
              ↩ {isAr ? 'تراجع - استعادة التمرين المحذوف' : 'Undo — Restore deleted exercise'} ({isAr ? tracker.lastRemovedExercise.exercise.nameAr : (tracker.lastRemovedExercise.exercise.nameEn || tracker.lastRemovedExercise.exercise.nameAr)})
            </button>
          )}
        </div>
      )}

      {/* CARDIO */}
      {session.cardio && (
        <CardioCard
          cardio={session.cardio}
          color={typeDef.color}
          isAr={isAr}
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
            + {isAr ? 'إضافة تمرين' : 'Add Exercise'}
          </button>
          {showAddExercise && (
            <AddExercisePanel
              color={typeDef.color}
              gender={gender}
              isAr={isAr}
              onAdd={ex => {
                tracker.addExerciseToSession(session.id, {
                  exerciseId: ex.id, nameAr: ex.nameAr, nameEn: ex.nameEn,
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
          <span style={{display:'flex',alignItems:'center',gap:8}}><AppIcons.Notes size={16} />{isAr ? 'ملاحظات الجلسة' : 'Session Notes'}</span>
        </h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#4A4A6A', alignSelf: 'center' }}>{isAr ? 'المزاج' : 'Mood'}:</span>
          {(['sleep', 'neutral', 'happy', 'strong', 'fire'] as const).map((m, idx) => {
            const moodIcons = [<AppIcons.Moon size={22} />, <AppIcons.Minus size={22} />, <AppIcons.Smile size={22} />, <AppIcons.Dumbbell size={22} />, <AppIcons.Flame size={22} />];
            return (
            <button key={m} onClick={() => tracker.updateSessionMeta(session.id, { mood: m as any })}
              style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                border: `2px solid ${(session.mood as string) === m ? typeDef.color : '#E2E8F0'}` ,
                borderRadius: 10, padding: '4px 8px', cursor: 'pointer',
                background: (session.mood as string) === m ? `${typeDef.color}15` : 'white',
              }}>{moodIcons[idx]}</button>
          );})}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#4A4A6A', alignSelf: 'center' }}>{isAr ? 'الطاقة' : 'Energy'}:</span>
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
          placeholder={isAr ? 'ملاحظات، إصابات، تحسينات...' : 'Notes, injuries, improvements...'}
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
        <span style={{display:'flex',alignItems:'center',gap:6}}>{checkingOut ? <AppIcons.Spinner size={16} /> : <AppIcons.Check size={16} />}{checkingOut ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إنهاء الجلسة وحفظ التقدم' : 'Finish & Save Progress')}</span>
      </button>
    </div>
  );
}

// ── Exercise Card ──────────────────────────────────────────
function ExerciseCard({ exercise, idx, color, isEditing, onToggle, onEdit, onUpdate, onRemove, youtubeUrl, isAr, gender = 'female' }: {
  exercise: import('../hooks/useGymTracker').ExerciseLog;
  idx: number; color: string; isEditing: boolean;
  youtubeUrl?: string;
  isAr?: boolean;
  gender?: 'male' | 'female';
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
          {exercise.completed ? <AppIcons.Check size={14} /> : null}
        </button>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#1A1A2E',
            textDecoration: exercise.completed ? 'line-through' : 'none',
            opacity: exercise.completed ? 0.6 : 1,
          }}>
            {isAr ? exercise.nameAr : (exercise.nameEn || exercise.nameAr)}
          </div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
            {exercise.sets} {isAr ? 'جولات' : 'sets'} × {exercise.reps} • {exercise.weight}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
              title={isAr ? (gender === 'female' ? 'شاهدي شرح التمرين' : 'شاهد شرح التمرين') : 'Watch exercise tutorial'}
              style={{
                padding: '4px 8px', borderRadius: 8,
                border: '1px solid #FFD0D0', background: '#FFF0F0',
                color: '#FF0000', fontSize: 12, textDecoration: 'none',
                display: 'flex', alignItems: 'center', fontWeight: 700,
              }}>
              <AppIcons.ChevronRight size={12} />
            </a>
          )}
          <button onClick={onEdit} style={{
            padding: '4px 8px', borderRadius: 8,
            border: `1px solid ${isEditing ? color : '#E2E8F0'}`,
            background: isEditing ? `${color}15` : 'white',
            color: isEditing ? color : '#8A8AAA',
            fontSize: 12, cursor: 'pointer',
          }}><AppIcons.Edit size={14} /></button>
          <button onClick={onRemove} style={{
            padding: '4px 8px', borderRadius: 8,
            border: '1px solid #FFE0E0', background: '#FFF5F5',
            color: '#DC2626', fontSize: 12, cursor: 'pointer',
          }}><AppIcons.Trash size={14} /></button>
        </div>
      </div>

      {/* Edit Panel */}
      {isEditing && (() => {
        // Cardio machines get the same Speed/Duration/Incline/Calories/Distance form as Treadmill
        const CARDIO_MACHINE_IDS = ['treadmill', 'rower', 'precor_bike', 'climbmill', 'rowing_machine'];
        const isCardioMachine = CARDIO_MACHINE_IDS.includes(exercise.exerciseId);
        const isRowerMachine = exercise.exerciseId === 'rower' || exercise.exerciseId === 'rowing_machine';
        const isBike = exercise.exerciseId === 'precor_bike';
        const isClimbmill = exercise.exerciseId === 'climbmill';

        if (isCardioMachine) {
          // Parse stored values from reps/weight/notes fields
          const speedVal = exercise.weight !== '—' ? exercise.weight : '';
          const inclineVal = exercise.notes.match(/incline:([\.\d]+)/)?.[1] ?? '';
          const calVal = exercise.notes.match(/cal:([\.\d]+)/)?.[1] ?? '';
          const distVal = exercise.notes.match(/dist:([\.\d]+)/)?.[1] ?? '';

          const speedLabel = isAr
            ? (isRowerMachine ? 'الإيقاع (SPM)' : isBike ? 'السرعة (RPM)' : isClimbmill ? 'خطوة/د' : 'السرعة (كم/ساعة)')
            : (isRowerMachine ? 'Pace (SPM)' : isBike ? 'Speed (RPM)' : isClimbmill ? 'Steps/min' : 'Speed (km/h)');
          const inclineLabel = isAr
            ? (isRowerMachine ? 'المقاومة (Level)' : isBike ? 'المقاومة (Level)' : isClimbmill ? 'المستوى' : 'الانحدار (%)')
            : (isRowerMachine ? 'Resistance (Level)' : isBike ? 'Resistance (Level)' : isClimbmill ? 'Level' : 'Incline (%)');
          const distLabel = isAr
            ? (isRowerMachine ? 'المسافة (m)' : isClimbmill ? 'الطوابق' : 'المسافة (كم)')
            : (isRowerMachine ? 'Distance (m)' : isClimbmill ? 'Floors' : 'Distance (km)');

          const saveNotes = (inc: string, cal: string, dist: string) => {
            const parts = [];
            if (inc) parts.push(`incline:${inc}`);
            if (cal) parts.push(`cal:${cal}`);
            if (dist) parts.push(`dist:${dist}`);
            onUpdate({ notes: parts.join('|') });
          };

          return (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Duration */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700 }}>{isAr ? '⛱ المدة (دقيقة)' : '⛱ Duration (min)'}</label>
                  <input
                    type="number"
                    value={exercise.sets === 1 && (exercise.reps.includes('دقيقة') || exercise.reps.includes('min')) ? exercise.reps.replace(/[^\d]/g, '') : exercise.sets}
                    onChange={e => onUpdate({ reps: `${e.target.value} دقيقة` })}
                    placeholder="20"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white', textAlign: 'center',
                    }}
                  />
                </div>
                {/* Speed */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700 }}>{speedLabel}</label>
                  <input
                    type="text"
                    value={speedVal}
                    onChange={e => onUpdate({ weight: e.target.value })}
                    placeholder="5.5"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white', textAlign: 'center',
                    }}
                  />
                </div>
                {/* Incline */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700 }}>{inclineLabel}</label>
                  <input
                    type="text"
                    value={inclineVal}
                    onChange={e => saveNotes(e.target.value, calVal, distVal)}
                    placeholder="3"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white', textAlign: 'center',
                    }}
                  />
                </div>
                {/* Calories */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700 }}>{isAr ? 'الكالوريز' : 'Calories'}</label>
                  <input
                    type="text"
                    value={calVal}
                    onChange={e => saveNotes(inclineVal, e.target.value, distVal)}
                    placeholder="150"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white', textAlign: 'center',
                    }}
                  />
                </div>
                {/* Distance - full row */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700 }}>{distLabel}</label>
                  <input
                    type="text"
                    value={distVal}
                    onChange={e => saveNotes(inclineVal, calVal, e.target.value)}
                    placeholder="1.8"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white', textAlign: 'center',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Default: weights/core form
        return (
          <div style={{
            padding: '12px 14px', borderTop: '1px solid #F0F0F0',
            background: '#FAFAFA', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { label: isAr ? 'الجولات' : 'Sets', field: 'sets' as const, type: 'number', value: String(exercise.sets) },
              { label: isAr ? 'التكرارات' : 'Reps', field: 'reps' as const, type: 'text', value: exercise.reps },
              { label: isAr ? 'الوزن' : 'Weight', field: 'weight' as const, type: 'text', value: exercise.weight },
              { label: isAr ? 'راحة (ث)' : 'Rest (s)', field: 'restSeconds' as const, type: 'number', value: String(exercise.restSeconds) },
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
              <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{isAr ? 'ملاحظة' : 'Notes'}</label>
              <input
                type="text"
                value={exercise.notes}
                onChange={e => onUpdate({ notes: e.target.value })}
                placeholder={isAr ? 'أي ملاحظة...' : 'Any notes...'}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
                  fontSize: 13, outline: 'none', background: 'white',
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Cardio Card ────────────────────────────────────────────
function CardioCard({ cardio, color, onUpdate, isAr }: {
  cardio: import('../hooks/useGymTracker').CardioLog;
  color: string;
  isAr?: boolean;
  onUpdate: (u: Partial<import('../hooks/useGymTracker').CardioLog>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isRower = cardio.cardioId === 'rower';
  const isTreadmill = cardio.cardioId === 'treadmill';
  const cardioIconKey = isRower ? 'rowing' : isTreadmill ? 'running' : 'bike';
  return (
    <div style={{
      background: cardio.completed ? `${color}08` : 'white',
      borderRadius: 14, marginBottom: 14,
      border: `2px solid ${cardio.completed ? color : '#E8EAF0'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onUpdate({ completed: !cardio.completed })}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: `2px solid ${cardio.completed ? color : '#D0D0E0'}`,
            background: cardio.completed ? color : 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'white', transition: 'all 0.2s',
          }}>
          {cardio.completed ? <AppIcons.Check size={14} /> : null}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}><span style={{display:'inline-flex',alignItems:'center',gap:6}}>{cardioIconKey === 'running' ? <AppIcons.Running size={16} /> : cardioIconKey === 'rowing' ? <AppIcons.Rowing size={16} /> : <AppIcons.Cardio size={16} />}{isAr ? cardio.nameAr : (cardio.nameEn || cardio.nameAr)}</span></div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>
            {isRower ? (
              <>
                ⏱ {cardio.duration} {isAr ? 'دقيقة' : 'min'}
                {cardio.speed && ` • ${cardio.speed} SPM`}
                {cardio.distanceKm && ` • ${cardio.distanceKm}m`}
                {cardio.pace && ` • ${cardio.pace}/500m`}
                {cardio.caloriesBurned && ` • ${cardio.caloriesBurned} cal`}
              </>
            ) : (
              <>
                ⏱ {cardio.duration} {isAr ? 'دقيقة' : 'min'}
                {cardio.speed && ` • ${cardio.speed}`}
                {cardio.incline && ` • ${cardio.incline}`}
                {cardio.caloriesBurned && ` • ${cardio.caloriesBurned} ${isAr ? 'كال' : 'cal'}`}
              </>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{
          padding: '4px 8px', borderRadius: 8,
          border: `1px solid ${expanded ? color : '#E2E8F0'}`,
          background: expanded ? `${color}15` : 'white',
          color: expanded ? color : '#8A8AAA', fontSize: 12, cursor: 'pointer',
        }}><AppIcons.Edit size={14} /></button>
      </div>
      {/* Expanded Edit Form */}
      {expanded && (
        <div style={{
          padding: '14px', borderTop: '1px solid #F0F0F0',
          background: '#FAFAFA',
        }}>
          {/* Rower-specific fields matching machine display: TIME, RATE, DISTANCE, PACE, CALORIES */}
          {isRower ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* TIME - Elapsed */}
              <div>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>{isAr ? '⛱ TIME (دقيقة)' : '⛱ TIME (min)'}</label>
                <input
                  type="number"
                  value={String(cardio.duration)}
                  onChange={e => onUpdate({ duration: Number(e.target.value) })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
              {/* RATE - Strokes/min */}
              <div>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>RATE (Strokes/min)</label>
                <input
                  type="text"
                  value={cardio.speed}
                  onChange={e => onUpdate({ speed: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
              {/* DISTANCE - Meters */}
              <div>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>DISTANCE (Meters)</label>
                <input
                  type="text"
                  value={cardio.distanceKm}
                  onChange={e => onUpdate({ distanceKm: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
              {/* PACE - /500 Meters */}
              <div>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>PACE (/500m)</label>
                <input
                  type="text"
                  value={cardio.pace ?? ''}
                  onChange={e => onUpdate({ pace: e.target.value })}
                  placeholder="0:00"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
              {/* CALORIES - full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3, fontWeight: 700, letterSpacing: 0.5 }}>CALORIES</label>
                <input
                  type="text"
                  value={cardio.caloriesBurned}
                  onChange={e => onUpdate({ caloriesBurned: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Non-Rower fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {/* Duration */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{isAr ? '⛱ المدة (دقيقة)' : '⛱ Duration (min)'}</label>
                  <input
                    type="number"
                    value={String(cardio.duration)}
                    onChange={e => onUpdate({ duration: Number(e.target.value) })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                      textAlign: 'center',
                    }}
                  />
                </div>
                {/* Speed */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>
                    {isAr ? (isTreadmill ? 'السرعة (كم/ساعة)' : 'المقاومة (Level)') : (isTreadmill ? 'Speed (km/h)' : 'Resistance (Level)')}
                  </label>
                  <input
                    type="text"
                    value={cardio.speed}
                    onChange={e => onUpdate({ speed: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                      textAlign: 'center',
                    }}
                  />
                </div>
                {/* Incline */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>
                    {isAr ? (isTreadmill ? 'الانحدار (%)' : 'الانحدار (Level)') : (isTreadmill ? 'Incline (%)' : 'Incline (Level)')}
                  </label>
                  <input
                    type="text"
                    value={cardio.incline}
                    onChange={e => onUpdate({ incline: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                      textAlign: 'center',
                    }}
                  />
                </div>
                {/* Calories */}
                <div>
                  <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{isAr ? 'الكالوريز' : 'Calories'}</label>
                  <input
                    type="text"
                    value={cardio.caloriesBurned}
                    onChange={e => onUpdate({ caloriesBurned: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                      fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>
              {/* Distance - full width */}
              <div>
                <label style={{ fontSize: 10, color: '#8A8AAA', display: 'block', marginBottom: 3 }}>{isAr ? 'المسافة (كم)' : 'Distance (km)'}</label>
                <input
                  type="text"
                  value={cardio.distanceKm}
                  onChange={e => onUpdate({ distanceKm: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${color}40`, fontFamily: 'Cairo, sans-serif',
                    fontSize: 14, fontWeight: 700, outline: 'none', background: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Heart Icon SVG (vector outline / filled) ─────────────────
function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ── Add Exercise Panel ─────────────────────────────────────
function AddExercisePanel({ color, gender, onAdd, isAr }: {
  color: string;
  gender: 'male' | 'female';
  isAr?: boolean;
  onAdd: (ex: typeof masterExercises[0]) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'all'>('favorites');

  // ── Favorites state (DB-backed via tRPC) ──
  const { data: favIds = [], refetch: refetchFavs } = trpc.exerciseFavorites.getFavorites.useQuery();
  const addFav = trpc.exerciseFavorites.addFavorite.useMutation({ onSuccess: () => refetchFavs() });
  const removeFav = trpc.exerciseFavorites.removeFavorite.useMutation({ onSuccess: () => refetchFavs() });

  const isFav = (id: string) => favIds.includes(id);
  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isFav(id)) removeFav.mutate({ exerciseId: id });
    else addFav.mutate({ exerciseId: id });
  };

  // Build combined exercise list from exerciseData (gender-specific) + masterExercises + upperBodyExercises + cardio
  const genderProgram = getProgramByGender(gender);
  const programExercises = genderProgram.exercises.map(ex => ({
    id: ex.id,
    nameAr: ex.nameAr,
    nameEn: ex.name,
    muscleGroup: ex.categoryAr,
    defaultSets: parseInt(ex.sets) || 3,
    defaultReps: ex.reps,
    defaultWeight: '—',
    restSeconds: parseInt(ex.rest) || 60,
    image: ex.imageUrl || '',
    tip: ex.notesAr || '',
    tipEn: ex.notes || '',
    youtubeUrl: ex.youtubeUrl,
    category: 'weights' as const,
    sessionTypes: [] as import('../data/exercises').SessionType[],
  }));

  // Convert cardio machines to exercise-like entries for the list
  const cardioAsExercises = cardioTemplates.map(c => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    muscleGroup: 'كارديو',
    defaultSets: 1,
    defaultReps: `${c.defaultDuration} دقيقة`,
    defaultRepsEn: `${c.defaultDuration} min`,
    defaultWeight: '—',
    restSeconds: 0,
    image: c.image,
    tip: c.tip,
    tipEn: c.tipEn || c.tip,
    youtubeUrl: '',
    category: 'cardio' as const,
    sessionTypes: c.sessionTypes,
  }));

  // Deduplicate by id: programExercises first, then masterExercises, upperBodyExercises, cardio
  const seen = new Set<string>();
  const mergeUnique = (lists: typeof programExercises[]) => {
    const result: typeof programExercises[number][] = [];
    for (const list of lists) {
      for (const ex of list) {
        if (!seen.has(ex.id)) { seen.add(ex.id); result.push(ex); }
      }
    }
    return result;
  };

  const allExercisesUnified = mergeUnique([
    programExercises,
    masterExercises as typeof programExercises[number][],
    upperBodyExercises as typeof programExercises[number][],
    (cardioAsExercises as unknown) as typeof programExercises[number][],
  ]);

  // Favorites tab: exercises that the user has hearted
  const favExercises = allExercisesUnified.filter(ex => favIds.includes(ex.id));

  const baseList = activeTab === 'favorites' ? favExercises : allExercisesUnified;
  const filtered = baseList.filter(e =>
    e.nameAr.includes(search) || e.muscleGroup.includes(search) || e.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: 14, marginTop: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === 'favorites' ? '#1B2E5E' : '#F0F4FF',
            color: activeTab === 'favorites' ? 'white' : '#1B2E5E',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
          }}
        >
          <span style={{display:'flex',alignItems:'center',gap:6}}>
            <HeartIcon filled={true} size={14} />
            {isAr ? 'تماريني المفضلة' : 'My Favorites'}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === 'all' ? '#1B2E5E' : '#F0F4FF',
            color: activeTab === 'all' ? 'white' : '#1B2E5E',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
          }}
        >
          <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Clipboard size={14} />{isAr ? 'كل التمارين' : 'All Exercises'}</span>
        </button>
      </div>

      {/* Search — only shown in 'all' tab */}
      {activeTab === 'all' && (
        <input
          type="text"
          placeholder={isAr ? 'ابحث عن تمرين...' : 'Search exercise...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif',
            fontSize: 13, marginBottom: 10, outline: 'none',
          }}
        />
      )}

      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {/* Empty state for favorites tab */}
        {activeTab === 'favorites' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ marginBottom: 10 }}>
              <HeartIcon filled={false} size={36} />
            </div>
            <div style={{ color: '#1B2E5E', fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: 'Cairo, sans-serif' }}>
              {isAr ? 'لا توجد تمارين مفضلة بعد' : 'No favorites yet'}
            </div>
            <div style={{ color: '#8A8AAA', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}>
              {isAr ? 'اضغط على القلب لإضافة تمرينك المفضل' : 'Tap the heart icon to add favorites'}
            </div>
          </div>
        )}

        {filtered.map(ex => (
          <div
            key={ex.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 10, border: '1px solid #F0F0F0', background: 'white',
              marginBottom: 4, overflow: 'hidden',
            }}
          >
            {/* Main exercise button */}
            <button
              onClick={() => onAdd(ex)}
              style={{
                flex: 1, padding: '10px 12px',
                border: 'none', background: 'transparent',
                textAlign: 'right', cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${color}10`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {ex.image && (
                <img src={ex.image} alt={isAr ? ex.nameAr : (ex.nameEn || ex.nameAr)} style={{
                  width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0,
                }} />
              )}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>{isAr ? ex.nameAr : (ex.nameEn || ex.nameAr)}</div>
                <div style={{ fontSize: 11, color: '#8A8AAA' }}>
                  {isAr ? ex.muscleGroup : (muscleGroupEn[ex.muscleGroup] || ex.muscleGroup)} • {ex.defaultSets}×{isAr ? ex.defaultReps : ((ex as any).defaultRepsEn || translateReps(ex.defaultReps))}
                  {ex.defaultWeight && ex.defaultWeight !== '—' ? ` • ${isAr ? ex.defaultWeight : translateWeight(ex.defaultWeight)}` : ''}
                </div>
              </div>
              <span style={{ color, fontSize: 18, flexShrink: 0 }}>+</span>
            </button>

            {/* Heart toggle button */}
            <button
              onClick={(e) => toggleFav(e, ex.id)}
              style={{
                flexShrink: 0, padding: '10px 12px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              title={isFav(ex.id) ? (isAr ? 'إزالة من المفضلة' : 'Remove from favorites') : (isAr ? 'إضافة للمفضلة' : 'Add to favorites')}
            >
              <HeartIcon filled={isFav(ex.id)} size={18} />
            </button>
          </div>
        ))}

        {activeTab === 'all' && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8A8AAA', fontSize: 13, padding: '20px 0', fontFamily: 'Cairo, sans-serif' }}>
            {isAr ? 'لا توجد نتائج' : 'No results found'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Aqua Session Panel ─────────────────────────────────────
function AquaSessionPanel({ aqua, onUpdate, isAr, gender = 'female' }: {
  aqua: import('../hooks/useGymTracker').AquaLog;
  isAr?: boolean;
  gender?: 'male' | 'female';
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
          <h3 style={{ margin: 0, color: '#0891B2', fontSize: 15, fontWeight: 900 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Swimming size={18} />{isAr ? 'كلاس الأكوا' : 'Aqua Class'}</span></h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#0891B2' }}>{isAr ? 'تمارين مائية لحرق الدهون' : 'Water exercises for fat burn'}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#0891B2', display: 'block', marginBottom: 4 }}>{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
          <input type="number" value={aqua.duration}
            onChange={e => onUpdate({ duration: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #B2EBF2', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#0891B2', display: 'block', marginBottom: 4 }}>{isAr ? 'الشدة' : 'Intensity'}</label>
          <select value={aqua.intensity} onChange={e => onUpdate({ intensity: e.target.value as any })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #B2EBF2', fontFamily: 'Cairo, sans-serif', fontSize: 13 }}>
            {isAr ? (
              <><option value="خفيف">خفيف</option><option value="متوسط">متوسط</option><option value="مكثف">مكثف</option></>
            ) : (
              <><option value="خفيف">Light</option><option value="متوسط">Medium</option><option value="مكثف">Intense</option></>
            )}
          </select>
        </div>
      </div>
      <h4 style={{ margin: '0 0 8px', color: '#0891B2', fontSize: 13 }}>{isAr ? 'تمارين الكلاس:' : 'Class Exercises:'}</h4>
      {aquaExercises.map((ex, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 6,
          border: '1px solid #B2EBF2',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0891B2' }}>{isAr ? ex.nameAr : (ex.nameEn || ex.nameAr)}</div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>{ex.duration} • {gender === 'male' && (ex as any).tipMale ? (ex as any).tipMale : ex.tip}</div>
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
        <span style={{display:'flex',alignItems:'center',gap:4}}>{aqua.completed ? <AppIcons.Check size={14} /> : null}{aqua.completed ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'تحديد كمكتمل' : 'Mark as Complete')}</span>
      </button>
    </div>
  );
}

// ── Sauna Session Panel ────────────────────────────────────
function SaunaSessionPanel({ sauna, onUpdate, gender = 'female' }: {
  sauna: import('../hooks/useGymTracker').SaunaLog;
  gender?: 'male' | 'female';
  onUpdate: (u: Partial<import('../hooks/useGymTracker').SaunaLog>) => void;
}) {
  const { lang: saunaLang } = useLanguage();
  const isSaunaAr = saunaLang === 'ar';
  return (
    <div style={{
      background: '#FEF3C7', borderRadius: 16, padding: '16px', marginBottom: 14,
      border: '2px solid #B45309',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/manus-storage/sauna_b9935cdb.jpg" alt="Sauna" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
        <div>
          <h3 style={{ margin: 0, color: '#B45309', fontSize: 15, fontWeight: 900 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Spa size={18} />{isSaunaAr ? 'جلسة السونا' : 'Sauna Session'}</span></h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B45309' }}>{isSaunaAr ? 'تعافٍ وحرق سعرات وإزالة سموم' : 'Recovery, calorie burn & detox'}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#B45309', display: 'block', marginBottom: 4 }}>{isSaunaAr ? 'إجمالي الدقائق' : 'Total Minutes'}</label>
          <input type="number" value={sauna.totalMinutes}
            onChange={e => onUpdate({ totalMinutes: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #FDE68A', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#B45309', display: 'block', marginBottom: 4 }}>{isSaunaAr ? 'عدد الجولات' : 'Rounds'}</label>
          <input type="number" value={sauna.rounds}
            onChange={e => onUpdate({ rounds: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #FDE68A', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}
          />
        </div>
      </div>
      <h4 style={{ margin: '0 0 8px', color: '#B45309', fontSize: 13 }}>{isSaunaAr ? 'بروتوكول السونا:' : 'Sauna Protocol:'}</h4>
      {saunaProtocol.map((p, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 6,
          border: '1px solid #FDE68A',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#B45309' }}>{p.phase} ({p.duration})</div>
          <div style={{ fontSize: 11, color: '#8A8AAA', marginTop: 2 }}>{p.temp} • {gender === 'male' && (p as any).tipMale ? (p as any).tipMale : p.tip}</div>
        </div>
      ))}
      <textarea value={sauna.notes} onChange={e => onUpdate({ notes: e.target.value })}
        placeholder={isSaunaAr ? 'ملاحظات الجلسة...' : 'Session notes...'}
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
        <span style={{display:'flex',alignItems:'center',gap:4}}>{sauna.completed ? <AppIcons.Check size={14} /> : null}{sauna.completed ? (isSaunaAr ? 'مكتمل' : 'Completed') : (isSaunaAr ? 'تحديد كمكتمل' : 'Mark as Complete')}</span>
      </button>
    </div>
  );
}
