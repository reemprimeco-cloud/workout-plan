// ============================================================
// AdminPanel — Full Admin Dashboard
// Tabs: Dashboard | License Keys | Broadcast | Profile
// Language: Arabic / English toggle
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { getLoginUrl } from '../const';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
const CYAN = '#00E5FF';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PRIME-${seg()}-${seg()}`;
}

type Lang = 'ar' | 'en';
type Tab = 'dashboard' | 'licenses' | 'subscriptions' | 'broadcast' | 'rewards' | 'challenges' | 'profile';

const T: Record<string, Record<Lang, string>> = {
  loading: { ar: '⏳ جاري التحقق...', en: '⏳ Verifying...' },
  loginRequired: { ar: '🔒 يجب تسجيل الدخول', en: '🔒 Login Required' },
  loginBtn: { ar: 'تسجيل الدخول', en: 'Login' },
  forbidden: { ar: '🚫 غير مصرح لك', en: '🚫 Access Denied' },
  backToApp: { ar: '← التطبيق', en: '← App' },
  adminPanel: { ar: '🛡️ لوحة إدارة Prime Fit', en: '🛡️ Prime Fit Admin' },
  tabDashboard: { ar: '📊 الإحصائيات', en: '📊 Dashboard' },
  tabLicenses: { ar: '🔑 الأكواد', en: '🔑 Licenses' },
  tabBroadcast: { ar: '📢 الإشعارات', en: '📢 Broadcast' },
  tabProfile: { ar: '👤 الملف الشخصي', en: '👤 Profile' },
  // Dashboard
  totalLicenses: { ar: 'إجمالي الأكواد', en: 'Total Licenses' },
  activeLicenses: { ar: 'أكواد مفعّلة', en: 'Active Licenses' },
  inactiveLicenses: { ar: 'أكواد معطّلة', en: 'Inactive Licenses' },
  totalBroadcasts: { ar: 'إشعارات مُرسلة', en: 'Broadcasts Sent' },
  totalRecipients: { ar: 'إجمالي المستلمين', en: 'Total Recipients' },
  // Licenses
  createCode: { ar: '➕ إنشاء كود جديد', en: '➕ Create New Code' },
  codeLabel: { ar: '🔑 كود الوصول *', en: '🔑 Access Code *' },
  autoGenerate: { ar: '🎲 توليد تلقائي', en: '🎲 Auto Generate' },
  customerName: { ar: '👤 اسم العميل', en: '👤 Customer Name' },
  customerEmail: { ar: '📧 البريد الإلكتروني', en: '📧 Email' },
  note: { ar: '📝 ملاحظة', en: '📝 Note' },
  expiryDate: { ar: '📅 تاريخ الانتهاء', en: '📅 Expiry Date' },
  neverExpires: { ar: 'لا ينتهي', en: 'Never expires' },
  colExpiry: { ar: 'ينتهي في', en: 'Expires' },
  expired: { ar: '⏰ منتهي', en: '⏰ Expired' },
  optional: { ar: 'اختياري', en: 'Optional' },
  createBtn: { ar: '✅ إنشاء الكود', en: '✅ Create Code' },
  creating: { ar: '⏳ جاري الإنشاء...', en: '⏳ Creating...' },
  codeCreated: { ar: '✅ تم إنشاء الكود بنجاح!', en: '✅ Code created successfully!' },
  codesTitle: { ar: '📋 أكواد الوصول', en: '📋 Access Codes' },
  refresh: { ar: '🔄 تحديث', en: '🔄 Refresh' },
  noCodesYet: { ar: 'لا توجد أكواد بعد.', en: 'No codes yet.' },
  colCode: { ar: 'الكود', en: 'Code' },
  colCustomer: { ar: 'العميل', en: 'Customer' },
  colEmail: { ar: 'البريد', en: 'Email' },
  colNote: { ar: 'الملاحظة', en: 'Note' },
  colStatus: { ar: 'الحالة', en: 'Status' },
  colUsed: { ar: 'تاريخ الاستخدام', en: 'Used At' },
  colCreated: { ar: 'تاريخ الإنشاء', en: 'Created At' },
  colActions: { ar: 'إجراءات', en: 'Actions' },
  active: { ar: '✅ مفعّل', en: '✅ Active' },
  inactive: { ar: '❌ معطّل', en: '❌ Inactive' },
  disable: { ar: '🔕 تعطيل', en: '🔕 Disable' },
  enable: { ar: '✅ تفعيل', en: '✅ Enable' },
  delete: { ar: '🗑️ حذف', en: '🗑️ Delete' },
  confirmDelete: { ar: 'هل تريد حذف الكود', en: 'Delete code' },
  // Broadcast
  broadcastTitle: { ar: '📢 إرسال إشعار للعملاء', en: '📢 Send Broadcast to Customers' },
  broadcastSubject: { ar: '📌 عنوان الرسالة', en: '📌 Subject' },
  broadcastBody: { ar: '✍️ نص الرسالة', en: '✍️ Message Body' },
  broadcastType: { ar: '🏷️ نوع الإشعار', en: '🏷️ Notification Type' },
  broadcastSend: { ar: '📤 إرسال للجميع', en: '📤 Send to All' },
  broadcastSendOne: { ar: '📤 إرسال لعميل محدد', en: '📤 Send to One Customer' },
  broadcastSendOneBtn: { ar: '📤 إرسال', en: '📤 Send' },
  broadcastTargetEmail: { ar: '📧 البريد الإلكتروني للعميل', en: '📧 Customer Email' },
  broadcastSending: { ar: '⏳ جاري الإرسال...', en: '⏳ Sending...' },
  broadcastHistory: { ar: '📜 سجل الإشعارات', en: '📜 Broadcast History' },
  noHistory: { ar: 'لا توجد إشعارات مُرسلة بعد.', en: 'No broadcasts sent yet.' },
  typeUpdate: { ar: 'تحديث', en: 'Update' },
  typeNews: { ar: 'أخبار', en: 'News' },
  typeOffer: { ar: 'عرض', en: 'Offer' },
  typeReminder: { ar: 'تذكير', en: 'Reminder' },
  typeOther: { ar: 'أخرى', en: 'Other' },
  // Profile
  profileTitle: { ar: '👤 الملف الشخصي للمدير', en: '👤 Admin Profile' },
  profileName: { ar: '👤 الاسم', en: '👤 Name' },
  profilePhone: { ar: '📱 رقم الهاتف', en: '📱 Phone' },
  profileEmail: { ar: '📧 البريد الإلكتروني', en: '📧 Email' },
  profilePhoto: { ar: '🖼️ صورة الملف الشخصي', en: '🖼️ Profile Photo' },
  profileSave: { ar: '💾 حفظ التغييرات', en: '💾 Save Changes' },
  profileSaving: { ar: '⏳ جاري الحفظ...', en: '⏳ Saving...' },
  profileSaved: { ar: '✅ تم الحفظ بنجاح!', en: '✅ Saved successfully!' },
  uploadPhoto: { ar: '📷 تغيير الصورة', en: '📷 Change Photo' },
  // Subscriptions tab
  tabSubscriptions: { ar: '💳 الاشتراكات', en: '💳 Subscriptions' },
  subNoData: { ar: 'لا توجد اشتراكات بعد.', en: 'No subscriptions yet.' },
  subActive: { ar: '✅ نشط', en: '✅ Active' },
  subTrialing: { ar: '🔵 تجريبي', en: '🔵 Trialing' },
  subExpired: { ar: '⏰ منتهي', en: '⏰ Expired' },
  subCancelled: { ar: '❌ ملغي', en: '❌ Cancelled' },
  subPending: { ar: '⏳ معلق', en: '⏳ Pending' },
  planFree: { ar: 'مجاني', en: 'Free' },
  planPrimePlus: { ar: 'برايم بلس', en: 'Prime Plus' },
  planPrimePro: { ar: 'برايم برو', en: 'Prime Pro' },
  // Rewards tab
  tabRewards: { ar: '🎰 المكافآت', en: '🎰 Rewards' },
  tabChallenges: { ar: '🏆 التحديات', en: '🏆 Challenges' },
  rewardName: { ar: 'اسم المكافأة', en: 'Reward Name' },
  rewardProbability: { ar: 'الاحتمالية %', en: 'Probability %' },
  rewardTier: { ar: 'المستوى', en: 'Tier' },
  rewardActive: { ar: 'نشط', en: 'Active' },
  rewardSave: { ar: 'حفظ', en: 'Save' },
  rewardHistory: { ar: 'سجل المكافآت', en: 'Reward History' },
  jackpotWinners: { ar: 'الفائزون بالجائزة الكبرى', en: 'Jackpot Winners' },
  noRewards: { ar: 'لا توجد مكافآت', en: 'No rewards yet' },
};

const t = (key: string, lang: Lang) => T[key]?.[lang] ?? key;


// ── Admin Rewards Tab ─────────────────────────────────────────────────────────
function AdminRewardsTab({ lang }: { lang: string }) {
  const isRTL = lang === 'ar';
  const utils = trpc.useUtils();
  const rewardsQuery = trpc.spinWheel.adminGetRewards.useQuery();
  const historyQuery = trpc.spinWheel.adminGetHistory.useQuery({ limit: 20 });
  const jackpotQuery = trpc.spinWheel.adminGetJackpotWinners.useQuery();
  const statsQuery = trpc.spinWheel.adminGetStats.useQuery();
  const updateRewardMutation = trpc.spinWheel.adminUpdateReward.useMutation({
    onSuccess: () => utils.spinWheel.adminGetRewards.invalidate(),
  });
  const deleteRewardMutation = trpc.spinWheel.adminDeleteReward.useMutation({
    onSuccess: () => utils.spinWheel.adminGetRewards.invalidate(),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; nameAr: string; probability: number; tier: string; isActive: boolean }>({
    name: '', nameAr: '', probability: 0, tier: 'common', isActive: true,
  });
  const TIER_COLORS: Record<string, string> = {
    common: '#6B7280', uncommon: '#3B82F6', rare: '#8B5CF6', jackpot: '#F59E0B',
  };
  const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(27,46,94,0.08)', marginBottom: 20,
  };
  const stats = statsQuery.data;
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: lang === 'ar' ? 'إجمالي الدورات' : 'Total Spins', value: stats.totalSpins },
            { label: lang === 'ar' ? 'الجوائز الكبرى' : 'Jackpots', value: stats.jackpotWins },
            { label: lang === 'ar' ? 'الفوز النادر' : 'Rare Wins', value: stats.rareWins },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(27,46,94,0.08)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1B2E5E' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#7A9BB5', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rewards list */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', color: '#1B2E5E', fontSize: 15, fontWeight: 900 }}>
          {lang === 'ar' ? '🎰 قائمة المكافآت' : '🎰 Reward List'}
        </h3>
        {rewardsQuery.isLoading ? (
          <div style={{ color: '#7A9BB5' }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : (rewardsQuery.data ?? []).map((r: any) => (
          <div key={r.id} style={{
            border: '1px solid #E8EFF7', borderRadius: 12, padding: '12px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            {editingId === r.id ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name (EN)"
                    style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                  />
                  <input
                    value={editForm.nameAr}
                    onChange={e => setEditForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder="الاسم (AR)"
                    style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, direction: 'rtl' }}
                  />
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={editForm.probability}
                    onChange={e => setEditForm(f => ({ ...f, probability: parseFloat(e.target.value) }))}
                    placeholder="Probability %"
                    style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                  />
                  <select
                    value={editForm.tier}
                    onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}
                    style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="jackpot">Jackpot</option>
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} />
                  {lang === 'ar' ? 'نشط' : 'Active'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      updateRewardMutation.mutate({ id: r.id, ...editForm });
                      setEditingId(null);
                    }}
                    style={{ background: '#1B2E5E', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {lang === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer' }}>
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: TIER_COLORS[r.tier] + '22', color: TIER_COLORS[r.tier],
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{r.tier}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1B2E5E' }}>
                      {lang === 'ar' ? r.nameAr : r.name}
                    </span>
                    {!r.isActive && <span style={{ color: '#DC2626', fontSize: 11 }}>⛔ Disabled</span>}
                  </div>
                  <div style={{ color: '#7A9BB5', fontSize: 12, marginTop: 2 }}>
                    {lang === 'ar' ? 'الاحتمالية:' : 'Probability:'} <strong>{r.probability}%</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setEditForm({ name: r.name, nameAr: r.nameAr, probability: r.probability, tier: r.tier, isActive: r.isActive });
                    }}
                    style={{ background: '#EFF6FF', color: '#1B2E5E', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                    ✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={() => deleteRewardMutation.mutate({ id: r.id })}
                    style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Jackpot Winners */}
      {(jackpotQuery.data ?? []).length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: '#1B2E5E', fontSize: 15, fontWeight: 900 }}>
            🏆 {lang === 'ar' ? 'الفائزون بالجائزة الكبرى' : 'Jackpot Winners'}
          </h3>
          {(jackpotQuery.data ?? []).map((w: any) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1B2E5E', fontSize: 13 }}>{w.userName ?? w.userId}</div>
                <div style={{ color: '#7A9BB5', fontSize: 11 }}>{lang === 'ar' ? w.rewardNameAr : w.rewardName}</div>
              </div>
              <div style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>
                {new Date(w.wonAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent spin history */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', color: '#1B2E5E', fontSize: 15, fontWeight: 900 }}>
          📋 {lang === 'ar' ? 'سجل الدورات الأخيرة' : 'Recent Spin History'}
        </h3>
        {(historyQuery.data ?? []).length === 0 ? (
          <div style={{ color: '#7A9BB5', fontSize: 13 }}>{lang === 'ar' ? 'لا توجد دورات بعد' : 'No spins yet'}</div>
        ) : (historyQuery.data ?? []).map((h: any) => (
          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#1B2E5E', fontSize: 13 }}>{h.userName ?? h.userId}</div>
              <div style={{ color: '#7A9BB5', fontSize: 11 }}>{lang === 'ar' ? h.rewardNameAr : h.rewardName}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{
                background: TIER_COLORS[h.tier] + '22', color: TIER_COLORS[h.tier],
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                textTransform: 'uppercase',
              }}>{h.tier}</span>
              <span style={{ color: '#94A3B8', fontSize: 10 }}>{new Date(h.spunAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin Challenges Tab ─────────────────────────────────────────────────────
function AdminChallengesTab({ lang }: { lang: string }) {
  const isRTL = lang === 'ar';
  const utils = trpc.useUtils();
  const challengesQuery = trpc.community.getChallenges.useQuery();
  const createMutation = trpc.community.createChallenge.useMutation({
    onSuccess: () => {
      utils.community.getChallenges.invalidate();
      setForm({ title: '', titleAr: '', description: '', descriptionAr: '', xpReward: 100, endDate: '', type: 'custom', targetValue: 1 });
      setMsg('✅ ' + (lang === 'ar' ? 'تم إنشاء التحدي بنجاح' : 'Challenge created successfully'));
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (e) => setMsg('❌ ' + e.message),
  });
  const [form, setForm] = React.useState({
    title: '', titleAr: '', description: '', descriptionAr: '',
    xpReward: 100, endDate: '', type: 'custom' as const, targetValue: 1,
  });
  const [msg, setMsg] = React.useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #CBD5E1', fontSize: 14, outline: 'none',
    background: '#F8FAFC', color: '#1B2E5E',
    direction: isRTL ? 'rtl' : 'ltr',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 700, fontSize: 13,
    color: '#1B2E5E', marginBottom: 6,
  };

  return (
    <div>
      {/* Create Challenge Form */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(27,46,94,0.08)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#1B2E5E', fontSize: 16, fontWeight: 900 }}>
          {lang === 'ar' ? '➕ إنشاء تحدي جديد' : '➕ Create New Challenge'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 7-Day Streak" />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
            <input style={{ ...inputStyle, direction: 'rtl' }} value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="مثال: سلسلة 7 أيام" />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
            <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
            <input style={{ ...inputStyle, direction: 'rtl' }} value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} placeholder="وصف اختياري" />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'نقاط XP' : 'XP Reward'}</label>
            <input type="number" min={1} style={inputStyle} value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
            <input type="date" style={inputStyle} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'النوع' : 'Type'}</label>
            <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="custom">{lang === 'ar' ? 'مخصص' : 'Custom'}</option>
              <option value="sessions">{lang === 'ar' ? 'جلسات' : 'Sessions'}</option>
              <option value="streak">{lang === 'ar' ? 'سلسلة' : 'Streak'}</option>
              <option value="cardio">{lang === 'ar' ? 'كارديو' : 'Cardio'}</option>
              <option value="weight">{lang === 'ar' ? 'وزن' : 'Weight'}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ar' ? 'القيمة المستهدفة' : 'Target Value'}</label>
            <input type="number" min={1} style={inputStyle} value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} />
          </div>
        </div>
        {msg && <p style={{ color: msg.startsWith('✅') ? '#16A34A' : '#DC2626', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{msg}</p>}
        <button
          onClick={() => {
            if (!form.title || !form.titleAr || !form.endDate) {
              setMsg('❌ ' + (lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields'));
              return;
            }
            createMutation.mutate(form);
          }}
          disabled={createMutation.isPending}
          style={{
            background: createMutation.isPending ? '#94A3B8' : 'linear-gradient(135deg, #1B2E5E, #0F1E3D)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '12px 28px', fontSize: 14, fontWeight: 900,
            cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {createMutation.isPending ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (lang === 'ar' ? '✅ إنشاء التحدي' : '✅ Create Challenge')}
        </button>
      </div>

      {/* Existing Challenges List */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(27,46,94,0.08)' }}>
        <h2 style={{ margin: '0 0 16px', color: '#1B2E5E', fontSize: 15, fontWeight: 900 }}>
          {lang === 'ar' ? '📋 التحديات الحالية' : '📋 Active Challenges'}
        </h2>
        {challengesQuery.isLoading ? (
          <p style={{ color: '#94A3B8' }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : !challengesQuery.data?.length ? (
          <p style={{ color: '#94A3B8' }}>{lang === 'ar' ? 'لا توجد تحديات' : 'No challenges yet'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challengesQuery.data.map(ch => (
              <div key={ch.id} style={{
                border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1B2E5E', fontSize: 14 }}>
                    {lang === 'ar' ? ch.titleAr : ch.title}
                  </div>
                  <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                    {lang === 'ar' ? `ينتهي: ${ch.endDate}` : `Ends: ${ch.endDate}`}
                    {' · '}{ch.xpReward} XP
                    {' · '}{ch.participantsCount} {lang === 'ar' ? 'مشارك' : 'participants'}
                  </div>
                </div>
                <span style={{
                  background: ch.isActive ? '#DCFCE7' : '#FEE2E2',
                  color: ch.isActive ? '#16A34A' : '#DC2626',
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                }}>
                  {ch.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'منتهي' : 'Ended')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default function AdminPanel() {
  const { user, loading, logout } = useAuth();
  const utils = trpc.useUtils();
  const [lang, setLang] = useState<Lang>('ar');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const isRTL = lang === 'ar';

  // License state
  const [code, setCode] = useState(generateCode());
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Broadcast state
  const [bSubject, setBSubject] = useState('');
  const [bBody, setBBody] = useState('');
  const [bType, setBType] = useState<'update' | 'news' | 'offer' | 'reminder' | 'other'>('news');
  const [bResult, setBResult] = useState('');
  const [bMode, setBMode] = useState<'all' | 'one'>('all');
  const [bTargetEmail, setBTargetEmail] = useState('');

  // Profile state
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhotoUrl, setPPhotoUrl] = useState('');
  const [pMsg, setPMsg] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const statsQuery = trpc.admin.getStats.useQuery(undefined, { enabled: !!user && user.role === 'admin' });
  const codesQuery = trpc.license.list.useQuery(undefined, { enabled: !!user && user.role === 'admin' });
  const broadcastsQuery = trpc.admin.listBroadcasts.useQuery(undefined, { enabled: !!user && user.role === 'admin' });
  const subscriptionsQuery = trpc.admin.listSubscriptions.useQuery(undefined, { enabled: !!user && user.role === 'admin' });
  const profileQuery = trpc.admin.getProfile.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  useEffect(() => {
    const data = profileQuery.data;
    if (data && !profileLoaded) {
      setPName(data.name ?? '');
      setPPhone(data.phone ?? '');
      setPEmail(data.email ?? '');
      setPPhotoUrl(data.photoUrl ?? '');
      setProfileLoaded(true);
    }
  }, [profileQuery.data, profileLoaded]);

  // Mutations
  const createMutation = trpc.license.create.useMutation({
    onSuccess: () => {
      utils.license.list.invalidate();
      utils.admin.getStats.invalidate();
      setCode(generateCode()); setCustomerName(''); setCustomerEmail(''); setNote('');
      setSuccessMsg(t('codeCreated', lang)); setFormError('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => setFormError(err.message),
  });
  const toggleMutation = trpc.license.toggle.useMutation({ onSuccess: () => { utils.license.list.invalidate(); utils.admin.getStats.invalidate(); } });
  const deleteMutation = trpc.license.delete.useMutation({ onSuccess: () => { utils.license.list.invalidate(); utils.admin.getStats.invalidate(); } });
  const sendToOneMutation = trpc.admin.sendToOne.useMutation({
    onSuccess: () => {
      utils.admin.listBroadcasts.invalidate();
      utils.admin.getStats.invalidate();
      setBResult(`✅ ${lang === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent successfully!'}`);
      setBSubject(''); setBBody(''); setBTargetEmail('');
      setTimeout(() => setBResult(''), 5000);
    },
    onError: (err) => setBResult(`❌ ${err.message}`),
  });

  const broadcastMutation = trpc.admin.sendBroadcast.useMutation({
    onSuccess: (data) => {
      utils.admin.listBroadcasts.invalidate();
      utils.admin.getStats.invalidate();
      setBResult(`✅ ${lang === 'ar' ? `تم الإرسال إلى ${data.sent} من أصل ${data.total} عميل` : `Sent to ${data.sent} of ${data.total} customers`}`);
      setBSubject(''); setBBody('');
      setTimeout(() => setBResult(''), 5000);
    },
    onError: (err) => setBResult(`❌ ${err.message}`),
  });
  const updateProfileMutation = trpc.admin.updateProfile.useMutation({
    onSuccess: () => { utils.admin.getProfile.invalidate(); setPMsg(t('profileSaved', lang)); setTimeout(() => setPMsg(''), 3000); },
    onError: (err) => setPMsg(`❌ ${err.message}`),
  });
  const uploadPhotoMutation = trpc.admin.uploadPhoto.useMutation({
    onSuccess: (data) => { setPPhotoUrl(data.url); },
    onError: (err) => setPMsg(`❌ ${err.message}`),
  });

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: SKY_LIGHT, fontSize: 16, fontFamily: 'Cairo, sans-serif' }}>{t('loading', lang)}</div>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ color: 'white', fontSize: 18, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>{t('loginRequired', lang)}</div>
        <a href={getLoginUrl()} style={{ background: SKY, color: NAVY, textDecoration: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>{t('loginBtn', lang)}</a>
      </div>
    );
  }
  if (user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <div style={{ color: 'white', fontSize: 18, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>{t('forbidden', lang)}</div>
        <div style={{ color: SKY_LIGHT, fontSize: 13, fontFamily: 'Cairo, sans-serif', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          {lang === 'ar'
            ? `أنت مسجل دخول بحساب: ${user.email || user.name}. يرجى تسجيل الخروج والدخول بحساب المدير.`
            : `Logged in as: ${user.email || user.name}. Please sign out and log in with the admin account.`}
        </div>
        <button
          onClick={async () => { await logout(); window.location.href = '/admin'; }}
          style={{
            background: `linear-gradient(135deg, ${CYAN}, #00B8D4)`,
            color: NAVY, border: 'none', borderRadius: 12,
            padding: '12px 28px', fontSize: 14, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            marginTop: 4,
          }}
        >
          {lang === 'ar' ? '🔓 تسجيل الخروج والدخول بحساب آخر' : '🔓 Sign Out & Switch Account'}
        </button>
        <a href="/" style={{ color: SKY_LIGHT, fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>← {lang === 'ar' ? 'العودة للتطبيق' : 'Back to App'}</a>
      </div>
    );
  }

  const codes = codesQuery.data ?? [];
  const broadcasts = broadcastsQuery.data ?? [];
  const stats = statsQuery.data;

  const cardStyle = {
    background: 'white', borderRadius: 20, padding: '24px',
    boxShadow: '0 4px 20px rgba(27,46,94,0.08)', border: `1px solid ${SKY_LIGHT}55`,
    marginBottom: 20,
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
    padding: '10px 12px', fontSize: 13, color: NAVY, outline: 'none',
    fontFamily: 'Cairo, sans-serif',
  };

  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 };

  const typeLabels: Record<string, Lang> = {};
  const typeOptions = [
    { value: 'update', labelKey: 'typeUpdate' },
    { value: 'news', labelKey: 'typeNews' },
    { value: 'offer', labelKey: 'typeOffer' },
    { value: 'reminder', labelKey: 'typeReminder' },
    { value: 'other', labelKey: 'typeOther' },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#F0F4F8', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(27,46,94,0.35)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pPhotoUrl && (
            <img src={pPhotoUrl} alt="Admin" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${CYAN}` }} />
          )}
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 900 }}>{t('adminPanel', lang)}</h1>
            <p style={{ margin: 0, color: SKY_LIGHT, fontSize: 11 }}>{pName || user.name || user.openId}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Language switcher */}
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            style={{
              background: 'rgba(255,255,255,0.15)', border: `1.5px solid ${SKY}`,
              color: 'white', borderRadius: 8, padding: '5px 12px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <a href="/" style={{ background: 'rgba(255,255,255,0.12)', color: SKY_LIGHT, textDecoration: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
            {t('backToApp', lang)}
          </a>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <nav style={{
        background: 'white', borderBottom: `2px solid ${SKY_LIGHT}44`,
        display: 'flex', overflowX: 'auto',
        boxShadow: '0 2px 8px rgba(27,46,94,0.06)',
      }}>
        {([
          ['dashboard', t('tabDashboard', lang)],
          ['licenses', t('tabLicenses', lang)],
          ['subscriptions', t('tabSubscriptions', lang)],
          ['broadcast', t('tabBroadcast', lang)],
          ['rewards', t('tabRewards', lang)],
          ['challenges', t('tabChallenges', lang)],
          ['profile', t('tabProfile', lang)],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: '0 0 auto', padding: '14px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              color: activeTab === id ? NAVY : '#7A9BB5',
              borderBottom: activeTab === id ? `3px solid ${NAVY}` : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={{ padding: '20px', maxWidth: 960, margin: '0 auto' }}>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: t('totalLicenses', lang), value: stats?.total ?? '—', color: NAVY, icon: '🔑' },
                { label: t('activeLicenses', lang), value: stats?.active ?? '—', color: '#16A34A', icon: '✅' },
                { label: t('inactiveLicenses', lang), value: stats?.inactive ?? '—', color: '#DC2626', icon: '❌' },
                { label: t('totalBroadcasts', lang), value: stats?.totalBroadcasts ?? '—', color: '#7C3AED', icon: '📢' },
                { label: t('totalRecipients', lang), value: stats?.totalRecipients ?? '—', color: '#0369A1', icon: '👥' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ background: 'white', borderRadius: 16, padding: '20px 16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(27,46,94,0.08)', border: `1px solid ${SKY_LIGHT}44` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Recent broadcasts preview */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 16px', color: NAVY, fontSize: 15, fontWeight: 900 }}>{t('broadcastHistory', lang)}</h2>
              {broadcasts.length === 0 ? (
                <p style={{ color: '#7A9BB5', fontSize: 13, margin: 0 }}>{t('noHistory', lang)}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {broadcasts.slice(0, 5).map(b => (
                    <div key={b.id} style={{ background: '#F8FBFF', borderRadius: 10, padding: '12px 16px', border: `1px solid ${SKY_LIGHT}44` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{b.subject}</div>
                          <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>
                            {new Date(b.createdAt).toLocaleString('en-GB')} · {b.recipientCount} {lang === 'ar' ? 'مستلم' : 'recipients'}
                          </div>
                        </div>
                        <span style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {typeOptions.find(o => o.value === b.type) ? t(typeOptions.find(o => o.value === b.type)!.labelKey, lang) : b.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── LICENSES TAB ── */}
        {activeTab === 'licenses' && (
          <>
            {/* Create Code Card */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 900 }}>{t('createCode', lang)}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>{t('codeLabel', lang)}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', direction: 'ltr' }} />
                    <button onClick={() => setCode(generateCode())}
                      style={{ background: `${SKY}22`, border: `1.5px solid ${SKY}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', color: NAVY, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t('autoGenerate', lang)}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('customerName', lang)}</label>
                  <input type="text" placeholder={t('optional', lang)} value={customerName} onChange={e => setCustomerName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('customerEmail', lang)}</label>
                  <input type="email" placeholder={t('optional', lang)} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
                </div>
                <div>
                  <label style={labelStyle}>{t('note', lang)}</label>
                  <input type="text" placeholder={t('optional', lang)} value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('expiryDate', lang)}</label>
                  <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    style={{ ...inputStyle, direction: 'ltr' }}
                    min={new Date().toISOString().split('T')[0]} />
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>{t('neverExpires', lang)}</p>
                </div>
              </div>
              {formError && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 12px', fontWeight: 600 }}>⚠️ {formError}</p>}
              {successMsg && <p style={{ color: '#22C55E', fontSize: 13, margin: '0 0 12px', fontWeight: 700 }}>{successMsg}</p>}
              <button
                onClick={() => {
                  if (!code.trim() || code.trim().length < 4) { setFormError(lang === 'ar' ? 'الكود يجب أن يكون 4 أحرف على الأقل' : 'Code must be at least 4 characters'); return; }
                  setFormError('');
                  createMutation.mutate({ code: code.trim(), customerName: customerName.trim() || undefined, customerEmail: customerEmail.trim() || undefined, note: note.trim() || undefined, expiresAt: expiresAt || undefined });
                }}
                disabled={createMutation.isPending}
                style={{ background: createMutation.isPending ? '#94A3B8' : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 900, cursor: createMutation.isPending ? 'not-allowed' : 'pointer' }}>
                {createMutation.isPending ? t('creating', lang) : t('createBtn', lang)}
              </button>
            </div>

            {/* Codes List */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 900 }}>{t('codesTitle', lang)} ({codes.length})</h2>
                <button onClick={() => utils.license.list.invalidate()}
                  style={{ background: `${SKY}22`, border: `1.5px solid ${SKY}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: NAVY, fontSize: 12, fontWeight: 700 }}>
                  {t('refresh', lang)}
                </button>
              </div>
              {codesQuery.isLoading && <div style={{ textAlign: 'center', color: '#7A9BB5', padding: '20px' }}>⏳</div>}
              {!codesQuery.isLoading && codes.length === 0 && (
                <div style={{ textAlign: 'center', color: '#7A9BB5', padding: '32px', background: '#F8FBFF', borderRadius: 12 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
                  <p style={{ margin: 0, fontSize: 13 }}>{t('noCodesYet', lang)}</p>
                </div>
              )}
              {codes.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: NAVY }}>
                        {[t('colCode', lang), t('colCustomer', lang), t('colEmail', lang), t('colNote', lang), t('colStatus', lang), t('colExpiry', lang), t('colUsed', lang), t('colCreated', lang), t('colActions', lang)].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: 'white', fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${SKY_LIGHT}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c, idx) => (
                        <tr key={c.id} style={{ background: idx % 2 === 0 ? 'white' : '#FAFBFF', borderBottom: `1px solid ${SKY_LIGHT}33` }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: NAVY, fontWeight: 700, whiteSpace: 'nowrap', direction: 'ltr' }}>{c.code}</td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>{c.customerName || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#334155', direction: 'ltr', fontSize: 12 }}>{c.customerEmail || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, maxWidth: 140 }}>{c.note || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: c.isActive ? '#DCFCE7' : '#FEE2E2', color: c.isActive ? '#16A34A' : '#DC2626', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                              {c.isActive ? t('active', lang) : t('inactive', lang)}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            {(c as any).expiresAt ? (
                              <span style={{ color: new Date((c as any).expiresAt) < new Date() ? '#DC2626' : '#0369A1', fontSize: 11, fontWeight: 700 }}>
                                {new Date((c as any).expiresAt) < new Date() ? t('expired', lang) : new Date((c as any).expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            ) : <span style={{ color: '#94A3B8', fontSize: 11 }}>{t('neverExpires', lang)}</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {c.usedAt ? new Date(c.usedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })} disabled={toggleMutation.isPending}
                                style={{ background: c.isActive ? '#FEF9C3' : '#DCFCE7', border: `1px solid ${c.isActive ? '#EAB308' : '#22C55E'}`, color: c.isActive ? '#92400E' : '#166534', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {c.isActive ? t('disable', lang) : t('enable', lang)}
                              </button>
                              <button onClick={() => { if (confirm(`${t('confirmDelete', lang)} "${c.code}"?`)) deleteMutation.mutate({ id: c.id }); }} disabled={deleteMutation.isPending}
                                style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#DC2626', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                {t('delete', lang)}
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
          </>
        )}

        {/* ── BROADCAST TAB ── */}
        {activeTab === 'broadcast' && (
          <>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 900 }}>{t('broadcastTitle', lang)}</h2>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['all', 'one'] as const).map(mode => (
                  <button key={mode} onClick={() => { setBMode(mode); setBResult(''); }}
                    style={{
                      flex: 1, padding: '10px', border: `2px solid ${bMode === mode ? NAVY : SKY_LIGHT}`,
                      borderRadius: 10, background: bMode === mode ? NAVY : 'white',
                      color: bMode === mode ? 'white' : '#7A9BB5', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      fontFamily: 'Cairo, sans-serif',
                    }}>
                    {mode === 'all' ? t('broadcastSend', lang) : t('broadcastSendOne', lang)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Target email (only for one mode) */}
                {bMode === 'one' && (
                  <div>
                    <label style={labelStyle}>{t('broadcastTargetEmail', lang)}</label>
                    <input type="email" value={bTargetEmail} onChange={e => setBTargetEmail(e.target.value)}
                      placeholder="customer@example.com"
                      style={{ ...inputStyle, direction: 'ltr' }} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>{t('broadcastType', lang)}</label>
                  <select value={bType} onChange={e => setBType(e.target.value as any)}
                    style={{ ...inputStyle, background: 'white' }}>
                    {typeOptions.map(o => (
                      <option key={o.value} value={o.value}>{t(o.labelKey, lang)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('broadcastSubject', lang)}</label>
                  <input type="text" value={bSubject} onChange={e => setBSubject(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: تحديث جديد في Prime Fit 🎉' : 'e.g. New update in Prime Fit 🎉'}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('broadcastBody', lang)}</label>
                  <textarea value={bBody} onChange={e => setBBody(e.target.value)} rows={6}
                    placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
                {bResult && (
                  <p style={{ color: bResult.startsWith('✅') ? '#16A34A' : '#DC2626', fontSize: 13, fontWeight: 700, margin: 0 }}>{bResult}</p>
                )}
                <button
                  onClick={() => {
                    if (!bSubject.trim() || !bBody.trim()) { setBResult(lang === 'ar' ? '❌ يرجى ملء العنوان والرسالة' : '❌ Please fill subject and message'); return; }
                    if (bMode === 'one') {
                      if (!bTargetEmail.trim() || !bTargetEmail.includes('@')) { setBResult(lang === 'ar' ? '❌ يرجى إدخال بريد إلكتروني صحيح' : '❌ Please enter a valid email'); return; }
                      sendToOneMutation.mutate({ email: bTargetEmail.trim(), subject: bSubject.trim(), body: bBody.trim(), type: bType });
                    } else {
                      if (!confirm(lang === 'ar' ? 'هل تريد إرسال هذا الإشعار لجميع العملاء؟' : 'Send this broadcast to all customers?')) return;
                      broadcastMutation.mutate({ subject: bSubject.trim(), body: bBody.trim(), type: bType });
                    }
                  }}
                  disabled={broadcastMutation.isPending || sendToOneMutation.isPending}
                  style={{ background: (broadcastMutation.isPending || sendToOneMutation.isPending) ? '#94A3B8' : `linear-gradient(135deg, #7C3AED, #5B21B6)`, color: 'white', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 900, cursor: (broadcastMutation.isPending || sendToOneMutation.isPending) ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                  {(broadcastMutation.isPending || sendToOneMutation.isPending) ? t('broadcastSending', lang) : (bMode === 'one' ? t('broadcastSendOneBtn', lang) : t('broadcastSend', lang))}
                </button>
              </div>
            </div>

            {/* Broadcast History */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 16px', color: NAVY, fontSize: 15, fontWeight: 900 }}>{t('broadcastHistory', lang)}</h2>
              {broadcasts.length === 0 ? (
                <p style={{ color: '#7A9BB5', fontSize: 13, margin: 0 }}>{t('noHistory', lang)}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {broadcasts.map(b => (
                    <div key={b.id} style={{ background: '#F8FBFF', borderRadius: 12, padding: '14px 16px', border: `1px solid ${SKY_LIGHT}44` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{b.subject}</div>
                        <span style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {typeOptions.find(o => o.value === b.type) ? t(typeOptions.find(o => o.value === b.type)!.labelKey, lang) : b.type}
                        </span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{b.body.slice(0, 120)}{b.body.length > 120 ? '...' : ''}</div>
                      <div style={{ color: '#94A3B8', fontSize: 11 }}>
                        {new Date(b.createdAt).toLocaleString('en-GB')} · {b.recipientCount} {lang === 'ar' ? 'مستلم' : 'recipients'} · {b.sentBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SUBSCRIPTIONS TAB ── */}
        {activeTab === 'subscriptions' && (
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 900 }}>{t('tabSubscriptions', lang)}</h2>
            {subscriptionsQuery.isLoading ? (
              <p style={{ color: '#7A9BB5', fontSize: 13 }}>⏳ {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            ) : (subscriptionsQuery.data ?? []).length === 0 ? (
              <p style={{ color: '#7A9BB5', fontSize: 13 }}>{t('subNoData', lang)}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: NAVY, color: 'white' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'معرف المستخدم' : 'User ID'}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'الخطة' : 'Plan'}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'مفتاح الترخيص' : 'License Key'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subscriptionsQuery.data ?? []).map((sub, i) => {
                      const statusColor: Record<string, string> = {
                        active: '#16A34A', trialing: '#2563EB', expired: '#DC2626',
                        cancelled: '#64748b', pending: '#D97706',
                      };
                      const planLabel: Record<string, string> = {
                        free: t('planFree', lang),
                        prime_plus: t('planPrimePlus', lang),
                        prime_pro: t('planPrimePro', lang),
                      };
                      const statusLabel: Record<string, string> = {
                        active: t('subActive', lang),
                        trialing: t('subTrialing', lang),
                        expired: t('subExpired', lang),
                        cancelled: t('subCancelled', lang),
                        pending: t('subPending', lang),
                      };
                      return (
                        <tr key={sub.id} style={{ background: i % 2 === 0 ? '#F8FBFF' : 'white', borderBottom: `1px solid ${SKY_LIGHT}44` }}>
                          <td style={{ padding: '10px 12px', color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>
                            {sub.userId.length > 16 ? sub.userId.slice(0, 16) + '…' : sub.userId}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: NAVY }}>
                            {planLabel[sub.plan] ?? sub.plan}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: `${statusColor[sub.status] ?? '#64748b'}18`, color: statusColor[sub.status] ?? '#64748b', borderRadius: 6, padding: '3px 8px', fontWeight: 700, fontSize: 11 }}>
                              {statusLabel[sub.status] ?? sub.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (lang === 'ar' ? 'لا ينتهي' : 'Never')}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: sub.licenseKey ? '#1B2E5E' : '#CBD5E1' }}>
                            {sub.licenseKey ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REWARDS TAB ── */}
        {activeTab === 'rewards' && <AdminRewardsTab lang={lang} />}

        {/* ── CHALLENGES TAB ── */}
        {activeTab === 'challenges' && <AdminChallengesTab lang={lang} />}
        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 24px', color: NAVY, fontSize: 16, fontWeight: 900 }}>{t('profileTitle', lang)}</h2>

            {/* Profile Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                {pPhotoUrl ? (
                  <img src={pPhotoUrl} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${CYAN}` }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, ${SKY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
                )}
              </div>
              <div>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                  style={{ background: `${SKY}22`, border: `1.5px solid ${SKY}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: NAVY, fontSize: 13, fontWeight: 700 }}>
                  {uploadPhotoMutation.isPending ? '⏳...' : t('uploadPhoto', lang)}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const base64 = ev.target?.result as string;
                      uploadPhotoMutation.mutate({ base64, mimeType: file.type });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('profileName', lang)}</label>
                <input type="text" value={pName} onChange={e => setPName(e.target.value)} style={inputStyle} placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'} />
              </div>
              <div>
                <label style={labelStyle}>{t('profilePhone', lang)}</label>
                <input type="tel" value={pPhone} onChange={e => setPPhone(e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} placeholder="+965 XXXX XXXX" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('profileEmail', lang)}</label>
                <input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} placeholder="admin@example.com" />
              </div>
            </div>

            {pMsg && (
              <p style={{ color: pMsg.startsWith('✅') ? '#16A34A' : '#DC2626', fontSize: 13, fontWeight: 700, margin: '16px 0 0' }}>{pMsg}</p>
            )}

            <button
              onClick={() => updateProfileMutation.mutate({ name: pName, phone: pPhone, email: pEmail, photoUrl: pPhotoUrl })}
              disabled={updateProfileMutation.isPending}
              style={{ marginTop: 20, background: updateProfileMutation.isPending ? '#94A3B8' : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 900, cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer' }}>
              {updateProfileMutation.isPending ? t('profileSaving', lang) : t('profileSave', lang)}
            </button>
          </div>
        )}

      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #E8EFF7; }
        ::-webkit-scrollbar-thumb { background: ${SKY}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
