/**
 * Nutrition — Prime Fit
 * Design matches reference screenshots:
 *  - Light/white background (#F0F4F8 page, white cards)
 *  - Horizontal icon tab bar (Dashboard / Meals / Scanner / Insights)
 *  - Goals button top-right
 *  - Dashboard: large calorie ring + 3 stat boxes + macro bars + 3 small rings
 *    + water intake (4 cup buttons) + weekly bar chart
 *  - Scanner: camera/upload + manual search
 *  - Meals: meal history cards
 *  - Insights: AI insights
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

// ── Design tokens (matches main app light theme) ──────────────────────────────
const PAGE_BG   = "#F0F4F8";
const WHITE     = "#FFFFFF";
const NAVY      = "#1B2E5E";
const NAVY_DARK = "#0F1E3D";
const SKY       = "#7BB8D4";
const SKY_LIGHT = "#E8F4FB";
const BORDER    = "#DDE6F0";
const SHADOW    = "0 2px 12px rgba(27,46,94,0.08)";
const TEXT      = "#1B2E5E";
const TEXT2     = "#4A6080";
const MUTED     = "#8FA8C0";

// Macro accent colors
const C_PROTEIN = "#EF4444";   // red dot
const C_CARBS   = "#F59E0B";   // amber dot
const C_FAT     = "#8B5CF6";   // purple dot
const C_CAL     = "#1B2E5E";   // navy (calorie ring)
const C_GREEN   = "#22C55E";   // goal met bar
const C_WATER   = "#38BDF8";   // water blue

// ── Translations ──────────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  title:        { ar: "التغذية", en: "Nutrition" },
  dashboard:    { ar: "لوحة التحكم", en: "Dashboard" },
  meals:        { ar: "وجباتي", en: "Meals" },
  scanner:      { ar: "الماسح", en: "Scanner" },
  insights:     { ar: "تحليلات", en: "Insights" },
  goals:        { ar: "الأهداف", en: "Goals" },
  dailyCal:     { ar: "السعرات اليومية", en: "Daily Calories" },
  macros:       { ar: "الماكرو", en: "Macronutrients" },
  waterIntake:  { ar: "استهلاك الماء", en: "Water Intake" },
  weeklyTrend:  { ar: "الاتجاه الأسبوعي", en: "Weekly Trend" },
  remaining:    { ar: "متبقي", en: "Remaining" },
  consumed:     { ar: "مستهلك", en: "Consumed" },
  goal:         { ar: "الهدف", en: "Goal" },
  protein:      { ar: "بروتين", en: "Protein" },
  carbs:        { ar: "كربوهيدرات", en: "Carbs" },
  fat:          { ar: "دهون", en: "Fat" },
  calories:     { ar: "سعرات", en: "Calories" },
  kcal:         { ar: "سعرة", en: "kcal" },
  of:           { ar: "من", en: "of" },
  goalMet:      { ar: "الهدف محقق", en: "Goal met" },
  belowGoal:    { ar: "أقل من الهدف", en: "Below goal" },
  scan:         { ar: "مسح بالكاميرا", en: "Scan Food" },
  upload:       { ar: "رفع صورة", en: "Upload Photo" },
  analyzing:    { ar: "جاري التحليل...", en: "Analyzing..." },
  noFood:       { ar: "لم يتم التعرف على طعام. حاول صورة أوضح.", en: "No food detected. Try a clearer image." },
  tryAgain:     { ar: "حاول مجدداً", en: "Try Again" },
  addToDiary:   { ar: "أضف للسجل", en: "Add to Diary" },
  saving:       { ar: "جاري الحفظ...", en: "Saving..." },
  saved:        { ar: "✅ تم الحفظ!", en: "✅ Saved!" },
  edit:         { ar: "تعديل", en: "Edit" },
  delete:       { ar: "حذف", en: "Delete" },
  noMeals:      { ar: "لا توجد وجبات بعد", en: "No meals logged yet" },
  breakfast:    { ar: "فطور", en: "Breakfast" },
  lunch:        { ar: "غداء", en: "Lunch" },
  dinner:       { ar: "عشاء", en: "Dinner" },
  snack:        { ar: "وجبة خفيفة", en: "Snack" },
  mealType:     { ar: "نوع الوجبة", en: "Meal Type" },
  total:        { ar: "الإجمالي", en: "Total" },
  searchFood:   { ar: "ابحث عن طعام...", en: "Search food..." },
  addFood:      { ar: "إضافة", en: "Add" },
  barcodeHint:  { ar: "دعم الباركود — قريباً!", en: "Barcode support — coming soon!" },
  generateInsights: { ar: "توليد تحليلات AI", en: "Generate AI Insights" },
  generating:   { ar: "جاري التوليد...", en: "Generating..." },
  noInsights:   { ar: "اضغط لتوليد تحليلات مخصصة", en: "Tap to generate personalized insights" },
  saveGoals:    { ar: "حفظ الأهداف", en: "Save Goals" },
  savingGoals:  { ar: "جاري الحفظ...", en: "Saving..." },
  savedGoals:   { ar: "✅ تم الحفظ!", en: "✅ Saved!" },
  ml:           { ar: "مل", en: "ml" },
};
const tl = (k: string, lang: string) => T[k]?.[lang] ?? T[k]?.en ?? k;

const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

// ── Shared card ───────────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: WHITE, borderRadius: 20,
  border: `1px solid ${BORDER}`, boxShadow: SHADOW,
  padding: "18px 16px", marginBottom: 14,
  ...extra,
});

// ── Large calorie ring ────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, lang }: { consumed: number; goal: number; lang: string }) {
  const size = 180;
  const r = 74;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const dash = circ * (1 - pct);
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 4 }}>
        <span style={{ color: TEXT, fontSize: 16, fontWeight: 900 }}>🔥 {tl("dailyCal", lang)}</span>
      </div>

      {/* Ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8EDF4" strokeWidth={12} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={NAVY} strokeWidth={12}
              strokeDasharray={circ} strokeDashoffset={dash}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          </svg>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", textAlign: "center",
          }}>
            <div style={{ color: TEXT, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
              {Math.round(consumed)}
            </div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>/ {goal}</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{tl("kcal", lang)}</div>
        <div style={{ color: MUTED, fontSize: 12 }}>{tl("of", lang)} {goal}</div>
      </div>

      {/* 3 stat boxes */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          flex: 1, background: "#F0FDF4", borderRadius: 14, padding: "12px 8px", textAlign: "center",
          border: "1px solid #BBF7D0",
        }}>
          <div style={{ color: C_GREEN, fontSize: 20, fontWeight: 900 }}>{Math.round(remaining)}</div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{tl("kcal", lang)}</div>
          <div style={{ color: TEXT2, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{tl("remaining", lang)}</div>
        </div>
        <div style={{
          flex: 1, background: PAGE_BG, borderRadius: 14, padding: "12px 8px", textAlign: "center",
          border: `1px solid ${BORDER}`,
        }}>
          <div style={{ color: TEXT, fontSize: 20, fontWeight: 900 }}>{Math.round(consumed)}</div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{tl("kcal", lang)}</div>
          <div style={{ color: TEXT2, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{tl("consumed", lang)}</div>
        </div>
        <div style={{
          flex: 1, background: SKY_LIGHT, borderRadius: 14, padding: "12px 8px", textAlign: "center",
          border: `1px solid ${SKY}44`,
        }}>
          <div style={{ color: SKY, fontSize: 20, fontWeight: 900 }}>{goal}</div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{tl("kcal", lang)}</div>
          <div style={{ color: TEXT2, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{tl("goal", lang)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Small macro ring ──────────────────────────────────────────────────────────
function SmallRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const size = 90;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const dash = circ * (1 - pct);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8EDF4" strokeWidth={7} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={circ} strokeDashoffset={dash}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        {/* colored dot at top */}
        <div style={{
          position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)",
          width: 8, height: 8, borderRadius: "50%", background: color,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center",
        }}>
          <div style={{ color: TEXT, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>
            {Math.round(value)}
          </div>
          <div style={{ color: MUTED, fontSize: 9, marginTop: 1 }}>/ {max}</div>
        </div>
      </div>
      <div style={{ color: TEXT, fontSize: 12, fontWeight: 700, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── Macro progress bar ────────────────────────────────────────────────────────
function MacroBar({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{label}</span>
        <span style={{ color: MUTED, fontSize: 13 }}>
          {Math.round(value)}{unit} / {max}{unit}
        </span>
      </div>
      <div style={{ background: "#E8EDF4", borderRadius: 6, height: 7, overflow: "hidden" }}>
        <div style={{
          width: `${pct * 100}%`, height: "100%",
          background: color, borderRadius: 6,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ── Water intake ──────────────────────────────────────────────────────────────
function WaterCard({ lang, totalMl, goalMl, onAdd }: {
  lang: string; totalMl: number; goalMl: number; onAdd: (ml: number) => void;
}) {
  const pct = Math.min(totalMl / Math.max(goalMl, 1), 1);
  const cups = [
    { label: lang === "ar" ? "كوب صغير" : "Small Cup", ml: 150, icon: "💧" },
    { label: lang === "ar" ? "كوب"       : "Cup",       ml: 250, icon: "💧" },
    { label: lang === "ar" ? "علبة"      : "Can",       ml: 330, icon: "💧" },
    { label: lang === "ar" ? "زجاجة"    : "Bottle",    ml: 500, icon: "💧" },
  ];
  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: TEXT, fontSize: 16, fontWeight: 900 }}>💧 {tl("waterIntake", lang)}</span>
        <span style={{ color: C_WATER, fontSize: 13, fontWeight: 700 }}>
          {totalMl}{tl("ml", lang)} / {goalMl}{tl("ml", lang)}
        </span>
      </div>
      <div style={{ background: "#E8EDF4", borderRadius: 8, height: 8, marginBottom: 16, overflow: "hidden" }}>
        <div style={{
          width: `${pct * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${C_WATER}, #0EA5E9)`,
          borderRadius: 8, transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {cups.map(c => (
          <button key={c.ml} onClick={() => onAdd(c.ml)} style={{
            flex: 1, background: SKY_LIGHT, border: `1px solid ${C_WATER}33`,
            borderRadius: 14, padding: "12px 4px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <span style={{ color: TEXT, fontSize: 11, fontWeight: 700 }}>{c.label}</span>
            <span style={{ color: C_WATER, fontSize: 10 }}>{c.ml}{tl("ml", lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyChart({ trend, lang, goalCalories }: { trend: any[]; lang: string; goalCalories: number }) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number } | null>(null);
  const maxCal = Math.max(...trend.map(d => d.calories), goalCalories, 1);

  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <span style={{ color: TEXT, fontSize: 16, fontWeight: 900 }}>📈 {tl("weeklyTrend", lang)}</span>
      </div>

      {/* Chart area */}
      <div style={{ position: "relative" }}>
        {/* Y-axis labels */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, paddingLeft: 28 }}>
          {/* Y labels */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 20,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            {[4, 3, 2, 1, 0].map(v => (
              <span key={v} style={{ color: MUTED, fontSize: 9 }}>{v}</span>
            ))}
          </div>

          {/* Bars */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
            {trend.map((d, i) => {
              const h = Math.round((d.calories / maxCal) * 110);
              const metGoal = d.calories >= goalCalories;
              const isToday = i === trend.length - 1;
              return (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}
                  onMouseEnter={() => setTooltip({ idx: i, x: i })}
                  onMouseLeave={() => setTooltip(null)}
                  onTouchStart={() => setTooltip({ idx: i, x: i })}
                >
                  {tooltip?.idx === i && (
                    <div style={{
                      position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
                      padding: "6px 10px", zIndex: 10, whiteSpace: "nowrap",
                      boxShadow: SHADOW, marginBottom: 4,
                    }}>
                      <div style={{ color: TEXT, fontSize: 11, fontWeight: 700 }}>{d.dayLabel}</div>
                      <div style={{ color: TEXT2, fontSize: 10 }}>
                        {lang === "ar" ? "السعرات" : "Calories"} : {Math.round(d.calories)} kcal
                      </div>
                    </div>
                  )}
                  <div style={{
                    width: "100%", height: Math.max(h, 4),
                    background: metGoal ? C_GREEN : (isToday ? "#CBD5E1" : "#CBD5E1"),
                    borderRadius: "5px 5px 0 0",
                    transition: "height 0.4s ease",
                    opacity: isToday ? 1 : 0.7,
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{ display: "flex", paddingLeft: 28, marginTop: 4, gap: 4 }}>
          {trend.map(d => (
            <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ color: MUTED, fontSize: 9 }}>{d.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: C_GREEN }} />
          <span style={{ color: TEXT2, fontSize: 11 }}>{tl("goalMet", lang)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#CBD5E1" }} />
          <span style={{ color: TEXT2, fontSize: 11 }}>{tl("belowGoal", lang)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Goals Modal ───────────────────────────────────────────────────────────────
function GoalsModal({ lang, goals, onClose }: { lang: string; goals: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  // String state so users can freely clear and retype on mobile
  const [cal,   setCal]   = useState(String(goals?.calories ?? 2000));
  const [prot,  setProt]  = useState(String(goals?.proteinG ?? 150));
  const [carbs, setCarbs] = useState(String(goals?.carbsG   ?? 200));
  const [fat,   setFat]   = useState(String(goals?.fatG     ?? 65));
  const [water, setWater] = useState(String(goals?.waterMl  ?? 2500));
  const [status, setStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const setGoalsMutation = trpc.nutrition.setGoals.useMutation({
    onSuccess: () => {
      utils.nutrition.getTodayLog.invalidate();
      utils.nutrition.getGoals.invalidate();
    },
  });

  const handleSave = async () => {
    // Clamp to valid ranges
    const calNum   = Math.max(500,  Math.min(10000, parseInt(cal,   10) || 2000));
    const protNum  = Math.max(0,    Math.min(500,   parseInt(prot,  10) || 150));
    const carbsNum = Math.max(0,    Math.min(1000,  parseInt(carbs, 10) || 200));
    const fatNum   = Math.max(0,    Math.min(300,   parseInt(fat,   10) || 65));
    const waterNum = Math.max(500,  Math.min(10000, parseInt(water, 10) || 2500));
    setStatus("saving");
    setErrMsg("");
    try {
      await setGoalsMutation.mutateAsync({ calories: calNum, proteinG: protNum, carbsG: carbsNum, fatG: fatNum, waterMl: waterNum });
      setStatus("saved");
      setTimeout(() => { setStatus("idle"); onClose(); }, 1200);
    } catch (err: any) {
      setStatus("error");
      setErrMsg(lang === "ar" ? "حدث خطأ، حاول مجدداً" : "Error saving. Please try again.");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const Field = ({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ color: MUTED, fontSize: 12 }}>{unit}</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={e => {
          const v = e.target.value;
          // Allow empty string or digits only
          if (v === "" || /^\d+$/.test(v)) onChange(v);
        }}
        onFocus={e => e.target.select()}
        style={{
          width: "100%", boxSizing: "border-box",
          background: PAGE_BG, border: `1.5px solid ${BORDER}`,
          borderRadius: 12, padding: "12px 14px", color: TEXT,
          fontSize: 16, fontWeight: 700, fontFamily: "inherit", outline: "none",
          WebkitAppearance: "none" as any,
        }}
      />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,30,61,0.55)",
      zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: WHITE, borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480, padding: "24px 20px 36px",
          boxShadow: "0 -8px 40px rgba(27,46,94,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: 0 }}>
            🎯 {tl("goals", lang)}
          </h2>
          <button onClick={onClose} style={{
            background: PAGE_BG, border: "none", borderRadius: "50%",
            width: 32, height: 32, fontSize: 16, cursor: "pointer", color: TEXT2,
          }}>✕</button>
        </div>

        <Field label={lang === "ar" ? "السعرات اليومية" : "Daily Calories"} value={cal}   onChange={setCal}   unit="kcal" />
        <Field label={lang === "ar" ? "البروتين"         : "Protein"}        value={prot}  onChange={setProt}  unit="g" />
        <Field label={lang === "ar" ? "الكربوهيدرات"    : "Carbs"}           value={carbs} onChange={setCarbs} unit="g" />
        <Field label={lang === "ar" ? "الدهون"           : "Fat"}             value={fat}   onChange={setFat}   unit="g" />
        <Field label={lang === "ar" ? "الماء"            : "Water"}           value={water} onChange={setWater} unit="ml" />

        {errMsg ? (
          <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{errMsg}</div>
        ) : null}

        <button onClick={handleSave} disabled={status === "saving" || status === "saved"} style={{
          width: "100%",
          background: status === "saved"
            ? `linear-gradient(135deg, #22C55E, #16A34A)`
            : status === "error"
            ? `linear-gradient(135deg, #EF4444, #DC2626)`
            : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
          color: WHITE, border: "none", borderRadius: 14,
          padding: "14px", fontSize: 15, fontWeight: 900,
          cursor: (status === "saving" || status === "saved") ? "not-allowed" : "pointer",
          fontFamily: "inherit", marginTop: 4,
          opacity: status === "saving" ? 0.7 : 1,
        }}>
          {status === "saved" ? tl("savedGoals", lang) : status === "saving" ? tl("savingGoals", lang) : tl("saveGoals", lang)}
        </button>
      </div>
    </div>
  );
}

// ── Exceed Warning Banner ────────────────────────────────────────────────────
function ExceedWarning({ lang, exceeded, onOpenGoals }: {
  lang: string;
  exceeded: { calories: boolean; protein: boolean; carbs: boolean; fat: boolean };
  onOpenGoals: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const items: string[] = [];
  if (exceeded.calories) items.push(lang === "ar" ? "السعرات" : "Calories");
  if (exceeded.protein)  items.push(lang === "ar" ? "البروتين" : "Protein");
  if (exceeded.carbs)    items.push(lang === "ar" ? "الكربوهيدرات" : "Carbs");
  if (exceeded.fat)      items.push(lang === "ar" ? "الدهون" : "Fat");
  if (items.length === 0) return null;

  const advice = lang === "ar"
    ? `⚠️ تجاوزت الهدف اليومي في: ${items.join("، ")}. حاول تقليل الوجبات الدسمة وزيادة شرب الماء. تذكر أن الاتساق أهم من الكمال!`
    : `⚠️ You exceeded your daily goal for: ${items.join(", ")}. Try reducing heavy meals and drink more water. Remember: consistency matters more than perfection!`;

  return (
    <div style={{
      background: "#FEF2F2", border: "1.5px solid #FECACA",
      borderRadius: 16, padding: "14px 16px", marginBottom: 14,
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🚨</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 800, margin: "0 0 6px" }}>
          {lang === "ar" ? "تجاوزت الهدف اليومي!" : "Daily Target Exceeded!"}
        </p>
        <p style={{ color: "#7F1D1D", fontSize: 12, margin: "0 0 10px", lineHeight: 1.6 }}>{advice}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onOpenGoals} style={{
            background: "#DC2626", color: "white", border: "none",
            borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {lang === "ar" ? "تعديل الأهداف" : "Adjust Goals"}
          </button>
          <button onClick={() => setDismissed(true)} style={{
            background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA",
            borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {lang === "ar" ? "إغلاق" : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ lang, onOpenGoals }: { lang: string; onOpenGoals: () => void }) {
  const utils = trpc.useUtils();
  const { data: todayLog, isLoading } = trpc.nutrition.getTodayLog.useQuery(
    { date: undefined },
    { refetchOnWindowFocus: true, staleTime: 0 }
  );
  const { data: weeklyData } = trpc.nutrition.getWeeklyTrends.useQuery();
  const logWater = trpc.nutrition.logWater.useMutation({
    onSuccess: () => utils.nutrition.getTodayLog.invalidate(),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: 32, animation: "spin 1s linear infinite" }}>⏳</div>
      </div>
    );
  }

  const goals   = todayLog?.goals;
  const totals  = todayLog?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const totalWaterMl = todayLog?.totalWaterMl ?? 0;

  const calGoal   = goals?.calories ?? 2000;
  const protGoal  = goals?.proteinG ?? 150;
  const carbGoal  = goals?.carbsG   ?? 200;
  const fatGoal   = goals?.fatG     ?? 65;
  const waterGoal = goals?.waterMl  ?? 2500;

  const exceeded = {
    calories: totals.calories > calGoal,
    protein:  totals.proteinG > protGoal,
    carbs:    totals.carbsG   > carbGoal,
    fat:      totals.fatG     > fatGoal,
  };
  const anyExceeded = exceeded.calories || exceeded.protein || exceeded.carbs || exceeded.fat;

  return (
    <div>
      {/* Exceed warning */}
      {anyExceeded && <ExceedWarning lang={lang} exceeded={exceeded} onOpenGoals={onOpenGoals} />}

      {/* Calorie ring card */}
      <CalorieRing consumed={totals.calories} goal={calGoal} lang={lang} />

      {/* Macronutrients card */}
      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <span style={{ color: TEXT, fontSize: 16, fontWeight: 900 }}>🥩 {tl("macros", lang)}</span>
        </div>

        {/* Progress bars */}
        <MacroBar label={tl("protein", lang)} value={totals.proteinG} max={protGoal} unit="g" color={C_PROTEIN} />
        <MacroBar label={tl("carbs",   lang)} value={totals.carbsG}   max={carbGoal} unit="g" color={C_CARBS} />
        <MacroBar label={tl("fat",     lang)} value={totals.fatG}     max={fatGoal}  unit="g" color={C_FAT} />

        {/* 3 small rings */}
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
          <SmallRing value={totals.proteinG} max={protGoal} color={C_PROTEIN} label={tl("protein", lang)} />
          <SmallRing value={totals.carbsG}   max={carbGoal} color={C_CARBS}   label={tl("carbs",   lang)} />
          <SmallRing value={totals.fatG}     max={fatGoal}  color={C_FAT}     label={tl("fat",     lang)} />
        </div>
      </div>

      {/* Water intake */}
      <WaterCard
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
          goalCalories={weeklyData.goals?.calories ?? calGoal}
        />
      )}
    </div>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────
function MealCard({ meal, lang, onDelete }: { meal: any; lang: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.logged_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(meal.logged_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });

  return (
    <div style={{
      background: WHITE, borderRadius: 16, marginBottom: 10,
      border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: "hidden",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "14px 16px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "#FFF7ED",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            {MEAL_ICONS[meal.meal_type] ?? "🍽️"}
          </div>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>
              {lang === "ar"
                ? meal.items?.[0]?.name_ar || meal.items?.[0]?.name || tl(meal.meal_type, lang)
                : meal.items?.[0]?.name || tl(meal.meal_type, lang)}
              {meal.items?.length > 1 ? ` +${meal.items.length - 1}` : ""}
            </p>
            <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>{date} · {time}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            color: "#F97316", fontSize: 13, fontWeight: 800,
            background: "#FFF7ED", borderRadius: 20, padding: "3px 10px",
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
            {[
              { l: tl("protein", lang), v: meal.total_protein, c: C_PROTEIN, bg: "#FEF2F2" },
              { l: tl("carbs",   lang), v: meal.total_carbs,   c: C_CARBS,   bg: "#FFFBEB" },
              { l: tl("fat",     lang), v: meal.total_fat,     c: C_FAT,     bg: "#F5F3FF" },
            ].map(m => (
              <div key={m.l} style={{
                background: m.bg, border: `1px solid ${m.c}22`,
                borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
              }}>
                <div style={{ color: m.c, fontSize: 13, fontWeight: 800 }}>{Math.round(m.v)}g</div>
                <div style={{ color: MUTED, fontSize: 9 }}>{m.l}</div>
              </div>
            ))}
          </div>
          {meal.items?.map((item: any, i: number) => (
            <div key={i} style={{
              background: PAGE_BG, borderRadius: 10, padding: "8px 12px", marginBottom: 6,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              border: `1px solid ${BORDER}`,
            }}>
              <span style={{ color: TEXT2, fontSize: 12 }}>
                {lang === "ar" ? item.name_ar || item.name : item.name}
              </span>
              <span style={{ color: "#F97316", fontSize: 12, fontWeight: 700 }}>
                {Math.round(item.calories)} kcal
              </span>
            </div>
          ))}
          {meal.insight_ar && (
            <div style={{
              background: SKY_LIGHT, border: `1px solid ${SKY}33`,
              borderRadius: 10, padding: "10px 12px", marginTop: 10,
            }}>
              <p style={{ color: NAVY, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                💡 {lang === "ar" ? meal.insight_ar : meal.insight_en}
              </p>
            </div>
          )}
          <button onClick={onDelete} style={{
            marginTop: 10, background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#EF4444", borderRadius: 8, padding: "6px 14px", fontSize: 11,
            cursor: "pointer", fontFamily: "inherit",
          }}>🗑️ {tl("delete", lang)}</button>
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

  if (isLoading) return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 32, animation: "spin 1s linear infinite" }}>⏳</div>
    </div>
  );

  if (!history?.length) return (
    <div style={{ textAlign: "center", padding: "56px 0" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", background: "#FFF7ED",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, margin: "0 auto 16px",
      }}>🍽️</div>
      <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{tl("noMeals", lang)}</p>
      <p style={{ color: MUTED, fontSize: 12 }}>
        {lang === "ar" ? "استخدم الماسح لإضافة وجباتك" : "Use the scanner to add your meals"}
      </p>
    </div>
  );

  return (
    <div>
      {history.map((meal: any) => (
        <MealCard key={meal.id} meal={meal} lang={lang}
          onDelete={() => deleteMeal.mutate({ mealId: meal.id })} />
      ))}
    </div>
  );
}

// ── Scanner Tab ───────────────────────────────────────────────────────────────
type ScanStatus = "idle" | "analyzing" | "ready";
type SaveStatus = "idle" | "saving" | "saved";
type MealType   = "breakfast" | "lunch" | "dinner" | "snack";

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
      const dataUrl = e.target?.result as string;
      const base64  = dataUrl.split(",")[1];
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
        mealType, imageUrl: analysis?.imageUrl, notes,
        insightAr: analysis?.insightAr ?? "", insightEn: analysis?.insightEn ?? "",
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
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <button onClick={() => cameraInputRef.current?.click()} style={{
              flex: 1, background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
              border: "none", borderRadius: 18, padding: "22px 12px",
              color: WHITE, fontWeight: 900, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: `0 4px 16px ${NAVY}44`,
            }}>
              <span style={{ fontSize: 34 }}>📷</span>
              {tl("scan", lang)}
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{
              flex: 1, background: WHITE, border: `1.5px solid ${BORDER}`,
              borderRadius: 18, padding: "22px 12px",
              color: TEXT, fontWeight: 900, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: SHADOW,
            }}>
              <span style={{ fontSize: 34 }}>🖼️</span>
              {tl("upload", lang)}
            </button>
          </div>

          <div style={{
            background: "#FFFBEB", border: `1.5px dashed #F59E0B66`,
            borderRadius: 14, padding: "12px 16px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 700 }}>
              {tl("barcodeHint", lang)}
            </span>
          </div>

          <ManualSearch lang={lang} mealType={mealType} setMealType={setMealType} />
        </>
      )}

      {status === "analyzing" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          {previewUrl && (
            <img src={previewUrl} alt="food" style={{
              width: "100%", maxHeight: 200, objectFit: "cover",
              borderRadius: 16, marginBottom: 16, opacity: 0.85,
            }} />
          )}
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite" }}>🔍</div>
          <p style={{ color: NAVY, fontSize: 14, fontWeight: 700 }}>{tl("analyzing", lang)}</p>
          <p style={{ color: MUTED, fontSize: 11 }}>
            {lang === "ar" ? "يتم تحليل الطعام بالذكاء الاصطناعي..." : "AI is identifying food items..."}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14,
          padding: "14px 16px", marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ color: "#EF4444", fontSize: 13, margin: "0 0 10px" }}>{error}</p>
          <button onClick={() => { setError(""); setPreviewUrl(null); }} style={{
            background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", borderRadius: 8,
            padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{tl("tryAgain", lang)}</button>
        </div>
      )}

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
              <p style={{ color: NAVY, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                💡 {lang === "ar" ? analysis.insightAr : analysis.insightEn}
              </p>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <p style={{ color: TEXT2, fontSize: 11, fontWeight: 700, margin: "0 0 8px" }}>
              {tl("mealType", lang)}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["breakfast","lunch","dinner","snack"] as const).map(mt => (
                <button key={mt} onClick={() => setMealType(mt)} style={{
                  padding: "7px 14px", borderRadius: 20,
                  border: mealType === mt ? `1.5px solid ${NAVY}` : `1px solid ${BORDER}`,
                  background: mealType === mt ? NAVY : WHITE,
                  color: mealType === mt ? WHITE : TEXT2,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {MEAL_ICONS[mt]} {tl(mt, lang)}
                </button>
              ))}
            </div>
          </div>

          {editItems.map((item, idx) => (
            <div key={idx} style={{
              background: WHITE, borderRadius: 12, padding: "12px 14px",
              marginBottom: 8, border: `1px solid ${BORDER}`, boxShadow: SHADOW,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>
                  {lang === "ar" && item.nameAr ? item.nameAr : item.name}
                </span>
                <button onClick={() => removeItem(idx)} style={{
                  background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444",
                  borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer",
                }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { k: "calories", label: tl("calories", lang), unit: "kcal", color: "#F97316", bg: "#FFF7ED" },
                  { k: "protein",  label: tl("protein",  lang), unit: "g",    color: C_PROTEIN, bg: "#FEF2F2" },
                  { k: "carbs",    label: tl("carbs",    lang), unit: "g",    color: C_CARBS,   bg: "#FFFBEB" },
                  { k: "fat",      label: tl("fat",      lang), unit: "g",    color: C_FAT,     bg: "#F5F3FF" },
                ].map(m => (
                  <div key={m.k} style={{
                    background: m.bg, border: `1px solid ${m.color}22`,
                    borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
                  }}>
                    <div style={{ color: m.color, fontSize: 13, fontWeight: 800 }}>
                      {Math.round(item[m.k] ?? 0)}
                    </div>
                    <div style={{ color: MUTED, fontSize: 9 }}>{m.unit}</div>
                    <div style={{ color: MUTED, fontSize: 9 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{
            background: PAGE_BG, borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            border: `1px solid ${BORDER}`,
          }}>
            <p style={{ color: TEXT2, fontSize: 11, margin: "0 0 10px", fontWeight: 700 }}>
              {tl("total", lang)}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {[
                { l: tl("calories", lang), v: totals.calories, u: "kcal", c: "#F97316", bg: "#FFF7ED" },
                { l: tl("protein",  lang), v: totals.protein,  u: "g",    c: C_PROTEIN, bg: "#FEF2F2" },
                { l: tl("carbs",    lang), v: totals.carbs,    u: "g",    c: C_CARBS,   bg: "#FFFBEB" },
                { l: tl("fat",      lang), v: totals.fat,      u: "g",    c: C_FAT,     bg: "#F5F3FF" },
              ].map(m => (
                <div key={m.l} style={{
                  background: m.bg, border: `1px solid ${m.c}22`,
                  borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
                }}>
                  <div style={{ color: m.c, fontSize: 13, fontWeight: 800 }}>{Math.round(m.v)}</div>
                  <div style={{ color: MUTED, fontSize: 9 }}>{m.u}</div>
                  <div style={{ color: MUTED, fontSize: 9 }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <textarea
            placeholder={lang === "ar" ? "ملاحظات اختيارية..." : "Optional notes..."}
            value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{
              width: "100%", boxSizing: "border-box",
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "10px 14px", color: TEXT,
              fontSize: 12, fontFamily: "inherit", marginBottom: 14,
              resize: "none", outline: "none",
            }}
          />

          <button onClick={handleSave} disabled={saveStatus !== "idle"} style={{
            width: "100%",
            background: saveStatus === "saved"
              ? `linear-gradient(135deg, #22C55E, #16A34A)`
              : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            color: WHITE, border: "none", borderRadius: 14,
            padding: "14px", fontSize: 15, fontWeight: 900,
            cursor: saveStatus !== "idle" ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: saveStatus === "saving" ? 0.7 : 1,
            boxShadow: `0 4px 16px ${NAVY}44`,
          }}>
            {saveStatus === "saved" ? tl("saved", lang)
              : saveStatus === "saving" ? tl("saving", lang)
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
        type="text" placeholder={tl("searchFood", lang)} value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: PAGE_BG, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: "10px 14px", color: TEXT,
          fontSize: 13, fontFamily: "inherit", marginBottom: 8, outline: "none",
        }}
      />
      {result?.portion && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: NAVY, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
            {result.food?.description}
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[
              { l: tl("calories", lang), v: result.portion.calories, u: "kcal", c: "#F97316", bg: "#FFF7ED" },
              { l: tl("protein",  lang), v: result.portion.protein,  u: "g",    c: C_PROTEIN, bg: "#FEF2F2" },
              { l: tl("carbs",    lang), v: result.portion.carbs,    u: "g",    c: C_CARBS,   bg: "#FFFBEB" },
              { l: tl("fat",      lang), v: result.portion.fat,      u: "g",    c: C_FAT,     bg: "#F5F3FF" },
            ].map(m => (
              <div key={m.l} style={{
                background: m.bg, border: `1px solid ${m.c}22`,
                borderRadius: 10, padding: "6px 10px", textAlign: "center", minWidth: 60,
              }}>
                <div style={{ color: m.c, fontSize: 13, fontWeight: 800 }}>{Math.round(m.v)}</div>
                <div style={{ color: MUTED, fontSize: 9 }}>{m.u}</div>
                <div style={{ color: MUTED, fontSize: 9 }}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              type="number" value={grams}
              onChange={e => setGrams(parseInt(e.target.value) || 100)}
              style={{
                width: 70, background: PAGE_BG, border: `1px solid ${BORDER}`,
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
                border: mealType === mt ? `1.5px solid ${NAVY}` : `1px solid ${BORDER}`,
                background: mealType === mt ? NAVY : WHITE,
                color: mealType === mt ? WHITE : TEXT2,
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {MEAL_ICONS[mt]} {tl(mt, lang)}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} disabled={adding || added} style={{
            width: "100%",
            background: added
              ? `linear-gradient(135deg, #22C55E, #16A34A)`
              : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
            color: WHITE, border: "none", borderRadius: 12,
            padding: "10px", fontSize: 13, fontWeight: 900,
            cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {added ? "✅ " + tl("saved", lang) : adding ? tl("saving", lang) : `+ ${tl("addFood", lang)}`}
          </button>
        </div>
      )}
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
    macros: "🥗", recovery: "🛌", general: "💡", default: "💡",
  };

  return (
    <div>
      <button
        onClick={() => generateInsights.mutate({ lang: lang as "ar" | "en" })}
        disabled={generateInsights.isPending}
        style={{
          width: "100%",
          background: generateInsights.isPending
            ? PAGE_BG
            : `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
          color: generateInsights.isPending ? MUTED : WHITE,
          border: generateInsights.isPending ? `1px solid ${BORDER}` : "none",
          borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 900,
          cursor: generateInsights.isPending ? "not-allowed" : "pointer",
          fontFamily: "inherit", marginBottom: 16,
          boxShadow: generateInsights.isPending ? "none" : `0 4px 16px ${NAVY}44`,
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
        const pColor = insight.priority === "high" ? "#EF4444" : insight.priority === "medium" ? "#F59E0B" : "#22C55E";
        const pBg    = insight.priority === "high" ? "#FEF2F2" : insight.priority === "medium" ? "#FFFBEB" : "#F0FDF4";
        return (
          <div key={i} style={{
            background: WHITE, borderRadius: 16, padding: "16px",
            marginBottom: 10, border: `1px solid ${pColor}22`, boxShadow: SHADOW,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: pBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{
                    color: pColor, fontSize: 10, fontWeight: 700,
                    background: pBg, borderRadius: 20, padding: "2px 8px",
                    textTransform: "uppercase",
                  }}>
                    {insight.priority ?? "info"}
                  </span>
                  <span style={{ color: MUTED, fontSize: 10 }}>
                    {new Date(insight.createdAt ?? Date.now()).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>
                  {insight.type ? (insightIcons[insight.type] ?? insightIcons.default) + " " : ""}
                  {lang === "ar" ? insight.contentAr ?? insight.content : insight.content}
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
type NutritionTab = "dashboard" | "meals" | "scanner" | "insights";

export default function Nutrition() {
  const { lang, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<NutritionTab>("dashboard");
  const [showGoals, setShowGoals] = useState(false);
  const { data: goals } = trpc.nutrition.getGoals.useQuery();

  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-KW" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const tabs: { id: NutritionTab; icon: string; label: string }[] = [
    { id: "dashboard", icon: "📊", label: tl("dashboard", lang) },
    { id: "meals",     icon: "🍽️", label: tl("meals",     lang) },
    { id: "scanner",   icon: "📷", label: tl("scanner",   lang) },
    { id: "insights",  icon: "🤖", label: tl("insights",  lang) },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      minHeight: "100vh",
      background: PAGE_BG,
      fontFamily: lang === "ar" ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
      color: TEXT,
    }}>
      {/* Page header */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 900, margin: 0 }}>
              🥗 {tl("title", lang)}
            </h1>
            <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>{today}</p>
          </div>
          <button
            onClick={() => setShowGoals(true)}
            style={{
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "8px 16px",
              display: "flex", alignItems: "center", gap: 6,
              color: TEXT, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: SHADOW,
            }}
          >
            🎯 {tl("goals", lang)}
          </button>
        </div>

        {/* Tab bar — icon style */}
        <div style={{
          background: WHITE, borderRadius: 16, padding: "6px",
          display: "flex", gap: 4, marginBottom: 16,
          border: `1px solid ${BORDER}`, boxShadow: SHADOW,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 4px",
                background: activeTab === tab.id ? NAVY : "transparent",
                border: "none", borderRadius: 12,
                color: activeTab === tab.id ? WHITE : MUTED,
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 100px" }}>
        {activeTab === "dashboard" && <DashboardTab lang={lang} onOpenGoals={() => setShowGoals(true)} />}
        {activeTab === "meals"     && <MealsTab lang={lang} />}
        {activeTab === "scanner"   && <ScannerTab lang={lang} onSaved={() => setActiveTab("meals")} />}
        {activeTab === "insights"  && <InsightsTab lang={lang} />}
      </div>

      {/* Goals modal */}
      {showGoals && (
        <GoalsModal lang={lang} goals={goals} onClose={() => setShowGoals(false)} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
