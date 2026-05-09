// WorkoutCalendar - Monthly calendar showing workout schedule
// Design: RTL Arabic, color-coded by workout type
import { useState } from 'react';
import { allWeeks } from '../data/workoutData';
import { useProgress } from '../hooks/useProgress';

const DAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  training: { bg: '#FFF0E8', color: '#E05A00', label: 'تدريب', icon: '🏋️‍♀️' },
  'active-rest': { bg: '#EEF4FF', color: '#1B2E5E', label: 'تمارين الكارديو', icon: '🏃' },
  rest: { bg: '#F4F6F8', color: '#8A8AAA', label: 'راحة', icon: '😴' },
};

export function WorkoutCalendar() {
  const [activeMonth, setActiveMonth] = useState(1);
  const { isDayCompleted, toggleDay } = useProgress();

  const weeks = allWeeks.filter(w => w.month === activeMonth);

  // Build a flat list of all days for the month
  const allDays = weeks.flatMap(week =>
    week.days.map(day => ({ ...day, weekNum: week.weekNum }))
  );

  // Group into rows of 7
  const rows: typeof allDays[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    rows.push(allDays.slice(i, i + 7));
  }

  const completedCount = allDays.filter(d =>
    d.type === 'training' && isDayCompleted(d.weekNum, d.dayNum)
  ).length;
  const trainingDays = allDays.filter(d => d.type === 'training').length;

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>📅</div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1A1A2E', fontSize: 18 }}>التقويم الشهري</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>
              أنجزتِ {completedCount} من {trainingDays} يوم تدريب
            </p>
          </div>
        </div>
        {/* Month Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2].map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: '2px solid',
                borderColor: activeMonth === m ? '#E05A00' : '#E2E8F0',
                background: activeMonth === m ? '#E05A00' : 'white',
                color: activeMonth === m ? 'white' : '#4A4A6A',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m === 1 ? '🌱 الشهر الأول' : '🚀 الشهر الثاني'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>تقدم التمارين</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#E05A00', fontFamily: 'Cairo, sans-serif' }}>
            {completedCount}/{trainingDays} ({Math.round((completedCount / trainingDays) * 100)}%)
          </span>
        </div>
        <div style={{ height: 8, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.round((completedCount / trainingDays) * 100)}%`,
            background: 'linear-gradient(90deg, #1A7A4A, #E05A00)',
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_STYLES).map(([type, style]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 4,
              background: style.bg, border: `2px solid ${style.color}`,
            }} />
            <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>
              {style.icon} {style.label}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 4,
            background: '#E05A00', border: '2px solid #E05A00',
          }} />
          <span style={{ fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>✅ مكتمل</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ overflowX: 'auto' }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 4,
          minWidth: 420,
        }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Cairo, sans-serif',
              color: '#8A8AAA',
              padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 4,
            minWidth: 420,
          }}>
            {row.map((day, colIdx) => {
              const style = TYPE_STYLES[day.type];
              const completed = day.type === 'training' && isDayCompleted(day.weekNum, day.dayNum);
              return (
                <div
                  key={colIdx}
                  onClick={() => day.type === 'training' && toggleDay(day.weekNum, day.dayNum)}
                  title={`${day.dayName} - ${day.focus}`}
                  style={{
                    borderRadius: 10,
                    padding: '8px 4px',
                    textAlign: 'center',
                    cursor: day.type === 'training' ? 'pointer' : 'default',
                    background: completed ? '#E05A00' : style.bg,
                    border: `2px solid ${completed ? '#E05A00' : style.color}`,
                    transition: 'all 0.2s',
                    position: 'relative',
                    transform: completed ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: completed ? '0 4px 12px #E05A0044' : 'none',
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: 1 }}>
                    {completed ? '✅' : style.icon}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 700,
                    color: completed ? 'white' : style.color,
                    marginTop: 3,
                    lineHeight: 1.2,
                  }}>
                    {day.dayName}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: completed ? 'rgba(255,255,255,0.8)' : '#8A8AAA',
                    fontFamily: 'Tajawal, sans-serif',
                    marginTop: 2,
                    lineHeight: 1.2,
                  }}>
                    أ{day.weekNum}
                  </div>
                  {day.type === 'training' && !completed && (
                    <div style={{
                      position: 'absolute',
                      top: 3, left: 3,
                      width: 6, height: 6,
                      borderRadius: '50%',
                      background: style.color,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Instruction */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: '#FFF5EF', borderRadius: 10,
        borderRight: '3px solid #E05A00',
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>
          💡 انقري على أي يوم تدريب لتحديده كمكتمل. يتم حفظ تقدمك تلقائياً.
        </p>
      </div>
    </div>
  );
}
