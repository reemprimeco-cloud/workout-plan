// WorkoutTimer - Countdown timer for rest periods and exercise duration
// Design: Energetic Sports RTL, Primary #E05A00, Secondary #1A7A4A
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppIcons } from "./AppIcons";
import { useLanguage } from '../contexts/LanguageContext';

interface WorkoutTimerProps {
  defaultSeconds?: number;
}

export function WorkoutTimer({ defaultSeconds = 60 }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'rest' | 'exercise'>('rest');
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const presets = [
    { label: isAr ? '30 ث' : '30s', seconds: 30 },
    { label: isAr ? '45 ث' : '45s', seconds: 45 },
    { label: isAr ? '60 ث' : '60s', seconds: 60 },
    { label: isAr ? '90 ث' : '90s', seconds: 90 },
    { label: isAr ? '2 د' : '2m', seconds: 120 },
    { label: isAr ? '3 د' : '3m', seconds: 180 },
  ];

  const playBeep = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setIsRunning(false);
            playBeep();
            return 0;
          }
          if (s <= 4) playBeep();
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, playBeep]);

  const reset = (secs?: number) => {
    setIsRunning(false);
    setSeconds(secs ?? defaultSeconds);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const totalSecs = seconds;
  const maxSecs = defaultSeconds;
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (circumference * (seconds / maxSecs));
  const isFinished = seconds === 0;
  const isLow = seconds <= 10 && seconds > 0;

  const modeColor = mode === 'rest' ? '#1A7A4A' : '#E05A00';
  const modeLabel = mode === 'rest' ? (isAr ? 'راحة' : 'Rest') : (isAr ? 'تمرين' : 'Workout');

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: 20,
      border: `2px solid ${modeColor}22`,
      boxShadow: `0 4px 20px ${modeColor}15`,
    }}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
        {(['rest', 'exercise'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              background: mode === m ? modeColor : '#F4F6F8',
              color: mode === m ? 'white' : '#4A4A6A',
              transition: 'all 0.2s',
            }}
          >
            {m === 'rest' ? (isAr ? 'راحة' : 'Rest') : (isAr ? 'تمرين' : 'Workout')}
          </button>
        ))}
      </div>

      {/* Circle Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r="54" fill="none" stroke="#F0F0F0" strokeWidth="8" />
            <circle
              cx="65" cy="65" r="54" fill="none"
              stroke={isFinished ? '#DC2626' : isLow ? '#F59E0B' : modeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 28, fontWeight: 900,
              fontFamily: 'Cairo, sans-serif',
              color: isFinished ? '#DC2626' : isLow ? '#F59E0B' : '#1A1A2E',
              lineHeight: 1,
            }}>
              {isFinished ? <AppIcons.Check size={32} /> : formatTime(seconds)}
            </div>
            <div style={{ fontSize: 11, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif', marginTop: 2 }}>
              {isFinished ? (isAr ? 'انتهى!' : 'Done!') : modeLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
        {presets.map(p => (
          <button
            key={p.seconds}
            onClick={() => reset(p.seconds)}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: `1px solid ${modeColor}44`,
              background: seconds === p.seconds && !isRunning ? `${modeColor}15` : 'white',
              color: modeColor,
              fontSize: 12,
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowInput(!showInput)}
          style={{
            padding: '4px 10px', borderRadius: 8,
            border: `1px solid #E2E8F0`, background: 'white',
            color: '#4A4A6A', fontSize: 12, fontFamily: 'Cairo, sans-serif',
            cursor: 'pointer',
          }}
        >
          {isAr ? 'مخصص' : 'Custom'}
        </button>
      </div>

      {/* Custom Input */}
      {showInput && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
          <input
            type="number"
            placeholder={isAr ? 'ثواني' : 'seconds'}
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            style={{
              width: 80, padding: '6px 10px', borderRadius: 8,
              border: '1px solid #E2E8F0', textAlign: 'center',
              fontFamily: 'Cairo, sans-serif', fontSize: 14,
            }}
          />
          <button
            onClick={() => { reset(parseInt(customInput) || 60); setShowInput(false); }}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: modeColor, color: 'white',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 13,
            }}
          >
            {isAr ? 'تعيين' : 'Set'}
          </button>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: '10px 28px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 700,
            fontSize: 15,
            background: isRunning
              ? '#FEF3C7'
              : `linear-gradient(135deg, ${modeColor}, ${modeColor}CC)`,
            color: isRunning ? '#92400E' : 'white',
            transition: 'all 0.2s',
            boxShadow: isRunning ? 'none' : `0 4px 12px ${modeColor}44`,
          }}
        >
          {isRunning ? (isAr ? 'إيقاف' : 'Pause') : isFinished ? (isAr ? 'إعادة' : 'Restart') : (isAr ? 'ابدأ' : 'Start')}
        </button>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: 'white',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ↺
        </button>
      </div>

      {isFinished && (
        <div style={{
          marginTop: 12, padding: '8px 14px',
          background: '#E8F5EE', borderRadius: 10,
          textAlign: 'center',
          fontFamily: 'Cairo, sans-serif', fontSize: 13,
          color: '#1A7A4A', fontWeight: 600,
        }}>
          {isAr ? 'أحسنتِ! انتقلي للتمرين التالي' : 'Well done! Move to the next exercise'}
        </div>
      )}
    </div>
  );
}
