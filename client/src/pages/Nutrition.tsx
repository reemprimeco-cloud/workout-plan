/**
 * Nutrition — Prime Fit
 * AI food recognition · USDA nutrition data · Meal logging
 * Mobile-first dark neon design matching the app aesthetic
 *
 * Tabs: Dashboard | Scanner | Meals | Insights
 *
 * Fix: Scanner "Add to Diary" correctly saves to mealEntries (getTodayLog)
 *      AND mealLogs (getMealHistory) so both Meals tab and History show it.
 */
import { useState, useRef, useCallback, useEffect } from "react";
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
const PURPLE  = "#A78BFA";
const CARD    = "#111827";
const CARD2   = "#1F2937";
const TEXT    = "#F9FAFB";
const MUTED   = "#9CA3AF";

// ── Translations ──────────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  title:        { ar: "تتبع التغذية", en: "Nutrition Tracker" },
  dashboard:    { ar: "لوحة التحكم", en: "Dashboard" },
  scanner:      { ar: "مسح الطعام", en: "Scan Food" },
  meals:        { ar: "وجباتي", en: "My Meals" },
  insights:     { ar: "تحليلات AI", en: "AI Insights" },
  scan:         { ar: "مسح بالكاميرا", en: "Scan Food" },
  upload:       { ar: "رفع صورة", en: "Upload Photo" },
  analyzing:    { ar: "جاري تحليل الطعام...", en: "Analyzing food..." },
  today:        { ar: "اليوم", en: "Today" },
  history:      { ar: "السجل", en: "History" },
  calories:     { ar: "سعرات", en: "Calories" },
  protein:      { ar: "بروتين", en: "Protein" },
  carbs:        { ar: "كربوهيدرات", en: "Carbs" },
  fat:          { ar: "دهون", en: "Fat" },
  fiber:        { ar: "ألياف", en: "Fiber" },
  water:        { ar: "الماء", en: "Water" },
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
  addWater:     { ar: "أضف ماء", en: "Add Water" },
  ml:           { ar: "مل", en: "ml" },
  weeklyTrend:  { ar: "الاتجاه الأسبوعي", en: "Weekly Trend" },
  generateInsights: { ar: "توليد تحليلات AI", en: "Generate AI Insights" },
  generating:   { ar: "جاري التوليد...", en: "Generating..." },
  noInsights:   { ar: "اضغط لتوليد تحليلات مخصصة", en: "Tap to generate personalized insights" },
  addToDiary:   { ar: "أضف للسجل", en: "Add to Diary" },
  mealType:     { ar: "نوع الوجبة", en: "Meal Type" },
};

const tl = (k: string, lang: string) => T[k]?.[lang] ?? T[k]?.en ?? k;

const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const MACRO_COLORS = { calories: ORANGE, protein: CYAN, carbs: GOLD, fat: PURPLE, fiber: GREEN };

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
      <div style={{ marginTop: -size/2 - 10, fontSize: size > 64 ? 15 : 13, fontWeight: 900, color: TEXT }}>{Math.round(value)}</div>
      <div style={{ fontSize: 9, color: MUTED, marginTop: size/2 - 6 }}>{label}</div>
    </div>
  );
}

// ── Macro pill ─────────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit = "g", color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div style={{
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
    }}>
      <div style={{ color, fontSize: 14, fontWeight: 900 }}>{Math.round(value)}</div>
      <div style={{ color: MUTED, fontSize: 9, marginTop: 1 }}>{unit === "kcal" ? "kcal" : unit}</div>
      <div style={{ color: MUTED, fontSize: 9 }}>{label}</div>
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
        <div style={{ flex: 1 }}>
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
          }}>{tl("edit", lang)}</button>
          <button onClick={onRemove} style={{
            background: `${RED}22`, border: `1px solid ${RED}44`, color: RED,
            borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
          }}>✕</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { k: "calories", label: tl("calories", lang), unit: "kcal", color: ORANGE },
          { k: "protein",  label: tl("protein",  lang), unit: "g",    color: CYAN },
          { k: "carbs",    label: tl("carbs",    lang), unit: "g",    color: GOLD },
          { k: "fat",      label: tl("fat",      lang), unit: "g",    color: PURPLE },
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
      </div>
    </div>
  );
}

// ── Water tracker ─────────────────────────────────────────────────────────────
function WaterTracker({ lang, totalMl, goalMl, onAdd }: {
  lang: string; totalMl: number; goalMl: number; onAdd: (ml: number) => void;
}) {
  const pct = Math.min(totalMl / Math.max(goalMl, 1), 1);
  const cups = [250, 500, 750];
  return (
    <div style={{
      background: CARD, borderRadius: 16, padding: "14px 16px",
      border: `1px solid ${CYAN}22`, marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 800 }}>💧 {tl("water", lang)}</span>
        <span style={{ color: CYAN, fontSize: 12, fontWeight: 700 }}>
          {totalMl} / {goalMl} {tl("ml", lang)}
        </span>
      </div>
      <div style={{ background: CARD2, borderRadius: 8, height: 8, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          width: `${pct * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${CYAN}, #0099BB)`,
          borderRadius: 8, transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {cups.map(ml => (
          <button key={ml} onClick={() => onAdd(ml)} style={{
            flex: 1, background: `${CYAN}18`, border: `1px solid ${CYAN}33`,
            borderRadius: 10, padding: "8px 4px", color: CYAN,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            +{ml}{tl("ml", lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyChart({ trend, lang, goalCalories }: { trend: any[]; lang: string; goalCalories: number }) {
  const maxCal = Math.max(...trend.map(d => d.calories), goalCalories, 1);
  return (
    <div style={{
      background: CARD, borderRadius: 16, padding: "14px 16px",
      border: `1px solid ${ORANGE}22`, marginBottom: 12,
    }}>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 14px" }}>
        📈 {tl("weeklyTrend", lang)}
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
        {trend.map((d, i) => {
          const h = Math.round((d.calories / maxCal) * 70);
          const isToday = i === trend.length - 1;
          return (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", height: h, minHeight: 4,
                background: isToday
                  ? `linear-gradient(180deg, ${ORANGE}, ${GOLD})`
                  : `${ORANGE}44`,
                borderRadius: "4px 4px 0 0",
                transition: "height 0.4s ease",
              }} />
              <span style={{ color: MUTED, fontSize: 8 }}>{d.dayLabel}</span>
            </div>
          );
        })}
      </div>
      {/* Goal line indicator */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <span style={{ color: GOLD, fontSize: 10 }}>
          {tl("goal", lang)}: {goalCalories} kcal
        </span>
      </div>
    </div>
  );
}

// ── Meal card (history) ───────────────────────────────────────────────────────
function MealCard({ meal, lang, onDelete }: { meal: any; lang: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.logged_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(meal.logged_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });

  return (
    <div style={{ background: CARD2, borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{MEAL_ICONS[meal.meal_type] ?? "🍽️"}</span>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>
              {lang === "ar" ? (meal.items?.[0]?.name_ar || meal.items?.[0]?.name || tl(meal.meal_type, lang)) : (meal.items?.[0]?.name || tl(meal.meal_type, lang))}
              {meal.items?.length > 1 ? ` +${meal.items.length - 1}` : ""}
            </p>
            <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{date} · {time}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: ORANGE, fontSize: 13, fontWeight: 900 }}>{Math.round(meal.total_calories)} kcal</span>
          <span style={{ color: MUTED, fontSize: 14 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${CARD}` }}>
          {meal.image_url && (
            <img src={meal.image_url} alt="meal" style={{
              width: "100%", maxHeight: 160, objectFit: "cover",
              borderRadius: 10, marginBottom: 10, marginTop: 10,
            }} />
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, marginTop: 8 }}>
            <MacroPill label={tl("calories", lang)} value={meal.total_calories} unit="kcal" color={ORANGE} />
            <MacroPill label={tl("protein",  lang)} value={meal.total_protein}  color={CYAN} />
            <MacroPill label={tl("carbs",    lang)} value={meal.total_carbs}    color={GOLD} />
            <MacroPill label={tl("fat",      lang)} value={meal.total_fat}      color={PURPLE} />
          </div>
          {meal.items?.map((item: any, i: number) => (
            <div key={i} style={{
              background: CARD, borderRadius: 10, padding: "8px 12px", marginBottom: 6,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ color: TEXT, fontSize: 12 }}>
                {lang === "ar" ? item.name_ar || item.name : item.name}
              </span>
              <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>
                {Math.round(item.calories)} kcal
              </span>
            </div>
          ))}
          {meal.insight_ar && (
            <div style={{
              background: `${CYAN}11`, border: `1px solid ${CYAN}22`,
              borderRadius: 10, padding: "8px 12px", marginTop: 8,
            }}>
              <p style={{ color: CYAN, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                💡 {lang === "ar" ? meal.insight_ar : meal.insight_en}
              </p>
            </div>
          )}
          <button onClick={onDelete} style={{
            marginTop: 10, background: `${RED}22`, border: `1px solid ${RED}44`,
            color: RED, borderRadius: 8, padding: "6px 14px", fontSize: 11,
            cursor: "pointer", fontFamily: "inherit",
          }}>🗑️ {tl("delete", lang)}</button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ lang }: { lang: string }) {
  const utils = trpc.useUtils();
  const { data: todayLog, isLoading } = trpc.nutrition.getTodayLog.useQuery({ date: undefined });
  const { data: weeklyData } = trpc.nutrition.getWeeklyTrends.useQuery();
  const logWater = trpc.nutrition.logWater.useMutation({
    onSuccess: () => utils.nutrition.getTodayLog.invalidate(),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
        <p style={{ color: MUTED, fontSize: 13 }}>{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  const goals = todayLog?.goals;
  const totals = todayLog?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const totalWaterMl = todayLog?.totalWaterMl ?? 0;
  const mealCount = todayLog?.meals?.length ?? 0;

  const calGoal  = goals?.calories ?? 2000;
  const protGoal = goals?.proteinG ?? 120;
  const carbGoal = goals?.carbsG   ?? 250;
  const fatGoal  = goals?.fatG     ?? 65;
  const waterGoal = goals?.waterMl ?? 2000;

  return (
    <div>
      {/* Today summary card */}
      <div style={{
        background: CARD, borderRadius: 20, padding: "18px 16px", marginBottom: 12,
        border: `1px solid ${CYAN}22`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 900 }}>
            📊 {tl("today", lang)}
          </span>
          <span style={{ color: MUTED, fontSize: 11 }}>
            {mealCount} {lang === "ar" ? "وجبات" : "meals"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
          <CircleProgress value={totals.calories} max={calGoal}  color={ORANGE} label={tl("calories", lang)} size={72} />
          <CircleProgress value={totals.proteinG} max={protGoal} color={CYAN}   label={tl("protein",  lang)} size={72} />
          <CircleProgress value={totals.carbsG}   max={carbGoal} color={GOLD}   label={tl("carbs",    lang)} size={72} />
          <CircleProgress value={totals.fatG}     max={fatGoal}  color={PURPLE} label={tl("fat",      lang)} size={72} />
        </div>
      </div>

      {/* Macro progress bars */}
      <div style={{
        background: CARD, borderRadius: 16, padding: "14px 16px", marginBottom: 12,
        border: `1px solid ${CARD2}`,
      }}>
        {[
          { label: tl("calories", lang), val: totals.calories, max: calGoal,  color: ORANGE, unit: "kcal" },
          { label: tl("protein",  lang), val: totals.proteinG, max: protGoal, color: CYAN,   unit: "g" },
          { label: tl("carbs",    lang), val: totals.carbsG,   max: carbGoal, color: GOLD,   unit: "g" },
          { label: tl("fat",      lang), val: totals.fatG,     max: fatGoal,  color: PURPLE, unit: "g" },
        ].map(m => {
          const pct = Math.min(m.val / Math.max(m.max, 1), 1);
          return (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: m.color, fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                <span style={{ color: MUTED, fontSize: 11 }}>
                  {Math.round(m.val)} / {m.max} {m.unit}
                </span>
              </div>
              <div style={{ background: CARD2, borderRadius: 6, height: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${pct * 100}%`, height: "100%",
                  background: m.color, borderRadius: 6,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Water tracker */}
      <WaterTracker
        lang={lang}
        totalMl={totalWaterMl}
        goalMl={waterGoal}
        onAdd={(ml) => logWater.mutate({ amountMl: ml })}
      />

      {/* Weekly chart */}
      {weeklyData?.trend && weeklyData.trend.length > 0 && (
        <WeeklyChart
          trend={weeklyData.trend}
          lang={lang}
          goalCalories={weeklyData.goals?.calories ?? 2000}
        />
      )}

      {/* Today's meals list */}
      {todayLog?.meals && todayLog.meals.length > 0 && (
        <div style={{
          background: CARD, borderRadius: 16, padding: "14px 16px",
          border: `1px solid ${CARD2}`,
        }}>
          <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 12px" }}>
            🍽️ {lang === "ar" ? "وجبات اليوم" : "Today's Meals"}
          </p>
          {todayLog.meals.map((meal: any) => (
            <div key={meal.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${CARD2}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{MEAL_ICONS[meal.mealType] ?? "🍽️"}</span>
                <div>
                  <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>
                    {lang === "ar" && meal.foodNameAr ? meal.foodNameAr : meal.foodName}
                  </p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>
                    {tl(meal.mealType, lang)} · {meal.servingSize || ""}
                  </p>
                </div>
              </div>
              <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>
                {meal.calories} kcal
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scanner Tab ───────────────────────────────────────────────────────────────
type ScanStatus = "idle" | "analyzing" | "ready";
type SaveStatus = "idle" | "saving" | "saved";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function ScannerTab({ lang, onSaved }: { lang: string; onSaved: () => void }) {
  const utils = trpc.useUtils();
  const [status, setStatus]       = useState<ScanStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis]   = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [mealType, setMealType]   = useState<MealType>("lunch");
  const [notes, setNotes]         = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError]         = useState("");
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // analyzeFood uses base64 + Vision LLM + USDA → returns items with full nutrition
  const analyzeFood = trpc.nutrition.analyzeFood.useMutation();
  // saveMeal saves to mealLogs (v2 — shows in Meals tab)
  const saveMeal = trpc.nutrition.saveMeal.useMutation();
  // logMeal saves to mealEntries (v1 — shows in Dashboard today log)
  const logMeal  = trpc.nutrition.logMeal.useMutation();

  const totals = editItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      protein:  acc.protein  + (item.protein  ?? 0),
      carbs:    acc.carbs    + (item.carbs     ?? 0),
      fat:      acc.fat      + (item.fat       ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const processImage = useCallback((file: File) => {
    setError("");
    setAnalysis(null);
    setEditItems([]);
    setStatus("analyzing");
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl  = e.target?.result as string;
      const base64   = dataUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";
      try {
        const res = await analyzeFood.mutateAsync({ imageBase64: base64, mimeType });
        if (!res.analysis || res.analysis.imageQuality === "unclear" || !res.analysis.items.length) {
          setError(tl("noFood", lang));
          setStatus("idle");
          return;
        }
        setAnalysis(res.analysis);
        setMealType(res.analysis.mealType as MealType);
        // Flatten portion nutrition into top-level fields for editing
        setEditItems(res.analysis.items.map((item: any) => ({
          ...item,
          calories:        item.portion?.calories ?? item.calories ?? 0,
          protein:         item.portion?.protein  ?? item.protein  ?? 0,
          carbs:           item.portion?.carbs    ?? item.carbs    ?? 0,
          fat:             item.portion?.fat      ?? item.fat      ?? 0,
          fiber:           item.portion?.fiber    ?? item.fiber    ?? 0,
          sugar:           item.portion?.sugar    ?? item.sugar    ?? 0,
          sodium:          item.portion?.sodium   ?? item.sodium   ?? 0,
          per100gCalories: item.per100g?.calories ?? 0,
          per100gProtein:  item.per100g?.protein  ?? 0,
          per100gCarbs:    item.per100g?.carbs    ?? 0,
          per100gFat:      item.per100g?.fat      ?? 0,
        })));
        setStatus("ready");
      } catch (err: any) {
        setError(err?.message || (lang === "ar" ? "حدث خطأ. حاول مجدداً." : "An error occurred. Try again."));
        setStatus("idle");
      }
    };
    reader.readAsDataURL(file);
  }, [lang, analyzeFood]);

  const updateItem = (idx: number, field: string, val: number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };
  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (editItems.length === 0) return;
    setSaveStatus("saving");
    try {
      // 1. Save to mealLogs (v2 — shows in Meals/History tab)
      await saveMeal.mutateAsync({
        mealType,
        imageUrl: analysis?.imageUrl,
        notes,
        insightAr: analysis?.insightAr ?? "",
        insightEn: analysis?.insightEn ?? "",
        items: editItems.map(item => ({
          name:            item.name,
          nameAr:          item.nameAr ?? "",
          estimatedGrams:  item.estimatedGrams ?? 100,
          portionDesc:     item.portionDesc ?? "",
          portionDescAr:   item.portionDescAr ?? "",
          fdcId:           item.fdcId,
          confidence:      item.confidence ?? "medium",
          calories:        item.calories ?? 0,
          protein:         item.protein  ?? 0,
          carbs:           item.carbs    ?? 0,
          fat:             item.fat      ?? 0,
          fiber:           item.fiber    ?? 0,
          sugar:           item.sugar    ?? 0,
          sodium:          item.sodium   ?? 0,
          per100gCalories: item.per100gCalories ?? 0,
          per100gProtein:  item.per100gProtein  ?? 0,
          per100gCarbs:    item.per100gCarbs    ?? 0,
          per100gFat:      item.per100gFat      ?? 0,
        })),
      });

      // 2. Also save each item to mealEntries (v1 — shows in Dashboard today log)
      for (const item of editItems) {
        await logMeal.mutateAsync({
          mealType,
          foodName:    item.name,
          foodNameAr:  item.nameAr,
          calories:    Math.round(item.calories ?? 0),
          proteinG:    Math.round((item.protein ?? 0) * 10) / 10,
          carbsG:      Math.round((item.carbs   ?? 0) * 10) / 10,
          fatG:        Math.round((item.fat     ?? 0) * 10) / 10,
          servingSize: item.portionDesc,
          imageUrl:    analysis?.imageUrl,
          addedByAI:   true,
        });
      }

      // Invalidate both queries so UI refreshes
      await utils.nutrition.getTodayLog.invalidate();
      await utils.nutrition.getMealHistory.invalidate();
      await utils.nutrition.getToday.invalidate();

      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
        setStatus("idle");
        setEditItems([]);
        setAnalysis(null);
        setPreviewUrl(null);
        setNotes("");
        onSaved(); // switch to Meals tab
      }, 1500);
    } catch (err: any) {
      setError(err?.message || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
      setSaveStatus("idle");
    }
  };

  return (
    <div>
      {status === "idle" && (
        <>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                flex: 1, background: `linear-gradient(135deg, ${CYAN}, #00B8CC)`,
                border: "none", borderRadius: 16, padding: "20px 12px",
                color: NAVY, fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>📷</span>
              {tl("scan", lang)}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, background: CARD2, border: `1px solid ${CARD2}`,
                borderRadius: 16, padding: "20px 12px",
                color: TEXT, fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>🖼️</span>
              {tl("upload", lang)}
            </button>
          </div>

          {/* Barcode coming soon */}
          <div style={{
            background: CARD2, border: `1.5px dashed ${GOLD}44`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>
              {tl("barcodeHint", lang)}
            </span>
          </div>

          {/* Manual search */}
          <ManualSearch lang={lang} mealType={mealType} setMealType={setMealType} />
        </>
      )}

      {/* Analyzing */}
      {status === "analyzing" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          {previewUrl && (
            <img src={previewUrl} alt="food" style={{
              width: "100%", maxHeight: 200, objectFit: "cover",
              borderRadius: 16, marginBottom: 16, opacity: 0.7,
            }} />
          )}
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>🔍</div>
          <p style={{ color: CYAN, fontSize: 14, fontWeight: 700 }}>{tl("analyzing", lang)}</p>
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
          }}>{tl("tryAgain", lang)}</button>
        </div>
      )}

      {/* Results */}
      {status === "ready" && editItems.length > 0 && (
        <>
          {previewUrl && (
            <img src={previewUrl} alt="food" style={{
              width: "100%", maxHeight: 180, objectFit: "cover",
              borderRadius: 14, marginBottom: 14,
            }} />
          )}

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
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 8px" }}>
              {tl("mealType", lang)}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
                <button key={mt} onClick={() => setMealType(mt)} style={{
                  padding: "6px 12px", borderRadius: 20, border: "none",
                  background: mealType === mt ? CYAN : CARD2,
                  color: mealType === mt ? NAVY : MUTED,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {MEAL_ICONS[mt]} {tl(mt, lang)}
                </button>
              ))}
            </div>
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
              {tl("total", lang)}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              <MacroPill label={tl("calories", lang)} value={totals.calories} unit="kcal" color={ORANGE} />
              <MacroPill label={tl("protein",  lang)} value={totals.protein}  color={CYAN} />
              <MacroPill label={tl("carbs",    lang)} value={totals.carbs}    color={GOLD} />
              <MacroPill label={tl("fat",      lang)} value={totals.fat}      color={PURPLE} />
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
            {saveStatus === "saved"
              ? tl("saved", lang)
              : saveStatus === "saving"
              ? tl("saving", lang)
              : `💾 ${tl("addToDiary", lang)}`}
          </button>
        </>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*"            style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
    </div>
  );
}

// ── Manual search ─────────────────────────────────────────────────────────────
function ManualSearch({ lang, mealType, setMealType }: {
  lang: string;
  mealType: MealType;
  setMealType: (m: MealType) => void;
}) {
  const utils = trpc.useUtils();
  const [query, setQuery]   = useState("");
  const [grams, setGrams]   = useState(100);
  const [result, setResult] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);

  const search = trpc.nutrition.searchFood.useQuery(
    { query, grams },
    { enabled: query.length >= 2 }
  );
  const logMeal = trpc.nutrition.logMeal.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getToday.invalidate();
    },
  });

  useEffect(() => {
    if (search.data) setResult(search.data);
  }, [search.data]);

  const handleAdd = async () => {
    if (!result?.portion) return;
    setAdding(true);
    await logMeal.mutateAsync({
      mealType,
      foodName:   result.food?.description ?? query,
      calories:   Math.round(result.portion.calories),
      proteinG:   Math.round(result.portion.protein * 10) / 10,
      carbsG:     Math.round(result.portion.carbs * 10) / 10,
      fatG:       Math.round(result.portion.fat * 10) / 10,
      servingSize: `${grams}g`,
      addedByAI:  false,
    });
    setAdding(false);
    setAdded(true);
    setTimeout(() => { setAdded(false); setQuery(""); setResult(null); }, 1500);
  };

  return (
    <div style={{
      background: CARD, borderRadius: 16, padding: "14px 16px",
      border: `1px solid ${CARD2}`,
    }}>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>
        🔍 {lang === "ar" ? "بحث يدوي" : "Manual Search"}
      </p>
      <input
        type="text"
        placeholder={tl("searchFood", lang)}
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: CARD2, border: `1px solid ${CARD2}`,
          borderRadius: 12, padding: "10px 14px", color: TEXT,
          fontSize: 13, fontFamily: "inherit", marginBottom: 8,
          outline: "none",
        }}
      />
      {result?.portion && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: CYAN, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
            {result.food?.description}
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <MacroPill label={tl("calories", lang)} value={result.portion.calories} unit="kcal" color={ORANGE} />
            <MacroPill label={tl("protein",  lang)} value={result.portion.protein}  color={CYAN} />
            <MacroPill label={tl("carbs",    lang)} value={result.portion.carbs}    color={GOLD} />
            <MacroPill label={tl("fat",      lang)} value={result.portion.fat}      color={PURPLE} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              type="number"
              value={grams}
              onChange={e => setGrams(parseInt(e.target.value) || 100)}
              style={{
                width: 70, background: CARD2, border: `1px solid ${CYAN}44`,
                borderRadius: 8, padding: "6px 8px", color: CYAN,
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <span style={{ color: MUTED, fontSize: 12 }}>g</span>
          </div>
          {/* Meal type */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
              <button key={mt} onClick={() => setMealType(mt)} style={{
                padding: "4px 10px", borderRadius: 16, border: "none",
                background: mealType === mt ? CYAN : CARD2,
                color: mealType === mt ? NAVY : MUTED,
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {MEAL_ICONS[mt]} {tl(mt, lang)}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} disabled={adding || added} style={{
            width: "100%",
            background: added
              ? `linear-gradient(135deg, ${GREEN}, #16A34A)`
              : `linear-gradient(135deg, ${CYAN}CC, #00B8CCCC)`,
            color: NAVY, border: "none", borderRadius: 12,
            padding: "10px", fontSize: 13, fontWeight: 900,
            cursor: adding ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}>
            {added ? "✅ " + tl("saved", lang) : adding ? tl("saving", lang) : `+ ${tl("addFood", lang)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Meals Tab ─────────────────────────────────────────────────────────────────
function MealsTab({ lang }: { lang: string }) {
  const utils = trpc.useUtils();
  const { data: history, isLoading } = trpc.nutrition.getMealHistory.useQuery({ limit: 30 });
  const deleteMeal = trpc.nutrition.deleteMeal.useMutation({
    onSuccess: () => {
      utils.nutrition.getMealHistory.invalidate();
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getToday.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <p style={{ color: MUTED, fontSize: 14 }}>{tl("noMeals", lang)}</p>
        <p style={{ color: MUTED, fontSize: 12 }}>
          {lang === "ar" ? "استخدم الماسح لإضافة وجباتك" : "Use the scanner to add your meals"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {history.map((meal: any) => (
        <MealCard
          key={meal.id} meal={meal} lang={lang}
          onDelete={() => deleteMeal.mutate({ mealId: meal.id })}
        />
      ))}
    </div>
  );
}

// ── Insights Tab ──────────────────────────────────────────────────────────────
function InsightsTab({ lang }: { lang: string }) {
  const utils = trpc.useUtils();
  const { data: insights, isLoading } = trpc.nutrition.getInsights.useQuery();
  const generateInsights = trpc.nutrition.generateInsights.useMutation({
    onSuccess: () => utils.nutrition.getInsights.invalidate(),
  });

  const insightIcons: Record<string, string> = {
    protein: "💪",
    hydration: "💧",
    calories: "🔥",
    carbs: "🌾",
    fat: "🥑",
    recovery: "🛌",
    sugar: "🍬",
    default: "💡",
  };

  return (
    <div>
      <button
        onClick={() => generateInsights.mutate({ lang: lang as "ar" | "en" })}
        disabled={generateInsights.isPending}
        style={{
          width: "100%",
          background: generateInsights.isPending
            ? CARD2
            : `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
          color: generateInsights.isPending ? MUTED : NAVY,
          border: "none", borderRadius: 16,
          padding: "14px", fontSize: 14, fontWeight: 900,
          cursor: generateInsights.isPending ? "not-allowed" : "pointer",
          fontFamily: "inherit", marginBottom: 16,
        }}
      >
        {generateInsights.isPending
          ? `⏳ ${tl("generating", lang)}`
          : `🤖 ${tl("generateInsights", lang)}`}
      </button>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 28, animation: "spin 1s linear infinite" }}>⏳</div>
        </div>
      )}

      {!isLoading && (!insights || insights.length === 0) && (
        <div style={{
          background: CARD, borderRadius: 16, padding: "24px 16px", textAlign: "center",
          border: `1px solid ${GOLD}22`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
          <p style={{ color: MUTED, fontSize: 13 }}>{tl("noInsights", lang)}</p>
        </div>
      )}

      {insights?.map((insight: any, i: number) => {
        const category = insight.category ?? "default";
        const icon = insightIcons[category] ?? insightIcons.default;
        const priorityColor = insight.priority === "high" ? RED : insight.priority === "medium" ? GOLD : GREEN;
        return (
          <div key={i} style={{
            background: CARD, borderRadius: 16, padding: "16px",
            marginBottom: 10, border: `1px solid ${priorityColor}22`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: priorityColor, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                    {insight.priority ?? "info"}
                  </span>
                  <span style={{ color: MUTED, fontSize: 10 }}>
                    {new Date(insight.createdAt ?? Date.now()).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>
                  {lang === "ar" ? insight.titleAr ?? insight.title : insight.title}
                </p>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  {lang === "ar" ? insight.bodyAr ?? insight.body : insight.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Nutrition Page ───────────────────────────────────────────────────────
type NutritionTab = "dashboard" | "scanner" | "meals" | "insights";

export default function Nutrition() {
  const { lang, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<NutritionTab>("dashboard");

  const tabs: { id: NutritionTab; icon: string; label: string }[] = [
    { id: "dashboard", icon: "📊", label: tl("dashboard", lang) },
    { id: "scanner",   icon: "📷", label: tl("scanner",   lang) },
    { id: "meals",     icon: "🍽️", label: tl("meals",     lang) },
    { id: "insights",  icon: "🤖", label: tl("insights",  lang) },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      minHeight: "100vh",
      background: NAVY,
      fontFamily: lang === "ar" ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
      color: TEXT,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, #0D1B2A, ${NAVY2})`,
        padding: "16px 16px 0",
        borderBottom: `1px solid ${CYAN}22`,
      }}>
        <h1 style={{
          color: TEXT, fontSize: 18, fontWeight: 900, margin: "0 0 14px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          🥗 <span style={{ color: CYAN }}>Prime</span> {tl("title", lang)}
        </h1>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 4px 12px",
                background: "none", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${CYAN}` : "2px solid transparent",
                color: activeTab === tab.id ? CYAN : MUTED,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 100px" }}>
        {activeTab === "dashboard" && <DashboardTab lang={lang} />}
        {activeTab === "scanner"   && (
          <ScannerTab lang={lang} onSaved={() => setActiveTab("meals")} />
        )}
        {activeTab === "meals"     && <MealsTab lang={lang} />}
        {activeTab === "insights"  && <InsightsTab lang={lang} />}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
