// ProfilePanel - Editable user profile
import { useState } from 'react';
import type { UserProfile } from '../hooks/useGymTracker';

interface Props {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

export function ProfilePanel({ profile, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const [showReset, setShowReset] = useState(false);

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  const handleReset = () => {
    localStorage.removeItem('gym_tracker_v3');
    window.location.reload();
  };

  return (
    <div>
      {/* Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E, #2D2D4E)',
        borderRadius: 20, padding: '24px 20px', marginBottom: 16,
        textAlign: 'center', color: 'white',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #E05A00, #FF7A2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, boxShadow: '0 6px 20px #E05A0066',
        }}>💪</div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>{profile.name}</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>
          عمر {profile.age} سنة • BMI {profile.bmi}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'الوزن الحالي', value: `${profile.currentWeight} كجم` },
            { label: 'الهدف', value: `${profile.targetWeight} كجم` },
            { label: 'البداية', value: `${profile.startWeight} كجم` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px',
            }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, color: '#1A1A2E', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
            ✏️ تعديل الملف الشخصي
          </h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              padding: '8px 16px', borderRadius: 10,
              background: '#E05A00', color: 'white', border: 'none',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>تعديل</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSave} style={{
                padding: '8px 16px', borderRadius: 10,
                background: '#1A7A4A', color: 'white', border: 'none',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>حفظ</button>
              <button onClick={() => { setForm({ ...profile }); setEditing(false); }} style={{
                padding: '8px 12px', borderRadius: 10,
                background: 'white', color: '#8A8AAA', border: '1px solid #E2E8F0',
                fontFamily: 'Cairo, sans-serif', fontSize: 12, cursor: 'pointer',
              }}>إلغاء</button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'الاسم', field: 'name' as const, type: 'text' },
            { label: 'العمر', field: 'age' as const, type: 'number' },
            { label: 'الوزن الحالي (كجم)', field: 'currentWeight' as const, type: 'number' },
            { label: 'الوزن المستهدف (كجم)', field: 'targetWeight' as const, type: 'number' },
            { label: 'وزن البداية (كجم)', field: 'startWeight' as const, type: 'number' },
            { label: 'BMI', field: 'bmi' as const, type: 'number' },
          ].map(f => (
            <div key={f.field} style={{ gridColumn: f.field === 'name' ? '1 / -1' : 'auto' }}>
              <label style={{
                fontSize: 11, color: '#8A8AAA', display: 'block', marginBottom: 4,
                fontFamily: 'Tajawal, sans-serif',
              }}>{f.label}</label>
              <input
                type={f.type}
                step={f.type === 'number' ? '0.1' : undefined}
                value={form[f.field]}
                onChange={e => setForm(prev => ({
                  ...prev,
                  [f.field]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                }))}
                disabled={!editing}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${editing ? '#E05A00' : '#E2E8F0'}`,
                  fontFamily: 'Cairo, sans-serif', fontSize: 14, outline: 'none',
                  background: editing ? 'white' : '#FAFAFA',
                  color: '#1A1A2E',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px', marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#1A1A2E', fontSize: 15, fontWeight: 900, fontFamily: 'Cairo, sans-serif' }}>
          📱 معلومات التطبيق
        </h3>
        {[
          { icon: '💾', label: 'الحفظ', value: 'تلقائي في المتصفح' },
          { icon: '📊', label: 'البيانات', value: 'محفوظة على جهازك' },
          { icon: '🔄', label: 'التحديث', value: 'قابل للتطوير دائماً' },
          { icon: '📅', label: 'تاريخ البداية', value: new Date(profile.startDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }) },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid #F0F0F0',
          }}>
            <span style={{ fontSize: 13, color: '#4A4A6A', fontFamily: 'Tajawal, sans-serif' }}>
              {s.icon} {s.label}
            </span>
            <span style={{ fontSize: 12, color: '#8A8AAA', fontFamily: 'Cairo, sans-serif' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Reset */}
      <div style={{
        background: '#FFF5F5', borderRadius: 14, padding: '14px 16px',
        border: '2px solid #FFE0E0',
      }}>
        <h4 style={{ margin: '0 0 8px', color: '#DC2626', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
          ⚠️ إعادة تعيين البيانات
        </h4>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#8A8AAA', fontFamily: 'Tajawal, sans-serif' }}>
          سيتم حذف جميع الجلسات والسجلات بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
        </p>
        {showReset ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: '#DC2626', color: 'white', border: 'none',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>نعم، احذف كل شيء</button>
            <button onClick={() => setShowReset(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: 'white', color: '#4A4A6A', border: '1px solid #E2E8F0',
              fontFamily: 'Cairo, sans-serif', fontSize: 13, cursor: 'pointer',
            }}>إلغاء</button>
          </div>
        ) : (
          <button onClick={() => setShowReset(true)} style={{
            padding: '8px 16px', borderRadius: 10,
            background: 'white', color: '#DC2626', border: '2px solid #DC2626',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>إعادة تعيين</button>
        )}
      </div>
    </div>
  );
}
