/**
 * Nutrition — Prime Fit
 * AI food recognition · USDA nutrition data · Meal logging
 * Mobile-first dark neon design matching the app aesthetic
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY    = "#0D1B2A";
const NAVY2   = "#1B2E5E";
const CYAN    = "#00E5FF";
const GREEN   = "#22C55E";
const ORANGE  = "#FF6B35";
const GOLD    = "#FFD700";
const RED     = "#EF4444";
const CARD    = "#111827";
const CARD2   = "#1F2937";
const TEXT    = "#F9FAFB";
const MUTED   = "#9CA3AF";

// ── Translations ──────────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  title:        { ar: "تتبع التغذية", en: "Nutrition Tracker" },
  scan:         { ar: "مسح الطعام بالكاميرا", en: "Scan Food" },
  upload:       { ar: "رفع صورة", en: "Upload Photo" },
  manual:       { ar: "إضافة يدوي", en: "Add Manually" },
  analyzing:    { ar: "جاري تحليل الطعام...", en: "Analyzing food..." },
  today:        { ar: "اليوم", en: "Today" },
  history:      { ar: "السجل", en: "History" },
  calories:     { ar: "سعرات", en: "Calories" },
  protein:      { ar: "بروتين", en: "Protein" },
  carbs:        { ar: "كربوهيدرات", en: "Carbs" },
  fat:          { ar: "دهون", en: "Fat" },
  fiber:        { ar: "ألياف", en: "Fiber" },
  grams:        { ar: "غرام", en: "g" },
  save:         { ar: "حفظ الوجبة", en: "Save Meal" },
  saving:       { ar: "جاري الحفظ...", en: "Saving..." },
  saved:        { ar: "✅ تم الحفظ!", en: "✅ Saved!" },
  edit:         { ar: "تعديل", en: "Edit" },
  delete:       { ar: "حذف", en: "Delete" },
  noMeals:      { ar: "لا توجد وجبات مسجلة بعد", en: "No meals logged yet" },
  breakfast:    { ar: "فطور", en: "Breakfast" },
  lunch:        { ar: "غداء", en: "Lunch" },
  dinner:       { ar: "عشاء", en: "Dinner" },
  snack:        { ar: "وجبة خفيفة", en: "Snack" },
  goal:         { ar: "الهدف", en: "Goal" },
  tryAgain:     { ar: "حاول مجدداً", en: "Try Again" },
  noFood:       { ar: "لم يتم التعرف على طعام. حاول صورة أوضح.", en: "No food detected. Try a clearer image." },
  insight:      { ar: "تحليل AI", en: "AI Insight" },
  portion:      { ar: "الحصة", en: "Portion" },
  total:        { ar: "الإجمالي", en: "Total" },
  searchFood:   { ar: "ابحث عن طعام...", en: "Search food..." },
  addFood:      { ar: "إضافة طعام", en: "Add Food" },
  barcodeHint:  { ar: "دعم الباركود — قريباً!", en: "Barcode support — coming soon!" },
};

const t = (k: string, lang: string) => T[k]?.[lang] ?? T[k]?.en ?? k;

const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const MACRO_COLORS = { calories: ORANGE, protein: CYAN, carbs: GOLD, fat: "#A78BFA", fiber: GREEN };

// ── Macro pill ─────────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit = "g", color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div style={{
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
    }}>
      <div style={{ color, fontSize: 14, fontWeight: 900 }}>{Math.round(value)}</div>
      <div style={{ color: MUTED, fontSize: 9, marginTop: 1 }}>{unit === "kcal" ? "kcal" : `${unit}`}</div>
      <div style={{ color: MUTED, fontSize: 9 }}>{label}</div>
    </div>
  );
}

// ── Circular progress ─────────────────────────────────────────────────────────
function CircleProgress({ value, max, color, label, size = 72 }: {
  value: number; max: number; color: string; label: string; size?: number;
}) {
  const pct  = Math.min(value / Math.max(max, 1), 1);
  const r    = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}22`} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ marginTop: -size/2 - 10, fontSize: 13, fontWeight: 900, color: TEXT }}>{Math.round(value)}</div>
      <div style={{ fontSize: 9, color: MUTED, marginTop: size/2 - 6 }}>{label}</div>
    </div>
  );
}

// ── Editable food item row ────────────────────────────────────────────────────
function FoodItemRow({ item, lang, onUpdate, onRemove }: {
  item: any; lang: string;
  onUpdate: (field: string, val: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const conf = item.confidence === "high" ? GREEN : item.confidence === "medium" ? GOLD : MUTED;

  return (
    <div style={{
      background: CARD2, borderRadius: 14, padding: "12px 14px",
      marginBottom: 8, border: `1px solid ${CARD2}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>
            {lang === "ar" && item.nameAr ? item.nameAr : item.name}
          </span>
          <span style={{ color: conf, fontSize: 10, marginRight: 6, marginLeft: 6 }}>●</span>
          <span style={{ color: MUTED, fontSize: 11 }}>
            {lang === "ar" ? item.portionDescAr || item.portionDesc : item.portionDesc}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setEditing(!editing)} style={{
            background: `${CYAN}22`, border: `1px solid ${CYAN}44`, color: CYAN,
            borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
          }}>{t("edit", lang)}</button>
          <button onClick={onRemove} style={{
            background: `${RED}22`, border: `1px solid ${RED}44`, color: RED,
            borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
          }}>✕</button>
        </div>
      </div>

      {/* Macros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { k: "calories", label: t("calories", lang), unit: "kcal", color: ORANGE },
          { k: "protein",  label: t("protein",  lang), unit: "g",    color: CYAN },
          { k: "carbs",    label: t("carbs",    lang), unit: "g",    color: GOLD },
          { k: "fat",      label: t("fat",      lang), unit: "g",    color: "#A78BFA" },
        ].map(m => (
          editing ? (
            <div key={m.k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <input
                type="number"
                value={item[m.k] ?? 0}
                onChange={e => onUpdate(m.k, parseFloat(e.target.value) || 0)}
                style={{
                  width: 52, background: NAVY, border: `1px solid ${m.color}44`,
                  borderRadius: 6, padding: "4px 6px", color: m.color,
                  fontSize: 13, fontWeight: 700, textAlign: "center",
                }}
              />
              <span style={{ color: MUTED, fontSize: 9 }}>{m.label} ({m.unit})</span>
            </div>
          ) : (
            <MacroPill key={m.k} label={m.label} value={item[m.k] ?? 0} unit={m.unit} color={m.color} />
          )
        ))}
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <input
              type="number"
              value={item.estimatedGrams}
              onChange={e => onUpdate("estimatedGrams", parseFloat(e.target.value) || 0)}
              style={{
                width: 52, background: NAVY, border: `1px solid ${MUTED}44`,
                borderRadius: 6, padding: "4px 6px", color: MUTED,
                fontSize: 13, fontWeight: 700, textAlign: "center",
              }}
            />
            <span style={{ color: MUTED, fontSize: 9 }}>{t("grams", lang)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Today's summary bar ───────────────────────────────────────────────────────
function TodaySummary({ lang }: { lang: string }) {
  const { data: today } = trpc.nutrition.getToday.useQuery();
  const GOALS = { calories: 2000, protein: 120, carbs: 250, fat: 65 };

  if (!today || today.meal_count === 0) return null;

  return (
    <div style={{
      background: CARD, borderRadius: 16, padding: "14px 16px", marginBottom: 16,
      border: `1px solid ${CYAN}22`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 800 }}>
          📊 {t("today", lang)}
        </span>
        <span style={{ color: MUTED, fontSize: 11 }}>
          {today.meal_count} {lang === "ar" ? "وجبات" : "meals"}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
        <CircleProgress value={today.calories} max={GOALS.calories} color={ORANGE} label={t("calories", lang)} size={64} />
        <CircleProgress value={today.protein}  max={GOALS.protein}  color={CYAN}   label={t("protein",  lang)} size={64} />
        <CircleProgress value={today.carbs}    max={GOALS.carbs}    color={GOLD}   label={t("carbs",    lang)} size={64} />
        <CircleProgress value={today.fat}      max={GOALS.fat}      color="#A78BFA" label={t("fat",    lang)} size={64} />
      </div>
    </div>
  );
}

// ── Meal history card ─────────────────────────────────────────────────────────
function MealHistoryCard({ meal, lang, onDelete }: { meal: any; lang: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.logged_at).toLocaleTimeString(lang === "ar" ? "ar-KW" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ background: CARD2, borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{MEAL_ICONS[meal.meal_type] ?? "🍽️"}</span>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>
              {t(meal.meal_type, lang)}
            </p>
            <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{time}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: ORANGE, fontSize: 14, fontWeight: 900 }}>{Math.round(meal.total_calories)} kcal</span>
          <span style={{ color: MUTED, fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <MacroPill label={t("protein", lang)} value={meal.total_protein} color={CYAN} />
            <MacroPill label={t("carbs",   lang)} value={meal.total_carbs}   color={GOLD} />
            <MacroPill label={t("fat",     lang)} value={meal.total_fat}     color="#A78BFA" />
            <MacroPill label={t("fiber",   lang)} value={meal.total_fiber}   color={GREEN} />
          </div>
          {meal.insight_ar && (
            <div style={{ background: `${CYAN}11`, borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
              <p style={{ color: CYAN, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                💡 {lang === "ar" ? meal.insight_ar : meal.insight_en}
              </p>
            </div>
          )}
          {meal.items?.map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${CARD}` }}>
              <span style={{ color: TEXT, fontSize: 12 }}>{lang === "ar" && item.name_ar ? item.name_ar : item.name}</span>
              <span style={{ color: MUTED, fontSize: 11 }}>{item.estimated_grams}g · {Math.round(item.calories)} kcal</span>
            </div>
          ))}
          <button onClick={onDelete} style={{
            marginTop: 10, background: `${RED}22`, border: `1px solid ${RED}44`, color: RED,
            borderRadius: 8, padding: "6px 14px", fontSize: 11, cursor: "pointer", width: "100%",
          }}>🗑️ {t("delete", lang)}</button>
        </div>
      )}
    </div>
  );
}

// ── Main Nutrition Page ───────────────────────────────────────────────────────
export default function Nutrition() {
  const { lang, isRTL } = useLanguage();
  const utils           = trpc.useUtils();
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const cameraInputRef  = useRef<HTMLInputElement>(null);

  const [tab, setTab]               = useState<"scan" | "history">("scan");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis]     = useState<any | null>(null);
  const [editItems, setEditItems]   = useState<any[]>([]);
  const [mealType, setMealType]     = useState<"breakfast"|"lunch"|"dinner"|"snack">("lunch");
  const [notes, setNotes]           = useState("");
  const [status, setStatus]         = useState<string>("idle");
  const [saveStatus, setSaveStatus] = useState<string>("idle");
  const [error, setError]           = useState("");
  const [searchQ, setSearchQ]       = useState("");

  const { data: history, refetch: refetchHistory } = trpc.nutrition.getMealHistory.useQuery({ limit: 30 });
  const analyzeFood = trpc.nutrition.analyzeFood.useMutation();
  const saveMeal    = trpc.nutrition.saveMeal.useMutation();
  const deleteMeal  = trpc.nutrition.deleteMeal.useMutation({ onSuccess: () => { refetchHistory(); utils.nutrition.getToday.invalidate(); } });
  const searchFood  = trpc.nutrition.searchFood.useQuery({ query: searchQ, grams: 100 }, { enabled: searchQ.length > 2 });

  const processImage = useCallback(async (file: File) => {
    setError(""); setAnalysis(null); setEditItems([]); setStatus("analyzing");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl  = e.target?.result as string;
      const base64   = dataUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      try {
        const res = await analyzeFood.mutateAsync({ imageBase64: base64, mimeType });
        if (res.analysis.imageQuality === "unclear" || !res.analysis.items.length) {
          setError(t("noFood", lang));
          setStatus("idle");
          return;
        }
        setAnalysis(res.analysis);
        setMealType(res.analysis.mealType);
        setEditItems(res.analysis.items.map((item: any) => ({
          ...item,
          calories: item.portion.calories,
          protein:  item.portion.protein,
          carbs:    item.portion.carbs,
          fat:      item.portion.fat,
          fiber:    item.portion.fiber ?? 0,
          sugar:    item.portion.sugar ?? 0,
          sodium:   item.portion.sodium ?? 0,
          per100gCalories: item.per100g.calories,
          per100gProtein:  item.per100g.protein,
          per100gCarbs:    item.per100g.carbs,
          per100gFat:      item.per100g.fat,
        })));
        setStatus("ready");
      } catch (err: any) {
        setError(err.message ?? "Analysis failed");
        setStatus("idle");
      }
    };
    reader.readAsDataURL(file);
  }, [lang]);

  const handleSave = async () => {
    if (!editItems.length || saveStatus === "saving") return;
    setSaveStatus("saving");
    const totals = editItems.reduce((acc, i) => ({
      calories: acc.calories + (i.calories ?? 0),
      protein:  acc.protein  + (i.protein  ?? 0),
      carbs:    acc.carbs    + (i.carbs    ?? 0),
      fat:      acc.fat      + (i.fat      ?? 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    await saveMeal.mutateAsync({
      mealType,
      notes: notes || undefined,
      insightAr: analysis?.insightAr,
      insightEn: analysis?.insightEn,
      items: editItems,
    });
    setSaveStatus("saved");
    refetchHistory();
    utils.nutrition.getToday.invalidate();
    setTimeout(() => {
      setStatus("idle"); setSaveStatus("idle"); setAnalysis(null); setEditItems([]);
      setPreviewUrl(null); setNotes(""); setTab("history");
    }, 1500);
  };

  const updateItem = (idx: number, field: string, val: number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const removeItem = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx));

  const totals = editItems.reduce((acc, i) => ({
    calories: acc.calories + (i.calories ?? 0),
    protein:  acc.protein  + (i.protein  ?? 0),
    carbs:    acc.carbs    + (i.carbs    ?? 0),
    fat:      acc.fat      + (i.fat      ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      background: NAVY, minHeight: "100vh",
      fontFamily: "Cairo, Tajawal, system-ui, sans-serif",
      padding: "0 0 80px",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY2}, ${NAVY})`,
        padding: "16px 16px 0",
        borderBottom: `1px solid ${CYAN}22`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 900, color: TEXT }}>
          🍽️ <span style={{ color: CYAN }}>Prime</span> {t("title", lang)}
        </h2>
        <div style={{ display: "flex", gap: 0 }}>
          {(["scan", "history"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, padding: "10px 0", background: "none", border: "none",
              borderBottom: `2px solid ${tab === tb ? CYAN : "transparent"}`,
              color: tab === tb ? CYAN : MUTED, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {tb === "scan" ? `📷 ${t("scan", lang)}` : `📋 ${t("history", lang)}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {tab === "scan" && (
          <>
            <TodaySummary lang={lang} />

            {/* Upload / Camera buttons */}
            {status === "idle" && !editItems.length && (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {/* Camera */}
                  <button onClick={() => cameraInputRef.current?.click()} style={{
                    flex: 1, background: `linear-gradient(135deg, ${CYAN}CC, #00B8CCCC)`,
                    border: "none", borderRadius: 14, padding: "16px 0", cursor: "pointer",
                    color: NAVY, fontWeight: 900, fontSize: 14, fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 28 }}>📷</span>
                    {t("scan", lang)}
                  </button>
                  {/* Upload */}
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    flex: 1, background: CARD2, border: `1px solid ${CYAN}44`,
                    borderRadius: 14, padding: "16px 0", cursor: "pointer",
                    color: TEXT, fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    {t("upload", lang)}
                  </button>
                </div>

                {/* Barcode future */}
                <div style={{
                  background: `${GOLD}11`, border: `1px dashed ${GOLD}44`,
                  borderRadius: 12, padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>📊</span>
                  <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>
                    {t("barcodeHint", lang)}
                  </span>
                </div>

                {/* Manual search */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder={t("searchFood", lang)}
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: CARD2, border: `1px solid ${CARD2}`,
                      borderRadius: 12, padding: "12px 14px",
                      color: TEXT, fontSize: 13, fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                  {searchFood.data && searchQ.length > 2 && (
                    <div style={{ background: CARD, borderRadius: 12, padding: "12px 14px", marginTop: 8 }}>
                      <p style={{ color: CYAN, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
                        {searchFood.data.food.description}
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        <MacroPill label={t("calories", lang)} value={searchFood.data.portion.calories} unit="kcal" color={ORANGE} />
                        <MacroPill label={t("protein",  lang)} value={searchFood.data.portion.protein}  color={CYAN} />
                        <MacroPill label={t("carbs",    lang)} value={searchFood.data.portion.carbs}    color={GOLD} />
                        <MacroPill label={t("fat",      lang)} value={searchFood.data.portion.fat}      color="#A78BFA" />
                      </div>
                      <button
                        onClick={() => {
                          const d = searchFood.data!;
                          setEditItems([{
                            name: d.food.description, nameAr: d.food.description,
                            estimatedGrams: 100, portionDesc: "100g", portionDescAr: "١٠٠غ",
                            confidence: "high",
                            calories: d.portion.calories, protein: d.portion.protein,
                            carbs: d.portion.carbs, fat: d.portion.fat,
                            fiber: d.portion.fiber, sugar: d.portion.sugar, sodium: d.portion.sodium,
                            per100gCalories: d.per100g.calories, per100gProtein: d.per100g.protein,
                            per100gCarbs: d.per100g.carbs, per100gFat: d.per100g.fat,
                          }]);
                          setStatus("ready"); setSearchQ("");
                        }}
                        style={{
                          width: "100%", background: `${CYAN}22`, border: `1px solid ${CYAN}44`,
                          color: CYAN, borderRadius: 10, padding: "8px", fontSize: 12,
                          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        + {t("addFood", lang)}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Analyzing state */}
            {status === "analyzing" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                {previewUrl && (
                  <img src={previewUrl} alt="food" style={{
                    width: "100%", maxHeight: 200, objectFit: "cover",
                    borderRadius: 16, marginBottom: 16, opacity: 0.7,
                  }} />
                )}
                <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>🔍</div>
                <p style={{ color: CYAN, fontSize: 14, fontWeight: 700 }}>{t("analyzing", lang)}</p>
                <p style={{ color: MUTED, fontSize: 11 }}>
                  {lang === "ar" ? "يتم تحليل الطعام بالذكاء الاصطناعي..." : "AI is identifying food items..."}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: `${RED}22`, border: `1px solid ${RED}44`, borderRadius: 14,
                padding: "14px 16px", marginBottom: 16, textAlign: "center",
              }}>
                <p style={{ color: RED, fontSize: 13, margin: "0 0 10px" }}>{error}</p>
                <button onClick={() => { setError(""); setPreviewUrl(null); }} style={{
                  background: `${RED}33`, border: "none", color: RED, borderRadius: 8,
                  padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}>{t("tryAgain", lang)}</button>
              </div>
            )}

            {/* Analysis results */}
            {status === "ready" && editItems.length > 0 && (
              <>
                {previewUrl && (
                  <img src={previewUrl} alt="food" style={{
                    width: "100%", maxHeight: 180, objectFit: "cover",
                    borderRadius: 14, marginBottom: 14,
                  }} />
                )}

                {/* AI insight */}
                {analysis?.insightAr && (
                  <div style={{
                    background: `${CYAN}11`, border: `1px solid ${CYAN}22`,
                    borderRadius: 12, padding: "10px 14px", marginBottom: 12,
                  }}>
                    <p style={{ color: CYAN, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                      💡 {lang === "ar" ? analysis.insightAr : analysis.insightEn}
                    </p>
                  </div>
                )}

                {/* Meal type selector */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                  {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
                    <button key={mt} onClick={() => setMealType(mt)} style={{
                      padding: "6px 12px", borderRadius: 20, border: "none",
                      background: mealType === mt ? CYAN : CARD2,
                      color: mealType === mt ? NAVY : MUTED,
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {MEAL_ICONS[mt]} {t(mt, lang)}
                    </button>
                  ))}
                </div>

                {/* Food items */}
                {editItems.map((item, idx) => (
                  <FoodItemRow
                    key={idx} item={item} lang={lang}
                    onUpdate={(f, v) => updateItem(idx, f, v)}
                    onRemove={() => removeItem(idx)}
                  />
                ))}

                {/* Totals */}
                <div style={{
                  background: NAVY2, borderRadius: 14, padding: "14px 16px", marginBottom: 14,
                  border: `1px solid ${CYAN}33`,
                }}>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 10px", fontWeight: 700 }}>
                    {t("total", lang)}
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
                    <MacroPill label={t("calories", lang)} value={totals.calories} unit="kcal" color={ORANGE} />
                    <MacroPill label={t("protein",  lang)} value={totals.protein}  color={CYAN} />
                    <MacroPill label={t("carbs",    lang)} value={totals.carbs}    color={GOLD} />
                    <MacroPill label={t("fat",      lang)} value={totals.fat}      color="#A78BFA" />
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: CARD2, border: `1px solid ${CARD2}`,
                    borderRadius: 12, padding: "10px 14px", color: MUTED,
                    fontSize: 12, fontFamily: "inherit", marginBottom: 14,
                    resize: "none", outline: "none",
                  }}
                />

                {/* Save button */}
                <button onClick={handleSave} disabled={saveStatus === "saving" || saveStatus === "saved"} style={{
                  width: "100%",
                  background: saveStatus === "saved"
                    ? `linear-gradient(135deg, ${GREEN}, #16A34A)`
                    : `linear-gradient(135deg, ${CYAN}CC, #00B8CCCC)`,
                  color: NAVY, border: "none", borderRadius: 14,
                  padding: "14px", fontSize: 15, fontWeight: 900,
                  cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: saveStatus === "saving" ? 0.7 : 1,
                }}>
                  {saveStatus === "saved" ? t("saved", lang) : saveStatus === "saving" ? t("saving", lang) : `💾 ${t("save", lang)}`}
                </button>
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            <TodaySummary lang={lang} />
            {!history?.length ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <p style={{ color: MUTED, fontSize: 14 }}>{t("noMeals", lang)}</p>
              </div>
            ) : (
              history.map((meal: any) => (
                <MealHistoryCard
                  key={meal.id} meal={meal} lang={lang}
                  onDelete={() => deleteMeal.mutate({ mealId: meal.id })}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*"            style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
