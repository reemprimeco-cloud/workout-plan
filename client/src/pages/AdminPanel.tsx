// ============================================================
// AdminPanel — Access Code Management
// Protected: only accessible to admin users (role = 'admin')
// Route: /admin
// ============================================================
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { getLoginUrl } from '../const';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PRIME-${seg()}-${seg()}`;
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Form state
  const [code, setCode] = useState(generateCode());
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const codesQuery = trpc.license.list.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  const createMutation = trpc.license.create.useMutation({
    onSuccess: () => {
      utils.license.list.invalidate();
      setCode(generateCode());
      setCustomerName('');
      setCustomerEmail('');
      setNote('');
      setSuccessMsg('✅ تم إنشاء الكود بنجاح!');
      setFormError('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const toggleMutation = trpc.license.toggle.useMutation({
    onSuccess: () => utils.license.list.invalidate(),
  });

  const deleteMutation = trpc.license.delete.useMutation({
    onSuccess: () => utils.license.list.invalidate(),
  });

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: SKY_LIGHT, fontSize: 16, fontFamily: 'Cairo, sans-serif' }}>
          ⏳ جاري التحقق...
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ color: 'white', fontSize: 18, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
          🔒 يجب تسجيل الدخول للوصول إلى لوحة الإدارة
        </div>
        <a
          href={getLoginUrl()}
          style={{
            background: SKY, color: NAVY, textDecoration: 'none',
            borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14,
            fontFamily: 'Cairo, sans-serif',
          }}
        >
          تسجيل الدخول
        </a>
      </div>
    );
  }

  // Not admin
  if (user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <div style={{ color: 'white', fontSize: 18, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
          غير مصرح لك بالوصول إلى هذه الصفحة
        </div>
        <a href="/" style={{ color: SKY_LIGHT, fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>
          ← العودة للتطبيق
        </a>
      </div>
    );
  }

  const handleCreate = () => {
    if (!code.trim() || code.trim().length < 4) {
      setFormError('الكود يجب أن يكون 4 أحرف على الأقل');
      return;
    }
    setFormError('');
    createMutation.mutate({
      code: code.trim(),
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  const codes = codesQuery.data ?? [];

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: '#F0F4F8',
      fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(27,46,94,0.35)',
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 900 }}>
            🛡️ لوحة إدارة Prime Fit
          </h1>
          <p style={{ margin: 0, color: SKY_LIGHT, fontSize: 12 }}>
            إدارة أكواد الوصول
          </p>
        </div>
        <a
          href="/"
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: SKY_LIGHT,
            textDecoration: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ← التطبيق
        </a>
      </header>

      <main style={{ padding: '20px', maxWidth: 900, margin: '0 auto' }}>

        {/* Create Code Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(27,46,94,0.08)',
          border: `1px solid ${SKY_LIGHT}55`,
        }}>
          <h2 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 900 }}>
            ➕ إنشاء كود وصول جديد
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {/* Code */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                🔑 كود الوصول *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1, border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 14, fontFamily: 'monospace',
                    color: NAVY, outline: 'none', direction: 'ltr',
                  }}
                />
                <button
                  onClick={() => setCode(generateCode())}
                  style={{
                    background: `${SKY}22`, border: `1.5px solid ${SKY}`,
                    borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                    color: NAVY, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  }}
                >
                  🎲 توليد تلقائي
                </button>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                👤 اسم العميل
              </label>
              <input
                type="text"
                placeholder="اختياري"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
                  padding: '10px 12px', fontSize: 13, color: NAVY, outline: 'none',
                }}
              />
            </div>

            {/* Customer Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                📧 البريد الإلكتروني
              </label>
              <input
                type="email"
                placeholder="اختياري"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
                  padding: '10px 12px', fontSize: 13, color: NAVY, outline: 'none',
                  direction: 'ltr',
                }}
              />
            </div>

            {/* Note */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                📝 ملاحظة
              </label>
              <input
                type="text"
                placeholder="اختياري — مثال: طلب WooCommerce #1234"
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
                  padding: '10px 12px', fontSize: 13, color: NAVY, outline: 'none',
                }}
              />
            </div>
          </div>

          {formError && (
            <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 12px', fontWeight: 600 }}>
              ⚠️ {formError}
            </p>
          )}
          {successMsg && (
            <p style={{ color: '#22C55E', fontSize: 13, margin: '0 0 12px', fontWeight: 700 }}>
              {successMsg}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            style={{
              background: createMutation.isPending
                ? '#94A3B8'
                : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
              color: 'white', border: 'none', borderRadius: 12,
              padding: '12px 28px', fontSize: 14, fontWeight: 900,
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
              boxShadow: createMutation.isPending ? 'none' : `0 4px 16px ${NAVY}44`,
            }}
          >
            {createMutation.isPending ? '⏳ جاري الإنشاء...' : '✅ إنشاء الكود'}
          </button>
        </div>

        {/* Codes List */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          boxShadow: '0 4px 20px rgba(27,46,94,0.08)',
          border: `1px solid ${SKY_LIGHT}55`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 900 }}>
              📋 أكواد الوصول ({codes.length})
            </h2>
            <button
              onClick={() => utils.license.list.invalidate()}
              style={{
                background: `${SKY}22`, border: `1.5px solid ${SKY}`,
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                color: NAVY, fontSize: 12, fontWeight: 700,
              }}
            >
              🔄 تحديث
            </button>
          </div>

          {codesQuery.isLoading && (
            <div style={{ textAlign: 'center', color: '#7A9BB5', padding: '20px' }}>
              ⏳ جاري التحميل...
            </div>
          )}

          {!codesQuery.isLoading && codes.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#7A9BB5', padding: '32px',
              background: '#F8FBFF', borderRadius: 12,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
              <p style={{ margin: 0, fontSize: 13 }}>لا توجد أكواد بعد. أنشئ أول كود أعلاه.</p>
            </div>
          )}

          {codes.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F0F4F8' }}>
                    {['الكود', 'العميل', 'البريد', 'الملاحظة', 'الحالة', 'تاريخ الاستخدام', 'تاريخ الإنشاء', 'إجراءات'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'right',
                        color: NAVY, fontWeight: 700, fontSize: 12,
                        borderBottom: `2px solid ${SKY_LIGHT}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c, idx) => (
                    <tr key={c.id} style={{
                      background: idx % 2 === 0 ? 'white' : '#FAFBFF',
                      borderBottom: `1px solid ${SKY_LIGHT}33`,
                    }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: NAVY, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {c.code}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {c.customerName || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', direction: 'ltr', fontSize: 12 }}>
                        {c.customerEmail || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, maxWidth: 160 }}>
                        {c.note || '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: c.isActive ? '#DCFCE7' : '#FEE2E2',
                          color: c.isActive ? '#16A34A' : '#DC2626',
                          borderRadius: 6, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {c.isActive ? '✅ مفعّل' : '❌ معطّل'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {c.usedAt ? new Date(c.usedAt).toLocaleDateString('ar-SA') : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(c.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                            disabled={toggleMutation.isPending}
                            style={{
                              background: c.isActive ? '#FEF9C3' : '#DCFCE7',
                              border: `1px solid ${c.isActive ? '#EAB308' : '#22C55E'}`,
                              color: c.isActive ? '#92400E' : '#166534',
                              borderRadius: 6, padding: '4px 10px',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {c.isActive ? '🔕 تعطيل' : '✅ تفعيل'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل تريد حذف الكود "${c.code}"؟`)) {
                                deleteMutation.mutate({ id: c.id });
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            style={{
                              background: '#FEE2E2',
                              border: '1px solid #EF4444',
                              color: '#DC2626',
                              borderRadius: 6, padding: '4px 10px',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Usage instructions */}
        <div style={{
          background: `${NAVY}08`,
          borderRadius: 16, padding: '18px 20px', marginTop: 20,
          border: `1px solid ${SKY_LIGHT}55`,
        }}>
          <h3 style={{ margin: '0 0 10px', color: NAVY, fontSize: 14, fontWeight: 900 }}>
            📖 كيفية الاستخدام
          </h3>
          <ol style={{ margin: 0, padding: '0 20px', color: '#334155', fontSize: 12, lineHeight: 2 }}>
            <li>أنشئ كوداً جديداً لكل عميل يشتري البرنامج</li>
            <li>أرسل الكود للعميل عبر البريد الإلكتروني أو واتساب</li>
            <li>يدخل العميل الكود في شاشة تفعيل Prime Fit</li>
            <li>يمكنك تعطيل أي كود في أي وقت لإيقاف الوصول</li>
            <li>يمكنك أيضاً إرسال رابط مباشر: <code style={{ background: '#E8F0FE', padding: '2px 6px', borderRadius: 4, direction: 'ltr', display: 'inline-block' }}>https://primefit.manus.space/?key=PRIME-XXXX-XXXX</code></li>
          </ol>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
      `}</style>
    </div>
  );
}
