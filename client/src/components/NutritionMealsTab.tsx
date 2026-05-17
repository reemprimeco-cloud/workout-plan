/**
 * NutritionMealsTab — Modern daily nutrition tracker (MyFitnessPal-style)
 * Features:
 *  - Daily summary (calories + macros) with auto-reset per day
 *  - Meals grouped by type: Breakfast / Lunch / Dinner / Snack
 *  - FAB (+) with quick-add options
 *  - Manual entry form
 *  - Favorites (save/quick-add)
 *  - Recently used meals
 *  - History by date
 *  - SVG vector icons (no emojis)
 *  - White background, navy accents
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY      = "#1B2E5E";
const NAVY_DARK = "#0F1E3D";
const WHITE     = "#FFFFFF";
const PAGE_BG   = "#F0F4F8";
const BORDER    = "#DDE6F0";
const SHADOW    = "0 2px 12px rgba(27,46,94,0.08)";
const TEXT      = "#1B2E5E";
const TEXT2     = "#4A6080";
const MUTED     = "#8FA8C0";
const C_PROTEIN = "#EF4444";
const C_CARBS   = "#F59E0B";
const C_FAT     = "#8B5CF6";
const C_GREEN   = "#22C55E";
const DANGER    = "#EF4444";

// ── Translations ───────────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  today:          { ar: "اليوم", en: "Today" },
  history:        { ar: "السجل", en: "History" },
  favorites:      { ar: "المفضلة", en: "Favorites" },
  breakfast:      { ar: "الفطور", en: "Breakfast" },
  lunch:          { ar: "الغداء", en: "Lunch" },
  dinner:         { ar: "العشاء", en: "Dinner" },
  snack:          { ar: "وجبة خفيفة", en: "Snack" },
  addMeal:        { ar: "إضافة وجبة", en: "Add Meal" },
  addSnack:       { ar: "إضافة وجبة خفيفة", en: "Add Snack" },
  addDrink:       { ar: "إضافة مشروب", en: "Add Drink" },
  addCoffee:      { ar: "إضافة قهوة", en: "Add Coffee" },
  addProtein:     { ar: "إضافة بروتين", en: "Add Protein Shake" },
  manualEntry:    { ar: "إدخال يدوي", en: "Manual Entry" },
  quickAdd:       { ar: "إضافة سريعة", en: "Quick Add" },
  recentlyUsed:   { ar: "المستخدمة مؤخراً", en: "Recently Used" },
  saveToFav:      { ar: "حفظ في المفضلة", en: "Save to Favorites" },
  savedToFav:     { ar: "✓ تم الحفظ", en: "✓ Saved" },
  removeFav:      { ar: "إزالة من المفضلة", en: "Remove Favorite" },
  noFavorites:    { ar: "لا توجد مفضلات بعد", en: "No favorites yet" },
  noMeals:        { ar: "لا توجد وجبات اليوم", en: "No meals logged today" },
  noHistory:      { ar: "لا يوجد سجل بعد", en: "No history yet" },
  mealName:       { ar: "اسم الوجبة", en: "Meal name" },
  calories:       { ar: "السعرات", en: "Calories" },
  protein:        { ar: "بروتين (ج)", en: "Protein (g)" },
  carbs:          { ar: "كربوهيدرات (ج)", en: "Carbs (g)" },
  fat:            { ar: "دهون (ج)", en: "Fat (g)" },
  quantity:       { ar: "الكمية", en: "Quantity" },
  servingSize:    { ar: "حجم الحصة", en: "Serving size" },
  save:           { ar: "حفظ", en: "Save" },
  saving:         { ar: "جاري الحفظ...", en: "Saving..." },
  cancel:         { ar: "إلغاء", en: "Cancel" },
  delete:         { ar: "حذف", en: "Delete" },
  kcal:           { ar: "سعرة", en: "kcal" },
  g:              { ar: "ج", en: "g" },
  totalCalories:  { ar: "إجمالي السعرات", en: "Total Calories" },
  consumed:       { ar: "مستهلك", en: "Consumed" },
  goal:           { ar: "الهدف", en: "Goal" },
  remaining:      { ar: "متبقي", en: "Remaining" },
  mealType:       { ar: "نوع الوجبة", en: "Meal Type" },
  noData:         { ar: "لا توجد بيانات", en: "No data" },
  loading:        { ar: "جاري التحميل...", en: "Loading..." },
  tapToAdd:       { ar: "اضغط + لإضافة وجبة", en: "Tap + to add a meal" },
  addFromFav:     { ar: "إضافة من المفضلة", en: "Add from Favorites" },
};
const tl = (k: string, lang: string) => T[k]?.[lang] ?? T[k]?.en ?? k;

type MealTypeKey = "breakfast" | "lunch" | "dinner" | "snack";
type SubTab = "today" | "history" | "favorites";
type AddMode = "none" | "picker" | "manual" | "recent" | "favorites_add";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconSun({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" /><line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconCoffee({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}
function IconApple({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </svg>
  );
}
function IconDroplet({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
function IconPlus({ size = 20, color = WHITE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTrash({ size = 16, color = DANGER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function IconHeart({ size = 16, color = NAVY, filled = false }: { size?: number; color?: string; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function IconChevronRight({ size = 16, color = MUTED }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconChevronDown({ size = 16, color = MUTED }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconUtensils({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}
function IconClock({ size = 14, color = MUTED }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconHistory({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}
function IconStar({ size = 18, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ── Meal type config ───────────────────────────────────────────────────────────
const MEAL_CONFIG: Record<MealTypeKey, { icon: React.ReactNode; color: string; bg: string }> = {
  breakfast: { icon: <IconSun size={18} color="#F59E0B" />, color: "#F59E0B", bg: "#FFFBEB" },
  lunch:     { icon: <IconUtensils size={18} color="#22C55E" />, color: "#22C55E", bg: "#F0FDF4" },
  dinner:    { icon: <IconMoon size={18} color="#6366F1" />, color: "#6366F1", bg: "#EEF2FF" },
  snack:     { icon: <IconApple size={18} color="#EF4444" />, color: "#EF4444", bg: "#FFF1F2" },
};

// ── Macro bar ──────────────────────────────────────────────────────────────────
function MacroBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div style={{ height: 4, background: "#E8EDF4", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Daily summary card ─────────────────────────────────────────────────────────
function DailySummaryCard({ lang, goals }: { lang: string; goals: any }) {
  const { data: todayMeals } = trpc.nutrition.getTodayMeals.useQuery();

  const totals = useMemo(() => {
    if (!todayMeals) return { cal: 0, protein: 0, carbs: 0, fat: 0 };
    const all = [...(todayMeals.breakfast || []), ...(todayMeals.lunch || []), ...(todayMeals.dinner || []), ...(todayMeals.snack || [])];
    return {
      cal:     Math.round(all.reduce((s, m: any) => s + (m.totalCalories || 0), 0)),
      protein: Math.round(all.reduce((s, m: any) => s + (m.totalProtein || 0), 0) * 10) / 10,
      carbs:   Math.round(all.reduce((s, m: any) => s + (m.totalCarbs || 0), 0) * 10) / 10,
      fat:     Math.round(all.reduce((s, m: any) => s + (m.totalFat || 0), 0) * 10) / 10,
    };
  }, [todayMeals]);

  const calGoal     = goals?.dailyCalories || 2000;
  const proteinGoal = goals?.dailyProtein  || 150;
  const carbsGoal   = goals?.dailyCarbs    || 250;
  const fatGoal     = goals?.dailyFat      || 65;
  const remaining   = Math.max(calGoal - totals.cal, 0);
  const calPct      = Math.min((totals.cal / calGoal) * 100, 100);
  const ringColor   = totals.cal > calGoal ? "#EF4444" : NAVY;

  const size = 120; const r = 46; const circ = 2 * Math.PI * r;
  const dash = circ * (1 - calPct / 100);

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: "18px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Calorie ring */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8EDF4" strokeWidth={9} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={9}
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: ringColor, lineHeight: 1 }}>{totals.cal}</div>
            <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{tl("kcal", lang)}</div>
            <div style={{ fontSize: 9, color: MUTED }}>{tl("consumed", lang)}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: tl("goal", lang),      val: calGoal,   color: TEXT2 },
              { label: tl("remaining", lang),  val: remaining, color: remaining === 0 ? DANGER : C_GREEN },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: PAGE_BG, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Macro bars */}
          {[
            { key: "protein", val: totals.protein, goal: proteinGoal, color: C_PROTEIN },
            { key: "carbs",   val: totals.carbs,   goal: carbsGoal,   color: C_CARBS },
            { key: "fat",     val: totals.fat,      goal: fatGoal,     color: C_FAT },
          ].map(({ key, val, goal, color }) => (
            <div key={key} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: TEXT2, fontWeight: 600 }}>{tl(key, lang)}</span>
                <span style={{ fontSize: 10, color: MUTED }}>{val}g / {goal}g</span>
              </div>
              <MacroBar value={val} goal={goal} color={color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Meal group section ─────────────────────────────────────────────────────────
function MealGroup({
  mealType, meals, lang, onAdd, onDelete, onSaveToFav,
}: {
  mealType: MealTypeKey;
  meals: any[];
  lang: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSaveToFav: (meal: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const cfg = MEAL_CONFIG[mealType];
  const totalCal = meals.reduce((s, m) => s + (m.totalCalories || 0), 0);

  return (
    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, marginBottom: 10, overflow: "hidden" }}>
      {/* Group header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer", gap: 10 }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{tl(mealType, lang)}</div>
          <div style={{ fontSize: 11, color: MUTED }}>{meals.length > 0 ? `${Math.round(totalCal)} ${tl("kcal", lang)}` : tl("tapToAdd", lang)}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{ width: 28, height: 28, borderRadius: 8, background: NAVY, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <IconPlus size={14} color={WHITE} />
        </button>
        <div style={{ marginLeft: 4, transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
          <IconChevronDown size={14} color={MUTED} />
        </div>
      </div>

      {/* Meal items */}
      {expanded && meals.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {meals.map((meal: any) => (
            <MealItem key={meal.id} meal={meal} lang={lang} onDelete={() => onDelete(meal.id)} onSaveToFav={() => onSaveToFav(meal)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single meal item ───────────────────────────────────────────────────────────
function MealItem({ meal, lang, onDelete, onSaveToFav }: { meal: any; lang: string; onDelete: () => void; onSaveToFav: () => void }) {
  const [showActions, setShowActions] = useState(false);
  const time = meal.loggedAt ? new Date(meal.loggedAt).toLocaleTimeString(lang === "ar" ? "ar-KW" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const name = meal.items?.[0]?.name || meal.notes || (lang === "ar" ? "وجبة" : "Meal");

  return (
    <div>
      <div
        onClick={() => setShowActions(s => !s)}
        style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, cursor: "pointer", background: showActions ? "#F8FAFC" : WHITE, transition: "background 0.15s" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <IconClock size={11} color={MUTED} />
            <span style={{ fontSize: 10, color: MUTED }}>{time}</span>
            {meal.totalProtein > 0 && <span style={{ fontSize: 10, color: MUTED }}>• P:{Math.round(meal.totalProtein)}g</span>}
            {meal.totalCarbs > 0 && <span style={{ fontSize: 10, color: MUTED }}>C:{Math.round(meal.totalCarbs)}g</span>}
            {meal.totalFat > 0 && <span style={{ fontSize: 10, color: MUTED }}>F:{Math.round(meal.totalFat)}g</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{Math.round(meal.totalCalories)}</div>
          <div style={{ fontSize: 10, color: MUTED }}>{tl("kcal", lang)}</div>
        </div>
        <IconChevronRight size={14} color={MUTED} />
      </div>

      {showActions && (
        <div style={{ display: "flex", gap: 8, padding: "8px 14px 10px", background: "#F8FAFC", borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onSaveToFav}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", background: "#EEF2FF", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#6366F1" }}
          >
            <IconHeart size={13} color="#6366F1" /> {tl("saveToFav", lang)}
          </button>
          <button
            onClick={onDelete}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", background: "#FFF1F2", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: DANGER }}
          >
            <IconTrash size={13} color={DANGER} /> {tl("delete", lang)}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Quick-add picker modal ─────────────────────────────────────────────────────
function QuickAddPicker({ lang, onSelect, onClose }: { lang: string; onSelect: (type: string) => void; onClose: () => void }) {
  const options = [
    { type: "breakfast", icon: <IconSun size={22} color="#F59E0B" />, label: tl("breakfast", lang), bg: "#FFFBEB" },
    { type: "lunch",     icon: <IconUtensils size={22} color="#22C55E" />, label: tl("lunch", lang), bg: "#F0FDF4" },
    { type: "dinner",    icon: <IconMoon size={22} color="#6366F1" />, label: tl("dinner", lang), bg: "#EEF2FF" },
    { type: "snack",     icon: <IconApple size={22} color="#EF4444" />, label: tl("snack", lang), bg: "#FFF1F2" },
    { type: "drink",     icon: <IconDroplet size={22} color="#38BDF8" />, label: tl("addDrink", lang), bg: "#F0F9FF" },
    { type: "coffee",    icon: <IconCoffee size={22} color="#92400E" />, label: tl("addCoffee", lang), bg: "#FFFBEB" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{ position: "relative", background: WHITE, borderRadius: "24px 24px 0 0", padding: "20px 16px 32px", zIndex: 1 }}>
        <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 4, margin: "0 auto 18px" }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: "0 0 16px", textAlign: "center" }}>{tl("quickAdd", lang)}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {options.map(opt => (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", background: opt.bg, border: `1px solid ${BORDER}`, borderRadius: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              {opt.icon}
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, textAlign: "center" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Manual entry form ──────────────────────────────────────────────────────────
function ManualEntryForm({ lang, defaultType, onSaved, onClose }: { lang: string; defaultType: string; onSaved: () => void; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", quantity: "1", servingSize: "", mealType: defaultType as any });
  const [saving, setSaving] = useState(false);

  const quickAdd = trpc.nutrition.quickAdd.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayMeals.invalidate();
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getToday.invalidate();
      utils.nutrition.getRecentMeals.invalidate();
      onSaved();
    },
  });

  const handleSave = () => {
    if (!form.name || !form.calories) return;
    setSaving(true);
    quickAdd.mutate({
      name:        form.name,
      calories:    parseFloat(form.calories) || 0,
      proteinG:    parseFloat(form.protein) || 0,
      carbsG:      parseFloat(form.carbs) || 0,
      fatG:        parseFloat(form.fat) || 0,
      quantity:    parseFloat(form.quantity) || 1,
      servingSize: form.servingSize || undefined,
      mealType:    (["breakfast","lunch","dinner","snack"].includes(form.mealType) ? form.mealType : "snack") as any,
    }, { onSettled: () => setSaving(false) });
  };

  const mealTypeOptions = [
    { value: "breakfast", label: tl("breakfast", lang) },
    { value: "lunch",     label: tl("lunch", lang) },
    { value: "dinner",    label: tl("dinner", lang) },
    { value: "snack",     label: tl("snack", lang) },
  ];

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`,
    fontSize: 14, color: TEXT, background: WHITE, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", ...extra,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{ position: "relative", background: WHITE, borderRadius: "24px 24px 0 0", padding: "20px 16px 32px", zIndex: 1, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 4, margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: "0 0 16px", textAlign: "center" }}>{tl("manualEntry", lang)}</h3>

        {/* Meal type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
          {mealTypeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setForm(f => ({ ...f, mealType: opt.value as any }))}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${form.mealType === opt.value ? NAVY : BORDER}`, background: form.mealType === opt.value ? NAVY : WHITE, color: form.mealType === opt.value ? WHITE : TEXT2, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp()} placeholder={tl("mealName", lang)} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={inp()} type="number" placeholder={tl("calories", lang)} value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
            <input style={inp()} type="number" placeholder={tl("quantity", lang)} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input style={inp()} type="number" placeholder={tl("protein", lang)} value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
            <input style={inp()} type="number" placeholder={tl("carbs", lang)} value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
            <input style={inp()} type="number" placeholder={tl("fat", lang)} value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
          </div>
          <input style={inp()} placeholder={tl("servingSize", lang)} value={form.servingSize} onChange={e => setForm(f => ({ ...f, servingSize: e.target.value }))} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {tl("cancel", lang)}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.calories || saving}
            style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: !form.name || !form.calories ? BORDER : NAVY, color: WHITE, fontSize: 14, fontWeight: 700, cursor: !form.name || !form.calories ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {saving ? tl("saving", lang) : tl("save", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recently used meals ────────────────────────────────────────────────────────
function RecentMeals({ lang, onSelect, onClose }: { lang: string; onSelect: (meal: any) => void; onClose: () => void }) {
  const { data: recent, isLoading } = trpc.nutrition.getRecentMeals.useQuery();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{ position: "relative", background: WHITE, borderRadius: "24px 24px 0 0", padding: "20px 16px 32px", zIndex: 1, maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 4, margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: "0 0 14px", textAlign: "center" }}>{tl("recentlyUsed", lang)}</h3>
        {isLoading && <div style={{ textAlign: "center", color: MUTED, padding: "20px 0" }}>{tl("loading", lang)}</div>}
        {!isLoading && (!recent || recent.length === 0) && (
          <div style={{ textAlign: "center", color: MUTED, padding: "20px 0" }}>{tl("noData", lang)}</div>
        )}
        {recent?.map((meal: any, i: number) => (
          <div
            key={i}
            onClick={() => onSelect(meal)}
            style={{ display: "flex", alignItems: "center", padding: "11px 12px", borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 8, cursor: "pointer", background: WHITE, gap: 10 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconUtensils size={16} color={NAVY} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{meal.name}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{meal.calories} {tl("kcal", lang)} • P:{meal.proteinG}g C:{meal.carbsG}g F:{meal.fatG}g</div>
            </div>
            <IconChevronRight size={14} color={MUTED} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Favorites panel ────────────────────────────────────────────────────────────
function FavoritesPanel({ lang }: { lang: string }) {
  const utils = trpc.useUtils();
  const { data: favs, isLoading } = trpc.nutrition.getFavorites.useQuery();
  const removeFav = trpc.nutrition.removeFavorite.useMutation({ onSuccess: () => utils.nutrition.getFavorites.invalidate() });
  const quickAdd = trpc.nutrition.quickAdd.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayMeals.invalidate();
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getToday.invalidate();
    },
  });

  if (isLoading) return <div style={{ textAlign: "center", color: MUTED, padding: "32px 0" }}>{tl("loading", lang)}</div>;
  if (!favs?.length) return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <IconHeart size={28} color="#EF4444" />
      </div>
      <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{tl("noFavorites", lang)}</p>
      <p style={{ color: MUTED, fontSize: 12 }}>{lang === "ar" ? "احفظ وجباتك المفضلة للإضافة السريعة" : "Save your favorite meals for quick access"}</p>
    </div>
  );

  return (
    <div>
      {favs.map((fav: any) => (
        <div key={fav.id} style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: MEAL_CONFIG[(fav.mealType as MealTypeKey) in MEAL_CONFIG ? fav.mealType as MealTypeKey : "snack"].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {MEAL_CONFIG[(fav.mealType as MealTypeKey) in MEAL_CONFIG ? fav.mealType as MealTypeKey : "snack"].icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fav.name}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{fav.calories} {tl("kcal", lang)} • P:{fav.proteinG}g C:{fav.carbsG}g F:{fav.fatG}g</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => quickAdd.mutate({ name: fav.name, calories: fav.calories, proteinG: Number(fav.proteinG), carbsG: Number(fav.carbsG), fatG: Number(fav.fatG), mealType: (["breakfast","lunch","dinner","snack"].includes(fav.mealType) ? fav.mealType : "snack") as any, servingSize: fav.servingSize })}
              style={{ padding: "6px 12px", borderRadius: 8, background: NAVY, border: "none", color: WHITE, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              + {tl("addFood", lang)}
            </button>
            <button
              onClick={() => removeFav.mutate({ id: fav.id })}
              style={{ width: 30, height: 30, borderRadius: 8, background: "#FFF1F2", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <IconTrash size={13} color={DANGER} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── History panel ──────────────────────────────────────────────────────────────
function HistoryPanel({ lang }: { lang: string }) {
  const { data: history, isLoading } = trpc.nutrition.getDailyHistory.useQuery({ days: 30 });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div style={{ textAlign: "center", color: MUTED, padding: "32px 0" }}>{tl("loading", lang)}</div>;
  if (!history?.length) return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <IconHistory size={28} color={NAVY} />
      </div>
      <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0 }}>{tl("noHistory", lang)}</p>
    </div>
  );

  return (
    <div>
      {history.map((day: any) => {
        const isOpen = expanded === day.date;
        const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString(lang === "ar" ? "ar-KW" : "en-US", { weekday: "short", month: "short", day: "numeric" });
        return (
          <div key={day.date} style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: SHADOW, marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => setExpanded(isOpen ? null : day.date)} style={{ display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconHistory size={18} color={NAVY} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{dateLabel}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{day.mealCount} {lang === "ar" ? "وجبة" : "meals"} • {day.totalCalories} {tl("kcal", lang)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{day.totalCalories}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{tl("kcal", lang)}</div>
              </div>
              <div style={{ marginLeft: 4, transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
                <IconChevronDown size={14} color={MUTED} />
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: "10px 14px" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  {[
                    { label: "P", val: day.totalProtein, color: C_PROTEIN },
                    { label: "C", val: day.totalCarbs, color: C_CARBS },
                    { label: "F", val: day.totalFat, color: C_FAT },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ flex: 1, background: PAGE_BG, borderRadius: 8, padding: "6px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color }}>{val}g</div>
                      <div style={{ fontSize: 10, color: MUTED }}>{label}</div>
                    </div>
                  ))}
                </div>
                {day.meals.map((m: any) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 12, color: TEXT2 }}>{tl(m.mealType, lang)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{m.totalCalories} {tl("kcal", lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────────
function TodayTab({ lang, goals }: { lang: string; goals: any }) {
  const utils = trpc.useUtils();
  const { data: todayMeals, isLoading } = trpc.nutrition.getTodayMeals.useQuery();
  const [addMode, setAddMode] = useState<AddMode>("none");
  const [selectedType, setSelectedType] = useState<string>("snack");

  const deleteMeal = trpc.nutrition.deleteMeal.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayMeals.invalidate();
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getToday.invalidate();
    },
  });

  const addFavorite = trpc.nutrition.addFavorite.useMutation({
    onSuccess: () => utils.nutrition.getFavorites.invalidate(),
  });

  const handleSaveToFav = (meal: any) => {
    const name = meal.items?.[0]?.name || meal.notes || "Meal";
    addFavorite.mutate({
      name,
      calories:    Math.round(meal.totalCalories),
      proteinG:    Math.round(meal.totalProtein * 10) / 10,
      carbsG:      Math.round(meal.totalCarbs * 10) / 10,
      fatG:        Math.round(meal.totalFat * 10) / 10,
      mealType:    meal.mealType || "snack",
    });
  };

  const handlePickerSelect = (type: string) => {
    setSelectedType(type);
    setAddMode("manual");
  };

  const handleRecentSelect = (meal: any) => {
    setSelectedType(meal.mealType || "snack");
    setAddMode("none");
    // Quick-add the recent meal directly
    utils.nutrition.quickAdd;
  };

  if (isLoading) return <div style={{ textAlign: "center", color: MUTED, padding: "32px 0" }}>{tl("loading", lang)}</div>;

  const mealTypes: MealTypeKey[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Daily summary */}
      <DailySummaryCard lang={lang} goals={goals} />

      {/* Meal groups */}
      {mealTypes.map(type => (
        <MealGroup
          key={type}
          mealType={type}
          meals={todayMeals?.[type] || []}
          lang={lang}
          onAdd={() => { setSelectedType(type); setAddMode("manual"); }}
          onDelete={(id) => deleteMeal.mutate({ mealId: id })}
          onSaveToFav={handleSaveToFav}
        />
      ))}

      {/* FAB */}
      <button
        onClick={() => setAddMode("picker")}
        style={{
          position: "fixed", bottom: 90, right: 20, zIndex: 100,
          width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
          border: "none", boxShadow: "0 4px 20px rgba(27,46,94,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <IconPlus size={22} color={WHITE} />
      </button>

      {/* Modals */}
      {addMode === "picker" && (
        <QuickAddPicker lang={lang} onSelect={handlePickerSelect} onClose={() => setAddMode("none")} />
      )}
      {addMode === "manual" && (
        <ManualEntryForm lang={lang} defaultType={selectedType} onSaved={() => setAddMode("none")} onClose={() => setAddMode("none")} />
      )}
      {addMode === "recent" && (
        <RecentMeals lang={lang} onSelect={handleRecentSelect} onClose={() => setAddMode("none")} />
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function NutritionMealsTab({ lang }: { lang: string }) {
  const [subTab, setSubTab] = useState<SubTab>("today");
  const { data: goals } = trpc.nutrition.getGoals.useQuery();

  const subTabs: { id: SubTab; icon: React.ReactNode; label: string }[] = [
    { id: "today",     icon: <IconUtensils size={15} color={subTab === "today" ? WHITE : MUTED} />,     label: tl("today", lang) },
    { id: "history",   icon: <IconHistory size={15} color={subTab === "history" ? WHITE : MUTED} />,   label: tl("history", lang) },
    { id: "favorites", icon: <IconStar size={15} color={subTab === "favorites" ? WHITE : MUTED} />,    label: tl("favorites", lang) },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ background: WHITE, borderRadius: 14, padding: "5px", display: "flex", gap: 4, marginBottom: 14, border: `1px solid ${BORDER}`, boxShadow: SHADOW }}>
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              flex: 1, padding: "9px 4px",
              background: subTab === tab.id ? NAVY : "transparent",
              border: "none", borderRadius: 10,
              color: subTab === tab.id ? WHITE : MUTED,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              transition: "all 0.2s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {subTab === "today"     && <TodayTab lang={lang} goals={goals} />}
      {subTab === "history"   && <HistoryPanel lang={lang} />}
      {subTab === "favorites" && <FavoritesPanel lang={lang} />}
    </div>
  );
}
