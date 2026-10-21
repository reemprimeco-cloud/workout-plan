// ExerciseLibrary.tsx
// Design: Prime Fit — Navy/Sky Blue palette, Arabic RTL support
// Shows gender-specific exercises with YouTube links, grouped by category

import { AppIcons } from "./AppIcons";
import { LowerBodyIcon, UpperBodyIcon, CoreIcon, CardioIcon, FullBodyIcon } from "./ColorIcons";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getProgramByGender, getExercisesByCategory, type Exercise, type GenderProgram } from "@/lib/exerciseData";
import { cardioTemplates, type CardioTemplate } from "@/data/exercises";
import { useCMS } from "@/contexts/CMSContext";

// ── Heart Icon SVG (vector outline / filled) ─────────────────
function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#506A88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

interface ExerciseLibraryProps {
  gender: "male" | "female";
  language: "ar" | "en";
}

const CATEGORY_ICONS: Record<string, string> = {
  Chest: "chest",
  Back: "back",
  Shoulders: "shoulders",
  Arms: "arms",
  Core: "core",
  Glutes: "glutes",
  Legs: "legs",
  Cardio: "cardio",
};

const REST_COLOR = (_seconds: number) => "#3D5A80";

export function ExerciseLibrary({ gender, language }: ExerciseLibraryProps) {
  const isAr = language === "ar";
  const program: GenderProgram = getProgramByGender(gender);
  const grouped = getExercisesByCategory(gender);
  const categories = Object.keys(grouped);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || "");
  const [showCardioSection, setShowCardioSection] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showGoalAlert, setShowGoalAlert] = useState(true);
  const [showTipsAlert, setShowTipsAlert] = useState(false);

  // ── CMS exercise overrides (admin-uploaded images + text overrides) ──
  const { exerciseOverrides: cmsExerciseOverrides } = useCMS();

  // ── Favorites state (DB-backed via tRPC) ──
  const { data: favIds = [], refetch: refetchFavs } = trpc.exerciseFavorites.getFavorites.useQuery();
  const addFav = trpc.exerciseFavorites.addFavorite.useMutation({ onSuccess: () => refetchFavs() });
  const removeFav = trpc.exerciseFavorites.removeFavorite.useMutation({ onSuccess: () => refetchFavs() });

  const isFav = (id: string) => favIds.includes(id);
  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isFav(id)) removeFav.mutate({ exerciseId: id });
    else addFav.mutate({ exerciseId: id });
  };

  // Merge CMS overrides into exercise data — CMS imageUrl wins over static default
  const rawExercises = grouped[activeCategory] || [];
  const exercises = useMemo(() => rawExercises.map((ex: Exercise) => {
    const ov = cmsExerciseOverrides[ex.id];
    if (!ov) return ex;
    return {
      ...ex,
      ...(ov.imageUrl   ? { imageUrl:   ov.imageUrl }   : {}),
      ...(ov.youtubeUrl ? { youtubeUrl: ov.youtubeUrl } : {}),
      ...(ov.name       ? { name:       ov.name }       : {}),
      ...(ov.nameAr     ? { nameAr:     ov.nameAr }     : {}),
    };
  }), [rawExercises, cmsExerciseOverrides]);

  return (
    <div
      style={{
        fontFamily: isAr ? "'Segoe UI', Tahoma, Arial, sans-serif" : "'Segoe UI', sans-serif",
        direction: isAr ? "rtl" : "ltr",
        padding: "0 0 80px 0",
      }}
    >
      {/* ── Goal Alert Banner ── */}
      {showGoalAlert && (
        <div
          style={{
            background: "#1B2E5E",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 4px 20px rgba(27,46,94,0.12)",
            marginBottom: 14,
            position: "relative",
          }}
        >
          <button
            onClick={() => setShowGoalAlert(false)}
            style={{
              position: "absolute",
              top: 6,
              insetInlineEnd: 6,
              background: "none",
              border: "none",
              color: "#A8D4E8",
              cursor: "pointer",
              lineHeight: 1,
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label={isAr ? "إخفاء" : "Dismiss"}
          >
            <AppIcons.Close size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#A8D4E8", paddingInlineEnd: 28 }}>
            <AppIcons.Target size={22} />
            <div>
              <div style={{ color: "#A8D4E8", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                {isAr ? "الهدف من البرنامج" : "Program Goal"}
              </div>
              <div style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.6 }}>
                {isAr ? program.goalAr : program.goal}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ color: "#A8D4E8", fontSize: 12 }}>
                  <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Calendar size={14} />{isAr ? program.scheduleAr : program.schedule}</span>
                </span>
                <span style={{ color: "#A8D4E8", fontSize: 12 }}>
                  <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Timer size={14} />{isAr ? program.restBetweenSetsAr : program.restBetweenSets}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tips Toggle ── */}
      <button
        onClick={() => setShowTipsAlert(!showTipsAlert)}
        style={{
          width: "100%",
          background: "#FFFFFF",
          border: "1px solid #D0DFF0",
          borderRadius: showTipsAlert ? "12px 12px 0 0" : 12,
          padding: "0 16px",
          minHeight: 44,
          color: "#1B2E5E",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: showTipsAlert ? 0 : 14,
          direction: isAr ? "rtl" : "ltr",
        }}
        aria-expanded={showTipsAlert}
      >
        <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Info size={14} />{isAr ? "نصائح مهمة للبرنامج" : "Important Program Tips"}</span>
        <span style={{display:'inline-flex'}}>{showTipsAlert ? <AppIcons.ChevronUp size={14} /> : <AppIcons.ChevronDown size={14} />}</span>
      </button>

      {showTipsAlert && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #D0DFF0",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <ul style={{ margin: 0, padding: isAr ? "0 18px 0 0" : "0 0 0 18px", listStyle: "disc" }}>
            {(isAr ? program.tipsAr : program.tips).map((tip, i) => (
              <li key={i} style={{ color: "#3D5A80", fontSize: 13, lineHeight: 1.7 }}>
                {tip}
              </li>
            ))}
          </ul>

          {/* Weekly Plan */}
          <div style={{ marginTop: 12, borderTop: "1px solid #D0DFF0", paddingTop: 12 }}>
            <div style={{ color: "#1B2E5E", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Clipboard size={14} />{isAr ? "التقسيم الأسبوعي المقترح" : "Suggested Weekly Split"}</span>
            </div>
            {(isAr ? program.weeklyPlanAr : program.weeklyPlan).map((day, i) => (
              <div
                key={i}
                style={{
                  color: "#3D5A80",
                  fontSize: 13,
                  lineHeight: 1.8,
                  paddingRight: isAr ? 8 : 0,
                  paddingLeft: isAr ? 0 : 8,
                }}
              >
                • {day}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        {/* Cardio Tab */}
        <button
          onClick={() => { setShowCardioSection(true); setActiveCategory(''); setExpandedExercise(null); }}
          style={{
            flexShrink: 0,
            background: showCardioSection ? "#1B2E5E" : "#FFFFFF",
            border: showCardioSection ? "1px solid #1B2E5E" : "1px solid #D0DFF0",
            borderRadius: 20,
            padding: "0 14px",
            minHeight: 38,
            color: showCardioSection ? "#FFFFFF" : "#1B2E5E",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: showCardioSection ? 700 : 500,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{display:'flex',alignItems:'center',gap:6}}><CardioIcon size={16} />{isAr ? "الإحماء والكارديو" : "Warm-up & Cardio"}</span>
        </button>
        {categories.map((cat) => {
          const ex = grouped[cat][0];
          const label = isAr ? ex.categoryAr : cat;
          const iconKey = CATEGORY_ICONS[cat] || 'chest';
          const isActive = !showCardioSection && activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setShowCardioSection(false);
                setExpandedExercise(null);
              }}
              style={{
                flexShrink: 0,
                background: isActive ? "#1B2E5E" : "#FFFFFF",
                border: isActive ? "1px solid #1B2E5E" : "1px solid #D0DFF0",
                borderRadius: 20,
                padding: "0 12px 0 14px",
                minHeight: 38,
                color: isActive ? "#FFFFFF" : "#1B2E5E",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.2s",
              }}
            >
              <span style={{display:'inline-flex',alignItems:'center'}}>{iconKey === 'cardio' ? <CardioIcon size={16} /> : iconKey === 'legs' ? <LowerBodyIcon size={16} /> : iconKey === 'core' ? <CoreIcon size={16} /> : iconKey === 'back' ? <UpperBodyIcon size={16} /> : iconKey === 'shoulders' ? <UpperBodyIcon size={16} /> : iconKey === 'arms' ? <UpperBodyIcon size={16} /> : iconKey === 'chest' ? <UpperBodyIcon size={16} /> : <FullBodyIcon size={16} />}</span>
              <span>{label}</span>
              <span
                style={{
                  background: isActive ? "#7BB8D4" : "#EAF2F8",
                  color: "#1B2E5E",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {grouped[cat].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Cardio / Warmup Section ── */}
      {showCardioSection && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            background: "#1B2E5E",
            borderRadius: 16, padding: "14px 16px", marginBottom: 14,
          }}>
            <div style={{ color: "#A8D4E8", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><CardioIcon size={16} />{isAr ? "الإحماء والكارديو" : "Warm-up & Cardio"}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 1.6 }}>
              {isAr
                ? "ابدئي دائمًا بـ 5–10 دقائق إحماء قبل التمارين. الكارديو بعد التمرين يزيد من حرق الدهون."
                : "Always start with 5–10 min warm-up. Post-workout cardio maximizes fat burn."}
            </div>
          </div>
          {cardioTemplates.map((machine: CardioTemplate) => (
            <CardioMachineCard key={machine.id} machine={machine} isAr={isAr} />
          ))}
        </div>
      )}

      {/* ── Exercise Cards ── */}
      {!showCardioSection && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exercises.map((ex: Exercise) => {
          const isExpanded = expandedExercise === ex.id;
          const restSec = parseInt(ex.rest);
          return (
            <div
              key={ex.id}
              style={{
                background: "#FFFFFF",
                border: isExpanded ? "1px solid #7BB8D4" : "1px solid transparent",
                boxShadow: "0 4px 20px rgba(27,46,94,0.08)",
                borderRadius: 16,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    direction: isAr ? "rtl" : "ltr",
                    fontFamily: "inherit",
                  }}
                  aria-expanded={isExpanded}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    {/* Sets/Reps badge */}
                    <div
                      style={{
                        background: "#EAF2F8",
                        borderRadius: 10,
                        padding: "6px 10px",
                        textAlign: "center",
                        minWidth: 52,
                      }}
                    >
                      <div style={{ color: "#1B2E5E", fontSize: 16, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{ex.sets}</div>
                      <div style={{ color: "#506A88", fontSize: 11 }}>{isAr ? "جولات" : "sets"}</div>
                    </div>

                    <div style={{ flex: 1, textAlign: isAr ? "right" : "left" }}>
                      <div style={{ color: "#1B2E5E", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                        {isAr ? ex.nameAr : ex.name}
                      </div>
                      <div style={{ color: "#506A88", fontSize: 12, marginTop: 3 }}>
                        {ex.reps} {isAr ? "تكرار" : "reps"} &nbsp;·&nbsp;
                        <span style={{ color: REST_COLOR(restSec), display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <AppIcons.Timer size={12} /> {isAr ? ex.restAr : `${ex.rest}s rest`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ color: "#3D5A80", display: "inline-flex" }}>
                    {isExpanded ? <AppIcons.ChevronUp size={16} /> : <AppIcons.ChevronDown size={16} />}
                  </span>
                </button>

                {/* Heart toggle button */}
                <button
                  onClick={(e) => toggleFav(e, ex.id)}
                  style={{
                    flexShrink: 0,
                    padding: "14px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.25)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  title={isFav(ex.id) ? (isAr ? "إزالة من المفضلة" : "Remove from favorites") : (isAr ? "إضافة للمفضلة" : "Add to favorites")}
                >
                  <HeartIcon filled={isFav(ex.id)} size={18} />
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    borderTop: "1px solid #D0DFF0",
                    direction: isAr ? "rtl" : "ltr",
                  }}
                >
                  {/* Machine Image */}
                  {ex.imageUrl && (
                    <div style={{ marginTop: 14, marginBottom: 14, borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
                      <img
                        src={ex.imageUrl}
                        alt={isAr ? ex.nameAr : ex.name}
                        style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                        loading="lazy"
                      />
                    </div>
                  )}
                  {/* Stats Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginTop: 14,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      { label: isAr ? "الجولات" : "Sets", value: ex.sets, icon: <AppIcons.Repeat size={16} /> },
                      { label: isAr ? "التكرارات" : "Reps", value: ex.reps, icon: <AppIcons.Dumbbell size={16} /> },
                      { label: isAr ? "الراحة" : "Rest", value: isAr ? ex.restAr : `${ex.rest}s`, icon: <AppIcons.Timer size={16} /> },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "#F3F7FB",
                          borderRadius: 12,
                          padding: "10px 8px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ color: "#3D5A80", display: "flex", justifyContent: "center", marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ color: "#1B2E5E", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
                        <div style={{ color: "#3D5A80", fontSize: 11 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {(isAr ? ex.notesAr : ex.notes) && (
                    <div
                      style={{
                        background: "#F3F7FB",
                        color: "#3D5A80",
                        borderRadius: 12,
                        padding: "10px 12px",
                        marginBottom: 12,
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <AppIcons.Pin size={16} />
                      <span style={{ color: "#3D5A80", fontSize: 13, lineHeight: 1.6 }}>
                        {isAr ? ex.notesAr : ex.notes}
                      </span>
                    </div>
                  )}

                  {/* YouTube Button */}
                  <a
                    href={ex.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: "#CC0000",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "11px 16px",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="white">
                      <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6C20 10.2 20 7 20 7s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/>
                    </svg>
                    {isAr ? "شاهد الشرح على يوتيوب" : "Watch Tutorial on YouTube"}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
// ── Cardio Machine Cardd ──────────────────────────────────────────
function CardioMachineCard({ machine, isAr }: { machine: CardioTemplate; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "white",
      borderRadius: 14,
      border: "1.5px solid #D0DFF0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      marginBottom: 12,
      overflow: "hidden",
    }}>
      {/* Machine Image */}
      {machine.image && (
        <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
          <img
            src={machine.image}
            alt={machine.nameEn}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            padding: "20px 14px 10px",
          }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
              {isAr ? machine.nameAr : machine.nameEn}
            </div>
          </div>
        </div>
      )}
      {/* Info Row */}
      <div style={{ padding: "12px 14px" }}>
        {!machine.image && (
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1B2E5E", marginBottom: 8 }}>
            {isAr ? machine.nameAr : machine.nameEn}
          </div>
        )}
        {/* Default Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{
            background: "#EEF4FF", color: "#1B2E5E", borderRadius: 8,
            padding: "4px 10px", fontSize: 11, fontWeight: 600,
          }}>⏱ {machine.defaultDuration} {isAr ? "دقيقة" : "min"}</span>
          <span style={{
            background: "#EEF4FF", color: "#1B2E5E", borderRadius: 8,
            padding: "4px 10px", fontSize: 11, fontWeight: 600,
          }}><span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Lightning size={12} />{isAr ? (machine.speedLabel || 'السرعة') : (machine.speedLabel || 'Speed')}: {machine.defaultSpeed}</span></span>
          <span style={{
            background: "#EEF4FF", color: "#1B2E5E", borderRadius: 8,
            padding: "4px 10px", fontSize: 11, fontWeight: 600,
          }}><span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Mountain size={12} />{isAr ? (machine.inclineLabel || 'الانحدار') : (machine.inclineLabel || 'Incline')}: {machine.defaultIncline}</span></span>
          {machine.showCalories && (
            <span style={{
              background: "#FFF3E0", color: "#E65100", borderRadius: 8,
              padding: "4px 10px", fontSize: 11, fontWeight: 600,
            }}><span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Flame size={12} />{isAr ? "سجّل الكالوريز" : "Log Calories"}</span></span>
          )}
          {machine.showDistance && (
            <span style={{
              background: "#E8F5E9", color: "#2E7D32", borderRadius: 8,
              padding: "4px 10px", fontSize: 11, fontWeight: 600,
            }}><span style={{display:'flex',alignItems:'center',gap:4}}><AppIcons.Road size={12} />{isAr ? "سجّل المسافة" : "Log Distance"}</span></span>
          )}
        </div>
        {/* Tip */}
        <div style={{
          background: "#EAF2F8",
          borderRadius: 10, padding: "10px 12px",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 11, color: "#1B2E5E", fontWeight: 600 }}>
            <span style={{display:'flex',alignItems:'center',gap:6}}><AppIcons.Info size={12} />{isAr ? machine.tip : (machine.tipEn || machine.tip)}</span>
          </div>
        </div>
        {/* Toggle details */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%", padding: "8px", borderRadius: 10,
            border: `1px solid ${expanded ? "#1B2E5E" : "#D0DFF0"}`,
            background: expanded ? "#EEF4FF" : "white",
            color: expanded ? "#1B2E5E" : "#506A88",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {expanded ? (isAr ? "إخفاء التفاصيل" : "Hide Details") : (isAr ? "عرض التفاصيل" : "Show Details")}
        </button>
        {expanded && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#3D5A80", lineHeight: 1.8 }}>
              <div><strong>{isAr ? "المدة الافتراضية:" : "Default Duration:"}</strong> {machine.defaultDuration} {isAr ? "دقيقة" : "min"}</div>
              <div><strong>{isAr ? (machine.speedLabel || 'السرعة:') : (machine.speedLabel || 'Speed:')}:</strong> {machine.defaultSpeed}</div>
              <div><strong>{isAr ? (machine.inclineLabel || 'الانحدار:') : (machine.inclineLabel || 'Incline:')}:</strong> {machine.defaultIncline}</div>
              {machine.showCalories && <div><strong>{isAr ? "الكالوريز:" : "Calories:"}</strong> {isAr ? "سجّل من شاشة الجهاز" : "Record from machine display"}</div>}
              {machine.showDistance && <div><strong>{isAr ? "المسافة:" : "Distance:"}</strong> {isAr ? "سجّل من شاشة الجهاز" : "Record from machine display"}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
