/**
 * GymClassesAdminTab — Admin panel tab for managing gyms, branches, classes,
 * and importing schedules via Excel upload.
 */
import React, { useState, useRef } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';

type Lang = 'ar' | 'en';

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const INTENSITIES = ["Beginner","Intermediate","Advanced"] as const;

interface Props { lang: Lang; }

// ─── Shared styles ────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 2px 12px rgba(27,46,94,0.08)', marginBottom: 20,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 900, color: NAVY, margin: '0 0 16px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #D1D9E6',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const btn = (primary = true): React.CSSProperties => ({
  padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700,
  background: primary ? `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})` : '#F1F5F9',
  color: primary ? 'white' : NAVY,
});
const dangerBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 700, background: '#FEE2E2', color: '#DC2626',
};
const badge = (intensity: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: intensity === 'Beginner' ? '#DCFCE7' : intensity === 'Intermediate' ? '#FEF9C3' : '#FEE2E2',
  color: intensity === 'Beginner' ? '#16A34A' : intensity === 'Intermediate' ? '#CA8A04' : '#DC2626',
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function GymClassesAdminTab({ lang }: Props) {
  const isAr = lang === 'ar';
  const [subTab, setSubTab] = useState<'gyms' | 'branches' | 'classes' | 'import'>('gyms');

  const subTabs: { id: typeof subTab; label: string }[] = [
    { id: 'gyms',     label: isAr ? 'الجيمات' : 'Gyms' },
    { id: 'branches', label: isAr ? 'الفروع' : 'Branches' },
    { id: 'classes',  label: isAr ? 'الحصص' : 'Classes' },
    { id: 'import',   label: isAr ? 'استيراد جدول' : 'Import Schedule' },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${SKY_LIGHT}`, paddingBottom: 0 }}>
        {subTabs.map(st => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              color: subTab === st.id ? NAVY : '#7A9BB5',
              borderBottom: subTab === st.id ? `3px solid ${NAVY}` : '3px solid transparent',
              marginBottom: -2,
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {subTab === 'gyms'     && <GymsTab isAr={isAr} />}
      {subTab === 'branches' && <BranchesTab isAr={isAr} />}
      {subTab === 'classes'  && <ClassesTab isAr={isAr} />}
      {subTab === 'import'   && <ImportTab isAr={isAr} />}
    </div>
  );
}

// ─── GYMS TAB ────────────────────────────────────────────────────────────────
function GymsTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: gymList = [], isLoading } = trpc.gymClasses.getGyms.useQuery();
  const createGym    = trpc.gymClasses.createGym.useMutation({ onSuccess: () => utils.gymClasses.getGyms.invalidate() });
  const updateGym    = trpc.gymClasses.updateGym.useMutation({ onSuccess: () => { utils.gymClasses.getGyms.invalidate(); setEditGym(null); } });
  const uploadLogo   = trpc.gymClasses.uploadGymLogo.useMutation();
  const deleteGym    = trpc.gymClasses.deleteGym.useMutation({ onSuccess: () => utils.gymClasses.getGyms.invalidate() });

  // Add form state
  const [name, setName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoMime, setLogoMime] = useState<string>('image/png');
  const [msg, setMsg] = useState('');
  const addFileRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editGym, setEditGym] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editLogoBase64, setEditLogoBase64] = useState<string | null>(null);
  const [editLogoMime, setEditLogoMime] = useState<string>('image/png');
  const [editMsg, setEditMsg] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mime: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { base64, mime } = await fileToBase64(file);
    const previewUrl = URL.createObjectURL(file);
    if (mode === 'add') {
      setLogoPreview(previewUrl); setLogoBase64(base64); setLogoMime(mime);
    } else {
      setEditLogoPreview(previewUrl); setEditLogoBase64(base64); setEditLogoMime(mime);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await createGym.mutateAsync({ name: name.trim() });
      // Upload logo after gym is created
      if (logoBase64 && result.id) {
        await uploadLogo.mutateAsync({ base64: logoBase64, mimeType: logoMime, gymId: result.id });
        utils.gymClasses.getGyms.invalidate();
      }
      setName(''); setLogoPreview(null); setLogoBase64(null);
      setMsg(isAr ? 'تم إنشاء الجيم بنجاح!' : 'Gym created!');
    } catch { setMsg(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const openEdit = (g: any) => {
    setEditGym(g);
    setEditName(g.name);
    setEditLogoPreview(g.logoUrl || null);
    setEditLogoBase64(null);
    setEditMsg('');
  };

  const handleUpdate = async () => {
    if (!editGym || !editName.trim()) return;
    try {
      // Upload new logo first if changed
      let newLogoUrl: string | undefined;
      if (editLogoBase64) {
        const res = await uploadLogo.mutateAsync({ base64: editLogoBase64, mimeType: editLogoMime, gymId: editGym.id });
        newLogoUrl = res.url;
      }
      await updateGym.mutateAsync({
        id: editGym.id,
        name: editName.trim(),
        ...(newLogoUrl ? { logoUrl: newLogoUrl } : {}),
      });
      setEditMsg(isAr ? 'تم التحديث!' : 'Updated!');
    } catch { setEditMsg(isAr ? 'حدث خطأ' : 'Error'); }
  };

  return (
    <div>
      {/* ── Add gym form ── */}
      <div style={card}>
        <p style={sectionTitle}>{isAr ? 'إضافة جيم جديد' : 'Add New Gym'}</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Logo upload area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{isAr ? 'شعار الجيم' : 'Gym Logo'}</label>
            <div
              onClick={() => addFileRef.current?.click()}
              style={{
                width: 72, height: 72, borderRadius: 12, border: '2px dashed #D1D9E6',
                background: '#F8FAFC', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="#D1D9E6" strokeWidth="1.5" />
                </svg>
              )}
            </div>
            <input ref={addFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoChange(e, 'add')} />
            <span style={{ fontSize: 10, color: '#94A3B8' }}>{isAr ? 'انقر للرفع' : 'Click to upload'}</span>
          </div>

          {/* Name input */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{isAr ? 'اسم الجيم *' : 'Gym Name *'}</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={isAr ? 'مثال: Prime Fit' : 'e.g. Prime Fit'} />
          </div>

          <button onClick={handleCreate} disabled={createGym.isPending || uploadLogo.isPending} style={btn()}>
            {(createGym.isPending || uploadLogo.isPending) ? '...' : (isAr ? 'إضافة' : 'Add')}
          </button>
        </div>
        {msg && <p style={{ color: '#16A34A', fontSize: 12, marginTop: 8 }}>{msg}</p>}
      </div>

      {/* ── Gym list ── */}
      <div style={card}>
        <p style={sectionTitle}>{isAr ? 'الجيمات المسجّلة' : 'Registered Gyms'}</p>
        {isLoading ? <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : gymList.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'لا توجد جيمات بعد.' : 'No gyms yet.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gymList.map((g: any) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Logo or initial */}
                  {g.logoUrl ? (
                    <img src={g.logoUrl} alt={g.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16 }}>
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{g.name}</span>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>ID: {g.id}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(g)} style={{ ...btn(false), padding: '6px 14px', fontSize: 12 }}>
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                  <button onClick={() => { if (confirm(isAr ? `حذف "${g.name}"؟` : `Delete "${g.name}"?`)) deleteGym.mutate({ id: g.id }); }} style={dangerBtn}>
                    {isAr ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editGym && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setEditGym(null); }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 20px', color: NAVY, fontSize: 17, fontWeight: 900 }}>
              {isAr ? `تعديل: ${editGym.name}` : `Edit: ${editGym.name}`}
            </h3>

            {/* Logo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div
                onClick={() => editFileRef.current?.click()}
                style={{
                  width: 96, height: 96, borderRadius: 16, border: '2px dashed #D1D9E6',
                  background: '#F8FAFC', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8,
                }}
              >
                {editLogoPreview ? (
                  <img src={editLogoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="#D1D9E6" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
              <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoChange(e, 'edit')} />
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{isAr ? 'انقر لتغيير الشعار' : 'Click to change logo'}</span>
            </div>

            {/* Name input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{isAr ? 'اسم الجيم' : 'Gym Name'}</label>
              <input style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} />
            </div>

            {editMsg && <p style={{ color: '#16A34A', fontSize: 12, marginBottom: 12 }}>{editMsg}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditGym(null)} style={btn(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleUpdate} disabled={updateGym.isPending || uploadLogo.isPending} style={btn()}>
                {(updateGym.isPending || uploadLogo.isPending) ? '...' : (isAr ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BRANCHES TAB ─────────────────────────────────────────────────────────────
function BranchesTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: gyms = [] } = trpc.gymClasses.getGyms.useQuery();
  const [selectedGymId, setSelectedGymId] = useState<number | undefined>();
  const { data: branches = [], isLoading } = trpc.gymClasses.getBranches.useQuery({ gymId: selectedGymId });
  const createBranch = trpc.gymClasses.createBranch.useMutation({ onSuccess: () => utils.gymClasses.getBranches.invalidate() });
  const deleteBranch = trpc.gymClasses.deleteBranch.useMutation({ onSuccess: () => utils.gymClasses.getBranches.invalidate() });

  const [gymId, setGymId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [msg, setMsg] = useState('');

  const handleCreate = async () => {
    if (!gymId || !name.trim()) return;
    try {
      await createBranch.mutateAsync({ gymId: Number(gymId), name: name.trim(), location: location.trim() || undefined });
      setName(''); setLocation(''); setMsg(isAr ? 'تم إنشاء الفرع!' : 'Branch created!');
    } catch { setMsg(isAr ? 'حدث خطأ' : 'Error'); }
  };

  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>{isAr ? 'إضافة فرع جديد' : 'Add New Branch'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{isAr ? 'الجيم *' : 'Gym *'}</label>
            <select style={inputStyle} value={gymId} onChange={e => setGymId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">{isAr ? 'اختر الجيم' : 'Select gym'}</option>
              {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{isAr ? 'اسم الفرع *' : 'Branch Name *'}</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={isAr ? 'مثال: الفرع الرئيسي' : 'e.g. Main Branch'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{isAr ? 'الموقع' : 'Location'}</label>
            <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder={isAr ? 'مثال: الكويت، حولي' : 'e.g. Kuwait, Hawalli'} />
          </div>
          <button onClick={handleCreate} disabled={createBranch.isPending} style={btn()}>
            {createBranch.isPending ? '...' : (isAr ? 'إضافة' : 'Add')}
          </button>
        </div>
        {msg && <p style={{ color: '#16A34A', fontSize: 12, marginTop: 8 }}>{msg}</p>}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...sectionTitle, margin: 0 }}>{isAr ? 'الفروع' : 'Branches'}</p>
          <select style={{ ...inputStyle, width: 200 }} value={selectedGymId ?? ''} onChange={e => setSelectedGymId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">{isAr ? 'كل الجيمات' : 'All gyms'}</option>
            {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {isLoading ? <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : branches.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'لا توجد فروع.' : 'No branches.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {branches.map((b: any) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{b.name}</span>
                  {b.location && <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>{b.location}</span>}
                  <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>Gym ID: {b.gymId}</span>
                </div>
                <button onClick={() => { if (confirm(isAr ? `حذف "${b.name}"؟` : `Delete "${b.name}"?`)) deleteBranch.mutate({ id: b.id }); }} style={dangerBtn}>
                  {isAr ? 'حذف' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CLASSES TAB ──────────────────────────────────────────────────────────────
function ClassesTab({ isAr }: { isAr: boolean }) {
  const utils = trpc.useUtils();
  const { data: gyms = [] } = trpc.gymClasses.getGyms.useQuery();
  const [filterGymId, setFilterGymId] = useState<number | undefined>();
  const [filterDay, setFilterDay] = useState<string>('');
  const { data: branches = [] } = trpc.gymClasses.getBranches.useQuery({ gymId: filterGymId });
  const { data: classes = [], isLoading } = trpc.gymClasses.getClasses.useQuery({ gymId: filterGymId, day: filterDay || undefined });
  const createClass = trpc.gymClasses.createClass.useMutation({ onSuccess: () => utils.gymClasses.getClasses.invalidate() });
  const deleteClass = trpc.gymClasses.deleteClass.useMutation({ onSuccess: () => utils.gymClasses.getClasses.invalidate() });

  const [form, setForm] = useState({
    gymId: '' as number | '',
    branchId: '' as number | '',
    className: '',
    coach: '',
    day: 'Monday' as typeof DAYS[number],
    time: '07:00 AM',
    durationMin: 60,
    intensity: 'Beginner' as typeof INTENSITIES[number],
    notes: '',
  });
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const formBranches = trpc.gymClasses.getBranches.useQuery({ gymId: form.gymId ? Number(form.gymId) : undefined });

  const handleCreate = async () => {
    if (!form.gymId || !form.branchId || !form.className || !form.coach) return;
    try {
      await createClass.mutateAsync({
        gymId: Number(form.gymId),
        branchId: Number(form.branchId),
        className: form.className,
        coach: form.coach,
        day: form.day,
        time: form.time,
        durationMin: form.durationMin,
        intensity: form.intensity,
        notes: form.notes || null,
      });
      setForm({ gymId: '', branchId: '', className: '', coach: '', day: 'Monday', time: '07:00 AM', durationMin: 60, intensity: 'Beginner', notes: '' });
      setMsg(isAr ? 'تم إنشاء الحصة!' : 'Class created!');
      setShowForm(false);
    } catch { setMsg(isAr ? 'حدث خطأ' : 'Error'); }
  };

  const dayLabel: Record<string, string> = {
    Monday: isAr ? 'الاثنين' : 'Mon', Tuesday: isAr ? 'الثلاثاء' : 'Tue',
    Wednesday: isAr ? 'الأربعاء' : 'Wed', Thursday: isAr ? 'الخميس' : 'Thu',
    Friday: isAr ? 'الجمعة' : 'Fri', Saturday: isAr ? 'السبت' : 'Sat', Sunday: isAr ? 'الأحد' : 'Sun',
  };

  return (
    <div>
      {/* Filters + Add button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...inputStyle, width: 160 }} value={filterGymId ?? ''} onChange={e => setFilterGymId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">{isAr ? 'كل الجيمات' : 'All gyms'}</option>
          {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 140 }} value={filterDay} onChange={e => setFilterDay(e.target.value)}>
          <option value="">{isAr ? 'كل الأيام' : 'All days'}</option>
          {DAYS.map(d => <option key={d} value={d}>{dayLabel[d]}</option>)}
        </select>
        <button onClick={() => setShowForm(v => !v)} style={btn()}>
          {showForm ? (isAr ? 'إخفاء النموذج' : 'Hide Form') : (isAr ? '+ إضافة حصة' : '+ Add Class')}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={card}>
          <p style={sectionTitle}>{isAr ? 'إضافة حصة جديدة' : 'Add New Class'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: isAr ? 'الجيم *' : 'Gym *', el: (
                <select style={inputStyle} value={form.gymId} onChange={e => setForm(f => ({ ...f, gymId: e.target.value ? Number(e.target.value) : '', branchId: '' }))}>
                  <option value="">{isAr ? 'اختر' : 'Select'}</option>
                  {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )},
              { label: isAr ? 'الفرع *' : 'Branch *', el: (
                <select style={inputStyle} value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value ? Number(e.target.value) : '' }))}>
                  <option value="">{isAr ? 'اختر' : 'Select'}</option>
                  {(formBranches.data ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )},
              { label: isAr ? 'اسم الحصة *' : 'Class Name *', el: <input style={inputStyle} value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} placeholder="e.g. Core Burn" /> },
              { label: isAr ? 'المدرب *' : 'Coach *', el: <input style={inputStyle} value={form.coach} onChange={e => setForm(f => ({ ...f, coach: e.target.value }))} placeholder="Coach name" /> },
              { label: isAr ? 'اليوم *' : 'Day *', el: (
                <select style={inputStyle} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value as typeof DAYS[number] }))}>
                  {DAYS.map(d => <option key={d} value={d}>{dayLabel[d]}</option>)}
                </select>
              )},
              { label: isAr ? 'الوقت *' : 'Time *', el: <input style={inputStyle} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="07:00 AM" /> },
              { label: isAr ? 'المدة (دقيقة)' : 'Duration (min)', el: <input type="number" style={inputStyle} value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))} min={15} max={300} /> },
              { label: isAr ? 'المستوى' : 'Intensity', el: (
                <select style={inputStyle} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value as typeof INTENSITIES[number] }))}>
                  {INTENSITIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              )},
              { label: isAr ? 'ملاحظات' : 'Notes', el: <input style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={isAr ? 'اختياري' : 'Optional'} /> },
            ].map(({ label, el }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{label}</label>
                {el}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={handleCreate} disabled={createClass.isPending} style={btn()}>
              {createClass.isPending ? '...' : (isAr ? 'إنشاء الحصة' : 'Create Class')}
            </button>
            <button onClick={() => setShowForm(false)} style={btn(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
          </div>
          {msg && <p style={{ color: '#16A34A', fontSize: 12, marginTop: 8 }}>{msg}</p>}
        </div>
      )}

      {/* Classes list */}
      <div style={card}>
        <p style={sectionTitle}>{isAr ? 'قائمة الحصص' : 'Class Schedule'} {classes.length > 0 && `(${classes.length})`}</p>
        {isLoading ? <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : classes.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 13 }}>{isAr ? 'لا توجد حصص.' : 'No classes found.'}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {[isAr?'الحصة':'Class', isAr?'المدرب':'Coach', isAr?'اليوم':'Day', isAr?'الوقت':'Time', isAr?'المدة':'Duration', isAr?'المستوى':'Intensity', isAr?'الفرع':'Branch', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: NAVY }}>{c.className}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{c.coach}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{dayLabel[c.day] || c.day}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{c.time}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{c.durationMin} {isAr?'د':'min'}</td>
                    <td style={{ padding: '10px 12px' }}><span style={badge(c.intensity)}>{c.intensity}</span></td>
                    <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>ID: {c.branchId}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => { if (confirm(isAr ? `حذف "${c.className}"؟` : `Delete "${c.className}"?`)) deleteClass.mutate({ id: c.id }); }} style={dangerBtn}>
                        {isAr ? 'حذف' : 'Del'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IMPORT TAB ───────────────────────────────────────────────────────────────
function ImportTab({ isAr }: { isAr: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; gyms: number; branches: number } | null>(null);
  const [error, setError] = useState('');
  const [filename, setFilename] = useState('');

  const importMutation = trpc.gymClasses.importSchedule.useMutation({
    onSuccess: (data) => { setResult(data); setError(''); },
    onError: (e) => { setError(e.message); setResult(null); },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      await importMutation.mutateAsync({ base64, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>{isAr ? 'استيراد جدول الحصص من Excel' : 'Import Class Schedule from Excel'}</p>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 1.6 }}>
          {isAr
            ? 'قم بتحميل ملف Excel (.xlsx) يحتوي على ورقة "Schedule" مع الأعمدة التالية: Gym Name, Branch, Day, Time, Class Name, Coach, Duration (min), Intensity, Calories (اختياري), Notes (اختياري).'
            : 'Upload an Excel (.xlsx) file containing a "Schedule" sheet with columns: Gym Name, Branch, Day, Time, Class Name, Coach, Duration (min), Intensity, Calories (optional), Notes (optional).'}
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} style={btn()}>
            {isAr ? 'اختر ملف Excel' : 'Choose Excel File'}
          </button>
          {filename && <span style={{ fontSize: 13, color: '#475569' }}>{filename}</span>}
          {importMutation.isPending && <span style={{ fontSize: 13, color: SKY }}>{isAr ? 'جاري الاستيراد...' : 'Importing...'}</span>}
        </div>

        {result && (
          <div style={{ marginTop: 16, padding: '16px 20px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
            <p style={{ fontWeight: 900, color: '#16A34A', fontSize: 14, margin: '0 0 8px' }}>
              {isAr ? 'تم الاستيراد بنجاح!' : 'Import Successful!'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: isAr ? 'حصص مستوردة' : 'Classes Imported', value: result.imported, color: '#16A34A' },
                { label: isAr ? 'صفوف محذوفة' : 'Rows Skipped', value: result.skipped, color: '#CA8A04' },
                { label: isAr ? 'جيمات' : 'Gyms', value: result.gyms, color: NAVY },
                { label: isAr ? 'فروع' : 'Branches', value: result.branches, color: '#7C3AED' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
            <p style={{ color: '#DC2626', fontSize: 13, margin: 0, fontWeight: 700 }}>{isAr ? 'خطأ:' : 'Error:'} {error}</p>
          </div>
        )}
      </div>

      {/* Template download hint */}
      <div style={{ ...card, background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          {isAr
            ? 'تحتاج إلى قالب Excel؟ اطلب من المسؤول تنزيل ملف "PrimeFit_Branch_Schedule_Template.xlsx" وأرسله للفروع لملئه.'
            : 'Need a template? Ask the administrator to download the "PrimeFit_Branch_Schedule_Template.xlsx" file and send it to branches to fill in.'}
        </p>
      </div>
    </div>
  );
}
