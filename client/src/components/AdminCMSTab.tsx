/**
 * AdminCMSTab — Full no-code CMS for Prime Fit admin panel
 * Three sub-tabs: Content | Appearance | Error Monitor
 */
import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

// ── Brand colors ──────────────────────────────────────────────────────────────
const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';
const SKY_LIGHT = '#A8D4E8';
// ── Session types list ────────────────────────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { id: 'lower_body',      label: 'Lower Body',       labelAr: 'الجزء السفلي',   defaultIcon: '/manus-storage/icon_lower_body_59f81631.png' },
  { id: 'upper_arms',      label: 'Upper Arms & Back', labelAr: 'الأذرع والظهر',  defaultIcon: '/manus-storage/icon_upper_body_bbd91e5d.png' },
  { id: 'chest_shoulders', label: 'Chest & Shoulders', labelAr: 'الصدر والأكتاف', defaultIcon: '/manus-storage/icon_chest_shoulders_8582f4ac.png' },
  { id: 'core_cardio',     label: 'Core & Cardio',     labelAr: 'الكور والكارديو', defaultIcon: '/manus-storage/icon_core_cardio_5e8c3914.png' },
  { id: 'full_body',       label: 'Full Body',         labelAr: 'الجسم كامل',   defaultIcon: '/manus-storage/icon_full_body_55a7cc7f.png' },
  { id: 'aqua',            label: 'Aqua',              labelAr: 'الأكوا',         defaultIcon: '/manus-storage/icon_aqua_6436dff1.png' },
  { id: 'sauna',           label: 'Sauna',             labelAr: 'الساونا',        defaultIcon: '/manus-storage/icon_sauna_24076898.png' },
  { id: 'active_rest',     label: 'Active Rest',       labelAr: 'الراحة النشطة', defaultIcon: '/manus-storage/icon_cardio_d3fdaaba.png' },
  { id: 'warm_up',         label: 'Warm Up',           labelAr: 'الإحماء',        defaultIcon: '/manus-storage/icon_warm_up_6ff9052b.png' },
  { id: 'stretching',      label: 'Stretching',        labelAr: 'التمدد',        defaultIcon: '/manus-storage/icon_stretching_59c73b13.png' },
  { id: 'home_workouts',   label: 'Home Workouts',     labelAr: 'تمارين المنزل', defaultIcon: '/manus-storage/icon_home_workouts_10e4a4f7.png' },
  { id: 'pilates',         label: 'Pilates',           labelAr: 'البيلاتس',       defaultIcon: '/manus-storage/icon_pilates_1a0c0196.png' },
  { id: 'mobility',        label: 'Mobility',          labelAr: 'المرونة',        defaultIcon: '/manus-storage/icon_mobility_e968ef5f.png' },
  { id: 'quick_workouts',  label: 'Quick Workouts',    labelAr: 'تمارين سريعة', defaultIcon: '/manus-storage/icon_quick_workouts_2e09574e.png' },
];
// ── Exercise list (all IDs + names) ──────────────────────────────────────────
const EXERCISES = [
  // Women
  { id: 'w-shoulder-press',    name: 'Shoulder Press Machine',   nameAr: 'جهاز Shoulder Press',   gender: 'F' },
  { id: 'w-lateral-raise',     name: 'Lateral Raise Machine',    nameAr: 'جهاز Lateral Raise',    gender: 'F' },
  { id: 'w-chest-press',       name: 'Chest Press Machine',      nameAr: 'جهاز Chest Press',      gender: 'F' },
  { id: 'w-pec-deck',          name: 'Pec Deck Machine',         nameAr: 'جهاز Pec Deck',         gender: 'F' },
  { id: 'w-biceps-curl',       name: 'Biceps Curl Machine',      nameAr: 'جهاز Biceps Curl',      gender: 'F' },
  { id: 'w-triceps-pushdown',  name: 'Triceps Pushdown Machine', nameAr: 'جهاز Triceps Pushdown', gender: 'F' },
  { id: 'w-lat-pulldown',      name: 'Lat Pulldown Machine',     nameAr: 'جهاز Lat Pulldown',     gender: 'F' },
  { id: 'w-seated-row',        name: 'Seated Row Machine',       nameAr: 'جهاز Seated Row',       gender: 'F' },
  { id: 'w-back-extension',    name: 'Back Extension Machine',   nameAr: 'جهاز Back Extension',   gender: 'F' },
  { id: 'w-ab-crunch',         name: 'Ab Crunch Machine',        nameAr: 'جهاز Ab Crunch',        gender: 'F' },
  { id: 'w-cable-crunch',      name: 'Cable Crunch',             nameAr: 'Cable Crunch',          gender: 'F' },
  { id: 'w-captain-chair',     name: "Captain's Chair",          nameAr: 'Captain\'s Chair',      gender: 'F' },
  { id: 'w-cable-crossover',   name: 'Cable Crossover',          nameAr: 'Cable Crossover',       gender: 'F' },
  { id: 'w-oblique-twist',     name: 'Oblique Twist Machine',    nameAr: 'جهاز Oblique Twist',    gender: 'F' },
  { id: 'w-hip-thrust',        name: 'Hip Thrust Machine',       nameAr: 'جهاز Hip Thrust',       gender: 'F' },
  { id: 'w-glute-kickback',    name: 'Glute Kickback Machine',   nameAr: 'جهاز Glute Kickback',   gender: 'F' },
  { id: 'w-hip-abductor',      name: 'Hip Abductor Machine',     nameAr: 'جهاز Hip Abductor',     gender: 'F' },
  { id: 'w-hip-adductor',      name: 'Hip Adductor Machine',     nameAr: 'جهاز Hip Adductor',     gender: 'F' },
  { id: 'w-leg-press',         name: 'Leg Press Machine',        nameAr: 'جهاز Leg Press',        gender: 'F' },
  { id: 'w-leg-extension',     name: 'Leg Extension Machine',    nameAr: 'جهاز Leg Extension',    gender: 'F' },
  { id: 'w-leg-curl',          name: 'Leg Curl Machine',         nameAr: 'جهاز Leg Curl',         gender: 'F' },
  { id: 'w-calf-raise',        name: 'Calf Raise Machine',       nameAr: 'جهاز Calf Raise',       gender: 'F' },
  { id: 'w-shoulder-press',    name: 'Shoulder Press Machine',   nameAr: 'جهاز Shoulder Press',   gender: 'F' },
  // Men
  { id: 'm-shoulder-press',    name: 'Shoulder Press Machine',   nameAr: 'جهاز Shoulder Press',   gender: 'M' },
  { id: 'm-lateral-raise',     name: 'Lateral Raise Machine',    nameAr: 'جهاز Lateral Raise',    gender: 'M' },
  { id: 'm-chest-press',       name: 'Chest Press Machine',      nameAr: 'جهاز Chest Press',      gender: 'M' },
  { id: 'm-incline-chest-press',name:'Incline Chest Press',      nameAr: 'Incline Chest Press',   gender: 'M' },
  { id: 'm-pec-deck',          name: 'Pec Deck Machine',         nameAr: 'جهاز Pec Deck',         gender: 'M' },
  { id: 'm-cable-crossover',   name: 'Cable Crossover',          nameAr: 'Cable Crossover',       gender: 'M' },
  { id: 'm-biceps-curl',       name: 'Biceps Curl Machine',      nameAr: 'جهاز Biceps Curl',      gender: 'M' },
  { id: 'm-preacher-curl',     name: 'Preacher Curl Machine',    nameAr: 'جهاز Preacher Curl',    gender: 'M' },
  { id: 'm-triceps-pushdown',  name: 'Triceps Pushdown Machine', nameAr: 'جهاز Triceps Pushdown', gender: 'M' },
  { id: 'm-dip-machine',       name: 'Dip Machine',              nameAr: 'جهاز Dip',              gender: 'M' },
  { id: 'm-lat-pulldown',      name: 'Lat Pulldown Machine',     nameAr: 'جهاز Lat Pulldown',     gender: 'M' },
  { id: 'm-seated-row',        name: 'Seated Row Machine',       nameAr: 'جهاز Seated Row',       gender: 'M' },
  { id: 'm-hammer-row',        name: 'Hammer Row Machine',       nameAr: 'جهاز Hammer Row',       gender: 'M' },
  { id: 'm-rear-delt-fly',     name: 'Rear Delt Fly Machine',    nameAr: 'جهاز Rear Delt Fly',    gender: 'M' },
  { id: 'm-back-extension',    name: 'Back Extension Machine',   nameAr: 'جهاز Back Extension',   gender: 'M' },
  { id: 'm-squat-machine',     name: 'Squat Machine',            nameAr: 'جهاز Squat',            gender: 'M' },
  { id: 'm-leg-press',         name: 'Leg Press Machine',        nameAr: 'جهاز Leg Press',        gender: 'M' },
  { id: 'm-leg-extension',     name: 'Leg Extension Machine',    nameAr: 'جهاز Leg Extension',    gender: 'M' },
  { id: 'm-leg-curl',          name: 'Leg Curl Machine',         nameAr: 'جهاز Leg Curl',         gender: 'M' },
  { id: 'm-hip-abductor',      name: 'Hip Abductor Machine',     nameAr: 'جهاز Hip Abductor',     gender: 'M' },
  { id: 'm-hip-adductor',      name: 'Hip Adductor Machine',     nameAr: 'جهاز Hip Adductor',     gender: 'M' },
  { id: 'm-calf-raise',        name: 'Calf Raise Machine',       nameAr: 'جهاز Calf Raise',       gender: 'M' },
  { id: 'm-ab-crunch',         name: 'Ab Crunch Machine',        nameAr: 'جهاز Ab Crunch',        gender: 'M' },
  { id: 'm-cable-crunch',      name: 'Cable Crunch',             nameAr: 'Cable Crunch',          gender: 'M' },
  { id: 'm-leg-raise',         name: 'Leg Raise Machine',        nameAr: 'جهاز Leg Raise',        gender: 'M' },
  { id: 'm-oblique-twist',     name: 'Oblique Twist Machine',    nameAr: 'جهاز Oblique Twist',    gender: 'M' },
].filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i); // deduplicate

// ── Shared styles ─────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '20px',
  boxShadow: '0 4px 16px rgba(27,46,94,0.08)', border: `1px solid ${SKY_LIGHT}55`,
  marginBottom: 16,
};
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: `2px solid ${SKY_LIGHT}`, borderRadius: 10,
  padding: '9px 12px', fontSize: 13, color: NAVY, outline: 'none',
  fontFamily: 'Cairo, Inter, sans-serif', background: '#FAFCFF',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 5,
};
const btnStyle = (variant: 'primary' | 'danger' | 'ghost' = 'primary'): React.CSSProperties => ({
  border: 'none', borderRadius: 10, padding: '9px 18px',
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  fontFamily: 'Cairo, Inter, sans-serif',
  background: variant === 'primary' ? NAVY : variant === 'danger' ? '#E53E3E' : '#F0F4F8',
  color: variant === 'ghost' ? NAVY : 'white',
});

// ── File → base64 ─────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, contentType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Sub-tab: Content Manager ──────────────────────────────────────────────────
function ContentTab({ lang }: { lang: 'ar' | 'en' }) {
  const utils = trpc.useUtils();
  const [activeSection, setActiveSection] = useState<'icons' | 'exercises'>('icons');
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [exForm, setExForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [search, setSearch] = useState('');

  const iconsQuery = trpc.cms.listSessionIcons.useQuery();
  const overridesQuery = trpc.cms.listExerciseOverrides.useQuery();

  const uploadIconMutation = trpc.cms.uploadSessionIcon.useMutation({
    onSuccess: (data) => {
      console.log('[CMS] UPLOAD RESULT session icon:', data);
      console.log('[CMS] PUBLIC URL:', data?.url);
      utils.cms.listSessionIcons.invalidate();
      utils.cms.getPublicSessionIcons.invalidate();
      setMsg(lang === 'ar' ? 'تم رفع الأيقونة' : 'Icon uploaded');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (e) => setMsg(`Error: ${e.message}`),
  });
  const deleteIconMutation = trpc.cms.deleteSessionIcon.useMutation({
    onSuccess: () => { utils.cms.listSessionIcons.invalidate(); utils.cms.getPublicSessionIcons.invalidate(); },
  });
  const upsertExMutation = trpc.cms.upsertExerciseOverride.useMutation({
    onSuccess: () => { utils.cms.listExerciseOverrides.invalidate(); setEditingExercise(null); setMsg(lang === 'ar' ? 'تم الحفظ' : 'Saved'); setTimeout(() => setMsg(''), 3000); },
    onError: (e) => setMsg(`Error: ${e.message}`),
  });
  const uploadExImageMutation = trpc.cms.uploadExerciseImage.useMutation({
    onSuccess: (data) => {
      console.log('[CMS] UPLOAD RESULT exercise image:', data);
      utils.cms.listExerciseOverrides.invalidate();
      utils.cms.getPublicExerciseOverrides.invalidate();
      setUploadingId(null);
      setMsg(lang === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (e) => { setUploadingId(null); setMsg(`Error: ${e.message}`); },
  });

  const iconMap = Object.fromEntries((iconsQuery.data ?? []).map(r => [r.sessionType, r.iconUrl]));
  const overrideMap = Object.fromEntries((overridesQuery.data ?? []).map(r => [r.exerciseId, r]));

  const handleIconUpload = useCallback(async (sessionType: string, file: File) => {
    setUploadingId(sessionType);
    try {
      const { base64, contentType } = await fileToBase64(file);
      await uploadIconMutation.mutateAsync({ sessionType, base64, contentType });
    } finally {
      setUploadingId(null);
    }
  }, [uploadIconMutation]);

  const handleExImageUpload = useCallback(async (exerciseId: string, file: File) => {
    setUploadingId(exerciseId);
    try {
      const { base64, contentType } = await fileToBase64(file);
      await uploadExImageMutation.mutateAsync({ exerciseId, base64, contentType });
    } finally {
      setUploadingId(null);
    }
  }, [uploadExImageMutation]);

  const openEdit = (exerciseId: string) => {
    const ov = overrideMap[exerciseId] ?? {};
    const ex = EXERCISES.find(e => e.id === exerciseId);
    setExForm({
      name:       (ov as any).name       ?? ex?.name    ?? '',
      nameAr:     (ov as any).nameAr     ?? ex?.nameAr  ?? '',
      sets:       (ov as any).sets       ?? '',
      reps:       (ov as any).reps       ?? '',
      rest:       (ov as any).rest       ?? '',
      notes:      (ov as any).notes      ?? '',
      notesAr:    (ov as any).notesAr    ?? '',
      youtubeUrl: (ov as any).youtubeUrl ?? '',
    });
    setEditingExercise(exerciseId);
  };

  const filteredExercises = EXERCISES.filter(ex => {
    if (genderFilter !== 'all' && ex.gender !== genderFilter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase()) && !ex.nameAr.includes(search)) return false;
    return true;
  });

  return (
    <div>
      {msg && (
        <div style={{ background: msg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: msg.startsWith('Error') ? '#991B1B' : '#065F46', fontWeight: 700 }}>
          {msg}
        </div>
      )}

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['icons', 'exercises'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            ...btnStyle(activeSection === s ? 'primary' : 'ghost'),
            flex: 1, padding: '10px 0',
          }}>
            {s === 'icons'
              ? (lang === 'ar' ? '🏷️ أيقونات الجلسات' : '🏷️ Session Icons')
              : (lang === 'ar' ? '🏋️ التمارين' : '🏋️ Exercises')}
          </button>
        ))}
      </div>

      {/* ── SESSION ICONS ── */}
      {activeSection === 'icons' && (
        <div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
            {lang === 'ar'
              ? 'ارفع صورة مخصصة لكل نوع جلسة. سيتم استخدامها في بطاقات تسجيل الدخول.'
              : 'Upload a custom image for each session type. It will be used on the check-in cards.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {SESSION_TYPES.map(st => {
              const customUrl = iconMap[st.id];
              // Add cache-busting timestamp to custom URLs to force browser re-fetch after upload
              const bustUrl = customUrl ? `${customUrl}?v=${Date.now()}` : null;
              const displayUrl = bustUrl || st.defaultIcon;
              const isCustom = !!customUrl;
              const isUploading = uploadingId === st.id;
              return (
                <div key={st.id} style={{ ...cardStyle, padding: 16, marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: '#F0F4F8', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {displayUrl && <img
                      src={displayUrl}
                      alt={st.label}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => console.warn('[CMS] IMAGE SRC failed to load:', displayUrl, e)}
                    />}
                    {isCustom && <div style={{ position: 'absolute', top: 2, right: 2, background: '#16A34A', borderRadius: 4, width: 10, height: 10 }} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{lang === 'ar' ? st.labelAr : st.label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>{st.id}</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <label style={{ ...btnStyle('primary'), padding: '7px 12px', fontSize: 11, cursor: 'pointer', display: 'inline-block' }}>
                      {isUploading ? '...' : (lang === 'ar' ? 'رفع' : 'Upload')}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleIconUpload(st.id, f); e.target.value = ''; }}
                        disabled={isUploading}
                      />
                    </label>
                    {isCustom && (
                      <button style={{ ...btnStyle('danger'), padding: '7px 10px', fontSize: 11 }}
                        onClick={() => deleteIconMutation.mutate({ sessionType: st.id })}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXERCISES ── */}
      {activeSection === 'exercises' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              placeholder={lang === 'ar' ? 'بحث...' : 'Search exercise...'}
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 200, flex: '1 1 200px' }}
            />
            {(['all', 'F', 'M'] as const).map(g => (
              <button key={g} onClick={() => setGenderFilter(g)} style={{
                ...btnStyle(genderFilter === g ? 'primary' : 'ghost'),
                padding: '9px 16px',
              }}>
                {g === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : g === 'F' ? (lang === 'ar' ? 'نساء' : 'Women') : (lang === 'ar' ? 'رجال' : 'Men')}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filteredExercises.map(ex => {
              const ov = overrideMap[ex.id] as any;
              const currentImage = ov?.imageUrl;
              const currentYT = ov?.youtubeUrl;
              const isUploading = uploadingId === ex.id;
              const isEditing = editingExercise === ex.id;

              return (
                <div key={ex.id} style={{ ...cardStyle, marginBottom: 0 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Image */}
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: '#F0F4F8', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {currentImage
                        ? <img src={currentImage} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 24, opacity: 0.3 }}>🖼️</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{ov?.name ?? ex.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{ex.gender === 'F' ? '♀' : '♂'} {ex.id}</div>
                      {currentYT && (
                        <a href={currentYT} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#E53E3E', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                          ▶ YouTube
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    <label style={{ ...btnStyle('ghost'), padding: '7px 10px', fontSize: 11, cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                      {isUploading ? '⏳' : (lang === 'ar' ? '📷 صورة' : '📷 Image')}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleExImageUpload(ex.id, f); e.target.value = ''; }}
                        disabled={isUploading}
                      />
                    </label>
                    <button style={{ ...btnStyle('primary'), padding: '7px 10px', fontSize: 11, flex: 1 }}
                      onClick={() => isEditing ? setEditingExercise(null) : openEdit(ex.id)}>
                      {isEditing ? (lang === 'ar' ? '✕ إغلاق' : '✕ Close') : (lang === 'ar' ? '✏️ تعديل' : '✏️ Edit')}
                    </button>
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${SKY_LIGHT}44`, paddingTop: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        {[
                          { key: 'name', label: 'Name (EN)' },
                          { key: 'nameAr', label: 'Name (AR)' },
                          { key: 'sets', label: 'Sets' },
                          { key: 'reps', label: 'Reps' },
                          { key: 'rest', label: 'Rest (sec)' },
                          { key: 'youtubeUrl', label: 'YouTube URL' },
                        ].map(({ key, label }) => (
                          <div key={key} style={key === 'youtubeUrl' ? { gridColumn: '1 / -1' } : {}}>
                            <label style={labelStyle}>{label}</label>
                            <input
                              style={inputStyle}
                              value={exForm[key] ?? ''}
                              onChange={e => setExForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={label}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>Notes (EN)</label>
                        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                          value={exForm.notes ?? ''}
                          onChange={e => setExForm(f => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>Notes (AR)</label>
                        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', direction: 'rtl' }}
                          value={exForm.notesAr ?? ''}
                          onChange={e => setExForm(f => ({ ...f, notesAr: e.target.value }))}
                        />
                      </div>
                      <button style={{ ...btnStyle('primary'), width: '100%' }}
                        onClick={() => upsertExMutation.mutate({ exerciseId: ex.id, ...exForm })}>
                        {upsertExMutation.isPending ? '⏳...' : (lang === 'ar' ? 'حفظ' : 'Save Changes')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-tab: Appearance ───────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { value: 'Inter',    label: 'Inter (Default)' },
  { value: 'Cairo',   label: 'Cairo (Arabic)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto',  label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Nunito',  label: 'Nunito' },
  { value: 'Tajawal', label: 'Tajawal (Arabic)' },
  { value: 'Almarai', label: 'Almarai (Arabic)' },
];

function AppearanceTab({ lang }: { lang: 'ar' | 'en' }) {
  const utils = trpc.useUtils();
  const appearanceQuery = trpc.cms.getAppearance.useQuery();
  const data = appearanceQuery.data;

  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingType, setUploadingType] = useState<'logo' | 'banner' | null>(null);

  // Load form from DB once
  if (data && !loaded) {
    setForm({
      primaryColor: data.primaryColor ?? '#1B2E5E',
      accentColor:  data.accentColor  ?? '#7BB8D4',
      bgColor:      data.bgColor      ?? '#F0F4F8',
      textColor:    data.textColor    ?? '#1B2E5E',
      fontFamily:   data.fontFamily   ?? 'Inter',
      footerText:   data.footerText   ?? '',
      footerLinks:  data.footerLinks  ?? '',
    });
    setLoaded(true);
  }

  const updateMutation = trpc.cms.updateAppearance.useMutation({
    onSuccess: () => { utils.cms.getAppearance.invalidate(); setMsg(lang === 'ar' ? 'تم الحفظ' : 'Saved!'); setTimeout(() => setMsg(''), 3000); },
    onError: (e) => setMsg(`Error: ${e.message}`),
  });
  const uploadImageMutation = trpc.cms.uploadAppearanceImage.useMutation({
    onSuccess: () => { utils.cms.getAppearance.invalidate(); setUploadingType(null); setMsg(lang === 'ar' ? 'تم رفع الصورة' : 'Image uploaded'); setTimeout(() => setMsg(''), 3000); },
    onError: (e) => { setUploadingType(null); setMsg(`Error: ${e.message}`); },
  });

  const handleImageUpload = async (type: 'logo' | 'banner', file: File) => {
    setUploadingType(type);
    const { base64, contentType } = await fileToBase64(file);
    uploadImageMutation.mutate({ type, base64, contentType });
  };

  const colorFields = [
    { key: 'primaryColor', label: lang === 'ar' ? 'اللون الأساسي' : 'Primary Color' },
    { key: 'accentColor',  label: lang === 'ar' ? 'لون التمييز'   : 'Accent Color' },
    { key: 'bgColor',      label: lang === 'ar' ? 'لون الخلفية'   : 'Background Color' },
    { key: 'textColor',    label: lang === 'ar' ? 'لون النص'       : 'Text Color' },
  ];

  return (
    <div>
      {msg && (
        <div style={{ background: msg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: msg.startsWith('Error') ? '#991B1B' : '#065F46', fontWeight: 700 }}>
          {msg}
        </div>
      )}

      {/* Colors */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
          {lang === 'ar' ? '🎨 الألوان' : '🎨 Colors'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {colorFields.map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form[key] ?? '#000000'}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: 44, height: 40, border: `2px solid ${SKY_LIGHT}`, borderRadius: 8, cursor: 'pointer', padding: 2 }}
                />
                <input style={{ ...inputStyle, flex: 1 }} value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="#1B2E5E"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
          {lang === 'ar' ? '🔤 الخط' : '🔤 Font'}
        </h3>
        <div>
          <label style={labelStyle}>{lang === 'ar' ? 'نوع الخط' : 'Font Family'}</label>
          <select style={{ ...inputStyle }} value={form.fontFamily ?? 'Inter'}
            onChange={e => setForm(f => ({ ...f, fontFamily: e.target.value }))}>
            {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#F0F4F8', borderRadius: 10, fontSize: 16, fontFamily: form.fontFamily ?? 'Inter', color: NAVY }}>
            {lang === 'ar' ? 'مثال على الخط — Prime Fit' : 'Font preview — Prime Fit'}
          </div>
        </div>
      </div>

      {/* Logo & Banner */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
          {lang === 'ar' ? '🖼️ الشعار والبانر' : '🖼️ Logo & Banner'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {(['logo', 'banner'] as const).map(type => {
            const currentUrl = type === 'logo' ? data?.logoUrl : data?.bannerUrl;
            return (
              <div key={type}>
                <label style={labelStyle}>{type === 'logo' ? (lang === 'ar' ? 'الشعار' : 'Logo') : (lang === 'ar' ? 'البانر' : 'Banner')}</label>
                <div style={{ width: '100%', height: type === 'banner' ? 100 : 72, borderRadius: 10, background: '#F0F4F8', border: `2px dashed ${SKY_LIGHT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 }}>
                  {currentUrl
                    ? <img src={currentUrl} alt={type} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: '#94a3b8', fontSize: 12 }}>{lang === 'ar' ? 'لا توجد صورة' : 'No image'}</span>}
                </div>
                <label style={{ ...btnStyle('ghost'), display: 'block', textAlign: 'center', cursor: 'pointer', fontSize: 12 }}>
                  {uploadingType === type ? '⏳...' : (lang === 'ar' ? '📤 رفع صورة' : '📤 Upload')}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(type, f); e.target.value = ''; }}
                    disabled={uploadingType === type}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
          {lang === 'ar' ? '📝 الفوتر' : '📝 Footer'}
        </h3>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{lang === 'ar' ? 'نص الفوتر' : 'Footer Text'}</label>
          <input style={inputStyle} value={form.footerText ?? ''}
            onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
            placeholder={lang === 'ar' ? 'مثال: © 2025 Prime Fit' : 'e.g. © 2025 Prime Fit'}
          />
        </div>
        <div>
          <label style={labelStyle}>{lang === 'ar' ? 'روابط الفوتر (JSON)' : 'Footer Links (JSON array)'}</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
            value={form.footerLinks ?? ''}
            onChange={e => setForm(f => ({ ...f, footerLinks: e.target.value }))}
            placeholder='[{"label":"Privacy","url":"/privacy"},{"label":"Contact","url":"/contact"}]'
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            {lang === 'ar' ? 'صيغة JSON: [{"label":"الاسم","url":"/الرابط"}]' : 'JSON format: [{"label":"Name","url":"/link"}]'}
          </div>
        </div>
      </div>

      <button style={{ ...btnStyle('primary'), width: '100%', padding: '14px 0', fontSize: 15 }}
        onClick={() => updateMutation.mutate(form)}
        disabled={updateMutation.isPending}>
        {updateMutation.isPending ? '⏳...' : (lang === 'ar' ? '💾 حفظ التغييرات' : '💾 Save Changes')}
      </button>
    </div>
  );
}

// ── Sub-tab: Error Monitor ────────────────────────────────────────────────────
function ErrorMonitorTab({ lang }: { lang: 'ar' | 'en' }) {
  const utils = trpc.useUtils();
  const [showResolved, setShowResolved] = useState(false);
  const logsQuery = trpc.cms.listErrorLogs.useQuery({ resolved: showResolved ? undefined : false });
  const logs = logsQuery.data ?? [];

  const resolveMutation = trpc.cms.resolveError.useMutation({ onSuccess: () => utils.cms.listErrorLogs.invalidate() });
  const resolveAllMutation = trpc.cms.resolveAllErrors.useMutation({ onSuccess: () => utils.cms.listErrorLogs.invalidate() });
  const clearMutation = trpc.cms.clearResolvedErrors.useMutation({ onSuccess: () => utils.cms.listErrorLogs.invalidate() });

  const severityColor = (s: string) => s === 'error' ? '#E53E3E' : s === 'warning' ? '#D97706' : '#3B82F6';
  const severityBg = (s: string) => s === 'error' ? '#FEE2E2' : s === 'warning' ? '#FEF3C7' : '#DBEAFE';

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 14, color: '#64748b' }}>
          {lang === 'ar' ? `${logs.length} سجل` : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
          {!showResolved && (lang === 'ar' ? ' غير محلول' : ' unresolved')}
        </div>
        <button style={{ ...btnStyle('ghost'), fontSize: 12 }} onClick={() => setShowResolved(v => !v)}>
          {showResolved ? (lang === 'ar' ? 'إخفاء المحلولة' : 'Hide Resolved') : (lang === 'ar' ? 'عرض الكل' : 'Show All')}
        </button>
        <button style={{ ...btnStyle('primary'), fontSize: 12 }} onClick={() => resolveAllMutation.mutate()}>
          {lang === 'ar' ? '✓ حل الكل' : '✓ Resolve All'}
        </button>
        <button style={{ ...btnStyle('danger'), fontSize: 12 }} onClick={() => { if (confirm(lang === 'ar' ? 'حذف جميع المحلولة؟' : 'Delete all resolved?')) clearMutation.mutate(); }}>
          {lang === 'ar' ? '🗑️ حذف المحلولة' : '🗑️ Clear Resolved'}
        </button>
        <button style={{ ...btnStyle('ghost'), fontSize: 12 }} onClick={() => logsQuery.refetch()}>
          🔄
        </button>
      </div>

      {logsQuery.isLoading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</div>}

      {!logsQuery.isLoading && logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{lang === 'ar' ? 'لا توجد أخطاء' : 'No errors'}</div>
        </div>
      )}

      {logs.map(log => (
        <div key={log.id} style={{ ...cardStyle, borderLeft: `4px solid ${severityColor(log.severity)}`, opacity: log.resolved ? 0.6 : 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ background: severityBg(log.severity), color: severityColor(log.severity), borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {log.severity.toUpperCase()}
            </span>
            <span style={{ background: '#F0F4F8', color: '#64748b', borderRadius: 6, padding: '3px 8px', fontSize: 11, flexShrink: 0 }}>
              {log.url ? 'client' : 'server'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, wordBreak: 'break-word' }}>{log.message}</div>
              {log.url && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>📍 {log.url}</div>}
              {log.userEmail && <div style={{ fontSize: 11, color: '#94a3b8' }}>👤 {log.userEmail}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {new Date(log.createdAt).toLocaleString()}
                {log.resolved && ` · ✓ ${lang === 'ar' ? 'محلول' : 'Resolved'}`}
              </div>
            </div>
            {!log.resolved && (
              <button style={{ ...btnStyle('primary'), padding: '6px 12px', fontSize: 11, flexShrink: 0 }}
                onClick={() => resolveMutation.mutate({ id: log.id })}>
                ✓
              </button>
            )}
          </div>
          {log.stack && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>Stack trace</summary>
              <pre style={{ fontSize: 10, color: '#64748b', background: '#F8FAFC', borderRadius: 6, padding: 10, overflow: 'auto', marginTop: 6, maxHeight: 200 }}>
                {log.stack}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main CMS Tab ──────────────────────────────────────────────────────────────
type CMSSection = 'content' | 'appearance' | 'errors';

export default function AdminCMSTab({ lang }: { lang: 'ar' | 'en' }) {
  const [section, setSection] = useState<CMSSection>('content');
  const errorCountQuery = trpc.cms.countUnresolvedErrors.useQuery(undefined, { refetchInterval: 30_000 });
  const errorCount = (typeof errorCountQuery.data === 'number' ? errorCountQuery.data : 0);

  const sections: { id: CMSSection; label: string; labelAr: string }[] = [
    { id: 'content',    label: 'Content',    labelAr: 'المحتوى' },
    { id: 'appearance', label: 'Appearance', labelAr: 'المظهر' },
    { id: 'errors',     label: `Errors${errorCount > 0 ? ` (${errorCount})` : ''}`, labelAr: `الأخطاء${errorCount > 0 ? ` (${errorCount})` : ''}` },
  ];

  return (
    <div>
      {/* Section nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#F0F4F8', borderRadius: 12, padding: 6 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, border: 'none', borderRadius: 9, padding: '10px 0',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'Cairo, Inter, sans-serif',
            background: section === s.id ? NAVY : 'transparent',
            color: section === s.id ? 'white' : '#7A9BB5',
            transition: 'all 0.2s',
            ...(s.id === 'errors' && errorCount > 0 && section !== 'errors' ? { color: '#E53E3E' } : {}),
          }}>
            {lang === 'ar' ? s.labelAr : s.label}
          </button>
        ))}
      </div>

      {section === 'content'    && <ContentTab lang={lang} />}
      {section === 'appearance' && <AppearanceTab lang={lang} />}
      {section === 'errors'     && <ErrorMonitorTab lang={lang} />}
    </div>
  );
}
