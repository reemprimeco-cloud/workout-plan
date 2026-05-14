/**
 * Nutrition — Prime Fit
 * AI food recognition · USDA nutrition data · Meal logging
 * Clean white / light theme — comfortable for the eyes
 *
 * Tabs: Dashboard | Scanner | Meals | Insights
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

// ── Light design tokens ───────────────────────────────────────────────────────
const BG        = "#F7F9FC";       // page background — very soft blue-white
const WHITE     = "#FFFFFF";       // card surface
const BORDER    = "#E8EDF4";       // card border
const SHADOW    = "0 2px 12px rgba(27,46,94,0.07)";
const NAVY      = "#1B2E5E";       // primary text / brand
const NAVY_LIGHT = "#3B5998";      // secondary navy
const SKY       = "#2196F3";       // primary accent (blue)
const SKY_LIGHT = "#E3F2FD";       // accent bg tint
const GREEN     = "#22C55E";
const GREEN_BG  = "#F0FDF4";
const ORANGE    = "#F97316";
const ORANGE_BG = "#FFF7ED";
const PURPLE    = "#8B5CF6";
const PURPLE_BG = "#F5F3FF";
const GOLD      = "#F59E0B";
const GOLD_BG   = "#FFFBEB";
const RED       = "#EF4444";
const RED_BG    = "#FEF2F2";
const TEXT      = "#1E293B";       // primary text
const TEXT2     = "#475569";       // secondary text
const MUTED     = "#94A3B8";       // muted / placeholder
const CYAN      = "#06B6D4";       // teal accent

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

// ── Shared card style ─────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: WHITE,
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  boxShadow: SHADOW,
  padding: "16px",
  marginBottom: 12,
  ...extra,
});

// ── Circular progress ─────────────────────────────────────────────────────────
function CircleProgress({ value, max, color, colorBg, label, size = 76 }: {
  value: number; max: number; color: string; colorBg: string; label: string; size?: number;
}) {
  const pct  = Math.min(value / Math.max(max, 1), 1);
  const r    = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colorBg} strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: size > 70 ? 14 : 12, fontWeight: 800, color: TEXT,
        lineHeight: 1.1,
      }}>
        {Math.round(value)}
      </div>
      <div style={{ fontSize: 10, color: TEXT2, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Macro stat card ───────────────────────────────────────────────────────────
function MacroCard({ label, value, max, unit, color, colorBg, icon }: {
  label: string; value: number; max: number; unit: string;
  color: string; colorBg: string; icon: string;
}) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  return (
    <div style={{
      background: colorBg, borderRadius: 14, padding: "12px 14px",
      border: `1px solid ${color}22`, flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color, fontSize: 11, fontWeight: 700 }}>
          {Math.round(value)}/{max}{unit}
        </span>
      </div>
      <div style={{ color: TEXT, fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      <div style={{ background: `${color}22`, borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{
          width: `${pct * 100}%`, height: "100%",
          background: color, borderRadius: 4,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ── Macro pill ─────────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit = "g", color, colorBg }: {
  label: string; value: number; unit?: string; color: string; colorBg: string;
}) {
  return (
    <div style={{
      background: colorBg, border: `1px solid ${color}33`,
      borderRadius: 10, padding: "7px 10px", textAlign: "center", minWidth: 62,
    }}>
      <div style={{ color, fontSize: 14, fontWeight: 800 }}>{Math.round(value)}</div>
      <div style={{ color: TEXT2, fontSize: 9, marginTop: 1 }}>{unit === "kcal" ? "kcal" : unit}</div>
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
  const confColor = item.confidence === "high" ? GREEN : item.confidence === "medium" ? GOLD : MUTED;

  return (
    <div style={{
      background: WHITE, borderRadius: 12, padding: "12px 14px",
      marginBottom: 8, border: `1px solid ${BORDER}`,
      boxShadow: "0 1px 4px rgba(27,46,94,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>
            {lang === "ar" && item.nameAr ? item.nameAr : item.name}
          </span>
          <span style={{ color: confColor, fontSize: 10, marginRight: 6, marginLeft: 6 }}>●</span>
          <span style={{ color: MUTED, fontSize: 11 }}>
            {lang === "ar" ? item.portionDescAr || item.portionDesc : item.portionDesc}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setEditing(!editing)} style={{
            background: SKY_LIGHT, border: `1px solid ${SKY}33`, color: SKY,
            borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
          }}>{tl("edit", lang)}</button>
          <button onClick={onRemove} style={{
            background: RED_BG, border: `1px solid ${RED}33`, color: RED,
            borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
          }}>✕</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { k: "calories", label: tl("calories", lang), unit: "kcal", color: ORANGE, bg: ORANGE_BG },
          { k: "protein",  label: tl("protein",  lang), unit: "g",    color: SKY,    bg: SKY_LIGHT },
          { k: "carbs",    label: tl("carbs",    lang), unit: "g",    color: GOLD,   bg: GOLD_BG },
          { k: "fat",      label: tl("fat",      lang), unit: "g",    color: PURPLE, bg: PURPLE_BG },
        ].map(m => (
          editing ? (
            <div key={m.k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <input
                type="number"
                value={item[m.k] ?? 0}
                onChange={e => onUpdate(m.k, parseFloat(e.target.value) || 0)}
                style={{
                  width: 56, background: m.bg, border: `1.5px solid ${m.color}55`,
                  borderRadius: 8, padding: "5px 6px", color: m.color,
                  fontSize: 13, fontWeight: 700, textAlign: "center", outline: "none",
                }}
              />
              <span style={{ color: MUTED, fontSize: 9 }}>{m.label}</span>
            </div>
          ) : (
            <MacroPill key={m.k} label={m.label} value={item[m.k] ?? 0} unit={m.unit} color={m.color} colorBg={m.bg} />
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
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: TEXT, fontSize: 14, fontWeight: 800 }}>💧 {tl("water", lang)}</span>
        <span style={{ color: CYAN, fontSize: 12, fontWeight: 700, background: "#E0F7FA", borderRadius: 20, padding: "2px 10px" }}>
          {totalMl} / {goalMl} {tl("ml", lang)}
        </span>
      </div>
      <div style={{ background: "#E3F2FD", borderRadius: 8, height: 10, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          width: `${pct * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${CYAN}, ${SKY})`,
          borderRadius: 8, transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {cups.map(ml => (
          <button key={ml} onClick={() => onAdd(ml)} style={{
            flex: 1, background: "#E3F2FD", border: `1px solid ${CYAN}44`,
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
    <div style={card()}>
      <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>
        📈 {tl("weeklyTrend", lang)}
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80 }}>
        {trend.map((d, i) => {
          const h = Math.round((d.calories / maxCal) * 70);
          const isToday = i === trend.length - 1;
          return (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", height: h, minHeight: 4,
                background: isToday
                  ? `linear-gradient(180deg, ${ORANGE}, ${GOLD})`
                  : `${SKY}44`,
                borderRadius: "6px 6px 0 0",
                transition: "height 0.4s ease",
              }} />
              <span style={{ color: MUTED, fontSize: 8 }}>{d.dayLabel}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <span style={{ color: GOLD, fontSize: 10, background: GOLD_BG, borderRadius: 20, padding: "2px 8px" }}>
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
    <div style={{
      background: WHITE, borderRadius: 16, marginBottom: 10,
      border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: ORANGE_BG, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>
            {MEAL_ICONS[meal.meal_type] ?? "🍽️"}
          </div>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>
              {lang === "ar" ? (meal.items?.[0]?.name_ar || meal.items?.[0]?.name || tl(meal.meal_type, lang)) : (meal.items?.[0]?.name || tl(meal.meal_type, lang))}
              {meal.items?.length > 1 ? ` +${meal.items.length - 1}` : ""}
            </p>
            <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>{date} · {time}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            color: ORANGE, fontSize: 13, fontWeight: 800,
            background: ORANGE_BG, borderRadius: 20, padding: "3px 10px",
          }}>
            {Math.round(meal.total_calories)} kcal
          </span>
          <span style={{ color: MUTED, fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
          {meal.image_url && (
            <img src={meal.image_url} alt="meal" style={{
              width: "100%", maxHeight: 160, objectFit: "cover",
              borderRadius: 12, marginBottom: 12, marginTop: 12,
            }} />
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, marginTop: 10 }}>
            <MacroPill label={tl("calories", lang)} value={meal.total_calories} unit="kcal" color={ORANGE} colorBg={ORANGE_BG} />
            <MacroPill label={tl("protein",  lang)} value={meal.total_protein}  color={SKY}    colorBg={SKY_LIGHT} />
            <MacroPill label={tl("carbs",    lang)} value={meal.total_carbs}    color={GOLD}   colorBg={GOLD_BG} />
            <MacroPill label={tl("fat",      lang)} value={meal.total_fat}      color={PURPLE} colorBg={PURPLE_BG} />
          </div>
          {meal.items?.map((item: any, i: number) => (
            <div key={i} style={{
              background: BG, borderRadius: 10, padding: "8px 12px", marginBottom: 6,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              border: `1px solid ${BORDER}`,
            }}>
              <span style={{ color: TEXT2, fontSize: 12 }}>
                {lang === "ar" ? item.name_ar || item.name : item.name}
              </span>
              <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>
                {Math.round(item.calories)} kcal
              </span>
            </div>
          ))}
          {meal.insight_ar && (
            <div style={{
              background: SKY_LIGHT, border: `1px solid ${SKY}33`,
              borderRadius: 10, padding: "10px 12px", marginTop: 10,
            }}>
              <p style={{ color: NAVY_LIGHT, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                💡 {lang === "ar" ? meal.insight_ar : meal.insight_en}
              </p>
            </div>
          )}
          <button onClick={onDelete} style={{
            marginTop: 10, background: RED_BG, border: `1px solid ${RED}33`,
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
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
        <p style={{ color: MUTED, fontSize: 13 }}>{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  const goals   = todayLog?.goals;
  const totals  = todayLog?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const totalWaterMl = todayLog?.totalWaterMl ?? 0;
  const mealCount    = todayLog?.meals?.length ?? 0;

  const calGoal   = goals?.calories ?? 2000;
  const protGoal  = goals?.proteinG ?? 120;
  const carbGoal  = goals?.carbsG   ?? 250;
  const fatGoal   = goals?.fatG     ?? 65;
  const waterGoal = goals?.waterMl  ?? 2000;

  return (
    <div>
      {/* Today hero card */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
        borderRadius: 20, padding: "20px 16px", marginBottom: 14,
        boxShadow: "0 4px 20px rgba(27,46,94,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 }}>
              {lang === "ar" ? "اليوم" : "Today"}
            </p>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 900, margin: "2px 0 0" }}>
              {lang === "ar" ? "ملخص التغذية" : "Nutrition Summary"}
            </p>
          </div>
          <span style={{
            background: "rgba(255,255,255,0.15)", borderRadius: 20,
            padding: "4px 12px", color: "rgba(255,255,255,0.9)", fontSize: 11,
          }}>
            {mealCount} {lang === "ar" ? "وجبات" : "meals"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
          <CircleProgress value={totals.calories} max={calGoal}  color="#FF9800" colorBg="rgba(255,152,0,0.2)"  label={tl("calories", lang)} size={76} />
          <CircleProgress value={totals.proteinG} max={protGoal} color="#29B6F6" colorBg="rgba(41,182,246,0.2)" label={tl("protein",  lang)} size={76} />
          <CircleProgress value={totals.carbsG}   max={carbGoal} color="#FDD835" colorBg="rgba(253,216,53,0.2)" label={tl("carbs",    lang)} size={76} />
          <CircleProgress value={totals.fatG}     max={fatGoal}  color="#CE93D8" colorBg="rgba(206,147,216,0.2)" label={tl("fat",    lang)} size={76} />
        </div>
      </div>

      {/* Macro cards row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <MacroCard label={tl("protein",  lang)} value={totals.proteinG} max={protGoal} unit="g"    color={SKY}    colorBg={SKY_LIGHT} icon="💪" />
        <MacroCard label={tl("carbs",    lang)} value={totals.carbsG}   max={carbGoal} unit="g"    color={GOLD}   colorBg={GOLD_BG}   icon="🌾" />
        <MacroCard label={tl("fat",      lang)} value={totals.fatG}     max={fatGoal}  unit="g"    color={PURPLE} colorBg={PURPLE_BG} icon="🥑" />
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
        <div style={card()}>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>
            🍽️ {lang === "ar" ? "وجبات اليوم" : "Today's Meals"}
          </p>
          {todayLog.meals.map((meal: any) => (
            <div key={meal.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${BORDER}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: ORANGE_BG,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {MEAL_ICONS[meal.mealType] ?? "🍽️"}
                </div>
                <div>
                  <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>
                    {lang === "ar" && meal.foodNameAr ? meal.foodNameAr : meal.foodName}
                  </p>
                  <p style={{ color: MUTED, fontSize: 10, margin: "1px 0 0" }}>
                    {tl(meal.mealType, lang)} · {meal.servingSize || ""}
                  </p>
                </div>
              </div>
              <span style={{
                color: ORANGE, fontSize: 12, fontWeight: 700,
                background: ORANGE_BG, borderRadius: 20, padding: "2px 8px",
              }}>
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
  const [status, setStatus]         = useState<ScanStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis]     = useState<any>(null);
  const [editItems, setEditItems]   = useState<any[]>([]);
  const [mealType, setMealType]     = useState<MealType>("lunch");
  const [notes, setNotes]           = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError]           = useState("");
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const analyzeFood = trpc.nutrition.analyzeFood.useMutation();
  const saveMeal    = trpc.nutrition.saveMeal.useMutation();
  const logMeal     = trpc.nutrition.logMeal.useMutation();

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
    setError(""); setAnalysis(null); setEditItems([]);
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
          setError(tl("noFood", lang)); setStatus("idle"); return;
        }
        setAnalysis(res.analysis);
        setMealType(res.analysis.mealType as MealType);
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

  const updateItem = (idx: number, field: string, val: number) =>
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeItem = (idx: number) =>
    setEditItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (editItems.length === 0) return;
    setSaveStatus("saving");
    try {
      await saveMeal.mutateAsync({
        mealType,
        imageUrl:  analysis?.imageUrl,
        notes,
        insightAr: analysis?.insightAr ?? "",
        insightEn: analysis?.insightEn ?? "",
        items: editItems.map(item => ({
          name: item.name, nameAr: item.nameAr ?? "",
          estimatedGrams: item.estimatedGrams ?? 100,
          portionDesc: item.portionDesc ?? "", portionDescAr: item.portionDescAr ?? "",
          fdcId: item.fdcId, confidence: item.confidence ?? "medium",
          calories: item.calories ?? 0, protein: item.protein ?? 0,
          carbs: item.carbs ?? 0, fat: item.fat ?? 0,
          fiber: item.fiber ?? 0, sugar: item.sugar ?? 0, sodium: item.sodium ?? 0,
          per100gCalories: item.per100gCalories ?? 0, per100gProtein: item.per100gProtein ?? 0,
          per100gCarbs: item.per100gCarbs ?? 0, per100gFat: item.per100gFat ?? 0,
        })),
      });
      for (const item of editItems) {
        await logMeal.mutateAsync({
          mealType, foodName: item.name, foodNameAr: item.nameAr,
          calories: Math.round(item.calories ?? 0),
          proteinG: Math.round((item.protein ?? 0) * 10) / 10,
          carbsG:   Math.round((item.carbs   ?? 0) * 10) / 10,
          fatG:     Math.round((item.fat     ?? 0) * 10) / 10,
          servingSize: item.portionDesc, imageUrl: analysis?.imageUrl, addedByAI: true,
        });
      }
      await utils.nutrition.getTodayLog.invalidate();
      await utils.nutrition.getMealHistory.invalidate();
      await utils.nutrition.getToday.invalidate();
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle"); setStatus("idle"); setEditItems([]);
        setAnalysis(null); setPreviewUrl(null); setNotes("");
        onSaved();
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
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${SKY}, ${CYAN})`,
                border: "none", borderRadius: 18, padding: "22px 12px",
                color: WHITE, fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                boxShadow: `0 4px 16px ${SKY}44`,
              }}
            >
              <span style={{ fontSize: 34 }}>📷</span>
              {tl("scan", lang)}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, background: WHITE, border: `1.5px solid ${BORDER}`,
                borderRadius: 18, padding: "22px 12px",
                color: TEXT, fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                boxShadow: SHADOW,
              }}
            >
              <span style={{ fontSize: 34 }}>🖼️</span>
              {tl("upload", lang)}
            </button>
          </div>

          {/* Barcode coming soon */}
          <div style={{
            background: GOLD_BG, border: `1.5px dashed ${GOLD}66`,
            borderRadius: 14, padding: "12px 16px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>📊</span>
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
              borderRadius: 16, marginBottom: 16, opacity: 0.85,
            }} />
          )}
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite" }}>🔍</div>
          <p style={{ color: SKY, fontSize: 14, fontWeight: 700 }}>{tl("analyzing", lang)}</p>
          <p style={{ color: MUTED, fontSize: 11 }}>
            {lang === "ar" ? "يتم تحليل الطعام بالذكاء الاصطناعي..." : "AI is identifying food items..."}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: RED_BG, border: `1px solid ${RED}44`, borderRadius: 14,
          padding: "14px 16px", marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ color: RED, fontSize: 13, margin: "0 0 10px" }}>{error}</p>
          <button onClick={() => { setError(""); setPreviewUrl(null); }} style={{
            background: RED_BG, border: `1px solid ${RED}44`, color: RED, borderRadius: 8,
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
              background: SKY_LIGHT, border: `1px solid ${SKY}33`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 12,
            }}>
              <p style={{ color: NAVY_LIGHT, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                💡 {lang === "ar" ? analysis.insightAr : analysis.insightEn}
              </p>
            </div>
          )}

          {/* Meal type selector */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: TEXT2, fontSize: 11, fontWeight: 700, margin: "0 0 8px" }}>
              {tl("mealType", lang)}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
                <button key={mt} onClick={() => setMealType(mt)} style={{
                  padding: "7px 14px", borderRadius: 20,
                  border: mealType === mt ? `1.5px solid ${SKY}` : `1px solid ${BORDER}`,
                  background: mealType === mt ? SKY_LIGHT : WHITE,
                  color: mealType === mt ? SKY : TEXT2,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {MEAL_ICONS[mt]} {tl(mt, lang)}
                </button>
              ))}
            </div>
          </div>

          {editItems.map((item, idx) => (
            <FoodItemRow
              key={idx} item={item} lang={lang}
              onUpdate={(f, v) => updateItem(idx, f, v)}
              onRemove={() => removeItem(idx)}
            />
          ))}

          {/* Totals */}
          <div style={{
            background: BG, borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            border: `1px solid ${BORDER}`,
          }}>
            <p style={{ color: TEXT2, fontSize: 11, margin: "0 0 10px", fontWeight: 700 }}>
              {tl("total", lang)}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              <MacroPill label={tl("calories", lang)} value={totals.calories} unit="kcal" color={ORANGE} colorBg={ORANGE_BG} />
              <MacroPill label={tl("protein",  lang)} value={totals.protein}  color={SKY}    colorBg={SKY_LIGHT} />
              <MacroPill label={tl("carbs",    lang)} value={totals.carbs}    color={GOLD}   colorBg={GOLD_BG} />
              <MacroPill label={tl("fat",      lang)} value={totals.fat}      color={PURPLE} colorBg={PURPLE_BG} />
            </div>
          </div>

          <textarea
            placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{
              width: "100%", boxSizing: "border-box",
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "10px 14px", color: TEXT,
              fontSize: 12, fontFamily: "inherit", marginBottom: 14,
              resize: "none", outline: "none",
            }}
          />

          <button onClick={handleSave} disabled={saveStatus === "saving" || saveStatus === "saved"} style={{
            width: "100%",
            background: saveStatus === "saved"
              ? `linear-gradient(135deg, ${GREEN}, #16A34A)`
              : `linear-gradient(135deg, ${SKY}, ${CYAN})`,
            color: WHITE, border: "none", borderRadius: 14,
            padding: "14px", fontSize: 15, fontWeight: 900,
            cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: saveStatus === "saving" ? 0.7 : 1,
            boxShadow: saveStatus === "saved" ? "none" : `0 4px 16px ${SKY}44`,
          }}>
            {saveStatus === "saved"
              ? tl("saved", lang)
              : saveStatus === "saving"
              ? tl("saving", lang)
              : `💾 ${tl("addToDiary", lang)}`}
          </button>
        </>
      )}

      <input ref={fileInputRef}   type="file" accept="image/*"            style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
    </div>
  );
}

// ── Manual search ─────────────────────────────────────────────────────────────
function ManualSearch({ lang, mealType, setMealType }: {
  lang: string; mealType: MealType; setMealType: (m: MealType) => void;
}) {
  const utils = trpc.useUtils();
  const [query, setQuery]   = useState("");
  const [grams, setGrams]   = useState(100);
  const [result, setResult] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);

  const search = trpc.nutrition.searchFood.useQuery({ query, grams }, { enabled: query.length >= 2 });
  const logMeal = trpc.nutrition.logMeal.useMutation({
    onSuccess: () => { utils.nutrition.getTodayLog.invalidate(); utils.nutrition.getToday.invalidate(); },
  });

  useEffect(() => { if (search.data) setResult(search.data); }, [search.data]);

  const handleAdd = async () => {
    if (!result?.portion) return;
    setAdding(true);
    await logMeal.mutateAsync({
      mealType, foodName: result.food?.description ?? query,
      calories: Math.round(result.portion.calories),
      proteinG: Math.round(result.portion.protein * 10) / 10,
      carbsG:   Math.round(result.portion.carbs   * 10) / 10,
      fatG:     Math.round(result.portion.fat      * 10) / 10,
      servingSize: `${grams}g`, addedByAI: false,
    });
    setAdding(false); setAdded(true);
    setTimeout(() => { setAdded(false); setQuery(""); setResult(null); }, 1500);
  };

  return (
    <div style={card()}>
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
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: "10px 14px", color: TEXT,
          fontSize: 13, fontFamily: "inherit", marginBottom: 8, outline: "none",
        }}
      />
      {result?.portion && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: SKY, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
            {result.food?.description}
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <MacroPill label={tl("calories", lang)} value={result.portion.calories} unit="kcal" color={ORANGE} colorBg={ORANGE_BG} />
            <MacroPill label={tl("protein",  lang)} value={result.portion.protein}  color={SKY}    colorBg={SKY_LIGHT} />
            <MacroPill label={tl("carbs",    lang)} value={result.portion.carbs}    color={GOLD}   colorBg={GOLD_BG} />
            <MacroPill label={tl("fat",      lang)} value={result.portion.fat}      color={PURPLE} colorBg={PURPLE_BG} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              type="number" value={grams}
              onChange={e => setGrams(parseInt(e.target.value) || 100)}
              style={{
                width: 70, background: BG, border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: "6px 8px", color: TEXT,
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <span style={{ color: MUTED, fontSize: 12 }}>g</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
              <button key={mt} onClick={() => setMealType(mt)} style={{
                padding: "5px 10px", borderRadius: 16,
                border: mealType === mt ? `1.5px solid ${SKY}` : `1px solid ${BORDER}`,
                background: mealType === mt ? SKY_LIGHT : WHITE,
                color: mealType === mt ? SKY : TEXT2,
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
              : `linear-gradient(135deg, ${SKY}, ${CYAN})`,
            color: WHITE, border: "none", borderRadius: 12,
            padding: "10px", fontSize: 13, fontWeight: 900,
            cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit",
            boxShadow: added ? "none" : `0 3px 12px ${SKY}44`,
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
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: ORANGE_BG,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, margin: "0 auto 16px",
        }}>🍽️</div>
        <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{tl("noMeals", lang)}</p>
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
    protein: "💪", hydration: "💧", calories: "🔥",
    carbs: "🌾", fat: "🥑", recovery: "🛌", sugar: "🍬", default: "💡",
  };
  const priorityStyle = (p: string) => ({
    color:  p === "high" ? RED   : p === "medium" ? GOLD   : GREEN,
    bg:     p === "high" ? RED_BG : p === "medium" ? GOLD_BG : GREEN_BG,
    border: p === "high" ? RED   : p === "medium" ? GOLD   : GREEN,
  });

  return (
    <div>
      <button
        onClick={() => generateInsights.mutate({ lang: lang as "ar" | "en" })}
        disabled={generateInsights.isPending}
        style={{
          width: "100%",
          background: generateInsights.isPending
            ? BG
            : `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
          color: generateInsights.isPending ? MUTED : WHITE,
          border: generateInsights.isPending ? `1px solid ${BORDER}` : "none",
          borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 900,
          cursor: generateInsights.isPending ? "not-allowed" : "pointer",
          fontFamily: "inherit", marginBottom: 16,
          boxShadow: generateInsights.isPending ? "none" : `0 4px 16px ${ORANGE}44`,
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
        <div style={card({ textAlign: "center", padding: "32px 16px" })}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: SKY_LIGHT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 14px",
          }}>🤖</div>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>
            {lang === "ar" ? "لا توجد تحليلات بعد" : "No insights yet"}
          </p>
          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{tl("noInsights", lang)}</p>
        </div>
      )}

      {insights?.map((insight: any, i: number) => {
        const category = insight.category ?? "default";
        const icon = insightIcons[category] ?? insightIcons.default;
        const ps = priorityStyle(insight.priority ?? "low");
        return (
          <div key={i} style={{
            background: WHITE, borderRadius: 16, padding: "16px",
            marginBottom: 10, border: `1px solid ${ps.border}22`,
            boxShadow: SHADOW,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: ps.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{
                    color: ps.color, fontSize: 10, fontWeight: 700,
                    background: ps.bg, borderRadius: 20, padding: "2px 8px",
                    textTransform: "uppercase",
                  }}>
                    {insight.priority ?? "info"}
                  </span>
                  <span style={{ color: MUTED, fontSize: 10 }}>
                    {new Date(insight.createdAt ?? Date.now()).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>
                  {lang === "ar" ? insight.titleAr ?? insight.title : insight.title}
                </p>
                <p style={{ color: TEXT2, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
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
      background: BG,
      fontFamily: lang === "ar" ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
      color: TEXT,
    }}>
      {/* Header */}
      <div style={{
        background: WHITE,
        padding: "16px 16px 0",
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: "0 1px 8px rgba(27,46,94,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>🥗</div>
          <div>
            <h1 style={{ color: NAVY, fontSize: 17, fontWeight: 900, margin: 0 }}>
              <span style={{ color: SKY }}>Prime</span> {tl("title", lang)}
            </h1>
            <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>
              {lang === "ar" ? "تتبع طعامك يومياً" : "Track your daily nutrition"}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 4px 12px",
                background: "none", border: "none",
                borderBottom: activeTab === tab.id
                  ? `2.5px solid ${SKY}`
                  : "2.5px solid transparent",
                color: activeTab === tab.id ? SKY : MUTED,
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 17 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 100px" }}>
        {activeTab === "dashboard" && <DashboardTab lang={lang} />}
        {activeTab === "scanner"   && <ScannerTab lang={lang} onSaved={() => setActiveTab("meals")} />}
        {activeTab === "meals"     && <MealsTab lang={lang} />}
        {activeTab === "insights"  && <InsightsTab lang={lang} />}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
